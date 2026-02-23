@echo off
echo ============================================
echo   EduScheduler - Starting Dev Environment
echo ============================================

:: Start Backend (Flask)
echo [1/2] Starting Flask backend on port 5000...
start "Flask Backend" cmd /k "cd /d %~dp0backend && python app.py"

:: Short delay to let backend initialize
timeout /t 3 /nobreak > nul

:: Start Frontend (Vite)
echo [2/2] Starting Vite frontend on port 5173...
start "Vite Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers are starting in separate windows.
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:5173
echo.
echo Press any key to close this window...
pause > nul
