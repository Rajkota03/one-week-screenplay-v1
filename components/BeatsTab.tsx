import { useEffect, useMemo, useState } from 'react';

type Beat = { num:number; label:string; summary:string; purpose?:string|null; stakes?:string|null };

export default function BeatsTab({ projectId }:{ projectId:string|null; }) {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [coach, setCoach] = useState<any>(null); // validation or scene tips
  const [spine, setSpine] = useState<{logline?:string; theme?:string}>({});

  // Load spine (logline + theme) for validators
  useEffect(() => {
    const loadSpine = async () => {
      if (!projectId) return;
      try {
        const r = await fetch(`/api/get-project?id=${projectId}`);
        const d = await r.json();
        if (d?.project) {
          setSpine({ logline: d.project.logline || '', theme: d.project.theme || '' });
        }
      } catch {}
    };
    loadSpine();
  }, [projectId]);

  // Load saved beats
  useEffect(() => {
    const load = async () => {
      if (!projectId) return;
      try {
        const r = await fetch(`/api/get-beats?id=${projectId}`);
        const d = await r.json();
        if (Array.isArray(d?.beats) && d.beats.length) {
          const normalized = d.beats.map((b:any, i:number) => ({
            num: b.num ?? i+1,
            label: b.label || '',
            summary: b.summary || ''
          }));
          setBeats(normalized);
          setStatus(`Loaded ${normalized.length} beats`);
        } else {
          setBeats([]);
          setStatus('No saved beats yet. Generate or add manually.');
        }
      } catch (e) { setStatus('Failed to load beats'); }
    };
    load();
  }, [projectId]);

  const onChangeBeat = (idx:number, field:'label'|'summary', value:string) => {
    setBeats(prev => prev.map((b,i)=> i===idx ? {...b, [field]: value} : b));
  };

  const generate40 = async () => {
    setBusy(true); setStatus(null);
    const r = await fetch('/api/refine-beats', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ logline: 'Use project premise' })
    });
    const d = await r.json();
    const arr = (d?.beats || []).map((b:any)=>({ num:b.num, label:b.label||'', summary:b.summary||'' }));
    setBeats(arr);
    setBusy(false);
    setStatus(`Generated ${arr.length} beats`);
  };

  const save = async () => {
    if (!projectId) { setStatus('No projectId. Save earlier stages first.'); return; }
    setBusy(true); setStatus(null);
    const r = await fetch('/api/save-beats', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ projectId, beats: beats.map(b=>({ num:b.num, label:b.label, summary:b.summary })) })
    });
    const d = await r.json();
    setBusy(false);
    setStatus(d?.ok ? `Saved ✔ ${d.count} beats` : `Save failed: ${d?.error||'unknown'}`);
  };

  const validateBeat = async (idx:number) => {
    const beat = beats[idx];
    if (!beat) return;
    setSelected(idx); setCoach(null); setBusy(true);
    const r = await fetch('/api/validate-beat', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ logline: spine.logline || '', theme: spine.theme || '', beat: { label: beat.label, summary: beat.summary } })
    });
    const d = await r.json();
    setCoach({ type:'validate', data: d });
    setBusy(false);
  };

  const sceneTips = async (idx:number) => {
    const beat = beats[idx];
    if (!beat) return;
    setSelected(idx); setCoach(null); setBusy(true);
    const r = await fetch('/api/scene-expectations', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ logline: spine.logline || '', theme: spine.theme || '', beat: { label: beat.label, summary: beat.summary } })
    });
    const d = await r.json();
    setCoach({ type:'scene', data: d });
    setBusy(false);
  };

  const applyRewrite = () => {
    if (!coach || coach.type !== 'validate' || selected==null) return;
    const suggestion = coach?.data?.rewrite_suggestion as string;
    if (!suggestion) return;
    setBeats(prev => prev.map((b,i)=> i===selected ? {...b, summary: suggestion} : b));
  };

  const selectedBeat = useMemo(()=> selected!=null ? beats[selected] : null, [selected, beats]);

  return (
    <div className="card">
      <h2>Stage 4 — 40-Beat Spine (Human-in-the-Loop)</h2>

      <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
        <button className="button" onClick={generate40} disabled={busy}>{busy?'Working…':'Generate 40 Beats (optional)'}</button>
        <button className="button" onClick={save} disabled={busy || beats.length===0}>{busy?'Saving…':'Save Beats'}</button>
        {status && <span style={{marginLeft:8, color:'#8b8'}}>{status}</span>}
      </div>

      {/* Beats table */}
      <div style={{marginTop:12, overflowX:'auto'}}>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr>
              <th style={{textAlign:'left'}}>#</th>
              <th style={{textAlign:'left'}}>Label</th>
              <th style={{textAlign:'left'}}>Summary</th>
              <th>Coach</th>
            </tr>
          </thead>
          <tbody>
            {beats.map((b, i) => (
              <tr key={i} style={{borderTop:'1px solid #333'}}>
                <td style={{verticalAlign:'top', padding:'6px 8px', width:40}}>{b.num || i+1}</td>
                <td style={{verticalAlign:'top', padding:'6px 8px', minWidth:160}}>
                  <input className="input" value={b.label} onChange={e=>onChangeBeat(i, 'label', e.target.value)} placeholder="e.g., Catalyst / Break into 2" />
                </td>
                <td style={{verticalAlign:'top', padding:'6px 8px'}}>
                  <textarea rows={2} value={b.summary} onChange={e=>onChangeBeat(i, 'summary', e.target.value)} placeholder="1–2 sentence beat summary" />
                </td>
                <td style={{verticalAlign:'top', padding:'6px 8px', whiteSpace:'nowrap'}}>
                  <button className="button" onClick={()=>validateBeat(i)} disabled={busy}>Validate</button>
                  <button className="button" onClick={()=>sceneTips(i)} style={{marginLeft:6}} disabled={busy}>Scene Tips</button>
                </td>
              </tr>
            ))}
            {beats.length === 0 && (
              <tr><td colSpan={4} style={{padding:12, color:'#aaa'}}>No beats yet. Generate or start typing labels and summaries above, then Save.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Coaching side panel */}
      {selectedBeat && coach && (
        <div className="card" style={{marginTop:12}}>
          <h3>
            Coach — Beat {selectedBeat.num || (selected!+1)}: {selectedBeat.label || '(untitled)'}
          </h3>

          {coach.type === 'validate' && (
            <>
              <p><strong>Scores</strong></p>
              <pre className="card" style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(coach.data?.score, null, 2)}</pre>
              <p><strong>Diagnostics</strong></p>
              <pre className="card" style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(coach.data?.diagnostics, null, 2)}</pre>
              {Array.isArray(coach.data?.notes) && coach.data.notes.length>0 && (
                <>
                  <p><strong>Notes</strong></p>
                  <ul>{coach.data.notes.map((n:string, idx:number)=><li key={idx}>{n}</li>)}</ul>
                </>
              )}
              {coach.data?.rewrite_suggestion && (
                <div style={{marginTop:8}}>
                  <p><strong>Rewrite Suggestion</strong></p>
                  <pre className="card" style={{whiteSpace:'pre-wrap'}}>{coach.data.rewrite_suggestion}</pre>
                  <button className="button" onClick={applyRewrite}>Apply Suggestion</button>
                </div>
              )}
            </>
          )}

          {coach.type === 'scene' && (
            <>
              <p><strong>What Must Happen</strong></p>
              <ul>{(coach.data?.what_must_happen || []).map((x:string, i:number)=><li key={i}>{x}</li>)}</ul>
              <p><strong>Checklist</strong></p>
              <ul>{(coach.data?.checklist || []).map((x:string, i:number)=><li key={i}>{x}</li>)}</ul>
              {Array.isArray(coach.data?.watchouts) && coach.data.watchouts.length>0 && (
                <>
                  <p><strong>Watchouts</strong></p>
                  <ul>{coach.data.watchouts.map((x:string, i:number)=><li key={i}>{x}</li>)}</ul>
                </>
              )}
              {coach.data?.micro_prompts && (
                <>
                  <p><strong>Micro-prompts</strong></p>
                  <pre className="card" style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(coach.data.micro_prompts, null, 2)}</pre>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
