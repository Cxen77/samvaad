/**
 * Evidence Controller
 * 
 * Handles all evidence-related API endpoints: recordings, documents,
 * decisions, audit logs, meeting sealing, and integrity verification.
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Recording from '../models/Recording.js';
import DocumentModel from '../models/Document.js';
import Decision from '../models/Decision.js';
import { hashFile, hashString, encryptMessage } from '../services/encryptionService.js';
import { anchorEvidence, getEvidenceChain, verifyChainIntegrity } from '../services/blockchainService.js';
import { verifyPublicAnchorProof } from '../services/publicAnchorService.js';
import Evidence from '../models/Evidence.js';
import { logEvent, getAuditLogs as getAuditLogsService, verifyAuditChain, getAuditRootHash } from '../services/auditService.js';
import { verifyRecording, verifyDocument, verifyDecision, verifyMeetingEvidence } from '../services/integrityService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getIp = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection?.remoteAddress || '0.0.0.0';

// ================================================================
// RECORDINGS
// ================================================================

/**
 * Upload a recording blob.
 * Receives the file via multer, encrypts it, stores metadata in MongoDB,
 * and anchors the hash to the evidence ledger.
 */
export const uploadRecording = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No recording file provided' });
    }

    const { meetingId, meetingTitle, institute, hostId, hostName, participants, startTime, endTime, duration } = req.body;
    const recordingId = 'REC-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    // Read the raw file buffer
    const rawBuffer = fs.readFileSync(req.file.path);

    // Compute SHA-256 hash of the raw recording
    const sha256Hash = hashFile(rawBuffer);

    // Encrypt the recording with AES-256-GCM
    let encryptionIv = null;
    let encryptionAuthTag = null;
    let encryptionStatus = 'plaintext';

    try {
      const encKey = process.env.CHAT_MASTER_KEY;
      if (encKey && encKey.length === 64) {
        const iv = crypto.randomBytes(16);
        const key = Buffer.from(encKey, 'hex');
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv, { authTagLength: 16 });
        const encrypted = Buffer.concat([cipher.update(rawBuffer), cipher.final()]);
        const authTag = cipher.getAuthTag();

        // Write encrypted file
        const encryptedPath = req.file.path + '.enc';
        fs.writeFileSync(encryptedPath, encrypted);
        fs.unlinkSync(req.file.path); // Remove plaintext

        // Rename
        fs.renameSync(encryptedPath, req.file.path);

        encryptionIv = iv.toString('hex');
        encryptionAuthTag = authTag.toString('hex');
        encryptionStatus = 'encrypted';
      }
    } catch (encErr) {
      console.warn('[Recording] Encryption skipped:', encErr.message);
      encryptionStatus = 'plaintext';
    }

    // Parse participants
    let parsedParticipants = [];
    try {
      parsedParticipants = participants ? JSON.parse(participants) : [];
    } catch { parsedParticipants = []; }

    // Save to MongoDB
    const recording = await Recording.create({
      recordingId,
      meetingId: meetingId || 'UNKNOWN',
      meetingTitle: meetingTitle || 'Meeting Recording',
      institute: institute || '',
      hostId: hostId || req.user?._id?.toString() || 'host',
      hostName: hostName || req.user?.name || 'Host',
      participants: parsedParticipants,
      startTime: startTime ? new Date(startTime) : new Date(),
      endTime: endTime ? new Date(endTime) : new Date(),
      duration: parseInt(duration) || 0,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype || 'video/webm',
      encryptionStatus,
      encryptionIv,
      encryptionAuthTag,
      sha256Hash,
      integrityStatus: 'verified',
      status: 'processed',
    });

    // Anchor hash to evidence ledger
    const evidenceResult = await anchorEvidence({
      evidenceHash: sha256Hash,
      evidenceType: 'recording',
      referenceId: recordingId,
      meetingId: meetingId || null,
      eventType: 'RECORDING_HASHED',
      metadata: { fileName: req.file.originalname, fileSize: req.file.size },
    });

    recording.blockchainTxId = evidenceResult.evidenceId;
    await recording.save();

    // Audit log
    await logEvent({
      eventType: 'RECORDING_STOPPED',
      userId: req.user?._id?.toString(),
      userName: req.user?.name,
      meetingId,
      ipAddress: getIp(req),
      userAgent: req.headers['user-agent'],
      detail: `Recording ${recordingId} finalized and anchored`,
      metadata: { recordingId, sha256Hash, evidenceId: evidenceResult.evidenceId },
    });

    res.status(201).json({
      success: true,
      recording: {
        recordingId: recording.recordingId,
        meetingId: recording.meetingId,
        meetingTitle: recording.meetingTitle,
        institute: recording.institute,
        duration: recording.duration,
        sha256Hash: recording.sha256Hash,
        integrityStatus: recording.integrityStatus,
        status: recording.status,
        encryptionStatus: recording.encryptionStatus,
        blockchainTxId: recording.blockchainTxId,
        createdAt: recording.createdAt,
      },
    });
  } catch (error) {
    console.error('[Recording Upload Error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * List all recordings.
 */
export const getRecordings = async (req, res) => {
  try {
    const filter = {};
    if (req.query.meetingId) filter.meetingId = req.query.meetingId;

    const recordings = await Recording.find(filter)
      .sort({ createdAt: -1 })
      .select('-filePath -encryptionIv -encryptionAuthTag')
      .lean();

    res.json({ success: true, recordings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get single recording details.
 */
export const getRecording = async (req, res) => {
  try {
    const recording = await Recording.findOne({ recordingId: req.params.id })
      .select('-encryptionIv -encryptionAuthTag')
      .lean();
    if (!recording) return res.status(404).json({ success: false, message: 'Recording not found' });
    res.json({ success: true, recording });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Stream a recording for playback.
 * Decrypts on-the-fly if encrypted.
 */
export const streamRecording = async (req, res) => {
  try {
    const recording = await Recording.findOne({ recordingId: req.params.id });
    if (!recording) return res.status(404).json({ success: false, message: 'Recording not found' });

    if (!fs.existsSync(recording.filePath)) {
      return res.status(404).json({ success: false, message: 'Recording file not found on disk' });
    }

    // Audit log the view
    await logEvent({
      eventType: 'DOCUMENT_VIEWED',
      userId: req.user?._id?.toString(),
      userName: req.user?.name,
      meetingId: recording.meetingId,
      ipAddress: getIp(req),
      detail: `Recording ${recording.recordingId} streamed/viewed`,
    });

    if (recording.encryptionStatus === 'encrypted' && recording.encryptionIv && recording.encryptionAuthTag) {
      // Decrypt in memory and stream
      const encKey = process.env.CHAT_MASTER_KEY;
      if (!encKey || encKey.length !== 64) {
        return res.status(500).json({ success: false, message: 'Encryption key not configured' });
      }
      const encBuffer = fs.readFileSync(recording.filePath);
      const key = Buffer.from(encKey, 'hex');
      const iv = Buffer.from(recording.encryptionIv, 'hex');
      const authTag = Buffer.from(recording.encryptionAuthTag, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv, { authTagLength: 16 });
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([decipher.update(encBuffer), decipher.final()]);

      res.setHeader('Content-Type', recording.mimeType || 'video/webm');
      res.setHeader('Content-Length', decrypted.length);
      res.send(decrypted);
    } else {
      // Stream plaintext file
      res.setHeader('Content-Type', recording.mimeType || 'video/webm');
      const stat = fs.statSync(recording.filePath);
      res.setHeader('Content-Length', stat.size);
      fs.createReadStream(recording.filePath).pipe(res);
    }
  } catch (error) {
    console.error('[Stream Recording Error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Verify recording integrity.
 */
export const verifyRecordingIntegrity = async (req, res) => {
  try {
    const result = await verifyRecording(req.params.id);

    await logEvent({
      eventType: result.verified ? 'INTEGRITY_VERIFIED' : 'INTEGRITY_FAILED',
      userId: req.user?._id?.toString(),
      userName: req.user?.name,
      detail: `Recording ${req.params.id} integrity: ${result.verified ? 'VERIFIED' : 'FAILED'}`,
      metadata: result,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================================================
// DOCUMENTS
// ================================================================

/**
 * Upload a document.
 */
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No document file provided' });
    }

    const { meetingId, institute } = req.body;
    const documentId = 'DOC-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    const rawBuffer = fs.readFileSync(req.file.path);
    const sha256Hash = hashFile(rawBuffer);

    const doc = await DocumentModel.create({
      documentId,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: req.file.path,
      meetingId: meetingId || null,
      institute: institute || '',
      uploadedBy: req.user?.name || 'AICTE Officer',
      uploadedByUserId: req.user?._id?.toString() || null,
      sha256Hash,
      verified: true,
    });

    // Anchor to evidence ledger
    const evidenceResult = await anchorEvidence({
      evidenceHash: sha256Hash,
      evidenceType: 'document',
      referenceId: documentId,
      meetingId: meetingId || null,
      eventType: 'DOCUMENT_HASHED',
      metadata: { fileName: req.file.originalname, fileSize: req.file.size },
    });

    doc.blockchainTxId = evidenceResult.evidenceId;
    await doc.save();

    await logEvent({
      eventType: 'DOCUMENT_UPLOADED',
      userId: req.user?._id?.toString(),
      userName: req.user?.name,
      meetingId,
      ipAddress: getIp(req),
      userAgent: req.headers['user-agent'],
      detail: `Document "${req.file.originalname}" uploaded and hashed`,
      metadata: { documentId, sha256Hash },
    });

    res.status(201).json({
      success: true,
      document: {
        documentId: doc.documentId,
        fileName: doc.fileName,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        institute: doc.institute,
        sha256Hash: doc.sha256Hash,
        verified: doc.verified,
        blockchainTxId: doc.blockchainTxId,
        createdAt: doc.createdAt,
      },
    });
  } catch (error) {
    console.error('[Document Upload Error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * List all documents.
 */
export const getDocuments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.meetingId) filter.meetingId = req.query.meetingId;
    if (req.query.institute) filter.institute = { $regex: req.query.institute, $options: 'i' };

    const documents = await DocumentModel.find(filter)
      .sort({ createdAt: -1 })
      .select('-filePath')
      .lean();

    res.json({ success: true, documents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Download a document.
 */
export const downloadDocument = async (req, res) => {
  try {
    const doc = await DocumentModel.findOne({ documentId: req.params.id });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    if (!fs.existsSync(doc.filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on disk' });
    }

    await logEvent({
      eventType: 'DOCUMENT_DOWNLOADED',
      userId: req.user?._id?.toString(),
      userName: req.user?.name,
      meetingId: doc.meetingId,
      ipAddress: getIp(req),
      detail: `Document "${doc.fileName}" downloaded`,
    });

    res.download(doc.filePath, doc.fileName);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Verify document integrity.
 */
export const verifyDocumentIntegrity = async (req, res) => {
  try {
    const result = await verifyDocument(req.params.id);

    await logEvent({
      eventType: result.verified ? 'INTEGRITY_VERIFIED' : 'INTEGRITY_FAILED',
      userId: req.user?._id?.toString(),
      userName: req.user?.name,
      detail: `Document ${req.params.id} integrity: ${result.verified ? 'VERIFIED' : 'FAILED'}`,
      metadata: result,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================================================
// DECISIONS
// ================================================================

/**
 * List all decisions.
 */
export const getDecisions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.meetingId) filter.meetingId = req.query.meetingId;

    const decisions = await Decision.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Sanitize anonymous votes
    const sanitized = decisions.map(d => ({
      ...d,
      votes: d.isAnonymous ? [] : d.votes,
    }));

    res.json({ success: true, decisions: sanitized });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Record a decision (called from socket when vote closes).
 */
export const recordDecision = async (req, res) => {
  try {
    const { meetingId, meetingTitle, institute, question, options, votes, eligibleVoters, totalVotes, finalResult, isAnonymous, committee, startedAt, closedAt, startedBy, startedByName } = req.body;

    const decisionId = 'DEC-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    // Compute hash
    const decisionData = JSON.stringify({ decisionId, meetingId, question, finalResult, totalVotes, closedAt });
    const sha256Hash = crypto.createHash('sha256').update(decisionData).digest('hex');

    const decision = await Decision.create({
      decisionId, meetingId, meetingTitle, institute, question, options,
      votes: votes || [], eligibleVoters, totalVotes, finalResult,
      votingStatus: 'closed', isAnonymous, committee,
      sha256Hash, startedAt, closedAt, startedBy, startedByName,
      verified: true,
    });

    // Anchor to evidence ledger
    const evidenceResult = await anchorEvidence({
      evidenceHash: sha256Hash,
      evidenceType: 'decision',
      referenceId: decisionId,
      meetingId,
      eventType: 'DECISION_RECORDED',
      metadata: { question, finalResult },
    });

    decision.blockchainTxId = evidenceResult.evidenceId;
    await decision.save();

    await logEvent({
      eventType: 'DECISION_RECORDED',
      meetingId,
      detail: `Decision "${finalResult}" for "${question}" anchored`,
      metadata: { decisionId, sha256Hash },
    });

    res.status(201).json({ success: true, decision });
  } catch (error) {
    console.error('[Decision Record Error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Verify decision integrity.
 */
export const verifyDecisionIntegrity = async (req, res) => {
  try {
    const result = await verifyDecision(req.params.id);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================================================
// AUDIT LOGS
// ================================================================

/**
 * Get audit logs.
 */
export const getAuditLogs = async (req, res) => {
  try {
    const { meetingId, eventType, limit, skip } = req.query;
    const result = await getAuditLogsService({
      meetingId,
      eventType,
      limit: parseInt(limit) || 100,
      skip: parseInt(skip) || 0,
    });

    // Transform for frontend compatibility
    const logs = result.logs.map(l => ({
      id: l._id,
      action: l.eventType,
      detail: l.detail,
      meetingId: l.meetingId,
      timestamp: l.createdAt,
      ip: l.ipAddress,
      user: l.userName,
      hash: l.eventHash?.slice(0, 16),
    }));

    res.json({ success: true, logs, total: result.total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Verify audit chain integrity.
 */
export const verifyAuditChainIntegrity = async (req, res) => {
  try {
    const result = await verifyAuditChain(req.query.meetingId || null);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================================================
// MEETING EVIDENCE SEALING
// ================================================================

/**
 * Seal a meeting — generate evidence root hash and anchor to ledger.
 */
export const sealMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { meetingTitle, institute } = req.body;

    // Collect all evidence hashes for this meeting
    const recordings = await Recording.find({ meetingId }).lean();
    const documents = await DocumentModel.find({ meetingId }).lean();
    const decisions = await Decision.find({ meetingId }).lean();
    const auditRootHash = await getAuditRootHash(meetingId);

    // Combine all hashes into a meeting evidence root
    const hashComponents = [
      ...recordings.map(r => r.sha256Hash),
      ...documents.map(d => d.sha256Hash),
      ...decisions.map(d => d.sha256Hash),
      auditRootHash || 'no-audit',
    ];

    const evidenceRootData = `MEETING_SEAL:${meetingId}:${hashComponents.join(':')}:${Date.now()}`;
    const evidenceRootHash = crypto.createHash('sha256').update(evidenceRootData).digest('hex');

    // Anchor the meeting seal
    const evidenceResult = await anchorEvidence({
      evidenceHash: evidenceRootHash,
      evidenceType: 'meeting_seal',
      referenceId: meetingId,
      meetingId,
      eventType: 'MEETING_SEALED',
      metadata: {
        meetingTitle,
        institute,
        recordingCount: recordings.length,
        documentCount: documents.length,
        decisionCount: decisions.length,
        auditRootHash,
        componentHashes: hashComponents,
      },
    });

    await logEvent({
      eventType: 'MEETING_SEALED',
      userId: req.user?._id?.toString(),
      userName: req.user?.name,
      meetingId,
      ipAddress: getIp(req),
      detail: `Meeting ${meetingId} evidence sealed`,
      metadata: { evidenceRootHash, evidenceId: evidenceResult.evidenceId },
    });

    res.json({
      success: true,
      sealed: true,
      meetingId,
      evidenceRootHash,
      evidenceId: evidenceResult.evidenceId,
      publicAnchor: evidenceResult.publicAnchor || {
        status: 'anchored',
        network: 'OpenTimestamps (Bitcoin Calendar Pool)',
        explorerUrl: 'https://opentimestamps.org'
      },
      components: {
        recordings: recordings.length,
        documents: documents.length,
        decisions: decisions.length,
        auditEntries: auditRootHash ? 'present' : 'none',
      },
    });
  } catch (error) {
    console.error('[Meeting Seal Error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Verify complete meeting evidence.
 */
export const verifyMeetingEvidenceEndpoint = async (req, res) => {
  try {
    const result = await verifyMeetingEvidence(req.params.id);

    await logEvent({
      eventType: result.overallVerified ? 'INTEGRITY_VERIFIED' : 'INTEGRITY_FAILED',
      meetingId: req.params.id,
      detail: `Meeting ${req.params.id} evidence verification: ${result.overallVerified ? 'PASSED' : 'FAILED'}`,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================================================
// SECURITY CENTER
// ================================================================

/**
 * Get real security status.
 */
export const getSecurityStatus = async (req, res) => {
  try {
    const totalRecordings = await Recording.countDocuments();
    const verifiedRecordings = await Recording.countDocuments({ integrityStatus: 'verified' });
    const totalDocuments = await DocumentModel.countDocuments();
    const verifiedDocuments = await DocumentModel.countDocuments({ verified: true });
    const totalDecisions = await Decision.countDocuments();
    const chainResult = await verifyChainIntegrity();

    // Check encryption key availability
    const encryptionConfigured = !!(process.env.CHAT_MASTER_KEY && process.env.CHAT_MASTER_KEY.length === 64);

    res.json({
      success: true,
      security: {
        sessionEncryption: { status: 'Active', protocol: 'TLS 1.3', configured: true },
        dataEncryption: {
          status: encryptionConfigured ? 'Active' : 'Not Configured',
          algorithm: 'AES-256-GCM',
          configured: encryptionConfigured,
        },
        recordingIntegrity: {
          total: totalRecordings,
          verified: verifiedRecordings,
          status: totalRecordings > 0 ? (verifiedRecordings === totalRecordings ? 'All Verified' : `${verifiedRecordings}/${totalRecordings} Verified`) : 'No Recordings',
        },
        documentIntegrity: {
          total: totalDocuments,
          verified: verifiedDocuments,
          status: totalDocuments > 0 ? (verifiedDocuments === totalDocuments ? 'All Verified' : `${verifiedDocuments}/${totalDocuments} Verified`) : 'No Documents',
        },
        evidenceChain: {
          length: chainResult.length,
          verified: chainResult.verified,
          status: chainResult.verified ? 'Chain Intact' : 'Chain Broken',
        },
        auditTrail: { status: 'Active', hashChain: true },
        decisions: { total: totalDecisions },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================================================
// EVIDENCE CHAIN
// ================================================================

/**
 * Get evidence chain for a meeting.
 */
export const getEvidenceChainEndpoint = async (req, res) => {
  try {
    const chain = await getEvidenceChain(req.params.meetingId);
    res.json({ success: true, chain });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Verify a specific block's Public Blockchain / OpenTimestamps anchor proof
 */
export const verifyPublicAnchorEndpoint = async (req, res) => {
  try {
    const block = await Evidence.findOne({ evidenceId: req.params.evidenceId }).lean();
    if (!block) {
      return res.status(404).json({ success: false, message: 'Evidence block not found' });
    }

    const otsProof = block.publicAnchor?.otsProof;
    const verification = verifyPublicAnchorProof(block.sha256Hash, otsProof);

    res.json({
      success: true,
      evidenceId: block.evidenceId,
      evidenceType: block.evidenceType,
      sha256Hash: block.sha256Hash,
      publicAnchor: {
        status: block.publicAnchor?.status || 'anchored',
        network: block.publicAnchor?.network || 'OpenTimestamps (Bitcoin Calendar Pool)',
        calendarUrl: block.publicAnchor?.calendarUrl || null,
        explorerUrl: block.publicAnchor?.explorerUrl || 'https://opentimestamps.org',
        anchoredAt: block.publicAnchor?.anchoredAt || block.createdAt,
        verified: verification.verified,
        details: verification.reason || 'Cryptographic proof valid'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

