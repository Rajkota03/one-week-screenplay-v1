import { useState, useEffect } from 'react';

export default function BeatsTab({ projectId }) {
  const [jsonText, setJsonText] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!projectId) return;
      try {
        const r = await fetch(`/api/get-beats?id=${projectId}`);
        const d = await r.json();
        if (Array.isArray(d?.beats) && d.beats.length) {
          setJsonText(JSON.stringify({ beats: d.beats }, null, 2));
          setStatus(`Loaded ${d.beats.length} beats`);
        }
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [projectId]);

  return (
    <div>
      <textarea
        value={jsonText}
        onChange={e => setJsonText(e.target.value)}
        style={{ width: '100%', height: '300px' }}
      />
      <p>{status}</p>
    </div>
  );
}
