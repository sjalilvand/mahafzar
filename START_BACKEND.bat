@echo off
title MahAI Backend (port 5000)
setlocal

:: project root = folder of this file (no hardcoded path)
set "ROOT=%~dp0"

:: find venv python: root first, then backend; auto-create if missing
set "PY="
if exist "%ROOT%.venv\Scripts\python.exe" set "PY=%ROOT%.venv\Scripts\python.exe"
if not defined PY if exist "%ROOT%backend\.venv\Scripts\python.exe" set "PY=%ROOT%backend\.venv\Scripts\python.exe"

if not defined PY (
    echo Creating virtual environment at %ROOT%.venv ...
    python -m venv "%ROOT%.venv"
    if errorlevel 1 (
        echo ERROR: Python not found. Please install Python 3.10+ first.
        pause
        exit /b 1
    )
    set "PY=%ROOT%.venv\Scripts\python.exe"
)

echo Using Python: %PY%
cd /d "%ROOT%backend"

:: quick deps check; auto-install if missing (first run only)
"%PY%" -c "import flask, waitress, requests, numpy, sklearn, flask_migrate, PIL" >nul 2>&1
if errorlevel 1 (
    echo Installing backend dependencies ... please wait
    "%PY%" -m pip install --disable-pip-version-check -r requirements.txt
)

echo Starting backend on http://127.0.0.1:5000 ...
"%PY%" run_waitress.py
echo.
echo Backend exited - check backend\backend.log
pause
