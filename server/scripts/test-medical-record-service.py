/**
 * Medical Record Summarization Service - Test Suite
 * 
 * Comprehensive tests for medical record OCR, entity extraction, and summarization
 * 
 * Run tests:
 *   python test-medical-record-service.py
 */

import unittest
import json
import requests
import time
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import PyPDF2

# Test configuration
SERVICE_URL = 'http://localhost:5005'
TIMEOUT = 120

class MedicalRecordServiceTests(unittest.TestCase):
    """Test suite for medical record summarization service"""

    @classmethod
    def setUpClass(cls):
        """Check if service is available"""
        try:
            response = requests.get(f'{SERVICE_URL}/health', timeout=5)
            print(f"✅ Service is available: {response.json()}")
        except Exception as e:
            print(f"❌ Service not available: {e}")
            raise

    def setUp(self):
        """Create test data"""
        self.test_files = {}
        self._create_test_files()

    def tearDown(self):
        """Clean up test files"""
        for file_path in self.test_files.values():
            if os.path.exists(file_path):
                os.remove(file_path)

    def _create_test_files(self):
        """Create sample test files"""
        
        # Sample medical text image
        test_image_path = '/tmp/medical_record_test.png'
        img = Image.new('RGB', (800, 600), color='white')
        draw = ImageDraw.Draw(img)
        
        medical_text = """
        MEDICAL RECORD
        Patient: John Doe
        Age: 45
        Date: 2024-01-15
        
        Chief Complaint: Persistent headaches and fever
        
        Diagnosis:
        - Migraine with aura
        - Upper respiratory infection
        - Hypertension (Grade 1)
        
        Treatment:
        - Sumatriptan 100mg twice daily
        - Amoxicillin 500mg three times daily
        - Lisinopril 10mg once daily
        
        Vital Signs:
        BP: 135/85 mmHg
        HR: 78 bpm
        Temp: 37.8°C
        
        Clinical Notes:
        Patient presents with worsening headaches lasting 3 days.
        Associated symptoms include nasal congestion and sore throat.
        Physical examination reveals clear lungs and no neck stiffness.
        Blood pressure elevated, recommend lifestyle modifications.
        """
        
        draw.text((10, 10), medical_text, fill='black')
        img.save(test_image_path)
        self.test_files['image'] = test_image_path

    # ========================================
    # HEALTH CHECK TESTS
    # ========================================

    def test_service_health(self):
        """Test service health endpoint"""
        response = requests.get(f'{SERVICE_URL}/health', timeout=5)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'healthy')
        self.assertIn('service', data)

    def test_service_info(self):
        """Test service provides info"""
        response = requests.get(f'{SERVICE_URL}/health', timeout=5)
        data = response.json()
        self.assertIn('service', data)
        self.assertEqual(data['service'], 'Medical Record Summarization Service')

    # ========================================
    # TEXT SUMMARIZATION TESTS
    # ========================================

    def test_summarize_paragraph(self):
        """Test summarizing a single paragraph"""
        medical_text = """
        Patient presents with acute myocardial infarction. 
        ECG shows ST elevation in leads II, III, aVF indicating anterior wall MI.
        Troponin levels elevated at 2.5 ng/mL.
        Patient receiving aspirin, clopidogrel, and heparin therapy.
        Left ventricular ejection fraction reduced to 35%.
        """
        
        payload = {
            'text': medical_text.strip(),
            'max_summary_length': 100
        }
        
        response = requests.post(
            f'{SERVICE_URL}/summarize-text',
            json=payload,
            timeout=TIMEOUT
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIn('summary', data)
        self.assertIn('report', data)
        self.assertIn('entities', data)

    def test_summarize_full_record(self):
        """Test summarizing a full medical record"""
        medical_record = """
        DISCHARGE SUMMARY
        
        Patient Name: Jane Smith
        Age: 58
        Admission Date: 2024-01-10
        Discharge Date: 2024-01-15
        
        Admitting Diagnosis:
        Type 2 Diabetes Mellitus with poor glycemic control
        
        Associated Conditions:
        Hypertension, Hyperlipidemia, Obesity (BMI 31.2)
        
        Hospital Course:
        Patient admitted for management of uncontrolled diabetes.
        Initial HbA1c was 9.8% indicating poor control over 3 months.
        Insulin therapy initiated and titrated to 40 units daily.
        Metformin increased to 2000mg daily.
        Cardiac workup performed; no acute ischemic changes noted.
        
        Discharge Medications:
        1. Insulin glargine 40 units at bedtime
        2. Metformin 1000mg twice daily
        3. Lisinopril 20mg daily
        4. Atorvastatin 40mg daily
        5. Aspirin 81mg daily
        
        Follow-up:
        Endocrinology appointment in 2 weeks
        Repeat labs (CBC, CMP, lipid panel) in 1 month
        """
        
        payload = {
            'text': medical_record.strip(),
            'max_summary_length': 200
        }
        
        response = requests.post(
            f'{SERVICE_URL}/summarize-text',
            json=payload,
            timeout=TIMEOUT
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        report = data.get('report', {})
        
        # Verify report structure
        self.assertIn('clinical_summary', report)
        self.assertIn('key_findings', report)
        self.assertIn('patient_status', report)
        self.assertIn('recommendations', report)

    def test_entity_extraction(self):
        """Test medical entity extraction"""
        text = """
        Patient diagnosed with pneumonia and prescribed Amoxicillin 500mg.
        Also treated for hypertension with Lisinopril 10mg daily.
        Shows symptoms of fever and cough.
        """
        
        payload = {
            'text': text.strip(),
            'max_summary_length': 100
        }
        
        response = requests.post(
            f'{SERVICE_URL}/summarize-text',
            json=payload,
            timeout=TIMEOUT
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        entities = data.get('entities', {})
        
        # Check that entities are extracted
        self.assertIsInstance(entities, dict)
        if entities:
            self.assertIn('conditions', entities)
            self.assertIn('treatments', entities)

    # ========================================
    # FILE UPLOAD TESTS (if service running)
    # ========================================

    def test_file_upload_image(self):
        """Test uploading an image file"""
        if 'image' not in self.test_files:
            self.skipTest("Test image not available")
        
        file_path = self.test_files['image']
        
        try:
            with open(file_path, 'rb') as f:
                files = {'file': (os.path.basename(file_path), f)}
                response = requests.post(
                    f'{SERVICE_URL}/summarize',
                    files=files,
                    timeout=TIMEOUT
                )
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data['success'])
            self.assertIn('report', data)
        except requests.exceptions.ConnectionError:
            self.skipTest("Service not accepting file uploads or file error")

    def test_metrics_endpoint(self):
        """Test performance metrics endpoint"""
        response = requests.get(f'{SERVICE_URL}/metrics', timeout=5)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertIn('processing_times', data)
        self.assertIn('file_types', data)
        self.assertIn('compression_ratio', data)
        self.assertIn('summarization_latencies', data)

    # ========================================
    # ERROR HANDLING TESTS
    # ========================================

    def test_empty_text_error(self):
        """Test error handling for empty text"""
        payload = {
            'text': '',
            'max_summary_length': 100
        }
        
        response = requests.post(
            f'{SERVICE_URL}/summarize-text',
            json=payload,
            timeout=TIMEOUT
        )
        
        self.assertIn(response.status_code, [400, 422])

    def test_missing_text_error(self):
        """Test error handling for missing text field"""
        payload = {
            'max_summary_length': 100
        }
        
        response = requests.post(
            f'{SERVICE_URL}/summarize-text',
            json=payload,
            timeout=TIMEOUT
        )
        
        self.assertIn(response.status_code, [400, 422])

    def test_invalid_max_length(self):
        """Test error handling for invalid max_summary_length"""
        payload = {
            'text': 'Some medical text here',
            'max_summary_length': -1
        }
        
        response = requests.post(
            f'{SERVICE_URL}/summarize-text',
            json=payload,
            timeout=TIMEOUT
        )
        
        # Should either correct it or return error
        self.assertIn(response.status_code, [200, 400, 422])

    # ========================================
    # PERFORMANCE TESTS
    # ========================================

    def test_summarization_latency(self):
        """Test summarization performance"""
        text = """
        Patient with history of diabetes presented with acute onset chest pain.
        ECG revealed ST elevation. Cardiac enzymes elevated. Admitted for acute MI.
        Treated with angioplasty and stent placement. Course complicated by cardiogenic shock.
        """
        
        payload = {
            'text': text.strip(),
            'max_summary_length': 100
        }
        
        start_time = time.time()
        response = requests.post(
            f'{SERVICE_URL}/summarize-text',
            json=payload,
            timeout=TIMEOUT
        )
        elapsed = (time.time() - start_time) * 1000
        
        self.assertEqual(response.status_code, 200)
        print(f"⏱️ Summarization latency: {elapsed:.2f}ms")
        
        # Should complete in reasonable time (< 30 seconds)
        self.assertLess(elapsed, 30000)

    def test_batch_performance(self):
        """Test performance with multiple texts"""
        texts = [
            "Patient diagnosed with hypertension. Started on Lisinopril 10mg daily.",
            "Acute bronchitis treated with antibiotics and cough suppressants.",
            "Type 2 diabetes managed with Metformin 1000mg twice daily."
        ]
        
        start_time = time.time()
        
        for text in texts:
            payload = {'text': text, 'max_summary_length': 100}
            response = requests.post(
                f'{SERVICE_URL}/summarize-text',
                json=payload,
                timeout=TIMEOUT
            )
            self.assertEqual(response.status_code, 200)
        
        total_time = (time.time() - start_time) * 1000
        avg_time = total_time / len(texts)
        
        print(f"⏱️ Batch processing: {total_time:.2f}ms total, {avg_time:.2f}ms per record")

    # ========================================
    # OUTPUT VALIDATION TESTS
    # ========================================

    def test_report_structure(self):
        """Test that reports have correct structure"""
        medical_text = """
        Patient: 45-year-old male
        Presenting complaint: Persistent cough for 2 weeks
        Associated symptoms: Fever, shortness of breath
        Physical examination: Bilateral crackles in lungs
        Chest X-ray: Infiltrates in right middle lobe
        Diagnosis: Community-acquired pneumonia
        Treatment: Azithromycin 500mg, Amoxicillin-clavulanate
        """
        
        payload = {
            'text': medical_text.strip(),
            'max_summary_length': 100
        }
        
        response = requests.post(
            f'{SERVICE_URL}/summarize-text',
            json=payload,
            timeout=TIMEOUT
        )
        
        data = response.json()
        report = data['report']
        
        # Validate required fields
        required_fields = ['metadata', 'patient_status', 'clinical_summary', 'key_findings', 'recommendations']
        for field in required_fields:
            self.assertIn(field, report, f"Missing field: {field}")
        
        # Validate nested structures
        self.assertIn('conditions', report['patient_status'])
        self.assertIn('treatments', report['patient_status'])
        self.assertIn('follow_up', report['recommendations'])

    def test_confidence_scores(self):
        """Test that confidence scores are provided"""
        text = "Patient has fever and cough, likely viral infection."
        
        payload = {
            'text': text.strip(),
            'max_summary_length': 100
        }
        
        response = requests.post(
            f'{SERVICE_URL}/summarize-text',
            json=payload,
            timeout=TIMEOUT
        )
        
        data = response.json()
        report = data.get('report', {})
        confidence = report.get('confidence', {})
        
        self.assertIsInstance(confidence, dict)
        self.assertIn('summary_confidence', confidence)

    # ========================================
    # INTEGRATION TESTS
    # ========================================

    def test_reset_metrics(self):
        """Test metrics reset functionality"""
        # First, get initial metrics
        response1 = requests.get(f'{SERVICE_URL}/metrics', timeout=5)
        initial_metrics = response1.json()
        
        # Reset metrics
        response2 = requests.post(f'{SERVICE_URL}/reset-metrics', timeout=5)
        self.assertEqual(response2.status_code, 200)
        
        # Check that metrics are reset
        response3 = requests.get(f'{SERVICE_URL}/metrics', timeout=5)
        reset_metrics = response3.json()
        
        self.assertEqual(reset_metrics['total_requests'], 0)
        self.assertEqual(reset_metrics['successful_requests'], 0)

    def test_concurrent_requests(self):
        """Test handling multiple concurrent requests"""
        texts = [
            "Diabetic patient with blood glucose 280 mg/dL",
            "Hypertensive crisis with BP 180/120",
            "Patient with acute appendicitis requiring surgery"
        ]
        
        import concurrent.futures
        
        def process_text(text):
            payload = {'text': text, 'max_summary_length': 100}
            return requests.post(
                f'{SERVICE_URL}/summarize-text',
                json=payload,
                timeout=TIMEOUT
            )
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            futures = [executor.submit(process_text, text) for text in texts]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]
        
        # All should succeed
        for result in results:
            self.assertEqual(result.status_code, 200)


# ============================================
# STANDALONE TEST FUNCTIONS
# ============================================

def test_service_response_format():
    """Test that service response format is valid"""
    text = "Patient with migraine treated with Sumatriptan"
    payload = {'text': text, 'max_summary_length': 100}
    
    response = requests.post(
        f'{SERVICE_URL}/summarize-text',
        json=payload,
        timeout=TIMEOUT
    )
    
    data = response.json()
    
    # Check response structure
    assert 'success' in data
    assert 'summary' in data or 'report' in data
    assert data['success'] or 'error' in data
    
    print("✅ Response format valid")


def test_service_robustness():
    """Test service robustness with various inputs"""
    test_cases = [
        "Single word: Fever",
        "Short phrase: Patient has fever and cough",
        "Normal length: " + "Medical record " * 50,
        "Special characters: Patient #123 on Rx-Drug @ 10 AM",
        "Multiple languages: Dolor in pectus (chest pain)",
    ]
    
    for text in test_cases:
        payload = {'text': text, 'max_summary_length': 100}
        response = requests.post(
            f'{SERVICE_URL}/summarize-text',
            json=payload,
            timeout=TIMEOUT
        )
        
        assert response.status_code == 200
    
    print("✅ Service handles various inputs robustly")


# ============================================
# MAIN
# ============================================

if __name__ == '__main__':
    # Run unit tests
    unittest.main(verbosity=2, exit=False)
    
    # Run standalone tests
    print("\n" + "="*60)
    print("Running standalone tests...")
    print("="*60)
    
    try:
        test_service_response_format()
        test_service_robustness()
        print("\n✅ All tests completed successfully!")
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
