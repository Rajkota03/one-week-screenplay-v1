// force redeploy
import { useEffect, useState } from 'react';
import CharactersTab from '../components/CharactersTab';
import BeatsTab from '../components/BeatsTab';

type StageTab = 'Logline' | 'Ingredients' | 'Characters' | 'Beats' | 'Scenes' | 'Polish' | 'Export';

export default function Home() {
  const [tab, setTab] = useState<StageTab>('Logline');
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pid = window.localStorage.getItem('projectId');
    if (pid) setProjectId(pid);
  }, []);

  return (
    <div className="container">
      <h1>🎬 One-Week Screenplay Machine — V1</h1>

      <div className="tabbar">
        {(['Logline','Ingredients','Characters','Beats','Scenes','Polish','Export'] as StageTab[]).map(t => (
          <button key={t} className={'tab ' + (tab===t ? 'active' : '')} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Logline' && <LoglineTab projectId={projectId} setProjectId={setProjectId} />}
      {tab === 'Ingredients' && <IngredientsTab projectId={projectId} setProjectId={setProjectId} />}
      {tab === 'Characters' && <CharactersTab projectId={projectId} />}
      {tab === 'Beats' && <BeatsTab projectId={projectId} />}
      {tab !== 'Logline' && tab !== 'Ingredients' && tab !== 'Characters' && tab !== 'Beats' && <Placeholder title={tab} />}
    </div>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <p>We’ll wire this next.</p>
    </div>
  );
}

/* ---------- Logline (inline) ---------- */
function LoglineTab({ projectId, setProjectId }:{
  projectId:string|null;
  setProjectId:(v:string|null)=>void;
}) {
  const [idea, setIdea] = useState(
    'A stateless traveler is trapped in a U.S. airport when a coup invalidates his passport; unable to enter the country or fly home, he must outmaneuver bureaucracy and build a fragile new community while fighting for a way forward.'
  );
  const [genre, setGenre] = useState('Comedy-Drama');
  const [tone, setTone] = useState('Heartwarming, bittersweet, hopeful');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!projectId) return;
      try {
        const r = await fetch(`/api/get-project?id=${projectId}`);
        const d = await r.json();
        if (d?.project) {
          if (d.project.logline) setIdea(d.project.logline);
          if (d.project.genre) setGenre(d.project.genre);
          if (d.project.tone) setTone(d.project.tone);
          setStatus(`Loaded project ${projectId.slice(0,8)}…`);
        }
      } catch {}
    };
    run();
  }, [projectId]);

  const onRefine = async () => {
    setLoading(true); setResult(''); setStatus(null);
    const res = await fetch('/api/refine-logline', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ idea, genre, tone })
    });
    const data = await res.json();
    setResult(data.result || JSON.stringify(data, null, 2));
    setLoading(false);
  };

  const saveToDb = async (textToSave: string) => {
    setSaving(true); setStatus(null);
    const payload:any = { title:'Untitled', logline:textToSave, genre, tone };
    if (projectId) payload.projectId = projectId;
    const r = await fetch('/api/save-logline', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const d = await r.json();
    if (d?.project?.id) {
      setProjectId(d.project.id);
      if (typeof window !== 'undefined') window.localStorage.setItem('projectId', d.project.id);
      setStatus(`Saved ✔ Project ${d.project.id.slice(0,8)}…`);
    } else setStatus('Save failed');
    setSaving(false);
  };

  return (
    <div className="card">
      <h2>Stage 1 — Logline & Core Concept</h2>
      <div className="row">
        <div style={{flex:1}}>
          <label>Idea</label>
          <textarea rows={4} value={idea} onChange={e=>setIdea(e.target.value)} />
        </div>
      </div>
      <div className="row">
        <div style={{flex:1}}>
          <label>Genre</label>
          <input className="input" value={genre} onChange={e=>setGenre(e.target.value)} />
        </div>
        <div style={{flex:1}}>
          <label>Tone</label>
          <input className="input" value={tone} onChange={e=>setTone(e.target.value)} />
        </div>
      </div>
      <div style={{marginTop:12, display:'flex', gap:8}}>
        <button className="button" onClick={onRefine} disabled={loading}>
          {loading?'Refining…':'Refine Logline'}
        </button>
        <button className="button" onClick={()=>saveToDb(result || idea)} disabled={saving || !(result || idea)}>
          {saving?'Saving…':'Save to Project'}
        </button>
      </div>
      {status && <p style={{color:'#8b8', marginTop:8}}>{status}</p>}
      {result && (<div style={{marginTop:16}}><label>AI Output</label><pre className="card">{result}</pre></div>)}
    </div>
  );
}

/* ---------- Ingredients (inline) ---------- */
function IngredientsTab({ projectId, setProjectId }:{
  projectId:string|null;
  setProjectId:(v:string|null)=>void;
}) {
  const [theme, setTheme] = useState('');
  const [world, setWorld] = useState('');
  const [motifsText, setMotifsText] = useState('');
  const [aiOut, setAiOut] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!projectId) return;
      try {
        const r = await fetch(`/api/get-project?id=${projectId}`);
        const d = await r.json();
        if (d?.project) {
          if (d.project.theme) setTheme(d.project.theme);
          if (d.project.refs?.world_brief) setWorld(d.project.refs.world_brief);
          setStatus(`Loaded project ${projectId.slice(0,8)}…`);
        }
      } catch {}
    };
    run();
  }, [projectId]);

  const refine = async () => {
    setLoading(true); setStatus(null);
    const res = await fetch('/api/refine-ingredients', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ logline: 'Use Stage 1 canonical premise', genre:'', tone:'' })
    });
    const data = await res.json();
    setAiOut(data);
    if (data?.theme_equation) setTheme(data.theme_equation);
    if (data?.world_brief) setWorld(data.world_brief);
    if (Array.isArray(data?.motifs)) {
      setMotifsText(data.motifs.map((m:any)=>`${m.name}:${m.meaning||''}`).join(', '));
    }
    setLoading(false);
  };

  const save = async () => {
    setSaving(true); setStatus(null);
    const motifs = motifsText.split(',').map(s=>{
      const [name, ...rest] = s.trim().split(':');
      return name ? { name, meaning: rest.join(':').trim() || null } : null;
    }).filter(Boolean) as any[];
    const res = await fetch('/api/save-ingredients', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ projectId, theme_equation: theme, world_brief: world, motifs })
    });
    const data = await res.json();
    if (data?.projectId) {
      setProjectId(data.projectId);
      if (typeof window !== 'undefined') window.localStorage.setItem('projectId', data.projectId);
      setStatus(`Saved ✔ Project ${data.projectId.slice(0,8)}…`);
    } else setStatus('Save failed');
    setSaving(false);
  };

  return (
    <div className="card">
      <h2>Stage 2 — Core Ingredients</h2>
      <label>Theme Equation (Truby):</label>
      <textarea rows={3} value={theme} onChange={e=>setTheme(e.target.value)} />
      <label style={{marginTop:12}}>World / Tone Brief (1 paragraph):</label>
      <textarea rows={4} value={world} onChange={e=>setWorld(e.target.value)} />
      <label style={{marginTop:12}}>Motifs (comma-separated: name:meaning)</label>
      <input className="input" value={motifsText} onChange={e=>setMotifsText(e.target.value)} placeholder="watch: time running out, rain: cleansing" />
      <div style={{marginTop:12, display:'flex', gap:8}}>
        <button className="button" onClick={refine} disabled={loading}>
          {loading?'Thinking…':'Refine Ingredients'}
        </button>
        <button className="button" onClick={save} disabled={saving || !theme}>
          {saving?'Saving…':'Save Ingredients'}
        </button>
      </div>
      {aiOut && (<div style={{marginTop:16}}><label>AI Suggestions (JSON)</label><pre className="card">{JSON.stringify(aiOut, null, 2)}</pre></div>)}
    </div>
  );
}
