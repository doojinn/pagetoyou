@echo off
cd /d "%~dp0.."
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 24 or newer.
  pause
  exit /b 1
)
node scripts/build-memory-wall.cjs
if errorlevel 1 (
  echo Failed to build the viewer. Please keep this window open.
  pause
  exit /b 1
)
start "" "%cd%\.data\memory-wall\Chat-Galaxy.html"
