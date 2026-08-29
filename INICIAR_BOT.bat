@echo off
title Chamical Candy Shop - WhatsApp Bot & Servidor Local
color 0b
cd /d "%~dp0"
echo ============================================================
echo      🍬 CSC CANDY SHOP - SERVIDOR Y BOT DE WHATSAPP 🍭
echo ============================================================
echo.
echo Verificando y liberando puerto 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do taskkill /f /pid %%a >nul 2>&1
echo.
echo Iniciando servidor local y conectando WhatsApp Bot...
echo La sesion se mantendra activa y respondiendo mientras esta ventana este abierta.
echo.
npm run server
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Presiona cualquier tecla para reintentar...
    pause >nul
)
