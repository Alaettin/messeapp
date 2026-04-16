@echo off
title NeoPass
cd /d "%~dp0"
set DB_PATH=./data/db/messepass.db
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)
npm run dev
