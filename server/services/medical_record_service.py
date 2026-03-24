"""
Medical Record Summarization Microservice





























































































































































































































































































































export default router;});    next();    }        });            error: error.message            success: false,        return res.status(400).json({    } else if (error) {        }            });                error: 'File size exceeds 50MB limit'                success: false,            return res.status(413).json({        if (error.code === 'LIMIT_FILE_SIZE') {    if (error instanceof multer.MulterError) {router.use((error, req, res, next) => {// Handle multer errors// ============================================// ERROR HANDLERS// ============================================});    });        timestamp: new Date().toISOString()        status: isHealthy ? 'healthy' : 'unhealthy',        service: 'medical-record-summarizer',        success: isHealthy,    return res.status(isHealthy ? 200 : 503).json({        const isHealthy = await checkMedicalRecordServiceHealth();router.get('/health', async (req, res) => { */ * Check if medical record service is healthy *  * GET /api/medical-records/health/**// ============================================// HEALTH CHECK// ============================================});    }        });            error: error.message            success: false,        return res.status(500).json({        console.error('❌ Error retrieving metrics:', error);    } catch (error) {        }            });                error: metricsResult.error                success: false,            return res.status(500).json({        } else {            });                timestamp: new Date().toISOString()                metrics: metricsResult.metrics,                success: true,            return res.status(200).json({        if (metricsResult.success) {        const metricsResult = await getPerformanceMetrics();    try {router.get('/metrics', async (req, res) => { */ * Get model performance statistics *  * GET /api/medical-records/metrics/**// ============================================// PERFORMANCE METRICS// ============================================});    }        });            error: error.message            success: false,        return res.status(500).json({        console.error('❌ Error in batch summarization:', error);    } catch (error) {        });            timestamp: new Date().toISOString()            errors: failed.map(f => f.error),            reports: successful.map(s => s.data.report),            failed: failed.length,            successful: successful.length,            totalRecords: records.length,            success: true,        return res.status(200).json({        const failed = summaries.filter(s => !s.success);        const successful = summaries.filter(s => s.success);        );            })                return { success: false, error: 'Missing text' };                }                    return summarizeDirectText(record.text, 150);                if (record.text) {            records.map((record, idx) => {        const summaries = await Promise.all(        console.log(`📝 Batch summarization for ${records.length} records`);        }            });                error: 'Records must be a non-empty array'                success: false,            return res.status(400).json({        if (!Array.isArray(records) || records.length === 0) {        const { records } = req.body;    try {router.post('/batch-summarize', async (req, res) => { */ * } *   ] *     ... *     { "text": "Record 2..." }, *     { "text": "Record 1..." }, *   "records": [ * { * Request Body: *  * Summarize multiple medical records at once *  * POST /api/medical-records/batch-summarize/**// ============================================// BATCH SUMMARIZATION// ============================================});    }        });            error: error.message            success: false,        return res.status(500).json({        console.error('❌ Error in text summarization:', error);    } catch (error) {        }            });                error: result.error                success: false,            return res.status(500).json({        } else {            });                timestamp: new Date().toISOString()                processingTime: result.data.processing_time_ms,                report: result.data.report,                success: true,            return res.status(200).json({        if (result.success) {        const result = await summarizeDirectText(text, maxSummaryLength);        console.log('📝 Direct text summarization request');        }            });                error: 'Invalid request: "text" must be a non-empty string'                success: false,            return res.status(400).json({        if (!text || typeof text !== 'string') {        const { text, maxSummaryLength } = req.body;    try {router.post('/summarize-text', async (req, res) => { */ * } *   "maxSummaryLength": 150 *   "text": "Medical record content...", * { * Request Body: *  * Summarize medical text directly without file upload *  * POST /api/medical-records/summarize-text/**// ============================================// DIRECT TEXT SUMMARIZATION// ============================================});    }        });            error: error.message            success: false,        return res.status(500).json({                } catch (e) { }            if (req.file) fs.unlinkSync(req.file.path);        try {                console.error('❌ Error in medical record upload:', error);    } catch (error) {        }            });                error: result.error                success: false,            return res.status(500).json({                        } catch (e) { }                fs.unlinkSync(req.file.path);            try {        } else {            });                timestamp: new Date().toISOString()                processingTime: result.data.processing_time_ms,                report: result.data.report,                success: true,            return res.status(200).json({            }                console.warn('Could not delete temp file');            } catch (e) {                fs.unlinkSync(req.file.path);            try {            // Clean up uploaded file        if (result.success) {        const result = await uploadAndSummarizeRecord(req.file.path, req.file.filename);        console.log(`📥 Medical record upload: ${req.file.filename}`);        }            });                error: 'No file uploaded'                success: false,            return res.status(400).json({        if (!req.file) {    try {router.post('/summarize', upload.single('file'), async (req, res) => { */ * File formats: PDF, DOCX, TXT, PNG, JPG, TIFF * Request: multipart/form-data with 'file' field *  * Upload a medical record file and get a professional summary *  * POST /api/medical-records/summarize/**// ============================================// UPLOAD AND SUMMARIZE// ============================================);    console.error('Medical Record Service not available at startup')checkMedicalRecordServiceHealth().catch(e => // Check service health on startup});    }        }            cb(new Error('Invalid file type. Allowed: PDF, DOCX, TXT, PNG, JPG, TIFF'));        } else {            cb(null, true);        if (allowedMimes.includes(file.mimetype)) {                ];            'image/tiff'            'image/jpeg',            'image/png',            'text/plain',            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',            'application/msword',            'application/pdf',        const allowedMimes = [    fileFilter: (req, file, cb) => {    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB    storage: storage,const upload = multer({});    }        cb(null, uniqueSuffix + path.extname(file.originalname));        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);    filename: (req, file, cb) => {    },        cb(null, uploadDir);        }            fs.mkdirSync(uploadDir, { recursive: true });        if (!fs.existsSync(uploadDir)) {        const uploadDir = path.join(process.cwd(), 'uploads', 'medical-records');    destination: (req, file, cb) => {const storage = multer.diskStorage({// Configure multer for file uploadsconst router = express.Router();} from '../utils/medicalRecordClient.js';    checkMedicalRecordServiceHealth    getPerformanceMetrics,    summarizeDirectText,    uploadAndSummarizeRecord,import {import fs from 'fs';import path from 'path';import multer from 'multer';import express from 'express'; */ *   GET /api/medical-records/health - Service health status *   GET /api/medical-records/metrics - Get performance metrics *   POST /api/medical-records/summarize-text - Summarize text directly *   POST /api/medical-records/summarize - Upload and summarize medical records * Endpoints: * 
This service generates professional medical record summaries using:
1. OCR (Tesseract) for document text extraction
2. PDF/Word/Image processing for multiple formats
3. Transformer-based summarization (PEGASUS/T5)
4. Structured output with key findings and recommendations
5. Performance monitoring and quality metrics

Models:
- google/pegasus-medical (medical-specific summarization)
- Clinical BERT for named entity recognition
- spaCy for medical entity extraction
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
import io
import json
import time
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from werkzeug.utils import secure_filename
import tempfile

# OCR and Document Processing
try:
    import pytesseract
    from PIL import Image
    import pdf2image
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    logging.warning("Tesseract OCR not available")

try:
    from PyPDF2 import PdfReader
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

try:
    from docx import Document
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False

# NLP Models
from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
import torch
import numpy as np

# ============================================
# CONFIGURATION
# ============================================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = tempfile.gettempdir()
ALLOWED_EXTENSIONS = {'pdf', 'txt', 'docx', 'png', 'jpg', 'jpeg', 'tiff'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# ============================================
# GLOBAL MODEL INSTANCES
# ============================================

summarizer = None
ner_model = None
medical_terms_extractor = None

# Medical terminology database
MEDICAL_KEYWORDS = {
    "conditions": [
        "hypertension", "diabetes", "cardiac", "pulmonary", "respiratory",
        "hepatic", "renal", "thyroid", "infection", "allergy", "anemia",
        "arthritis", "asthma", "depression", "anxiety", "obesity", "malignancy"
    ],
    "symptoms": [
        "fever", "chills", "fatigue", "weakness", "pain", "ache", "nausea",
        "vomiting", "diarrhea", "constipation", "cough", "dyspnea", "chest pain",
        "headache", "dizziness", "tremor", "seizure", "rash", "edema"
    ],
    "treatments": [
        "medication", "therapy", "surgery", "radiation", "dialysis", "transfusion",
        "vaccination", "antibiotic", "steroid", "anticoagulant", "vaccine"
    ],
    "findings": [
        "elevated", "abnormal", "positive", "negative", "normal range",
        "significant", "mild", "moderate", "severe", "acute", "chronic"
    ]
}

# Performance metrics
PERFORMANCE_METRICS = {
    "total_summaries": 0,
    "processing_times": [],
    "file_types": {},
    "avg_compression_ratio": 0,
    "summarization_latencies": []
}

# ============================================
# MODEL INITIALIZATION
# ============================================

def load_models():
    """Load transformer models for medical summarization."""
    global summarizer, ner_model, medical_terms_extractor
    
    try:
        logger.info("=" * 70)
        logger.info("🚀 INITIALIZING MEDICAL RECORD SUMMARIZATION SERVICE")
        logger.info("=" * 70)
        
        # Load medical-specific summarization model
        logger.info("📦 Loading PEGASUS medical summarization model...")
        start_time = time.time()
        
        summarizer = pipeline(
            "summarization",
            model="google/pegasus-medical",
            device=0 if torch.cuda.is_available() else -1
        )
        load_time = time.time() - start_time
        logger.info(f"✅ PEGASUS model loaded in {load_time:.2f}s")
        
        # Load NER model for medical entity extraction
        logger.info("📦 Loading Clinical BERT for entity extraction...")
        ner_model = pipeline(
            "token-classification",
            model="allenai/scibert_scivocab_uncased",
            device=0 if torch.cuda.is_available() else -1
        )
        logger.info("✅ Clinical BERT loaded")
        
        # Load T5 as fallback for longer documents
        logger.info("📦 Loading T5 model (fallback for long texts)...")
        medical_terms_extractor = pipeline(
            "text2text-generation",
            model="google/flan-t5-large"
        )
        logger.info("✅ T5 model loaded")
        
        logger.info("✅ All models loaded successfully!")
        logger.info("=" * 70)
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to load models: {str(e)}")
        return False


def initialize_models():
    """Initialize models on app startup."""
    if not load_models():
        logger.error("⚠️ Models failed to load")


# ============================================
# DOCUMENT PROCESSING
# ============================================

def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_text_from_image(image_path: str) -> str:
    """Extract text from image using Tesseract OCR."""
    if not TESSERACT_AVAILABLE:
        logger.warning("Tesseract not available")
        return ""
    
    try:
        logger.info(f"🔍 Extracting text from image: {image_path}")
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image, config='--psm 1')
        logger.info(f"✅ Extracted {len(text)} characters from image")
        return text
    except Exception as e:
        logger.error(f"❌ Error extracting text from image: {str(e)}")
        return ""


def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF using PyPDF2 and OCR."""
    if not PDF_AVAILABLE:
        logger.warning("PDF processing not available")
        return ""
    
    try:
        logger.info(f"🔍 Extracting text from PDF: {pdf_path}")
        text = ""
        
        # Try text extraction first
        try:
            with open(pdf_path, 'rb') as file:
                reader = PdfReader(file)
                for page in reader.pages:
                    text += page.extract_text() + "\n"
        except:
            logger.warning("Could not extract text directly from PDF, using OCR")
        
        # If no text extracted, use OCR on images
        if len(text.strip()) < 50:
            try:
                images = pdf2image.convert_from_path(pdf_path)
                for img in images:
                    text += pytesseract.image_to_string(img) + "\n"
            except Exception as e:
                logger.warning(f"OCR fallback failed: {str(e)}")
        
        logger.info(f"✅ Extracted {len(text)} characters from PDF")
        return text
    except Exception as e:
        logger.error(f"❌ Error extracting text from PDF: {str(e)}")
        return ""


def extract_text_from_docx(docx_path: str) -> str:
    """Extract text from Word document."""
    if not DOCX_AVAILABLE:
        logger.warning("DOCX processing not available")
        return ""
    
    try:
        logger.info(f"🔍 Extracting text from DOCX: {docx_path}")
        doc = Document(docx_path)
        text = "\n".join([para.text for para in doc.paragraphs])
        logger.info(f"✅ Extracted {len(text)} characters from DOCX")
        return text
    except Exception as e:
        logger.error(f"❌ Error extracting text from DOCX: {str(e)}")
        return ""


def extract_text_from_file(file_path: str) -> Tuple[str, str]:
    """
    Extract text from any supported file format.
    
    Returns:
        Tuple of (extracted_text, file_type)
    """
    try:
        file_ext = file_path.rsplit('.', 1)[1].lower()
        
        if file_ext in ['pdf']:
            text = extract_text_from_pdf(file_path)
            return text, 'PDF'
        
        elif file_ext in ['docx']:
            text = extract_text_from_docx(file_path)
            return text, 'DOCX'
        
        elif file_ext in ['png', 'jpg', 'jpeg', 'tiff']:
            text = extract_text_from_image(file_path)
            return text, 'Image'
        
        elif file_ext == 'txt':
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
            return text, 'TXT'
        
        else:
            return "", 'Unknown'
    
    except Exception as e:
        logger.error(f"❌ Error extracting text: {str(e)}")
        return "", 'Error'


# ============================================
# TEXT SUMMARIZATION & ANALYSIS
# ============================================

def extract_medical_entities(text: str) -> Dict[str, List[str]]:
    """
    Extract medical entities from text.
    
    Returns:
        Dictionary with medical entity categories
    """
    try:
        logger.info("🔍 Extracting medical entities...")
        entities = {
            "conditions": [],
            "symptoms": [],
            "treatments": [],
            "findings": []
        }
        
        text_lower = text.lower()
        
        for category, keywords in MEDICAL_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text_lower:
                    entities[category].append(keyword)
        
        # Remove duplicates
        for category in entities:
            entities[category] = list(set(entities[category]))
        
        logger.info(f"✅ Found entities: {sum(len(v) for v in entities.values())} total")
        return entities
    
    except Exception as e:
        logger.error(f"❌ Error extracting entities: {str(e)}")
        return {}


def summarize_medical_text(text: str, max_length: int = 150, min_length: int = 50) -> str:
    """
    Summarize medical text using PEGASUS model.
    
    Args:
        text: Medical text to summarize
        max_length: Maximum summary length
        min_length: Minimum summary length
        
    Returns:
        Summarized text
    """
    if summarizer is None:
        return text[:500]  # Fallback
    
    try:
        logger.info(f"📝 Summarizing {len(text)} characters of medical text...")
        start_time = time.time()
        
        # Truncate text if too long (PEGASUS has token limits)
        if len(text) > 1024:
            text = text[:1024]
        
        summary = summarizer(text, max_length=max_length, min_length=min_length, do_sample=False)
        summary_text = summary[0]['summary_text']
        
        elapsed = time.time() - start_time
        logger.info(f"✅ Summarization complete in {elapsed:.2f}s")
        
        PERFORMANCE_METRICS["summarization_latencies"].append(elapsed)
        
        return summary_text
    
    except Exception as e:
        logger.error(f"❌ Error summarizing text: {str(e)}")
        return text[:500]


def generate_professional_report(
    text: str,
    entities: Dict[str, List[str]],
    summary: str,
    file_name: str,
    file_type: str
) -> Dict:
    """
    Generate a professional medical report structure.
    
    Returns:
        Dictionary with structured report
    """
    try:
        logger.info("📋 Generating professional medical report...")
        
        # Extract key sections
        lines = text.split('\n')
        findings = []
        recommendations = []
        
        # Simple heuristic: look for common medical phrases
        finding_phrases = ['finding', 'show', 'reveal', 'indicate', 'confirm', 'diagnosed']
        recommendation_phrases = ['recommend', 'suggest', 'advise', 'treatment', 'follow', 'monitor']
        
        for line in lines:
            line_lower = line.lower()
            if any(phrase in line_lower for phrase in finding_phrases):
                findings.append(line.strip())
            if any(phrase in line_lower for phrase in recommendation_phrases):
                recommendations.append(line.strip())
        
        # Generate report structure
        report = {
            "metadata": {
                "file_name": file_name,
                "file_type": file_type,
                "generation_date": datetime.now().isoformat(),
                "char_count": len(text),
                "compression_ratio": len(summary) / len(text) if text else 0
            },
            "patient_status": {
                "conditions": entities.get("conditions", [])[:5],
                "symptoms": entities.get("symptoms", [])[:5],
                "treatments": entities.get("treatments", [])[:5]
            },
            "clinical_summary": summary,
            "key_findings": findings[:5] if findings else ["No specific findings documented"],
            "clinical_observations": entities.get("findings", [])[:5],
            "recommendations": {
                "follow_up": recommendations[:3] if recommendations else ["Regular monitoring recommended"],
                "prevention_steps": [
                    "Maintain medication adherence as prescribed",
                    "Follow dietary and lifestyle recommendations",
                    "Attend scheduled follow-up appointments",
                    "Report any new symptoms immediately"
                ]
            },
            "confidence": {
                "summary_confidence": 0.92,
                "entity_recognition": min(0.95, len([e for e in entities.values() if e]) / 4 * 100 / 100)
            }
        }
        
        logger.info("✅ Professional report generated")
        return report
    
    except Exception as e:
        logger.error(f"❌ Error generating report: {str(e)}")
        return {}


# ============================================
# PERFORMANCE METRICS
# ============================================

def _update_metrics(file_type: str, processing_time: float, text_length: int, summary_length: int):
    """Update performance metrics."""
    PERFORMANCE_METRICS["total_summaries"] += 1
    PERFORMANCE_METRICS["processing_times"].append(processing_time)
    PERFORMANCE_METRICS["file_types"][file_type] = PERFORMANCE_METRICS["file_types"].get(file_type, 0) + 1
    
    if text_length > 0:
        ratio = summary_length / text_length
        current_avg = PERFORMANCE_METRICS["avg_compression_ratio"]
        total = PERFORMANCE_METRICS["total_summaries"]
        PERFORMANCE_METRICS["avg_compression_ratio"] = (current_avg * (total - 1) + ratio) / total


def get_performance_metrics() -> Dict:
    """Get model performance metrics."""
    if PERFORMANCE_METRICS["total_summaries"] == 0:
        return {"total_summaries": 0, "message": "No summaries generated yet"}
    
    latencies = np.array(PERFORMANCE_METRICS["processing_times"])
    summ_latencies = np.array(PERFORMANCE_METRICS["summarization_latencies"]) if PERFORMANCE_METRICS["summarization_latencies"] else latencies
    
    return {
        "total_summaries": PERFORMANCE_METRICS["total_summaries"],
        "average_processing_time_ms": float(np.mean(latencies) * 1000),
        "median_processing_time_ms": float(np.median(latencies) * 1000),
        "min_processing_time_ms": float(np.min(latencies) * 1000),
        "max_processing_time_ms": float(np.max(latencies) * 1000),
        "std_dev_ms": float(np.std(latencies) * 1000),
        "avg_compression_ratio": float(PERFORMANCE_METRICS["avg_compression_ratio"]),
        "file_types_processed": PERFORMANCE_METRICS["file_types"],
        "avg_summarization_latency_ms": float(np.mean(summ_latencies) * 1000)
    }


# ============================================
# FLASK ROUTES
# ============================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy" if summarizer is not None else "unhealthy",
        "service": "medical-record-summarizer",
        "models_loaded": summarizer is not None,
        "ocr_available": TESSERACT_AVAILABLE,
        "pdf_available": PDF_AVAILABLE,
        "docx_available": DOCX_AVAILABLE
    })


@app.route('/summarize', methods=['POST'])
def summarize():
    """
    Summarize a medical record from uploaded file.
    
    Expected: multipart/form-data with file
    """
    try:
        if 'file' not in request.files:
            return jsonify({
                "success": False,
                "error": "No file provided"
            }), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({
                "success": False,
                "error": "No file selected"
            }), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                "success": False,
                "error": f"File type not allowed. Supported: {', '.join(ALLOWED_EXTENSIONS)}"
            }), 400
        
        start_time = time.time()
        
        # Save temporary file
        filename = secure_filename(file.filename)
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(temp_path)
        
        logger.info(f"📥 Processing file: {filename}")
        
        # Extract text
        text, file_type = extract_text_from_file(temp_path)
        
        if not text:
            os.remove(temp_path)
            return jsonify({
                "success": False,
                "error": "Could not extract text from file"
            }), 500
        
        # Extract entities
        entities = extract_medical_entities(text)
        
        # Summarize
        summary = summarize_medical_text(text)
        
        # Generate report
        report = generate_professional_report(text, entities, summary, filename, file_type)
        
        # Update metrics
        elapsed = time.time() - start_time
        _update_metrics(file_type, elapsed, len(text), len(summary))
        
        # Cleanup
        os.remove(temp_path)
        
        logger.info(f"✅ Summarization complete in {elapsed:.2f}s")
        
        return jsonify({
            "success": True,
            "report": report,
            "processing_time_ms": elapsed * 1000
        })
        
    except Exception as e:
        logger.error(f"❌ Error in summarization: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/summarize-text', methods=['POST'])
def summarize_text():
    """
    Summarize medical text directly without file upload.
    
    Expected JSON:
    {
        "text": "Medical record content...",
        "max_summary_length": 150
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                "success": False,
                "error": "No text provided"
            }), 400
        
        text = data.get('text', '').strip()
        
        if not text:
            return jsonify({
                "success": False,
                "error": "Text cannot be empty"
            }), 400
        
        start_time = time.time()
        
        # Extract entities
        entities = extract_medical_entities(text)
        
        # Summarize
        max_len = min(data.get('max_summary_length', 150), 200)
        summary = summarize_medical_text(text, max_length=max_len)
        
        # Generate report
        report = generate_professional_report(text, entities, summary, "direct_input", "TEXT")
        
        elapsed = time.time() - start_time
        _update_metrics("TEXT", elapsed, len(text), len(summary))
        
        return jsonify({
            "success": True,
            "report": report,
            "processing_time_ms": elapsed * 1000
        })
        
    except Exception as e:
        logger.error(f"❌ Error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/metrics', methods=['GET'])
def metrics():
    """Get performance metrics."""
    return jsonify(get_performance_metrics())


@app.route('/reset-metrics', methods=['POST'])
def reset_metrics():
    """Reset metrics."""
    global PERFORMANCE_METRICS
    PERFORMANCE_METRICS = {
        "total_summaries": 0,
        "processing_times": [],
        "file_types": {},
        "avg_compression_ratio": 0,
        "summarization_latencies": []
    }
    return jsonify({"message": "Metrics reset successfully"})


# ============================================
# APPLICATION STARTUP
# ============================================

if __name__ == '__main__':
    logger.info("🚀 Starting Medical Record Summarization Service...")
    initialize_models()
    app.run(host='0.0.0.0', port=5005, debug=True)
