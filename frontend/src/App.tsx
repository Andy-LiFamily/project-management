import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, ReactNode } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import FeatureDetail from './pages/FeatureDetail';
import Vendors from './pages/Vendors';
import Users from './pages/Users';

function Navbar({ user, onLogout }: { user: any; onLogout: () => void }) {
  const location = useLocation();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <nav className="navbar">
      <h1>📋 项目管理系统</h1>
      <div className="nav-links">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>首页</Link>
        <Link to="/projects" className={location.pathname.startsWith('/projects') || location.pathname.startsWith('/features') ? 'active' : ''}>项目</Link>
        <Link to="/vendors" className={location.pathname === '/vendors' ? 'active' : ''}>供应商</Link>
        {isAdmin && <Link to="/users" className={location.pathname === '/users' ? 'active' : ''}>用户管理</Link>}
      </div>
      <div className="nav-right">
        <span style={{ fontSize: '0.85rem' }}>{user?.username}</span>
        <button onClick={onLogout}>退出</button>
      </div>
    </nav>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>加载中...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function App() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <BrowserRouter>
      <div className="app">
        {user && <Navbar user={user} onLogout={logout} />}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
          <Route path="/features/:id" element={<ProtectedRoute><FeatureDetail /></ProtectedRoute>} />
          <Route path="/vendors" element={<ProtectedRoute><Vendors /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
