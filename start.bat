@echo off
echo Starting Price Scraper Web Application...
echo.

REM Start backend
echo [1/2] Starting Backend API...
start "Backend API" cmd /k "cd backend && venv\Scripts\activate && python app.py"

timeout /t 5

REM Start frontend
echo [2/2] Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   Price Scraper is starting...
echo ========================================
echo.
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo.
echo   Press any key to stop all services...
pause

REM Stop services
taskkill /FI "WindowTitle eq Backend API*" /T /F
taskkill /FI "WindowTitle eq Frontend*" /T /F
