/**
 * Local AI Summarizer Service — SmolLM2-135M-Instruct
 * 
 * Lazy-loads the model on first summary request to conserve memory.
 * Processes long transcripts via sequential chunking.
 * Designed for Render FREE tier (512MB RAM).
 * 
 * IMPORTANT: This service is ONLY for summarization.
 * Deepgram remains the sole transcription provider.
 */

let generatorInstance = null;
let isLoading = false;
let loadPromise = null;

const MODEL_ID = 'HuggingFaceTB/SmolLM2-135M-Instruct';
const MAX_CHUNK_CHARS = 1500; // Characters per chunk for the small model's context window
const MAX_NEW_TOKENS = 250;

/**
 * Lazy-load the text-generation pipeline.
 * Returns cached instance on subsequent calls.
 */
const getGenerator = async () => {
    if (generatorInstance) return generatorInstance;
    if (loadPromise) return loadPromise;

    isLoading = true;
    console.log('[LocalSummarizer] Loading SmolLM2-135M-Instruct model...');
    const startTime = Date.now();

    loadPromise = (async () => {
        try {
            const { pipeline } = await import('@huggingface/transformers');
            generatorInstance = await pipeline('text-generation', MODEL_ID, {
                dtype: 'q4',
                device: 'cpu',
            });
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`[LocalSummarizer] Model loaded successfully in ${elapsed}s`);
            return generatorInstance;
        } catch (err) {
            console.error('[LocalSummarizer] Failed to load model:', err.message);
            loadPromise = null;
            throw err;
        } finally {
            isLoading = false;
        }
    })();

    return loadPromise;
};

/**
 * Check if the model is currently loading.
 */
export const isModelLoading = () => isLoading;

/**
 * Split a long transcript into chunks, respecting speaker line boundaries.
 */
const chunkTranscript = (transcript) => {
    if (transcript.length <= MAX_CHUNK_CHARS) return [transcript];

    const lines = transcript.split('\n');
    const chunks = [];
    let current = '';

    for (const line of lines) {
        if ((current.length + line.length + 1) > MAX_CHUNK_CHARS && current.length > 0) {
            chunks.push(current.trim());
            current = '';
        }
        current += line + '\n';
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
};

/**
 * Generate text from the local model with a system + user message.
 */
const generate = async (systemPrompt, userPrompt) => {
    const generator = await getGenerator();
    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ];

    const output = await generator(messages, {
        max_new_tokens: MAX_NEW_TOKENS,
        temperature: 0.1,
        do_sample: true,
        top_p: 0.9,
    });

    // Extract assistant response from output
    if (Array.isArray(output) && output.length > 0) {
        const generated = output[0]?.generated_text;
        if (Array.isArray(generated)) {
            // Chat-style output: array of { role, content }
            const assistantMsg = generated.find(m => m.role === 'assistant');
            return assistantMsg?.content?.trim() || '';
        }
        if (typeof generated === 'string') {
            return generated.trim();
        }
    }
    return '';
};

const CHUNK_SYSTEM_PROMPT = `You are a factual meeting assistant for AICTE Samvaad. Summarize the transcript chunk below.
Rules:
- Only include facts explicitly stated in the transcript.
- Never invent names, dates, decisions, or action items not present.
- Be concise. List key points as bullet points.`;

const FINAL_SYSTEM_PROMPT = `You are a factual meeting assistant for AICTE Samvaad. Combine the partial summaries below into one structured meeting summary.

Output format (plain text, not JSON):
EXECUTIVE SUMMARY:
(2-3 sentence overview)

KEY DISCUSSION POINTS:
- point 1
- point 2

DECISIONS MADE:
- decision 1 (only if explicitly stated)

ACTION ITEMS:
- task → assignee (deadline) (only if explicitly stated)

PENDING ISSUES:
- issue 1 (only if explicitly stated)

Rules:
- Never invent information not present in the summaries.
- If no decisions/action items/pending issues are found, write "None identified in transcript."
- Only attribute tasks to a person if the transcript explicitly names them.`;

/**
 * Main entry point: summarize a full transcript string.
 * Returns a structured summary object compatible with the existing UI.
 */
export const summarizeWithLocalModel = async (transcript) => {
    const chunks = chunkTranscript(transcript);
    console.log(`[LocalSummarizer] Processing ${chunks.length} chunk(s)...`);

    // Summarize each chunk sequentially to minimize RAM
    const chunkSummaries = [];
    for (let i = 0; i < chunks.length; i++) {
        console.log(`[LocalSummarizer] Summarizing chunk ${i + 1}/${chunks.length}...`);
        const summary = await generate(
            CHUNK_SYSTEM_PROMPT,
            `Transcript chunk:\n${chunks[i]}`
        );
        if (summary) chunkSummaries.push(summary);
    }

    // If only one chunk, use its summary directly for the final pass
    const combinedInput = chunkSummaries.length === 1
        ? chunkSummaries[0]
        : chunkSummaries.map((s, i) => `--- Part ${i + 1} ---\n${s}`).join('\n\n');

    // Generate final structured summary
    const finalText = await generate(
        FINAL_SYSTEM_PROMPT,
        `Partial summaries:\n${combinedInput}`
    );

    // Parse the free-text output into the structured format expected by the UI
    return parseStructuredSummary(finalText);
};

/**
 * Parse a free-text summary into the JSON structure the frontend expects:
 * { summary, keyDecisions, actionItems, nextSteps, participants }
 */
const parseStructuredSummary = (text) => {
    if (!text) {
        return {
            summary: 'Unable to generate a detailed summary from the transcript.',
            keyDecisions: [],
            actionItems: [],
            nextSteps: [],
            participants: []
        };
    }

    // Extract sections using header markers
    const getSection = (header, nextHeaders) => {
        const pattern = new RegExp(
            `${header}[:\\s]*\\n([\\s\\S]*?)(?:${nextHeaders.map(h => h + '[:\\s]*\\n').join('|')}|$)`,
            'i'
        );
        const match = text.match(pattern);
        return match ? match[1].trim() : '';
    };

    const headers = [
        'EXECUTIVE SUMMARY', 'KEY DISCUSSION POINTS', 'DECISIONS MADE',
        'ACTION ITEMS', 'PENDING ISSUES', 'IMPORTANT DATES'
    ];

    const executiveSummary = getSection('EXECUTIVE SUMMARY', headers.slice(1));
    const discussionPoints = getSection('KEY DISCUSSION POINTS', headers.slice(2));
    const decisions = getSection('DECISIONS MADE', headers.slice(3));
    const actions = getSection('ACTION ITEMS', headers.slice(4));
    const pending = getSection('PENDING ISSUES', headers.slice(5));

    const extractBullets = (section) => {
        if (!section || section.toLowerCase().includes('none identified')) return [];
        return section
            .split('\n')
            .map(l => l.replace(/^[\s\-•→*]+/, '').trim())
            .filter(l => l.length > 0);
    };

    const parseActionItems = (section) => {
        if (!section || section.toLowerCase().includes('none identified')) return [];
        return section
            .split('\n')
            .map(l => l.replace(/^[\s\-•→*]+/, '').trim())
            .filter(l => l.length > 0)
            .map(line => {
                // Try to parse "task → assignee (deadline)"
                const match = line.match(/^(.+?)(?:\s*→\s*|\s*->\s*)(.+?)(?:\s*\((.+?)\))?$/);
                if (match) {
                    return { task: match[1].trim(), assignee: match[2].trim(), deadline: match[3]?.trim() || 'TBD' };
                }
                return { task: line, assignee: 'Unassigned', deadline: 'TBD' };
            });
    };

    return {
        summary: executiveSummary || text.substring(0, 500),
        keyDecisions: extractBullets(decisions),
        actionItems: parseActionItems(actions),
        nextSteps: [
            ...extractBullets(discussionPoints).slice(0, 5),
            ...extractBullets(pending)
        ],
        participants: []
    };
};
