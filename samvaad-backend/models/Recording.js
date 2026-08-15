import mongoose from 'mongoose';

const recordingSchema = new mongoose.Schema({
  recordingId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  meetingId: {
    type: String,
    required: true,
    index: true,
  },
  meetingTitle: {
    type: String,
    default: 'AICTE Meeting',
  },
  institute: {
    type: String,
    default: '',
  },
  hostId: {
    type: String,
    required: true,
  },
  hostName: {
    type: String,
    default: 'Host',
  },
  participants: [{
    userId: String,
    name: String,
    role: String,
  }],
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
  },
  duration: {
    type: Number, // seconds
    default: 0,
  },
  filePath: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number, // bytes
    default: 0,
  },
  mimeType: {
    type: String,
    default: 'video/webm',
  },
  // Encryption
  encryptionStatus: {
    type: String,
    enum: ['encrypted', 'plaintext', 'failed'],
    default: 'encrypted',
  },
  encryptionIv: String,
  encryptionAuthTag: String,
  // Integrity
  sha256Hash: {
    type: String,
    required: true,
  },
  integrityStatus: {
    type: String,
    enum: ['verified', 'pending', 'failed'],
    default: 'pending',
  },
  // Blockchain / Evidence Ledger
  blockchainTxId: {
    type: String,
    default: null,
  },
  // Processing
  status: {
    type: String,
    enum: ['recording', 'processing', 'processed', 'failed'],
    default: 'processing',
  },
}, {
  timestamps: true,
});

const Recording = mongoose.model('Recording', recordingSchema);
export default Recording;
