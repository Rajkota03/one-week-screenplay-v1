
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { idea, genre, tone } = req.body || {};
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });

    const system = 'You are a development exec. Rewrite loglines to maximize irony, specificity, and market hook. Include 3 bullet viability notes.';
    const user = `Idea: ${idea}\nGenre: ${genre}\nTone: ${tone}\nReturn: 5 loglines + viability notes.`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', // replace with exact model name you have access to
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ]
      })
    });

    const data = await openaiRes.json();
    if (data.error) {
      return res.status(500).json({ error: data.error.message || 'OpenAI error' });
    }
    const content = data?.choices?.[0]?.message?.content || '';
    return res.status(200).json({ result: content });
  } catch (e:any) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
