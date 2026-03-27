import csv
import difflib
import json
import logging
import os
from typing import Dict, Optional, Tuple, List

from sentence_transformers import SentenceTransformer, util

logger = logging.getLogger(__name__)

# HF fallback model intentionally disabled.
# Requirement: prediction features must rely on their dedicated ML models only.
HF_MODEL = None

# Default curated drug list to use when CSV is missing
_DEFAULT_DRUGS = [
    'aspirin', 'ibuprofen', 'paracetamol', 'acetaminophen', 'metformin', 'warfarin',
    'amoxicillin', 'lisinopril', 'atorvastatin', 'omeprazole', 'simvastatin', 'cetirizine',
    'diphenhydramine', 'naproxen', 'pantoprazole', 'clopidogrel', 'prednisone', 'azithromycin',
    'insulin', 'sertraline', 'fluoxetine', 'diazepam', 'alprazolam', 'morphine', 'codeine',
    'hydrochlorothiazide', 'furosemide', 'amitriptyline', 'diltiazem', 'verapamil', 'rabeprazole',
    'escitalopram', 'ranitidine', 'metoprolol', 'levothyroxine', 'valproate', 'lidocaine',
    'nitroglycerin', 'clonazepam', 'spironolactone', 'glimepiride', 'insulin glargine'
]


def load_known_drugs() -> List[str]:
    # Look for data/drugs.csv at repository root
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    csv_path = os.path.join(base_dir, 'data', 'drugs.csv')

    if not os.path.isfile(csv_path):
        logger.warning(f"Drug CSV not found at {csv_path}, using default known drug list")
        return _DEFAULT_DRUGS

    drugs = set()
    try:
        with open(csv_path, newline='', encoding='utf-8') as f:
            reader = csv.reader(f)
            for row in reader:
                if not row:
                    continue
                name = row[0].strip().lower()
                if name:
                    drugs.add(name)
        if not drugs:
            logger.warning("Drug CSV is empty, falling back to default known drugs")
            return _DEFAULT_DRUGS

        logger.info(f"Loaded {len(drugs)} known drugs from {csv_path}")
        return sorted(drugs)

    except Exception as e:
        logger.exception(f"Failed to read known drug CSV: {e}")
        return _DEFAULT_DRUGS


KNOWN_DRUGS: List[str] = load_known_drugs()

# Common typos mapping
COMMON_TYPOS = {
    'asprin': 'aspirin',
    'ibuprophen': 'ibuprofen',
    'metphormin': 'metformin',
    'amoxcillin': 'amoxicillin',
    'vicodin': 'hydrocodone',
    'tylenol': 'acetaminophen',
    'paracetmol': 'paracetamol',
    'lasix': 'furosemide',
    'xanax': 'alprazolam'
}

# Example high-risk DDI pairs (for fallback scoring)
KNOWN_HIGH_RISK_DDI = {
    ('warfarin', 'aspirin'): 0.95,
    ('warfarin', 'ibuprofen'): 0.92,
    ('clopidogrel', 'aspirin'): 0.88,
    ('simvastatin', 'clarithromycin'): 0.85,
    ('metformin', 'cimetidine'): 0.72,
    ('lisinopril', 'spironolactone'): 0.78,
    ('amlodipine', 'simvastatin'): 0.68
}

# Example high-risk DFI pairs (for fallback scoring)
KNOWN_HIGH_RISK_DFI = {
    ('warfarin', 'grapefruit'): 0.88,
    ('simvastatin', 'grapefruit'): 0.83,
    ('atorvastatin', 'grapefruit'): 0.81,
    ('metformin', 'alcohol'): 0.75,
    ('lisinopril', 'salt'): 0.64,
    ('azithromycin', 'dairy'): 0.45
}

# Default curated food list for drug-food interactions
_DEFAULT_FOODS = [
    'grapefruit', 'grapefruit juice', 'orange juice', 'apple juice', 'pomegranate juice',
    'alcohol', 'ethanol', 'wine', 'beer', 'liquor', 'spirits',
    'dairy', 'milk', 'cheese', 'yogurt', 'butter', 'cream',
    'salt', 'sodium', 'potassium', 'calcium', 'magnesium',
    'coffee', 'caffeine', 'tea', 'green tea', 'black tea',
    'broccoli', 'spinach', 'kale', 'lettuce', 'cabbage',
    'soy', 'soy milk', 'tofu', 'soy sauce',
    'cranberry', 'cranberry juice', 'pomegranate',
    'garlic', 'ginger', 'turmeric', 'pepper', 'cinnamon',
    'fatty fish', 'salmon', 'tuna', 'mackerel',
    'nuts', 'almonds', 'walnuts', 'peanuts',
    'chocolate', 'dark chocolate', 'cocoa'
]


def load_known_foods() -> List[str]:
    # Look for data/foods.csv at repository root
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    csv_path = os.path.join(base_dir, 'data', 'foods.csv')

    if not os.path.isfile(csv_path):
        logger.warning(f"Food CSV not found at {csv_path}, using default known food list")
        return _DEFAULT_FOODS

    foods = set()
    try:
        with open(csv_path, newline='', encoding='utf-8') as f:
            reader = csv.reader(f)
            for row in reader:
                if not row:
                    continue
                name = row[0].strip().lower()
                if name:
                    foods.add(name)
        if not foods:
            logger.warning("Food CSV is empty, falling back to default known foods")
            return _DEFAULT_FOODS

        logger.info(f"Loaded {len(foods)} known foods from {csv_path}")
        return sorted(foods)

    except Exception as e:
        logger.exception(f"Failed to read known food CSV: {e}")
        return _DEFAULT_FOODS


KNOWN_FOODS: List[str] = load_known_foods()

# Common food typos mapping
COMMON_FOOD_TYPOS = {
    'grapfruit': 'grapefruit',
    'grape fruit': 'grapefruit',
    'grape-fruit': 'grapefruit',
    'grapefruitjuice': 'grapefruit juice',
    'orangejuice': 'orange juice',
    'applejuice': 'apple juice',
    'pomegranatejuice': 'pomegranate juice',
    'alchohol': 'alcohol',
    'ethenol': 'ethanol',
    'dairyproducts': 'dairy',
    'dairymilk': 'milk',
    'cheeze': 'cheese',
    'yoghurt': 'yogurt',
    'creme': 'cream',
    'sodiumchloride': 'salt',
    'caffiene': 'caffeine',
    'brocolli': 'broccoli',
    'spinich': 'spinach',
    'soymilk': 'soy milk',
    'soysauce': 'soy sauce',
    'cranberryjuice': 'cranberry juice',
    'darkchocolate': 'dark chocolate',
    'fattyfish': 'fatty fish'
}


def normalize_food_name(name: str) -> str:
    if not isinstance(name, str) or not name.strip():
        return ''
    normalized = ''.join(ch for ch in name.lower() if ch.isalnum() or ch.isspace()).strip()
    return ' '.join(normalized.split())


def correct_food_name(name: str) -> str:
    if not name or not isinstance(name, str):
        return name

    raw = name.strip()
    normalized = normalize_food_name(raw)

    if not normalized:
        return raw

    # Direct typos map
    if normalized in COMMON_FOOD_TYPOS:
        return COMMON_FOOD_TYPOS[normalized]

    # Exact known food
    if normalized in KNOWN_FOODS:
        return normalized

    # Fuzzy match within known foods, including as-is and normalized spellings
    close = difflib.get_close_matches(normalized, KNOWN_FOODS, n=1, cutoff=0.7)
    if close:
        return close[0]

    close2 = difflib.get_close_matches(normalized, list(COMMON_FOOD_TYPOS.keys()), n=1, cutoff=0.7)
    if close2 and close2[0] in COMMON_FOOD_TYPOS:
        return COMMON_FOOD_TYPOS[close2[0]]

    return raw

# Cached embeddings for quick operations
HF_KNOWN_DDI_EMBEDDINGS = None
HF_KNOWN_DFI_EMBEDDINGS = None


def normalize_drug_name(name: str) -> str:
    if not isinstance(name, str) or not name.strip():
        return ''
    normalized = ''.join(ch for ch in name.lower() if ch.isalnum() or ch.isspace()).strip()
    return ' '.join(normalized.split())


def correct_drug_name(name: str) -> str:
    if not name or not isinstance(name, str):
        return name

    raw = name.strip()
    normalized = normalize_drug_name(raw)

    if not normalized:
        return raw

    # Direct typos map
    if normalized in COMMON_TYPOS:
        return COMMON_TYPOS[normalized]

    # Exact known drug
    if normalized in KNOWN_DRUGS:
        return normalized

    # Fuzzy match within known drugs, including as-is and normalized spellings
    close = difflib.get_close_matches(normalized, KNOWN_DRUGS, n=1, cutoff=0.7)
    if close:
        return close[0]

    close2 = difflib.get_close_matches(normalized, list(COMMON_TYPOS.keys()), n=1, cutoff=0.7)
    if close2 and close2[0] in COMMON_TYPOS:
        return COMMON_TYPOS[close2[0]]

    return raw


def _ensure_hf_embeddings():
    global HF_KNOWN_DDI_EMBEDDINGS, HF_KNOWN_DFI_EMBEDDINGS

    if HF_MODEL is None:
        return

    if HF_KNOWN_DDI_EMBEDDINGS is None:
        KDDI = [f"{a} + {b}" for a, b in KNOWN_HIGH_RISK_DDI.keys()]
        HF_KNOWN_DDI_EMBEDDINGS = HF_MODEL.encode(KDDI, convert_to_tensor=True, show_progress_bar=False)

    if HF_KNOWN_DFI_EMBEDDINGS is None:
        KDFI = [f"{a} + {b}" for a, b in KNOWN_HIGH_RISK_DFI.keys()]
        HF_KNOWN_DFI_EMBEDDINGS = HF_MODEL.encode(KDFI, convert_to_tensor=True, show_progress_bar=False)


def hf_fallback_prediction(item1: str, item2: str, interaction_type: str = 'drug-drug') -> Tuple[Optional[float], Optional[Dict[str, str]]]:
    """Fallback prediction using lightweight HF embedding similarity."""
    raise RuntimeError("HF fallback prediction has been removed (models-only mode).")
    try:
        item1_norm = normalize_drug_name(item1)
        item2_norm = normalize_drug_name(item2)

        if not item1_norm or not item2_norm:
            return None, None

        # Apply correction first - handle both drug-drug and drug-food
        if interaction_type == 'drug-food':
            item1_c = correct_drug_name(item1_norm)  # drug
            item2_c = correct_food_name(item2_norm)  # food
        else:
            item1_c = correct_drug_name(item1_norm)
            item2_c = correct_drug_name(item2_norm)

        # Use known exact pattern if available
        key = (item1_c.lower(), item2_c.lower())
        rev_key = (item2_c.lower(), item1_c.lower())

        if interaction_type == 'drug-drug':
            baseline_map = KNOWN_HIGH_RISK_DDI
        else:
            baseline_map = KNOWN_HIGH_RISK_DFI

        if key in baseline_map:
            prob = baseline_map[key]
        elif rev_key in baseline_map:
            prob = baseline_map[rev_key]
        else:
            if HF_MODEL is None:
                prob = 0.4
            else:
                _ensure_hf_embeddings()
                pair = f"{item1_c} + {item2_c}"
                embedding = HF_MODEL.encode(pair, convert_to_tensor=True)
                if interaction_type == 'drug-drug':
                    known_embeddings = HF_KNOWN_DDI_EMBEDDINGS
                    known_keys = list(KNOWN_HIGH_RISK_DDI.keys())
                else:
                    known_embeddings = HF_KNOWN_DFI_EMBEDDINGS
                    known_keys = list(KNOWN_HIGH_RISK_DFI.keys())

                if known_embeddings is not None:
                    scores = util.cos_sim(embedding, known_embeddings)[0]
                    best_idx = int(scores.argmax())
                    best_score = float(scores[best_idx])

                    # We map from semantic similarity to risk heuristics
                    raw_risk = baseline_map[known_keys[best_idx]] if interaction_type == 'drug-drug' else baseline_map[known_keys[best_idx]]
                    prob = min(0.99, max(0.05, raw_risk * (0.6 + 0.4 * best_score)))
                else:
                    prob = 0.4

        percentage = round(prob * 100, 2)

        # Build basic detail text
        details = {
            'mechanism': f'Fallback estimation based on bio-medical similarity patterns for {item1_c} and {item2_c}.',
            'symptoms': 'Potential interaction may increase bleeding risk or alter drug efficacy. Monitor for headache, dizziness, or GI upset.',
            'recommendations': 'Review with clinical pharmacist and consider dose adjustment or alternative therapy.',
            'alternatives': 'Consider alternative non-interacting medication or avoid concurrent administration.',
            'dosage_adjustments': 'Follow standard guidelines in existing drug interaction charts.'
        }

        return prob, details

    except Exception as e:
        logger.error(f"HF fallback prediction failed: {e}")
        return None, None


def get_simple_interaction_details(item1: str, item2: str, percentage: float, severity: str) -> Dict[str, str]:
    state = 'high' if percentage >= 70 else 'moderate' if percentage >= 40 else 'low'
    return {
        'mechanism': f'{item1} and {item2} may have {state} interaction potential according to model-based prediction.',
        'symptoms': 'Monitor for clinical signs, such as dizziness, bleeding, or altered drug effect.',
        'recommendations': 'Consult healthcare provider; adjust dosing or spacing if needed.',
        'alternatives': 'Consider alternatives if risk is high; evaluate therapy goals.',
        'dosage_adjustments': 'Use standard interaction management, e.g., reduced dosage or avoid co-administration.'
    }
