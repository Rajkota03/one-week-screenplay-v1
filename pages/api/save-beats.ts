import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { projectId, beats } = req.body || {};
    if (!projectId) return res.status(400).json({ error: 'Missing projectId' });
    if (!Array.isArray(beats)) return res.status(400).json({ error: 'beats must be an array' });

    // wipe existing beats for this project (V1 simple approach)
    await supabase.from('beats').delete().eq('project_id', projectId);

    const rows = beats.map((b:any) => ({
      project_id: projectId,
      idx: b.num ?? null,
      label: b.label || null,
      summary: b.summary || null,
      purpose: b.purpose || null,
      stakes: b.stakes || null
    })).filter(r => r.label || r.summary);

    if (rows.length) {
      const { error } = await supabase.from('beats').insert(rows);
      if (error) throw error;
    }
    return res.status(200).json({ ok: true, count: rows.length });
  } catch (e:any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
