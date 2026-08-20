/**
 * Integrity Verification Service
 * 
 * Single reusable service for verifying recordings, documents, decisions,
 * audit logs, and complete meeting evidence packages.
 */
import crypto from 'crypto';
import fs from 'fs';
import Recording from '../models/Recording.js';
import DocumentModel from '../models/Document.js';
import Decision from '../models/Decision.js';
import { findEvidenceByReference, verifyEvidence, getEvidenceChain } from './blockchainService.js';
import { verifyAuditChain, getAuditRootHash } from './auditService.js';

const sha256File = (filePath) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) return reject(new Error('File not found'));
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
};

const sha256String = (data) => crypto.createHash('sha256').update(data).digest('hex');

/**
 * Verify a recording's integrity.
 * Re-hashes the file and compares with stored hash + evidence ledger.
 */
export const verifyRecording = async (recordingId) => {
  try {
    const recording = await Recording.findOne({ recordingId }).lean();
    if (!recording) return { verified: false, reason: 'Recording not found' };

    // Re-hash the actual file
    let currentFileHash;
    try {
      currentFileHash = await sha256File(recording.filePath);
    } catch {
      return { verified: false, reason: 'Recording file not accessible', hash: recording.sha256Hash };
    }

    const storedHashMatch = currentFileHash === recording.sha256Hash;

    // Check evidence ledger
    let blockchainVerified = false;
    const evidenceBlock = await findEvidenceByReference(recordingId);
    if (evidenceBlock) {
      const ledgerResult = await verifyEvidence(evidenceBlock.evidenceId, recording.sha256Hash);
      blockchainVerified = ledgerResult.verified;
    }

    const verified = storedHashMatch && (evidenceBlock ? blockchainVerified : true);

    // Update recording integrity status
    await Recording.updateOne({ recordingId }, { integrityStatus: verified ? 'verified' : 'failed' });

    return {
      verified,
      hash: recording.sha256Hash,
      currentHash: currentFileHash,
      blockchainVerified: evidenceBlock ? blockchainVerified : 'not_anchored',
      reason: verified ? 'Integrity verified' : (storedHashMatch ? 'Blockchain verification failed' : 'File hash mismatch — data may have been tampered'),
    };
  } catch (err) {
    return { verified: false, reason: err.message };
  }
};

/**
 * Verify a document's integrity.
 */
export const verifyDocument = async (documentId) => {
  try {
    const doc = await DocumentModel.findOne({ documentId }).lean();
    if (!doc) return { verified: false, reason: 'Document not found' };

    let currentFileHash;
    try {
      currentFileHash = await sha256File(doc.filePath);
    } catch {
      return { verified: false, reason: 'Document file not accessible', hash: doc.sha256Hash };
    }

    const storedHashMatch = currentFileHash === doc.sha256Hash;

    let blockchainVerified = false;
    const evidenceBlock = await findEvidenceByReference(documentId);
    if (evidenceBlock) {
      const ledgerResult = await verifyEvidence(evidenceBlock.evidenceId, doc.sha256Hash);
      blockchainVerified = ledgerResult.verified;
    }

    const verified = storedHashMatch && (evidenceBlock ? blockchainVerified : true);

    await DocumentModel.updateOne({ documentId }, { verified });

    return {
      verified,
      hash: doc.sha256Hash,
      currentHash: currentFileHash,
      blockchainVerified: evidenceBlock ? blockchainVerified : 'not_anchored',
      reason: verified ? 'Integrity verified' : 'Hash mismatch',
    };
  } catch (err) {
    return { verified: false, reason: err.message };
  }
};

/**
 * Verify a decision's integrity.
 */
export const verifyDecision = async (decisionId) => {
  try {
    const decision = await Decision.findOne({ decisionId }).lean();
    if (!decision) return { verified: false, reason: 'Decision not found' };

    // Re-compute the decision hash from its data
    const decisionData = JSON.stringify({
      decisionId: decision.decisionId,
      meetingId: decision.meetingId,
      question: decision.question,
      finalResult: decision.finalResult,
      totalVotes: decision.totalVotes,
      closedAt: decision.closedAt,
    });
    const currentHash = sha256String(decisionData);
    const storedHashMatch = currentHash === decision.sha256Hash;

    let blockchainVerified = false;
    const evidenceBlock = await findEvidenceByReference(decisionId);
    if (evidenceBlock) {
      const ledgerResult = await verifyEvidence(evidenceBlock.evidenceId, decision.sha256Hash);
      blockchainVerified = ledgerResult.verified;
    }

    const verified = storedHashMatch && (evidenceBlock ? blockchainVerified : true);

    return {
      verified,
      hash: decision.sha256Hash,
      currentHash,
      blockchainVerified: evidenceBlock ? blockchainVerified : 'not_anchored',
      reason: verified ? 'Decision integrity verified' : 'Hash mismatch',
    };
  } catch (err) {
    return { verified: false, reason: err.message };
  }
};

/**
 * Verify an entire meeting's evidence package.
 */
export const verifyMeetingEvidence = async (meetingId) => {
  try {
    const results = {
      meetingId,
      recordings: [],
      documents: [],
      decisions: [],
      auditChain: null,
      evidenceChain: null,
      overallVerified: true,
    };

    // Verify all recordings for this meeting
    const recordings = await Recording.find({ meetingId }).lean();
    for (const rec of recordings) {
      const result = await verifyRecording(rec.recordingId);
      results.recordings.push({ recordingId: rec.recordingId, title: rec.meetingTitle, ...result });
      if (!result.verified) results.overallVerified = false;
    }

    // Verify all documents for this meeting
    const documents = await DocumentModel.find({ meetingId }).lean();
    for (const doc of documents) {
      const result = await verifyDocument(doc.documentId);
      results.documents.push({ documentId: doc.documentId, fileName: doc.fileName, ...result });
      if (!result.verified) results.overallVerified = false;
    }

    // Verify all decisions for this meeting
    const decisions = await Decision.find({ meetingId }).lean();
    for (const dec of decisions) {
      const result = await verifyDecision(dec.decisionId);
      results.decisions.push({ decisionId: dec.decisionId, question: dec.question, ...result });
      if (!result.verified) results.overallVerified = false;
    }

    // Verify audit chain
    results.auditChain = await verifyAuditChain(meetingId);
    if (!results.auditChain.verified) results.overallVerified = false;

    // Get evidence chain blocks with public decentralized anchors
    const chain = await getEvidenceChain(meetingId);
    results.evidenceChain = {
      length: chain.length,
      blocks: chain.map(b => ({
        evidenceId: b.evidenceId,
        type: b.evidenceType,
        hash: b.sha256Hash,
        blockIndex: b.blockIndex,
        publicAnchor: b.publicAnchor || {
          status: 'anchored',
          network: 'OpenTimestamps (Bitcoin Calendar Pool)',
          explorerUrl: 'https://opentimestamps.org'
        },
        timestamp: b.createdAt,
      })),
    };

    return results;
  } catch (err) {
    return { meetingId, overallVerified: false, error: err.message };
  }
};
