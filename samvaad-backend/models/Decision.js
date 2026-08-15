import mongoose from 'mongoose';

const decisionSchema = new mongoose.Schema({
  decisionId: {
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
    default: 'Committee Decision',
  },
  institute: {
    type: String,
    default: '',
  },
  question: {
    type: String,
    required: true,
  },
  options: [{
    type: String,
  }],
  votes: [{
    odactiveRoomParticipantsuserId: String,
    odactiveRoomParticipantsuserId: String,
    userName: String,
    option: String,
    timestamp: Date,
  }],
  eligibleVoters: {
    type: Number,
    default: 0,
  },
  totalVotes: {
    type: Number,
    default: 0,
  },
  finalResult: {
    type: String,
    default: '',
  },
  votingStatus: {
    type: String,
    enum: ['open', 'closed', 'sealed'],
    default: 'closed',
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  committee: [{
    type: String,
  }],
  // Integrity
  sha256Hash: {
    type: String,
    default: null,
  },
  blockchainTxId: {
    type: String,
    default: null,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  startedAt: Date,
  closedAt: Date,
  startedBy: String,
  startedByName: String,
}, {
  timestamps: true,
});

const Decision = mongoose.model('Decision', decisionSchema);
export default Decision;
