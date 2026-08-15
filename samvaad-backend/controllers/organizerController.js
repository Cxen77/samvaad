import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import { buildParticipantView, generateCertId } from '../services/organizerService.js';
import Event from '../models/Event.js';
import EventParticipant from '../models/EventParticipant.js';
import User from '../models/User.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas, loadImage } from 'canvas';
import archiver from 'archiver';
import { verifyQRPayload } from './eventController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Get all events strictly created by the logged-in organizer
// @route   GET /api/organizer/events/my
// @access  Private (Organizer)
const getOrganizerEvents = asyncHandler(async (req, res) => {
    const events = await Event.find({ organizer: req.user._id, isDeleted: { $ne: true } })
        .sort({ date: 1 })
        .lean();
    res.json(events);
});

// @desc    Get participants for an event with type filtering
// @route   GET /api/organizer/events/:id/participants?type=all|solo|auto|pre
// @access  Private (Organizer)
const getEventParticipants = asyncHandler(async (req, res) => {
    const filters = {
        type: req.query.type || 'all'
    };

    const { event, participants, totals } = await buildParticipantView(
        req.params.id,
        req.user._id,
        filters
    );

    res.json({
        eventId: event._id,
        eventTitle: event.title,
        totals,
        participants
    });
});

// @desc    Export filtered participants to CSV
// @route   GET /api/organizer/events/:id/export
// @access  Private (Organizer)
const exportEventParticipants = asyncHandler(async (req, res) => {
    const filters = {
        type: req.query.teamType || 'all',
        teamType: req.query.teamType || 'all',
        college: req.query.college || null,
        year: req.query.year || null,
        section: req.query.section || null,
        attendanceFilter: req.query.attendanceFilter || 'all'  // all | attended | notAttended
    };

    const { event, participants } = await buildParticipantView(
        req.params.id,
        req.user._id,
        filters
    );

    // Build structured CSV — includes attendance columns
    const headers = ['Name', 'Email', 'Username', 'College', 'Year', 'Section', 'Class', 'Team Name', 'Registration Type', 'Registered', 'Attended', 'AttendedAt'];
    const rows = participants.map(p => [
        p.user.name || 'N/A',
        p.user.email || 'N/A',
        p.user.username || 'N/A',
        p.user.college || 'Not Provided',
        p.user.year || 'Not Provided',
        p.user.section || 'Not Provided',
        p.user.className || 'Not Provided',
        p.teamInfo?.teamName || 'None (Solo)',
        p.registrationType,
        'Yes',
        p.attended ? 'Yes' : 'No',
        p.attendedAt ? new Date(p.attendedAt).toISOString() : '—'
    ]);

    const csvData = [headers, ...rows]
        .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=event-${event._id}-participants.csv`);
    res.status(200).send(csvData);
});

// @desc    Verify QR code and mark user attendance
// @route   POST /api/organizer/events/:id/scan-attendance
// @access  Private (Organizer)
const scanAttendance = asyncHandler(async (req, res) => {
    const { eventId, userId, ts, sig } = req.body;

    // 1. Verify HMAC signature + 5-min expiry
    const valid = verifyQRPayload({ eventId, userId, ts, sig });
    if (!valid) {
        res.status(400);
        throw new Error('Invalid or expired QR code. Please ask the participant to refresh their QR.');
    }

    // 2. Confirm the scanned eventId matches the route param
    if (eventId !== req.params.id) {
        res.status(400);
        throw new Error('QR code does not match this event.');
    }

    // 3. Confirm organizer owns the event
    const event = await Event.findById(eventId).select('organizer title').lean();
    if (!event) {
        res.status(404);
        throw new Error('Event not found.');
    }
    if (event.organizer.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('You are not the organizer of this event.');
    }

    // 4. Check if user is registered
    const participant = await EventParticipant.findOne({ eventId, userId });
    if (!participant) {
        res.status(404);
        throw new Error('This user is not registered for the event.');
    }

    // 5. Prevent duplicate scan
    if (participant.attended) {
        res.status(409);
        throw new Error('Attendance already recorded for this participant.');
    }

    // 6. Mark as attended
    participant.attended = true;
    participant.attendedAt = new Date();
    await participant.save();

    // 7. Fetch user info for the organizer-side confirmation card
    const user = await User.findById(userId)
        .select('name username email college year section profilePic')
        .lean();

    res.json({
        success: true,
        message: `Attendance marked for ${user?.name || 'participant'}.`,
        participant: {
            name: user?.name,
            username: user?.username,
            email: user?.email,
            college: user?.college,
            year: user?.year,
            section: user?.section,
            profilePic: user?.profilePic,
            attendedAt: participant.attendedAt
        }
    });
});

// Single rendering engine for PNG certificates
const renderCertificatePNG = async (config) => {
    const {
        template,
        certTitle,
        presentationText,
        name,
        descriptionText,
        eventTitle,
        eventDate,
        organizerName,
        organizerLogosBuffer,
        sponsorLogosBuffer,
        orgMetaCoords,
        signaturesText,
        certId
    } = config;

    let signatures = [];
    if (signaturesText && signaturesText.trim() !== '') {
        signatures = signaturesText.split('\n').map(s => s.trim()).filter(Boolean);
    } else {
        signatures = [organizerName];
    }

    const W = 2480;
    const H = 1754; // A4 Landscape at 300 DPI
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // Load logo buffers into Canvas Images
    const loadImg = async (buf) => {
        try { return await loadImage(buf); } catch (e) { return null; }
    };

    const orgImages = await Promise.all(organizerLogosBuffer.map(loadImg));
    const sponsorImages = await Promise.all(sponsorLogosBuffer.map(loadImg));

    // Helper to draw horizontal center text
    const drawCenteredText = (text, y, font, fill) => {
        ctx.font = font;
        ctx.fillStyle = fill;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, W / 2, y);
    };

    // Helper to draw text
    const drawText = (text, x, y, font, fill, align) => {
        ctx.font = font;
        ctx.fillStyle = fill;
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
    };

    // Template 1: Corporate Modern
    if (template === 'modern') {
        // Background & Borders
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);

        ctx.lineWidth = 15;
        ctx.strokeStyle = '#3b82f6'; // Thin blue border
        ctx.strokeRect(30, 30, W - 60, H - 60);

        // Organizer Logos (Top row)
        let titleY = 300;
        if (orgImages.length > 0) {
            orgImages.forEach((img, idx) => {
                if (!img) return;
                const pos = orgMetaCoords[idx] || 'center';
                let x = W / 2;
                if (pos === 'left') x = 300;
                if (pos === 'right') x = W - 300;
                // Draw logo exactly centered on x,y
                ctx.drawImage(img, x - 100, 150, 200, 200);
            });
            titleY = 450;
        }

        // Text Block
        drawCenteredText(certTitle.toUpperCase(), titleY, 'bold 80px sans-serif', '#111827');
        drawCenteredText(presentationText, titleY + 120, '40px sans-serif', '#6b7280');

        // Large Name
        drawCenteredText(name, titleY + 300, 'bold 130px sans-serif', '#111827');

        // Horizontal divider
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(W / 2 - 300, titleY + 420, 600, 4);

        drawCenteredText(descriptionText, titleY + 520, '40px sans-serif', '#6b7280');
        drawCenteredText(eventTitle, titleY + 620, 'bold 60px sans-serif', '#3b82f6');
        drawCenteredText(`DATE: ${eventDate.toUpperCase()}`, titleY + 700, 'bold 30px sans-serif', '#9ca3af');

        // Signature
        // Signatures
        const sigY = H - 350;
        const numSigs = signatures.length;
        const availableWidth = W * 0.8;
        const startX = (W - availableWidth) / 2;
        const sigSpacing = availableWidth / numSigs;

        signatures.forEach((sig, idx) => {
            const centerX = startX + (sigSpacing * idx) + (sigSpacing / 2);
            ctx.fillStyle = '#111827';
            ctx.fillRect(centerX - 150, sigY, 300, 4);

            ctx.font = 'bold 35px sans-serif';
            ctx.fillStyle = '#111827';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(sig.toUpperCase(), centerX, sigY + 50);

            ctx.font = '25px sans-serif';
            ctx.fillStyle = '#6b7280';
            ctx.fillText('AUTHORIZED SIGNATURE', centerX, sigY + 100);
        });

        // Sponsors
        if (sponsorImages.length > 0) {
            drawCenteredText('OUR PROUD SPONSORS', H - 220, 'bold 25px sans-serif', '#9ca3af');
            const spSpacing = 280;
            const totalWidth = sponsorImages.length * spSpacing;
            let startX = (W - totalWidth) / 2 + (spSpacing / 2);

            sponsorImages.forEach((img, idx) => {
                if (img) {
                    const maxWidth = 200;
                    const maxHeight = 100;
                    const aspect = img.width / img.height;
                    let drawWidth = maxWidth;
                    let drawHeight = maxWidth / aspect;

                    if (drawHeight > maxHeight) {
                        drawHeight = maxHeight;
                        drawWidth = maxHeight * aspect;
                    }

                    const pX = startX + (idx * spSpacing) - (drawWidth / 2);
                    const pY = H - 170 + (maxHeight - drawHeight) / 2;
                    ctx.drawImage(img, pX, pY, drawWidth, drawHeight);
                }
            });
        }

        if (certId) {
            drawText(`ID: ${certId}`, W - 100, H - 100, '25px sans-serif', '#d1d5db', 'right');
        }
    }
    // Template 2: Academic Formal
    else if (template === 'academic') {
        // Background
        ctx.fillStyle = '#fdfbf7';
        ctx.fillRect(0, 0, W, H);

        // Elegant dark red borders
        ctx.lineWidth = 40;
        ctx.strokeStyle = '#7f1d1d';
        ctx.strokeRect(60, 60, W - 120, H - 120);

        ctx.lineWidth = 4;
        ctx.strokeStyle = '#d4af37';
        ctx.strokeRect(120, 120, W - 240, H - 240);

        // Logos
        let titleY = 350;
        if (orgImages.length > 0) {
            orgImages.forEach((img, idx) => {
                if (!img) return;
                const pos = orgMetaCoords[idx] || 'center';
                let x = W / 2;
                if (pos === 'left') x = 300;
                if (pos === 'right') x = W - 300;
                ctx.drawImage(img, x - 120, 200, 240, 240);
            });
            titleY = 550;
        }

        drawCenteredText(certTitle.toUpperCase(), titleY, 'bold 90px serif', '#7f1d1d');
        drawCenteredText(presentationText, titleY + 120, 'italic 45px serif', '#4b5563');

        drawCenteredText(name, titleY + 300, 'bold 140px serif', '#111827');

        ctx.fillStyle = '#d4af37';
        ctx.fillRect(W / 2 - 200, titleY + 400, 400, 3);

        drawCenteredText(descriptionText, titleY + 500, '40px serif', '#374151');
        drawCenteredText(eventTitle, titleY + 600, 'bold 55px serif', '#111827');
        drawCenteredText(eventDate.toUpperCase(), titleY + 680, '35px serif', '#4b5563');

        const sigY = H - 400;
        const numSigs = signatures.length;
        const availableWidth = W * 0.8;
        const startX = (W - availableWidth) / 2;
        const sigSpacing = availableWidth / numSigs;

        signatures.forEach((sig, idx) => {
            const centerX = startX + (sigSpacing * idx) + (sigSpacing / 2);
            ctx.fillStyle = '#111827';
            ctx.fillRect(centerX - 150, sigY, 300, 2);

            ctx.font = 'bold 35px serif';
            ctx.fillStyle = '#111827';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(sig.toUpperCase(), centerX, sigY + 50);
        });

        if (sponsorImages.length > 0) {
            drawCenteredText('SPONSORS', H - 220, 'bold 25px serif', '#4b5563');
            const spSpacing = 280;
            const totalWidth = sponsorImages.length * spSpacing;
            let startX = (W - totalWidth) / 2 + (spSpacing / 2);

            sponsorImages.forEach((img, idx) => {
                if (img) {
                    const maxWidth = 200;
                    const maxHeight = 100;
                    const aspect = img.width / img.height;
                    let drawWidth = maxWidth;
                    let drawHeight = maxWidth / aspect;

                    if (drawHeight > maxHeight) {
                        drawHeight = maxHeight;
                        drawWidth = maxHeight * aspect;
                    }

                    const pX = startX + (idx * spSpacing) - (drawWidth / 2);
                    const pY = H - 170 + (maxHeight - drawHeight) / 2;
                    ctx.drawImage(img, pX, pY, drawWidth, drawHeight);
                }
            });
        }

        if (certId) {
            drawText(`Verification: ${certId}`, W - 150, H - 150, '25px serif', '#9ca3af', 'right');
        }
    }
    // Template 3: Hackathon Tech
    else {
        // Default to Hackathon Tech
        ctx.fillStyle = '#0f172a'; // slate-900
        ctx.fillRect(0, 0, W, H);

        // Gradient accent strip at top
        const grad = ctx.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0, '#3b82f6');
        grad.addColorStop(0.5, '#ec4899');
        grad.addColorStop(1, '#f59e0b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, 40);

        // Geometric corner accents
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(0, 0, 600, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.arc(W, H, 800, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        let titleY = 300;
        if (orgImages.length > 0) {
            orgImages.forEach((img, idx) => {
                if (!img) return;
                const pos = orgMetaCoords[idx] || 'center';
                let x = W / 2;
                if (pos === 'left') x = 300;
                if (pos === 'right') x = W - 300;
                ctx.drawImage(img, x - 120, 150, 240, 240);
            });
            titleY = 500;
        }

        drawCenteredText(certTitle.toUpperCase(), titleY, 'bold 90px monospace', '#f8fafc'); // White
        drawCenteredText(presentationText, titleY + 120, '40px monospace', '#94a3b8'); // Slate 400

        drawCenteredText(name.toUpperCase(), titleY + 320, '900 150px sans-serif', '#f8fafc');

        // Category Badge
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.roundRect(W / 2 - 150, titleY + 450, 300, 60, 30);
        ctx.fill();
        drawCenteredText('ACHIEVER', titleY + 480, 'bold 30px monospace', '#ffffff');

        drawCenteredText(descriptionText, titleY + 580, '40px monospace', '#cbd5e1'); // Slate 300
        drawCenteredText(eventTitle.toUpperCase(), titleY + 680, 'bold 60px monospace', '#f8fafc');
        drawCenteredText(`[ ${eventDate.toUpperCase()} ]`, titleY + 760, 'bold 35px monospace', '#ec4899'); // Pink

        const sigY = H - 350;
        const numSigs = signatures.length;
        const availableWidth = W * 0.8;
        const startX = (W - availableWidth) / 2;
        const sigSpacing = availableWidth / numSigs;

        signatures.forEach((sig, idx) => {
            const centerX = startX + (sigSpacing * idx) + (sigSpacing / 2);
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(centerX - 150, sigY, 300, 2);

            ctx.font = 'bold 35px monospace';
            ctx.fillStyle = '#f8fafc';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(sig.toUpperCase(), centerX, sigY + 50);

            ctx.font = '25px monospace';
            ctx.fillStyle = '#64748b';
            ctx.fillText('SIGNATURE_KEY', centerX, sigY + 100);
        });

        if (sponsorImages.length > 0) {
            drawCenteredText('OUR SPONSORS', H - 220, 'bold 25px monospace', '#94a3b8');
            const spSpacing = 280;
            const totalWidth = sponsorImages.length * spSpacing;
            let startX = (W - totalWidth) / 2 + (spSpacing / 2);

            sponsorImages.forEach((img, idx) => {
                if (!img) return;

                const maxWidth = 200;
                const maxHeight = 100;
                const aspect = img.width / img.height;
                let drawWidth = maxWidth;
                let drawHeight = maxWidth / aspect;

                if (drawHeight > maxHeight) {
                    drawHeight = maxHeight;
                    drawWidth = maxHeight * aspect;
                }

                const pX = startX + (idx * spSpacing) - (drawWidth / 2);
                const pY = H - 170 + (maxHeight - drawHeight) / 2;

                ctx.drawImage(img, pX, pY, drawWidth, drawHeight);
            });
        }

        if (certId) {
            drawText(`SYS.ID: ${certId}`, W - 100, H - 100, 'bold 25px monospace', '#475569', 'right'); // Slate 600
        }
    }

    return canvas.toBuffer('image/png');
};


// @desc    Generate professional PNG Certificates (single or zipped)
// @route   POST /api/organizer/events/:id/certificates
// @access  Private (Organizer)
const generateEventCertificates = asyncHandler(async (req, res) => {
    let event;

    if (req.params.id === 'custom') {
        const { customEventName, customEventDate, customOrganizerName } = req.body;
        event = {
            _id: 'CUSTOM_EVENT_' + Date.now().toString(),
            title: customEventName || 'Custom Event',
            date: new Date(),
            organizer: {
                _id: req.user._id,
                name: customOrganizerName || req.user.name || 'Organizer'
            }
        };
    } else {
        event = await Event.findById(req.params.id)
            .populate('organizer', 'name college');

        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        if (!event.organizer._id.equals(req.user._id)) {
            res.status(403);
            throw new Error('Unauthorized to generate certificates for this event.');
        }
    }

    let recipients;
    try {
        recipients = JSON.parse(req.body.recipients);
    } catch (e) {
        res.status(400);
        throw new Error('Invalid recipients format. Expected JSON string.');
    }

    const {
        type = 'participant',
        template = 'modern',
        certTitle = type === 'winner' ? 'CERTIFICATE OF EXCELLENCE' : 'CERTIFICATE OF PARTICIPATION',
        presentationText = 'This certificate is proudly presented to',
        descriptionText = `for outstanding ${type === 'winner' ? 'excellence' : 'participation'} in`,
        signaturesText = ''
    } = req.body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
        res.status(400);
        throw new Error('Please provide an array of recipient objects with { userId, name }.');
    }

    const organizerLogosBuffer = req.files && req.files['organizerLogos'] ? req.files['organizerLogos'].map(f => f.buffer) : [];
    const sponsorLogosBuffer = req.files && req.files['sponsorLogos'] ? req.files['sponsorLogos'].map(f => f.buffer) : [];

    let orgMetaCoords = [];
    try {
        if (req.body.orgMeta) orgMetaCoords = JSON.parse(req.body.orgMeta);
    } catch (e) { }

    let eventDate;
    if (req.params.id === 'custom' && req.body.customEventDate) {
        eventDate = req.body.customEventDate;
    } else {
        eventDate = new Date(event.date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    }
    const generatedAt = Date.now();

    // Generate PNG buffers for all recipients
    const pngBuffers = [];
    for (const recipient of recipients) {
        const certId = recipient.userId ? generateCertId(recipient.userId, event._id.toString(), generatedAt) : null;

        const config = {
            template,
            certTitle,
            presentationText,
            name: recipient.name,
            descriptionText,
            eventTitle: event.title,
            eventDate,
            organizerName: event.organizer.name,
            organizerLogosBuffer,
            sponsorLogosBuffer,
            orgMetaCoords,
            signaturesText,
            certId
        };

        const buffer = await renderCertificatePNG(config);
        pngBuffers.push({ name: recipient.name, buffer });
    }

    // Return single PNG or zipped PNGs
    if (pngBuffers.length === 1) {
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="${pngBuffers[0].name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_certificate.png"`);
        return res.send(pngBuffers[0].buffer);
    } else {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="certificates-${event._id}.zip"`);

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);

        pngBuffers.forEach((item, index) => {
            const safeName = item.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            archive.append(item.buffer, { name: `${safeName}_${index + 1}.png` });
        });

        await archive.finalize();
    }
});

// @desc    Generate a single preview PNG and return as base64
// @route   POST /api/organizer/events/:id/certificates/preview
// @access  Private (Organizer)
const previewEventCertificates = asyncHandler(async (req, res) => {
    let eventTitle = req.body.customEventName || 'Hackathon 2026';
    let eventDate = req.body.customEventDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    let organizerName = req.body.customOrganizerName || 'Organizer Name';

    if (req.params.id !== 'custom') {
        const event = await Event.findById(req.params.id).populate('organizer', 'name');
        if (event) {
            eventTitle = event.title;
            eventDate = new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            organizerName = event.organizer.name;
        }
    }

    const {
        type = 'participant',
        template = 'modern',
        certTitle = type === 'winner' ? 'CERTIFICATE OF EXCELLENCE' : 'CERTIFICATE OF PARTICIPATION',
        presentationText = 'This certificate is proudly presented to',
        descriptionText = `for outstanding ${type === 'winner' ? 'excellence' : 'participation'} in`,
        signaturesText = ''
    } = req.body;

    const organizerLogosBuffer = req.files && req.files['organizerLogos'] ? req.files['organizerLogos'].map(f => f.buffer) : [];
    const sponsorLogosBuffer = req.files && req.files['sponsorLogos'] ? req.files['sponsorLogos'].map(f => f.buffer) : [];

    let orgMetaCoords = [];
    try {
        if (req.body.orgMeta) orgMetaCoords = JSON.parse(req.body.orgMeta);
    } catch (e) { }

    const config = {
        template,
        certTitle,
        presentationText,
        name: 'John Doe', // Dummy name for preview
        descriptionText,
        eventTitle,
        eventDate,
        organizerName,
        organizerLogosBuffer,
        sponsorLogosBuffer,
        orgMetaCoords,
        signaturesText,
        certId: 'PREVIEW-123456789'
    };

    const buffer = await renderCertificatePNG(config);
    const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;

    res.json({ previewUrl: base64Image });
});

export {
    getOrganizerEvents,
    getEventParticipants,
    exportEventParticipants,
    generateEventCertificates,
    previewEventCertificates,
    scanAttendance
};
