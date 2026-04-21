import { useState } from 'react';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/auth/login', { email, password });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || '登录失败');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>🔐 项目管理系统</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>登录邮箱</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="请输入邮箱" required />
          </div>
          <div className="form-group">
            <label>登录密码</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="请输入密码" required />
          </div>
          {error && <div style={{ color: 'var(--danger)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>{error}</div>}
          <button type="submit" className="btn btn-primary">登录</button>
        </form>
      </div>
    </div>
  );
}
