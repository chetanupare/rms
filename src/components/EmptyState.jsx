export default function EmptyState({ icon = 'inbox', title = 'Nothing here yet', description = '', action, actionLabel, onAction }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(108,99,255,.08)', border: '1px solid rgba(108,99,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <span className="material-symbols-rounded" style={{ fontSize: 28, color: 'var(--c-accent3)' }}>{icon}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text)', marginBottom: 4 }}>{title}</div>
      {description && <div style={{ fontSize: 11, color: 'var(--c-text2)', maxWidth: 280, lineHeight: 1.5, marginBottom: action ? 16 : 0 }}>{description}</div>}
      {action && <button type="button" className="btn btn-primary" onClick={onAction}>{actionLabel || action}</button>}
    </div>
  );
}
