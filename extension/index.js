/**
 * SillyTavern Replicate Extension
 * Provides UI integration for Replicate image generation
 */

import { extension_settings } from '../../extensions.js';
import { eventSource, event_types, getRequestHeaders, saveSettingsDebounced } from '../../../../script.js';
import { SlashCommand } from '../../../slash-commands/SlashCommand.js';
import { SlashCommandParser } from '../../../slash-commands/SlashCommandParser.js';
import { ARGUMENT_TYPE, SlashCommandArgument } from '../../../slash-commands/SlashCommandArgument.js';

const MODULE_KEY = 'replicate';
const PLUGIN_BASE_URL = '/api/plugins/replicate';

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

function ensureState() {
    if (!settings) {
        const existing = extension_settings[MODULE_KEY] ?? {};
        settings = { ...defaultSettings, ...existing };
        extension_settings[MODULE_KEY] = settings;
    }

    return settings;
}

function refreshState() {
    const existing = extension_settings[MODULE_KEY] ?? {};
    settings = { ...defaultSettings, ...existing };
    extension_settings[MODULE_KEY] = settings;
    return settings;
}

function persistState() {
    saveSettingsDebounced();
}

function escapeAttribute(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;');
}

function ensureSettingsContainer() {
    const parent = document.getElementById('extensions_settings2') || document.getElementById('extensions_settings');
    if (!parent) {
        return null;
    }

    let container = document.getElementById('replicate_container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'replicate_container';
        container.classList.add('extension_container');
        parent.appendChild(container);
    }

    return container;
}

function getSettingsHtml(state) {
    return `
        <div class="replicate-settings">
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>Replicate Image Generation</b>
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
    const statusElement = container.querySelector('#replicate_status');
    if (!statusElement) {
        return;
    }

    statusElement.textContent = message;
    statusElement.className = `replicate-status ${type}`;
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

function updateModelSelect(container = ensureSettingsContainer()) {
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

async function loadModels(container = ensureSettingsContainer()) {
    if (!container) {
        return;
    }

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

    return response;
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

                    const html = images
                        .map(url => `<img src="${url}" alt="Generated image" class="replicate-generated-image" />`)
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

function renderSettingsPanel() {
    const container = ensureSettingsContainer();
    if (!container) {
        return;
    }

    const state = ensureState();
    container.innerHTML = getSettingsHtml(state);
    bindUIEvents(container);
    updateModelSelect(container);
}

function runWhenDomReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
        callback();
    }
}

function setupEventHandlers() {
    eventSource.on(event_types.EXTENSION_SETTINGS_LOADED, () => {
        refreshState();
        renderSettingsPanel();
    });

    eventSource.on(event_types.APP_READY, () => {
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
    refreshState();
    registerSlashCommand();
    setupEventHandlers();

    runWhenDomReady(() => {
        renderSettingsPanel();

        const state = ensureState();
        if (!state.apiKey) {
            return;
        }

        void updatePluginConfig()
            .then(() => loadModels().catch(error => console.error('[Replicate Extension] Failed to load models', error)))
            .catch(error => console.error('[Replicate Extension] Failed to update plugin config', error));
    });
}

init();
