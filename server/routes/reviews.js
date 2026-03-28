import express from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import DoctorReviewRequest from '../models/DoctorReviewRequest.js';

const router = express.Router();

const FEATURE_LABELS = {
  ddi: 'Drug-Drug Interaction',
  dfi: 'Drug-Food Interaction',
  alternatives: 'Drug Alternatives',
  'side-effects': 'Side Effects',
  'ai-assistant': 'AI Health Assistant',
  'medication-pharmacy': 'Medication / Pharmacy',
  'health-summary': 'Record Summarization',
};

const toClient = (item) => ({
  id: String(item._id),
  patientId: String(item.patientId),
  patientName: item.patientName,
  patientEmail: item.patientEmail,
  doctorId: String(item.doctorId),
  doctorEmail: item.doctorEmail,
  feature: item.feature,
  featureLabel: FEATURE_LABELS[item.feature] || item.feature,
  patientQuery: item.patientQuery,
  aiResultText: item.aiResultText,
  aiResultData: item.aiResultData,
  status: item.status,
  doctorActionMessage: item.doctorActionMessage,
  modifiedResultText: item.modifiedResultText,
  reviewedAt: item.reviewedAt,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

router.post('/', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ success: false, message: 'Only patients can request doctor review' });
    }

    const { feature, patientQuery = '', aiResultText = '', aiResultData = null } = req.body || {};

    if (!feature || !aiResultText.trim()) {
      return res.status(400).json({ success: false, message: 'feature and aiResultText are required' });
    }

    const patient = await User.findById(req.user.id).select('email userName patientProfile.assignedDoctorId');
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const assignedDoctorId = patient.patientProfile?.assignedDoctorId;
    if (!assignedDoctorId) {
      return res.status(400).json({ success: false, message: 'No assigned doctor found for patient profile' });
    }

    if (!mongoose.Types.ObjectId.isValid(String(assignedDoctorId))) {
      return res.status(400).json({ success: false, message: 'Assigned doctor is invalid' });
    }

    const doctor = await User.findOne({ _id: assignedDoctorId, role: 'doctor', 'doctorProfile.profileCompleted': true }).select('email');
    if (!doctor) {
      return res.status(400).json({ success: false, message: 'Assigned doctor is not available' });
    }

    const item = await DoctorReviewRequest.create({
      patientId: patient._id,
      patientName: patient.userName || patient.email,
      patientEmail: patient.email,
      doctorId: doctor._id,
      doctorEmail: doctor.email,
      feature,
      patientQuery,
      aiResultText: aiResultText.trim(),
      aiResultData,
      status: 'pending',
    });

    await Notification.create({
      userId: doctor._id,
      userEmail: doctor.email,
      type: 'doctor_review_request',
      title: 'Patient review requested',
      message: `${patient.userName || patient.email} requested review for ${FEATURE_LABELS[feature] || feature}`,
      reviewRequestId: item._id,
      read: false,
    });

    return res.status(201).json({ success: true, data: toClient(item) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/mine', requireAuth, async (req, res) => {
  try {
    const status = String(req.query.status || '').trim();
    const feature = String(req.query.feature || '').trim();
    const limit = Math.min(Number.parseInt(String(req.query.limit || '50'), 10) || 50, 200);

    const filter = req.user.role === 'doctor'
      ? { doctorId: req.user.id }
      : { patientId: req.user.id };

    if (status) {
      filter.status = status;
    }

    if (feature) {
      filter.feature = feature;
    }

    const items = await DoctorReviewRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.json({ success: true, count: items.length, data: items.map(toClient) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const item = await DoctorReviewRequest.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Review request not found' });
    }

    const isDoctorOwner = item.doctorId.toString() === req.user.id;
    const isPatientOwner = item.patientId.toString() === req.user.id;
    if (!isDoctorOwner && !isPatientOwner) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    return res.json({ success: true, data: toClient(item) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/action', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Only doctors can review requests' });
    }

    const { action, doctorActionMessage = '', modifiedResultText = '' } = req.body || {};
    if (!['approved', 'rejected', 'modified'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    const item = await DoctorReviewRequest.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Review request not found' });
    }

    if (item.doctorId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (item.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Review request already processed' });
    }

    if (action === 'modified' && !String(modifiedResultText || '').trim()) {
      return res.status(400).json({ success: false, message: 'modifiedResultText is required for modified action' });
    }

    item.status = action;
    item.doctorActionMessage = String(doctorActionMessage || '').trim();
    item.modifiedResultText = action === 'modified' ? String(modifiedResultText).trim() : '';
    item.reviewedAt = new Date();
    await item.save();

    const patient = await User.findById(item.patientId).select('email');
    if (patient) {
      const title = action === 'approved'
        ? 'Doctor approved your request'
        : action === 'rejected'
          ? 'Doctor rejected your request'
          : 'Doctor modified your result';

      const baseMessage = `${FEATURE_LABELS[item.feature] || item.feature}: ${item.patientQuery || 'reviewed response'}`;
      const actionMessage = item.doctorActionMessage ? ` (${item.doctorActionMessage})` : '';

      await Notification.create({
        userId: patient._id,
        userEmail: patient.email,
        type: 'doctor_review_result',
        title,
        message: `${baseMessage}${actionMessage}`,
        reviewRequestId: item._id,
        read: false,
      });
    }

    return res.json({ success: true, data: toClient(item) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
