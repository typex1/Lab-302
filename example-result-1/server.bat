@echo off
setlocal

set PORT=8080

netstat -an | findstr :%PORT% | findstr LISTENING >nul
if %ERRORLEVEL% EQU 0 (
  echo Port %PORT% is already in use 1>&2
  exit /b 1
)

cd /d "%~dp0"
python -m http.server %PORT%
