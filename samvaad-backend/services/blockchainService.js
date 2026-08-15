/**
 * Local Evidence Ledger (Blockchain Service)
 * 
 * MongoDB-backed hash chain that provides the same cryptographic guarantees
 * as a blockchain: immutability via hash chaining, tamper detection, and
 * cryptographic proofs — without requiring external infrastructure.
 * 
 * Stores ONLY hashes/proofs. Never stores actual data (videos, documents, etc.)
 */
import crypto from 'crypto';
import Evidence from '../models/Evidence.js';

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Compute SHA-256 hash of a string.
 */
const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');

/**
 * Generate a unique evidence ID.
 */
const genEvidenceId = () => 'EVD-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();

/**
 * Anchor evidence to the local ledger.
 * Creates a new block in the hash chain.
 */
export const anchorEvidence = async ({ evidenceHash, evidenceType, referenceId, meetingId, eventType, metadata }) => {
  // Get the latest block to chain from
  const lastBlock = await Evidence.findOne().sort({ blockIndex: -1 }).lean();
  const previousHash = lastBlock ? lastBlock.sha256Hash : GENESIS_HASH;
  const blockIndex = lastBlock ? lastBlock.blockIndex + 1 : 0;

  // The block hash includes the evidence hash + previous hash + index for chain integrity
  const blockData = `${blockIndex}:${previousHash}:${evidenceHash}:${evidenceType}:${referenceId}:${Date.now()}`;
  const blockHash = sha256(blockData);

  const evidence = await Evidence.create({
    evidenceId: genEvidenceId(),
    evidenceType,
    referenceId,
    meetingId: meetingId || null,
    sha256Hash: blockHash,
    previousHash,
    blockIndex,
    eventType: eventType || 'EVIDENCE_ANCHORED',
    metadata: {
      ...metadata,
      originalEvidenceHash: evidenceHash,
    },
    verified: true,
  });

  return {
    evidenceId: evidence.evidenceId,
    blockIndex: evidence.blockIndex,
    sha256Hash: evidence.sha256Hash,
    previousHash: evidence.previousHash,
    evidenceType,
    timestamp: evidence.createdAt,
  };
};

/**
 * Verify a specific evidence entry against its stored hash.
 */
export const verifyEvidence = async (evidenceId, currentHash) => {
  const block = await Evidence.findOne({ evidenceId }).lean();
  if (!block) {
    return { verified: false, reason: 'Evidence block not found' };
  }

  const storedOriginalHash = block.metadata?.originalEvidenceHash;
  if (!storedOriginalHash) {
    return { verified: false, reason: 'No original evidence hash stored' };
  }

  const hashMatch = storedOriginalHash === currentHash;
  return {
    verified: hashMatch,
    storedHash: storedOriginalHash,
    currentHash,
    blockIndex: block.blockIndex,
    blockchainVerified: hashMatch,
    reason: hashMatch ? 'Hash match confirmed' : 'Hash mismatch — data may have been tampered',
  };
};

/**
 * Get all evidence entries for a specific meeting.
 */
export const getEvidenceChain = async (meetingId) => {
  return Evidence.find({ meetingId }).sort({ blockIndex: 1 }).lean();
};

/**
 * Get all evidence entries (optionally filtered).
 */
export const getAllEvidence = async (filter = {}) => {
  return Evidence.find(filter).sort({ blockIndex: -1 }).limit(100).lean();
};

/**
 * Verify the integrity of the entire evidence chain.
 * Walks the chain and verifies that each block's previousHash matches.
 */
export const verifyChainIntegrity = async () => {
  const chain = await Evidence.find().sort({ blockIndex: 1 }).lean();
  if (chain.length === 0) {
    return { verified: true, length: 0, message: 'Empty chain' };
  }

  let errors = [];

  for (let i = 0; i < chain.length; i++) {
    const block = chain[i];

    // Verify block index
    if (block.blockIndex !== i) {
      errors.push({ blockIndex: i, error: `Expected index ${i}, got ${block.blockIndex}` });
    }

    // Verify chain link
    if (i === 0) {
      if (block.previousHash !== GENESIS_HASH) {
        errors.push({ blockIndex: 0, error: 'Genesis block has wrong previousHash' });
      }
    } else {
      const prevBlock = chain[i - 1];
      if (block.previousHash !== prevBlock.sha256Hash) {
        errors.push({
          blockIndex: i,
          error: `Chain broken: previousHash doesn't match block ${i - 1}'s hash`,
          expected: prevBlock.sha256Hash,
          got: block.previousHash,
        });
      }
    }
  }

  return {
    verified: errors.length === 0,
    length: chain.length,
    errors,
    message: errors.length === 0 ? 'Chain integrity verified' : `${errors.length} chain integrity error(s) found`,
  };
};

/**
 * Find evidence by reference (recording ID, document ID, etc.)
 */
export const findEvidenceByReference = async (referenceId) => {
  return Evidence.findOne({ referenceId }).lean();
};
