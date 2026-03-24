/**
 * Health Assistant Service - Test Suite
 * 
 * Tests for agent routing, intent detection, and service integration
 * 
 * Run tests:
 *   python test-health-assistant-service.py
 */

import unittest
import requests
import time
import json
from datetime import datetime

SERVICE_URL = 'http://localhost:5006'
TIMEOUT = 30

class HealthAssistantServiceTests(unittest.TestCase):
    """Test suite for health assistant service"""

    @classmethod
    def setUpClass(cls):
        """Verify service is available"""
        try:
            response = requests.get(f'{SERVICE_URL}/health', timeout=5)
            print(f"✅ Service is available: {response.json()}")
        except Exception as e:
            print(f"❌ Service not available: {e}")
            raise

    # ========================================
    # HEALTH CHECK TESTS
    # ========================================

    def test_service_health(self):
        """Test service health endpoint"""
        response = requests.get(f'{SERVICE_URL}/health', timeout=5)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['service'], 'AI Health Assistant Service')

    def test_service_info(self):
        """Test service provides correct info"""
        response = requests.get(f'{SERVICE_URL}/health', timeout=5)
        data = response.json()
        self.assertIn('port', data)
        self.assertIn('timestamp', data)

    # ========================================
    # QUERY ROUTING TESTS
    # ========================================

    def test_side_effects_query(self):
        """Test routing side effects query"""
        payload = {
            'query': 'What are the side effects of Aspirin?'
        }
        
        response = requests.post(
            f'{SERVICE_URL}/chat',
            json=payload,
            timeout=TIMEOUT
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['intent'], 'side-effects')
        self.assertIn('response', data)

    def test_drug_interaction_query(self):
        """Test routing drug interaction query"""
        payload = {
            'query': 'What are interactions between Aspirin and Ibuprofen?'
        }
        
        response = requests.post(
            f'{SERVICE_URL}/chat',
            json=payload,
            timeout=TIMEOUT
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['intent'], 'drug-interaction')

    def test_food_interaction_query(self):
        """Test routing food interaction query"""
        payload = {
            'query': 'Can I eat grapefruit with my Lisinopril?'
        }
        
        response = requests.post(
            f'{SERVICE_URL}/chat',
            json=payload,
            timeout=TIMEOUT
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['intent'], 'food-interaction')

    def test_symptom_query(self):
        """Test routing symptom query"""
        payload = {
            'query': 'I have a fever and cough'
        }
        
        response = requests.post(
            f'{SERVICE_URL}/chat',
            json=payload,
            timeout=TIMEOUT
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['intent'], 'symptoms')

    def test_general_health_query(self):
        """Test general health information query"""
        payload = {
            'query': 'Tell me about headaches'
        }
        
        response = requests.post(
            f'{SERVICE_URL}/chat',
            json=payload,
            timeout=TIMEOUT
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])

    # ========================================
    # DRUG DETECTION TESTS
    # ========================================

    def test_single_drug_detection(self):
        """Test detecting single drug name"""
        payload = {
            'query': 'What are the side effects of Metformin?'
        }
        
        response = requests.post(
            f'{SERVICE_URL}/chat',
            json=payload,
            timeout=TIMEOUT
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])

    def test_multiple_drug_detection(self):
        """Test detecting multiple drugs"""
        payload = {
            'query': 'Can I take Metformin with Lisinopril?'
        }
        
        response = requests.post(
            f'{SERVICE_URL}/chat',
            json=payload,
            timeout=TIMEOUT
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])

    # ========================================
    # QUICK QUERIES TESTS
    # ========================================

    def test_quick_queries_endpoint(self):
        """Test quick queries suggestions"""
        response = requests.get(
            f'{SERVICE_URL}/quick-queries',
            timeout=5
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIsInstance(data['queries'], list)
        self.assertGreater(len(data['queries']), 0)

    def test_quick_queries_structure(self):
        """Test quick queries have correct structure"""
        response = requests.get(
            f'{SERVICE_URL}/quick-queries',
            timeout=5
        )
        
        data = response.json()
        for query in data['queries']:
            self.assertIn('title', query)
            self.assertIn('query', query)
            self.assertIn('category', query)

    # ========================================
    # ERROR HANDLING TESTS
    # ========================================

    def test_empty_query(self):
        """Test error handling for empty query"""
        payload = {
            'query': ''
        }
        
        response = requests.post(
            f'{SERVICE_URL}/chat',
            json=payload,
            timeout=TIMEOUT
        )
        
        self.assertEqual(response.status_code, 400)

    def test_missing_query_field(self):
        """Test error handling for missing query field"""
        payload = {}
        
        response = requests.post(
            f'{SERVICE_URL}/chat',
            json=payload,
            timeout=TIMEOUT
        )
        
        self.assertEqual(response.status_code, 400)

    def test_invalid_json(self):
        """Test error handling for invalid JSON"""
        response = requests.post(
            f'{SERVICE_URL}/chat',
            data='invalid json',
            timeout=TIMEOUT
        )
        
        self.assertIn(response.status_code, [400, 415])

    # ========================================
    # RESPONSE FORMAT TESTS
    # ========================================

    def test_response_structure(self):
        """Test response has correct structure"""
        payload = {
            'query': 'What are side effects of Aspirin?'
        }
        
        response = requests.post(
            f'{SERVICE_URL}/chat',
            json=payload,
            timeout=TIMEOUT
        )
        
        data = response.json()
        self.assertIn('success', data)
        self.assertIn('response', data)
        self.assertIn('intent', data)
        self.assertIn('source', data)
        self.assertIn('response_time_ms', data)

    def test_response_contains_formatted_message(self):
        """Test response contains user-friendly message"""
        payload = {
            'query': 'What are side effects of Aspirin?'
        }
        
        response = requests.post(
            f'{SERVICE_URL}/chat',
            json=payload,
            timeout=TIMEOUT
        )
        
        data = response.json()
        self.assertIsInstance(data['response'], str)
        self.assertGreater(len(data['response']), 0)

    # ========================================
    # PERFORMANCE TESTS
    # ========================================

    def test_response_time(self):
        """Test response is within reasonable time"""
        payload = {
            'query': 'What is a fever?'
        }
        
        response = requests.post(
            f'{SERVICE_URL}/chat',
            json=payload,
            timeout=TIMEOUT
        )
        
        data = response.json()
        response_time = data.get('response_time_ms', 0)
        
        # Should respond within 20 seconds
        self.assertLess(response_time, 20000)
        self.assertGreater(response_time, 0)

    def test_multiple_queries_performance(self):
        """Test performance with multiple queries"""
        queries = [
            'What are side effects of Aspirin?',
            'What are interactions between Metformin and Lisinopril?',
            'What is a fever?',
            'Can I eat grapefruit?'
        ]
        
        start_time = time.time()
        
        for query in queries:
            payload = {'query': query}
            response = requests.post(
                f'{SERVICE_URL}/chat',
                json=payload,
                timeout=TIMEOUT
            )
            self.assertEqual(response.status_code, 200)
        
        total_time = (time.time() - start_time) * 1000
        avg_time = total_time / len(queries)
        
        print(f"⏱️ Performance: {total_time:.2f}ms total, {avg_time:.2f}ms per query")

    # ========================================
    # METRICS TESTS
    # ========================================

    def test_metrics_endpoint(self):
        """Test metrics endpoint"""
        response = requests.get(
            f'{SERVICE_URL}/metrics',
            timeout=5
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIn('metrics', data)

    def test_metrics_structure(self):
        """Test metrics have correct structure"""
        response = requests.get(
            f'{SERVICE_URL}/metrics',
            timeout=5
        )
        
        metrics = response.json()['metrics']
        self.assertIn('total_queries', metrics)
        self.assertIn('routed_queries', metrics)
        self.assertIn('successful_routes', metrics)
        self.assertIn('average_response_time', metrics)

    def test_reset_metrics(self):
        """Test metrics reset functionality"""
        # Get initial metrics
        response1 = requests.get(f'{SERVICE_URL}/metrics', timeout=5)
        initial_total = response1.json()['metrics']['total_queries']
        
        # Reset metrics
        response2 = requests.post(f'{SERVICE_URL}/reset-metrics', timeout=5)
        self.assertEqual(response2.status_code, 200)
        
        # Verify metrics are reset
        response3 = requests.get(f'{SERVICE_URL}/metrics', timeout=5)
        reset_total = response3.json()['metrics']['total_queries']
        
        self.assertEqual(reset_total, 0)

    def test_metrics_tracking(self):
        """Test metrics are properly tracked"""
        # Reset metrics first
        requests.post(f'{SERVICE_URL}/reset-metrics', timeout=5)
        
        # Send a query
        payload = {'query': 'What is a fever?'}
        requests.post(f'{SERVICE_URL}/chat', json=payload, timeout=TIMEOUT)
        
        # Check metrics
        response = requests.get(f'{SERVICE_URL}/metrics', timeout=5)
        metrics = response.json()['metrics']
        
        self.assertEqual(metrics['total_queries'], 1)
        self.assertGreater(metrics['routed_queries'], 0)

    # ========================================
    # CONVERSATION HISTORY TESTS
    # ========================================

    def test_conversation_history_endpoint(self):
        """Test conversation history endpoint"""
        response = requests.get(
            f'{SERVICE_URL}/conversation-history',
            timeout=5
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIn('history', data)
        self.assertIn('total_queries', data)

    def test_conversation_history_structure(self):
        """Test conversation history has correct structure"""
        response = requests.get(
            f'{SERVICE_URL}/conversation-history',
            timeout=5
        )
        
        data = response.json()
        for item in data['history']:
            self.assertIn('timestamp', item)
            self.assertIn('query', item)
            self.assertIn('intent', item)
            self.assertIn('response_time_ms', item)
            self.assertIn('success', item)

    # ========================================
    # INTEGRATION TESTS
    # ========================================

    def test_query_flow_side_effects(self):
        """Test complete flow for side effects query"""
        query = 'Tell me about side effects of Ibuprofen'
        payload = {'query': query}
        
        response = requests.post(
            f'{SERVICE_URL}/chat',
            json=payload,
            timeout=TIMEOUT
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify complete flow
        self.assertTrue(data['success'])
        self.assertEqual(data['intent'], 'side-effects')
        self.assertIsNotNone(data['response'])
        self.assertIn('Side Effects', data['response'] or 'side effects')

    def test_user_id_tracking(self):
        """Test user ID is properly tracked"""
        payload = {
            'query': 'What is a fever?',
            'user_id': 'test-user-123'
        }
        
        response = requests.post(
            f'{SERVICE_URL}/chat',
            json=payload,
            timeout=TIMEOUT
        )
        
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data.get('user_id'), 'test-user-123')

    # ========================================
    # EDGE CASE TESTS
    # ========================================

    def test_very_long_query(self):
        """Test handling of very long queries"""
        long_query = 'What are the side effects of ' + 'Aspirin ' * 50
        
        payload = {'query': long_query}
        response = requests.post(
            f'{SERVICE_URL}/chat',
            json=payload,
            timeout=TIMEOUT
        )
        
        self.assertEqual(response.status_code, 200)

    def test_special_characters_in_query(self):
        """Test handling of special characters"""
        payload = {
            'query': 'What are side effects of Aspirin? & interactions! #pharmacy @health'
        }
        
        response = requests.post(
            f'{SERVICE_URL}/chat',
            json=payload,
            timeout=TIMEOUT
        )
        
        self.assertEqual(response.status_code, 200)

    def test_case_insensitive_queries(self):
        """Test queries are case insensitive"""
        queries = [
            'WHAT ARE SIDE EFFECTS OF ASPIRIN?',
            'what are side effects of aspirin?',
            'What Are Side Effects Of Aspirin?'
        ]
        
        for query in queries:
            payload = {'query': query}
            response = requests.post(
                f'{SERVICE_URL}/chat',
                json=payload,
                timeout=TIMEOUT
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()['intent'], 'side-effects')


# ============================================
# STANDALONE TEST FUNCTIONS
# ============================================

def test_service_reliability():
    """Test service reliability across multiple requests"""
    print("\n🔍 Testing service reliability...")
    
    success_count = 0
    failure_count = 0
    
    queries = [
        'What are side effects of Aspirin?',
        'Drug interactions between Metformin and Lisinopril',
        'Symptoms of fever',
        'Can I eat grapefruit?'
    ]
    
    for query in queries:
        try:
            response = requests.post(
                f'{SERVICE_URL}/chat',
                json={'query': query},
                timeout=TIMEOUT
            )
            if response.status_code == 200 and response.json()['success']:
                success_count += 1
            else:
                failure_count += 1
        except Exception as e:
            failure_count += 1
            print(f"  ❌ Failed: {e}")
    
    print(f"✅ Reliability: {success_count}/{len(queries)} queries successful")
    assert success_count == len(queries), "Service reliability test failed"


# ============================================
# MAIN
# ============================================

if __name__ == '__main__':
    unittest.main(verbosity=2, exit=False)
    
    print("\n" + "="*60)
    print("Running additional tests...")
    print("="*60)
    
    try:
        test_service_reliability()
        print("\n✅ All tests passed!")
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
