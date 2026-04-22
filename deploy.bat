@echo off
echo Deploying to Netlify...
cd /d "%~dp0"
netlify deploy --prod --dir .
