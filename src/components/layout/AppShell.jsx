import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

import { useBranch } from '../../context/BranchContext';
import { useNotification } from '../../context/NotificationContext';
import { useOffline } from '../../context/OfflineContext';
import { getInitials } from '../../utils/helpers';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'grid_view', path: '/dashboard', roles: ['Admin', 'Technician'] },
  { label: 'New Service', icon: 'add_circle', path: '/service/new', roles: ['Admin', 'Technician'] },
  { label: 'Customers', icon: 'people', path: '/customers', roles: ['Admin', 'Technician'] },
  { label: 'Repairs', icon: 'build', path: '/repairs', roles: ['Admin', 'Technician'] },
  { label: 'Technicians', icon: 'engineering', path: '/technicians', roles: ['Admin'] },
  { label: 'Billing', icon: 'receipt_long', path: '/billing', roles: ['Admin'] },
  { label: 'Reports', icon: 'bar_chart', path: '/reports', roles: ['Admin'] },
  { label: 'Daily Registrar', icon: 'account_balance', path: '/register', roles: ['Admin'] },
  { label: 'Settings', icon: 'settings', path: '/settings', roles: ['Admin'] },
  { label: 'Data Warehouse', icon: 'database', path: '/data-warehouse', roles: ['Admin'] },
  { label: 'Inventory', icon: 'inventory_2', path: '/inventory', roles: ['Admin'] },
  { label: 'Warranty & RMA', icon: 'verified', path: '/warranty', roles: ['Admin'] },
];

export default function AppShell() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { branch, setBranch, branches } = useBranch();
  const { permission, requestPermission } = useNotification();
  const { isOnline, queueCount } = useOffline();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState(true);
  const [serverStatus, setServerStatus] = useState(true);
  const [searchVal, setSearchVal] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('rms_theme') || 'dark');
  const branchRef = useRef(null);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('rms_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (branchRef.current && !branchRef.current.contains(e.target)) setBranchOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (window.electronAPI?.isElectron) {
      window.api.getHealth().then((h) => { setDbStatus(h.db); setServerStatus(h.server); });
      window.api.onHealthUpdate((h) => { setDbStatus(h.db); setServerStatus(h.server); });
      return;
    }
    async function check() {
      try {
        const { data } = await api.get('/health');
        setDbStatus(data.db);
        setServerStatus(true);
      } catch {
        setDbStatus(false);
        setServerStatus(false);
      }
    }
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  function handleSearch(e) {
    if (e.key === 'Enter' && searchVal.trim()) {
      window.dispatchEvent(new CustomEvent('global-search', { detail: encodeURIComponent(searchVal.trim()) }));
      setSearchVal('');
    }
  }

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.some(r => r.toLowerCase() === (user?.role || '').toLowerCase()));

  return (
    <div id="app">
      <div className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <div className="app-layout">
        <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="sidebar-brand">
            <img src="./logo.png" alt="Sai Laptop" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain' }} />
            <div>
              <div className="brand-name">Sai Laptop</div>
              <div className="brand-sub">Service Management</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section">Main Menu</div>
            {visibleItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="material-symbols-rounded">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="user-avatar">{getInitials(user?.username || 'User')}</div>
            <div className="user-info">
              <div className="user-name">{user?.username || 'User'}</div>
              <div className="user-role">{user?.role || 'user'}</div>
            </div>
            <div className="flex gap-1" style={{ marginLeft: 'auto' }}>
              <button onClick={logout} title="Logout">
                <span className="material-symbols-rounded">logout</span>
              </button>
            </div>
          </div>
        </aside>

        <div className="main-area">
          {!isOnline && (
            <div style={{ background: 'var(--c-red)', padding: '4px 16px', fontSize: 10, fontWeight: 700, textAlign: 'center', color: '#fff' }}>
              Offline — {queueCount} pending operations {queueCount > 0 ? `(${queueCount} in queue)` : ''}
            </div>
          )}
          <header className="top-header">
            <button type="button" className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <span className="material-symbols-rounded">menu</span>
            </button>
            <div className="header-search">
              <span className="material-symbols-rounded si">search</span>
              <input
                placeholder="Search by Job ID or Mobile..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>
            <div className="header-right">
              <span className={`status-dot${dbStatus ? ' online' : ''}`} title={dbStatus ? 'DB Connected' : 'DB Disconnected'}>
                <span className="material-symbols-rounded" style={{ fontSize: 14 }}>cloud</span>
              </span>
              <span className={`status-dot${(window.electronAPI?.isElectron ? serverStatus : isOnline) ? ' online' : ''}`} title={(window.electronAPI?.isElectron ? serverStatus : isOnline) ? 'Server Online' : 'Server Offline'}>
                <span className="material-symbols-rounded" style={{ fontSize: 14 }}>{(window.electronAPI?.isElectron ? serverStatus : isOnline) ? 'wifi' : 'wifi_off'}</span>
              </span>
              <button
                className="hbtn"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <span className="material-symbols-rounded">
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
              <button
                className={`hbtn${permission === 'granted' ? ' notif-on' : ''}`}
                onClick={requestPermission}
                title={permission === 'granted' ? 'Notifications enabled' : 'Enable notifications'}
              >
                <span className="material-symbols-rounded">
                  {permission === 'granted' ? 'notifications_active' : 'notifications_none'}
                </span>
              </button>
              <div className="branch-selector" ref={branchRef}>
                <button className="branch-btn" onClick={() => setBranchOpen(!branchOpen)} title="Switch branch">
                  <span className="material-symbols-rounded">store</span>
                  {branch}
                  <span className="material-symbols-rounded" style={{ marginLeft: 1 }}>expand_more</span>
                </button>
                {branchOpen && (
                  <div className="branch-dropdown">
                    {branches.map((b) => (
                      <button
                        key={b}
                        className={`branch-option${b === branch ? ' active' : ''}`}
                        onClick={() => { setBranch(b); setBranchOpen(false); }}
                      >
                        {b === branch && <span className="material-symbols-rounded" style={{ fontSize: 12, color: 'var(--c-accent)' }}>check</span>}
                        {b !== branch && <span style={{ width: 12 }} />}
                        {b}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="page-area">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
