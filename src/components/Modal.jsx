import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={wide ? { width: 'min(800px, 92vw)' } : {}}>
        <div className="flex items-center justify-between mb-3">
          <div className="t-lg">{title}</div>
          <button className="btn-icon" onClick={onClose}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
