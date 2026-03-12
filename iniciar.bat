@echo off
title Maestro de Musica - Servidor IA
set SERVER_DIR=%~dp0\server

echo 🎵 Iniciando el servidor de Inteligencia Artificial...
echo.

cd /d "%SERVER_DIR%"

:: Verifica si node_modules existe; si no, ejecuta npm install primero
if not exist "node_modules\" (
    echo Instalando dependencias necesarias...
    call npm install
)

:: Inicia el servidor en segundo plano usando start
start "Servidor Backend IA" cmd /c "npm start"

echo ✓ Servidor iniciado. Abriendo la plataforma...
echo.

:: Vuelve a la carpeta principal
cd /d "%~dp0"

:: Abre la página en el navegador predeterminado
start "" "index.html"

:: Mantener abierta unos segundos para que se lean los mensajes
timeout /t 5 > nul
