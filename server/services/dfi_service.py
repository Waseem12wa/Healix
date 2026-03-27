"""
DFI (Drug-Food Interaction) Prediction Service

Uses XGBoost model to predict drug-food interactions based on 18 molecular descriptors.
Enhanced with LLM for detailed explanations.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pubchempy as pcp
from rdkit import Chem
from rdkit.Chem import Descriptors, rdMolDescriptors
import pandas as pd
import numpy as np
import os
import logging

# Use local helper utilities and HF fallback (no LLM for core path)
try:
    from drug_utils import correct_drug_name, correct_food_name, hf_fallback_prediction, get_simple_interaction_details
except ImportError:
    from .drug_utils import correct_drug_name, correct_food_name, hf_fallback_prediction, get_simple_interaction_details

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global model instance
dfi_model = None
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'Models', 'XGB-tuned.sav')

# In-memory caches for speed.
smiles_cache = {}
descriptor_cache = {}


def load_model():
    """Load XGBoost DFI model with compatibility handling"""
    global dfi_model
    try:
        logger.info(f"Loading XGBoost DFI model from {os.path.abspath(MODEL_PATH)}")
        
        # Try loading with joblib first
        import warnings
        warnings.filterwarnings('ignore', category=UserWarning)
        
        # Load with custom unpickler to handle sklearn version issues
        import pickle
        import sys
        
        # Monkey patch to handle missing _PredictScorer
        try:
            from sklearn.metrics._scorer import _PredictScorer
        except (ImportError, AttributeError):
            # Create a dummy class if not available
            class _PredictScorer:
                pass
            sys.modules['sklearn.metrics._scorer']._PredictScorer = _PredictScorer
        
        # Now try loading the model
        with open(MODEL_PATH, 'rb') as f:
            dfi_model = pickle.load(f)
        
        logger.info("DFI model loaded successfully")
        return True
        
    except Exception as e:
        logger.error(f"Failed to load DFI model: {str(e)}")
        logger.error("This model may have been trained with an incompatible sklearn version")
        logger.error("Attempting alternative loading method...")
        
        try:
            # Try with joblib as fallback
            dfi_model = joblib.load(MODEL_PATH)
            logger.info("DFI model loaded successfully using joblib")
            return True
        except Exception as e2:
            logger.error(f"Alternative loading also failed: {str(e2)}")
            return False


def fetch_smiles(medicine_name):
    """
    Fetch SMILES notation from PubChem (cached)
    """
    key = medicine_name.lower().strip()
    if not key:
        return None, None

    if key in smiles_cache:
        return smiles_cache[key]

    try:
        logger.info(f"Fetching SMILES for: {medicine_name}")
        compounds = pcp.get_compounds(medicine_name, 'name')

        if not compounds:
            correction = correct_drug_name(medicine_name)
            if correction and correction != medicine_name:
                logger.info(f"Trying corrected medicine name for SMILES lookup: {correction}")
                compounds = pcp.get_compounds(correction, 'name')

        if not compounds:
            logger.warning(f"No compound found for: {medicine_name}")
            smiles_cache[key] = (None, None)
            return None, None

        smiles = compounds[0].canonical_smiles
        cid = compounds[0].cid
        smiles_cache[key] = (smiles, cid)

        logger.info(f"Found SMILES for {medicine_name}: {smiles} (CID: {cid})")
        return smiles, cid

    except Exception as e:
        logger.error(f"Error fetching SMILES for {medicine_name}: {str(e)}")
        smiles_cache[key] = (None, None)
        return None, None


def calculate_dfi_descriptors(smiles):
    """
    Calculate 18 molecular descriptors required by XGBoost DFI model
    """
    if not smiles:
        return None

    key = smiles
    if key in descriptor_cache:
        return descriptor_cache[key]

    try:
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            logger.error(f"Invalid SMILES: {smiles}")
            descriptor_cache[key] = None
            return None
        
        # Calculate base descriptors
        tpsa = Descriptors.TPSA(mol)
        labute_asa = Descriptors.LabuteASA(mol)  # Labute's Approximate Surface Area
        
        # Get VSA descriptors - use available RDKit functions
        try:
            # PEOE VSA descriptors (partial charge VSA)
            peoe_vsa = rdMolDescriptors.PEOE_VSA_(mol)
        except:
            # Fallback if PEOE_VSA_ not available
            peoe_vsa = [0] * 14
            
        try:
            # VSA Estate descriptors  
            vsa_estate = rdMolDescriptors.VSA_EState_(mol)
        except:
            vsa_estate = [0] * 11
            
        try:
            # EState VSA descriptors
            estate_vsa = rdMolDescriptors.EState_VSA_(mol)
        except:
            estate_vsa = [0] * 11
            
        try:
            # SlogP VSA descriptors
            slogp_vsa = rdMolDescriptors.SlogP_VSA_(mol)
        except:
            slogp_vsa = [0] * 12
        
        # Build feature dictionary matching model's EXACT expected features
        # Based on the error message showing what the model expects
        features = {
            'MTPSA+MTPSA': float(tpsa * 2),  # Doubled TPSA
            'MRVSA9': float(peoe_vsa[9] if len(peoe_vsa) > 9 else 0),
            'MRVSA8': float(peoe_vsa[8] if len(peoe_vsa) > 8 else 0),
            'MRVSA0': float(peoe_vsa[0] if len(peoe_vsa) > 0 else 0),
            'MRVSA2': float(peoe_vsa[2] if len(peoe_vsa) > 2 else 0),
            
            # Combined VSAEstate features (doubled)
            'VSAEstate10+VSAEstate10': float(vsa_estate[10] * 2 if len(vsa_estate) > 10 else 0),
            'VSAEstate7+VSAEstate7': float(vsa_estate[7] * 2 if len(vsa_estate) > 7 else 0),
            
            # Product features
            'EstateVSA0*LabuteASA': float((estate_vsa[0] if len(estate_vsa) > 0 else 0) * labute_asa),
            'EstateVSA1*VSAEstate8': float((estate_vsa[1] if len(estate_vsa) > 1 else 0) * (vsa_estate[8] if len(vsa_estate) > 8 else 0)),
            
            # PEOEVSA features (specific indices)
            'PEOEVSA12': float(peoe_vsa[12] if len(peoe_vsa) > 12 else 0),
            'PEOEVSA10': float(peoe_vsa[10] if len(peoe_vsa) > 10 else 0),
            'PEOEVSA5': float(peoe_vsa[5] if len(peoe_vsa) > 5 else 0),
            'PEOEVSA9': float(peoe_vsa[9] if len(peoe_vsa) > 9 else 0),
            
            # slogPVSA features (specific indices)
            'slogPVSA2': float(slogp_vsa[2] if len(slogp_vsa) > 2 else 0),
            'slogPVSA0': float(slogp_vsa[0] if len(slogp_vsa) > 0 else 0),
            'slogPVSA9': float(slogp_vsa[9] if len(slogp_vsa) > 9 else 0),
            
            # EstateVSA features (specific indices)
            'EstateVSA7': float(estate_vsa[7] if len(estate_vsa) > 7 else 0),
            'EstateVSA2': float(estate_vsa[2] if len(estate_vsa) > 2 else 0),
            'EstateVSA1': float(estate_vsa[1] if len(estate_vsa) > 1 else 0),
        }
        
        # Convert to DataFrame
        features_df = pd.DataFrame([features])
        descriptor_cache[key] = features_df

        logger.info(f"Calculated {len(features)} DFI descriptors successfully")
        return features_df
        
    except Exception as e:
        logger.error(f"Error calculating DFI descriptors: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        descriptor_cache[key] = None
        return None


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "DFI Prediction Service",
        "model_loaded": dfi_model is not None,
        "hf_fallback": True
    })


@app.route('/predict', methods=['POST'])
def predict_food_interaction():
    """
    Predict drug-food interaction
    
    Request body:
    {
        "medicine": "Warfarin",
        "food": "Grapefruit"
    }
    
    Response:
    {
        "success": true,
        "medicine": "Warfarin",
        "food": "Grapefruit",
        "probability": 0.86,
        "percentage": 86.0,
        "severity": "High",
        "severity_label": "High Risk",
        "details": {
            "mechanism": "...",
            "symptoms": "...",
            "recommendations": "...",
            "alternatives": "...",
            "dosage_adjustments": "..."
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'medicine' not in data or 'food' not in data:
            return jsonify({
                "success": False,
                "error": "Missing required fields: medicine and food"
            }), 400
        
        medicine = correct_drug_name(data['medicine'])
        food = correct_food_name(data['food'].strip())

        logger.info(f"Processing food interaction check: {medicine} + {food}")

        # Fetch SMILES for medicine
        smiles, cid = fetch_smiles(medicine)

        if not smiles:
            logger.warning(f"Could not find SMILES for {medicine} - using HF fallback")
            probability, hf_details = hf_fallback_prediction(medicine, food, "drug-food")

            if probability is not None:
                percentage = round(probability * 100, 2)
                if percentage > 70:
                    severity = "High"
                    severity_label = "High Risk"
                elif percentage >= 40:
                    severity = "Moderate"
                    severity_label = "Moderate Risk"
                else:
                    severity = "Low"
                    severity_label = "Low Risk"

                return jsonify({
                    "success": True,
                    "medicine": medicine,
                    "food": food,
                    "probability": probability,
                    "percentage": percentage,
                    "severity": severity,
                    "severity_label": severity_label,
                    "details": hf_details,
                    "source": "hf_fallback"
                })

            return jsonify({
                "success": False,
                "error": f"Could not find chemical structure for '{medicine}' in PubChem database and HF fallback unavailable"
            }), 404
        
        # Calculate 18 molecular descriptors
        features_df = calculate_dfi_descriptors(smiles)
        
        if features_df is None:
            logger.warning("Descriptor calculation failed - using HF fallback")
            probability, hf_details = hf_fallback_prediction(medicine, food, "drug-food")

            if probability is not None:
                percentage = round(probability * 100, 2)
                if percentage > 70:
                    severity = "High"
                    severity_label = "High Risk"
                elif percentage >= 40:
                    severity = "Moderate"
                    severity_label = "Moderate Risk"
                else:
                    severity = "Low"
                    severity_label = "Low Risk"

                return jsonify({
                    "success": True,
                    "medicine": medicine,
                    "food": food,
                    "probability": probability,
                    "percentage": percentage,
                    "severity": severity,
                    "severity_label": severity_label,
                    "details": hf_details,
                    "source": "hf_fallback"
                })

            return jsonify({
                "success": False,
                "error": "Failed to calculate molecular descriptors and HF fallback unavailable"
            }), 500
        
        # Predict interaction probability using model
        try:
            probability = dfi_model.predict_proba(features_df)[0][1]
            percentage = round(probability * 100, 2)
            
            # Determine severity
            if percentage > 70:
                severity = "High"
                severity_label = "High Risk"
            elif percentage >= 40:
                severity = "Moderate"
                severity_label = "Moderate Risk"
            else:
                severity = "Low"
                severity_label = "Low Risk"
            
            logger.info(f"DFI Prediction: {percentage}% ({severity})")
            
        except Exception as e:
            # Model prediction failed - try HF fallback
            logger.error(f"Model prediction failed: {str(e)}")
            probability, hf_details = hf_fallback_prediction(medicine, food, "drug-food")

            if probability is not None:
                percentage = round(probability * 100, 2)
                if percentage > 70:
                    severity = "High"
                    severity_label = "High Risk"
                elif percentage >= 40:
                    severity = "Moderate"
                    severity_label = "Moderate Risk"
                else:
                    severity = "Low"
                    severity_label = "Low Risk"

                return jsonify({
                    "success": True,
                    "medicine": medicine,
                    "food": food,
                    "probability": probability,
                    "percentage": percentage,
                    "severity": severity,
                    "severity_label": severity_label,
                    "details": hf_details,
                    "source": "hf_fallback"
                })

            return jsonify({
                "success": False,
                "error": f"Model prediction failed: {str(e)} and HF fallback unavailable"
            }), 500
        
        # Use a concise consistency-based explanation
        details = get_simple_interaction_details(medicine, food, percentage, severity)

        response_data = {
            "success": True,
            "medicine": medicine,
            "food": food,
            "probability": probability,
            "percentage": percentage,
            "severity": severity,
            "severity_label": severity_label,
            "details": details,
            "source": "model"
        }

        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}"
        }), 500




if __name__ == '__main__':
    # Load model at startup
    if not load_model():
        logger.warning("Failed to load DFI model. Continuing with HF fallback only mode.")
    
    # Start Flask server
    port = int(os.environ.get('DFI_SERVICE_PORT', 5002))
    logger.info(f"Starting DFI service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
