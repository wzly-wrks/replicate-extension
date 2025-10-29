/**
 * SillyTavern Replicate Integration
 * Bridges the Replicate plugin into SillyTavern's primary image generation UI
 */

import { extension_settings, getContext } from '../../../extensions.js';
import { eventSource, event_types } from '../../../events.js';
import {
    addOneMessage,
    getMessageTimeStamp,
    getRequestHeaders,
    saveSettingsDebounced,
    substituteParamsExtended,
    systemUserName,
} from '../../../../script.js';
import { SlashCommand } from '../../../slash-commands/SlashCommand.js';
import { SlashCommandParser } from '../../../slash-commands/SlashCommandParser.js';
import { ARGUMENT_TYPE, SlashCommandArgument } from '../../../slash-commands/SlashCommandArgument.js';

const MODULE_KEY = 'replicate';
const PLUGIN_BASE_URL = '/api/plugins/replicate';
const CONTAINER_ID = 'replicate_settings_panel';
const STATUS_ID = 'replicate_status';
const OPENAI_SOURCE_SELECTOR = '.sd_settings [data-sd-source~="openai"]';
const MESSAGE_TEMPLATE = 'Generated image with Replicate: {{prompt}}';

const defaultSettings = {
    enabled: false,
    apiKey: '',
    selectedModel: 'black-forest-labs/flux-schnell',
    width: 1024,
    height: 1024,
    num_outputs: 1,
    guidance_scale: 7.5,
    num_inference_steps: 50,
};

let settings;
let availableModels = [];
let slashCommandRegistered = false;
let fetchPatched = false;
let pendingStatus = null;

function ensureSdState() {
    if (!extension_settings.sd) {
        extension_settings.sd = {};
    }

    if (!extension_settings.sd[MODULE_KEY]) {
        extension_settings.sd[MODULE_KEY] = { ...defaultSettings };
    }

    settings = extension_settings.sd[MODULE_KEY];
    for (const [key, value] of Object.entries(defaultSettings)) {
        if (settings[key] === undefined) {
            settings[key] = value;
        }
    }

    return settings;
}

function refreshState() {
    const base = extension_settings.sd?.[MODULE_KEY] ?? {};
    settings = { ...defaultSettings, ...base };
    if (!extension_settings.sd) {
        extension_settings.sd = {};
    }
    extension_settings.sd[MODULE_KEY] = settings;
    return settings;
}

function escapeAttribute(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;');
}

function pluginRequest(endpoint, options = {}) {
    return fetch(`${PLUGIN_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...getRequestHeaders(),
            ...(options.headers ?? {}),
        },
    }).then(async response => {
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP ${response.status}`);
        }

        if (response.status === 204) {
            return null;
        }

        return response.json();
    });
}

async function updatePluginConfig() {
    const state = ensureSdState();
    await pluginRequest('/config', {
        method: 'POST',
        body: JSON.stringify({
            apiKey: state.apiKey ?? '',
            defaultModel: state.selectedModel ?? '',
        }),
    });
}

async function loadModels(container) {
    try {
        const response = await pluginRequest('/models');
        availableModels = Array.isArray(response?.models) ? response.models : [];
        updateModelSelect(container);
        if (availableModels.length) {
            showStatus(container, `Loaded ${availableModels.length} model(s).`, 'success');
        } else {
            showStatus(container, 'No models returned by the Replicate plugin.', 'error');
        }
    } catch (error) {
        console.error('[Replicate Extension] Failed to load models:', error);
        showStatus(container, `Failed to load models: ${error.message}`, 'error');
    }
}

function normalizePluginImage(image) {
    if (!image || typeof image !== 'object') {
        return null;
    }

    const url = typeof image.url === 'string' ? image.url : null;
    const base64 = typeof image.base64 === 'string' ? image.base64.trim() : '';
    const format = typeof image.format === 'string' ? image.format : null;
    const mimeType = typeof image.mimeType === 'string' ? image.mimeType : (format ? `image/${format}` : null);

    let dataUri = null;
    if (base64) {
        dataUri = base64.startsWith('data:') ? base64 : `data:${mimeType ?? 'image/png'};base64,${base64}`;
    } else if (url) {
        dataUri = url;
    }

    if (!dataUri) {
        return null;
    }

    return {
        url,
        base64: base64 || null,
        format: format ?? (mimeType?.split('/')?.[1] ?? null),
        mimeType: mimeType ?? null,
        dataUri,
    };
}

async function postImagesToChat(prompt, images, initiator = 'command') {
    const usableImages = Array.isArray(images) ? images.filter(Boolean) : [];
    if (!usableImages.length) {
        throw new Error('Replicate did not return any images.');
    }

    const dataUris = usableImages.map(image => image.dataUri).filter(Boolean);
    if (!dataUris.length) {
        throw new Error('Replicate images were missing data payloads.');
    }

    const context = getContext();
    if (!context) {
        throw new Error('Chat context is not available for Replicate images.');
    }

    const author = context.groupId ? systemUserName : context.name2;
    const message = {
        name: author ?? 'Replicate',
        is_user: false,
        is_system: false,
        send_date: getMessageTimeStamp(),
        mes: substituteParamsExtended(MESSAGE_TEMPLATE, { prompt }),
        extra: {
            image: dataUris[0],
            image_swipes: dataUris,
            inline_image: false,
            title: prompt,
            generator: MODULE_KEY,
            replicate: {
                urls: usableImages.map(image => image.url).filter(Boolean),
            },
            initiator,
            generationType: initiator,
        },
    };

    context.chat.push(message);
    const messageId = context.chat.length - 1;
    await eventSource.emit(event_types.MESSAGE_RECEIVED, messageId, MODULE_KEY);

    if (typeof context.addOneMessage === 'function') {
        context.addOneMessage(message);
    } else {
        addOneMessage(message);
    }

    await eventSource.emit(event_types.CHARACTER_MESSAGE_RENDERED, messageId, MODULE_KEY);
    await context.saveChat();

    return dataUris;
}

function getSettingsContainer() {
    const openAiPanel = document.querySelector(OPENAI_SOURCE_SELECTOR);
    if (!openAiPanel) {
        return null;
    }

    let container = openAiPanel.querySelector(`#${CONTAINER_ID}`);
    if (!container) {
        container = document.createElement('div');
        container.id = CONTAINER_ID;
        container.classList.add('replicate-settings');
        openAiPanel.appendChild(container);
    }

    return container;
}

function showStatus(container, message, type = 'info') {
    const target = container?.querySelector(`#${STATUS_ID}`);
    if (!target) {
        pendingStatus = { message, type };
        return;
    }

    target.textContent = message;
    target.className = `replicate-status ${type}`;
    pendingStatus = null;
}

function getSettingsHtml(state) {
    return `
        <div class="inline-subsection">
            <label for="replicate_enabled" class="checkbox_label">
                <input id="replicate_enabled" type="checkbox" ${state.enabled ? 'checked' : ''} />
                <span>Use Replicate for OpenAI image generation</span>
            </label>
        </div>
        <div class="replicate-config ${state.enabled ? '' : 'hidden'}">
            <label for="replicate_api_key">
                <span>Replicate API Key</span>
                <input id="replicate_api_key" class="text_pole" type="password" placeholder="Enter your Replicate API token" value="${escapeAttribute(state.apiKey)}" />
                <small>Get your API key from <a href="https://replicate.com/account/api-tokens" target="_blank" rel="noopener noreferrer">replicate.com/account/api-tokens</a></small>
            </label>
            <label for="replicate_model_select">
                <span>Model</span>
                <select id="replicate_model_select" class="text_pole">
                    <option value="">Loading models...</option>
                </select>
            </label>
            <label for="replicate_width">
                <span>Width override</span>
                <input id="replicate_width" class="text_pole" type="number" min="256" max="2048" step="64" value="${escapeAttribute(state.width)}" />
            </label>
            <label for="replicate_height">
                <span>Height override</span>
                <input id="replicate_height" class="text_pole" type="number" min="256" max="2048" step="64" value="${escapeAttribute(state.height)}" />
            </label>
            <label for="replicate_num_outputs">
                <span>Number of images</span>
                <input id="replicate_num_outputs" class="text_pole" type="number" min="1" max="4" value="${escapeAttribute(state.num_outputs)}" />
            </label>
            <label for="replicate_guidance_scale">
                <span>Guidance scale</span>
                <input id="replicate_guidance_scale" class="text_pole" type="number" min="1" max="20" step="0.5" value="${escapeAttribute(state.guidance_scale)}" />
            </label>
            <label for="replicate_num_inference_steps">
                <span>Inference steps</span>
                <input id="replicate_num_inference_steps" class="text_pole" type="number" min="1" max="100" value="${escapeAttribute(state.num_inference_steps)}" />
            </label>
            <div class="replicate-actions">
                <button id="replicate_test_connection" class="menu_button">
                    <i class="fa-solid fa-plug"></i> Test Connection
                </button>
                <button id="replicate_save_settings" class="menu_button">
                    <i class="fa-solid fa-save"></i> Save Settings
                </button>
            </div>
            <div id="${STATUS_ID}" class="replicate-status"></div>
        </div>
    `;
}

function updateModelSelect(container = getSettingsContainer()) {
    if (!container) {
        return;
    }

    const select = container.querySelector('#replicate_model_select');
    if (!select) {
        return;
    }

    const state = ensureSdState();
    select.innerHTML = '';

    if (!availableModels.length) {
        const option = document.createElement('option');
        option.value = state.selectedModel || '';
        option.textContent = availableModels.length === 0 ? 'No models loaded' : state.selectedModel;
        option.selected = true;
        select.appendChild(option);
        select.disabled = availableModels.length === 0;
        return;
    }

    select.disabled = false;
    let hasSelected = false;

    for (const model of availableModels) {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = model.description ? `${model.name} – ${model.description}` : model.name;
        if (model.id === state.selectedModel) {
            option.selected = true;
            hasSelected = true;
        }
        select.appendChild(option);
    }

    if (!hasSelected && state.selectedModel) {
        const option = document.createElement('option');
        option.value = state.selectedModel;
        option.textContent = state.selectedModel;
        option.selected = true;
        option.dataset.unknown = 'true';
        select.appendChild(option);
    }
}

function bindUIEvents(container) {
    const state = ensureSdState();
    const enabledToggle = container.querySelector('#replicate_enabled');
    const configBlock = container.querySelector('.replicate-config');

    if (enabledToggle && configBlock) {
        enabledToggle.addEventListener('change', event => {
            state.enabled = Boolean(event.target.checked);
            configBlock.classList.toggle('hidden', !state.enabled);
            saveSettingsDebounced();
            if (state.enabled && state.apiKey) {
                updatePluginConfig().catch(error => console.error('[Replicate Extension] Failed to update plugin config', error));
            }
        });
    }

    const apiKeyInput = container.querySelector('#replicate_api_key');
    if (apiKeyInput) {
        apiKeyInput.value = state.apiKey;
        apiKeyInput.addEventListener('input', event => {
            state.apiKey = event.target.value.trim();
            saveSettingsDebounced();
        });
    }

    const modelSelect = container.querySelector('#replicate_model_select');
    if (modelSelect) {
        modelSelect.addEventListener('change', event => {
            state.selectedModel = event.target.value;
            saveSettingsDebounced();
        });
    }

    const attachNumberInput = (selector, property, parser = parseInt) => {
        const input = container.querySelector(selector);
        if (!input) {
            return;
        }

        input.value = state[property];
        input.addEventListener('change', event => {
            const parsed = parser(event.target.value);
            if (Number.isNaN(parsed)) {
                event.target.value = state[property];
                return;
            }
            state[property] = parsed;
            saveSettingsDebounced();
        });
    };

    attachNumberInput('#replicate_width', 'width');
    attachNumberInput('#replicate_height', 'height');
    attachNumberInput('#replicate_num_outputs', 'num_outputs');
    attachNumberInput('#replicate_guidance_scale', 'guidance_scale', value => parseFloat(value));
    attachNumberInput('#replicate_num_inference_steps', 'num_inference_steps');

    const testButton = container.querySelector('#replicate_test_connection');
    if (testButton) {
        testButton.addEventListener('click', async event => {
            event.preventDefault();
            event.stopPropagation();
            showStatus(container, 'Testing connection...', 'info');

            try {
                await updatePluginConfig();
                const health = await pluginRequest('/health');
                if (health?.configured) {
                    showStatus(container, 'Connection successful!', 'success');
                    await loadModels(container);
                } else {
                    showStatus(container, 'API key not configured on the server.', 'error');
                }
            } catch (error) {
                console.error('[Replicate Extension] Connection test failed:', error);
                showStatus(container, `Connection failed: ${error.message}`, 'error');
            }
        });
    }

    const saveButton = container.querySelector('#replicate_save_settings');
    if (saveButton) {
        saveButton.addEventListener('click', async event => {
            event.preventDefault();
            event.stopPropagation();
            showStatus(container, 'Saving settings...', 'info');

            try {
                await updatePluginConfig();
                saveSettingsDebounced();
                showStatus(container, 'Settings saved successfully!', 'success');
            } catch (error) {
                console.error('[Replicate Extension] Failed to save settings:', error);
                showStatus(container, `Failed to save settings: ${error.message}`, 'error');
            }
        });
    }
}

function renderSettings(container) {
    if (!container) {
        return;
    }

    const state = ensureSdState();
    container.innerHTML = getSettingsHtml(state);
    bindUIEvents(container);
    updateModelSelect(container);

    if (pendingStatus) {
        showStatus(container, pendingStatus.message, pendingStatus.type);
    }

    if (state.enabled && state.apiKey) {
        loadModels(container).catch(error => console.error('[Replicate Extension] Failed to load models:', error));
    }
}

function hydrateSettings() {
    const container = getSettingsContainer();
    if (!container) {
        return;
    }

    renderSettings(container);
}

function whenDomReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
        callback();
    }
}

async function generateImage(prompt) {
    const trimmedPrompt = (prompt ?? '').trim();
    if (!trimmedPrompt) {
        throw new Error('Prompt is required.');
    }

    const state = ensureSdState();
    if (!state.apiKey) {
        throw new Error('Replicate API key is not configured.');
    }

    await updatePluginConfig();

    const response = await pluginRequest('/generate', {
        method: 'POST',
        body: JSON.stringify({
            prompt: trimmedPrompt,
            model: state.selectedModel,
            width: state.width,
            height: state.height,
            num_outputs: state.num_outputs,
            guidance_scale: state.guidance_scale,
            num_inference_steps: state.num_inference_steps,
        }),
    });

    const images = Array.isArray(response?.images)
        ? response.images.map(normalizePluginImage).filter(Boolean)
        : [];

    return {
        ...response,
        images,
    };
}

function ensureSlashCommand() {
    if (slashCommandRegistered) {
        return;
    }

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'replicate',
        description: 'Generate an image using Replicate and post it to the chat.',
        args: [],
        unnamedArgumentList: [
            SlashCommandArgument.fromProps({
                description: 'Prompt for image generation',
                typeList: [ARGUMENT_TYPE.STRING],
                isRequired: true,
            }),
        ],
        callback: async (_args, prompt) => {
            const result = await generateImage(prompt);
            const images = Array.isArray(result?.images) ? result.images : [];
            if (!images.length) {
                throw new Error('Replicate did not return any images.');
            }

            await postImagesToChat(prompt, images, 'command');
            return `Generated ${images.length} Replicate image(s).`;
        },
    }));

    slashCommandRegistered = true;
}

function isReplicateOverrideActive() {
    const state = ensureSdState();
    return state.enabled && extension_settings.sd?.source === 'openai';
}

function matchesOpenAiEndpoint(input) {
    try {
        const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
        const normalized = new URL(url, window.location.origin);
        return normalized.pathname === '/api/openai/generate-image';
    } catch {
        return false;
    }
}

function patchFetch() {
    if (fetchPatched || typeof globalThis.fetch !== 'function') {
        return;
    }

    const originalFetch = globalThis.fetch.bind(globalThis);
    globalThis.fetch = async function patchedFetch(input, init = {}) {
        if (isReplicateOverrideActive() && matchesOpenAiEndpoint(input)) {
            try {
                const bodyText = typeof init.body === 'string'
                    ? init.body
                    : init.body instanceof Blob || init.body instanceof FormData
                        ? ''
                        : init.body
                            ? String(init.body)
                            : input instanceof Request
                                ? await input.clone().text()
                                : '';
                let payload = {};
                if (bodyText) {
                    try {
                        payload = JSON.parse(bodyText);
                    } catch (error) {
                        console.warn('[Replicate Extension] Failed to parse OpenAI override payload:', error);
                    }
                }
                const prompt = String(payload?.prompt ?? '').trim();
                if (!prompt) {
                    throw new Error('Prompt is required.');
                }

                const state = ensureSdState();
                if (!state.apiKey) {
                    throw new Error('Replicate API key is not configured.');
                }

                await updatePluginConfig();
                const response = await pluginRequest('/generate', {
                    method: 'POST',
                    body: JSON.stringify({
                        prompt,
                        model: state.selectedModel,
                        width: state.width,
                        height: state.height,
                        num_outputs: state.num_outputs,
                        guidance_scale: state.guidance_scale,
                        num_inference_steps: state.num_inference_steps,
                    }),
                });

                const images = Array.isArray(response?.images)
                    ? response.images.map(normalizePluginImage).filter(Boolean)
                    : [];

                if (!images.length) {
                    throw new Error('Replicate did not return any images.');
                }

                const base64 = images[0].base64 ?? images[0].dataUri?.split(',')[1] ?? '';
                const body = JSON.stringify({ data: [{ b64_json: base64 }] });
                return new Response(body, {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            } catch (error) {
                console.error('[Replicate Extension] OpenAI override failed:', error);
                const body = JSON.stringify({ error: error.message });
                return new Response(body, {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }

        return originalFetch(input, init);
    };

    fetchPatched = true;
}

function setupEventHandlers() {
    eventSource.on(event_types.EXTENSION_SETTINGS_LOADED, () => {
        refreshState();
        whenDomReady(() => hydrateSettings());
    });

    eventSource.on(event_types.APP_READY, () => {
        ensureSdState();
        patchFetch();
        whenDomReady(() => hydrateSettings());
    });
}

function init() {
    ensureSdState();
    ensureSlashCommand();
    patchFetch();
    setupEventHandlers();

    whenDomReady(() => {
        hydrateSettings();
    });
}

init();

globalThis.replicate_extension = {
    init,
    getSettings: () => getSettingsHtml(ensureSdState()),
};
