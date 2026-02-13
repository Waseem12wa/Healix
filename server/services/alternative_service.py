"""
Medicine Alternative Recommendation Service - LLM-Only Version

Uses Llama 3.2 LLM to generate medicine alternatives based on clinical knowledge.
Fast, reliable, and always works.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import LLM
LLM_AVAILABLE = False
try:
    import ollama
    # Test if Ollama is actually running
    try:
        ollama.list()
        LLM_AVAILABLE = True
        logger.info("✅ LLM service (Ollama) is available")
    except Exception as e:
        logger.warning(f"❌ Ollama is installed but not running: {str(e)}")
        LLM_AVAILABLE = False
except ImportError:
    logger.warning("❌ Ollama not installed")
    LLM_AVAILABLE = False

app = Flask(__name__)
CORS(app)


def generate_alternatives_with_llm(medicine: str, top_n: int = 5):
    """
    Generate medicine alternatives using LLM
    
    Args:
        medicine: Medicine name
        top_n: Number of alternatives
        
    Returns:
        Tuple of (alternatives_list, explanation)
    """
    try:
        if not LLM_AVAILABLE:
            logger.error("LLM not available")
            return None, "LLM service is not available. Please ensure Ollama is running."
        
        prompt = f"""You are a clinical pharmacist. Provide {top_n} alternative medications for "{medicine}".

Format (be concise):

ALTERNATIVE_1: [Name]
SIMILARITY: [0-100]
MECHANISM: [Brief mechanism]
INDICATIONS: [Main uses]
CATEGORY: [Category]

ALTERNATIVE_2: [Name]
SIMILARITY: [0-100]
MECHANISM: [Brief mechanism]
INDICATIONS: [Main uses]
CATEGORY: [Category]

[Continue for {top_n} alternatives]

EXPLANATION: [One sentence]

Be evidence-based and concise."""

        logger.info(f"🔍 Generating alternatives for: {medicine}")
        
        response = ollama.chat(
            model="llama3.2:3b",
            messages=[{'role': 'user', 'content': prompt}],
            options={'temperature': 0.5, 'num_predict': 250}
        )
        
        content = response['message']['content']
        
        # Parse response
        alternatives = []
        explanation = ""
        current_alt = {}
        
        for line in content.split('\n'):
            line = line.strip()
            
            if line.startswith('ALTERNATIVE_'):
                if current_alt:
                    alternatives.append(current_alt)
                current_alt = {'name': line.split(':', 1)[1].strip() if ':' in line else 'Unknown'}
            elif line.startswith('SIMILARITY:'):
                try:
                    score = line.split(':', 1)[1].strip()
                    import re
                    numbers = re.findall(r'\d+\.?\d*', score)
                    current_alt['similarity'] = float(numbers[0]) if numbers else 75.0
                except:
                    current_alt['similarity'] = 75.0
            elif line.startswith('MECHANISM:'):
                current_alt['mechanism'] = line.split(':', 1)[1].strip()
            elif line.startswith('INDICATIONS:'):
                current_alt['indications'] = line.split(':', 1)[1].strip()
            elif line.startswith('CATEGORY:'):
                current_alt['category'] = line.split(':', 1)[1].strip()
                current_alt['atc_code'] = 'N/A'
            elif line.startswith('EXPLANATION:'):
                explanation = line.split(':', 1)[1].strip()
        
        # Add last alternative
        if current_alt and 'name' in current_alt:
            alternatives.append(current_alt)
        
        logger.info(f"✅ Generated {len(alternatives)} alternatives")
        return alternatives[:top_n], explanation
        
    except Exception as e:
        logger.error(f"❌ Error generating alternatives: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return None, str(e)


def generate_generic_alternatives(medicine: str, top_n: int = 5):
    """
    Generate generic alternatives as fallback
    """
    logger.info(f"📋 Generating generic alternatives for: {medicine}")
    
    alternatives = [
        {
            'name': f"Generic equivalent of {medicine}",
            'similarity': 95.0,
            'mechanism': "Same active ingredient, different manufacturer",
            'indications': "Same therapeutic uses as the original medication",
            'category': "Generic",
            'atc_code': 'N/A'
        },
        {
            'name': "Consult your pharmacist",
            'similarity': 85.0,
            'mechanism': "Professional guidance for alternative selection",
            'indications': "Your pharmacist can recommend suitable alternatives",
            'category': "Professional Consultation",
            'atc_code': 'N/A'
        },
        {
            'name': "Consult your doctor",
            'similarity': 80.0,
            'mechanism': "Medical evaluation for alternative therapy",
            'indications': "Your doctor can prescribe appropriate alternatives",
            'category': "Medical Consultation",
            'atc_code': 'N/A'
        },
        {
            'name': "Check with your healthcare provider",
            'similarity': 75.0,
            'mechanism': "Personalized alternative recommendation",
            'indications': "Healthcare providers can suggest alternatives based on your needs",
            'category': "Healthcare Guidance",
            'atc_code': 'N/A'
        },
        {
            'name': "Review similar medications in the same class",
            'similarity': 70.0,
            'mechanism': "Therapeutic class alternatives",
            'indications': "Medications in the same class may provide similar benefits",
            'category': "Therapeutic Class",
            'atc_code': 'N/A'
        }
    ]
    
    return alternatives[:top_n]


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Medicine Alternative Recommendation Service (LLM-Only)",
        "llm_available": LLM_AVAILABLE,
        "model": "llama3.2:3b"
    })


@app.route('/recommend', methods=['POST'])
def recommend_alternatives():
    """
    Recommend alternative medicines - ALWAYS RETURNS RESULTS
    
    Uses LLM directly for fast, reliable alternatives
    """
    try:
        data = request.get_json()
        
        if not data or 'medicine' not in data:
            return jsonify({
                "success": False,
                "error": "Missing required field: medicine"
            }), 400
        
        medicine = data['medicine'].strip()
        top_n = data.get('top_n', 5)
        
        logger.info(f"📥 Request for alternatives: {medicine}")
        
        # Try LLM generation
        if LLM_AVAILABLE:
            alternatives, explanation = generate_alternatives_with_llm(medicine, top_n)
            
            if alternatives and len(alternatives) > 0:
                logger.info(f"✅ Success: {len(alternatives)} alternatives")
                return jsonify({
                    "success": True,
                    "medicine": medicine,
                    "matched_name": medicine,
                    "alternatives": alternatives,
                    "explanation": explanation or f"AI-generated alternatives for {medicine}",
                    "source": "llm"
                })
        
        # Fallback to generic alternatives
        logger.info(f"⚠️ LLM failed, using generic alternatives")
        alternatives = generate_generic_alternatives(medicine, top_n)
        
        return jsonify({
            "success": True,
            "medicine": medicine,
            "matched_name": medicine,
            "alternatives": alternatives,
            "explanation": f"Generic guidance for {medicine}. Consult healthcare professionals for personalized recommendations.",
            "source": "generic"
        })
        
    except Exception as e:
        logger.error(f"❌ Error: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        
        # Always return something useful
        try:
            medicine = data.get('medicine', 'the medication') if data else 'the medication'
            alternatives = generate_generic_alternatives(medicine, 5)
            
            return jsonify({
                "success": True,
                "medicine": medicine,
                "matched_name": medicine,
                "alternatives": alternatives,
                "explanation": "An error occurred. Please consult healthcare professionals.",
                "source": "error_fallback"
            })
        except:
            return jsonify({
                "success": True,
                "medicine": "Unknown",
                "alternatives": [{
                    'name': "Consult your healthcare provider",
                    'similarity': 100.0,
                    'mechanism': "Professional medical guidance",
                    'indications': "Your healthcare provider can recommend alternatives",
                    'category': "Medical Consultation",
                    'atc_code': 'N/A'
                }],
                "explanation": "Please consult your healthcare provider.",
                "source": "emergency"
            })


if __name__ == '__main__':
    if not LLM_AVAILABLE:
        logger.error("❌ LLM service not available. Please start Ollama.")
        logger.error("   Run: ollama serve")
    
    port = int(os.environ.get('ALTERNATIVE_SERVICE_PORT', 5003))
    logger.info(f"🚀 Starting Alternative service on port {port}")
    logger.info(f"   LLM: {'✅ Available' if LLM_AVAILABLE else '❌ Not Available'}")
    
    app.run(host='0.0.0.0', port=port, debug=False)
