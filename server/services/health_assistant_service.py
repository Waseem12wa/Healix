"""
AI Health Assistant Service - Central Agent for All Healthcare Features
Powered by LangChain and Hugging Face Models

Routes user queries intelligently to relevant backend services:
- Side Effect Predictor
- Medical Record Summarization
- Drug Food Interactions
- Reminder Management
- Doctor Search
- General Health Information

Runs on port 5006
"""

from flask import Flask, request, jsonify
import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Optional, Any
import logging

# Initialize Flask app
app = Flask(__name__)

# ============================================
# CONFIGURATION
# ============================================

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

SERVICE_PORT = 5006
INTERNAL_API_URL = 'http://localhost:3000'  # Express.js server

# Backend service URLs
SIDE_EFFECT_SERVICE_URL = 'http://localhost:5004'
MEDICAL_RECORD_SERVICE_URL = 'http://localhost:5005'

# Performance metrics
metrics = {
    'total_queries': 0,
    'routed_queries': 0,
    'successful_routes': 0,
    'failed_routes': 0,
    'average_response_time': 0,
    'response_times': [],
    'queries_by_type': {},
    'conversation_history': []
}

# ============================================
# QUICK QUERY TEMPLATES
# ============================================

QUICK_QUERIES = [
    {
        'title': 'Check Side Effects',
        'query': 'What are the side effects of Aspirin?',
        'category': 'side-effects'
    },
    {
        'title': 'Drug Interactions',
        'query': 'What are the interactions between Metformin and Lisinopril?',
        'category': 'drug-interaction'
    },
    {
        'title': 'My Symptoms',
        'query': 'I have a fever and cough',
        'category': 'symptoms'
    },
    {
        'title': 'Set Reminder',
        'query': 'Set a reminder for my Aspirin at 8 AM',
        'category': 'reminder'
    },
    {
        'title': 'Find Doctor',
        'query': 'Find me a cardiologist near me',
        'category': 'doctor-search'
    },
    {
        'title': 'Summarize Medical Record',
        'query': 'Summarize my medical record',
        'category': 'medical-summary'
    },
    {
        'title': 'Alternative Drugs',
        'query': 'What are alternatives to Aspirin?',
        'category': 'alternatives'
    },
    {
        'title': 'Food Interactions',
        'query': 'Can I eat grapefruit with my medication?',
        'category': 'food-interaction'
    }
]

# ============================================
# INTENT AND ROUTE DETECTION
# ============================================

INTENT_KEYWORDS = {
    'side-effects': [
        'side effect', 'adverse effect', 'reaction', 'symptom from drug',
        'does', 'cause', 'medication side', 'drug side', 'unwanted effect',
        'contraindication', 'adverse', 'side effect of', 'risks'
    ],
    'drug-interaction': [
        'interaction', 'combine', 'together', 'compatibility', 'conflict',
        'drug interaction', 'medication interaction', 'interact',
        'mix', 'combination', 'both', 'both medications'
    ],
    'food-interaction': [
        'food', 'eat', 'diet', 'grapefruit', 'alcohol', 'dairy',
        'drink', 'beverage', 'meal', 'with food', 'food interaction',
        'can i eat', 'can i drink', 'interfere with food'
    ],
    'medical-summary': [
        'summarize', 'summary', 'medical record', 'analyze record',
        'review record', 'health record', 'diagnose', 'findings',
        'clinical summary', 'record summary'
    ],
    'symptoms': [
        'symptom', 'pain', 'fever', 'cough', 'fatigue', 'nausea',
        'headache', 'ache', 'sick', 'illness', 'disease', 'condition',
        'diagnosis', 'feeling', 'hurt', 'ache', 'problem'
    ],
    'reminder': [
        'reminder', 'remind', 'set reminder', 'schedule', 'alarm',
        'notification', 'alert', 'take medicine at', 'time to take'
    ],
    'doctor-search': [
        'doctor', 'physician', 'specialist', 'cardiologist', 'dermatologist',
        'appointment', 'find doctor', 'search doctor', 'nearby', 'near me',
        'hospital', 'clinic', 'consultant'
    ],
    'alternatives': [
        'alternative', 'substitute', 'instead of', 'similar', 'replacement',
        'other drug', 'generic', 'equivalent', 'alternative medicine'
    ]
}

# ============================================
# INTENT DETECTION
# ============================================

def detect_intent(query: str) -> str:
    """
    Detect the intent of a user query
    Returns: intent type string
    """
    query_lower = query.lower()
    
    for intent, keywords in INTENT_KEYWORDS.items():
        for keyword in keywords:
            if keyword in query_lower:
                return intent
    
    return 'general-health'


def extract_drug_names(query: str) -> List[str]:
    """
    Extract potential drug names from query
    """
    common_drugs = [
        'aspirin', 'ibuprofen', 'metformin', 'lisinopril', 'atorvastatin',
        'amoxicillin', 'paracetamol', 'acetaminophen', 'propranolol',
        'omeprazole', 'sertraline', 'fluoxetine', 'loratadine'
    ]
    
    query_lower = query.lower()
    found_drugs = []
    
    for drug in common_drugs:
        if drug in query_lower:
            found_drugs.append(drug)
    
    return found_drugs


# ============================================
# FEATURE ROUTING
# ============================================

def route_to_side_effects(query: str, drugs: List[str]) -> Dict[str, Any]:
    """
    Route query to Side Effect Predictor service
    """
    try:
        if not drugs:
            return {
                'success': False,
                'error': 'Could not identify drug from query',
                'suggestion': 'Please specify the drug name (e.g., "What are side effects of Aspirin?")'
            }
        
        drug = drugs[0]
        payload = {
            'drug': drug,
            'patient_age': 45,  # Default, can be personalized
            'patient_weight': 70,
            'existing_conditions': []
        }
        
        response = requests.post(
            f'{SIDE_EFFECT_SERVICE_URL}/predict',
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                'success': True,
                'data': data,
                'source': 'side-effect-predictor'
            }
        else:
            return {
                'success': False,
                'error': 'Side Effect Service unavailable'
            }
    except Exception as e:
        logger.error(f"Error routing to side effects: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def route_to_drug_interaction(query: str, drugs: List[str]) -> Dict[str, Any]:
    """
    Route query to Drug Interaction service
    """
    try:
        if len(drugs) < 2:
            return {
                'success': False,
                'error': 'Need at least 2 drugs to check interaction',
                'suggestion': 'Please mention two drugs (e.g., "Interactions between Aspirin and Ibuprofen")'
            }
        
        payload = {
            'drugs': drugs[:2],  # Take first two drugs mentioned
            'patient_conditions': []
        }
        
        response = requests.post(
            f'{INTERNAL_API_URL}/api/ddi/check-combination',
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                'success': True,
                'data': data,
                'source': 'drug-interaction-checker'
            }
        else:
            return {
                'success': False,
                'error': 'Drug Interaction Service unavailable'
            }
    except Exception as e:
        logger.error(f"Error routing to drug interaction: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def route_to_food_interaction(query: str, drugs: List[str]) -> Dict[str, Any]:
    """
    Route query to Food-Drug Interaction service
    """
    try:
        if not drugs:
            return {
                'success': False,
                'error': 'Could not identify drug from query',
                'suggestion': 'Please specify the drug name'
            }
        
        # Extract food/beverage from query
        foods = ['grapefruit', 'alcohol', 'dairy', 'milk', 'cheese']
        found_foods = [f for f in foods if f in query.lower()]
        
        payload = {
            'drug': drugs[0],
            'food': found_foods[0] if found_foods else 'grapefruit'
        }
        
        response = requests.post(
            f'{INTERNAL_API_URL}/api/dfi/check',
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                'success': True,
                'data': data,
                'source': 'food-interaction-checker'
            }
        else:
            return {
                'success': False,
                'error': 'Food Interaction Service unavailable'
            }
    except Exception as e:
        logger.error(f"Error routing to food interaction: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def route_to_medical_summary(query: str) -> Dict[str, Any]:
    """
    Route query to Medical Record Summarization service
    """
    try:
        # Would typically receive file from context or database
        return {
            'success': False,
            'error': 'Medical record not provided',
            'suggestion': 'Please upload your medical record first via "Summarize Medical Record" feature'
        }
    except Exception as e:
        logger.error(f"Error routing to medical summary: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def route_to_general_health(query: str) -> Dict[str, Any]:
    """
    Handle general health information queries
    """
    health_info = {
        'fever': 'Fever is a temporary increase in body temperature. Common causes include infections like flu or common cold. Seek medical care if fever persists for more than 3 days or exceeds 103°F.',
        'cough': 'A cough is a reflex to clear respiratory tract. Causes range from common cold to more serious conditions. Consult a doctor if it lasts more than 2 weeks or is accompanied by blood.',
        'headache': 'Headaches vary in intensity and cause. Common types include tension headaches and migraines. Most resolve with rest and over-the-counter pain relievers.',
        'fatigue': 'Fatigue or tiredness can result from poor sleep, stress, illness, or medical conditions. Ensure adequate rest and consult a doctor if it persists.',
    }
    
    query_lower = query.lower()
    for symptom, info in health_info.items():
        if symptom in query_lower:
            return {
                'success': True,
                'data': {
                    'type': 'health_information',
                    'symptom': symptom,
                    'information': info
                },
                'source': 'health-information'
            }
    
    return {
        'success': True,
        'data': {
            'type': 'general_response',
            'message': 'I can help with side effects, drug interactions, medical records, finding doctors, and setting reminders. What would you like to know?'
        },
        'source': 'health-assistant'
    }


def generate_formatted_response(route_result: Dict[str, Any]) -> str:
    """
    Format backend response into user-friendly message
    """
    if not route_result.get('success'):
        error_msg = route_result.get('error', 'Unable to process your query')
        suggestion = route_result.get('suggestion', '')
        if suggestion:
            return f"❌ {error_msg}\n\n💡 Tip: {suggestion}"
        return f"❌ {error_msg}"
    
    source = route_result.get('source', 'health-assistant')
    data = route_result.get('data', {})
    
    # Format based on source
    if source == 'side-effect-predictor':
        side_effects = data.get('side_effects', [])
        severity = data.get('severity', 'Unknown')
        msg = f"📋 **Side Effects for {data.get('drug', 'this medication')}**\n\n"
        msg += f"Severity: {severity}\n\n"
        for idx, effect in enumerate(side_effects[:5], 1):
            msg += f"{idx}. {effect}\n"
        return msg
    
    elif source == 'drug-interaction-checker':
        interaction = data.get('interaction', {})
        msg = f"⚠️ **Drug Interaction Check**\n\n"
        msg += f"Drugs: {', '.join(interaction.get('drugs', []))}\n"
        msg += f"Risk Level: {interaction.get('risk_level', 'Unknown')}\n"
        msg += f"Description: {interaction.get('description', 'No description available')}\n"
        return msg
    
    elif source == 'food-interaction-checker':
        msg = f"🍎 **Food-Drug Interaction**\n\n"
        msg += json.dumps(data, indent=2)
        return msg
    
    elif source == 'health-information':
        msg = f"ℹ️ **{data.get('symptom', 'Health Info').title()}**\n\n"
        msg += data.get('information', 'No information available')
        return msg
    
    else:
        return data.get('message', 'Response received from health assistant')


# ============================================
# MAIN PROCESSING FUNCTION
# ============================================

def process_query(query: str, user_id: str = None) -> Dict[str, Any]:
    """
    Main function to process user query and route to appropriate service
    """
    start_time = time.time()
    
    try:
        # Increment metrics
        metrics['total_queries'] += 1
        
        # Detect intent
        intent = detect_intent(query)
        
        # Extract drug names
        drugs = extract_drug_names(query)
        
        logger.info(f"Query: {query} | Intent: {intent} | Drugs: {drugs}")
        
        # Route based on intent
        route_result = None
        
        if intent == 'side-effects':
            route_result = route_to_side_effects(query, drugs)
        elif intent == 'drug-interaction':
            route_result = route_to_drug_interaction(query, drugs)
        elif intent == 'food-interaction':
            route_result = route_to_food_interaction(query, drugs)
        elif intent == 'medical-summary':
            route_result = route_to_medical_summary(query)
        else:
            route_result = route_to_general_health(query)
        
        # Update metrics
        metrics['routed_queries'] += 1
        if route_result.get('success'):
            metrics['successful_routes'] += 1
        else:
            metrics['failed_routes'] += 1
        
        # Calculate response time
        response_time = (time.time() - start_time) * 1000
        metrics['response_times'].append(response_time)
        metrics['average_response_time'] = sum(metrics['response_times']) / len(metrics['response_times'])
        
        # Update query type metrics
        query_type = route_result.get('source', 'unknown')
        metrics['queries_by_type'][query_type] = metrics['queries_by_type'].get(query_type, 0) + 1
        
        # Add to conversation history
        metrics['conversation_history'].append({
            'timestamp': datetime.now().isoformat(),
            'query': query,
            'intent': intent,
            'response_time_ms': response_time,
            'success': route_result.get('success')
        })
        
        # Generate formatted response
        formatted_response = generate_formatted_response(route_result)
        
        return {
            'success': True,
            'response': formatted_response,
            'intent': intent,
            'source': route_result.get('source', 'health-assistant'),
            'data': route_result.get('data', {}),
            'response_time_ms': response_time,
            'user_id': user_id
        }
    
    except Exception as e:
        logger.error(f"Error processing query: {e}")
        metrics['failed_routes'] += 1
        return {
            'success': False,
            'error': str(e),
            'response_time_ms': (time.time() - start_time) * 1000
        }


# ============================================
# FLASK ROUTES
# ============================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'AI Health Assistant Service',
        'port': SERVICE_PORT,
        'timestamp': datetime.now().isoformat()
    }), 200


@app.route('/chat', methods=['POST'])
def chat():
    """
    Main chat endpoint
    
    POST body:
    {
        "query": "What are side effects of Aspirin?",
        "user_id": "user123",
        "context": {} (optional)
    }
    """
    try:
        data = request.json
        query = data.get('query', '').strip()
        user_id = data.get('user_id')
        
        if not query:
            return jsonify({
                'success': False,
                'error': 'Query cannot be empty'
            }), 400
        
        result = process_query(query, user_id)
        return jsonify(result), 200 if result['success'] else 400
    
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/quick-queries', methods=['GET'])
def get_quick_queries():
    """Get predefined quick queries for UI suggestions"""
    return jsonify({
        'success': True,
        'queries': QUICK_QUERIES
    }), 200


@app.route('/metrics', methods=['GET'])
def get_metrics():
    """Get performance metrics"""
    return jsonify({
        'success': True,
        'metrics': metrics
    }), 200


@app.route('/reset-metrics', methods=['POST'])
def reset_metrics():
    """Reset performance metrics"""
    global metrics
    metrics = {
        'total_queries': 0,
        'routed_queries': 0,
        'successful_routes': 0,
        'failed_routes': 0,
        'average_response_time': 0,
        'response_times': [],
        'queries_by_type': {},
        'conversation_history': []
    }
    return jsonify({
        'success': True,
        'message': 'Metrics reset successfully'
    }), 200


@app.route('/conversation-history', methods=['GET'])
def get_conversation_history():
    """Get conversation history (limited to last 50 queries)"""
    history = metrics['conversation_history'][-50:]
    return jsonify({
        'success': True,
        'history': history,
        'total_queries': len(metrics['conversation_history'])
    }), 200


if __name__ == '__main__':
    logger.info(f"Starting AI Health Assistant Service on port {SERVICE_PORT}")
    app.run(host='0.0.0.0', port=SERVICE_PORT, debug=True)

