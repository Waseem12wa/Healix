"""
DDI (Drug-Drug Interaction) Prediction Microservice

This service provides drug interaction predictions using a CatBoost model.
It fetches chemical structures from PubChem, calculates molecular descriptors,
retrieves ATC drug classifications, and predicts interaction probabilities.
Enhanced with local LLM for detailed clinical explanations.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from catboost import CatBoostClassifier
import pubchempy as pcp
from rdkit import Chem
from rdkit.Chem import Descriptors, rdMolDescriptors
import requests
import os
import csv
import json
import logging

# Configure logging FIRST
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Redis cache support (persistent)
redis_client = None
try:
    import redis
    REDIS_HOST = os.environ.get('REDIS_HOST', 'localhost')
    REDIS_PORT = int(os.environ.get('REDIS_PORT', 6379))
    REDIS_DB = int(os.environ.get('REDIS_DB', 0))
    redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)
    redis_client.ping()
    logger.info(f"Using Redis cache at {REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}")
except Exception as e:
    redis_client = None
    logger.warning(f"Redis unavailable, using in-memory cache only: {e}")

# Metrics counters for fallback frequency
metrics = {
    'ddi_model_predictions': 0,
    'ddi_hf_fallbacks': 0,
    'ddi_smiles_misses': 0,
    'ddi_descriptor_misses': 0,
    'ddi_atc_misses': 0
}

def record_metric(key: str, inc: int = 1):
    if key not in metrics:
        metrics[key] = 0
    metrics[key] += inc

    if redis_client:
        try:
            redis_client.hincrby('ddi:metrics', key, inc)
        except Exception as e:
            logger.warning(f"Could not persist metric {key} to Redis: {e}")

# Use local utilities (no HF fallback)
try:
    from drug_utils import correct_drug_name, get_simple_interaction_details
except ImportError:
    from .drug_utils import correct_drug_name, get_simple_interaction_details

app = Flask(__name__)

CORS(app)

# Global model instance (loaded once at startup)
model = None
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'Models', 'DDI.cbm')

# In-memory caches for fast repeated lookup
smiles_cache = {}
atc_cache = {}
descriptor_cache = {}


def load_model():
    """Load the CatBoost model at startup"""
    global model
    try:
        logger.info(f"Loading CatBoost model from {MODEL_PATH}")
        model = CatBoostClassifier()
        model.load_model(MODEL_PATH)
        logger.info("Model loaded successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to load model: {str(e)}")
        return False


def fetch_smiles(medicine_name):
    """
    Fetch SMILES notation and CID from PubChem database (cached)
    """
    name_key = medicine_name.lower().strip()

    if not name_key:
        return None, None

    # Check Redis cache first
    if redis_client:
        cached = redis_client.get(f"ddi:smiles:{name_key}")
        if cached:
            try:
                cached_value = json.loads(cached)
                return cached_value.get('smiles'), cached_value.get('cid')
            except Exception:
                pass

    if name_key in smiles_cache:
        return smiles_cache[name_key]

    try:
        logger.info(f"Fetching SMILES for: {medicine_name}")
        compounds = pcp.get_compounds(medicine_name, 'name')

        if not compounds:
            correction = correct_drug_name(medicine_name)
            if correction and correction != medicine_name:
                logger.info(f"Trying corrected name for SMILES lookup: {correction}")
                compounds = pcp.get_compounds(correction, 'name')

        if not compounds:
            logger.warning(f"No compound found for: {medicine_name}")
            smiles_cache[name_key] = (None, None)
            return None, None

        smiles = compounds[0].canonical_smiles
        cid = compounds[0].cid

        logger.info(f"Found SMILES for {medicine_name}: {smiles} (CID: {cid})")
        smiles_cache[name_key] = (smiles, cid)
        if redis_client:
            redis_client.set(f"ddi:smiles:{name_key}", json.dumps({'smiles': smiles, 'cid': cid}), ex=86400)
        return smiles, cid

    except Exception as e:
        logger.error(f"Error fetching SMILES for {medicine_name}: {str(e)}")
        smiles_cache[name_key] = (None, None)
        if redis_client:
            redis_client.set(f"ddi:smiles:{name_key}", json.dumps({'smiles': None, 'cid': None}), ex=300)
        return None, None


def fetch_atc_classification(medicine_name, cid):
    """
    Fetch ATC (Anatomical Therapeutic Chemical) classification from PubChem (cached)
    """
    if cid is None:
        return None

    cache_key = f"{medicine_name.lower().strip()}::{cid}"

    # Redis cache
    if redis_client:
        cached = redis_client.get(f"ddi:atc:{cache_key}")
        if cached:
            try:
                value = json.loads(cached)
                return value
            except Exception:
                pass

    if cache_key in atc_cache:
        return atc_cache[cache_key]

    try:
        logger.info(f"Fetching ATC classification for: {medicine_name} (CID: {cid})")
        url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/{cid}/JSON"
        response = requests.get(url, timeout=15)

        if response.status_code != 200:
            logger.warning(f"Could not fetch PubChem data for CID {cid}")
            atc_cache[cache_key] = None
            return None

        data = response.json()

        atc_codes = []
        try:
            sections = data.get('Record', {}).get('Section', [])
            for section in sections:
                if 'Section' in section:
                    for subsection in section['Section']:
                        if subsection.get('TOCHeading') == 'ATC Code':
                            for info in subsection.get('Information', []):
                                for item in info.get('Value', {}).get('StringWithMarkup', []):
                                    code = item.get('String')
                                    if isinstance(code, str) and len(code) >= 5 and code[0].isalpha():
                                        atc_codes.append(code)
        except (KeyError, TypeError) as e:
            logger.warning(f"Error parsing ATC data: {e}")

        if not atc_codes:
            logger.warning(f"No ATC codes found for {medicine_name}")
            atc_cache[cache_key] = None
            record_metric('ddi_atc_misses')
            if redis_client:
                redis_client.set(f"ddi:atc:{cache_key}", json.dumps(None), ex=3600)
            return None

        primary_atc = atc_codes[0]
        logger.info(f"Primary ATC code for {medicine_name}: {primary_atc}")

        classification = {
            'state': 'solid',
            'level1': primary_atc[0] if len(primary_atc) >= 1 else 'unknown',
            'level2': primary_atc[:3] if len(primary_atc) >= 3 else 'unknown',
            'level3': primary_atc[:4] if len(primary_atc) >= 4 else 'unknown',
            'level4': primary_atc[:5] if len(primary_atc) >= 5 else 'unknown',
        }

        logger.info(f"ATC classification: {classification}")
        atc_cache[cache_key] = classification
        if redis_client:
            redis_client.set(f"ddi:atc:{cache_key}", json.dumps(classification), ex=86400)
        return classification

    except Exception as e:
        logger.error(f"Error fetching ATC classification: {str(e)}")
        atc_cache[cache_key] = None
        return None


def calculate_descriptors(smiles, atc_classification=None, drug_suffix='_x'):
    """
    Calculate molecular descriptors from SMILES matching the model's expected features (cached)
    """
    if not smiles:
        return None

    cache_key = f"{smiles}::{drug_suffix}"

    # Redis cache
    if redis_client:
        cached = redis_client.get(f"ddi:descriptor:{cache_key}")
        if cached:
            try:
                desc = json.loads(cached)
                descriptor_cache[cache_key] = desc
                return desc
            except Exception:
                pass

    if cache_key in descriptor_cache:
        return descriptor_cache[cache_key]

    try:
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            logger.error(f"Invalid SMILES: {smiles}")
            descriptor_cache[cache_key] = None
            return None

        # Calculate RDKit descriptors
        mw = Descriptors.MolWt(mol)
        logp = Descriptors.MolLogP(mol)
        tpsa = Descriptors.TPSA(mol)
        h_donors = Descriptors.NumHDonors(mol)
        h_acceptors = Descriptors.NumHAcceptors(mol)
        rotatable_bonds = Descriptors.NumRotatableBonds(mol)
        num_rings = rdMolDescriptors.CalcNumRings(mol)
        refractivity = Descriptors.MolMR(mol)

        # Estimate logS (water solubility) using simple ESOL formula
        aromatic_proportion = rdMolDescriptors.CalcNumAromaticRings(mol) / max(num_rings, 1)
        logs = 0.16 - 0.63*logp - 0.0062*mw + 0.066*rotatable_bonds - 0.74*aromatic_proportion
        water_solubility = 10**logs
        
        # Estimate pKa values
        pka_acidic = None
        pka_basic = None
        
        if 'C(=O)O' in smiles or 'c(O)' in smiles:
            pka_acidic = 4.5
        
        if 'N' in smiles:
            pka_basic = 9.0
        
        # Bioavailability estimate
        bioavailability = 1 if (mw <= 500 and logp <= 5 and h_donors <= 5 and h_acceptors <= 10) else 0
        
        # Monoisotopic weight
        monoisotopic_weight = mw
        
        # Polarizability
        polarizability = refractivity / 10.0
        
        # Physiological charge
        physiological_charge = 0
        if pka_acidic and pka_acidic < 7.4:
            physiological_charge = -1
        elif pka_basic and pka_basic > 7.4:
            physiological_charge = 1
        
        # Drug-likeness filters
        num_atoms = mol.GetNumAtoms()
        ghose_filter = 1 if (160 <= mw <= 480 and -0.4 <= logp <= 5.6 and 
                            40 <= refractivity <= 130 and 20 <= num_atoms <= 70) else 0
        
        mddr_like = 1 if (mw <= 500 and logp <= 5 and h_donors <= 5 and 
                         h_acceptors <= 10 and rotatable_bonds <= 8) else 0
        
        rule_of_five = bioavailability
        
        # Use ATC classification if available, otherwise use defaults
        if atc_classification:
            state = atc_classification.get('state', 'solid')
            level1 = atc_classification.get('level1', 'unknown')
            level2 = atc_classification.get('level2', 'unknown')
            level3 = atc_classification.get('level3', 'unknown')
            level4 = atc_classification.get('level4', 'unknown')
        else:
            state = 'solid'
            level1 = 'unknown'
            level2 = 'unknown'
            level3 = 'unknown'
            level4 = 'unknown'
        
        # Create feature dictionary
        # CRITICAL: Categorical features must be strings, numerical features must be numbers (floats/ints)
        features = {
            # Categorical features (strings)
            f'state{drug_suffix}': state,
            f'level4{drug_suffix}': level4,
            f'level3{drug_suffix}': level3,
            f'level2{drug_suffix}': level2,
            f'level1{drug_suffix}': level1,
            
            # Numerical features (floats/ints, NOT strings)
            f'Molecular Weight{drug_suffix}': float(mw),
            f'logP{drug_suffix}': float(logp),
            f'Water Solubility{drug_suffix}': float(water_solubility),
            f'logS{drug_suffix}': float(logs),
            f'Bioavailability{drug_suffix}': int(bioavailability),
            f'pKa (strongest acidic){drug_suffix}': float(pka_acidic) if pka_acidic else float('nan'),
            f'Refractivity{drug_suffix}': float(refractivity),
            f'Number of Rings{drug_suffix}': int(num_rings),
            f'H Bond Donor Count{drug_suffix}': int(h_donors),
            f'Rotatable Bond Count{drug_suffix}': int(rotatable_bonds),
            f'Polar Surface Area (PSA){drug_suffix}': float(tpsa),
            f'pKa (strongest basic){drug_suffix}': float(pka_basic) if pka_basic else float('nan'),
            f'Ghose Filter{drug_suffix}': int(ghose_filter),
            f'Monoisotopic Weight{drug_suffix}': float(monoisotopic_weight),
            f'MDDR-Like Rule{drug_suffix}': int(mddr_like),
            f'Polarizability{drug_suffix}': float(polarizability),
            f'H Bond Acceptor Count{drug_suffix}': int(h_acceptors),
            f'Physiological Charge{drug_suffix}': int(physiological_charge),
            f'Rule of Five{drug_suffix}': int(rule_of_five),
        }
        
        logger.info(f"Calculated {len(features)} features for drug{drug_suffix}")
        descriptor_cache[cache_key] = features
        if redis_client:
            try:
                redis_client.set(f"ddi:descriptor:{cache_key}", json.dumps(features), ex=86400)
            except Exception as e:
                logger.warning(f"Failed to persist descriptor in Redis: {e}")
        return features
        
    except Exception as e:
        logger.error(f"Error calculating descriptors: {str(e)}")
        descriptor_cache[cache_key] = None
        if redis_client:
            try:
                redis_client.set(f"ddi:descriptor:{cache_key}", json.dumps(None), ex=300)
            except Exception:
                pass
        return None


def predict_interaction(features_drug1, features_drug2):
    """
    Predict drug-drug interaction using CatBoost model
    
    Args:
        features_drug1 (dict): Feature dictionary for drug 1 (with _x suffix)
        features_drug2 (dict): Feature dictionary for drug 2 (with _y suffix)
        
    Returns:
        dict: Prediction results with probability, severity, and percentage
    """
    try:
        # Merge features from both drugs
        all_features = {**features_drug1, **features_drug2}
        
        # Get model's expected feature names in correct order
        expected_features = model.feature_names_
        
        # Create feature list in the exact order the model expects
        feature_values = []
        for feature_name in expected_features:
            if feature_name in all_features:
                feature_values.append(all_features[feature_name])
            else:
                # If feature is missing, use a default value
                logger.warning(f"Missing feature: {feature_name}, using default 'unknown'")
                feature_values.append('unknown')
        
        logger.info(f"Prepared {len(feature_values)} features for prediction")
        
        # Predict interaction probability
        proba = model.predict_proba([feature_values])[0][1]  # Probability of interaction
        percentage = round(proba * 100, 2)
        
        # Determine severity based on probability thresholds
        if percentage > 70:
            severity = "Severe"
            severity_label = "Dangerous"
        elif percentage >= 40:
            severity = "Mild"
            severity_label = "Caution"
        else:
            severity = "None"
            severity_label = "Low Risk"
        
        logger.info(f"Prediction: {percentage}% ({severity})")
        
        return {
            "probability": proba,
            "percentage": percentage,
            "severity": severity,
            "severity_label": severity_label
        }
        
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return None


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None
    })


@app.route('/metrics', methods=['GET'])
def metrics_endpoint():
    """Interaction analytics metrics"""
    if redis_client:
        try:
            if redis_client.exists('ddi:metrics'):
                saved = redis_client.hgetall('ddi:metrics')
                return jsonify({**metrics, **{k: int(v) for k, v in saved.items()}})
        except Exception as e:
            logger.warning(f"Cannot read Redis metrics: {e}")

    return jsonify(metrics)


@app.route('/predict', methods=['POST'])
def predict():
    """
    Main prediction endpoint
    
    Expected JSON body:
    {
        "drug1": "Aspirin",
        "drug2": "Warfarin"
    }
    
    Returns:
    {
        "success": true,
        "drug1": "Aspirin",
        "drug2": "Warfarin",
        "probability": 0.85,
        "percentage": 85.0,
        "severity": "Severe",
        "severity_label": "Dangerous"
    }
    """
    try:
        if model is None and not load_model():
            logger.error("DDI model lazy initialization failed")
            return jsonify({
                "success": False,
                "error": "DDI model is unavailable. Please try again in a moment."
            }), 503

        data = request.get_json()
        
        if not data or 'drug1' not in data or 'drug2' not in data:
            return jsonify({
                "success": False,
                "error": "Missing required fields: drug1 and drug2"
            }), 400
        
        drug1 = correct_drug_name(data['drug1'])
        drug2 = correct_drug_name(data['drug2'])

        logger.info(f"Processing interaction check: {drug1} + {drug2}")

        # Fetch SMILES and CID for both drugs (cached)
        smiles1, cid1 = fetch_smiles(drug1)
        smiles2, cid2 = fetch_smiles(drug2)

        if not smiles1 or not smiles2:
            missing_drug = drug1 if not smiles1 else drug2
            logger.error(f"Could not find SMILES for {missing_drug}")
            return jsonify({
                "success": False,
                "error": f"Could not find chemical structure for '{missing_drug}' in PubChem database"
            }), 404

        # Fetch ATC classifications (optional - will use defaults if not found)
        atc1 = fetch_atc_classification(drug1, cid1)
        atc2 = fetch_atc_classification(drug2, cid2)
        
        # Calculate molecular descriptors with ATC classifications
        descriptors1 = calculate_descriptors(smiles1, atc1, drug_suffix='_x')
        descriptors2 = calculate_descriptors(smiles2, atc2, drug_suffix='_y')
        
        if descriptors1 is None or descriptors2 is None:
            logger.error("Descriptor calculation failed")
            return jsonify({
                "success": False,
                "error": "Failed to calculate molecular descriptors"
            }), 500
        
        # Predict interaction using model
        prediction = predict_interaction(descriptors1, descriptors2)

        if prediction is None:
            logger.error("Model prediction failed")
            return jsonify({
                "success": False,
                "error": "Model prediction failed"
            }), 500

# Record model prediction analytics
        record_metric('ddi_model_predictions')
        # Build fallback-friendly explanation from model output
        interaction_detected = prediction['probability'] >= 0.4
        
        # Generate concise deterministic explanation (no LLM dependency)
        explanation = get_simple_interaction_details(
            item1=drug1,
            item2=drug2,
            percentage=prediction['percentage'],
            severity=prediction['severity']
        )

        response_data = {
            "success": True,
            "drug1": drug1,
            "drug2": drug2,
            **prediction,
            "details": explanation,
            "source": "model"
        }

        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}"
        }), 500


if __name__ == '__main__':
    # Start Flask server
    port = int(os.environ.get('DDI_SERVICE_PORT', 5001))
    logger.info(f"Starting DDI service on port {port}")
    app.run(host='127.0.0.1', port=port, debug=False)
