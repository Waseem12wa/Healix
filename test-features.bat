@echo off
REM ============================================
REM Healix Feature Testing Script (Windows)
REM Tests all features: DFI, DDI, Alternatives, Side Effects, etc.
REM ============================================

setlocal enabledelayedexpansion

echo.
echo ====================================
echo 🧪 Healix Feature Testing Script
echo ====================================
echo.

REM Configuration
set "API_URL=http://localhost:5000/api"
set "TIMEOUT=30"

REM Function to test endpoint
:test_endpoint
set "name=%~1"
set "method=%~2"
set "endpoint=%~3"
set "data=%~4"

echo.
echo Testing: %name%
echo  Endpoint: %method% %endpoint%

if "%method%"=="POST" (
    curl -s -X POST "%API_URL%%endpoint%" ^
        -H "Content-Type: application/json" ^
        -d "%data%" --connect-timeout %TIMEOUT%
) else (
    curl -s -X GET "%API_URL%%endpoint%" ^
        --connect-timeout %TIMEOUT%
)

echo.
exit /b

REM ============================================
REM TEST SUITE
REM ============================================

echo.
echo 1️⃣  CHECKING SERVICE HEALTH
echo ====================================
echo.

echo Testing API Server...
call curl -s http://localhost:5000/api/health

echo.
echo Testing DDI Service...
call curl -s http://localhost:5000/api/ddi/health

echo.
echo Testing DFI Service...
call curl -s http://localhost:5000/api/dfi/health

echo.
echo Testing Alternative Service...
call curl -s http://localhost:5000/api/alternative/health

echo.
echo Testing Side Effect Service...
call curl -s http://localhost:5000/api/side-effects/health

echo.
echo.
echo 2️⃣  TESTING DRUG-FOOD INTERACTIONS
echo ====================================
echo.

echo Testing: Paracetamol + Grapefruit
curl -s -X POST "http://localhost:5000/api/dfi/predict" ^
    -H "Content-Type: application/json" ^
    -d "{\"medicine\":\"paracetamol\",\"food\":\"grapefruit\"}"

echo.
echo.
echo Testing: Aspirin + Alcohol
curl -s -X POST "http://localhost:5000/api/dfi/predict" ^
    -H "Content-Type: application/json" ^
    -d "{\"medicine\":\"aspirin\",\"food\":\"alcohol\"}"

echo.
echo.
echo 3️⃣  TESTING DRUG-DRUG INTERACTIONS
echo ====================================
echo.

echo Testing: Paracetamol + Metformin
curl -s -X POST "http://localhost:5000/api/ddi/predict" ^
    -H "Content-Type: application/json" ^
    -d "{\"medicine1\":\"paracetamol\",\"medicine2\":\"metformin\"}"

echo.
echo.
echo 4️⃣  TESTING DRUG ALTERNATIVES
echo ====================================
echo.

echo Testing: Paracetamol Alternatives
curl -s -X POST "http://localhost:5000/api/alternative/recommend" ^
    -H "Content-Type: application/json" ^
    -d "{\"medicine\":\"paracetamol\",\"top_n\":5}"

echo.
echo.
echo Testing: Aspirin Alternatives
curl -s -X POST "http://localhost:5000/api/alternative/recommend" ^
    -H "Content-Type: application/json" ^
    -d "{\"medicine\":\"aspirin\",\"top_n\":5}"

echo.
echo.
echo 5️⃣  TESTING SIDE EFFECTS
echo ====================================
echo.

echo Testing: Ibuprofen Side Effects
curl -s -X POST "http://localhost:5000/api/side-effects/predict" ^
    -H "Content-Type: application/json" ^
    -d "{\"medicine\":\"ibuprofen\"}"

echo.
echo.
echo 6️⃣  TESTING MEDICAL RECORD SUMMARIZATION
echo ====================================
echo.

echo Testing: Medical Record Summarization
curl -s -X POST "http://localhost:5000/api/medrec/summarize" ^
    -H "Content-Type: application/json" ^
    -d "{\"record\":\"Patient presented with fever and cough. Diagnosed with pneumonia. Treated with Amoxicillin 500mg twice daily.\"}"

echo.
echo.
echo 7️⃣  TESTING AI HEALTH ASSISTANT
echo ====================================
echo.

echo Testing: AI Chat - Side Effects Question
curl -s -X POST "http://localhost:5000/api/assistant/chat" ^
    -H "Content-Type: application/json" ^
    -d "{\"query\":\"What are the side effects of Aspirin?\"}"

echo.
echo.
echo 8️⃣  TESTING MEDICINE SHOP
echo ====================================
echo.

echo Testing: Get Medicines
curl -s "http://localhost:5000/api/payments/medicines?limit=10"

echo.
echo.
echo 9️⃣  TESTING SEARCH
echo ====================================
echo.

echo Testing: Search Medicines
curl -s "http://localhost:5000/api/alternative/search?query=asp"

echo.
echo.
echo 🔟  TESTING AVAILABLE MEDICINES LIST
echo ====================================
echo.

echo Testing: List All Medicines
curl -s "http://localhost:5000/api/alternative/available-medicines"

echo.
echo.
echo.
echo ====================================
echo 🧪 Testing Complete!
echo ====================================
echo.
echo ✅ All tests completed. Review results above.
echo.
echo Next steps:
echo  - Missing services? Run: cd server ^&^& npm start
echo  - Need to seed medicines? Run: node scripts/seed-medicines.js
echo  - View logs in terminal where npm start is running
echo.
pause
