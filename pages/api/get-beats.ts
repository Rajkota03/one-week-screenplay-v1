import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const { data, error } = await sb
    .from('beats')
    .select('idx, label, summary, purpose, stakes')
    .eq('project_id', id)
    .order('idx', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  const beats = (data || []).map(b => ({
    num: b.idx, label: b.label, summary: b.summary, purpose: b.purpose, stakes: b.stakes
  }));
  res.status(200).json({ beats });
}
