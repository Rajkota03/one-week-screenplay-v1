
import { useState } from 'react';

type Tab = 'Logline' | 'Ingredients' | 'Characters' | 'Beats' | 'Scenes' | 'Polish' | 'Export';

export default function Home() {
  const [tab, setTab] = useState<Tab>('Logline');
  return (
    <div className="container">
      <h1>🎬 One-Week Screenplay Machine — V1</h1>
      <div className="tabbar">
        {(['Logline','Ingredients','Characters','Beats','Scenes','Polish','Export'] as Tab[]).map(t => (
          <button key={t} className={'tab ' + (tab===t ? 'active' : '')} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'Logline' && <LoglineTab />}
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

function LoglineTab() {
  const [idea, setIdea] = useState('A small-town food delivery driver becomes the target of a crime syndicate after witnessing a hit.');
  const [genre, setGenre] = useState('Thriller');
  const [tone, setTone] = useState('Grounded');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const onRefine = async () => {
    setLoading(true);
    setResult('');
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
      <div style={{marginTop:12}}>
        <button className="button" onClick={onRefine} disabled={loading}>
          {loading ? 'Refining…' : 'Refine Logline'}
        </button>
      </div>
      {result && (
        <div style={{marginTop:16}}>
          <label>AI Output</label>
          <pre className="card">{result}</pre>
        </div>
      )}
      <p style={{color:'#aaa', marginTop:8}}>Tip: the API uses your server-side OPENAI_API_KEY, so keep that set in Vercel.</p>
    </div>
  );
}
