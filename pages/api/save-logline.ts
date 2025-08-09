import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

// We’ll store or update a single "project" row.
// For now, owner is null (no auth yet).

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { projectId, title, logline, genre, tone } = req.body || {};
    if (!logline) return res.status(400).json({ error: 'Missing logline' });

    if (projectId) {
      // Update existing project
      const { data, error } = await supabaseAdmin
        .from('projects')
        .update({ title: title || 'Untitled', logline, genre, tone })
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ project: data });
    } else {
      // Insert new project
      const { data, error } = await supabaseAdmin
        .from('projects')
        .insert([{ title: title || 'Untitled', logline, genre, tone }])
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ project: data });
    }
  } catch (e:any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
