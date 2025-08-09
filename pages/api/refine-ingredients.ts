import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { logline, genre, tone } = req.body || {};
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });

    const system = 'You are a story architect (Field, Snyder, Truby, Vogler, Hauge, McKee, Story Grid). Return tight JSON only.';
    const user = `LOGINE: ${logline}
GENRE: ${genre}
TONE: ${tone}

TASK: Propose ingredients for Stage 2 as strict JSON with keys:
{
  "theme_equation": "Because __, the right choice is __, even at cost __.",
  "world_brief": "1 paragraph that signals texture, culture, rules-of-world.",
  "genre_obligations": ["...", "...", "...", "..."],
  "conventions": ["...", "...", "...", "..."],
  "motifs": [{"name":"object/image","meaning":"why it matters"}, {"name":"weather","meaning":"..."}]
}

Constraints:
- Preserve the premise; do not change setting or core conflict.
- Be specific, cinematic, and usable in beats later.`;

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.5,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const data = await r.json();
    if ((data as any)?.error) return res.status(500).json({ error: (data as any).error?.message || 'OpenAI error' });

    const content = (data as any)?.choices?.[0]?.message?.content || '{}';
    return res.status(200).json(JSON.parse(content));
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
