import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  uploadRecording, getRecordings, getRecording, streamRecording, verifyRecordingIntegrity,
  uploadDocument, getDocuments, downloadDocument, verifyDocumentIntegrity,
  getDecisions, recordDecision, verifyDecisionIntegrity,
  getAuditLogs, verifyAuditChainIntegrity,
  sealMeeting, verifyMeetingEvidenceEndpoint,
  getSecurityStatus,
  getEvidenceChainEndpoint,
} from '../controllers/evidenceController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Multer config for recordings
const recordingStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/recordings')),
  filename: (req, file, cb) => cb(null, `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${path.extname(file.originalname) || '.webm'}`),
});
const recordingUpload = multer({ storage: recordingStorage, limits: { fileSize: 500 * 1024 * 1024 } }); // 500MB

// Multer config for documents
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/documents')),
  filename: (req, file, cb) => cb(null, `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${path.extname(file.originalname)}`),
});
const documentUpload = multer({ storage: documentStorage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

// ---- Recordings ----
router.post('/recordings/upload', recordingUpload.single('recording'), uploadRecording);
router.get('/recordings', getRecordings);
router.get('/recordings/:id', getRecording);
router.get('/recordings/:id/stream', streamRecording);
router.post('/recordings/:id/verify', verifyRecordingIntegrity);

// ---- Documents ----
router.post('/documents/upload', documentUpload.single('document'), uploadDocument);
router.get('/documents', getDocuments);
router.get('/documents/:id/download', downloadDocument);
router.post('/documents/:id/verify', verifyDocumentIntegrity);

// ---- Decisions ----
router.get('/decisions', getDecisions);
router.post('/decisions', recordDecision);
router.post('/decisions/:id/verify', verifyDecisionIntegrity);

// ---- Audit Logs ----
router.get('/audit', getAuditLogs);
router.post('/audit/verify', verifyAuditChainIntegrity);

// ---- Meeting Evidence ----
router.post('/meetings/:id/seal', sealMeeting);
router.post('/meetings/:id/verify', verifyMeetingEvidenceEndpoint);

// ---- Security ----
router.get('/security/status', getSecurityStatus);

// ---- Evidence Chain ----
router.get('/chain/:meetingId', getEvidenceChainEndpoint);

export default router;
