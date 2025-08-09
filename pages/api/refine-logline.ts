
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { idea, genre, tone } = req.body || {};
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });

  const system =
  "You are a development exec. Rewrite loglines with maximum clarity and specificity, BUT DO NOT CHANGE THE PREMISE, CHARACTERS, OR SETTING. Preserve the core situation and constraints exactly.";
const user =
  `IDEA (CANONICAL): ${idea}
Genre: ${genre}
Tone: ${tone}
TASK: Produce 5 variations of the SAME premise, not new concepts. Keep: airport confinement, stateless status, bureaucratic conflict, warm/bittersweet tone. No new professions or plot engines. Each 25–40 words.
Also include 3 short viability notes that address clarity, hook, and market positioning.`;

const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
  body: JSON.stringify({
    model: 'gpt-4o',           // keep your working model
    temperature: 0.3,          // ↓ less creative drift
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
  })
