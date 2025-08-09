import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE! // server-only secret
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { projectId, characters } = req.body || {};
    if (!projectId) return res.status(400).json({ error: 'Missing projectId' });
    if (!Array.isArray(characters)) return res.status(400).json({ error: 'characters must be an array' });

    // wipe & insert (simple for V1)
    await supabase.from('characters').delete().eq('project_id', projectId);

    const rows = characters.map((c: any) => ({
      project_id: projectId,
      name: c.name,
      want: c.want,
      need: c.need,
      wound: c.wound || null,
      misbelief: c.misbelief || null,
      fear: c.fear || null,
      moral_line: c.moral_line || null,
      vocal_rules: c.voice_rules || null,
      behavior_rules: c.behavior_tells || null
    })).filter(r => r.name && r.want);

    if (rows.length) {
      const { error } = await supabase.from('characters').insert(rows);
      if (error) throw error;
    }

    return res.status(200).json({ ok: true, count: rows.length });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
