@echo off
title RO Closure Tool
color 0A

echo.
echo  =============================================
echo   RO Monthly Closure Tool
echo  =============================================
echo   Admin:       admin / admin123
echo   Accountants: [username] / changeme
echo  =============================================
echo.

cd /d "%~dp0"

:: Find node.exe
set NODEEXE=
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set NODEEXE=node
) else if exist "C:\Program Files\nodejs\node.exe" (
    set NODEEXE="C:\Program Files\nodejs\node.exe"
) else if exist "C:\Program Files (x86)\nodejs\node.exe" (
    set NODEEXE="C:\Program Files (x86)\nodejs\node.exe"
) else (
    echo ERROR: Node.js not found!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: Kill any existing server on port 3000
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3000 "') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

:: Install dependencies if needed
if not exist node_modules (
    echo Installing dependencies, please wait...
    %NODEEXE% ..\..\..\AppData\Roaming\npm\npm-cli.js install 2>nul || npm install
    echo.
)

echo Server starting at http://localhost:3000
echo Keep this window open while using the tool.
echo Press Ctrl+C to stop.
echo.

timeout /t 2 /nobreak >nul
start "" http://localhost:3000
%NODEEXE% server.js

echo.
echo Server stopped.
pause
