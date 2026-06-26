import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
      <span className="material-symbols-rounded" style={{ fontSize: 64, color: 'var(--c-text3)' }}>error_outline</span>
      <div className="t-2xl">404</div>
      <div className="t-md muted">Page not found</div>
      <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
    </div>
  );
}
