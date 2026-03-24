#!/usr/bin/env python3
"""
Side Effect Predictor Service - Test and Demonstration Script

This script demonstrates:
1. Basic side effect prediction
2. Patient-context aware predictions
3. Batch predictions
4. Performance metrics
5. Model evaluation

Run: python3 test-side-effect-service.py
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List

# Configuration
SERVICE_URL = "http://localhost:5004"
TIMEOUT = 30

# ============================================
# TEST DATA
# ============================================

# Test case 1: Common medicine without patient context
TEST_CASE_1 = {
    "name": "Simple Side Effect Prediction (Aspirin)",
    "request": {
        "medicine": "Aspirin",
    }
}

# Test case 2: Medicine with patient context
TEST_CASE_2 = {
    "name": "Context-Aware Prediction (Aspirin for 70-year-old with diabetes)",
    "request": {
        "medicine": "Aspirin",
        "age": 70,
        "conditions": ["diabetes", "hypertension"],
        "dosage": "500mg twice daily"
    }
}

# Test case 3: Another medicine
TEST_CASE_3 = {
    "name": "Side Effect Prediction (Metformin)",
    "request": {
        "medicine": "Metformin",
        "age": 55,
        "conditions": ["type-2-diabetes"]
    }
}

# Test case 4: Batch prediction
TEST_CASE_4 = {
    "name": "Batch Prediction (Multiple medicines)",
    "request": {
        "medicines": ["Aspirin", "Metformin", "Lisinopril"],
        "age": 60,
        "conditions": ["hypertension", "diabetes"]
    },
    "endpoint": "/batch"
}

# ============================================
# PRINT UTILITIES
# ============================================

def print_header(text: str):
    """Print a formatted header."""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70)

def print_section(text: str):
    """Print a formatted section."""
    print(f"\n{'─' * 70}")
    print(f"  {text}")
    print(f"{'─' * 70}\n")

def print_success(text: str):
    """Print success message."""
    print(f"✅ {text}")

def print_error(text: str):
    """Print error message."""
    print(f"❌ {text}")

def print_info(text: str):
    """Print info message."""
    print(f"ℹ️  {text}")

def format_json(data: dict):
    """Pretty print JSON."""
    return json.dumps(data, indent=2)

# ============================================
# SERVICE HEALTH CHECK
# ============================================

def check_service_health() -> bool:
    """Check if the service is running."""
    try:
        print_info("Checking service health...")
        response = requests.get(f"{SERVICE_URL}/health", timeout=5)
        data = response.json()
        
        if data.get("status") == "healthy":
            print_success("Service is running and healthy!")
            return True
        else:
            print_error("Service is not healthy!")
            return False
    except requests.exceptions.ConnectionError:
        print_error(f"Cannot connect to service at {SERVICE_URL}")
        print_info("Make sure the service is running: python3 side_effect_service.py")
        return False
    except Exception as e:
        print_error(f"Error checking health: {str(e)}")
        return False

# ============================================
# TEST SINGLE PREDICTION
# ============================================

def test_prediction(test_case: Dict):
    """Test a single prediction."""
    print_section(test_case["name"])
    
    endpoint = test_case.get("endpoint", "/predict")
    print_info(f"Request: POST {SERVICE_URL}{endpoint}")
    print(f"Payload:\n{format_json(test_case['request'])}\n")
    
    try:
        start_time = time.time()
        response = requests.post(
            f"{SERVICE_URL}{endpoint}",
            json=test_case["request"],
            timeout=TIMEOUT
        )
        elapsed = time.time() - start_time
        
        data = response.json()
        
        if data.get("success"):
            print_success(f"Prediction successful in {elapsed:.2f}s!")
            
            if "side_effects" in data:
                # Single prediction
                print_info(f"Medicine: {data.get('medicine')}")
                print_info(f"Number of side effects: {len(data.get('side_effects', []))}")
                print_info("Top 5 predicted side effects:")
                
                for i, effect in enumerate(data.get('side_effects', [])[:5], 1):
                    prob = effect.get('probability', 0)
                    severity = effect.get('severity', 'unknown')
                    print(f"  {i}. {effect.get('side_effect', 'Unknown')}")
                    print(f"     Probability: {prob*100:.1f}% | Severity: {severity}")
            
            elif "predictions" in data:
                # Batch prediction
                print_info(f"Total medicines predicted: {data.get('total_medicines', 0)}")
                for pred in data.get('predictions', []):
                    print(f"\n  Medicine: {pred.get('medicine')}")
                    print(f"  Side effects: {len(pred.get('sideEffects', []))}")
                    top_effects = pred.get('sideEffects', [])[:3]
                    for effect in top_effects:
                        print(f"    - {effect.get('side_effect')} ({effect.get('probability')*100:.1f}%)")
            
            if "model_info" in data:
                print_info(f"Model: {data['model_info'].get('model_name', 'Unknown')}")
                print_info(f"Approach: {data['model_info'].get('approach', 'Unknown')}")
            
            return True
        else:
            print_error(f"Prediction failed: {data.get('error', 'Unknown error')}")
            return False
            
    except requests.exceptions.Timeout:
        print_error(f"Request timed out after {TIMEOUT} seconds")
        return False
    except Exception as e:
        print_error(f"Error during prediction: {str(e)}")
        return False

# ============================================
# TEST PERFORMANCE METRICS
# ============================================

def test_performance_metrics():
    """Retrieve and display performance metrics."""
    print_section("Model Performance Metrics")
    
    try:
        response = requests.get(
            f"{SERVICE_URL}/metrics",
            timeout=10
        )
        data = response.json()
        
        if data.get("total_predictions", 0) > 0:
            print_success("Performance metrics retrieved!")
            
            metrics = data
            print(f"\nTotal Predictions: {metrics.get('total_predictions', 0)}")
            print(f"\nLatency Statistics (ms):")
            print(f"  Average:  {metrics.get('average_latency_ms', 0):.2f}ms")
            print(f"  Median:   {metrics.get('median_latency_ms', 0):.2f}ms")
            print(f"  Min:      {metrics.get('min_latency_ms', 0):.2f}ms")
            print(f"  Max:      {metrics.get('max_latency_ms', 0):.2f}ms")
            print(f"  Std Dev:  {metrics.get('std_latency_ms', 0):.2f}ms")
            
            print(f"\nConfidence Statistics:")
            print(f"  Average:  {metrics.get('average_confidence', 0):.3f}")
            print(f"  Median:   {metrics.get('median_confidence', 0):.3f}")
            
            dist = metrics.get('confidence_distribution', {})
            print(f"\nConfidence Distribution:")
            print(f"  High (>0.8):        {dist.get('high (>0.8)', 0)} predictions")
            print(f"  Medium (0.5-0.8):   {dist.get('medium (0.5-0.8)', 0)} predictions")
            print(f"  Low (<0.5):         {dist.get('low (<0.5)', 0)} predictions")
        else:
            print_info("No predictions made yet. Run some predictions first.")
        
    except Exception as e:
        print_error(f"Error retrieving metrics: {str(e)}")

# ============================================
# STRESS TEST
# ============================================

def stress_test(num_requests: int = 10):
    """Perform a stress test with multiple rapid requests."""
    print_section(f"Stress Test ({num_requests} requests)")
    
    try:
        start_time = time.time()
        successful = 0
        failed = 0
        times = []
        
        for i in range(num_requests):
            try:
                req_start = time.time()
                response = requests.post(
                    f"{SERVICE_URL}/predict",
                    json={"medicine": f"Medicine_{i}"},
                    timeout=TIMEOUT
                )
                req_time = time.time() - req_start
                times.append(req_time)
                
                if response.json().get("success"):
                    successful += 1
                else:
                    failed += 1
            except:
                failed += 1
        
        total_time = time.time() - start_time
        avg_time = sum(times) / len(times) if times else 0
        
        print_success(f"Stress test completed!")
        print(f"\nResults:")
        print(f"  Successful: {successful}/{num_requests}")
        print(f"  Failed: {failed}/{num_requests}")
        print(f"  Total time: {total_time:.2f}s")
        print(f"  Average time per request: {avg_time*1000:.2f}ms")
        print(f"  Throughput: {num_requests/total_time:.1f} requests/second")
        
    except Exception as e:
        print_error(f"Error during stress test: {str(e)}")

# ============================================
# MODEL EVALUATION
# ============================================

def model_evaluation():
    """Evaluate model performance on test cases."""
    print_section("Model Evaluation on Test Cases")
    
    test_medicines = [
        ("Aspirin", [
            "bleeding", "nausea", "headache", "rash"
        ]),
        ("Metformin", [
            "nausea", "diarrhea", "metallic taste", "dizziness"
        ]),
        ("Lisinopril", [
            "dry cough", "dizziness", "headache", "fatigue"
        ])
    ]
    
    all_results = []
    
    for medicine, expected_effects in test_medicines:
        print_info(f"Testing {medicine}...")
        
        try:
            response = requests.post(
                f"{SERVICE_URL}/predict",
                json={"medicine": medicine},
                timeout=TIMEOUT
            )
            
            if response.json().get("success"):
                predicted = response.json().get("side_effects", [])
                predicted_names = [se.get("side_effect", "").lower() for se in predicted[:5]]
                
                # Calculate overlap with expected effects
                overlap = sum(1 for e in expected_effects if any(e.lower() in p for p in predicted_names))
                accuracy = overlap / len(expected_effects) if expected_effects else 0
                
                all_results.append({
                    "medicine": medicine,
                    "accuracy": accuracy,
                    "predicted": predicted_names,
                    "expected": expected_effects
                })
                
                print(f"  ✓ Predicted {len(predicted)} effects")
                print(f"  ✓ Expected overlap: {overlap}/{len(expected_effects)} ({accuracy*100:.0f}%)\n")
            else:
                print_error(f"Prediction failed for {medicine}\n")
        
        except Exception as e:
            print_error(f"Error testing {medicine}: {str(e)}\n")
    
    if all_results:
        avg_accuracy = sum(r["accuracy"] for r in all_results) / len(all_results)
        print_info(f"Average Evaluation Accuracy: {avg_accuracy*100:.1f}%")

# ============================================
# MAIN TEST RUNNER
# ============================================

def main():
    """Run all tests."""
    print_header("Side Effect Predictor Service - Test Suite")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Service URL: {SERVICE_URL}")
    
    # Check health
    if not check_service_health():
        print_error("Cannot proceed without healthy service")
        return
    
    # Run prediction tests
    print_header("Running Prediction Tests")
    
    test_prediction(TEST_CASE_1)
    test_prediction(TEST_CASE_2)
    test_prediction(TEST_CASE_3)
    test_prediction(TEST_CASE_4)
    
    # Performance metrics
    test_performance_metrics()
    
    # Model evaluation
    model_evaluation()
    
    # Stress test
    stress_test(5)
    
    print_header("Test Suite Completed")
    print("\n✅ All tests completed successfully!")
    print("\nNext steps:")
    print("1. Integration test with Express routes")
    print("2. Frontend integration with React component")
    print("3. Production deployment with proper error handling")

if __name__ == "__main__":
    main()
