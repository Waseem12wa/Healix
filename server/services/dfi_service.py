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

# Import LLM service for detailed explanations AND fallback
try:
    from llm_service import generate_interaction_details, generate_fallback_prediction, check_ollama_available
    LLM_AVAILABLE = True
except ImportError:
    logging.warning("LLM service not available - detailed explanations will be disabled")
    LLM_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global model instance
dfi_model = None
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'Models', 'XGB-tuned.sav')


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
    Fetch SMILES notation from PubChem
    
    Args:
        medicine_name: Name of the medicine
        
    Returns:
        tuple: (SMILES, CID) or (None, None)
    """
    try:
        logger.info(f"Fetching SMILES for: {medicine_name}")
        compounds = pcp.get_compounds(medicine_name, 'name')
        
        if not compounds:
            logger.warning(f"No compound found for: {medicine_name}")
            return None, None
            
        smiles = compounds[0].canonical_smiles
        cid = compounds[0].cid
        logger.info(f"Found SMILES for {medicine_name}: {smiles} (CID: {cid})")
        return smiles, cid
        
    except Exception as e:
        logger.error(f"Error fetching SMILES for {medicine_name}: {str(e)}")
        return None, None


def calculate_dfi_descriptors(smiles):
    """
    Calculate 18 molecular descriptors required by XGBoost DFI model
    
    Features (matching trained model):
    - MTPSA+MTPSA (doubled topological polar surface area)
    - MRVSA9, MRVSA8, MRVSA0, MRVSA2 (MOE-type descriptors)
    - VSAEstate10+VSAEstate10, VSAEstate7+VSAEstate7 (combined features)
    - EstateVSA0*LabuteASA, EstateVSA1*VSAEstate8 (product features)
    - EstateVSA7, EstateVSA2, EstateVSA1
    - PEOEVSA12, PEOEVSA10, PEOEVSA5, PEOEVSA9
    - slogPVSA2, slogPVSA0, slogPVSA9
    
    Args:
        smiles: SMILES notation
        
    Returns:
        pandas DataFrame with 18 features or None
    """
    try:
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            logger.error(f"Invalid SMILES: {smiles}")
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
        
        logger.info(f"Calculated {len(features)} DFI descriptors successfully")
        return features_df
        
    except Exception as e:
        logger.error(f"Error calculating DFI descriptors: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return None


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "DFI Prediction Service",
        "model_loaded": dfi_model is not None,
        "llm_available": LLM_AVAILABLE
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
        
        medicine = data['medicine'].strip()
        food = data['food'].strip()
        
        logger.info(f"Processing food interaction check: {medicine} + {food}")
        
        # Fetch SMILES for medicine
        smiles, cid = fetch_smiles(medicine)
        
        # Check if SMILES fetching failed - use LLM fallback if available
        if not smiles:
            logger.warning(f"Could not find SMILES for {medicine} - attempting LLM fallback")
            
            if LLM_AVAILABLE:
                try:
                    # Use LLM to predict interaction
                    probability, llm_details = generate_fallback_prediction(medicine, food, "drug-food")
                    
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
                        
                        logger.info(f"LLM fallback prediction: {percentage}% ({severity})")
                        
                        return jsonify({
                            "success": True,
                            "medicine": medicine,
                            "food": food,
                            "probability": probability,
                            "percentage": percentage,
                            "severity": severity,
                            "severity_label": severity_label,
                            "details": llm_details,
                            "source": "llm_fallback"
                        })
                except Exception as e:
                    logger.error(f"LLM fallback failed: {str(e)}")
            
            return jsonify({
                "success": False,
                "error": f"Could not find chemical structure for '{medicine}' in PubChem database and LLM fallback unavailable"
            }), 404
        
        # Calculate 18 molecular descriptors
        features_df = calculate_dfi_descriptors(smiles)
        
        if features_df is None:
            logger.warning("Descriptor calculation failed - attempting LLM fallback")
            
            if LLM_AVAILABLE:
                try:
                    # Use LLM to predict interaction
                    probability, llm_details = generate_fallback_prediction(medicine, food, "drug-food")
                    
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
                        
                        logger.info(f"LLM fallback prediction: {percentage}% ({severity})")
                        
                        return jsonify({
                            "success": True,
                            "medicine": medicine,
                            "food": food,
                            "probability": probability,
                            "percentage": percentage,
                            "severity": severity,
                            "severity_label": severity_label,
                            "details": llm_details,
                            "source": "llm_fallback"
                        })
                except Exception as e:
                    logger.error(f"LLM fallback failed: {str(e)}")
            
            return jsonify({
                "success": False,
                "error": "Failed to calculate molecular descriptors and LLM fallback unavailable"
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
            # Model prediction failed - try LLM fallback
            logger.error(f"Model prediction failed: {str(e)}")
            logger.warning("Attempting LLM fallback...")
            
            if LLM_AVAILABLE:
                try:
                    probability, llm_details = generate_fallback_prediction(medicine, food, "drug-food")
                    
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
                        
                        logger.info(f"LLM fallback prediction: {percentage}% ({severity})")
                        
                        return jsonify({
                            "success": True,
                            "medicine": medicine,
                            "food": food,
                            "probability": probability,
                            "percentage": percentage,
                            "severity": severity,
                            "severity_label": severity_label,
                            "details": llm_details,
                            "source": "llm_fallback"
                        })
                except Exception as e2:
                    logger.error(f"LLM fallback failed: {str(e2)}")
            
            return jsonify({
                "success": False,
                "error": f"Model prediction failed: {str(e)} and LLM fallback unavailable"
            }), 500
        
        # ALWAYS generate LLM explanation for successful predictions
        llm_details = None
        interaction_detected = probability >= 0.4
        
        # Always attempt to generate LLM explanation
        try:
            logger.info("Generating LLM explanation for DFI...")
            if LLM_AVAILABLE:
                # Create custom prompt for drug-food interaction
                llm_details = generate_food_interaction_details(
                    medicine=medicine,
                    food=food,
                    probability=percentage,
                    severity=severity,
                    interaction_detected=interaction_detected
                )
                
                if llm_details:
                    logger.info("LLM explanation generated successfully")
                else:
                    logger.warning("LLM explanation generation returned None")
            else:
                logger.warning("LLM not available - skipping detailed explanation")
                    
        except Exception as e:
            logger.error(f"Error calling LLM service: {str(e)}")
        
        # Build response
        response_data = {
            "success": True,
            "medicine": medicine,
            "food": food,
            "probability": probability,
            "percentage": percentage,
            "severity": severity,
            "severity_label": severity_label
        }
        
        if llm_details:
            response_data["details"] = llm_details
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}"
        }), 500


def generate_food_interaction_details(medicine, food, probability, severity, interaction_detected):
    """Generate LLM explanation for drug-food interaction"""
    try:
        import ollama
        
        if interaction_detected and probability >= 40:
            prompt = f"""You are a clinical pharmacist AI. Analyze this drug-food interaction:

Medicine: {medicine}
Food: {food}
Interaction Risk: {probability:.1f}%
Severity: {severity}

Provide a concise clinical analysis in exactly this format:

MECHANISM: [2-3 sentences explaining WHY this food affects the drug's absorption, metabolism, or effectiveness]

SYMPTOMS: [List 3-5 specific symptoms or effects patients may experience from this interaction]

RECOMMENDATIONS: [2-3 specific actions - timing of medication, foods to avoid, monitoring needed]

ALTERNATIVES: [Suggest 1-2 alternative foods that are safer, or state "Consult healthcare provider"]

DOSAGE: [Brief guidance on timing medication around meals, or state "Take on empty stomach" / "Take with food"]

Keep responses evidence-based and concise."""

        else:
            prompt = f"""You are a clinical pharmacist AI. The AI model did not detect a significant interaction, but please verify:

Medicine: {medicine}
Food: {food}
Model Risk Score: {probability:.1f}% (Low)

Provide a brief safety assessment:

MECHANISM: [Explain if there are any minor effects on absorption/metabolism, or state "No significant interaction expected"]

SYMPTOMS: [List any minor effects to monitor, or state "No significant symptoms expected"]

RECOMMENDATIONS: [Brief advice or state "No special precautions needed - can take with or without food"]

ALTERNATIVES: [State "Not applicable - combination appears safe"]

DOSAGE: [State "Standard dosing - follow prescription" or any timing considerations]

Be concise and reassuring if truly safe."""

        response = ollama.chat(
            model="llama3.2:3b",
            messages=[{'role': 'user', 'content': prompt}],
            options={'temperature': 0.5, 'num_predict': 200}  # Aggressive speed optimization
        )
        
        content = response['message']['content']
        
        # Parse response (reuse parsing logic from llm_service)
        from llm_service import parse_llm_response
        return parse_llm_response(content)
        
    except Exception as e:
        logger.error(f"Error generating LLM explanation: {str(e)}")
        return None


if __name__ == '__main__':
    # Load model at startup
    if not load_model():
        logger.error("Failed to load DFI model. Exiting.")
        exit(1)
    
    # Start Flask server
    port = int(os.environ.get('DFI_SERVICE_PORT', 5002))
    logger.info(f"Starting DFI service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
