/**
 * SillyTavern Replicate Extension
 * Provides UI integration for Replicate image generation
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
import { ToolManager } from '../../../tool-calling.js';

const MODULE_KEY = 'replicate';
const PLUGIN_BASE_URL = '/api/plugins/replicate';
const CONTAINER_ID = 'replicate_container';
const IMAGE_SETTINGS_CONTAINER_ID = 'sd_container';
const FALLBACK_SETTINGS_PARENTS = ['extensions_settings', 'extensions_settings2'];
const MESSAGE_TEMPLATE = 'Generated image with Replicate: {{prompt}}';

const defaultSettings = {
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
let pendingStatus = null;
let initialized = false;
let toolRegistered = false;

function ensureState() {
    if (!settings) {
        const root = extension_settings.sd ?? (extension_settings.sd = {});
        const legacy = extension_settings[MODULE_KEY];
        const existing = root.replicate ?? legacy ?? {};
        settings = { ...defaultSettings, ...existing };
        root.replicate = settings;

        if (legacy) {
            delete extension_settings[MODULE_KEY];
        }
    }

    return settings;
}

function refreshState() {
    const root = extension_settings.sd ?? (extension_settings.sd = {});
    const legacy = extension_settings[MODULE_KEY];
    const existing = root.replicate ?? legacy ?? {};
    settings = { ...defaultSettings, ...existing };
    root.replicate = settings;

    if (legacy) {
        delete extension_settings[MODULE_KEY];
    }

    return settings;
}

function persistState() {
    const root = extension_settings.sd ?? (extension_settings.sd = {});
    root.replicate = { ...settings };
    saveSettingsDebounced();
}

function escapeAttribute(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;');
}

function getSettingsContainer() {
    return document.getElementById(CONTAINER_ID);
}

function findSettingsParent() {
    const imageSettings = document.getElementById(IMAGE_SETTINGS_CONTAINER_ID);
    if (imageSettings) {
        return imageSettings;
    }

    for (const fallbackId of FALLBACK_SETTINGS_PARENTS) {
        const fallback = document.getElementById(fallbackId);
        if (fallback) {
            return fallback;
        }
    }

    return null;
}

function mountSettingsContainer() {
    const parent = findSettingsParent();
    if (!parent) {
        return null;
    }

    const container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.classList.add('extension_container');
    if (parent.id === IMAGE_SETTINGS_CONTAINER_ID && parent.firstChild) {
        parent.insertBefore(container, parent.firstChild);
    } else {
        parent.appendChild(container);
    }
    return container;
}

function getSettingsHtml(state) {
    return `
        <div class="replicate-settings">
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>Replicate Image Provider</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content replicate-settings-content">
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
                        <span>Width</span>
                        <input id="replicate_width" class="text_pole" type="number" min="256" max="2048" step="64" value="${escapeAttribute(state.width)}" />
                    </label>

                    <label for="replicate_height">
                        <span>Height</span>
                        <input id="replicate_height" class="text_pole" type="number" min="256" max="2048" step="64" value="${escapeAttribute(state.height)}" />
                    </label>

                    <label for="replicate_num_outputs">
                        <span>Number of Images</span>
                        <input id="replicate_num_outputs" class="text_pole" type="number" min="1" max="4" value="${escapeAttribute(state.num_outputs)}" />
                    </label>

                    <label for="replicate_guidance_scale">
                        <span>Guidance Scale</span>
                        <input id="replicate_guidance_scale" class="text_pole" type="number" min="1" max="20" step="0.5" value="${escapeAttribute(state.guidance_scale)}" />
                        <small>Higher values follow the prompt more closely</small>
                    </label>

                    <label for="replicate_num_inference_steps">
                        <span>Inference Steps</span>
                        <input id="replicate_num_inference_steps" class="text_pole" type="number" min="1" max="100" value="${escapeAttribute(state.num_inference_steps)}" />
                        <small>More steps = higher quality but slower</small>
                    </label>

                    <div class="replicate-actions">
                        <button id="replicate_test_connection" class="menu_button">
                            <i class="fa-solid fa-plug"></i> Test Connection
                        </button>
                        <button id="replicate_save_settings" class="menu_button">
                            <i class="fa-solid fa-save"></i> Save Settings
                        </button>
                    </div>

                    <div id="replicate_status" class="replicate-status"></div>
                </div>
            </div>
        </div>
    `;
}

function showStatus(container, message, type = 'info') {
    if (!container) {
        pendingStatus = { message, type };
        return;
    }

    const statusElement = container.querySelector('#replicate_status');
    if (!statusElement) {
        pendingStatus = { message, type };
        return;
    }

    statusElement.textContent = message;
    statusElement.className = `replicate-status ${type}`;
    pendingStatus = null;
}

async function pluginRequest(endpoint, options = {}) {
    const response = await fetch(`${PLUGIN_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...getRequestHeaders(),
            ...(options.headers ?? {}),
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

async function checkPluginHealth() {
    const health = await pluginRequest('/health');
    console.log('[Replicate Extension] Plugin health:', health);
    return health;
}

async function updatePluginConfig() {
    const state = ensureState();
    await pluginRequest('/config', {
        method: 'POST',
        body: JSON.stringify({
            apiKey: state.apiKey ?? '',
            defaultModel: state.selectedModel ?? '',
        }),
    });
}

// Normalizes the plugin payload so the existing SillyTavern message helpers can
// reuse it without special-casing third-party image providers.
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
        dataUri = base64.startsWith('data:')
            ? base64
            : `data:${mimeType ?? 'image/png'};base64,${base64}`;
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

// Reuse the core SillyTavern chat workflow so Replicate images behave exactly
// like the built-in providers (swipes, inline previews, saved prompts, etc.).
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

function updateModelSelect(container = getSettingsContainer()) {
    if (!container) {
        return;
    }

    const select = container.querySelector('#replicate_model_select');
    if (!select) {
        return;
    }

    const state = ensureState();
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

async function loadModels(container = getSettingsContainer()) {
    try {
        const response = await pluginRequest('/models');
        availableModels = Array.isArray(response?.models) ? response.models : [];
        updateModelSelect(container ?? getSettingsContainer());
        if (availableModels.length) {
            showStatus(container ?? getSettingsContainer(), `Loaded ${availableModels.length} model(s).`, 'success');
        } else {
            showStatus(container ?? getSettingsContainer(), 'No models returned by the Replicate plugin.', 'error');
        }
    } catch (error) {
        console.error('[Replicate Extension] Failed to load models:', error);
        showStatus(container ?? getSettingsContainer(), `Failed to load models: ${error.message}`, 'error');
    }
}

function bindUIEvents(container) {
    const state = ensureState();

    const apiKeyInput = container.querySelector('#replicate_api_key');
    if (apiKeyInput) {
        apiKeyInput.value = state.apiKey;
        apiKeyInput.addEventListener('input', event => {
            state.apiKey = event.target.value.trim();
        });
    }

    const modelSelect = container.querySelector('#replicate_model_select');
    if (modelSelect) {
        modelSelect.addEventListener('change', event => {
            state.selectedModel = event.target.value;
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
                const health = await checkPluginHealth();
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
                persistState();
                showStatus(container, 'Settings saved successfully!', 'success');
            } catch (error) {
                console.error('[Replicate Extension] Failed to save settings:', error);
                showStatus(container, `Failed to save settings: ${error.message}`, 'error');
            }
        });
    }
}

async function generateImage(prompt) {
    const trimmedPrompt = (prompt ?? '').trim();
    if (!trimmedPrompt) {
        throw new Error('Prompt is required.');
    }

    const state = ensureState();
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

// Register Replicate as the "GenerateImage" function-tool so SillyTavern's
// global image-generation toggle continues to work even when the default
// provider is disabled.
function ensureImageToolRegistered(force = false) {
    if (toolRegistered && !force) {
        return;
    }

    try {
        ToolManager.registerFunctionTool({
            name: 'GenerateImage',
            displayName: 'Generate Image (Replicate)',
            description: [
                'Generate an image from a text prompt using Replicate.',
                'Use when a user asks to imagine, draw, or render a visual.',
            ].join(' '),
            parameters: Object.freeze({
                $schema: 'http://json-schema.org/draft-04/schema#',
                type: 'object',
                properties: {
                    prompt: {
                        type: 'string',
                        description: 'The text prompt to turn into an image.',
                    },
                },
                required: ['prompt'],
            }),
            action: async args => {
                const prompt = String(args?.prompt ?? '').trim();
                if (!prompt) {
                    throw new Error('Prompt is required for Replicate image generation.');
                }

                const result = await generateImage(prompt);
                const images = Array.isArray(result?.images) ? result.images : [];
                if (!images.length) {
                    throw new Error('Replicate did not return any images.');
                }

                await postImagesToChat(prompt, images, 'tool');
                return `Generated ${images.length} Replicate image(s).`;
            },
            formatMessage: () => 'Generating an image with Replicate…',
        });
        toolRegistered = true;
    } catch (error) {
        toolRegistered = false;
        console.error('[Replicate Extension] Failed to register image generation tool:', error);
    }
}

function registerSlashCommand() {
    if (slashCommandRegistered) {
        return;
    }

    slashCommandRegistered = true;

    SlashCommandParser.addCommandObject(
        SlashCommand.fromProps({
            name: MODULE_KEY,
            callback: async (_args, prompt) => {
                try {
                    const result = await generateImage(prompt);
                    const images = Array.isArray(result?.images) ? result.images : [];

                    if (!images.length) {
                        return 'Image generation completed but no images were returned.';
                    }

                    await postImagesToChat(prompt, images, 'command');

                    const html = images
                        .map(image => `<img src="${image.dataUri}" alt="Generated image" class="replicate-generated-image" />`)
                        .join('');

                    return `Generated ${images.length} image(s):\n${html}`;
                } catch (error) {
                    console.error('[Replicate Extension] Image generation failed:', error);
                    return `Error generating image: ${error.message}`;
                }
            },
            returns: 'generated image(s)',
            namedArgumentList: [],
            unnamedArgumentList: [
                SlashCommandArgument.fromProps({
                    description: 'Prompt for image generation',
                    typeList: [ARGUMENT_TYPE.STRING],
                    isRequired: true,
                }),
            ],
            helpString: `
                <div>Generate images using Replicate models.</div>
                <div><strong>Example:</strong></div>
                <div>
                    <pre><code class="language-stscript">/replicate a beautiful sunset over mountains</code></pre>
                </div>
            `,
        }),
    );

    console.log('[Replicate Extension] Slash command registered: /replicate');
}

function renderSettingsInto(container) {
    if (!container) {
        return;
    }

    const state = ensureState();
    container.innerHTML = getSettingsHtml(state);
    bindUIEvents(container);
    updateModelSelect(container);

    if (pendingStatus) {
        showStatus(container, pendingStatus.message, pendingStatus.type);
    }
}

function hydrateSettings() {
    let container = getSettingsContainer();
    const preferredParent = findSettingsParent();

    if (container && preferredParent && container.parentElement !== preferredParent && preferredParent.id === IMAGE_SETTINGS_CONTAINER_ID) {
        if (preferredParent.firstChild) {
            preferredParent.insertBefore(container, preferredParent.firstChild);
        } else {
            preferredParent.appendChild(container);
        }
    }

    if (!container) {
        container = mountSettingsContainer();
    }

    if (!container) {
        return;
    }

    renderSettingsInto(container);
}

function whenDomReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
        callback();
    }
}

function setupEventHandlers() {
    const reapplyToolIntegration = () => ensureImageToolRegistered(true);

    eventSource.on(event_types.EXTENSION_SETTINGS_LOADED, () => {
        refreshState();
        hydrateSettings();
        ensureImageToolRegistered(true);
    });

    eventSource.on(event_types.SETTINGS_LOADED, reapplyToolIntegration);
    eventSource.on(event_types.SETTINGS_UPDATED, reapplyToolIntegration);

    eventSource.on(event_types.APP_READY, () => {
        ensureImageToolRegistered();
        const state = ensureState();
        if (!state.apiKey) {
            return;
        }

        void updatePluginConfig()
            .then(() => loadModels().catch(error => console.error('[Replicate Extension] Failed to load models', error)))
            .catch(error => console.error('[Replicate Extension] Failed to update plugin config', error));
    });
}

function init() {
    if (initialized) {
        return;
    }

    initialized = true;
    refreshState();
    registerSlashCommand();
    ensureImageToolRegistered(true);
    setupEventHandlers();

    whenDomReady(() => {
        hydrateSettings();

        const state = ensureState();
        if (!state.apiKey) {
            return;
        }

        void updatePluginConfig()
            .then(() => loadModels().catch(error => console.error('[Replicate Extension] Failed to load models', error)))
            .catch(error => console.error('[Replicate Extension] Failed to update plugin config', error));
    });
}

function getSettingsLegacy() {
    const state = refreshState();
    whenDomReady(() => hydrateSettings());
    return getSettingsHtml(state);
}

init();

globalThis.replicate_extension = {
    init,
    getSettings: getSettingsLegacy,
};
