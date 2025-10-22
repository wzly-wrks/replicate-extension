# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-14

### Added
- Initial release of Replicate integration for SillyTavern
- Server plugin for backend API communication
- UI extension for frontend controls
- Support for multiple Replicate models:
  - FLUX.1 Schnell
  - FLUX.1 Dev
  - Stable Diffusion XL
  - Stable Diffusion
- Configurable generation parameters:
  - Image dimensions (width/height)
  - Number of outputs
  - Guidance scale
  - Inference steps
- `/replicate` slash command for chat-based generation
- Real-time prediction polling
- API key configuration via UI
- Test connection functionality
- Comprehensive documentation:
  - README.md
  - INSTALLATION.md
  - EXAMPLES.md
- Settings persistence
- Error handling and validation
- Health check endpoint
- Model listing endpoint
- Prediction status endpoint

### Security
- API keys stored securely in extension settings
- Backend handles all API communication
- No client-side API key exposure

## [Unreleased]

### Planned Features
- Webhook support for async generation
- Image-to-image generation
- ControlNet support
- LoRA model support
- Custom model version selection
- Generation history
- Favorite prompts
- Batch processing
- Cost estimation
- Generation queue management
- Advanced prompt templates
- Integration with SillyTavern's image gallery
- Support for more Replicate models
- Fine-tuned model support
- Video generation support (when available)

### Known Issues
- None reported yet

## Contributing

To suggest features or report bugs, please open an issue on the GitHub repository.

## Version History

- **1.0.0** (2025-01-14) - Initial release