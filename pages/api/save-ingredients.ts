import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE! // server-only secret
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { projectId, theme_equation, world_brief, motifs } = req.body || {};
    if (!theme_equation) return res.status(400).json({ error: 'Missing theme_equation' });

    // upsert project theme + world into projects.refs
    const refs = { world_brief };
    let projId = projectId as string | null;

    if (projId) {
      const { data, error } = await supabase
        .from('projects')
        .update({ theme: theme_equation, refs })
        .eq('id', projId)
        .select('id')
        .single();
      if (error) throw error;
      projId = data.id;
    } else {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ title: 'Untitled', theme: theme_equation, refs }])
        .select('id')
        .single();
      if (error) throw error;
      projId = data.id;
    }

    // replace motifs for this project
    if (Array.isArray(motifs)) {
      await supabase.from('motifs').delete().eq('project_id', projId);
      const rows = motifs
        .filter((m: any) => m?.name)
        .map((m: any) => ({
          project_id: projId,
          name: m.name,
          meaning: m.meaning || null
        }));
      if (rows.length) {
        const { error: mErr } = await supabase.from('motifs').insert(rows);
        if (mErr) throw mErr;
      }
    }

    return res.status(200).json({ projectId: projId, ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
