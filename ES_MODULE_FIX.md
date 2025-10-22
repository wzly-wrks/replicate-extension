# ES Module Fix for SillyTavern

## Issue

Your SillyTavern is configured to use ES modules (has `"type": "module"` in package.json), but the original plugin was written in CommonJS format.

## What Was Fixed

✅ Converted plugin from CommonJS to ES modules:
- Changed `require()` to `import`
- Changed `module.exports` to `export`
- Updated all export syntax

## Installation Instructions

### Step 1: Remove Old Plugin (If Installed)

Delete the folder:
```
C:\Users\reposed.SU\SillyTavern\SillyTavern\plugins\replicate\
```

### Step 2: Install Fixed Plugin

1. Navigate to: `C:\Users\reposed.SU\SillyTavern\SillyTavern\plugins\`
2. Create folder: `replicate`
3. Copy the NEW fixed files from `replicate-integration\plugin\`:
   - `index.js` (ES module version)
   - `manifest.json`

### Step 3: Install Extension

1. Navigate to: `C:\Users\reposed.SU\SillyTavern\SillyTavern\data\default-user\extensions\`
2. Create folder: `replicate`
3. Copy files from `replicate-integration\extension\`:
   - `index.js`
   - `manifest.json`
   - `style.css`

### Step 4: Restart SillyTavern

1. Close SillyTavern completely
2. Start it again: `node server.js`

### Step 5: Verify

Check the server console for:
```
[Replicate Plugin] Initializing...
[Replicate Plugin] Initialized successfully
```

If you see these messages, the plugin loaded correctly!

### Step 6: Configure

1. Open SillyTavern in browser
2. Go to Extensions
3. Enable "Replicate Image Generation"
4. You should now see the settings panel
5. Enter your API token
6. Click "Test Connection"
7. Click "Save Settings"

### Step 7: Test

```
/replicate a beautiful sunset over mountains
```

## File Structure

After installation:
```
SillyTavern\
├── plugins\
│   └── replicate\
│       ├── index.js (ES MODULE VERSION)
│       └── manifest.json
│
└── data\
    └── default-user\
        └── extensions\
            └── replicate\
                ├── index.js
                ├── manifest.json
                └── style.css
```

## Verification

The plugin should now load without the error:
```
ReferenceError: require is not defined in ES module scope
```

## If You Still Get Errors

1. Make sure you copied the NEW version of `plugin/index.js`
2. Check that the file starts with `import fetch from 'node-fetch';`
3. Verify `node-fetch` is installed: `npm list node-fetch`
4. Check server console for any other errors