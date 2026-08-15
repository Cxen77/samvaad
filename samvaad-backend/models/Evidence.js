import mongoose from 'mongoose';

const evidenceSchema = new mongoose.Schema({
  evidenceId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  evidenceType: {
    type: String,
    required: true,
    enum: ['recording', 'document', 'decision', 'audit_root', 'meeting_seal'],
    index: true,
  },
  referenceId: {
    type: String,
    required: true,
  },
  meetingId: {
    type: String,
    index: true,
  },
  sha256Hash: {
    type: String,
    required: true,
  },
  previousHash: {
    type: String,
    default: '0000000000000000000000000000000000000000000000000000000000000000',
  },
  blockIndex: {
    type: Number,
    required: true,
    index: true,
  },
  eventType: {
    type: String,
    default: 'EVIDENCE_ANCHORED',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  verified: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Compound index for chain queries
evidenceSchema.index({ blockIndex: 1, createdAt: 1 });

const Evidence = mongoose.model('Evidence', evidenceSchema);
export default Evidence;
