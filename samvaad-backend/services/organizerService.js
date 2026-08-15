import crypto from 'crypto';
import Event from '../models/Event.js';
import Team from '../models/Team.js';
import EventParticipant from '../models/EventParticipant.js';

/**
 * Core shared utility: Build a unified, annotated participant view.
 * Used by both getEventParticipants and exportEventParticipants.
 *
 * @param {string} eventId      - The event ID to query
 * @param {string} requesterId  - The organizer's user ID (ownership check)
 * @param {object} filters      - { type, college, year, section, teamType, attendanceFilter }
 * @returns {{ event, participants, totals }}
 */
export async function buildParticipantView(eventId, requesterId, filters = {}) {
    const { type = 'all', college, year, section, teamType, attendanceFilter = 'all' } = filters;

    // ─── 1. Ownership Check FIRST (Multi-tenant RBAC) ─────────────────────────
    const event = await Event.findById(eventId)
        .populate('organizer', 'name username college');

    if (!event) {
        const err = new Error('Event not found');
        err.statusCode = 404;
        throw err;
    }

    if (!event.organizer._id.equals(requesterId)) {
        const err = new Error('Unauthorized: You do not own this event.');
        err.statusCode = 403;
        throw err;
    }

    // ─── 2. Fetch Teams for this Event (lean, safe field selection) ────────────
    const teams = await Team.find({ eventId: event._id })
        .populate('members', 'name email username college year section className collegeId collegeVerified')
        .select('name members isAutoCreated')
        .lean();

    // Build a Set of all user IDs in at least one team
    const teamMemberMap = new Map(); // userId → team info
    for (const team of teams) {
        for (const member of team.members) {
            teamMemberMap.set(member._id.toString(), team);
        }
    }

    // ─── 3. Fetch Solo Attendees (not in any team) ──────────────────────────────
    const eventWithAttendees = await Event.findById(eventId)
        .populate('attendees', 'name email username college year section className collegeId collegeVerified')
        .lean();

    const allAttendees = eventWithAttendees.attendees || [];

    // ─── 4. Fetch Attendance Records — bulk O(1) map lookup ────────────────────
    const attendanceRecords = await EventParticipant.find({ eventId })
        .select('userId attended attendedAt')
        .lean();

    const attendanceMap = new Map(); // userId → { attended, attendedAt }
    for (const rec of attendanceRecords) {
        attendanceMap.set(rec.userId.toString(), {
            attended: rec.attended,
            attendedAt: rec.attendedAt
        });
    }

    // ─── 5. Build Unified Participant List ─────────────────────────────────────
    const participants = [];

    for (const attendee of allAttendees) {
        const uid = attendee._id.toString();
        const team = teamMemberMap.get(uid);
        const attendance = attendanceMap.get(uid) || { attended: false, attendedAt: null };

        let registrationType;
        let teamInfo = null;

        if (team) {
            registrationType = team.isAutoCreated ? 'auto' : 'pre';
            teamInfo = { teamId: team._id, teamName: team.name };
        } else {
            registrationType = 'solo';
        }

        participants.push({
            user: attendee,
            registrationType,
            teamInfo,
            attended: attendance.attended,
            attendedAt: attendance.attendedAt
        });
    }

    // ─── 6. Apply Server-Side Type Filtering ────────────────────────────────────
    let filtered = participants;

    if (type && type !== 'all') {
        filtered = filtered.filter(p => p.registrationType === type);
    }

    // teamType alias (for export endpoint compatibility)
    if (teamType && teamType !== 'all') {
        filtered = filtered.filter(p => p.registrationType === teamType);
    }

    // Academic field filters
    if (college) {
        filtered = filtered.filter(p =>
            p.user.college && p.user.college.toLowerCase().includes(college.toLowerCase())
        );
    }
    if (year) {
        filtered = filtered.filter(p => p.user.year === year);
    }
    if (section) {
        filtered = filtered.filter(p => p.user.section === section);
    }

    // Attendance filter (used by export)
    if (attendanceFilter === 'attended') {
        filtered = filtered.filter(p => p.attended === true);
    } else if (attendanceFilter === 'notAttended') {
        filtered = filtered.filter(p => p.attended !== true);
    }

    // ─── 7. Compute Summary Totals ─────────────────────────────────────────────
    const totals = {
        total: participants.length,
        solo: participants.filter(p => p.registrationType === 'solo').length,
        auto: participants.filter(p => p.registrationType === 'auto').length,
        pre: participants.filter(p => p.registrationType === 'pre').length,
        teams: teams.length,
        attended: participants.filter(p => p.attended === true).length
    };

    return { event, participants: filtered, totals };
}

/**
 * Generates a deterministic certificate ID for authenticity verification.
 * Uses SHA256(userId + eventId + timestamp) — reproducible, not random.
 */
export function generateCertId(userId, eventId, timestamp) {
    return crypto
        .createHash('sha256')
        .update(`${userId}${eventId}${timestamp}`)
        .digest('hex')
        .slice(0, 16)
        .toUpperCase();
}
