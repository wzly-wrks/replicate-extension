/**
 * SillyTavern Replicate Integration
 * Bridges the Replicate plugin into SillyTavern's primary image generation UI
 */

import { extension_settings } from '../../../extensions.js';
import { eventSource, event_types } from '../../../events.js';
import { getRequestHeaders } from '../../../../script.js';

const MODULE_KEY = 'replicate';
const PLUGIN_BASE_URL = '/api/plugins/replicate';

const defaultSettings = {
    apiKey: '',
    selectedModel: 'black-forest-labs/flux-schnell',
    width: 1024,
    height: 1024,
    replicate_num_outputs: 1,
    replicate_guidance_scale: 7.5,
    replicate_num_inference_steps: 50,
};

function ensureState() {
    if (!extension_settings[MODULE_KEY]) {
        extension_settings[MODULE_KEY] = {};
    }
    
    const existing = extension_settings[MODULE_KEY];
    const settings = { ...defaultSettings, ...existing };
    extension_settings[MODULE_KEY] = settings;
    
    return settings;
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
        throw new Error(`Plugin request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
}

// This extension doesn't need its own UI since it integrates with the stable diffusion UI
// We just need to ensure the settings are properly initialized
function init() {
    ensureState();
    console.log('[Replicate Extension] Initialized');
}

init();

globalThis.replicate_extension = {
    init,
};