# SillyTavern Replicate Integration

A comprehensive extension and server plugin that integrates Replicate as a first-class image generation provider in SillyTavern.

## Features

- 🎨 **Full Replicate API Integration** - Access to all Replicate image generation models
- 🖼️ **Multiple Model Support** - FLUX.1, Stable Diffusion XL, and more
- ⚙️ **Configurable Settings** - Control image dimensions, guidance scale, inference steps
- 🔌 **Server Plugin** - Secure API key handling on the backend
- 🎯 **UI Extension** - Easy-to-use interface integrated into SillyTavern
- 💬 **Slash Command** - Generate images directly from chat with `/replicate`
- 🔄 **Real-time Generation** - Automatic polling for prediction completion

## Architecture

This integration consists of two components:

1. **Server Plugin** (`plugin/`) - Handles backend API communication with Replicate
2. **UI Extension** (`extension/`) - Provides frontend interface and controls

## Installation

### Prerequisites

- SillyTavern (latest version recommended)
- Node.js 14+ (for the server plugin)
- A Replicate API token (get one at [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens))

### Step 1: Enable Server Plugins

1. Open your SillyTavern `config.yaml` file
2. Set `enableServerPlugins: true`
3. Save the file

### Step 2: Install the Server Plugin

1. Copy the `plugin` folder to your SillyTavern `plugins` directory:
   ```
   SillyTavern/
   └── plugins/
       └── replicate/
           ├── index.js
           └── manifest.json
   ```

2. Install required dependencies (if not already present):
   ```bash
   cd SillyTavern
   npm install node-fetch
   ```

### Step 3: Install the UI Extension

1. Copy the `extension` folder to your SillyTavern extensions directory:
   ```
   SillyTavern/
   └── data/
       └── default-user/
           └── extensions/
               └── replicate/
                   ├── index.js
                   └── manifest.json
   ```

   Or for all users:
   ```
   SillyTavern/
   └── public/
       └── scripts/
           └── extensions/
               └── third-party/
                   └── replicate/
                       ├── index.js
                       └── manifest.json
   ```

### Step 4: Restart SillyTavern

Restart your SillyTavern server to load the plugin and extension.

## Configuration

### 1. Get Your Replicate API Token

1. Go to [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)
2. Create a new API token or copy an existing one

### 2. Configure the Extension

1. Open SillyTavern
2. Go to **Extensions** > **Stable Diffusion**
3. In the **Source** dropdown, select "replicate"
4. Enter your Replicate API token in the extension settings
5. Select your preferred model from the model dropdown
6. Adjust generation settings as needed

## Usage

### Using the Integrated Image Generation System

After installation, Replicate will appear as an option in SillyTavern's existing image generation system:

1. Open SillyTavern
2. Go to **Extensions** > **Stable Diffusion**
3. In the **Source** dropdown, select "replicate"
4. Configure your Replicate API key in the extension settings
5. Select your preferred model from the model dropdown
6. Adjust generation settings as needed
7. Use the existing image generation UI or slash commands:
   - Magic wand icon in chat messages
   - `/sd` slash command with various arguments (e.g., `/sd you`, `/sd face`, `/sd scene`)
   - Function calling if enabled

The Replicate extension no longer provides its own separate UI, as it now integrates fully with SillyTavern's existing image generation framework.

### Using the API Directly

You can also call the plugin endpoints directly:

#### Generate Image
```javascript
POST /api/plugins/replicate/generate
Content-Type: application/json

{
  "prompt": "a beautiful landscape",
  "model": "black-forest-labs/flux-schnell",
  "width": 1024,
  "height": 1024,
  "num_outputs": 1,
  "guidance_scale": 7.5,
  "num_inference_steps": 50
}
```

#### List Available Models
```javascript
GET /api/plugins/replicate/models
```

#### Check Plugin Health
```javascript
GET /api/plugins/replicate/health
```

## Available Models

The extension includes support for popular Replicate models:

- **FLUX.1 Schnell** - Fast, high-quality image generation
- **FLUX.1 Dev** - Advanced image generation with more control
- **Stable Diffusion XL** - Industry-standard text-to-image
- **Stable Diffusion** - Classic Stable Diffusion model

## Settings Reference

### Image Dimensions
- **Width**: 256-2048 pixels (default: 1024)
- **Height**: 256-2048 pixels (default: 1024)

### Generation Parameters
- **Number of Images**: 1-4 images per generation (default: 1)
- **Guidance Scale**: 1-20 (default: 7.5)
  - Higher values make the output follow the prompt more closely
- **Inference Steps**: 1-100 (default: 50)
  - More steps = higher quality but slower generation

## API Endpoints

### Plugin Endpoints

All endpoints are prefixed with `/api/plugins/replicate/`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Check plugin status and configuration |
| `/config` | GET | Get current configuration |
| `/config` | POST | Update configuration |
| `/models` | GET | List available models |
| `/generate` | POST | Generate image(s) |
| `/prediction/:id` | GET | Get prediction status |

## Troubleshooting

### Plugin Not Loading

1. Verify `enableServerPlugins: true` in `config.yaml`
2. Check server logs for errors
3. Ensure `node-fetch` is installed

### Extension Not Appearing

1. Check that files are in the correct directory
2. Refresh the browser cache (Ctrl+F5)
3. Check browser console for errors

### API Key Issues

1. Verify your API token is valid at [replicate.com/account](https://replicate.com/account)
2. Check that the token has sufficient credits
3. Use the "Test Connection" button to verify

### Generation Failures

1. Check the model supports your requested parameters
2. Verify your prompt is appropriate
3. Check Replicate service status
4. Review server logs for detailed error messages

## Environment Variables

You can optionally set the API token via environment variable:

```bash
export REPLICATE_API_TOKEN="your_token_here"
```

This will be used as the default if no token is configured in the UI.

## Development

### Plugin Structure

```
plugin/
├── index.js          # Main plugin logic
└── manifest.json     # Plugin metadata
```

### Extension Structure

```
extension/
├── index.js          # Extension logic and UI
├── manifest.json     # Extension metadata
└── style.css         # Extension styles
```

### Adding New Models

To add support for additional models, update the models list in `plugin/index.js`:

```javascript
const models = [
    {
        id: 'owner/model-name',
        name: 'Display Name',
        description: 'Model description'
    }
];
```

## Security Notes

- API tokens are stored in SillyTavern's extension settings
- The server plugin handles all API communication
- Never share your API token publicly
- API tokens are sent to the plugin via HTTPS

## Credits

- Built for the SillyTavern community
- Powered by [Replicate](https://replicate.com)
- Supports models from Stability AI, Black Forest Labs, and more

## License

This extension is provided as-is for use with SillyTavern. Please ensure compliance with Replicate's terms of service and the licenses of individual models you use.

## Support

For issues and questions:
- Check the [SillyTavern Documentation](https://docs.sillytavern.app)
- Visit the [SillyTavern Discord](https://discord.gg/sillytavern)
- Review [Replicate Documentation](https://replicate.com/docs)

## Testing

To test the integration:

1. Ensure both the plugin and extension are properly installed
2. Restart SillyTavern to load the new components
3. Go to **Extensions** > **Stable Diffusion**
4. Select "replicate" from the source dropdown
5. Configure your API key in the extension settings
6. Try generating an image using the magic wand icon or `/sd` slash command

## Changelog

### Version 1.0.0
- Initial release
- Support for FLUX.1 and Stable Diffusion models
- Configurable generation parameters
- Slash command integration
- Real-time prediction polling