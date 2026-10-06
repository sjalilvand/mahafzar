@echo off
start "MahAI-Backend"  cmd /k E:\mahafzar-portal\START_BACKEND.bat
start "MahAI-Frontend" cmd /k E:\mahafzar-portal\START_FRONTEND.bat
echo Both windows launched.
timeout /t 3 >nul
