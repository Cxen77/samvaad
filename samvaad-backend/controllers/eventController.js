import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Event from '../models/Event.js';
import EventParticipant from '../models/EventParticipant.js';
import cloudinary from '../config/cloudinary.js';
import stream from 'stream';

// ─── QR Signing Helpers ────────────────────────────────────────────────────
const QR_VALIDITY_MS = 5 * 60 * 1000; // 5 minutes

function signQRPayload(eventId, userId, ts) {
    const data = `${eventId}:${userId}:${ts}`;
    return crypto
        .createHmac('sha256', process.env.JWT_SECRET)
        .update(data)
        .digest('hex');
}

export function verifyQRPayload(payload) {
    const { eventId, userId, ts, sig } = payload;
    if (!eventId || !userId || !ts || !sig) return false;
    // Check 5-minute validity window
    if (Date.now() - Number(ts) > QR_VALIDITY_MS) return false;
    const expected = signQRPayload(eventId, userId, ts);
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
}

// @desc    Create a new event
// @route   POST /api/events
// @access  Private (gated by requireFeature('events') middleware)
const createEvent = asyncHandler(async (req, res) => {

    // Security: only organizers, admins, and moderators can create events
    const allowedRoles = ['organizer', 'admin', 'moderator'];
    if (!allowedRoles.includes(req.user.role)) {
        res.status(403);
        throw new Error('Only organizers, admins, and moderators can create events');
    }

    const { title, description, date, location, category, prize, imageUrl, maxTeamSize, isMultiCollege, allowTeamRegistration, requireUSN } = req.body;

    const eventParams = {
        title,
        description,
        date,
        location,
        category,
        prize,
        imageUrl,
        maxTeamSize: maxTeamSize || 4,
        isMultiCollege: isMultiCollege !== undefined ? isMultiCollege : true,
        allowTeamRegistration: allowTeamRegistration || false,
        requireUSN: requireUSN || false,
        organizer: req.user._id,
        attendees: [req.user._id]
    };

    // Auto-set collegeId for organizers based on their own profile
    if (req.user.role === 'organizer') {
        eventParams.collegeId = req.user.collegeId;
    } else if (req.body.collegeId) {
        eventParams.collegeId = req.body.collegeId;
    }

    // Handle Image Upload if file is provided
    if (req.file) {
        const uploadToCloudinary = () => {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: 'synapse_events', resource_type: 'image' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                const bufferStream = new stream.PassThrough();
                bufferStream.end(req.file.buffer);
                bufferStream.pipe(uploadStream);
            });
        };

        try {
            const result = await uploadToCloudinary();
            eventParams.imageUrl = result.secure_url;
        } catch (uploadError) {
            console.error('Cloudinary upload error (event):', uploadError);
            res.status(500);
            throw new Error('Failed to upload image. Please try again.');
        }
    }

    const event = await Event.create(eventParams);

    res.status(201).json(event);
});

// @desc    Get all events
// @route   GET /api/events
// @access  Private
const getEvents = asyncHandler(async (req, res) => {
    const pageSize = Math.min(Number(req.query.limit) || 20, 100);
    const page = Number(req.query.pageNumber) || 1;

    const filter = { isApproved: true, isDeleted: { $ne: true } };

    // ?joined=true — only events the current user has joined (for QR picker)
    if (req.query.joined === 'true') {
        filter.attendees = req.user._id;
    }

    // ?organizerId=... — only events organized by a specific user (for Attach to Post)
    // Note: No isApproved filter here — organizers can attach their own pending events too
    if (req.query.organizerId) {
        filter.organizer = req.query.organizerId;
        delete filter.isApproved; // Remove approval requirement for their own events
    }

    const count = await Event.countDocuments(filter);
    const events = await Event.find(filter)
        .populate('organizer', 'name username profilePic')
        .sort({ date: 1 })
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .lean();

    res.json({ events, page, pages: Math.ceil(count / pageSize) });
});

// @desc    Join an event
// @route   PUT /api/events/:id/join
// @access  Private
const joinEvent = asyncHandler(async (req, res) => {
    // 1. First, check if event exists and handle cross-college restriction
    const event = await Event.findById(req.params.id);
    if (!event) {
        res.status(404);
        throw new Error('Event not found');
    }

    if (!event.isMultiCollege && event.collegeId) {
        if (!req.user.collegeId || event.collegeId.toString() !== req.user.collegeId.toString()) {
            res.status(403);
            throw new Error('This event is restricted to students from the host college only.');
        }
    }

    // USN gate: if the organizer made USN compulsory, require it on the user profile
    if (event.requireUSN && !req.user.usn) {
        res.status(422);
        const err = new Error('This event requires your USN. Please add it to your profile and try again.');
        err.code = 'USN_REQUIRED';
        throw err;
    }

    // 2. Perform ATOMIC join using $addToSet (prevents duplicates and race conditions)
    // This is more scalable than transactions for simple array updates
    const updatedEvent = await Event.findOneAndUpdate(
        { _id: req.params.id, attendees: { $ne: req.user._id } },
        { $addToSet: { attendees: req.user._id } },
        { new: true }
    );

    if (!updatedEvent) {
        // If findOneAndUpdate returns null, user was likely already in the array
        res.status(400);
        throw new Error('User already attending');
    }

    // 3. Ensure EventParticipant record exists (idempotent upsert)
    await EventParticipant.findOneAndUpdate(
        { eventId: event._id, userId: req.user._id },
        { $setOnInsert: { eventId: event._id, userId: req.user._id, registeredAt: new Date() } },
        { upsert: true, new: true }
    );

    res.json(updatedEvent);
});

// @desc    Leave an event
// @route   PUT /api/events/:id/leave
// @access  Private
const leaveEvent = asyncHandler(async (req, res) => {
    // 1. Atomic removal from attendees array
    const event = await Event.findOneAndUpdate(
        { _id: req.params.id },
        { $pull: { attendees: req.user._id } },
        { new: true }
    );

    if (!event) {
        res.status(404);
        throw new Error('Event not found');
    }

    // 2. Remove EventParticipant record
    await EventParticipant.deleteOne({ eventId: event._id, userId: req.user._id });

    res.json({ message: 'Left event' });
});

// @desc    Get QR payload for authenticated user (5-min signed token)
// @route   GET /api/events/:id/qr-payload
// @access  Private
const getEventQRPayload = asyncHandler(async (req, res) => {
    // First check the new EventParticipant collection
    let participant = await EventParticipant.findOne({
        eventId: req.params.id,
        userId: req.user._id
    }).lean();

    // Backfill: user may have joined before EventParticipant collection existed.
    // Fall back to checking Event.attendees — if found, create the record now.
    if (!participant) {
        const event = await Event.findOne({
            _id: req.params.id,
            attendees: req.user._id
        }).select('_id').lean();

        if (!event) {
            res.status(403);
            throw new Error('You are not registered for this event.');
        }

        // Auto-create the EventParticipant record for this existing member
        participant = await EventParticipant.findOneAndUpdate(
            { eventId: req.params.id, userId: req.user._id },
            { $setOnInsert: { eventId: req.params.id, userId: req.user._id, registeredAt: new Date() } },
            { upsert: true, new: true }
        );
    }

    const ts = Date.now();
    const sig = signQRPayload(req.params.id, req.user._id.toString(), ts);

    res.json({
        eventId: req.params.id,
        userId: req.user._id.toString(),
        ts,
        sig,
        expiresIn: 300 // seconds — for frontend countdown display
    });
});


// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private
const updateEvent = asyncHandler(async (req, res) => {
    const { title, description, date, location, category, prize, imageUrl } = req.body;

    const event = await Event.findById(req.params.id);

    if (event) {
        if (event.organizer.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('Not authorized to update this event');
        }

        event.title = title || event.title;
        event.description = description || event.description;
        event.date = date || event.date;
        event.location = location || event.location;
        event.category = category || event.category;
        event.prize = prize !== undefined ? prize : event.prize;
        event.maxTeamSize = req.body.maxTeamSize || event.maxTeamSize;
        if (req.body.isMultiCollege !== undefined) event.isMultiCollege = req.body.isMultiCollege;
        if (req.body.allowTeamRegistration !== undefined) event.allowTeamRegistration = req.body.allowTeamRegistration;
        if (req.body.requireUSN !== undefined) event.requireUSN = req.body.requireUSN;

        // Handle Image Upload if file is provided
        if (req.file) {
            const uploadToCloudinary = () => {
                return new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        { folder: 'synapse_events', resource_type: 'image' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    const bufferStream = new stream.PassThrough();
                    bufferStream.end(req.file.buffer);
                    bufferStream.pipe(uploadStream);
                });
            };

            try {
                const result = await uploadToCloudinary();
                event.imageUrl = result.secure_url;
            } catch (uploadError) {
                console.error('Cloudinary upload error (event update):', uploadError);
                res.status(500);
                throw new Error('Failed to upload image. Please try again.');
            }
        } else {
            event.imageUrl = imageUrl !== undefined ? imageUrl : event.imageUrl;
        }

        const updatedEvent = await event.save();
        await updatedEvent.populate('organizer', 'name username profilePic');
        res.json(updatedEvent);
    } else {
        res.status(404);
        throw new Error('Event not found');
    }
});

// @desc    Get event by ID
// @route   GET /api/events/:id
// @access  Private
const getEventById = asyncHandler(async (req, res) => {
    const event = await Event.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
        .populate('organizer', 'name username profilePic')
        .populate('attendees', 'name username profilePic');

    if (event) {
        res.json(event);
    } else {
        res.status(404);
        throw new Error('Event not found');
    }
});

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private
const deleteEvent = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);

    if (!event) {
        res.status(404);
        throw new Error('Event not found');
    }

    // Check if user is organizer
    if (event.organizer.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to delete this event');
    }

    event.isDeleted = true;
    event.deletedAt = new Date();
    await event.save();
    res.json({ message: 'Event removed' });
});

export {
    createEvent,
    getEvents,
    joinEvent,
    leaveEvent,
    getEventQRPayload,
    updateEvent,
    getEventById,
    deleteEvent
};
