import crypto from 'crypto';

// In-memory store for meetings
const meetings = new Map();

// Helper to generate SHA-256 hash
const generateHash = (data) => {
    return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Check if a meeting exists and if its status is ENDED
 */
export const getMeetingStatus = (roomId) => {
    const meeting = meetings.get(roomId);
    return meeting ? meeting.status : null;
};

import Chat from '../models/Chat.js';
import { generateMeetingKey, wrapMeetingKey } from '../services/encryptionService.js';
import { logChatEvent } from '../services/chatAuditService.js';

// Helper for case-insensitive and clean room ID lookup
const findMeeting = (id) => {
    if (!id) return null;
    let clean = id.trim();
    // Extract roomId if full URL was passed
    if (clean.includes('/waiting-room/')) {
        clean = clean.split('/waiting-room/')[1];
    } else if (clean.includes('/room/')) {
        clean = clean.split('/room/')[1];
    }
    clean = clean.split('?')[0].split('#')[0].trim().toUpperCase();

    for (const [key, val] of meetings.entries()) {
        if (
            key.toUpperCase() === clean || 
            val.id?.toUpperCase() === clean || 
            val.roomId?.toUpperCase() === clean
        ) {
            return val;
        }
    }
    return null;
};

export const createMeeting = async (req, res) => {
    try {
        const { 
            roomId: customId, 
            title, 
            institute, 
            password, 
            securityLevel, 
            date, 
            startTime, 
            endTime, 
            timeZone,
            members, 
            isInstant,
            meetingType,
            waitingRoom,
            allowJoinBeforeHost,
            lockAfterStart,
            participantPermissions,
            aiFeatures,
            aicteFeatures,
            committee,
            documents
        } = req.body;

        const roomId = customId ? customId.trim().toUpperCase() : ('AICTE-' + new Date().getFullYear() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase());
        // Only set a password if explicitly provided and non-empty
        const meetingPassword = (password && typeof password === 'string' && password.trim().length > 0) ? password.trim() : '';
        const hostId = req.user?._id ? req.user._id.toString() : 'host-user';

        const newMeeting = {
            roomId,
            id: roomId,
            title: title || 'AICTE Committee Hearing',
            institute: institute || 'AICTE Institution',
            password: meetingPassword,
            securityLevel: securityLevel || 'Confidential',
            date: date || new Date().toISOString().split('T')[0],
            startTime: startTime || '10:30',
            endTime: endTime || '12:00',
            timeZone: timeZone || 'IST (UTC+05:30)',
            meetingType: meetingType || 'Standard Meeting',
            hostId,
            members: members || [],
            status: isInstant ? 'LIVE' : 'SCHEDULED',
            waitingRoom: waitingRoom ?? false,
            allowJoinBeforeHost: allowJoinBeforeHost ?? false,
            lockAfterStart: lockAfterStart ?? false,
            participantPermissions: participantPermissions || {
                screenShare: true,
                chat: true,
                microphone: true,
                camera: true,
                reactions: true
            },
            aiFeatures: aiFeatures || {
                liveTranscription: true,
                aiSummary: true,
                actionItemDetection: true,
                decisionExtraction: true
            },
            aicteFeatures: aicteFeatures || {
                committeeVoting: true,
                documentReview: true,
                liveTranscript: true,
                aiSummary: true,
                evidenceRecording: true,
                cryptographicSeal: true,
                blockchainAnchoring: false
            },
            committee: committee || {
                votingEnabled: true,
                votingType: 'Approve / Reject'
            },
            documents: documents || [],
            votes: [],
            attendance: [],
            blockchainLogs: [],
            createdAt: new Date().toISOString()
        };
        
        meetings.set(roomId, newMeeting);

        // Auto-initialize meeting chat if user is authenticated
        if (req.user?._id) {
            try {
                let existingChat = await Chat.findOne({ meetingId: roomId, chatType: 'meeting' });
                if (!existingChat) {
                    const memberUserIds = (members || []).map(m => m._id || m.id).filter(Boolean);
                    const chatParticipants = [...new Set([req.user._id.toString(), ...memberUserIds])];
                    const meetingKey = generateMeetingKey();
                    const wrappedKey = wrapMeetingKey(meetingKey);

                    const createdChat = await Chat.create({
                        chatName: title || `Meeting: ${roomId}`,
                        isGroupChat: true,
                        chatType: 'meeting',
                        meetingId: roomId,
                        isEncrypted: true,
                        ...wrappedKey,
                        chatKeyVersion: 1,
                        groupAdmin: req.user._id,
                        participants: chatParticipants,
                        unreadCounts: chatParticipants.reduce((acc, uid) => ({ ...acc, [uid]: 0 }), {})
                    });

                    logChatEvent('MEETING_CHAT_KEY_CREATED', {
                        meetingId: roomId,
                        chatId: createdChat._id,
                        userId: req.user._id,
                        metadata: { keyVersion: 1 }
                    });
                }
            } catch (chatErr) {
                console.warn('[Meeting Creation] Chat init note:', chatErr.message);
            }
        }
        
        res.status(201).json({ success: true, meeting: newMeeting });
    } catch (error) {
        console.error('Error creating meeting:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const getMeeting = async (req, res) => {
    try {
        const { roomId } = req.params;
        const meeting = findMeeting(roomId);
        
        if (!meeting) {
            return res.status(404).json({ success: false, message: 'Meeting not found' });
        }
        
        res.status(200).json({ success: true, meeting });
    } catch (error) {
        console.error('Error fetching meeting:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const joinMeeting = async (req, res) => {
    try {
        const { roomId, password } = req.body;
        if (!roomId) {
            return res.status(400).json({ success: false, message: 'Meeting ID is required' });
        }

        const meeting = findMeeting(roomId);

        // 1. Check if meeting exists
        if (!meeting) {
            return res.status(404).json({ success: false, message: 'Meeting not found. Please check Meeting ID.' });
        }

        // 2. Check if meeting has ended
        if (meeting.status === 'ENDED' || meeting.status === 'completed') {
            return res.status(403).json({ success: false, message: 'This meeting has ended.' });
        }

        // 3. Password check ONLY if meeting actually configured a password
        if (meeting.password && meeting.password.trim().length > 0) {
            if (!password || password.trim() !== meeting.password.trim()) {
                return res.status(401).json({ success: false, message: 'Incorrect meeting passcode' });
            }
        }

        // Mark status as LIVE when user/host joins
        if (meeting.status === 'SCHEDULED') {
            meeting.status = 'LIVE';
        }

        res.status(200).json({ success: true, meeting });
    } catch (error) {
        console.error('Error joining meeting:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const endMeeting = async (req, res) => {
    try {
        const { roomId } = req.params;
        const meeting = meetings.get(roomId);

        if (!meeting) {
            return res.status(404).json({ success: false, message: 'Meeting not found' });
        }

        meeting.status = 'ENDED';
        meeting.endedAt = new Date().toISOString();

        res.status(200).json({ success: true, message: 'Meeting ended successfully', meeting });
    } catch (error) {
        console.error('Error ending meeting:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const getInstituteDossier = async (req, res) => {
    try {
        const { id } = req.params;
        // Mock data for MVP
        const dossier = {
            id,
            name: "Global Institute of Technology",
            nirfRank: 42,
            type: "Engineering",
            documents: [
                { id: 'doc1', title: 'Land & Infrastructure Proof', type: 'pdf' },
                { id: 'doc2', title: 'Financial Audit 2025', type: 'pdf' },
                { id: 'doc3', title: 'Faculty List', type: 'csv' }
            ],
            financials: {
                totalFunds: "₹ 50,00,000",
                expenditure: "₹ 42,00,000",
                status: "Clear"
            },
            approvalHistory: [
                { year: 2024, status: 'Approved', remarks: 'No issues found' },
                { year: 2023, status: 'Approved', remarks: 'Minor infrastructure upgrade recommended' }
            ]
        };
        
        res.status(200).json({ success: true, dossier });
    } catch (error) {
        console.error('Error fetching dossier:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const stampBlockchain = async (req, res) => {
    try {
        const { roomId, type, data } = req.body;
        
        const meeting = meetings.get(roomId);
        if (!meeting) {
            return res.status(404).json({ success: false, message: 'Meeting not found' });
        }
        
        // Simulate Blockchain interaction
        const txHash = '0x' + crypto.randomBytes(32).toString('hex');
        const blockNumber = Math.floor(Math.random() * 1000000) + 15000000;
        const dataHash = generateHash(JSON.stringify(data));
        
        const logEntry = {
            type,
            txHash,
            blockNumber,
            dataHash,
            timestamp: new Date().toISOString()
        };
        
        meeting.blockchainLogs.push(logEntry);
        
        res.status(200).json({ success: true, logEntry });
    } catch (error) {
        console.error('Error stamping blockchain:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const recordVote = async (req, res) => {
    try {
         const { roomId, decision, memberId, signature } = req.body;
         const meeting = meetings.get(roomId);
         if (!meeting) {
            return res.status(404).json({ success: false, message: 'Meeting not found' });
         }

         const vote = {
             memberId,
             decision,
             signature,
             timestamp: new Date().toISOString()
         };

         meeting.votes.push(vote);

         res.status(200).json({ success: true, vote });
    } catch (error) {
        console.error('Error recording vote:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
