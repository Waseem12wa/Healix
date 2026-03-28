# 🔗 HEALIX API QUICK REFERENCE

**Base URL**: `http://localhost:5000/api`  
**Version**: 1.0  
**Status**: ✅ ALL ENDPOINTS OPERATIONAL

---

## 📋 ENDPOINT SUMMARY

| Service | Endpoint | Method | Status |
|---------|----------|--------|--------|
| **Health** | `/health` | GET | ✅ |
| **DFI** | `/dfi/predict` | POST | ✅ FIXED |
| **DDI** | `/ddi/predict` | POST | ✅ |
| **Alternatives** | `/alternative/recommend` | POST | ✅ |
| **Side Effects** | `/side-effects/predict` | POST | ✅ |
| **Medical Records** | `/medrec/summarize` | POST | ✅ NEW |
| **AI Assistant** | `/assistant/chat` | POST | ✅ |
| **Medicine Shop** | `/payments/medicines` | GET | ✅ |

---

## 📡 ALL ENDPOINTS DETAILED

### 1. Health Check
```
GET /health
```
**Response**:
```json
{
  "success": true,
  "status": "Connected",
  "database": "healix",
  "services": {
    "ddi": true,
    "dfi": true,
    "alt": true,
    "side": true,
    "health": true,
    "medrec": true
  }
}
```

---

### 2. Drug-Food Interactions (DFI)
```
POST /dfi/predict
Content-Type: application/json

{
  "medicine": "paracetamol",
  "food": "grapefruit"
}
```

**Response** (✅ NOW RETURNS VALID JSON):
```json
{
  "success": true,
  "medicine": "paracetamol",
  "food": "grapefruit",
  "percentage": 2.73,
  "severity": "Low",
  "severity_label": "Low Risk",
  "details": {
    "mechanism": "...",
    "symptoms": "...",
    "recommendations": "..."
  }
}
```

**Status**: ✅ FIXED - JSON serialization working

---

### 3. Drug-Drug Interactions (DDI)
```
POST /ddi/predict
Content-Type: application/json

{
  "medicine1": "paracetamol",
  "medicine2": "metformin"
}
```

**Response**:
```json
{
  "success": true,
  "medicine1": "paracetamol",
  "medicine2": "metformin",
  "probability": 0.0286,
  "percentage": 2.86,
  "severity": "None"
}
```

**Status**: ✅ Working

---

### 4. Drug Alternatives
```
POST /alternative/recommend
Content-Type: application/json

{
  "medicine": "paracetamol",
  "top_n": 5
}
```

**Response**:
```json
{
  "success": true,
  "medicine": "paracetamol",
  "alternatives": [
    {
      "name": "Aspirin",
      "similarity": 95.0,
      "category": "Analgesic",
      "therapeutic_use": "Pain relief",
      "mechanism": "Anti-inflammatory, antiplatelet effects",
      "atc_code": "N02BA01"
    },
    {
      "name": "Ibuprofen",
      "similarity": 85.0,
      "category": "NSAID",
      "therapeutic_use": "Pain relief, anti-inflammation"
    }
  ],
  "explanation": "Alternatives for paracetamol based on active ingredients and therapeutic use"
}
```

**Status**: ✅ Working with 17+ medicines

---

### 5. Side Effects Prediction
```
POST /side-effects/predict
Content-Type: application/json

{
  "medicine": "ibuprofen"
}
```

**Response**:
```json
{
  "success": true,
  "medicine": "ibuprofen",
  "side_effects": [
    {
      "effect": "headache",
      "probability": 0.92,
      "category": "CNS"
    },
    {
      "effect": "fatigue",
      "probability": 0.87,
      "category": "General"
    },
    {
      "effect": "allergic reaction",
      "probability": 0.85,
      "category": "Allergic"
    }
  ]
}
```

**Status**: ✅ Working

---

### 6. Medical Record Summarization (✅ NEW)
```
POST /medrec/summarize
Content-Type: application/json

{
  "record": "Patient presented with fever, cough, and shortness of breath. Diagnosed with pneumonia. Treated with Amoxicillin 500mg twice daily for 7 days. Chest X-ray shows infiltrates.",
  "max_length": 100,
  "min_length": 30,
  "extract_entities": true
}
```

**Response**:
```json
{
  "success": true,
  "summary": "Patient with pneumonia showing fever and cough treated with Amoxicillin",
  "entities": {
    "diagnoses": ["Pneumonia"],
    "medications": ["Amoxicillin"],
    "symptoms": ["Fever", "Cough", "Shortness of Breath"],
    "procedures": ["Chest X-ray"],
    "vitals": []
  },
  "original_length": 238,
  "summary_length": 68,
  "compression_ratio": "28.6%",
  "processing_time_ms": "1245.50"
}
```

**Status**: ✅ FULLY OPERATIONAL

**Note**: Supports batch processing with `/batch-summarize` endpoint

---

### 7. AI Health Assistant
```
POST /assistant/chat
Content-Type: application/json

{
  "query": "What are the side effects of Aspirin?",
  "user_id": "optional_user_id"
}
```

**Response**:
```json
{
  "success": true,
  "query": "What are the side effects of Aspirin?",
  "response": "Aspirin can cause...",
  "routed_to": "side-effects",
  "confidence": 0.95
}
```

**Status**: ✅ Online, routing queries

---

### 8. Medicine Shop - Get Medicines
```
GET /payments/medicines?search=aspirin&limit=10
```

**Response**:
```json
{
  "success": true,
  "medicines": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "medicineName": "Aspirin",
      "genericName": "Acetylsalicylic acid",
      "category": "Analgesic",
      "sellingPrice": 50,
      "costPrice": 20,
      "quantity": 1000,
      "imageUrl": "https://example.com/aspirin.jpg",
      "expiryDate": "2025-12-31"
    }
  ],
  "total": 1
}
```

**Status**: ✅ Working

---

### 9. Search Medicines
```
GET /alternative/search?query=aspirin
```

**Response**:
```json
{
  "success": true,
  "query": "aspirin",
  "matches": [
    {
      "brand_name": "Aspirin",
      "generic_name": "Acetylsalicylic acid",
      "category": "Analgesic/Antipyretic"
    }
  ],
  "total": 1
}
```

**Status**: ✅ Working

---

### 10. List Available Medicines
```
GET /alternative/available-medicines
```

**Response**:
```json
{
  "success": true,
  "total_medicines": 17,
  "medicines": [
    {
      "brand_name": "Aspirin",
      "generic_name": "Acetylsalicylic acid",
      "category": "Analgesic/Antipyretic",
      "therapeutic_use": "Pain relief, fever reduction, inflammation management"
    },
    ...
  ]
}
```

**Status**: ✅ Working

---

## 🚨 ERROR RESPONSES

### Invalid Request
```json
{
  "success": false,
  "error": "Missing required field: medicine",
  "status_code": 400
}
```

### Service Unavailable
```json
{
  "success": false,
  "error": "Service not available",
  "status_code": 503
}
```

### Not Found
```json
{
  "success": false,
  "error": "Medicine 'xyz' not found in database",
  "status_code": 404,
  "available_medicines": ["aspirin", "ibuprofen", "paracetamol", ...]
}
```

---

## 🧪 QUICK TEST COMMANDS

### Test All Endpoints:

```bash
# Windows
test-features.bat

# Linux/Mac
bash test-features.sh
```

### Individual Tests:

```bash
# DFI
curl -X POST http://localhost:5000/api/dfi/predict \
  -H "Content-Type: application/json" \
  -d '{"medicine":"paracetamol","food":"grapefruit"}'

# DDI
curl -X POST http://localhost:5000/api/ddi/predict \
  -H "Content-Type: application/json" \
  -d '{"medicine1":"aspirin","medicine2":"metformin"}'

# Alternatives
curl -X POST http://localhost:5000/api/alternative/recommend \
  -H "Content-Type: application/json" \
  -d '{"medicine":"paracetamol","top_n":5}'

# Medical Summary
curl -X POST http://localhost:5000/api/medrec/summarize \
  -H "Content-Type: application/json" \
  -d '{"record":"Patient fever, treated with Amoxicillin"}'

# Health Check
curl http://localhost:5000/api/health
```

---

## 📊 RESPONSE CODES

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Medicine found, prediction made |
| 400 | Bad Request | Missing required fields |
| 404 | Not Found | Medicine not in database |
| 500 | Server Error | Model processing failed |
| 503 | Service Unavailable | Microservice down |

---

## 🔄 REQUEST/RESPONSE FLOW

```
User Input (React Frontend)
         ↓
Express API (Port 3000)
         ↓
         ├→ DFI Microservice (Port 5002)
         ├→ DDI Microservice (Port 5001)
         ├→ Alternative Service (Port 5003)
         ├→ Side Effects Service (Port 5004)
         ├→ Health Assistant (Port 5006)
         ├→ Medical Records Service (Port 5005)
         └→ MongoDB (Port 27017)
         ↓
JSON Response
         ↓
React Frontend Display
```

---

## 📈 PERFORMANCE NOTES

- **DFI Prediction**: ~500ms
- **Alternative Generation**: ~200ms
- **Side Effects**: ~20s (first load), <1s (cached)
- **Medical Summary**: 5-30s per record (depends on length)
- **Med List**: <100ms (with indices)

---

## ✅ ALL FEATURES VERIFIED

| Feature | Response | Status |
|---------|----------|--------|
| DFI Results | JSON 200 OK | ✅ |
| DDI Predictions | JSON 200 OK | ✅ |
| Drug Alternatives | JSON 200 OK | ✅ |
| Side Effects | JSON 200 OK | ✅ |
| Med Summarization | JSON 200 OK | ✅ NEW |
| AI Assistant | JSON 200 OK | ✅ |
| Medicine Shop | JSON 200 OK | ✅ |
| Search | JSON 200 OK | ✅ |
| Error Handling | Proper codes | ✅ |
| MongoDB | Connected | ✅ |

---

**Generated**: March 28, 2026  
**System Status**: ✅ FULLY OPERATIONAL  
**All 7 Microservices**: ✅ ONLINE & COORDINATED
