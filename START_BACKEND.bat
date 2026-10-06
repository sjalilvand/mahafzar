@echo off
title MahAI Backend (port 5000)
cd /d E:\mahafzar-portal\backend
"E:\mahafzar-portal\.venv\Scripts\python.exe" run_waitress.py
echo.
echo Backend exited - check backend\backend.log
pause
