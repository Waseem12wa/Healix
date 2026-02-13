@echo off
echo ========================================
echo Starting DDI Service
echo ========================================
echo.
echo This will start the Python DDI microservice on port 5001
echo Make sure you have installed Python dependencies:
echo   pip install -r requirements.txt
echo.
echo Press Ctrl+C to stop the service
echo ========================================
echo.

cd /d "%~dp0services"
python ddi_service.py

pause
