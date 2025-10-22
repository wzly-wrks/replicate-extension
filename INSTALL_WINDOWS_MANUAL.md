# Manual Installation Guide for Windows

If the automated script doesn't work, follow these manual steps:

## Step 1: Install Server Plugin

1. Open File Explorer
2. Navigate to your SillyTavern installation folder (e.g., `C:\Users\reposed.SU\SillyTavern-1.13.4\SillyTavern`)
3. Go to the `plugins` folder (create it if it doesn't exist)
4. Create a new folder called `replicate`
5. Copy these files from the `replicate-integration\plugin\` folder:
   - `index.js`
   - `manifest.json`
6. Your structure should look like:
   ```
   SillyTavern\
   └── plugins\
       └── replicate\
           ├── index.js
           └── manifest.json
   ```

## Step 2: Install UI Extension

1. In your SillyTavern folder, navigate to:
   ```
   data\default-user\extensions\
   ```
   (Create these folders if they don't exist)

2. Create a new folder called `replicate`

3. Copy these files from the `replicate-integration\extension\` folder:
   - `index.js`
   - `manifest.json`
   - `style.css`

4. Your structure should look like:
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

## Step 3: Enable Server Plugins

1. Open `config.yaml` in your SillyTavern folder with a text editor
2. Find the line that says `enableServerPlugins: false`
3. Change it to `enableServerPlugins: true`
4. Save the file

## Step 4: Install Dependencies

1. Open PowerShell or Command Prompt
2. Navigate to your SillyTavern folder:
   ```cmd
   cd C:\Users\reposed.SU\SillyTavern-1.13.4\SillyTavern
   ```
3. Run:
   ```cmd
   npm install node-fetch
   ```

## Step 5: Restart SillyTavern

1. Close SillyTavern if it's running
2. Start it again:
   ```cmd
   node server.js
   ```

## Step 6: Configure the Extension

1. Open SillyTavern in your browser
2. Click the Extensions icon (puzzle piece)
3. Find "Replicate Image Generation"
4. Click to expand it
5. Enter your Replicate API token (get it from https://replicate.com/account/api-tokens)
6. Click "Test Connection"
7. Click "Save Settings"

## Step 7: Test It!

In the chat, type:
```
/replicate a cute cat wearing a wizard hat
```

## Verification Checklist

- [ ] Files copied to `plugins\replicate\`
- [ ] Files copied to `data\default-user\extensions\replicate\`
- [ ] `config.yaml` has `enableServerPlugins: true`
- [ ] `node-fetch` installed
- [ ] SillyTavern restarted
- [ ] Extension appears in Extensions menu
- [ ] API token configured
- [ ] Test connection succeeds

## Troubleshooting

### Plugin Not Loading
- Check that files are in `plugins\replicate\` (not `plugins\replicate\plugin\`)
- Check server console for errors
- Verify `config.yaml` has `enableServerPlugins: true`

### Extension Not Appearing
- Check that files are in `data\default-user\extensions\replicate\`
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)
- Check browser console (F12) for errors

### "Cannot find module 'node-fetch'"
- Run `npm install node-fetch` in the SillyTavern directory
- Restart SillyTavern

## Need Help?

If you're still having issues:
1. Check the server console for error messages
2. Check the browser console (F12) for errors
3. Make sure all files are in the correct locations
4. Verify your SillyTavern version is up to date
5. Join the SillyTavern Discord for support