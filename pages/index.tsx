import { useEffect, useState } from 'react';

type Tab = 'Logline' | 'Ingredients' | 'Characters' | 'Beats' | 'Scenes' | 'Polish' | 'Export';

export default function Home() {
  const [tab, setTab] = useState<Tab>('Logline');
  const [projectId, setProjectId] = useState<string | null>(null);

  // Pull a saved projectId from localStorage on first load
  useEffect(() => {
    const pid = typeof window !== 'undefined' ? window.localStorage.getItem('projectId') : null;
    if (pid) setProjectId(pid);
  }, []);

  return (
    <div className="container">
      <h1>🎬 One-Week Screenplay Machine — V1</h1>
      <div className="tabbar">
        {(['Logline','Ingredients','Characters','Beats','Scenes','Polish','Export'] as Tab[]).map(t => (
          <button key={t} className={'tab ' + (tab===t ? 'active' : '')} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Logline' && <LoglineTab projectId={projectId} setProjectId={setProjectId} />}
      {tab === 'Ingredients' && <Placeholder title="Ingredients" />}
      {tab === 'Characters' && <Placeholder title="Characters" />}
      {tab === 'Beats' && <Placeholder title="Beats" />}
      {tab === 'Scenes' && <Placeholder title="Scenes" />}
      {tab === 'Polish' && <Placeholder title="Polish" />}
      {tab === 'Export' && <Placeholder title="Export" />}
    </div>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <p>This tab will be wired next. For now, focus on the Logline tab to verify the pipeline.</p>
    </div>
  );
}

function LoglineTab({
  projectId,
  setProjectId
}: {
  projectId: string | null;
  setProjectId: (v: string | null) => void;
}) {
  // Pre-filled with The Terminal style test
  const [idea, setIdea] = useState(
    "A stateless traveler is trapped in a U.S. airport when a coup invalidates his passport; unable to enter the country or fly home, he must outmaneuver bureaucracy and build a fragile new community while fighting for a way forward."
  );
  const [genre, setGenre] = useState('Comedy-Drama');
  const [tone, setTone] = useState('Heartwarming, bittersweet, hopeful');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // If you already have a projectId, you can optionally fetch and prefill
  useEffect(() => {
    const fetchExisting = async () => {
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
      } catch { /* ignore */ }
    };
    fetchExisting();
  }, [projectId]);

  const onRefine = async () => {
    setLoading(true);
    setResult('');
    setStatus(null);
    try {
      const res = await fetch('/api/refine-logline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, genre, tone })
      });
      const data = await res.json();
      setResult(data.result || JSON.stringify(data, null, 2));
    } catch (e:any) {
      setResult('Error: ' + e?.message);
    } finally {
      setLoading(false);
    }
  };

  const saveToDb = async (textToSave: string) => {
    setSaving(true);
    setStatus(null);
    try {
      const payload: any = {
        title: 'Test Project — Terminal',
        logline: textToSave,
        genre,
        tone
      };
      if (projectId) payload.projectId = projectId;

      const res = await fetch('/api/save-logline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data?.project?.id) {
        setProjectId(data.project.id);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('projectId', data.project.id);
        }
        setStatus(`Saved ✔ Project ${data.project.id.slice(0,8)}…`);
      } else if (data?.error) {
        setStatus('Save failed: ' + data.error);
      } else {
        setStatus('Saved (no id returned)');
      }
    } catch (e:any) {
      setStatus('Save failed: ' + (e?.message || String(e)));
    } finally {
      setSaving(false);
    }
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
          {loading ? 'Refining…' : 'Refine Logline'}
        </button>
        <button className="button" onClick={() => saveToDb(result || idea)} disabled={saving || !(result || idea)}>
          {saving ? 'Saving…' : 'Save to Project'}
        </button>
      </div>

      {status && <p style={{color:'#8b8', marginTop:8}}>{status}</p>}

      {result && (
        <div style={{marginTop:16}}>
          <label>AI Output</label>
          <pre className="card">{result}</pre>
        </div>
      )}

      <p style={{color:'#aaa', marginTop:8}}>
        Tip: the API uses your server-side OPENAI_API_KEY; Supabase writes use the server-side Service Role (kept secret).
      </p>
    </div>
  );
}
