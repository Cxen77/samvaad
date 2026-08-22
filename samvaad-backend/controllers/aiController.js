/**
 * AI Controller — Meeting Summary Generation
 * 
 * Uses local SmolLM2-135M-Instruct model (lazy-loaded).
 * The Deepgram transcription pipeline is NOT touched by this controller.
 * This controller ONLY handles post-transcription summarization.
 */
import crypto from 'crypto';
import { summarizeWithLocalModel, isModelLoading } from '../services/localSummarizerService.js';
import { encryptMessage } from '../services/encryptionService.js';
import { anchorEvidence } from '../services/blockchainService.js';

export const summarizeTranscript = async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Transcript text is required (min 10 characters).' });
    }

    // Notify client that model may need loading
    if (isModelLoading()) {
      console.log('[AI Controller] Model is currently loading, waiting...');
    }

    // Generate summary using local model
    const parsed = await summarizeWithLocalModel(transcript);

    // Generate SHA-256 hash of the summary for integrity verification
    const summaryText = JSON.stringify(parsed);
    const summaryHash = crypto.createHash('sha256').update(summaryText).digest('hex');

    // Anchor summary hash to local blockchain/integrity ledger
    try {
      await anchorEvidence({
        evidenceHash: summaryHash,
        evidenceType: 'meeting_summary',
        referenceId: `summary-${Date.now()}`,
        meetingId: req.body.meetingId || null,
        eventType: 'SUMMARY_GENERATED',
        metadata: {
          summaryHash,
          generatedAt: new Date().toISOString(),
          model: 'SmolLM2-135M-Instruct',
          transcriptLength: transcript.length,
        }
      });
    } catch (anchorErr) {
      // Non-fatal: summary still works even if anchoring fails
      console.warn('[AI Controller] Summary anchoring failed (non-fatal):', anchorErr.message);
    }

    return res.json({ success: true, data: parsed, integrity: { summaryHash } });
  } catch (error) {
    console.error('AI Summary error:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Unable to generate summary. Please try again.' 
    });
  }
};
