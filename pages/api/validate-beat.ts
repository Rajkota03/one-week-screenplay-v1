import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const apiKey = process.env.OPENAI_API_KEY!;
    const { logline, theme, beat } = req.body || {};
    if (!apiKey) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });

    const system = 'You are a story editor. Always return strict JSON. Be concise and actionable.';
    const user = `SPINE:
LOGLINE: ${logline || ''}
THEME: ${theme || ''}

BEAT DRAFT:
Label: ${beat?.label || ''}
Summary: ${beat?.summary || ''}

TASK: Evaluate the beat against the spine. Return JSON:
{
  "score": { "purpose": 0, "stakes": 0, "causality": 0, "freshness": 0, "clarity": 0, "overall": 0 },
  "diagnostics": {
    "is_scene_worthy": true,
    "missing": ["purpose","stakes","turn","value_shift","goal","obstacle","decision"],
    "conflicts_with_theme": false
  },
  "notes": ["short actionable notes..."],
  "rewrite_suggestion": "1–2 sentence improved beat that keeps the same intent"
}`;

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
      })
    });

    const data = await r.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const content = data?.choices?.[0]?.message?.content || '{}';
    res.status(200).json(JSON.parse(content));
  } catch (e:any) {
    res.status(500).json({ error: e.message || String(e) });
  }
}
