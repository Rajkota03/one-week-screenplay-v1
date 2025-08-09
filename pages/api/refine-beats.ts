import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { logline, theme, world } = req.body || {};
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });

    const system = 'You are a story architect. Return STRICT JSON only.';
    const user = `LOGLINE: ${logline || 'Use canonical premise from project'}
THEME: ${theme || ''}
WORLD: ${world || ''}

TASK: Output exactly 40 beats as JSON:
{
  "beats": [
    { "num": 1, "label": "Opening Image", "summary": "...", "purpose": "...", "stakes": "..." },
    ...
    { "num": 40, "label": "Final Image", "summary": "...", "purpose": "...", "stakes": "..." }
  ]
}
Constraints:
- Modern pacing (inciting by ~p15-20, midpoint p55-65 equivalents).
- Keep premise: stateless traveler trapped in U.S. airport, bureaucracy antagonist, warm/bittersweet tone.
- Each beat = 1–2 sentences, concrete and shootable; no new premise elements.`;

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.45,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ]
      })
    });

    const data = await r.json();
    if ((data as any)?.error) return res.status(500).json({ error: (data as any).error?.message || 'OpenAI error' });
    const content = (data as any)?.choices?.[0]?.message?.content || '{"beats": []}';
    return res.status(200).json(JSON.parse(content));
  } catch (e:any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
