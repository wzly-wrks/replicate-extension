/**
 * SillyTavern Replicate Server Plugin
 * Provides backend integration with Replicate's API for image generation
 */

import fetch from 'node-fetch';

const REPLICATE_API_BASE = 'https://api.replicate.com/v1';

/**
 * Plugin information
 */
export const info = {
    id: 'replicate',
    name: 'Replicate Integration',
    description: 'Integrates Replicate as a first-class image generation provider for SillyTavern'
};

/**
 * Store for API configuration
 */
let config = {
    apiKey: process.env.REPLICATE_API_TOKEN || '',
    defaultModel: 'black-forest-labs/flux-schnell'
};

/**
 * Helper function to make authenticated requests to Replicate API
 */
async function replicateRequest(endpoint, options = {}) {
    const url = `${REPLICATE_API_BASE}${endpoint}`;
    const headers = {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Replicate API error: ${response.status} - ${error}`);
    }

    return response.json();
}

/**
 * Poll for prediction completion
 */
async function waitForPrediction(predictionId, maxAttempts = 60, interval = 2000) {
    for (let i = 0; i < maxAttempts; i++) {
        const prediction = await replicateRequest(`/predictions/${predictionId}`);
        
        if (prediction.status === 'succeeded') {
            return prediction;
        } else if (prediction.status === 'failed') {
            throw new Error(`Prediction failed: ${prediction.error}`);
        } else if (prediction.status === 'canceled') {
            throw new Error('Prediction was canceled');
        }
        
        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error('Prediction timed out');
}

/**
 * Initialize the plugin
 * @param {import('express').Router} router Express router
 */
export async function init(router) {
    console.log('[Replicate Plugin] Initializing...');

    // Health check endpoint
    router.get('/health', (req, res) => {
        res.json({
            status: 'ok',
            configured: !!config.apiKey,
            defaultModel: config.defaultModel
        });
    });

    // Get/Set API configuration
    router.get('/config', (req, res) => {
        res.json({
            configured: !!config.apiKey,
            defaultModel: config.defaultModel
        });
    });

    router.post('/config', (req, res) => {
        try {
            if (req.body.apiKey) {
                config.apiKey = req.body.apiKey;
            }
            if (req.body.defaultModel) {
                config.defaultModel = req.body.defaultModel;
            }
            res.json({ success: true, message: 'Configuration updated' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // List available models
    router.get('/models', async (req, res) => {
        try {
            if (!config.apiKey) {
                return res.status(401).json({ error: 'API key not configured' });
            }

            // Get popular image generation models
            const models = [
                {
                    id: 'black-forest-labs/flux-schnell',
                    name: 'FLUX.1 Schnell',
                    description: 'Fast image generation with FLUX.1'
                },
                {
                    id: 'black-forest-labs/flux-dev',
                    name: 'FLUX.1 Dev',
                    description: 'High-quality image generation with FLUX.1'
                },
                {
                    id: 'stability-ai/sdxl',
                    name: 'Stable Diffusion XL',
                    description: 'High-quality text-to-image generation'
                },
                {
                    id: 'stability-ai/stable-diffusion',
                    name: 'Stable Diffusion',
                    description: 'Classic Stable Diffusion model'
                }
            ];

            res.json({ models });
        } catch (error) {
            console.error('[Replicate Plugin] Error listing models:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Generate image endpoint
    router.post('/generate', async (req, res) => {
        try {
            if (!config.apiKey) {
                return res.status(401).json({ error: 'API key not configured' });
            }

            const { prompt, model, width, height, num_outputs, guidance_scale, num_inference_steps } = req.body;

            if (!prompt) {
                return res.status(400).json({ error: 'Prompt is required' });
            }

            const modelToUse = model || config.defaultModel;

            console.log(`[Replicate Plugin] Generating image with model: ${modelToUse}`);
            console.log(`[Replicate Plugin] Prompt: ${prompt}`);

            // Create prediction
            const input = {
                prompt: prompt
            };

            // Add optional parameters if provided
            if (width) input.width = width;
            if (height) input.height = height;
            if (num_outputs) input.num_outputs = num_outputs;
            if (guidance_scale) input.guidance_scale = guidance_scale;
            if (num_inference_steps) input.num_inference_steps = num_inference_steps;

            const prediction = await replicateRequest('/predictions', {
                method: 'POST',
                body: JSON.stringify({
                    version: modelToUse,
                    input: input
                })
            });

            console.log(`[Replicate Plugin] Prediction created: ${prediction.id}`);

            // Wait for completion
            const completedPrediction = await waitForPrediction(prediction.id);

            console.log(`[Replicate Plugin] Prediction completed successfully`);

            // Extract image URLs from output
            let images = [];
            if (Array.isArray(completedPrediction.output)) {
                images = completedPrediction.output;
            } else if (typeof completedPrediction.output === 'string') {
                images = [completedPrediction.output];
            }

            // Return in SillyTavern expected format
            res.json({
                images: images,
                prompt: prompt,
                model: modelToUse,
                predictionId: completedPrediction.id
            });

        } catch (error) {
            console.error('[Replicate Plugin] Error generating image:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Get prediction status
    router.get('/prediction/:id', async (req, res) => {
        try {
            if (!config.apiKey) {
                return res.status(401).json({ error: 'API key not configured' });
            }

            const prediction = await replicateRequest(`/predictions/${req.params.id}`);
            res.json(prediction);
        } catch (error) {
            console.error('[Replicate Plugin] Error getting prediction:', error);
            res.status(500).json({ error: error.message });
        }
    });

    console.log('[Replicate Plugin] Initialized successfully');
    console.log('[Replicate Plugin] Available endpoints:');
    console.log('  - GET  /api/plugins/replicate/health');
    console.log('  - GET  /api/plugins/replicate/config');
    console.log('  - POST /api/plugins/replicate/config');
    console.log('  - GET  /api/plugins/replicate/models');
    console.log('  - POST /api/plugins/replicate/generate');
    console.log('  - GET  /api/plugins/replicate/prediction/:id');

    return Promise.resolve();
}

/**
 * Cleanup function called on server shutdown
 */
export async function exit() {
    console.log('[Replicate Plugin] Shutting down...');
    return Promise.resolve();
}