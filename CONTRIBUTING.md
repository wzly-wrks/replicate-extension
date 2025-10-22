# Contributing to SillyTavern Replicate Integration

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Your environment (OS, Node.js version, SillyTavern version)
- Screenshots if applicable
- Server logs if relevant

### Suggesting Features

Feature suggestions are welcome! Please open an issue with:
- A clear description of the feature
- Use cases and benefits
- Any implementation ideas you have
- Examples from other tools (if applicable)

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Guidelines

### Code Style

- Use consistent indentation (4 spaces)
- Add comments for complex logic
- Follow existing code patterns
- Use meaningful variable names
- Keep functions focused and small

### Plugin Development

When modifying the server plugin:
- Test all endpoints thoroughly
- Handle errors gracefully
- Log important events
- Validate input parameters
- Document new endpoints

### Extension Development

When modifying the UI extension:
- Test in multiple browsers
- Ensure responsive design
- Follow SillyTavern's UI patterns
- Handle loading states
- Provide user feedback

### Testing

Before submitting:
- Test with different models
- Test error scenarios
- Test with invalid inputs
- Verify settings persistence
- Check browser console for errors
- Review server logs

### Documentation

Update documentation when:
- Adding new features
- Changing existing behavior
- Adding new settings
- Modifying API endpoints
- Fixing bugs

## Project Structure

```
replicate-integration/
├── plugin/              # Server plugin
│   ├── index.js        # Main plugin logic
│   └── manifest.json   # Plugin metadata
├── extension/          # UI extension
│   ├── index.js        # Extension logic
│   ├── manifest.json   # Extension metadata
│   └── style.css       # Extension styles
├── README.md           # Main documentation
├── INSTALLATION.md     # Installation guide
├── EXAMPLES.md         # Usage examples
└── CHANGELOG.md        # Version history
```

## Adding New Models

To add support for a new Replicate model:

1. Add the model to the list in `plugin/index.js`:
```javascript
{
    id: 'owner/model-name',
    name: 'Display Name',
    description: 'Model description'
}
```

2. Test the model with various prompts
3. Update documentation with model details
4. Add usage examples

## Adding New Features

When adding features:

1. Plan the implementation
2. Update both plugin and extension if needed
3. Add appropriate error handling
4. Update settings schema if needed
5. Add UI controls if needed
6. Document the feature
7. Add examples
8. Test thoroughly

## Code Review Process

Pull requests will be reviewed for:
- Code quality and style
- Functionality and correctness
- Documentation completeness
- Test coverage
- Backward compatibility
- Security considerations

## Community Guidelines

- Be respectful and constructive
- Help others when you can
- Share knowledge and examples
- Report issues clearly
- Test before reporting
- Provide feedback on PRs

## Getting Help

- Read the documentation first
- Check existing issues
- Ask in the SillyTavern Discord
- Provide context and details
- Be patient and respectful

## License

By contributing, you agree that your contributions will be licensed under the AGPL-3.0 License.

## Recognition

Contributors will be recognized in:
- The README.md file
- Release notes
- The project's contributors page

Thank you for contributing to make this project better!