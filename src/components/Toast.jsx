import { useToast } from '../context/ToastContext';

const ICONS = { success: 'check_circle', error: 'error', info: 'info', warning: 'warning' };
const COLORS = {
  success: { bg: 'rgba(16,185,129,.12)', border: 'rgba(16,185,25,.25)', icon: '#34d399' },
  error: { bg: 'rgba(239,68,68,.12)', border: 'rgba(239,68,68,.25)', icon: '#f87171' },
  info: { bg: 'rgba(96,165,250,.12)', border: 'rgba(96,165,250,.25)', icon: '#60a5fa' },
  warning: { bg: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.25)', icon: '#fbbf24' },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();
  if (!toasts.length) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8,
      maxWidth: 360, width: '100%', pointerEvents: 'none',
    }}>
      {toasts.map((t) => {
        const c = COLORS[t.type] || COLORS.info;
        return (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 8,
              background: c.bg, border: `1px solid ${c.border}`,
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0,0,0,.4)',
              pointerEvents: 'auto', cursor: 'pointer',
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: c.icon, flexShrink: 0 }}>
              {ICONS[t.type]}
            </span>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--c-text)', lineHeight: 1.4 }}>
              {t.message}
            </span>
          </div>
        );
      })}
    </div>
  );
}
