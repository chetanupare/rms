import { useState, useEffect } from 'react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') setShowBanner(false);
    setDeferredPrompt(null);
  }

  if (!showBanner) return null;

  return (
    <div className="pwa-banner">
      <div className="pwa-banner-content">
        <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--c-accent3)' }}>install_mobile</span>
        <span className="t-sm">Install Sai Laptop RMS for quick access</span>
      </div>
      <div className="pwa-banner-actions">
        <button className="btn btn-primary" onClick={handleInstall} style={{ padding: '3px 8px', fontSize: 10 }}>
          Install
        </button>
        <button className="btn-icon" onClick={() => setShowBanner(false)} style={{ fontSize: 14 }}>
          <span className="material-symbols-rounded">close</span>
        </button>
      </div>
    </div>
  );
}
