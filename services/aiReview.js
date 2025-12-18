import OpenAI from 'openai';

const baseURL = 'https://models.github.ai/inference';
const rawModel = process.env.GITHUB_MODEL || '';
const tokenFromModel = rawModel.startsWith('github_pat_') ? rawModel : '';
const model = rawModel && !tokenFromModel ? rawModel : 'openai/gpt-4o';
const apiKey = process.env.GITHUB_TOKEN || tokenFromModel || '';

function buildPrompt(context) {
  const { patient, encounter, charges, claim } = context;
  return [
    {
      role: 'system',
      content:
        'You are an RCM billing copilot. Review the claim context and return JSON only with keys: ' +
        'summary (string), risks (array of strings), suggestedChanges (array of {field,message}), ' +
        'confidence (number 0-1), draftClaim (object or null). ' +
        'If you can propose corrections or missing values, include them as suggestedChanges. ' +
        'If claim creation is needed, populate draftClaim with the 837P internal structure.',
    },
    {
      role: 'user',
      content: JSON.stringify(
        {
          patient,
          encounter,
          charges,
          claim,
        },
        null,
        2
      ),
    },
  ];
}

export async function runAiReview(context) {
  if (!apiKey) {
    return {
      summary: 'AI key not configured; using local review.',
      risks: ['No AI review executed.'],
      suggestedChanges: [],
      confidence: 0,
      ranAt: new Date().toISOString(),
    };
  }

  const client = new OpenAI({ baseURL, apiKey });
  const messages = buildPrompt(context);

  try {
    const response = await client.chat.completions.create({
      messages,
      model,
      temperature: 0.2,
      max_tokens: 900,
      top_p: 1,
      response_format: { type: 'json_object' },
    });
    const raw = response.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);
    // console.log('[ai] review result', parsed);
    return {
      summary: parsed.summary || 'AI review completed.',
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      suggestedChanges: Array.isArray(parsed.suggestedChanges) ? parsed.suggestedChanges : [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      draftClaim: parsed.draftClaim || null,
      ranAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('[ai] review failed', err.message);
    return {
      summary: 'AI review failed; please try again.',
      risks: ['AI service unavailable or returned invalid output.'],
      suggestedChanges: [],
      confidence: 0,
      ranAt: new Date().toISOString(),
    };
  }
}
