@echo off
title MahAI - Start All
setlocal

:: project root = folder of this file (no hardcoded path)
set "ROOT=%~dp0"

start "MahAI-Backend"  cmd /k "%ROOT%START_BACKEND.bat"
start "MahAI-Frontend" cmd /k "%ROOT%START_FRONTEND.bat"

echo Both windows launched.
echo Backend:  http://127.0.0.1:5000
echo Frontend: http://localhost:3000
timeout /t 5 >nul
