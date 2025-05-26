@echo off
echo Starting Chat Application...

:: Start backend
start cmd /k "cd backend\chat && dotnet run"

:: Wait for backend to start
timeout /t 5

:: Start frontend
start cmd /k "cd frontend\chat && npm start"

echo Chat Application started!
echo Backend: http://localhost:5082
echo Frontend: http://localhost:3000
