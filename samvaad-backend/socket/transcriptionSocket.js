import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

// Manage active deepgram connections & pending chunk queues per socket
const activeDeepgramConnections = new Map();
const pendingAudioQueues = new Map();

export const initTranscriptionSocket = (io, socket) => {
    socket.on('samvaad:start_transcription', ({ roomId }) => {
        if (!roomId) return;

        // Clean up any existing connection for this socket first
        if (activeDeepgramConnections.has(socket.id)) {
            try {
                const prev = activeDeepgramConnections.get(socket.id);
                prev.finish();
            } catch (e) {}
            activeDeepgramConnections.delete(socket.id);
            pendingAudioQueues.delete(socket.id);
        }

        const apiKey = process.env.DEEPGRAM_API_KEY;
        if (!apiKey) {
            console.error('[Deepgram] DEEPGRAM_API_KEY is missing in environment!');
            socket.emit('samvaad:transcription_error', { error: 'Deepgram API key not configured on server' });
            return;
        }

        try {
            const deepgram = createClient(apiKey);
            pendingAudioQueues.set(socket.id, []);

            const live = deepgram.listen.live({
                model: 'nova-3',
                language: 'en-IN',
                smart_format: true,
                interim_results: true,
                punctuate: true,
                keyterm: [
                    "AICTE", "NBA", "NAAC", "NIRF", "UGC", "Chandrayaan",
                    "accreditation", "affiliation", "institute", "committee",
                    "curriculum", "technical education", "approval", "compliance"
                ]
            });

            live.on(LiveTranscriptionEvents.Open, () => {
                const userName = socket.mongoUser?.name || 'Participant';
                console.log(`[Deepgram] Connection OPENED for user ${userName} in room ${roomId}`);
                socket.emit('samvaad:transcription_ready', { success: true });

                // Flush any audio chunks that were queued while connecting
                const queue = pendingAudioQueues.get(socket.id) || [];
                while (queue.length > 0) {
                    const chunk = queue.shift();
                    try {
                        live.send(chunk);
                    } catch (err) {
                        console.warn('[Deepgram] Error sending queued chunk:', err.message);
                    }
                }
            });

            live.on(LiveTranscriptionEvents.Transcript, (data) => {
                const channel = data.channel;
                if (!channel || !channel.alternatives || channel.alternatives.length === 0) return;
                
                const transcript = channel.alternatives[0].transcript;
                if (!transcript || transcript.trim() === '') return;

                const isFinal = data.is_final;
                const userId = socket.mongoUser?._id?.toString() || socket.id;
                const name = socket.mongoUser?.name || 'Participant';

                if (isFinal) {
                    console.log(`[Deepgram FINAL] [${name}]: ${transcript}`);
                    io.to(roomId).emit('samvaad:transcript_final', {
                        roomId,
                        userId,
                        name,
                        text: transcript
                    });
                } else {
                    io.to(roomId).emit('samvaad:transcript_partial', {
                        roomId,
                        userId,
                        name,
                        text: transcript
                    });
                }
            });

            live.on(LiveTranscriptionEvents.Error, (err) => {
                console.error(`[Deepgram] Error for socket ${socket.id}:`, err);
                socket.emit('samvaad:transcription_error', { error: 'Transcription service error' });
            });

            live.on(LiveTranscriptionEvents.Close, (closeEvent) => {
                console.log(`[Deepgram] Connection closed for socket ${socket.id} (code: ${closeEvent?.code || 'N/A'})`);
                activeDeepgramConnections.delete(socket.id);
                pendingAudioQueues.delete(socket.id);
            });

            activeDeepgramConnections.set(socket.id, live);
            
        } catch (err) {
            console.error('[Deepgram] Failed to initialize live client:', err);
            socket.emit('samvaad:transcription_error', { error: 'Failed to initialize transcription' });
        }
    });

    socket.on('samvaad:audio_stream', ({ roomId, audio }) => {
        if (!audio) return;
        const live = activeDeepgramConnections.get(socket.id);
        if (!live) return;

        const readyState = live.getReadyState();
        if (readyState === 1) { // 1 = OPEN
            try {
                live.send(audio);
            } catch (err) {
                console.warn('[Deepgram] Failed to send audio chunk:', err.message);
            }
        } else if (readyState === 0) { // 0 = CONNECTING
            const queue = pendingAudioQueues.get(socket.id);
            if (queue && queue.length < 50) { // Buffer max ~12 seconds of initial audio
                queue.push(audio);
            }
        }
    });

    socket.on('samvaad:stop_transcription', () => {
        const live = activeDeepgramConnections.get(socket.id);
        if (live) {
            try {
                live.finish();
            } catch (e) {
                console.warn('[Deepgram] Error finishing connection:', e.message);
            }
            activeDeepgramConnections.delete(socket.id);
            pendingAudioQueues.delete(socket.id);
        }
    });

    // Handle sudden disconnects
    socket.on('disconnect', () => {
        const live = activeDeepgramConnections.get(socket.id);
        if (live) {
            try { live.finish(); } catch (e) {}
            activeDeepgramConnections.delete(socket.id);
            pendingAudioQueues.delete(socket.id);
        }
    });
};
