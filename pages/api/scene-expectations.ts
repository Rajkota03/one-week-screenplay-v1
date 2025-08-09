import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const apiKey = process.env.OPENAI_API_KEY!;
    const { logline, theme, beat } = req.body || {};
    if (!apiKey) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });

    const system = 'You are a scene design coach. Return strict JSON. Be specific and brief.';
    const user = `SPINE:
LOGLINE: ${logline || ''}
THEME: ${theme || ''}

BEAT:
${beat?.label || ''} — ${beat?.summary || ''}

TASK: Return JSON:
{
  "what_must_happen": ["required outcome #1", "required outcome #2"],
  "checklist": ["clear objective", "credible opposition", "escalation", "turn/decision", "value shift", "setup/payoff"],
  "watchouts": ["cliche specific to this beat", "pacing risk"],
  "micro_prompts": { "open": "", "middle": "", "close": "" }
}`;

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.3,
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
