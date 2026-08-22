import { createClient } from '@deepgram/sdk';

// Manage active deepgram connections per socket
const activeDeepgramConnections = new Map();

export const initTranscriptionSocket = (io, socket) => {
    socket.on('samvaad:start_transcription', ({ roomId }) => {
        if (!roomId) return;
        
        try {
            const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
            const live = deepgram.listen.live({
                model: 'nova-3',
                language: 'en-IN',
                smart_format: true,
                interim_results: true,
                punctuate: true,
                diarize: false, // We're identifying speakers by socket, so diarize not strictly needed per stream
                keywords: [
                    "AICTE:2", "NBA:2", "NAAC:2", "NIRF:2", "UGC:2", "Chandrayaan:2", 
                    "accreditation", "affiliation", "institute", "committee", 
                    "curriculum", "technical education", "approval", "compliance"
                ]
            });

            live.on('open', () => {
                console.log(`[Deepgram] Connection opened for user ${socket.mongoUser.name} in room ${roomId}`);
                socket.emit('samvaad:transcription_ready', { success: true });
            });

            live.on('Results', (data) => {
                const channel = data.channel;
                if (!channel || !channel.alternatives || channel.alternatives.length === 0) return;
                
                const transcript = channel.alternatives[0].transcript;
                if (!transcript || transcript.trim() === '') return;

                const isFinal = data.is_final;
                const userId = socket.mongoUser._id.toString();
                const name = socket.mongoUser.name;

                if (isFinal) {
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

            live.on('error', (err) => {
                console.error(`[Deepgram] Error for socket ${socket.id}:`, err);
                socket.emit('samvaad:transcription_error', { error: 'Transcription service error' });
            });

            live.on('close', () => {
                console.log(`[Deepgram] Connection closed for socket ${socket.id}`);
                activeDeepgramConnections.delete(socket.id);
            });

            activeDeepgramConnections.set(socket.id, live);
            
        } catch (err) {
            console.error('[Deepgram] Failed to initialize:', err);
            socket.emit('samvaad:transcription_error', { error: 'Failed to initialize transcription' });
        }
    });

    socket.on('samvaad:audio_stream', ({ roomId, audio }) => {
        const live = activeDeepgramConnections.get(socket.id);
        if (live && live.getReadyState() === 1) { // 1 = OPEN
            try {
                live.send(audio);
            } catch (err) {
                console.warn('[Deepgram] Failed to send audio chunk:', err);
            }
        }
    });

    socket.on('samvaad:stop_transcription', () => {
        const live = activeDeepgramConnections.get(socket.id);
        if (live) {
            try {
                live.finish(); // Cleanly finish stream, returning final chunks
            } catch (e) {
                console.warn('[Deepgram] Error finishing connection:', e);
            }
            activeDeepgramConnections.delete(socket.id);
        }
    });

    // Handle sudden disconnects
    socket.on('disconnect', () => {
        const live = activeDeepgramConnections.get(socket.id);
        if (live) {
            try { live.finish(); } catch (e) {}
            activeDeepgramConnections.delete(socket.id);
        }
    });
};
