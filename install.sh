#!/bin/bash

# SillyTavern Replicate Integration - Installation Script
# This script automates the installation process

set -e

echo "================================================"
echo "SillyTavern Replicate Integration Installer"
echo "================================================"
echo ""

# Check if SillyTavern directory is provided
if [ -z "$1" ]; then
    echo "Usage: ./install.sh /path/to/SillyTavern"
    echo ""
    echo "Example: ./install.sh ~/SillyTavern"
    exit 1
fi

SILLYTAVERN_DIR="$1"

# Verify SillyTavern directory exists
if [ ! -d "$SILLYTAVERN_DIR" ]; then
    echo "Error: SillyTavern directory not found: $SILLYTAVERN_DIR"
    exit 1
fi

echo "Installing to: $SILLYTAVERN_DIR"
echo ""

# Check for config.yaml
CONFIG_FILE="$SILLYTAVERN_DIR/config.yaml"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Warning: config.yaml not found. You'll need to enable server plugins manually."
fi

# Install server plugin
echo "1. Installing server plugin..."
PLUGIN_DIR="$SILLYTAVERN_DIR/plugins/replicate"
mkdir -p "$PLUGIN_DIR"
cp plugin/index.js "$PLUGIN_DIR/"
cp plugin/manifest.json "$PLUGIN_DIR/"
echo "   ✓ Server plugin installed"

# Install UI extension
echo "2. Installing UI extension..."
read -p "   Install for all users? (y/n, default: n): " INSTALL_ALL

if [ "$INSTALL_ALL" = "y" ] || [ "$INSTALL_ALL" = "Y" ]; then
    EXTENSION_DIR="$SILLYTAVERN_DIR/public/scripts/extensions/third-party/replicate"
    echo "   Installing for all users..."
else
    EXTENSION_DIR="$SILLYTAVERN_DIR/data/default-user/extensions/replicate"
    echo "   Installing for current user..."
fi

mkdir -p "$EXTENSION_DIR"
cp extension/index.js "$EXTENSION_DIR/"
cp extension/manifest.json "$EXTENSION_DIR/"
cp extension/style.css "$EXTENSION_DIR/"
echo "   ✓ UI extension installed"

# Install dependencies
echo "3. Installing dependencies..."
cd "$SILLYTAVERN_DIR"
if command -v npm &> /dev/null; then
    npm install node-fetch
    echo "   ✓ Dependencies installed"
else
    echo "   ⚠ npm not found. Please install node-fetch manually:"
    echo "     cd $SILLYTAVERN_DIR && npm install node-fetch"
fi

# Check config.yaml
echo "4. Checking configuration..."
if [ -f "$CONFIG_FILE" ]; then
    if grep -q "enableServerPlugins: true" "$CONFIG_FILE"; then
        echo "   ✓ Server plugins already enabled"
    else
        echo "   ⚠ Server plugins not enabled in config.yaml"
        read -p "   Enable server plugins now? (y/n): " ENABLE_PLUGINS
        if [ "$ENABLE_PLUGINS" = "y" ] || [ "$ENABLE_PLUGINS" = "Y" ]; then
            # Backup config
            cp "$CONFIG_FILE" "$CONFIG_FILE.backup"
            # Enable plugins
            sed -i.bak 's/enableServerPlugins: false/enableServerPlugins: true/' "$CONFIG_FILE"
            echo "   ✓ Server plugins enabled (backup saved as config.yaml.backup)"
        else
            echo "   Please enable server plugins manually in config.yaml"
        fi
    fi
fi

echo ""
echo "================================================"
echo "Installation Complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Restart SillyTavern"
echo "2. Open SillyTavern in your browser"
echo "3. Go to Extensions > Replicate Image Generation"
echo "4. Enter your Replicate API token"
echo "5. Click 'Test Connection'"
echo "6. Click 'Save Settings'"
echo ""
echo "Get your API token from:"
echo "https://replicate.com/account/api-tokens"
echo ""
echo "For more information, see README.md"
echo ""