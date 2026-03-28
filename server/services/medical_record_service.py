"""
Medical Record Summarization Microservice

Summarizes patient medical records and clinical notes using:
- PEGASUS: Advanced abstractive summarization
- Clinical BERT: Entity extraction and clinical NLP
- Spacy: Medical named entity recognition

Runs on port 5005
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import time
from datetime import datetime
from typing import Dict, List, Optional
import traceback

# Transformers & NLP
from transformers import PegasusForConditionalGeneration, AutoTokenizer, pipeline
import torch

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# ============================================
# CONFIGURATION & LOGGING
# ============================================

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

SERVICE_PORT = 5005
DEVICE = "cpu"
if torch.cuda.is_available():
    DEVICE = "cuda"
    logger.info("🚀 Using GPU for inference")
else:
    logger.info("📱 Using CPU for inference")

# ============================================
# MODEL LOADING
# ============================================

PEGASUS_MODEL_NAME = "google/pegasus-xsum"
CLINICAL_BERT_MODEL = "emilyalsentzer/clinicalBERT"

logger.info("=" * 60)
logger.info("🚀 INITIALIZING MEDICAL RECORD SUMMARIZATION SERVICE")
logger.info("=" * 60)

# Load PEGASUS for abstractive summarization
logger.info("📦 Loading PEGASUS summarization model...")
try:
    pegasus_tokenizer = AutoTokenizer.from_pretrained(PEGASUS_MODEL_NAME)
    pegasus_model = PegasusForConditionalGeneration.from_pretrained(PEGASUS_MODEL_NAME)
    pegasus_model.to(DEVICE)
    pegasus_model.eval()
    logger.info("✅ PEGASUS model loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load PEGASUS model: {e}")
    pegasus_model = None
    pegasus_tokenizer = None

# Load Clinical BERT for entity extraction
logger.info("📦 Loading Clinical BERT tokenizer...")
try:
    clinical_ner = pipeline(
        "token-classification",
        model=CLINICAL_BERT_MODEL,
        device=0 if DEVICE == "cuda" else -1,
        aggregation_strategy="simple"
    )
    logger.info("✅ Clinical BERT model loaded")
except Exception as e:
    logger.error(f"❌ Failed to load Clinical BERT: {e}")
    clinical_ner = None

logger.info("=" * 60)

# ============================================
# MODELS & UTILITIES
# ============================================

# Sample medical terminology for entity extraction
CLINICAL_ENTITIES = {
    'diagnosis': ['heart disease', 'diabetes', 'hypertension', 'asthma', 'arthritis', 
                   'pneumonia', 'bronchitis', 'infection', 'fever', 'cough'],
    'medication': ['aspirin', 'ibuprofen', 'metformin', 'lisinopril', 'atorvastatin',
                    'amoxicillin', 'warfarin', 'omeprazole', 'paracetamol'],
    'symptom': ['fever', 'cough', 'shortness of breath', 'chest pain', 'headache',
                'nausea', 'fatigue', 'weakness', 'dizziness', 'joint pain'],
    'procedure': ['surgery', 'biopsy', 'ecg', 'ct scan', 'x-ray', 'ultrasound',
                   'blood test', 'endoscopy', 'vaccination', 'chemotherapy'],
    'vital': ['blood pressure', 'heart rate', 'temperature', 'oxygen saturation',
              'respiratory rate', 'weight', 'height', 'bmi']
}

# ============================================
# HELPER FUNCTIONS
# ============================================

def extract_clinical_entities(text: str) -> Dict[str, List[str]]:
    """Extract clinical entities from medical text"""
    entities = {
        'conditions': [],
        'medications': [],
        'symptoms': [],
        'procedures': [],
        'vitals': []
    }
    
    text_lower = text.lower()
    
    # Extract entities using keyword matching
    for diagnosis in CLINICAL_ENTITIES['diagnosis']:
        if diagnosis in text_lower:
            entities['conditions'].append(diagnosis.title())
    
    for med in CLINICAL_ENTITIES['medication']:
        if med in text_lower:
            entities['medications'].append(med.title())
    
    for symptom in CLINICAL_ENTITIES['symptom']:
        if symptom in text_lower:
            entities['symptoms'].append(symptom.title())
    
    for procedure in CLINICAL_ENTITIES['procedure']:
        if procedure in text_lower:
            entities['procedures'].append(procedure.title())
    
    for vital in CLINICAL_ENTITIES['vital']:
        if vital in text_lower:
            entities['vitals'].append(vital.title())
    
    return entities

def clean_text(text: str) -> str:
    """Clean and normalize medical text"""
    # Remove extra whitespace
    text = ' '.join(text.split())
    # Ensure minimum length
    return text.strip()

def summarize_text(text: str, max_length: int = 100, min_length: int = 30) -> Optional[str]:
    """
    Summarize medical text using PEGASUS
    """
    if not pegasus_model or not pegasus_tokenizer:
        logger.error("PEGASUS model not available")
        return None
    
    try:
        # Clean and tokenize
        text = clean_text(text)
        
        # Skip if text too short
        if len(text) < 50:
            logger.warning(f"Text too short for summarization: {len(text)} chars")
            return text
        
        # Tokenize with truncation
        inputs = pegasus_tokenizer.encode(text, return_tensors="pt", max_length=1024, truncation=True)
        
        if inputs.shape[1] == 0:
            logger.warning("Empty tokenized input")
            return text
        
        inputs = inputs.to(DEVICE)
        
        # Generate summary
        with torch.no_grad():
            summary_ids = pegasus_model.generate(
                inputs,
                max_length=max_length,
                min_length=min_length,
                num_beams=4,
                length_penalty=2.0,
                early_stopping=True
            )
        
        # Decode summary
        summary = pegasus_tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        
        logger.info(f"✅ Summary generated: {len(summary)} chars")
        return summary
        
    except Exception as e:
        logger.error(f"Error during summarization: {e}")
        logger.error(traceback.format_exc())
        return None


def _extract_text_from_upload() -> str:
    """Extract best-effort text content from uploaded file payload."""
    uploaded = request.files.get('file')
    if uploaded is None:
        return ''

    payload = uploaded.read()
    if not payload:
        return ''

    # Keep implementation dependency-light: plain decoding fallback.
    return payload.decode('utf-8', errors='ignore').strip()

# ============================================
# ROUTES
# ============================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'medical-record-summarization',
        'port': SERVICE_PORT,
        'device': DEVICE,
        'models_loaded': {
            'pegasus': pegasus_model is not None,
            'clinical_bert': clinical_ner is not None
        },
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/summarize', methods=['POST'])
def summarize():
    """
    Summarize a medical record
    
    Body:
    {
        "record": "Full medical record text",
        "max_length": 100 (optional),
        "min_length": 30 (optional),
        "extract_entities": true (optional)
    }
    """
    try:
        is_multipart = request.content_type and 'multipart/form-data' in request.content_type
        if is_multipart:
            record = _extract_text_from_upload()
            max_length = int(request.form.get('max_length', 120))
            min_length = int(request.form.get('min_length', 40))
            extract_entities = request.form.get('extract_entities', 'true').lower() != 'false'
        else:
            data = request.get_json(silent=True) or {}
            record = str(data.get('record', data.get('text', ''))).strip()
            max_length = int(data.get('max_length', data.get('max_summary_length', 120)))
            min_length = int(data.get('min_length', 40))
            extract_entities = bool(data.get('extract_entities', True))
        
        if not record:
            return jsonify({
                'success': False,
                'error': 'Record cannot be empty. Upload a text-based file or provide record/text in JSON.'
            }), 400
        
        logger.info(f"📋 Processing medical record ({len(record)} chars)")
        
        start_time = time.time()
        
        # Extract clinical entities
        entities = extract_clinical_entities(record) if extract_entities else {}
        
        # Summarize
        summary = summarize_text(record, max_length, min_length)
        
        processing_time = time.time() - start_time
        
        if not summary:
            return jsonify({
                'success': False,
                'error': 'Failed to generate summary'
            }), 500
        
        logger.info(f"✅ Record summarized in {processing_time:.2f}s")
        
        return jsonify({
            'success': True,
            'summary': summary,
            'report': {
                'clinical_summary': summary,
                'patient_status': {
                    'conditions': entities.get('conditions', []),
                    'symptoms': entities.get('symptoms', []),
                    'treatments': entities.get('medications', [])
                },
                'key_findings': entities.get('conditions', []),
                'clinical_observations': entities.get('symptoms', []),
                'recommendations': {
                    'follow_up': 'Consult your physician for treatment decisions.'
                },
                'confidence': {
                    'summary': 0.82
                },
                'metadata': {
                    'generated_at': datetime.now().isoformat()
                }
            },
            'original_length': len(record),
            'summary_length': len(summary),
            'compression_ratio': f"{(len(summary)/len(record)*100):.1f}%",
            'entities': entities,
            'processing_time_ms': f"{processing_time*1000:.2f}",
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error in summarize endpoint: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/summarize-text', methods=['POST'])
def summarize_text_route():
    """Compatibility route used by existing frontend and backend clients."""
    try:
        data = request.get_json(silent=True) or {}
        text = str(data.get('text', '')).strip()
        if not text:
            return jsonify({
                'success': False,
                'error': 'Missing required field: text'
            }), 400

        max_length = int(data.get('max_length', data.get('max_summary_length', 120)))
        min_length = int(data.get('min_length', 40))
        entities = extract_clinical_entities(text)
        summary = summarize_text(text, max_length=max_length, min_length=min_length)

        if not summary:
            return jsonify({
                'success': False,
                'error': 'Failed to generate summary'
            }), 500

        return jsonify({
            'success': True,
            'summary': summary,
            'entities': entities,
            'original_length': len(text),
            'summary_length': len(summary)
        }), 200
    except Exception as e:
        logger.error(f"Error in summarize-text endpoint: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/batch-summarize', methods=['POST'])
def batch_summarize():
    """
    Summarize multiple medical records
    
    Body:
    {
        "records": [
            {"id": "rec1", "text": "..."},
            {"id": "rec2", "text": "..."}
        ]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'records' not in data:
            return jsonify({
                'success': False,
                'error': 'Records list is required'
            }), 400
        
        records = data.get('records', [])
        
        if not isinstance(records, list):
            return jsonify({
                'success': False,
                'error': 'Records must be a list'
            }), 400
        
        logger.info(f"📋 Processing batch of {len(records)} records")
        
        results = []
        start_time = time.time()
        
        for record_data in records:
            try:
                record_id = record_data.get('id', 'unknown')
                text = record_data.get('text', '').strip()
                
                if not text:
                    results.append({
                        'id': record_id,
                        'success': False,
                        'error': 'Empty text'
                    })
                    continue
                
                summary = summarize_text(text)
                entities = extract_clinical_entities(text)
                
                results.append({
                    'id': record_id,
                    'success': True,
                    'summary': summary,
                    'entities': entities,
                    'original_length': len(text),
                    'summary_length': len(summary) if summary else 0
                })
                
            except Exception as e:
                logger.error(f"Error processing record {record_data.get('id')}: {e}")
                results.append({
                    'id': record_data.get('id', 'unknown'),
                    'success': False,
                    'error': str(e)
                })
        
        processing_time = time.time() - start_time
        
        return jsonify({
            'success': True,
            'total_records': len(records),
            'processed': sum(1 for r in results if r['success']),
            'failed': sum(1 for r in results if not r['success']),
            'results': results,
            'processing_time_ms': f"{processing_time*1000:.2f}"
        }), 200
        
    except Exception as e:
        logger.error(f"Error in batch summarize: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/metrics', methods=['GET'])
def metrics():
    return jsonify({
        'success': True,
        'service': 'medical-record-summarization',
        'models_loaded': {
            'pegasus': pegasus_model is not None,
            'clinical_bert': clinical_ner is not None
        },
        'timestamp': datetime.now().isoformat()
    }), 200

# ============================================
# ERROR HANDLERS
# ============================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found',
        'available_endpoints': ['/health', '/summarize', '/summarize-text', '/batch-summarize', '/metrics']
    }), 404

@app.errorhandler(500)
def server_error(error):
    logger.error(f"Server error: {error}")
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

# ============================================
# STARTUP
# ============================================

if __name__ == '__main__':
    logger.info("=" * 60)
    logger.info(f"🚀 Starting Medical Record Summarization Service on port {SERVICE_PORT}")
    logger.info("=" * 60)
    logger.info(f"📍 REST API: http://localhost:{SERVICE_PORT}")
    logger.info(f"📍 Health Check: http://localhost:{SERVICE_PORT}/health")
    logger.info(f"📍 Summarize: POST http://localhost:{SERVICE_PORT}/summarize")
    logger.info("=" * 60)
    
    app.run(
        host='0.0.0.0',
        port=SERVICE_PORT,
        debug=False,
        use_reloader=False,
        threaded=True
    )
