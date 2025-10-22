# Quick Installation Guide

## Step-by-Step Installation

### 1. Prepare Your Environment

Before installing, make sure you have:
- ✅ SillyTavern installed and running
- ✅ A Replicate account with an API token
- ✅ Node.js 14 or higher

### 2. Enable Server Plugins

Edit your SillyTavern `config.yaml`:

```yaml
# Find this line and change it to true
enableServerPlugins: true
```

**Location of config.yaml:**
- Windows: `SillyTavern\config.yaml`
- Linux/Mac: `SillyTavern/config.yaml`

### 3. Install the Server Plugin

**Option A: Manual Installation**

1. Navigate to your SillyTavern directory
2. Create the plugin directory:
   ```bash
   mkdir -p plugins/replicate
   ```
3. Copy these files to `plugins/replicate/`:
   - `plugin/index.js`
   - `plugin/manifest.json`

**Option B: Using Command Line**

```bash
cd SillyTavern
mkdir -p plugins/replicate
cp /path/to/replicate-integration/plugin/* plugins/replicate/
```

### 4. Install Dependencies

```bash
cd SillyTavern
npm install node-fetch
```

### 5. Install the UI Extension

**For Single User (Recommended):**

```bash
cd SillyTavern
mkdir -p data/default-user/extensions/replicate
cp /path/to/replicate-integration/extension/* data/default-user/extensions/replicate/
```

**For All Users:**

```bash
cd SillyTavern
mkdir -p public/scripts/extensions/third-party/replicate
cp /path/to/replicate-integration/extension/* public/scripts/extensions/third-party/replicate/
```

### 6. Restart SillyTavern

Stop and restart your SillyTavern server:

```bash
# Stop the server (Ctrl+C)
# Then start it again
node server.js
```

### 7. Configure the Extension

1. Open SillyTavern in your browser
2. Click the **Extensions** icon (puzzle piece)
3. Find **Replicate Image Generation** in the list
4. Click to expand the settings
5. Enter your Replicate API token
6. Click **Test Connection**
7. If successful, click **Save Settings**

### 8. Test It Out!

Try generating an image:

```
/replicate a cute cat wearing a wizard hat
```

## Verification Checklist

- [ ] `config.yaml` has `enableServerPlugins: true`
- [ ] Plugin files are in `plugins/replicate/`
- [ ] Extension files are in `data/default-user/extensions/replicate/` or `public/scripts/extensions/third-party/replicate/`
- [ ] `node-fetch` is installed
- [ ] SillyTavern has been restarted
- [ ] Extension appears in Extensions menu
- [ ] API token is configured
- [ ] Test connection succeeds
- [ ] `/replicate` command works

## Directory Structure

After installation, your structure should look like:

```
SillyTavern/
├── config.yaml (enableServerPlugins: true)
├── plugins/
│   └── replicate/
│       ├── index.js
│       └── manifest.json
├── data/
│   └── default-user/
│       └── extensions/
│           └── replicate/
│               ├── index.js
│               ├── manifest.json
│               └── style.css
└── node_modules/
    └── node-fetch/
```

## Common Issues

### "Plugin not found" Error

**Solution:** Verify files are in `plugins/replicate/` and restart the server.

### "Extension not loading" Error

**Solution:** 
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Check browser console for errors

### "API key not configured" Error

**Solution:** 
1. Go to Extensions > Replicate Image Generation
2. Enter your API token
3. Click "Test Connection"
4. Click "Save Settings"

### "node-fetch not found" Error

**Solution:**
```bash
cd SillyTavern
npm install node-fetch
```

## Getting Your API Token

1. Go to [replicate.com](https://replicate.com)
2. Sign up or log in
3. Navigate to [Account > API Tokens](https://replicate.com/account/api-tokens)
4. Create a new token or copy an existing one
5. Paste it into the extension settings

## Need Help?

- 📖 Read the full [README.md](README.md)
- 💬 Join the [SillyTavern Discord](https://discord.gg/sillytavern)
- 🐛 Check server logs for detailed errors
- 🔍 Review browser console for frontend issues