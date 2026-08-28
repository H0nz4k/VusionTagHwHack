$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Chybi Node.js. Nainstalujte LTS z https://nodejs.org a zkuste to znovu."
  exit 1
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Host "Chybi npm, ktere se instaluje spolu s Node.js."
  exit 1
}
if (-not (Test-Path "node_modules")) {
  Write-Host "Instaluji zavislosti TAG Studio..."
  npm install
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
Write-Host "Spoustim TAG Studio na http://127.0.0.1:5173 ..."
npm run dev
