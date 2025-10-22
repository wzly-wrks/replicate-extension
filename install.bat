@echo off
REM SillyTavern Replicate Integration - Windows Installation Script

echo ================================================
echo SillyTavern Replicate Integration Installer
echo ================================================
echo.

REM Check if SillyTavern directory is provided
if "%~1"=="" (
    echo Usage: install.bat C:\path\to\SillyTavern
    echo.
    echo Example: install.bat C:\SillyTavern
    exit /b 1
)

set "SILLYTAVERN_DIR=%~1"

REM Verify SillyTavern directory exists
if not exist "%SILLYTAVERN_DIR%" (
    echo Error: SillyTavern directory not found: %SILLYTAVERN_DIR%
    exit /b 1
)

echo Installing to: %SILLYTAVERN_DIR%
echo.

REM Install server plugin
echo 1. Installing server plugin...
set "PLUGIN_DIR=%SILLYTAVERN_DIR%\plugins\replicate"
if not exist "%PLUGIN_DIR%" mkdir "%PLUGIN_DIR%"
copy /Y "%~dp0plugin\index.js" "%PLUGIN_DIR%&quot; >nul
copy /Y "%~dp0plugin\manifest.json" "%PLUGIN_DIR%&quot; >nul
echo    [OK] Server plugin installed

REM Install UI extension
echo 2. Installing UI extension...
set /p INSTALL_ALL="   Install for all users? (y/n, default: n): "

if /i "%INSTALL_ALL%"=="y" (
    set "EXTENSION_DIR=%SILLYTAVERN_DIR%\public\scripts\extensions\third-party\replicate"
    echo    Installing for all users...
) else (
    set "EXTENSION_DIR=%SILLYTAVERN_DIR%\data\default-user\extensions\replicate"
    echo    Installing for current user...
)

if not exist "%EXTENSION_DIR%" mkdir "%EXTENSION_DIR%"
copy /Y "%~dp0extension\index.js" "%EXTENSION_DIR%&quot; >nul
copy /Y "%~dp0extension\manifest.json" "%EXTENSION_DIR%&quot; >nul
copy /Y "%~dp0extension\style.css" "%EXTENSION_DIR%&quot; >nul
echo    [OK] UI extension installed

REM Install dependencies
echo 3. Installing dependencies...
cd /d "%SILLYTAVERN_DIR%"
where npm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    call npm install node-fetch
    echo    [OK] Dependencies installed
) else (
    echo    [WARNING] npm not found. Please install node-fetch manually:
    echo      cd %SILLYTAVERN_DIR% ^&^& npm install node-fetch
)

REM Check config.yaml
echo 4. Checking configuration...
set CONFIG_FILE=%SILLYTAVERN_DIR%\config.yaml
if exist "%CONFIG_FILE%" (
    findstr /C:"enableServerPlugins: true" "%CONFIG_FILE%" >nul
    if %ERRORLEVEL% EQU 0 (
        echo    [OK] Server plugins already enabled
    ) else (
        echo    [WARNING] Server plugins not enabled in config.yaml
        echo    Please set enableServerPlugins: true in config.yaml
    )
) else (
    echo    [WARNING] config.yaml not found
)

echo.
echo ================================================
echo Installation Complete!
echo ================================================
echo.
echo Next steps:
echo 1. Restart SillyTavern
echo 2. Open SillyTavern in your browser
echo 3. Go to Extensions ^> Replicate Image Generation
echo 4. Enter your Replicate API token
echo 5. Click 'Test Connection'
echo 6. Click 'Save Settings'
echo.
echo Get your API token from:
echo https://replicate.com/account/api-tokens
echo.
echo For more information, see README.md
echo.
pause