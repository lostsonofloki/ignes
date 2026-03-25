@echo off
title Ignes v1.3.6
echo.
echo ========================================
echo   IG NES - Movie Logging Platform
echo   Version: 1.3.6 - Mobile Header Fixed
echo ========================================
echo.
cd /d "%~dp0"

if not exist "node_modules" (
    echo [!] node_modules not found. Installing dependencies...
    call npm install
    echo.
)

echo [+] Starting Ignes development server...
echo [+] Opening http://localhost:3000
echo.
start http://localhost:3000
call npm run dev

pause
