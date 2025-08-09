import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { logline, theme, world } = req.body || {};
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });

    const system = 'You are a story architect (Field, Snyder, Truby, Vogler, Hauge, McKee, Story Grid). Return strict JSON only.';
    const user = `LOGLINE: ${logline}
THEME: ${theme || ''}
WORLD: ${world || ''}

TASK: Propose a compact, cast list JSON. Use this exact shape:
{
  "characters": [
    {
      "name": "Viktor Navorski",
      "role": "protagonist",
      "one_line": "A stateless traveler stuck in a U.S. airport.",
      "want": "Enter the U.S. to fulfill a personal promise",
      "need": "Build connection; accept help; create belonging",
      "wound": "Loss + powerlessness",
      "misbelief": "He must wait for authority to save him",
      "fear": "Deportation / disappearing",
      "moral_line": "Compassion over rules",
      "voice_rules": "simple, polite, literal humor",
      "behavior_tells": "fixes things, barters food, watches people kindly"
    }
  ]
}
Constraints:
- 5–7 characters total: protagonist, antagonist, ally(2–3), love_interest, wildcard.
- Keep wants/needs actionable. Avoid vague traits.`;

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ]
      })
    });

    const data = await r.json();
    if ((data as any)?.error) return res.status(500).json({ error: (data as any).error?.message || 'OpenAI error' });

    const content = (data as any)?.choices?.[0]?.message?.content || '{"characters": []}';
    return res.status(200).json(JSON.parse(content));
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
