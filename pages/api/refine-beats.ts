import type { NextApiRequest, NextApiResponse } from 'next';

const MODEL = 'gpt-4o';

async function callOnce(payload: any, apiKey: string) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(payload),
  });
  const data = await r.json();
  if ((data as any)?.error) throw new Error((data as any).error?.message || 'OpenAI error');
  const content = (data as any)?.choices?.[0]?.message?.content || '{"beats": []}';
  return JSON.parse(content);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });

    const { logline, theme, world } = req.body || {};

    const system = 'You are a story architect. Return STRICT JSON only.';
    const baseUser = `LOGLINE: ${logline || 'Use canonical project premise'}
THEME: ${theme || ''}
WORLD: ${world || ''}

TASK: Output exactly 40 beats as JSON:
{
  "beats": [
    { "num": 1,  "label": "Opening Image",  "summary": "...", "purpose": "...", "stakes": "..." },
    { "num": 2,  "label": "Set-Up",         "summary": "...", "purpose": "...", "stakes": "..." },
    ...
    { "num": 40, "label": "Final Image",    "summary": "...", "purpose": "...", "stakes": "..." }
  ]
}
Constraints:
- Exactly forty items in "beats" (num = 1..40). No fewer, no more.
- Keep premise: stateless traveler trapped in a U.S. airport; bureaucracy as antagonistic force; warm/bittersweet tone.
- Each beat 1–2 sentences, concrete and shootable; do not invent a new premise.
- Use clear labels (Opening Image, Catalyst/Inciting, Debate, Break into 2, Midpoint, All Is Lost, etc.) and fill the rest with concise labels.`;

    const payload = {
      model: MODEL,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: baseUser },
      ],
    };

    // Try up to 3 times to get 40 beats
    let out = await callOnce(payload, apiKey);
    for (let attempt = 0; attempt < 2; attempt++) {
      if (Array.isArray(out?.beats) && out.beats.length === 40) break;
      const missing = 40 - (Array.isArray(out?.beats) ? out.beats.length : 0);
      const correction = {
        model: MODEL,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: baseUser },
          { role: 'assistant', content: JSON.stringify(out) },
          { role: 'user', content: `You returned ${out?.beats?.length || 0} beats. Return JSON again with EXACTLY 40 beats (1..40). Do not omit any numbers. No prose, JSON only.` },
        ],
      };
      out = await callOnce(correction, apiKey);
    }

    if (!Array.isArray(out?.beats) || out.beats.length !== 40) {
      return res.status(502).json({ error: 'Model did not return 40 beats after retries.' });
    }

    return res.status(200).json(out);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
