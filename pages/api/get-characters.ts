import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const { data, error } = await sb
    .from('characters')
    .select('name, want, need, wound, misbelief, fear, moral_line, vocal_rules, behavior_rules, role')
    .eq('project_id', id)
    .order('name', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  // map back to the JSON shape used in the UI
  const characters = (data || []).map(c => ({
    name: c.name,
    role: c.role || 'ally',
    want: c.want,
    need: c.need,
    wound: c.wound,
    misbelief: c.misbelief,
    fear: c.fear,
    moral_line: c.moral_line,
    voice_rules: c.vocal_rules,
    behavior_tells: c.behavior_rules,
  }));
  res.status(200).json({ characters });
}
