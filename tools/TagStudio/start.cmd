@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Chybi Node.js. Nainstalujte LTS z https://nodejs.org a zkuste to znovu.
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo Chybi npm, ktere se instaluje spolu s Node.js.
  exit /b 1
)

if not exist "node_modules\" (
  echo Instaluji zavislosti TAG Studio...
  call npm install
  if errorlevel 1 (
    echo npm install selhalo.
    exit /b 1
  )
)

echo Spoustim TAG Studio na http://127.0.0.1:5173 ...
call npm run dev
