@echo off
title MahAI Frontend (port 3000)
setlocal

:: project root = folder of this file (no hardcoded path)
set "ROOT=%~dp0"
cd /d "%ROOT%frontend"

:: auto-install node_modules if missing (first run only)
if not exist "node_modules" (
    echo Installing frontend dependencies ... please wait
    call npm install
)

echo Starting frontend on http://localhost:3000 ...
call npm run dev
pause
