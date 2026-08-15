import { GoogleGenerativeAI } from '@google/generative-ai';

const SUMMARY_PROMPT = `You are an AI meeting assistant for AICTE Samvaad, an Indian government education regulatory body's official meeting platform.

Analyze the following meeting transcript and provide a structured summary in this exact JSON format:
{
  "summary": "A concise 2-3 paragraph summary of the meeting discussion",
  "keyDecisions": ["Decision 1", "Decision 2"],
  "actionItems": [
    { "task": "Task description", "assignee": "Person name or 'Unassigned'", "deadline": "If mentioned, otherwise 'TBD'" }
  ],
  "nextSteps": ["Next step 1", "Next step 2"],
  "participants": ["Name 1", "Name 2"]
}

Rules:
- Be factual and concise. Do not invent information not present in the transcript.
- If the transcript is very short or unclear, still provide your best summary.
- Return ONLY valid JSON, no markdown fences.

TRANSCRIPT:
`;

export const summarizeTranscript = async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Transcript text is required (min 10 characters).' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ 
        success: false, 
        message: 'AI Summary is not configured. Add GEMINI_API_KEY to the server environment.' 
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent(SUMMARY_PROMPT + transcript);
    const responseText = result.response.text();

    // Parse the JSON response
    let parsed;
    try {
      // Strip markdown fences if present
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // If JSON parse fails, return raw text as summary
      parsed = {
        summary: responseText,
        keyDecisions: [],
        actionItems: [],
        nextSteps: [],
        participants: []
      };
    }

    return res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('AI Summary error:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to generate AI summary. Please try again.' 
    });
  }
};
