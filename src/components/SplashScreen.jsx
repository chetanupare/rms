import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function SplashScreen({ onComplete }) {
  const [status, setStatus] = useState('Initializing...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setStatus('Checking connectivity...');
      setProgress(20);
      await new Promise((r) => setTimeout(r, 400));

      if (cancelled) return;
      setStatus('Connecting to server...');
      setProgress(40);
      try {
        const { data } = await api.get('/health');
        if (!data.db) throw new Error('DB unavailable');
      } catch {
        setStatus('Server unreachable — running in offline mode');
        setProgress(60);
        await new Promise((r) => setTimeout(r, 800));
      }

      if (cancelled) return;
      setStatus('Loading modules...');
      setProgress(80);
      await new Promise((r) => setTimeout(r, 300));

      if (cancelled) return;
      setProgress(100);
      setStatus('Ready');
      await new Promise((r) => setTimeout(r, 200));
      if (!cancelled) onComplete();
    }
    init();
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'var(--c-bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: 'var(--gradient-brand)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 24px rgba(205,0,99,.4)',
        overflow: 'hidden',
      }}>
        <img src="./logo.png" alt="Sai Laptop" style={{ width: 40, height: 40, objectFit: 'contain' }} />
      </div>
      <div className="t-xl" style={{ letterSpacing: '-.5px' }}>Sai Laptop RMS</div>
      <div className="t-sm muted">{status}</div>
      <div style={{ width: 200, height: 3, background: 'var(--c-surface2)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: 'var(--gradient-brand)', borderRadius: 2, transition: 'width .3s' }} />
      </div>
    </div>
  );
}
