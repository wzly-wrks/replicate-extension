/**
 * SillyTavern Replicate Extension
 * Provides UI integration for Replicate image generation
 */

(function() {
    'use strict';

    const MODULE_NAME = 'replicate';
    const PLUGIN_BASE_URL = '/api/plugins/replicate';

    // Extension state
    let extensionSettings = {
        apiKey: '',
        selectedModel: 'black-forest-labs/flux-schnell',
        width: 1024,
        height: 1024,
        num_outputs: 1,
        guidance_scale: 7.5,
        num_inference_steps: 50
    };

    let availableModels = [];

    /**
     * Load extension settings
     */
    function loadSettings() {
        const context = SillyTavern.getContext();
        if (context.extensionSettings[MODULE_NAME]) {
            Object.assign(extensionSettings, context.extensionSettings[MODULE_NAME]);
        } else {
            context.extensionSettings[MODULE_NAME] = extensionSettings;
        }
        console.log('[Replicate Extension] Settings loaded:', extensionSettings);
    }

    /**
     * Save extension settings
     */
    function saveSettings() {
        const context = SillyTavern.getContext();
        context.extensionSettings[MODULE_NAME] = extensionSettings;
        context.saveSettingsDebounced();
        console.log('[Replicate Extension] Settings saved');
    }

    /**
     * Make request to plugin endpoint
     */
    async function pluginRequest(endpoint, options = {}) {
        const url = `${PLUGIN_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Plugin request failed: ${response.status} - ${error}`);
        }

        return response.json();
    }

    /**
     * Check plugin health and configuration
     */
    async function checkPluginHealth() {
        try {
            const health = await pluginRequest('/health');
            console.log('[Replicate Extension] Plugin health:', health);
            return health;
        } catch (error) {
            console.error('[Replicate Extension] Plugin health check failed:', error);
            return null;
        }
    }

    /**
     * Update plugin configuration
     */
    async function updatePluginConfig() {
        try {
            await pluginRequest('/config', {
                method: 'POST',
                body: JSON.stringify({
                    apiKey: extensionSettings.apiKey,
                    defaultModel: extensionSettings.selectedModel
                })
            });
            console.log('[Replicate Extension] Plugin configuration updated');
        } catch (error) {
            console.error('[Replicate Extension] Failed to update plugin config:', error);
            throw error;
        }
    }

    /**
     * Load available models
     */
    async function loadModels() {
        try {
            const response = await pluginRequest('/models');
            availableModels = response.models || [];
            console.log('[Replicate Extension] Loaded models:', availableModels);
            updateModelSelect();
        } catch (error) {
            console.error('[Replicate Extension] Failed to load models:', error);
        }
    }

    /**
     * Update model select dropdown
     */
    function updateModelSelect() {
        const select = document.getElementById('replicate_model_select');
        if (!select) return;

        select.innerHTML = '';
        availableModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = `${model.name} - ${model.description}`;
            if (model.id === extensionSettings.selectedModel) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }

    /**
     * Generate image using Replicate
     */
    async function generateImage(prompt) {
        try {
            console.log('[Replicate Extension] Generating image with prompt:', prompt);

            const response = await pluginRequest('/generate', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: prompt,
                    model: extensionSettings.selectedModel,
                    width: extensionSettings.width,
                    height: extensionSettings.height,
                    num_outputs: extensionSettings.num_outputs,
                    guidance_scale: extensionSettings.guidance_scale,
                    num_inference_steps: extensionSettings.num_inference_steps
                })
            });

            console.log('[Replicate Extension] Image generated:', response);
            return response;
        } catch (error) {
            console.error('[Replicate Extension] Image generation failed:', error);
            throw error;
        }
    }

    /**
     * Show status message
     */
    function showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('replicate_status');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.className = `replicate-status ${type}`;
        }
    }

    /**
     * Create settings HTML
     */
    function getSettingsHtml() {
        return `
            <div class="replicate-settings">
                <h3>Replicate Image Generation</h3>
                
                <div class="replicate-settings-content">
                    <label for="replicate_api_key">
                        <span>Replicate API Key</span>
                        <input id="replicate_api_key" class="text_pole" type="password" 
                               placeholder="Enter your Replicate API token" />
                        <small>Get your API key from <a href="https://replicate.com/account/api-tokens" target="_blank">replicate.com/account/api-tokens</a></small>
                    </label>

                    <label for="replicate_model_select">
                        <span>Model</span>
                        <select id="replicate_model_select" class="text_pole">
                            <option value="">Loading models...</option>
                        </select>
                    </label>

                    <label for="replicate_width">
                        <span>Width</span>
                        <input id="replicate_width" class="text_pole" type="number" 
                               min="256" max="2048" step="64" />
                    </label>

                    <label for="replicate_height">
                        <span>Height</span>
                        <input id="replicate_height" class="text_pole" type="number" 
                               min="256" max="2048" step="64" />
                    </label>

                    <label for="replicate_num_outputs">
                        <span>Number of Images</span>
                        <input id="replicate_num_outputs" class="text_pole" type="number" 
                               min="1" max="4" />
                    </label>

                    <label for="replicate_guidance_scale">
                        <span>Guidance Scale</span>
                        <input id="replicate_guidance_scale" class="text_pole" type="number" 
                               min="1" max="20" step="0.5" />
                        <small>Higher values follow the prompt more closely</small>
                    </label>

                    <label for="replicate_num_inference_steps">
                        <span>Inference Steps</span>
                        <input id="replicate_num_inference_steps" class="text_pole" type="number" 
                               min="1" max="100" />
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
        `;
    }

    /**
     * Bind UI events
     */
    function bindUIEvents() {
        // API Key input
        const apiKeyInput = document.getElementById('replicate_api_key');
        if (apiKeyInput) {
            apiKeyInput.value = extensionSettings.apiKey;
            apiKeyInput.addEventListener('input', (e) => {
                extensionSettings.apiKey = e.target.value;
            });
        }

        // Model select
        const modelSelect = document.getElementById('replicate_model_select');
        if (modelSelect) {
            modelSelect.addEventListener('change', (e) => {
                extensionSettings.selectedModel = e.target.value;
            });
        }

        // Width input
        const widthInput = document.getElementById('replicate_width');
        if (widthInput) {
            widthInput.value = extensionSettings.width;
            widthInput.addEventListener('input', (e) => {
                extensionSettings.width = parseInt(e.target.value);
            });
        }

        // Height input
        const heightInput = document.getElementById('replicate_height');
        if (heightInput) {
            heightInput.value = extensionSettings.height;
            heightInput.addEventListener('input', (e) => {
                extensionSettings.height = parseInt(e.target.value);
            });
        }

        // Num outputs input
        const numOutputsInput = document.getElementById('replicate_num_outputs');
        if (numOutputsInput) {
            numOutputsInput.value = extensionSettings.num_outputs;
            numOutputsInput.addEventListener('input', (e) => {
                extensionSettings.num_outputs = parseInt(e.target.value);
            });
        }

        // Guidance scale input
        const guidanceScaleInput = document.getElementById('replicate_guidance_scale');
        if (guidanceScaleInput) {
            guidanceScaleInput.value = extensionSettings.guidance_scale;
            guidanceScaleInput.addEventListener('input', (e) => {
                extensionSettings.guidance_scale = parseFloat(e.target.value);
            });
        }

        // Num inference steps input
        const numInferenceStepsInput = document.getElementById('replicate_num_inference_steps');
        if (numInferenceStepsInput) {
            numInferenceStepsInput.value = extensionSettings.num_inference_steps;
            numInferenceStepsInput.addEventListener('input', (e) => {
                extensionSettings.num_inference_steps = parseInt(e.target.value);
            });
        }

        // Test connection button
        const testButton = document.getElementById('replicate_test_connection');
        if (testButton) {
            testButton.addEventListener('click', async () => {
                showStatus('Testing connection...', 'info');

                try {
                    await updatePluginConfig();
                    const health = await checkPluginHealth();
                    
                    if (health && health.configured) {
                        showStatus('✓ Connection successful!', 'success');
                        await loadModels();
                    } else {
                        showStatus('✗ API key not configured', 'error');
                    }
                } catch (error) {
                    showStatus(`✗ Connection failed: ${error.message}`, 'error');
                }
            });
        }

        // Save settings button
        const saveButton = document.getElementById('replicate_save_settings');
        if (saveButton) {
            saveButton.addEventListener('click', async () => {
                showStatus('Saving settings...', 'info');

                try {
                    await updatePluginConfig();
                    saveSettings();
                    showStatus('✓ Settings saved successfully!', 'success');
                } catch (error) {
                    showStatus(`✗ Failed to save: ${error.message}`, 'error');
                }
            });
        }
    }

    /**
     * Register slash command for image generation
     */
    function registerSlashCommand() {
        if (typeof SlashCommandParser !== 'undefined') {
            SlashCommandParser.addCommandObject(SlashCommand.fromProps({
                name: 'replicate',
                callback: async (args, prompt) => {
                    try {
                        const result = await generateImage(prompt);
                        
                        // Display images in chat
                        if (result.images && result.images.length > 0) {
                            const imageHtml = result.images.map(url => 
                                `<img src="${url}" alt="Generated image" style="max-width: 100%; border-radius: 8px; margin: 5px 0;" />`
                            ).join('');
                            
                            return `Generated ${result.images.length} image(s):\n${imageHtml}`;
                        }
                        
                        return 'Image generation completed but no images returned.';
                    } catch (error) {
                        return `Error generating image: ${error.message}`;
                    }
                },
                returns: 'generated image(s)',
                namedArgumentList: [],
                unnamedArgumentList: [
                    SlashCommandArgument.fromProps({
                        description: 'the prompt for image generation',
                        typeList: [ARGUMENT_TYPE.STRING],
                        isRequired: true
                    })
                ],
                helpString: `
                    <div>
                        Generate images using Replicate AI models.
                    </div>
                    <div>
                        <strong>Example:</strong>
                        <ul>
                            <li>
                                <pre><code class="language-stscript">/replicate a beautiful sunset over mountains</code></pre>
                            </li>
                        </ul>
                    </div>
                `
            }));
            
            console.log('[Replicate Extension] Slash command registered: /replicate');
        }
    }

    /**
     * Initialize extension - This is called by SillyTavern
     */
    async function init() {
        console.log('[Replicate Extension] Initializing...');

        // Load settings
        loadSettings();

        // Register slash command
        registerSlashCommand();

        // Check plugin health
        const health = await checkPluginHealth();
        if (health && health.configured) {
            await loadModels();
        }

        console.log('[Replicate Extension] Initialized successfully');
    }

    /**
     * Get settings HTML - This is called by SillyTavern to render the settings panel
     */
    function getSettings() {
        const html = getSettingsHtml();
        
        // Use setTimeout to ensure DOM is ready before binding events
        setTimeout(() => {
            bindUIEvents();
        }, 100);
        
        return html;
    }

    // Export functions that SillyTavern expects
    window.replicate_extension = {
        init: init,
        getSettings: getSettings
    };

    // Also try the jQuery ready approach as fallback
    jQuery(async () => {
        await init();
    });

})();