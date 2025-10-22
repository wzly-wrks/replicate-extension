# 🚀 Quick Start Guide

Get up and running with Replicate integration in 5 minutes!

## Prerequisites

- ✅ SillyTavern installed
- ✅ Replicate account ([sign up here](https://replicate.com))
- ✅ API token ([get one here](https://replicate.com/account/api-tokens))

## Installation (Choose One Method)

### Method 1: Automated Installation (Recommended)

**Linux/Mac:**
```bash
cd replicate-integration
chmod +x install.sh
./install.sh /path/to/SillyTavern
```

**Windows:**
```cmd
cd replicate-integration
install.bat C:\path\to\SillyTavern
```

### Method 2: Manual Installation (5 Steps)

1. **Copy Plugin Files**
   ```bash
   cp -r plugin/* /path/to/SillyTavern/plugins/replicate/
   ```

2. **Copy Extension Files**
   ```bash
   cp -r extension/* /path/to/SillyTavern/data/default-user/extensions/replicate/
   ```

3. **Enable Server Plugins**
   
   Edit `SillyTavern/config.yaml`:
   ```yaml
   enableServerPlugins: true
   ```

4. **Install Dependencies**
   ```bash
   cd /path/to/SillyTavern
   npm install node-fetch
   ```

5. **Restart SillyTavern**

## Configuration (3 Steps)

1. **Open SillyTavern** in your browser

2. **Navigate to Extensions**
   - Click the Extensions icon (puzzle piece)
   - Find "Replicate Image Generation"
   - Click to expand

3. **Configure Settings**
   - Enter your Replicate API token
   - Click "Test Connection"
   - Click "Save Settings"

## First Image Generation

Try it out with the slash command:

```
/replicate a beautiful sunset over mountains
```

That's it! You're ready to generate images! 🎨

## What's Next?

- 📖 Read [README.md](README.md) for full documentation
- 💡 Check [EXAMPLES.md](EXAMPLES.md) for usage tips
- 🔧 Adjust settings for your needs
- 🎨 Start creating amazing images!

## Troubleshooting

### Plugin not loading?
- Check `config.yaml` has `enableServerPlugins: true`
- Restart SillyTavern
- Check server logs

### Extension not appearing?
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)
- Check browser console (F12)

### API errors?
- Verify API token is correct
- Check you have Replicate credits
- Test connection in settings

## Need Help?

- 📖 [Full Documentation](README.md)
- 🔧 [Installation Guide](INSTALLATION.md)
- 💡 [Usage Examples](EXAMPLES.md)
- 💬 [SillyTavern Discord](https://discord.gg/sillytavern)

---

**Time to first image: ~5 minutes** ⚡