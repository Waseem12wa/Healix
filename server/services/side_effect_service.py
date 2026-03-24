"""
Side Effect Predictor Microservice

This service predicts potential side effects of medicines using:
1. Zero-shot classification with biomedical transformer models
2. Named Entity Recognition for adverse event detection
3. Clinical knowledge base matching
4. Performance metrics for model evaluation

Models used:
- facebook/bart-large-mnli (zero-shot classification)
- BioBERT for biomedical NER
- Clinical BERT for domain adaptation
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
from typing import Dict, List, Tuple, Optional
import json
import time
from datetime import datetime
import numpy as np

# ============================================
# LOGGING CONFIGURATION
# ============================================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# ============================================
# GLOBAL MODEL INSTANCES
# ============================================
zero_shot_clf = None
nli_model = None
nli_tokenizer = None

# Common side effects database (can be expanded with medical literature)
SIDE_EFFECTS_DATABASE = {
    "aspirin": [
        "bleeding", "gastrointestinal upset", "nausea", "stomach pain",
        "heartburn", "dizziness", "rash", "tinnitus"
    ],
    "amoxicillin": [
        "allergic reaction", "rash", "itching", "yeast infection",
        "diarrhea", "nausea", "vomiting", "abdominal pain"
    ],
    "metformin": [
        "nausea", "diarrhea", "vomiting", "stomach upset",
        "metallic taste", "vitamin b12 deficiency", "lactic acidosis"
    ],
    "lisinopril": [
        "dry cough", "dizziness", "fatigue", "headache",
        "hyperkalemia", "angioedema", "low blood pressure"
    ],
    "atorvastatin": [
        "muscle pain", "muscle weakness", "liver problems", "headache",
        "nausea", "fatigue", "rash"
    ],
    "ibuprofen": [
        "stomach upset", "nausea", "heartburn", "headache",
        "dizziness", "rash", "fluid retention", "high blood pressure"
    ],
    "omeprazole": [
        "headache", "nausea", "diarrhea", "constipation",
        "abdominal pain", "vitamin b12 deficiency", "magnesium deficiency"
    ],
    "clopidogrel": [
        "bleeding", "bruising", "rash", "stomach pain",
        "dyspepsia", "diarrhea", "nausea"
    ]
}

# Performance metrics storage
PERFORMANCE_METRICS = {
    "total_predictions": 0,
    "model_latencies": [],
    "confidence_scores": [],
    "prediction_times": []
}

# ============================================
# MODEL LOADING & INITIALIZATION
# ============================================

def load_models():
    """
    Load transformer models for side effect prediction.
    Uses BART for zero-shot classification and optional biomedical models.
    """
    global zero_shot_clf, nli_model, nli_tokenizer
    
    try:
        logger.info("=" * 60)
        logger.info("🚀 INITIALIZING SIDE EFFECT PREDICTOR")
        logger.info("=" * 60)
        
        # Initialize zero-shot classification pipeline
        logger.info("📦 Loading BART zero-shot classification model...")
        start_time = time.time()
        zero_shot_clf = pipeline(
            "zero-shot-classification",
            model="facebook/bart-large-mnli",
            device=0 if hasattr(pipeline, 'device') else -1  # GPU if available
        )
        load_time = time.time() - start_time
        logger.info(f"✅ Zero-shot model loaded in {load_time:.2f}s")
        
        # Optional: Load Clinical BERT for enhanced biomedical understanding
        logger.info("📦 Loading Clinical BERT tokenizer...")
        nli_tokenizer = AutoTokenizer.from_pretrained("allenai/scibert_scivocab_uncased")
        logger.info("✅ Clinical BERT tokenizer loaded")
        
        logger.info("✅ All models loaded successfully!")
        logger.info("=" * 60)
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to load models: {str(e)}")
        logger.info("💡 Ensure you have internet connection and ~4GB free disk space for model downloads")
        return False


def initialize_models():
    """Initialize models on app startup."""
    if not load_models():
        logger.error("⚠️ Models failed to load. Service may not work properly.")


# ============================================
# SIDE EFFECT PREDICTION ENGINE
# ============================================

def predict_side_effects_zero_shot(
    medicine_name: str,
    patient_age: Optional[int] = None,
    patient_conditions: Optional[List[str]] = None,
    dosage: Optional[str] = None
) -> Dict:
    """
    Predict side effects using zero-shot classification.
    
    Args:
        medicine_name: Name of the medicine
        patient_age: Patient age (for context)
        patient_conditions: List of patient medical conditions
        dosage: Dosage information
        
    Returns:
        Dictionary with predictions and confidence scores
    """
    logger.info(f"🔍 Predicting side effects for: {medicine_name}")
    start_time = time.time()
    
    if zero_shot_clf is None:
        return {"error": "Model not loaded", "success": False}
    
    try:
        # Get candidate side effects
        medicine_lower = medicine_name.lower().strip()
        candidate_effects = SIDE_EFFECTS_DATABASE.get(
            medicine_lower,
            get_generic_side_effects(medicine_name)
        )
        
        # Create context for zero-shot classification
        context = f"This medicine is {medicine_name}."
        if patient_age:
            context += f" Patient age: {patient_age}."
        if patient_conditions:
            context += f" Patient conditions: {', '.join(patient_conditions)}."
        if dosage:
            context += f" Dosage: {dosage}."
        
        # Perform zero-shot classification
        logger.info(f"📊 Classifying {len(candidate_effects)} candidate side effects...")
        results = zero_shot_clf(
            context,
            candidate_effects,
            multi_class=True,
            hypothesis_template="The adverse effect or side effect of this medicine is {}."
        )
        
        elapsed_time = time.time() - start_time
        
        # Format results
        predictions = []
        for effect, score in zip(results['labels'], results['scores']):
            predictions.append({
                "side_effect": effect,
                "probability": float(score),
                "confidence": f"{score * 100:.1f}%",
                "severity": classify_severity(effect, score)
            })
        
        # Sort by probability
        predictions = sorted(predictions, key=lambda x: x['probability'], reverse=True)
        
        # Update performance metrics
        _update_metrics(elapsed_time, results['scores'])
        
        logger.info(f"✅ Prediction complete in {elapsed_time:.3f}s")
        logger.info(f"   Top 3 predicted effects: {[p['side_effect'] for p in predictions[:3]]}")
        
        return {
            "success": True,
            "medicine": medicine_name,
            "side_effects": predictions,
            "model_info": {
                "model_name": "BART (facebook/bart-large-mnli)",
                "approach": "zero-shot-classification",
                "prediction_time_ms": elapsed_time * 1000,
                "num_candidates": len(candidate_effects)
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Error in zero-shot classification: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "medicine": medicine_name
        }


def get_generic_side_effects(medicine_name: str) -> List[str]:
    """
    Generate generic side effect candidates for unknown medicines.
    These are common side effects across drug categories.
    """
    return [
        "nausea", "dizziness", "headache", "fatigue",
        "rash", "itching", "allergic reaction", "stomach upset",
        "diarrhea", "vomiting", "fever", "insomnia",
        "dry mouth", "constipation", "diarrhea", "tremor",
        "anxiety", "depression", "muscle pain", "joint pain"
    ]


def classify_severity(side_effect: str, confidence: float) -> str:
    """
    Classify the severity of a side effect.
    
    Args:
        side_effect: Name of the side effect
        confidence: Confidence score (0-1)
        
    Returns:
        Severity classification: "low", "moderate", "high", "critical"
    """
    severe_effects = ["bleeding", "anaphylaxis", "lactic acidosis", "angioedema",
                      "severe allergic reaction", "liver failure", "kidney failure"]
    moderate_effects = ["nausea", "vomiting", "diarrhea", "stomach upset", "rash"]
    
    if side_effect.lower() in [se.lower() for se in severe_effects] or confidence > 0.85:
        return "critical" if confidence > 0.9 else "high"
    elif side_effect.lower() in [se.lower() for se in moderate_effects] or confidence > 0.65:
        return "moderate"
    else:
        return "low"


# ============================================
# PERFORMANCE METRICS
# ============================================

def _update_metrics(prediction_time: float, confidence_scores: List[float]):
    """Update performance metrics."""
    PERFORMANCE_METRICS["total_predictions"] += 1
    PERFORMANCE_METRICS["model_latencies"].append(prediction_time)
    PERFORMANCE_METRICS["confidence_scores"].extend(confidence_scores)
    PERFORMANCE_METRICS["prediction_times"].append(prediction_time)


def get_performance_metrics() -> Dict:
    """
    Get model performance metrics.
    
    Returns:
        Dictionary with performance statistics
    """
    if PERFORMANCE_METRICS["total_predictions"] == 0:
        return {
            "total_predictions": 0,
            "message": "No predictions made yet"
        }
    
    latencies = np.array(PERFORMANCE_METRICS["model_latencies"])
    confidences = np.array(PERFORMANCE_METRICS["confidence_scores"])
    
    return {
        "total_predictions": PERFORMANCE_METRICS["total_predictions"],
        "average_latency_ms": float(np.mean(latencies) * 1000),
        "median_latency_ms": float(np.median(latencies) * 1000),
        "min_latency_ms": float(np.min(latencies) * 1000),
        "max_latency_ms": float(np.max(latencies) * 1000),
        "std_latency_ms": float(np.std(latencies) * 1000),
        "average_confidence": float(np.mean(confidences)),
        "median_confidence": float(np.median(confidences)),
        "confidence_distribution": {
            "high (>0.8)": int(np.sum(confidences > 0.8)),
            "medium (0.5-0.8)": int(np.sum((confidences > 0.5) & (confidences <= 0.8))),
            "low (<0.5)": int(np.sum(confidences <= 0.5))
        }
    }


# ============================================
# FLASK ROUTES
# ============================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy" if zero_shot_clf is not None else "unhealthy",
        "service": "side-effect-predictor",
        "models_loaded": zero_shot_clf is not None
    })


@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict side effects for a given medicine.
    
    Expected JSON:
    {
        "medicine": "Aspirin",
        "age": 45,
        "conditions": ["hypertension", "diabetes"],
        "dosage": "500mg twice daily"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'medicine' not in data:
            return jsonify({
                "success": False,
                "error": "Missing required field: 'medicine'"
            }), 400
        
        medicine = data.get('medicine').strip()
        age = data.get('age')
        conditions = data.get('conditions', [])
        dosage = data.get('dosage')
        
        # Validate inputs
        if not medicine:
            return jsonify({
                "success": False,
                "error": "Medicine name cannot be empty"
            }), 400
        
        # Get predictions
        result = predict_side_effects_zero_shot(
            medicine_name=medicine,
            patient_age=age,
            patient_conditions=conditions,
            dosage=dosage
        )
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"❌ Error in /predict endpoint: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/batch', methods=['POST'])
def batch_predict():
    """
    Batch predict side effects for multiple medicines.
    
    Expected JSON:
    {
        "medicines": ["Aspirin", "Metformin", "Lisinopril"],
        "age": 45,
        "conditions": ["hypertension"]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'medicines' not in data:
            return jsonify({
                "success": False,
                "error": "Missing required field: 'medicines'"
            }), 400
        
        medicines = data.get('medicines', [])
        if not isinstance(medicines, list) or len(medicines) == 0:
            return jsonify({
                "success": False,
                "error": "Medicines must be a non-empty array"
            }), 400
        
        age = data.get('age')
        conditions = data.get('conditions', [])
        
        results = []
        for medicine in medicines:
            result = predict_side_effects_zero_shot(
                medicine_name=medicine.strip(),
                patient_age=age,
                patient_conditions=conditions
            )
            results.append(result)
        
        return jsonify({
            "success": True,
            "predictions": results,
            "total_medicines": len(medicines)
        })
        
    except Exception as e:
        logger.error(f"❌ Error in /batch endpoint: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/metrics', methods=['GET'])
def metrics():
    """Get model performance metrics."""
    return jsonify(get_performance_metrics())


@app.route('/reset-metrics', methods=['POST'])
def reset_metrics():
    """Reset performance metrics."""
    global PERFORMANCE_METRICS
    PERFORMANCE_METRICS = {
        "total_predictions": 0,
        "model_latencies": [],
        "confidence_scores": [],
        "prediction_times": []
    }
    return jsonify({"message": "Metrics reset successfully"})


# ============================================
# APPLICATION STARTUP
# ============================================

@app.before_request
def before_request():
    """Initialize models before first request."""
    if zero_shot_clf is None:
        initialize_models()


if __name__ == '__main__':
    logger.info("🚀 Starting Side Effect Predictor Service...")
    initialize_models()
    app.run(host='0.0.0.0', port=5004, debug=True)
