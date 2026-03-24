/**
 * Medical Record Summarization Client
 * 
 * Node.js wrapper for Python medical record summarization service
 * 
 * Usage:
 *   import { uploadAndSummarizeRecord, summarizeDirectText } from './medicalRecordClient.js';
 *   
 *   const result = await uploadAndSummarizeRecord(filePath, fileName);
 *   console.log(result.data.report);
 */

import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const MEDICAL_RECORD_SERVICE_URL = process.env.MEDICAL_RECORD_SERVICE_URL || 'http://localhost:5005';

// ============================================
// CONFIGURATION
// ============================================

const axiosInstance = axios.create({
    baseURL: MEDICAL_RECORD_SERVICE_URL,
    timeout: 120000, // 2 minute timeout for large files
    headers: {
        'Content-Type': 'application/json'
    }
});

// ============================================
// HEALTH CHECK
// ============================================

/**
 * Check if the medical record service is available
 */
export async function checkMedicalRecordServiceHealth() {
    try {
        const response = await axiosInstance.get('/health', { timeout: 5000 });
        console.log('✅ Medical Record Service is healthy:', response.data);
        return response.data.status === 'healthy';
    } catch (error) {
        console.error('❌ Medical Record Service is not available:', error.message);
        return false;
    }
}

// ============================================
// FILE UPLOAD AND SUMMARIZATION
// ============================================

/**
 * Upload a medical record file and get a professional summary
 * 
 * @param {string} filePath - Full path to the file to upload
 * @param {string} fileName - Original filename for reference
 * 
 * @returns {object} Result with report and processing time
 */
export async function uploadAndSummarizeRecord(filePath, fileName) {
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        console.log(`🔍 Uploading medical record: ${fileName}`);

        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath), fileName);

        const response = await axiosInstance.post('/summarize', formData, {
            headers: formData.getHeaders(),
            timeout: 120000
        });

        if (response.data.success) {
            console.log(`✅ Medical record summarized: ${fileName}`);
            return {
                success: true,
                data: response.data
            };
        } else {
            console.error(`❌ Summarization failed: ${response.data.error}`);
            return {
                success: false,
                error: response.data.error
            };
        }
    } catch (error) {
        console.error(`❌ Error uploading record: ${error.message}`);
        return {
            success: false,
            error: error.message,
            statusCode: error.response?.status
        };
    }
}

// ============================================
// DIRECT TEXT SUMMARIZATION
// ============================================

/**
 * Summarize medical text directly without file upload
 * 
 * @param {string} text - Medical text to summarize
 * @param {number} maxLength - Maximum summary length (optional)
 * 
 * @returns {object} Result with professional report
 */
export async function summarizeDirectText(text, maxLength = 150) {
    try {
        if (!text || typeof text !== 'string') {
            throw new Error('Text must be a non-empty string');
        }

        console.log(`🔍 Summarizing ${text.length} characters of medical text`);

        const payload = {
            text: text.trim(),
            max_summary_length: maxLength || 150
        };

        const response = await axiosInstance.post('/summarize-text', payload);

        if (response.data.success) {
            console.log(`✅ Text summarized successfully`);
            return {
                success: true,
                data: response.data
            };
        } else {
            console.error(`❌ Summarization failed: ${response.data.error}`);
            return {
                success: false,
                error: response.data.error
            };
        }
    } catch (error) {
        console.error(`❌ Error summarizing text: ${error.message}`);
        return {
            success: false,
            error: error.message,
            statusCode: error.response?.status
        };
    }
}

// ============================================
// PERFORMANCE METRICS
// ============================================

/**
 * Get model performance metrics
 */
export async function getPerformanceMetrics() {
    try {
        console.log('📊 Fetching performance metrics...');
        const response = await axiosInstance.get('/metrics');
        
        console.log('✅ Retrieved performance metrics');
        return {
            success: true,
            metrics: response.data
        };
    } catch (error) {
        console.error(`❌ Error fetching metrics: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================
// REPORT FORMATTING
// ============================================

/**
 * Format report for professional display
 */
export function formatReportForDisplay(report) {
    if (!report) return null;

    return {
        title: 'Medical Record Summary',
        metadata: report.metadata,
        patient: {
            conditions: report.patient_status?.conditions || [],
            symptoms: report.patient_status?.symptoms || [],
            treatments: report.patient_status?.treatments || []
        },
        summary: report.clinical_summary,
        findings: report.key_findings || [],
        observations: report.clinical_observations || [],
        recommendations: report.recommendations || {},
        confidence: report.confidence || {}
    };
}

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Summarize multiple medical texts
 * 
 * @param {array} texts - Array of text strings to summarize
 * 
 * @returns {array} Array of reports
 */
export async function batchSummarizeTexts(texts) {
    try {
        if (!Array.isArray(texts) || texts.length === 0) {
            throw new Error('Texts must be a non-empty array');
        }

        console.log(`🔍 Batch summarizing ${texts.length} medical texts`);

        const results = await Promise.all(
            texts.map(text => summarizeDirectText(text, 150))
        );

        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        console.log(`✅ Batch summarization: ${successful.length}/${texts.length} successful`);

        return {
            success: successful.length === texts.length,
            totalTexts: texts.length,
            successful: successful.length,
            failed: failed.length,
            reports: successful.map(r => r.data.report),
            errors: failed.map(f => f.error)
        };
    } catch (error) {
        console.error(`❌ Error in batch summarization: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extract key information from report
 */
export function extractKeyInfo(report) {
    if (!report) return null;

    return {
        conditions: report.patient_status?.conditions || [],
        primaryFindings: report.key_findings?.slice(0, 3) || [],
        recommendedTreatments: report.patient_status?.treatments || [],
        preventionSteps: report.recommendations?.prevention_steps || [],
        followUpActions: report.recommendations?.follow_up || [],
        confidence: report.confidence?.summary_confidence || 0
    };
}

/**
 * Generate PDF-ready summary
 */
export function generatePDFSummary(report, patientName = 'Patient') {
    if (!report) return '';

    const lines = [
        '═══════════════════════════════════════════',
        'MEDICAL RECORD SUMMARY',
        '═══════════════════════════════════════════',
        '',
        `Patient: ${patientName}`,
        `Generated: ${report.metadata?.generation_date || new Date().toISOString()}`,
        '',
        '───────────────────────────────────────────',
        'CLINICAL SUMMARY',
        '───────────────────────────────────────────',
        report.clinical_summary || '',
        '',
        '───────────────────────────────────────────',
        'KEY FINDINGS',
        '───────────────────────────────────────────',
        ...(report.key_findings || []),
        '',
        '───────────────────────────────────────────',
        'MEDICAL CONDITIONS',
        '───────────────────────────────────────────',
        ...(report.patient_status?.conditions || []),
        '',
        '───────────────────────────────────────────',
        'RECOMMENDATIONS',
        '───────────────────────────────────────────',
        ...(report.recommendations?.follow_up || []),
        '',
        '───────────────────────────────────────────',
        'PREVENTION STEPS',
        '───────────────────────────────────────────',
        ...(report.recommendations?.prevention_steps || []),
        '═══════════════════════════════════════════'
    ];

    return lines.join('\n');
}

export default {
    checkMedicalRecordServiceHealth,
    uploadAndSummarizeRecord,
    summarizeDirectText,
    getPerformanceMetrics,
    formatReportForDisplay,
    batchSummarizeTexts,
    extractKeyInfo,
    generatePDFSummary
};
