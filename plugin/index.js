/**
 * SillyTavern Replicate Server Plugin
 * Provides backend integration with Replicate's API for image generation
 * ES Module version for SillyTavern with "type": "module"
 */

import fetch from 'node-fetch';

const REPLICATE_API_BASE = 'https://api.replicate.com/v1';

export const info = {
    id: 'replicate',
    name: 'Replicate Integration',
    description: 'Integrates Replicate as a first-class image generation provider for SillyTavern',
};

const config = {
    apiKey: process.env.REPLICATE_API_TOKEN || '',
    defaultModel: 'black-forest-labs/flux-schnell',
};

async function replicateRequest(endpoint, options = {}) {
    const url = `${REPLICATE_API_BASE}${endpoint}`;
    const headers = {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Replicate API error: ${response.status} - ${errorText}`);
    }

    return response.json();
}

async function waitForPrediction(predictionId, maxAttempts = 60, interval = 2000) {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const prediction = await replicateRequest(`/predictions/${predictionId}`);

        if (prediction.status === 'succeeded') {
            return prediction;
        }

        if (prediction.status === 'failed') {
            throw new Error(`Prediction failed: ${prediction.error}`);
        }

        if (prediction.status === 'canceled') {
            throw new Error('Prediction was canceled');
        }

        await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error('Prediction timed out');
}

function coerceNumber(value) {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

export async function init(router) {
    console.log('[Replicate Plugin] Initializing...');

    router.get('/health', (_req, res) => {
        res.json({
            status: 'ok',
            configured: Boolean(config.apiKey),
            defaultModel: config.defaultModel,
        });
    });

    router.get('/config', (_req, res) => {
        res.json({
            configured: Boolean(config.apiKey),
            defaultModel: config.defaultModel,
        });
    });

    router.post('/config', (req, res) => {
        try {
            const body = req.body ?? {};
            if (typeof body.apiKey === 'string') {
                config.apiKey = body.apiKey.trim();
            }
            if (typeof body.defaultModel === 'string' && body.defaultModel.trim()) {
                config.defaultModel = body.defaultModel.trim();
            }

            res.json({ success: true, message: 'Configuration updated' });
        } catch (error) {
            console.error('[Replicate Plugin] Failed to update configuration:', error);
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/models', async (_req, res) => {
        if (!config.apiKey) {
            return res.status(401).json({ error: 'API key not configured' });
        }

        try {
            const models = [
                {
                    id: 'black-forest-labs/flux-schnell',
                    name: 'FLUX.1 Schnell',
                    description: 'Fast image generation with FLUX.1',
                },
                {
                    id: 'black-forest-labs/flux-dev',
                    name: 'FLUX.1 Dev',
                    description: 'High-quality image generation with FLUX.1',
                },
                {
                    id: 'stability-ai/sdxl',
                    name: 'Stable Diffusion XL',
                    description: 'High-quality text-to-image generation',
                },
                {
                    id: 'stability-ai/stable-diffusion',
                    name: 'Stable Diffusion',
                    description: 'Classic Stable Diffusion model',
                },
            ];

            res.json({ models });
        } catch (error) {
            console.error('[Replicate Plugin] Error listing models:', error);
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/generate', async (req, res) => {
        if (!config.apiKey) {
            return res.status(401).json({ error: 'API key not configured' });
        }

        try {
            const body = req.body ?? {};
            const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

            if (!prompt) {
                return res.status(400).json({ error: 'Prompt is required' });
            }

            const modelToUse = typeof body.model === 'string' && body.model.trim() ? body.model.trim() : config.defaultModel;

            console.log(`[Replicate Plugin] Generating image with model: ${modelToUse}`);
            console.log(`[Replicate Plugin] Prompt: ${prompt}`);

            const input = { prompt };
            const width = coerceNumber(body.width);
            const height = coerceNumber(body.height);
            const numOutputs = coerceNumber(body.num_outputs);
            const guidanceScale = coerceNumber(body.guidance_scale);
            const inferenceSteps = coerceNumber(body.num_inference_steps);

            if (width !== undefined) input.width = width;
            if (height !== undefined) input.height = height;
            if (numOutputs !== undefined) input.num_outputs = numOutputs;
            if (guidanceScale !== undefined) input.guidance_scale = guidanceScale;
            if (inferenceSteps !== undefined) input.num_inference_steps = inferenceSteps;

            const prediction = await replicateRequest('/predictions', {
                method: 'POST',
                body: JSON.stringify({
                    version: modelToUse,
                    input,
                }),
            });

            console.log(`[Replicate Plugin] Prediction created: ${prediction.id}`);

            const completedPrediction = await waitForPrediction(prediction.id);

            console.log('[Replicate Plugin] Prediction completed successfully');

            let images = [];
            if (Array.isArray(completedPrediction.output)) {
                images = completedPrediction.output;
            } else if (typeof completedPrediction.output === 'string') {
                images = [completedPrediction.output];
            }

            res.json({
                images,
                prompt,
                model: modelToUse,
                predictionId: completedPrediction.id,
            });
        } catch (error) {
            console.error('[Replicate Plugin] Error generating image:', error);
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/prediction/:id', async (req, res) => {
        if (!config.apiKey) {
            return res.status(401).json({ error: 'API key not configured' });
        }

        try {
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
}

export async function exit() {
    console.log('[Replicate Plugin] Shutting down...');
}