"""
LLM Service for Drug Interaction Detailed Explanations

Uses local Ollama with Llama model to generate comprehensive
interaction details including mechanism, symptoms, recommendations,
alternatives, and dosage adjustments.

Also provides FALLBACK predictions when models fail.
"""

import ollama
import logging
from typing import Dict, Optional, Tuple

logger = logging.getLogger(__name__)

# Configuration
OLLAMA_MODEL = "llama3.2:3b"  # Ultra-light but capable model
OLLAMA_TIMEOUT = 30  # seconds


def generate_fallback_prediction(
    drug1: str,
    drug2: str,
    interaction_type: str = "drug-drug"
) -> Tuple[Optional[float], Optional[Dict]]:
    """
    Use LLM to predict interaction when model fails
    
    Args:
        drug1: Name of first drug/medicine
        drug2: Name of second drug/food
        interaction_type: "drug-drug" or "drug-food"
        
    Returns:
        Tuple of (probability, details_dict) or (None, None) if error
    """
    try:
        if interaction_type == "drug-drug":
            prompt = f"""You are a clinical pharmacist AI. The AI model could not process these drugs (possibly due to missing data), but you need to assess their interaction risk based on your medical knowledge.

Drug 1: {drug1}
Drug 2: {drug2}

Provide your assessment in this EXACT format:

RISK_SCORE: [Give a number from 0-100 representing interaction risk. 0=no interaction, 100=severe interaction]

MECHANISM: [2-3 sentences explaining WHY these drugs might interact, or state "No significant interaction expected"]

SYMPTOMS: [List 3-5 potential symptoms if interaction occurs, or state "No significant symptoms expected"]

RECOMMENDATIONS: [Clinical guidance for healthcare providers]

ALTERNATIVES: [Suggest safer alternatives if high risk, or state "Combination appears safe"]

DOSAGE: [Dosage adjustments if needed, or state "Standard dosing"]

Be evidence-based and conservative in your risk assessment."""

        else:  # drug-food
            prompt = f"""You are a clinical pharmacist AI. The AI model could not process this combination (possibly due to missing data), but you need to assess the interaction risk based on your medical knowledge.

Medicine: {drug1}
Food: {drug2}

Provide your assessment in this EXACT format:

RISK_SCORE: [Give a number from 0-100 representing interaction risk. 0=no interaction, 100=severe interaction]

MECHANISM: [2-3 sentences explaining WHY this food might affect the drug, or state "No significant interaction expected"]

SYMPTOMS: [List 3-5 potential symptoms, or state "No significant symptoms expected"]

RECOMMENDATIONS: [Clinical guidance - timing, avoidance, monitoring]

ALTERNATIVES: [Suggest safer food alternatives if high risk, or state "Food is safe with this medication"]

DOSAGE: [Timing guidance - take with/without food, or state "Standard dosing"]

Be evidence-based and conservative in your risk assessment."""

        logger.info(f"Generating LLM fallback prediction for {drug1} + {drug2}")
        
        response = ollama.chat(
            model=OLLAMA_MODEL,
            messages=[{'role': 'user', 'content': prompt}],
            options={'temperature': 0.5, 'num_predict': 250}  # Aggressive optimization for speed
        )
        
        content = response['message']['content']
        
        # Parse response
        probability, details = parse_fallback_response(content)
        
        if probability is not None:
            logger.info(f"LLM fallback prediction: {probability}%")
            return probability / 100.0, details  # Convert to 0-1 range
        else:
            logger.warning("Could not extract risk score from LLM response")
            return None, None
            
    except Exception as e:
        logger.error(f"Error in LLM fallback prediction: {str(e)}")
        return None, None


def parse_fallback_response(content: str) -> Tuple[Optional[float], Optional[Dict]]:
    """
    Parse LLM fallback response to extract risk score and details
    
    Returns:
        Tuple of (risk_score, details_dict)
    """
    try:
        lines = content.split('\n')
        risk_score = None
        sections = {
            'mechanism': '',
            'symptoms': '',
            'recommendations': '',
            'alternatives': '',
            'dosage_adjustments': ''
        }
        
        current_section = None
        
        for line in lines:
            line = line.strip()
            
            # Extract risk score
            if line.upper().startswith('RISK_SCORE:'):
                try:
                    # Extract number from line
                    score_str = line[11:].strip()
                    # Remove any non-numeric characters except decimal point
                    import re
                    numbers = re.findall(r'\d+\.?\d*', score_str)
                    if numbers:
                        risk_score = float(numbers[0])
                except:
                    pass
                continue
            
            # Detect section headers
            if line.upper().startswith('MECHANISM:'):
                current_section = 'mechanism'
                line = line[10:].strip()
            elif line.upper().startswith('SYMPTOMS:'):
                current_section = 'symptoms'
                line = line[9:].strip()
            elif line.upper().startswith('RECOMMENDATIONS:'):
                current_section = 'recommendations'
                line = line[16:].strip()
            elif line.upper().startswith('ALTERNATIVES:'):
                current_section = 'alternatives'
                line = line[13:].strip()
            elif line.upper().startswith('DOSAGE:'):
                current_section = 'dosage_adjustments'
                line = line[7:].strip()
            
            # Add content to current section (preserve line breaks)
            if current_section and line:
                if sections[current_section]:
                    sections[current_section] += '\n' + line  # Use newline instead of space
                else:
                    sections[current_section] = line
        
        # Clean up sections
        for key in sections:
            sections[key] = sections[key].strip()
            if not sections[key]:
                sections[key] = "Information not available"
        
        return risk_score, sections
        
    except Exception as e:
        logger.error(f"Error parsing fallback response: {str(e)}")
        return None, None


def generate_interaction_details(
    drug1: str,
    drug2: str,
    probability: float,
    severity: str,
    atc1: Optional[Dict] = None,
    atc2: Optional[Dict] = None,
    interaction_detected: bool = True
) -> Optional[Dict]:
    """
    Generate detailed interaction explanation using local LLM
    
    Args:
        drug1: Name of first drug
        drug2: Name of second drug
        probability: Interaction probability (0-100)
        severity: Severity level (None/Mild/Severe)
        atc1: ATC classification for drug1
        atc2: ATC classification for drug2
        interaction_detected: Whether CatBoost detected interaction
        
    Returns:
        Dictionary with detailed interaction information or None if error
    """
    try:
        # Build ATC context
        atc1_str = f"ATC: {atc1.get('level4', 'unknown')}" if atc1 else "ATC: unknown"
        atc2_str = f"ATC: {atc2.get('level4', 'unknown')}" if atc2 else "ATC: unknown"
        
        # Choose prompt based on whether interaction was detected
        if interaction_detected and probability >= 40:
            prompt = f"""You are a clinical pharmacist AI. Analyze this drug-drug interaction:

Drug 1: {drug1} ({atc1_str})
Drug 2: {drug2} ({atc2_str})
Interaction Risk: {probability:.1f}%
Severity: {severity}

Provide a concise clinical analysis in exactly this format:

MECHANISM: [2-3 sentences explaining WHY this interaction occurs at the pharmacological level]

SYMPTOMS: [List 3-5 specific symptoms or effects patients may experience]

RECOMMENDATIONS: [2-3 specific clinical actions healthcare providers should take]

ALTERNATIVES: [Suggest 1-2 safer alternative medications if available, or state "Consult physician for alternatives"]

DOSAGE: [Brief guidance on dose adjustments if combination is necessary, or state "Avoid combination"]

Keep responses evidence-based, patient-safety focused, and concise."""

        else:
            # Fallback: No interaction detected by model, but ask LLM to check
            prompt = f"""You are a clinical pharmacist AI. The AI model did not detect a significant interaction between these drugs, but please verify:

Drug 1: {drug1} ({atc1_str})
Drug 2: {drug2} ({atc2_str})
Model Risk Score: {probability:.1f}% (Low)

Provide a brief safety assessment in this format:

MECHANISM: [Explain if there are any known minor interactions or state "No significant pharmacological interaction expected"]

SYMPTOMS: [List any minor effects to monitor, or state "No significant symptoms expected"]

RECOMMENDATIONS: [Brief monitoring advice or state "No special precautions needed"]

ALTERNATIVES: [State "Not applicable - combination appears safe" or suggest if there are better options]

DOSAGE: [State "Standard dosing" or any minor considerations]

Be concise and reassuring if truly safe."""

        logger.info(f"Generating LLM explanation for {drug1} + {drug2}")
        
        # Call Ollama with aggressive optimization for speed
        response = ollama.chat(
            model=OLLAMA_MODEL,
            messages=[{
                'role': 'user',
                'content': prompt
            }],
            options={
                'temperature': 0.5,  # Higher for faster sampling
                'num_predict': 200,  # Minimal tokens for speed
            }
        )
        
        # Parse response
        content = response['message']['content']
        
        # Extract sections
        details = parse_llm_response(content)
        
        logger.info(f"Successfully generated LLM explanation")
        return details
        
    except Exception as e:
        logger.error(f"Error generating LLM explanation: {str(e)}")
        return None


def parse_llm_response(content: str) -> Dict:
    """
    Parse LLM response into structured format
    
    Args:
        content: Raw LLM response text
        
    Returns:
        Dictionary with mechanism, symptoms, recommendations, alternatives, dosage
    """
    sections = {
        'mechanism': '',
        'symptoms': '',
        'recommendations': '',
        'alternatives': '',
        'dosage_adjustments': ''
    }
    
    try:
        # Split by section headers
        lines = content.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            
            # Detect section headers
            if line.upper().startswith('MECHANISM:'):
                current_section = 'mechanism'
                line = line[10:].strip()  # Remove header
            elif line.upper().startswith('SYMPTOMS:'):
                current_section = 'symptoms'
                line = line[9:].strip()
            elif line.upper().startswith('RECOMMENDATIONS:'):
                current_section = 'recommendations'
                line = line[16:].strip()
            elif line.upper().startswith('ALTERNATIVES:'):
                current_section = 'alternatives'
                line = line[13:].strip()
            elif line.upper().startswith('DOSAGE:'):
                current_section = 'dosage_adjustments'
                line = line[7:].strip()
            
            # Add content to current section (preserve line breaks)
            if current_section and line:
                if sections[current_section]:
                    sections[current_section] += '\n' + line  # Use newline instead of space
                else:
                    sections[current_section] = line
        
        # Clean up sections
        for key in sections:
            sections[key] = sections[key].strip()
            if not sections[key]:
                sections[key] = "Information not available"
        
        return sections
        
    except Exception as e:
        logger.error(f"Error parsing LLM response: {str(e)}")
        # Return default values
        return {
            'mechanism': content[:200] if content else "Unable to generate explanation",
            'symptoms': "Please consult healthcare provider",
            'recommendations': "Consult your doctor or pharmacist",
            'alternatives': "Consult physician for alternatives",
            'dosage_adjustments': "Follow prescribed dosage"
        }


def check_ollama_available() -> bool:
    """
    Check if Ollama is running and model is available
    
    Returns:
        True if Ollama is available, False otherwise
    """
    try:
        ollama.list()
        return True
    except Exception as e:
        logger.warning(f"Ollama not available: {str(e)}")
        return False
