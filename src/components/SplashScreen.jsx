import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function SplashScreen({ onComplete, onRetry }) {
  const [status, setStatus] = useState('Initializing...');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!navigator.onLine) {
        setStatus('No internet connection');
        setError('offline');
        return;
      }

      setStatus('Checking connectivity...');
      setProgress(20);
      await new Promise((r) => setTimeout(r, 300));

      if (cancelled) return;
      setStatus('Connecting to server...');
      setProgress(50);
      try {
        const { data } = await api.get('/health');
        if (!data.db) throw new Error('DB unavailable');
      } catch {
        if (cancelled) return;
        setStatus('Server unreachable');
        setError('server');
        return;
      }

      if (cancelled) return;
      setStatus('Loading...');
      setProgress(80);
      await new Promise((r) => setTimeout(r, 200));

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
        background: error ? 'var(--c-red)' : 'var(--gradient-brand)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: error ? '0 4px 24px rgba(239,68,68,.4)' : '0 4px 24px rgba(205,0,99,.4)',
        overflow: 'hidden',
      }}>
        <span className="material-symbols-rounded" style={{ fontSize: 28, color: '#fff' }}>
          {error === 'offline' ? 'wifi_off' : error === 'server' ? 'cloud_off' : 'sync'}
        </span>
      </div>
      <div className="t-xl" style={{ letterSpacing: '-.5px' }}>Sai Laptop RMS</div>
      <div className="t-sm muted" style={{ textAlign: 'center', maxWidth: 260 }}>{status}</div>

      {error ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--c-text3)', textAlign: 'center', maxWidth: 240 }}>
            {error === 'offline' ? 'Please check your internet connection and try again.' : 'Cannot reach the server. Please check your connection or try again later.'}
          </div>
          <button onClick={() => { setError(null); setProgress(0); setStatus('Retrying...'); window.location.reload(); }} style={{
            padding: '10px 28px', borderRadius: 10, border: 'none',
            background: 'var(--gradient-brand)', color: '#fff',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 6 }}>refresh</span>
            Retry
          </button>
          <button onClick={onComplete} style={{
            padding: '8px 20px', borderRadius: 8,
            border: '1px solid var(--c-border)', background: 'transparent',
            color: 'var(--c-text3)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Continue Offline
          </button>
        </div>
      ) : (
        <div style={{ width: 200, height: 3, background: 'var(--c-surface2)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--gradient-brand)', borderRadius: 2, transition: 'width .3s' }} />
        </div>
      )}
    </div>
  );
}
