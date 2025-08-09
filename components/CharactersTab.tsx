import { useState, useEffect } from 'react';

export default function CharactersTab({ projectId }) {
  const [jsonText, setJsonText] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!projectId) return;
      try {
        const r = await fetch(`/api/get-characters?id=${projectId}`);
        const d = await r.json();
        if (Array.isArray(d?.characters) && d.characters.length) {
          setJsonText(JSON.stringify({ characters: d.characters }, null, 2));
          setStatus(`Loaded ${d.characters.length} characters`);
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
