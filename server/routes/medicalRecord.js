import express from 'express';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const MEDICAL_RECORD_SERVICE_URL = (process.env.MEDICAL_RECORD_SERVICE_URL || 'http://127.0.0.1:5005').replace(/\/$/, '');

async function forwardJsonResponse(response, res) {
  const text = await response.text();
  let payload;

  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { success: false, error: text || 'Invalid response from medical record service' };
  }

  return res.status(response.status).json(payload);
}

router.get('/health', async (_req, res) => {
  try {
    const response = await fetch(`${MEDICAL_RECORD_SERVICE_URL}/health`, {
      method: 'GET'
    });
    return forwardJsonResponse(response, res);
  } catch (error) {
    return res.status(502).json({
      success: false,
      error: `Medical record service unavailable: ${error.message}`
    });
  }
});

router.post('/summarize-text', async (req, res) => {
  try {
    const response = await fetch(`${MEDICAL_RECORD_SERVICE_URL}/summarize-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body || {})
    });
    return forwardJsonResponse(response, res);
  } catch (error) {
    return res.status(502).json({
      success: false,
      error: `Medical record service unavailable: ${error.message}`
    });
  }
});

router.post('/summarize', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'file is required'
    });
  }

  try {
    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype || 'application/octet-stream' });

    formData.append('file', blob, req.file.originalname || 'medical-record');

    if (req.body?.max_length) {
      formData.append('max_length', String(req.body.max_length));
    }
    if (req.body?.min_length) {
      formData.append('min_length', String(req.body.min_length));
    }

    const response = await fetch(`${MEDICAL_RECORD_SERVICE_URL}/summarize`, {
      method: 'POST',
      body: formData
    });

    return forwardJsonResponse(response, res);
  } catch (error) {
    return res.status(502).json({
      success: false,
      error: `Medical record service unavailable: ${error.message}`
    });
  }
});

export default router;
