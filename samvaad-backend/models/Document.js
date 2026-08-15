import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  documentId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    default: 'application/pdf',
  },
  fileSize: {
    type: Number, // bytes
    default: 0,
  },
  filePath: {
    type: String,
    required: true,
  },
  meetingId: {
    type: String,
    default: null,
    index: true,
  },
  institute: {
    type: String,
    default: '',
  },
  uploadedBy: {
    type: String,
    default: 'AICTE Officer',
  },
  uploadedByUserId: {
    type: String,
    default: null,
  },
  // Integrity
  sha256Hash: {
    type: String,
    required: true,
  },
  encryptionStatus: {
    type: String,
    enum: ['encrypted', 'plaintext'],
    default: 'plaintext',
  },
  verified: {
    type: Boolean,
    default: false,
  },
  // Evidence ledger
  blockchainTxId: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

const Document = mongoose.model('Document', documentSchema);
export default Document;
