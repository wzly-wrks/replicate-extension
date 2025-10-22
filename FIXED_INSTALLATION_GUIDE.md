# 🔧 Fixed Installation Guide - Replicate Integration

## What Was Fixed

1. ✅ **UI Rendering Issue** - Extension now properly exports `getSettings()` function
2. ✅ **Settings Panel** - Now correctly renders in SillyTavern's extension settings
3. ✅ **Event Binding** - Fixed timing issues with UI event handlers
4. ✅ **Code Validation** - All syntax errors checked and resolved

## 🚀 Fresh Installation Steps

### Step 1: Remove Old Installation (If Any)

1. Navigate to your SillyTavern folder
2. Delete these folders if they exist:
   - `plugins\replicate\`
   - `data\default-user\extensions\replicate\`

### Step 2: Install Server Plugin

1. Go to your SillyTavern folder
2. Navigate to `plugins\` (create if doesn't exist)
3. Create a folder called `replicate`
4. Copy these files from `replicate-integration\plugin\`:
   - `index.js`
   - `manifest.json`

**Final structure:**
```
SillyTavern\
└── plugins\
    └── replicate\
        ├── index.js
        └── manifest.json
```

### Step 3: Install UI Extension

1. In your SillyTavern folder, navigate to `data\default-user\extensions\`
   - Create these folders if they don't exist
2. Create a folder called `replicate`
3. Copy these files from `replicate-integration\extension\`:
   - `index.js` (THE FIXED VERSION)
   - `manifest.json`
   - `style.css`

**Final structure:**
```
SillyTavern\
└── data\
    └── default-user\
        └── extensions\
            └── replicate\
                ├── index.js
                ├── manifest.json
                └── style.css
```

### Step 4: Verify Config

1. Open `config.yaml` in your SillyTavern folder
2. Confirm it has: `enableServerPlugins: true`
3. Save if you made changes

### Step 5: Verify Dependencies

You already have `node-fetch` installed, so you're good!

### Step 6: Restart SillyTavern

1. **IMPORTANT:** Completely close SillyTavern
2. Close your browser
3. Start SillyTavern again: `node server.js`
4. Open your browser and go to SillyTavern

### Step 7: Verify Extension Loaded

1. Open browser console (F12)
2. Look for these messages:
   ```
   [Replicate Extension] Initializing...
   [Replicate Extension] Initialized successfully
   ```
3. Check server console for:
   ```
   [Replicate Plugin] Initializing...
   [Replicate Plugin] Initialized successfully
   ```

### Step 8: Access Settings

1. Click the **Extensions** icon (puzzle piece) in SillyTavern
2. Find **Replicate Image Generation** in the list
3. Click the checkbox to enable it
4. **The settings panel should now appear below!**

You should see:
- API Key input field
- Model dropdown
- Width/Height inputs
- Number of images
- Guidance scale
- Inference steps
- Test Connection button
- Save Settings button

### Step 9: Configure

1. Get your API token from: https://replicate.com/account/api-tokens
2. Paste it in the **Replicate API Key** field
3. Click **Test Connection**
4. Wait for "✓ Connection successful!"
5. Click **Save Settings**

### Step 10: Test

In the chat, type:
```
/replicate a cute cat wearing a wizard hat
```

## 🔍 Troubleshooting

### Settings Panel Still Not Showing

**Check Browser Console (F12):**
- Look for JavaScript errors
- Look for "[Replicate Extension]" messages

**Check Server Console:**
- Look for "[Replicate Plugin]" messages
- Look for any error messages

**Common Issues:**

1. **Old cached files:**
   ```
   - Clear browser cache (Ctrl+Shift+Delete)
   - Hard refresh (Ctrl+F5)
   - Restart browser completely
   ```

2. **Wrong file location:**
   ```
   Make sure files are in:
   data\default-user\extensions\replicate\
   NOT in:
   data\default-user\extensions\replicate\extension\
   ```

3. **Extension not enabled:**
   ```
   - Go to Extensions menu
   - Find "Replicate Image Generation"
   - Make sure checkbox is CHECKED
   ```

### API Token Issues

If you get "invalid token" errors:

1. **Verify token format:**
   - Should start with `r8_`
   - Should be very long (64+ characters)
   - No spaces before or after

2. **Copy token carefully:**
   - Go to https://replicate.com/account/api-tokens
   - Click "Copy" button (don't manually select)
   - Paste directly into the field

3. **Check Replicate account:**
   - Make sure you're logged in
   - Verify you have credits
   - Check token hasn't been revoked

### Plugin Not Loading

1. **Check config.yaml:**
   ```yaml
   enableServerPlugins: true
   ```

2. **Check file permissions:**
   - Make sure files aren't read-only
   - Make sure you have write access

3. **Check server logs:**
   - Look for plugin initialization messages
   - Look for any error messages

## ✅ Verification Checklist

Before asking for help, verify:

- [ ] Old installation completely removed
- [ ] New files copied to correct locations
- [ ] No extra nested folders (no `replicate\replicate\`)
- [ ] config.yaml has `enableServerPlugins: true`
- [ ] SillyTavern completely restarted
- [ ] Browser cache cleared
- [ ] Extension checkbox is CHECKED
- [ ] Browser console shows no errors
- [ ] Server console shows plugin loaded

## 📞 Still Having Issues?

If settings panel still doesn't show:

1. Take a screenshot of:
   - Extensions menu showing the extension
   - Browser console (F12)
   - Server console output

2. Check these file paths exist:
   ```
   SillyTavern\plugins\replicate\index.js
   SillyTavern\plugins\replicate\manifest.json
   SillyTavern\data\default-user\extensions\replicate\index.js
   SillyTavern\data\default-user\extensions\replicate\manifest.json
   SillyTavern\data\default-user\extensions\replicate\style.css
   ```

3. Verify file sizes:
   - `plugin\index.js` should be ~10KB
   - `extension\index.js` should be ~15KB

## 🎯 Expected Behavior

When working correctly:

1. Extension appears in Extensions menu
2. Checkbox can be enabled
3. **Settings panel appears below the checkbox**
4. All input fields are visible and functional
5. Test Connection button works
6. Save Settings button works
7. `/replicate` command generates images

---

**This fixed version has been tested for syntax errors and should work correctly!**