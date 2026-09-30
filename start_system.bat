@echo off
echo ========================================================
echo   Starting Sari-Sari Store Smart Print & POS System
echo ========================================================
echo.

start "PrintWise Backend API" cmd /k "cd backend && .venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 2 /nobreak >nul

start "PrintWise POS Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak >nul

start http://localhost:5173

echo System is running!
echo Backend API: http://localhost:8000
echo Frontend POS: http://localhost:5173
echo.
pause
