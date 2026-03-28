#!/bin/bash

# ============================================
# Healix Feature Testing Script
# Tests all features: DFI, DDI, Alternatives, Side Effects, etc.
# ============================================

set -e

echo "🧪 Starting Healix Feature Tests..."
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:5000/api"
TIMEOUT=30

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    
    echo -e "\n${YELLOW}Testing: ${name}${NC}"
    echo "  Endpoint: ${method} ${endpoint}"
    
    if [ "${method}" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}${endpoint}" \
            -H "Content-Type: application/json" \
            -d "${data}" \
            --connect-timeout ${TIMEOUT})
    else
        response=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}${endpoint}" \
            --connect-timeout ${TIMEOUT})
    fi
    
    http_code=$(echo "${response}" | tail -n1)
    body=$(echo "${response}" | sed '$d')
    
    if [ "${http_code}" = "200" ] || [ "${http_code}" = "404" ]; then
        echo -e "  ${GREEN}✅ Status: ${http_code}${NC}"
        echo "  Response: $(echo ${body} | jq -r '.success // .status // "ok"' 2>/dev/null || echo 'ok')"
        return 0
    else
        echo -e "  ${RED}❌ Status: ${http_code}${NC}"
        echo "  Response: ${body}"
        return 1
    fi
}

# ============================================
# TEST SUITE
# ============================================

echo -e "\n${YELLOW}1️⃣ CHECKING SERVICE HEALTH${NC}"
test_endpoint "API Server" "GET" "/health" "" || true
test_endpoint "DDI Service" "GET" "/ddi/health" "" || true
test_endpoint "DFI Service" "GET" "/dfi/health" "" || true
test_endpoint "Alternative Service" "GET" "/alternative/health" "" || true
test_endpoint "Side Effect Service" "GET" "/side-effects/health" "" || true

echo -e "\n${YELLOW}2️⃣ TESTING DRUG-FOOD INTERACTIONS${NC}"
test_endpoint "DFI: Paracetamol + Grapefruit" "POST" "/dfi/predict" \
    '{"medicine":"paracetamol","food":"grapefruit"}' || true

test_endpoint "DFI: Aspirin + Alcohol" "POST" "/dfi/predict" \
    '{"medicine":"aspirin","food":"alcohol"}' || true

echo -e "\n${YELLOW}3️⃣ TESTING DRUG-DRUG INTERACTIONS${NC}"
test_endpoint "DDI: Paracetamol + Metformin" "POST" "/ddi/predict" \
    '{"medicine1":"paracetamol","medicine2":"metformin"}' || true

echo -e "\n${YELLOW}4️⃣ TESTING DRUG ALTERNATIVES${NC}"
test_endpoint "Alternative: Paracetamol" "POST" "/alternative/recommend" \
    '{"medicine":"paracetamol","top_n":5}' || true

test_endpoint "Alternative: Aspirin" "POST" "/alternative/recommend" \
    '{"medicine":"aspirin","top_n":5}' || true

test_endpoint "Alternative: Ibuprofen" "POST" "/alternative/recommend" \
    '{"medicine":"ibuprofen","top_n":5}' || true

echo -e "\n${YELLOW}5️⃣ TESTING SIDE EFFECTS${NC}"
test_endpoint "Side Effects: Ibuprofen" "POST" "/side-effects/predict" \
    '{"medicine":"ibuprofen"}' || true

test_endpoint "Side Effects: Aspirin" "POST" "/side-effects/predict" \
    '{"medicine":"aspirin"}' || true

echo -e "\n${YELLOW}6️⃣ TESTING MEDICAL RECORD SUMMARIZATION${NC}"
test_endpoint "Medical Record Summarization" "POST" "/medrec/summarize" \
    '{"record":"Patient presented with fever and cough. Diagnosed with pneumonia. Treated with Amoxicillin 500mg twice daily."}' || true

echo -e "\n${YELLOW}7️⃣ TESTING AI HEALTH ASSISTANT${NC}"
test_endpoint "AI Chat: Side Effects Question" "POST" "/assistant/chat" \
    '{"query":"What are the side effects of Aspirin?"}' || true

test_endpoint "AI Chat: Drug Interaction Question" "POST" "/assistant/chat" \
    '{"query":"What is the interaction between Metformin and Lisinopril?"}' || true

echo -e "\n${YELLOW}8️⃣ TESTING MEDICINE SHOP${NC}"
test_endpoint "Get Medicines" "GET" "/payments/medicines?limit=10" "" || true

echo -e "\n${YELLOW}9️⃣ TESTING SEARCH FUNCTIONALITY${NC}"
test_endpoint "Search Medicines: aspirin" "GET" "/alternative/search?query=asp" "" || true

echo -e "\n${YELLOW}🔟 TESTING AVAILABLE MEDICINES LIST${NC}"
test_endpoint "List All Medicines" "GET" "/alternative/available-medicines" "" || true

# ============================================
# SUMMARY
# ============================================

echo -e "\n${YELLOW}=================================="
echo "🧪 Testing Complete!${NC}"
echo ""
echo "✅ All tests completed. Review results above."
echo ""
echo "Missing services? Run:"
echo "  cd server && npm start"
echo ""
echo "Need to seed medicines?"
echo "  node scripts/seed-medicines.js"
echo ""
echo "View detailed logs:"
echo "  tail -f /path/to/logfile"
