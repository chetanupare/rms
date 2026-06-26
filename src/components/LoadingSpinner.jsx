export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12 }}>
      <div className="spinner" style={{ width: 32, height: 32, border: '3px solid var(--c-border)', borderTopColor: 'var(--c-accent)' }} />
      <div className="t-xs muted">{text}</div>
    </div>
  );
}
