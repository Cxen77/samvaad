import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    index: true,
    enum: [
      'USER_LOGIN', 'USER_LOGOUT',
      'MEETING_CREATED', 'MEETING_STARTED', 'MEETING_ENDED', 'MEETING_SEALED',
      'USER_JOINED', 'USER_LEFT',
      'RECORDING_STARTED', 'RECORDING_STOPPED',
      'DOCUMENT_UPLOADED', 'DOCUMENT_VIEWED', 'DOCUMENT_DOWNLOADED',
      'VOTE_STARTED', 'VOTE_CAST', 'VOTE_CLOSED',
      'RECORDING_HASHED', 'DOCUMENT_HASHED',
      'BLOCKCHAIN_ANCHORED',
      'INTEGRITY_VERIFIED', 'INTEGRITY_FAILED',
      'DECISION_RECORDED',
      'SECURITY_EVENT',
    ],
  },
  userId: {
    type: String,
    default: 'system',
  },
  userName: {
    type: String,
    default: 'System',
  },
  meetingId: {
    type: String,
    default: null,
    index: true,
  },
  ipAddress: {
    type: String,
    default: '0.0.0.0',
  },
  userAgent: {
    type: String,
    default: '',
  },
  detail: {
    type: String,
    default: '',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  // Hash chain fields
  eventHash: {
    type: String,
    required: true,
  },
  previousHash: {
    type: String,
    default: '0000000000000000000000000000000000000000000000000000000000000000',
  },
  chainIndex: {
    type: Number,
    required: true,
    index: true,
  },
}, {
  timestamps: true,
});

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ meetingId: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
