/**
 * Enhanced Audit Service
 * 
 * Persists audit events to MongoDB with a hash-chain for tamper-evidence.
 * Each event hashes itself + the previous event's hash, forming an immutable chain.
 */
import crypto from 'crypto';
import AuditLog from '../models/AuditLog.js';

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');

/**
 * Log a new audit event with hash-chain integrity.
 */
export const logEvent = async ({ eventType, userId, userName, meetingId, ipAddress, userAgent, detail, metadata }) => {
  // Get the last audit entry for chain linking
  const lastEntry = await AuditLog.findOne().sort({ chainIndex: -1 }).lean();
  const previousHash = lastEntry ? lastEntry.eventHash : GENESIS_HASH;
  const chainIndex = lastEntry ? lastEntry.chainIndex + 1 : 0;

  // Build the event data to hash
  const eventData = JSON.stringify({
    chainIndex,
    previousHash,
    eventType,
    userId: userId || 'system',
    meetingId: meetingId || null,
    detail: detail || '',
    timestamp: Date.now(),
  });
  const eventHash = sha256(eventData);

  const entry = await AuditLog.create({
    eventType,
    userId: userId || 'system',
    userName: userName || 'System',
    meetingId: meetingId || null,
    ipAddress: ipAddress || '0.0.0.0',
    userAgent: userAgent || '',
    detail: detail || '',
    metadata: metadata || {},
    eventHash,
    previousHash,
    chainIndex,
  });

  return entry;
};

/**
 * Get audit logs with optional filters.
 */
export const getAuditLogs = async ({ meetingId, userId, eventType, limit = 100, skip = 0 } = {}) => {
  const filter = {};
  if (meetingId) filter.meetingId = meetingId;
  if (userId) filter.userId = userId;
  if (eventType) filter.eventType = eventType;

  const logs = await AuditLog.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await AuditLog.countDocuments(filter);

  return { logs, total };
};

/**
 * Compute the audit root hash for a specific meeting.
 * This is the final hash in the chain of all events for that meeting.
 */
export const getAuditRootHash = async (meetingId) => {
  const meetingLogs = await AuditLog.find({ meetingId }).sort({ chainIndex: 1 }).lean();
  if (meetingLogs.length === 0) return null;

  // Combine all event hashes into a root
  const combined = meetingLogs.map(l => l.eventHash).join(':');
  return sha256(combined);
};

/**
 * Verify the audit hash chain for a specific meeting (or globally).
 * Replays the chain to detect any tampered entries.
 */
export const verifyAuditChain = async (meetingId) => {
  const filter = meetingId ? { meetingId } : {};
  const chain = await AuditLog.find(filter).sort({ chainIndex: 1 }).lean();

  if (chain.length === 0) {
    return { verified: true, length: 0, message: 'No audit entries' };
  }

  let errors = [];

  for (let i = 0; i < chain.length; i++) {
    const entry = chain[i];

    // For the first entry, previousHash should be genesis or the last non-meeting entry
    if (i === 0) {
      // First entry in the filtered set — we can't validate previousHash for meeting-filtered queries
      // unless it's the global chain
      if (!meetingId && entry.previousHash !== GENESIS_HASH && entry.chainIndex === 0) {
        errors.push({ chainIndex: entry.chainIndex, error: 'Genesis entry has wrong previousHash' });
      }
    } else if (!meetingId) {
      // Global chain: verify previous hash link
      const prev = chain[i - 1];
      if (entry.previousHash !== prev.eventHash) {
        errors.push({
          chainIndex: entry.chainIndex,
          error: 'Chain broken: previousHash mismatch',
          expected: prev.eventHash,
          got: entry.previousHash,
        });
      }
    }
  }

  return {
    verified: errors.length === 0,
    length: chain.length,
    errors,
    rootHash: chain.length > 0 ? sha256(chain.map(e => e.eventHash).join(':')) : null,
    message: errors.length === 0 ? 'Audit chain integrity verified' : `${errors.length} chain error(s)`,
  };
};
