"""
Medical Record Summarization Microservice

Summarizes patient medical records and clinical notes using:
- PEGASUS: Advanced abstractive summarization

Runs on port 5005
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import traceback
import io
import re

# Transformers & NLP
from transformers import PegasusForConditionalGeneration, AutoTokenizer
import torch

from PyPDF2 import PdfReader
from docx import Document
from PIL import Image
import pytesseract
from pdf2image import convert_from_bytes

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

pegasus_model = None
pegasus_tokenizer = None
clinical_ner = None


def ensure_pegasus_model() -> bool:
    """Lazy-load PEGASUS only when summarization endpoints need it."""
    global pegasus_model, pegasus_tokenizer

    if pegasus_model is not None and pegasus_tokenizer is not None:
        return True

    logger.info("📦 Loading PEGASUS summarization model (lazy init)...")
    try:
        pegasus_tokenizer = AutoTokenizer.from_pretrained(PEGASUS_MODEL_NAME)
        pegasus_model = PegasusForConditionalGeneration.from_pretrained(PEGASUS_MODEL_NAME)
        pegasus_model.to(DEVICE)
        pegasus_model.eval()
        logger.info("✅ PEGASUS model loaded successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to load PEGASUS model: {e}")
        pegasus_model = None
        pegasus_tokenizer = None
        return False

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

MEDICAL_KEYWORDS = {
    'diagnosis', 'diagnosed', 'assessment', 'impression', 'symptom', 'symptoms',
    'medication', 'tablet', 'capsule', 'mg', 'dosage', 'bp', 'blood pressure',
    'heart rate', 'pulse', 'temperature', 'treatment', 'prescription',
    'follow-up', 'follow up', 'doctor', 'physician', 'clinic', 'hospital',
    'patient', 'disease', 'condition', 'lab', 'laboratory', 'test', 'report',
    'x-ray', 'ct', 'mri', 'ultrasound', 'allergy', 'history of'
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
    text = text.replace('\x00', ' ')
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def _is_medical_content(text: str) -> Tuple[bool, float, List[str]]:
    """Determine whether input appears to be medical content."""
    if not text:
        return False, 0.0, []

    lower = text.lower()
    matched = [kw for kw in MEDICAL_KEYWORDS if kw in lower]
    score = min(1.0, len(matched) / 8.0)
    has_entities = any(len(v) > 0 for v in extract_clinical_entities(text).values())
    is_medical = score >= 0.25 or has_entities
    return is_medical, score, matched[:20]


def _extract_text_from_pdf(raw: bytes) -> str:
    reader = PdfReader(io.BytesIO(raw))
    pages = []
    for page in reader.pages:
        pages.append(page.extract_text() or '')
    extracted = '\n'.join(pages).strip()

    # OCR fallback for scanned PDFs with little/no embedded text.
    if len(extracted) >= 40:
        return extracted

    try:
        images = convert_from_bytes(raw)
        ocr_pages: List[str] = []
        for img in images:
            try:
                ocr_pages.append(pytesseract.image_to_string(img) or '')
            except Exception as ocr_error:
                logger.warning(f"PDF page OCR failed: {ocr_error}")
        ocr_text = '\n'.join(ocr_pages).strip()
        return ocr_text or extracted
    except Exception as e:
        logger.warning(f"PDF OCR fallback unavailable: {e}")
        return extracted


def _extract_text_from_docx(raw: bytes) -> str:
    document = Document(io.BytesIO(raw))
    paragraphs = [p.text for p in document.paragraphs if p.text and p.text.strip()]
    return '\n'.join(paragraphs).strip()


def _extract_text_from_image(raw: bytes) -> str:
    image = Image.open(io.BytesIO(raw))
    try:
        text = pytesseract.image_to_string(image)
    except Exception as e:
        logger.warning(f"OCR failed: {e}")
        return ''
    return (text or '').strip()

def summarize_text(text: str, max_length: int = 100, min_length: int = 30) -> Optional[str]:
    """
    Summarize medical text using PEGASUS
    """
    if not ensure_pegasus_model():
        logger.error("PEGASUS lazy initialization failed")
        return None

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
        
        model_max_positions = getattr(getattr(pegasus_model, 'config', None), 'max_position_embeddings', 512) or 512
        tokenizer_limit = getattr(pegasus_tokenizer, 'model_max_length', 512)
        safe_input_limit = max(64, min(480, int(model_max_positions) - 2, int(tokenizer_limit)))

        # Chunk long inputs to avoid index overflow in positional embeddings.
        token_ids = pegasus_tokenizer.encode(text, add_special_tokens=False)
        if not token_ids:
            logger.warning("Empty tokenized input")
            return text

        chunk_summaries: List[str] = []
        step = max(64, safe_input_limit - 32)
        for start in range(0, len(token_ids), step):
            chunk_ids = token_ids[start:start + safe_input_limit]
            if not chunk_ids:
                continue

            inputs = torch.tensor([chunk_ids], dtype=torch.long).to(DEVICE)
            with torch.no_grad():
                summary_ids = pegasus_model.generate(
                    inputs,
                    max_length=max_length,
                    min_length=min_length,
                    num_beams=4,
                    length_penalty=2.0,
                    early_stopping=True
                )

            chunk_summary = pegasus_tokenizer.decode(summary_ids[0], skip_special_tokens=True).strip()
            if chunk_summary:
                chunk_summaries.append(chunk_summary)

        if not chunk_summaries:
            return None

        summary = ' '.join(chunk_summaries)

        # If we had multiple chunks, compress once more to a concise final summary.
        if len(chunk_summaries) > 1:
            compressed_ids = pegasus_tokenizer.encode(summary, add_special_tokens=False)[:safe_input_limit]
            final_inputs = torch.tensor([compressed_ids], dtype=torch.long).to(DEVICE)
            with torch.no_grad():
                final_ids = pegasus_model.generate(
                    final_inputs,
                    max_length=max_length,
                    min_length=min_length,
                    num_beams=4,
                    length_penalty=2.0,
                    early_stopping=True
                )
            summary = pegasus_tokenizer.decode(final_ids[0], skip_special_tokens=True).strip()
        
        logger.info(f"✅ Summary generated: {len(summary)} chars")
        return summary
        
    except Exception as e:
        logger.error(f"Error during summarization: {e}")
        logger.error(traceback.format_exc())
        return None


def _extract_text_from_upload() -> Dict[str, str]:
    """Extract text content from upload across text, PDF, DOCX, and image files."""
    uploaded = request.files.get('file')
    if uploaded is None:
        return {'text': '', 'file_type': 'unknown'}

    payload = uploaded.read()
    if not payload:
        return {'text': '', 'file_type': 'unknown'}

    filename = (uploaded.filename or '').lower()
    content_type = (uploaded.mimetype or '').lower()

    try:
        if filename.endswith('.pdf') or 'pdf' in content_type:
            text = _extract_text_from_pdf(payload)
            return {'text': clean_text(text), 'file_type': 'pdf'}

        if filename.endswith('.docx') or 'wordprocessingml' in content_type:
            text = _extract_text_from_docx(payload)
            return {'text': clean_text(text), 'file_type': 'docx'}

        if filename.endswith(('.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tif', '.tiff')) or content_type.startswith('image/'):
            text = _extract_text_from_image(payload)
            return {'text': clean_text(text), 'file_type': 'image'}

        # Fallback text decode for txt/csv and unknown text-based payloads.
        text = payload.decode('utf-8', errors='ignore').strip()
        return {'text': clean_text(text), 'file_type': 'text'}
    except Exception as e:
        logger.error(f"File extraction failed: {e}")
        return {'text': '', 'file_type': 'unknown'}


def _build_recommendations(entities: Dict[str, List[str]]) -> List[str]:
    recommendations: List[str] = []

    if entities.get('conditions'):
        recommendations.append('Consult your physician for condition-specific treatment planning and monitoring.')
    if entities.get('symptoms'):
        recommendations.append('Monitor symptom progression and seek urgent care if symptoms worsen.')
    if entities.get('medications'):
        recommendations.append('Take medications exactly as prescribed and verify possible interactions.')
    if entities.get('vitals'):
        recommendations.append('Track vital signs consistently and report abnormal trends to your clinician.')

    if not recommendations:
        recommendations.append('Review this report with a qualified healthcare professional before making decisions.')

    return recommendations

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
            extracted = _extract_text_from_upload()
            record = extracted.get('text', '')
            file_type = extracted.get('file_type', 'unknown')
            max_length = int(request.form.get('max_length', 120))
            min_length = int(request.form.get('min_length', 40))
            extract_entities = request.form.get('extract_entities', 'true').lower() != 'false'
        else:
            data = request.get_json(silent=True) or {}
            record = str(data.get('record', data.get('text', ''))).strip()
            file_type = 'json-text'
            max_length = int(data.get('max_length', data.get('max_summary_length', 120)))
            min_length = int(data.get('min_length', 40))
            extract_entities = bool(data.get('extract_entities', True))
        
        if not record:
            return jsonify({
                'success': False,
                'error': 'No readable text found in file. For images ensure text is clear; for scans ensure OCR-friendly quality.'
            }), 400

        is_medical, medical_score, matched_keywords = _is_medical_content(record)
        if not is_medical:
            return jsonify({
                'success': False,
                'error': 'Uploaded content does not appear to be medical information and cannot be summarized as a medical record.',
                'file_type': file_type,
                'medical_relevance_score': round(medical_score, 3),
                'matched_medical_terms': matched_keywords,
            }), 422
        
        logger.info(f"📋 Processing medical record ({len(record)} chars)")
        
        start_time = time.time()
        
        # Extract clinical entities
        entities = extract_clinical_entities(record) if extract_entities else {}
        recommendations = _build_recommendations(entities)
        
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
                    'follow_up': recommendations,
                    'precautions': [
                        'Do not change prescribed treatment without clinician guidance.',
                        'Seek urgent care for severe or rapidly worsening symptoms.'
                    ]
                },
                'confidence': {
                    'summary': 0.82
                },
                'metadata': {
                    'generated_at': datetime.now().isoformat(),
                    'file_type': file_type,
                    'medical_relevance_score': round(medical_score, 3)
                }
            },
            'medical_summary': {
                'identified_conditions': entities.get('conditions', []),
                'suggested_medications': entities.get('medications', []),
                'recommended_actions': recommendations,
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

        is_medical, medical_score, matched_keywords = _is_medical_content(text)
        if not is_medical:
            return jsonify({
                'success': False,
                'error': 'Provided text does not appear to be medical information and cannot be summarized as a medical record.',
                'medical_relevance_score': round(medical_score, 3),
                'matched_medical_terms': matched_keywords,
            }), 422

        max_length = int(data.get('max_length', data.get('max_summary_length', 120)))
        min_length = int(data.get('min_length', 40))
        entities = extract_clinical_entities(text)
        recommendations = _build_recommendations(entities)
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
            'medical_summary': {
                'identified_conditions': entities.get('conditions', []),
                'suggested_medications': entities.get('medications', []),
                'recommended_actions': recommendations,
            },
            'original_length': len(text),
            'summary_length': len(summary),
            'medical_relevance_score': round(medical_score, 3)
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
        host='127.0.0.1',
        port=SERVICE_PORT,
        debug=False,
        use_reloader=False,
        threaded=True
    )
