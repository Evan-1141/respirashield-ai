@echo off
cd /d "%~dp0backend"
rem Muat variabel dari backend\.env (KEY=VALUE per baris, tidak ikut di-commit)
if exist .env for /f "usebackq eol=# tokens=1,* delims==" %%a in (".env") do set "%%a=%%b"
if not defined DEVICE_AUTH_TOKEN (
  echo [ERROR] DEVICE_AUTH_TOKEN belum diset. Buat file backend\.env berisi:
  echo     DEVICE_AUTH_TOKEN=token-acak-kamu
  echo atau DEVICE_AUTH_TOKEN=none untuk mematikan autentikasi saat development lokal.
  pause
  exit /b 1
)
if not defined AUTH_SECRET (
  echo [ERROR] AUTH_SECRET belum diset. Tambahkan ke backend\.env string acak panjang, mis.:
  echo     AUTH_SECRET=hasil-dari-python -c "import secrets; print(secrets.token_urlsafe(48))"
  pause
  exit /b 1
)
echo Starting RespiraShield AI FastAPI Backend on http://127.0.0.1:8000 ...
.\.venv\Scripts\uvicorn.exe main:app --reload --host 127.0.0.1 --port 8000
pause
