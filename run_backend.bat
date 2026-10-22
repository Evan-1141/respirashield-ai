@echo off
cd /d "%~dp0backend"
echo Starting RespiraShield AI FastAPI Backend on http://127.0.0.1:8000 ...
.\.venv\Scripts\uvicorn.exe main:app --reload --host 127.0.0.1 --port 8000
pause
