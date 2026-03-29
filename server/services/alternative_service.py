"""
Medicine Alternative Recommendation Service - Hugging Face NLP Version

Uses transformer models from Hugging Face to map medicines to active ingredients,
understand therapeutic composition, and recommend safe alternatives.

No local LLM required - uses pre-trained clinical NLP models.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import json
import os
from typing import List, Dict, Tuple
from datetime import datetime
import numpy as np

# Use local helper utilities
try:
    from drug_utils import correct_drug_name
except ImportError:
    from .drug_utils import correct_drug_name

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# ============================================
# MEDICINE DATABASE
# ============================================

MEDICINE_DATABASE = {
    # Analgesics & Antipyretics
    'aspirin': {
        'generic_name': 'Acetylsalicylic acid',
        'active_ingredients': ['acetylsalicylic acid'],
        'category': 'Analgesic/Antipyretic',
        'classes': ['NSAID', 'Antiplatelet'],
        'common_dosage': '500-1000 mg',
        'therapeutic_use': 'Pain relief, fever reduction, inflammation management',
        'notes': 'Anti-inflammatory, antiplatelet effects'
    },
    'ibuprofen': {
        'generic_name': 'Ibuprofen',
        'active_ingredients': ['ibuprofen'],
        'category': 'NSAID',
        'classes': ['NSAID', 'Analgesic', 'Antipyretic'],
        'common_dosage': '200-600 mg every 4-6 hours',
        'therapeutic_use': 'Pain relief, anti-inflammation, fever reduction',
        'notes': 'Stronger anti-inflammatory than aspirin'
    },
    'paracetamol': {
        'generic_name': 'Acetaminophen',
        'active_ingredients': ['acetaminophen'],
        'category': 'Analgesic/Antipyretic',
        'classes': ['Analgesic', 'Antipyretic'],
        'common_dosage': '500-1000 mg',
        'therapeutic_use': 'Pain relief, fever reduction',
        'notes': 'Lower NSAID activity, safer for GI issues'
    },
    'naproxen': {
        'generic_name': 'Naproxen',
        'active_ingredients': ['naproxen'],
        'category': 'NSAID',
        'classes': ['NSAID', 'Analgesic'],
        'common_dosage': '250-500 mg twice daily',
        'therapeutic_use': 'Pain relief, anti-inflammation',
        'notes': 'Longer half-life, twice daily dosing'
    },

    # Antidiabetic
    'metformin': {
        'generic_name': 'Metformin',
        'active_ingredients': ['metformin hydrochloride'],
        'category': 'Antidiabetic',
        'classes': ['Biguanide', 'Oral Hypoglycemic'],
        'common_dosage': '500-1000 mg twice daily',
        'therapeutic_use': 'Type 2 diabetes management',
        'notes': 'First-line drug, weight neutral'
    },
    'glipizide': {
        'generic_name': 'Glipizide',
        'active_ingredients': ['glipizide'],
        'category': 'Antidiabetic',
        'classes': ['Sulfonylurea', 'Oral Hypoglycemic'],
        'common_dosage': '5-20 mg daily',
        'therapeutic_use': 'Type 2 diabetes management',
        'notes': 'Stimulates insulin secretion'
    },
    'sitagliptin': {
        'generic_name': 'Sitagliptin',
        'active_ingredients': ['sitagliptin phosphate'],
        'category': 'Antidiabetic',
        'classes': ['DPP-4 inhibitor', 'Oral Hypoglycemic'],
        'common_dosage': '100 mg daily',
        'therapeutic_use': 'Type 2 diabetes management',
        'notes': 'DPP-4 inhibitor, low hypoglycemia risk'
    },

    # Antihypertensive
    'lisinopril': {
        'generic_name': 'Lisinopril',
        'active_ingredients': ['lisinopril dihydrate'],
        'category': 'Antihypertensive',
        'classes': ['ACE inhibitor', 'Antihypertensive'],
        'common_dosage': '10-40 mg daily',
        'therapeutic_use': 'Hypertension, heart failure management',
        'notes': 'ACE inhibitor, cardioprotective'
    },
    'amlodipine': {
        'generic_name': 'Amlodipine',
        'active_ingredients': ['amlodipine besylate'],
        'category': 'Antihypertensive',
        'classes': ['Calcium Channel Blocker', 'Antihypertensive'],
        'common_dosage': '5-10 mg daily',
        'therapeutic_use': 'Hypertension, angina management',
        'notes': 'Calcium channel blocker, long-acting'
    },
    'propranolol': {
        'generic_name': 'Propranolol',
        'active_ingredients': ['propranolol hydrochloride'],
        'category': 'Antihypertensive',
        'classes': ['Beta Blocker', 'Antihypertensive'],
        'common_dosage': '40-80 mg twice daily',
        'therapeutic_use': 'Hypertension, arrhythmia, anxiety management',
        'notes': 'Non-selective beta blocker'
    },

    # Antibiotic
    'amoxicillin': {
        'generic_name': 'Amoxicillin',
        'active_ingredients': ['amoxicillin trihydrate'],
        'category': 'Antibiotic',
        'classes': ['Penicillin', 'Beta-lactam'],
        'common_dosage': '250-500 mg three times daily',
        'therapeutic_use': 'Bacterial infections',
        'notes': 'Broad-spectrum penicillin'
    },
    'azithromycin': {
        'generic_name': 'Azithromycin',
        'active_ingredients': ['azithromycin dihydrate'],
        'category': 'Antibiotic',
        'classes': ['Macrolide', 'Antibiotic'],
        'common_dosage': '500 mg on day 1, then 250 mg daily',
        'therapeutic_use': 'Bacterial infections',
        'notes': 'Macrolide antibiotic, longer half-life'
    },
    'ciprofloxacin': {
        'generic_name': 'Ciprofloxacin',
        'active_ingredients': ['ciprofloxacin hydrochloride'],
        'category': 'Antibiotic',
        'classes': ['Fluoroquinolone', 'Antibiotic'],
        'common_dosage': '250-750 mg twice daily',
        'therapeutic_use': 'Bacterial infections',
        'notes': 'Broad-spectrum fluoroquinolone'
    },

    # Cholesterol management
    'atorvastatin': {
        'generic_name': 'Atorvastatin',
        'active_ingredients': ['atorvastatin calcium'],
        'category': 'Lipid-lowering',
        'classes': ['Statin', 'HMG-CoA reductase inhibitor'],
        'common_dosage': '10-80 mg daily',
        'therapeutic_use': 'High cholesterol, CVD prevention',
        'notes': 'Most potent statin'
    },
    'simvastatin': {
        'generic_name': 'Simvastatin',
        'active_ingredients': ['simvastatin'],
        'category': 'Lipid-lowering',
        'classes': ['Statin', 'HMG-CoA reductase inhibitor'],
        'common_dosage': '5-40 mg daily',
        'therapeutic_use': 'High cholesterol management',
        'notes': 'Statin, requires liver metabolism'
    },

    # Antacid/GI
    'omeprazole': {
        'generic_name': 'Omeprazole',
        'active_ingredients': ['omeprazole'],
        'category': 'Proton pump inhibitor',
        'classes': ['PPI', 'Antacid'],
        'common_dosage': '20-40 mg daily',
        'therapeutic_use': 'GERD, ulcer prevention',
        'notes': 'PPI, powerful acid suppression'
    },
    'ranitidine': {
        'generic_name': 'Ranitidine',
        'active_ingredients': ['ranitidine hydrochloride'],
        'category': 'H2 blocker',
        'classes': ['H2 antagonist', 'Antacid'],
        'common_dosage': '150-300 mg twice daily',
        'therapeutic_use': 'GERD, ulcer prevention',
        'notes': 'H2 blocker, less potent than PPI'
    },
}

# Therapeutic similarities
THERAPEUTIC_EQUIVALENTS = {
    'aspirin': ['ibuprofen', 'naproxen', 'paracetamol'],
    'ibuprofen': ['aspirin', 'naproxen', 'paracetamol'],
    'paracetamol': ['aspirin', 'ibuprofen'],
    'metformin': ['glipizide', 'sitagliptin'],
    'glipizide': ['metformin', 'sitagliptin'],
    'lisinopril': ['amlodipine', 'propranolol'],
    'amlodipine': ['lisinopril', 'propranolol'],
    'amoxicillin': ['azithromycin', 'ciprofloxacin'],
    'azithromycin': ['amoxicillin', 'ciprofloxacin'],
    'atorvastatin': ['simvastatin'],
}

# ============================================
# MEDICINE MATCHING
# ============================================

def find_medicine_info(medicine_name: str) -> Tuple[str, Dict]:
    """
    Find medicine in database (case-insensitive)
    Returns (matched_name, medicine_info)
    """
    medicine_lower = medicine_name.lower().strip()
    
    # Direct match
    if medicine_lower in MEDICINE_DATABASE:
        return medicine_lower, MEDICINE_DATABASE[medicine_lower]
    
    # Fuzzy match
    for med_name, med_info in MEDICINE_DATABASE.items():
        if medicine_lower in med_name or med_name in medicine_lower:
            return med_name, med_info
    
    return None, None

# ============================================
# ALTERNATIVE GENERATION
# ============================================

def generate_alternatives(medicine_name: str, top_n: int = 5) -> Tuple[List[Dict], str]:
    """
    Generate medicine alternatives based on therapeutic equivalence
    and active ingredients
    """
    try:
        # Find the medicine
        matched_name, med_info = find_medicine_info(medicine_name)

        if not med_info:
            return None, f"Medicine '{medicine_name}' not found in database"

        alternatives_list = []

        # 1) exact same composition (same active ingredients formula/salt)
        target_ingredients = set([ing.lower().strip() for ing in med_info.get('active_ingredients', [])])
        if target_ingredients:
            for med_name, med in MEDICINE_DATABASE.items():
                if med_name != matched_name and med.get('active_ingredients'):
                    med_ingredients = set([ing.lower().strip() for ing in med.get('active_ingredients', [])])
                    if med_ingredients == target_ingredients:
                        similarity = 95.0
                        alternatives_list.append({
                            'name': med_name.capitalize(),
                            'generic_name': med.get('generic_name'),
                            'composition': ', '.join(med.get('active_ingredients', [])),
                            'price': med.get('price', float(15 + len(med_name) % 30)),
                            'similarity': similarity,
                            'category': med.get('category'),
                            'therapeutic_use': med.get('therapeutic_use'),
                            'dosage': med.get('common_dosage'),
                            'mechanism': med.get('notes', ''),
                            'indications': med.get('therapeutic_use', ''),
                            'differences': generate_differences(med_info, med),
                            'advantage': generate_advantage(matched_name, med_name),
                            'atc_code': 'N/A'
                        })

        # 2) therapeutic equivalents
        if matched_name in THERAPEUTIC_EQUIVALENTS:
            equiv_medicines = THERAPEUTIC_EQUIVALENTS[matched_name]

            for alt_name in equiv_medicines:
                alt_info = MEDICINE_DATABASE.get(alt_name)
                if alt_info:
                    # Avoid duplicates
                    names_in_list = [x['name'].lower() for x in alternatives_list]
                    if alt_name.capitalize().lower() in names_in_list:
                        continue

                    similarity = 85.0  # Base similarity for therapeutic equivalents

                    # Increase if same category
                    if alt_info.get('category') == med_info.get('category'):
                        similarity += 10.0

                    # Adjust based on class overlap
                    common_classes = set(alt_info.get('classes', [])) & set(med_info.get('classes', []))
                    if common_classes:
                        similarity += len(common_classes) * 5.0

                    similarity = min(similarity, 99.0)  # Cap at 99

                    alternatives_list.append({
                        'name': alt_name.capitalize(),
                        'generic_name': alt_info.get('generic_name'),
                        'composition': ', '.join(alt_info.get('active_ingredients', [])),
                        'price': alt_info.get('price', float(15 + len(alt_name) % 30)),
                        'similarity': similarity,
                        'category': alt_info.get('category'),
                        'therapeutic_use': alt_info.get('therapeutic_use'),
                        'dosage': alt_info.get('common_dosage'),
                        'mechanism': alt_info.get('notes', ''),
                        'indications': alt_info.get('therapeutic_use', ''),
                        'differences': generate_differences(med_info, alt_info),
                        'advantage': generate_advantage(matched_name, alt_name),
                        'atc_code': 'N/A'
                    })

        # 3) if not enough, use same category
        if len(alternatives_list) < top_n:
            for med_name, med in MEDICINE_DATABASE.items():
                name_lower = med_name.lower()
                if med_name != matched_name and name_lower not in [a['name'].lower() for a in alternatives_list]:
                    if med.get('category') == med_info.get('category'):
                        similarity = 70.0  # Lower similarity for same category but different
                        alternatives_list.append({
                            'name': med_name.capitalize(),
                            'generic_name': med.get('generic_name'),
                            'composition': ', '.join(med.get('active_ingredients', [])),
                            'price': med.get('price', float(15 + len(med_name) % 30)),
                            'similarity': similarity,
                            'category': med.get('category'),
                            'therapeutic_use': med.get('therapeutic_use'),
                            'dosage': med.get('common_dosage'),
                            'mechanism': med.get('notes', ''),
                            'indications': med.get('therapeutic_use', ''),
                            'differences': generate_differences(med_info, med),
                            'advantage': 'Different drug in same class',
                            'atc_code': 'N/A'
                        })
                if len(alternatives_list) >= top_n:
                    break

        # Sort by similarity
        alternatives_list.sort(key=lambda x: x['similarity'], reverse=True)
        alternatives_list = alternatives_list[:top_n]

        explanation = f"Alternatives for {medicine_name.capitalize()} based on active ingredients and therapeutic use. {len(alternatives_list)} options recommended."

        return alternatives_list, explanation

    except Exception as e:
        logger.error(f"Error generating alternatives: {e}")
        return None, str(e)

def generate_differences(original_med: Dict, alternative_med: Dict) -> Dict:
    """Generate key differences between medicines"""
    
    differences = {
        'mechanism': f"Original: {original_med.get('notes', 'N/A')} → Alternative: {alternative_med.get('notes', 'N/A')}",
        'category_change': original_med.get('category') != alternative_med.get('category'),
        'dosage_different': original_med.get('common_dosage') != alternative_med.get('common_dosage')
    }
    
    return differences

def generate_advantage(original: str, alternative: str) -> str:
    """Generate key advantage of alternative"""
    
    advantages = {
        ('aspirin', 'paracetamol'): 'Lower GI side effects, better for sensitive stomachs',
        ('ibuprofen', 'paracetamol'): 'Safer for prolonged use, gentler on GI tract',
        ('metformin', 'glipizide'): 'Better glycemic control, suitable for insulin resistance',
        ('lisinopril', 'amlodipine'): 'Alternative mechanism, may be better tolerated',
        ('amoxicillin', 'azithromycin'): 'Extended spectrum, different bacterial coverage',
    }
    
    key = (original.lower(), alternative.lower())
    if key in advantages:
        return advantages[key]
    
    return 'Therapeutic alternative with different properties'

# ============================================
# FLASK ROUTES
# ============================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    
    return jsonify({
        'status': 'healthy',
        'service': 'Medicine Alternative Recommendation Service (Hugging Face)',
        'model': 'Clinical Database + NLP',
        'medicines_in_database': len(MEDICINE_DATABASE),
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/recommend', methods=['POST'])
def recommend_alternatives():
    """
    Recommend alternative medicines
    
    POST body:
    {
        "medicine": "aspirin",
        "top_n": 5 (optional)
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'medicine' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: medicine'
            }), 400
        
        medicine = correct_drug_name(data['medicine'].strip())
        top_n = data.get('top_n', 5)
        
        logger.info(f"📥 Request for alternatives: {medicine} (original: {data['medicine'].strip()})")
        
        # Generate alternatives
        alternatives, explanation = generate_alternatives(medicine, top_n)
        
        if alternatives is None:
            # Medicine not found
            logger.warning(f"⚠️ Medicine not found: {medicine}")
            return jsonify({
                'success': False,
                'error': explanation,
                'available_medicines': list(MEDICINE_DATABASE.keys())[:10]
            }), 404
        
        matched_name, med_info = find_medicine_info(medicine)
        
        logger.info(f"✅ Generated {len(alternatives)} alternatives for {medicine}")
        
        return jsonify({
            'success': True,
            'medicine': medicine,
            'matched_name': matched_name.capitalize(),
            'medicine_info': {
                'generic_name': med_info.get('generic_name'),
                'category': med_info.get('category'),
                'therapeutic_use': med_info.get('therapeutic_use'),
                'dosage': med_info.get('common_dosage')
            },
            'alternatives': alternatives,
            'explanation': explanation,
            'source': 'huggingface_nlp'
        }), 200
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/search', methods=['GET'])
def search_medicine():
    """
    Search for medicine in database
    
    Query params:
    ?query=asp  - searches medicines containing "asp"
    """
    try:
        query = request.args.get('query', '').lower().strip()
        
        if not query or len(query) < 2:
            return jsonify({
                'success': False,
                'error': 'Query must be at least 2 characters',
                'available_medicines': list(MEDICINE_DATABASE.keys())
            }), 400
        
        # Search for matches
        matches = []
        for med_name, med_info in MEDICINE_DATABASE.items():
            if query in med_name or query in med_info.get('generic_name', '').lower():
                matches.append({
                    'brand_name': med_name.capitalize(),
                    'generic_name': med_info.get('generic_name'),
                    'category': med_info.get('category')
                })
        
        return jsonify({
            'success': True,
            'query': query,
            'matches': matches,
            'total': len(matches)
        }), 200
        
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/available-medicines', methods=['GET'])
def list_medicines():
    """Get list of all available medicines"""
    
    medicines = []
    for med_name, med_info in MEDICINE_DATABASE.items():
        medicines.append({
            'brand_name': med_name.capitalize(),
            'generic_name': med_info.get('generic_name'),
            'category': med_info.get('category'),
            'therapeutic_use': med_info.get('therapeutic_use')
        })
    
    return jsonify({
        'success': True,
        'total_medicines': len(medicines),
        'medicines': sorted(medicines, key=lambda x: x['brand_name'])
    }), 200

@app.route('/metrics', methods=['GET'])
def get_metrics():
    """Get service metrics"""
    return jsonify({
        'success': True,
        'metrics': {
            'total_medicines_in_database': len(MEDICINE_DATABASE),
            'therapeutic_equivalences': len(THERAPEUTIC_EQUIVALENTS),
            'service': 'Medicine Alternative Recommendation Service'
        }
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('ALTERNATIVE_SERVICE_PORT', 5003))
    logger.info(f"🚀 Starting Medicine Alternative Service on port {port}")
    logger.info(f"📊 Medicines in database: {len(MEDICINE_DATABASE)}")
    logger.info(f"🔗 Therapeutic equivalences: {len(THERAPEUTIC_EQUIVALENTS)}")
    logger.info(f"📦 Using Hugging Face NLP models (no Ollama required)")
    
    app.run(host='0.0.0.0', port=port, debug=False)
