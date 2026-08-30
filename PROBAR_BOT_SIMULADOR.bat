@echo off
title Chamical Candy Shop - Simulador Aislado de WhatsApp Bot
color 0a
cd /d "%~dp0"
echo ============================================================
echo      🍬 CSC CANDY SHOP - SIMULADOR AISLADO DE BOT 🍭
echo ============================================================
echo.
echo Iniciando simulador interactivo de chat de WhatsApp...
echo.
npx tsx src/server/simulador_whatsapp.ts
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Presiona cualquier tecla para reintentar...
    pause >nul
)
