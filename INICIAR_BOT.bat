@echo off
title Chamical Candy Shop - WhatsApp Bot & Servidor Local
color 0b
cd /d "%~dp0"
echo ============================================================
echo      🍬 CSC CANDY SHOP - SERVIDOR Y BOT DE WHATSAPP 🍭
echo ============================================================
echo.
echo Iniciando servidor local y conectando WhatsApp Bot...
echo La sesion se mantendra activa y respondiendo mientras esta ventana este abierta.
echo Puedes minimizar esta ventana mientras usas tu PC.
echo.
npm run server
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Ocurrio un error al iniciar. Presiona cualquier tecla para reintentar...
    pause >nul
)
