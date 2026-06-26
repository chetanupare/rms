import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';


export default function Login() {
  const { user, login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username || !password) return addToast('Please fill in all fields', 'warning');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message;
      if (!err.response) {
        addToast('Cannot connect to server — API may not be running', 'error');
      } else {
        addToast(msg || 'Invalid credentials', 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src="./logo.png" alt="Sai Laptop" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'contain', marginBottom: 4 }} />
          <div className="t-lg" style={{ letterSpacing: '-.5px' }}>Sai Laptop & Computer</div>
          <div className="t-xs muted">Service Management System</div>
        </div>
        <div className="login-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <div className="form-input-wrap">
                <span className="material-symbols-rounded si">person</span>
                <input className="form-input" placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="form-input-wrap">
                <span className="material-symbols-rounded si">lock</span>
                <input className="form-input" type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '7px 0' }} disabled={loading}>
              {loading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : 'Sign In'}
            </button>
          </form>
        </div>
        <div className="login-footer">
          <a href="#"><span>Sai Laptop & Computer Gallery</span> — Wani, MH</a>
        </div>
      </div>
    </div>
  );
}
