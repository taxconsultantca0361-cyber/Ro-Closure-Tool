@echo off
title RO Closure Tool - Internet Access
color 0A
echo.
echo  =============================================
echo   RO Monthly Closure Tool - INTERNET ACCESS
echo  =============================================
echo.

cd /d "%~dp0"

:: Kill existing server on port 3000
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3000 "') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

:: Start the server in background
start /B "RO Server" "C:\Program Files\nodejs\node.exe" server.js

timeout /t 2 /nobreak >nul

echo  Server started locally.
echo.
echo  Starting ngrok tunnel...
echo  =============================================
echo  YOUR PUBLIC URL WILL APPEAR BELOW
echo  Share the https:// link with your accountants
echo  =============================================
echo.

ngrok.exe http --domain=anastacia-polite-emmalynn.ngrok-free.dev 3000
pause
