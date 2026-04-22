import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import { api } from '../utils/api';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = () => api.get('/api/users').then(r => setUsers(r.data));

  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api.post('/api/users', {
        username: fd.get('username'),
        email: fd.get('email'),
        password: fd.get('password'),
        role: fd.get('role')
      });
      setShowModal(false);
      setError('');
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || '创建用户失败');
    }
  };

  const del = async (id: string) => {
    if (!confirm('确定删除该用户？')) return;
    try {
      await api.delete(`/api/users/${id}`);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || '删除失败');
    }
  };

  return (
    <div className="main-content">
      <div className="container">
        <div className="card">
          <div className="card-header">
            <h2>👥 用户管理</h2>
            <button className="btn btn-primary" onClick={() => { setShowModal(true); setError(''); }}>+ 新建用户</button>
          </div>
          {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '0.75rem', background: '#ffebee', borderRadius: '4px' }}>{error}</div>}
          <div className="table-wrap">
            <table>
              <thead><tr><th>用户名</th><th>登录邮箱</th><th>角色</th><th>创建时间</th><th>操作</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.username}</td>
                    <td>{u.email}</td>
                    <td><span className={`badge ${u.role === 'ADMIN' ? 'badge-delayed' : 'badge-in-progress'}`}>{u.role === 'ADMIN' ? '管理员' : '普通用户'}</span></td>
                    <td>{new Date(u.createdAt).toLocaleDateString('zh-CN')}</td>
                    <td><button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => del(u.id)}>删除</button></td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>暂无用户</td></tr>}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666' }}>当前用户数：{users.length} / 10</div>
        </div>
      </div>

      {showModal && <Modal title="新建用户" onClose={() => setShowModal(false)}>
        <form onSubmit={create}>
          <div className="form-group"><label>用户名 *</label><input name="username" required /></div>
          <div className="form-group"><label>登录邮箱 *</label><input name="email" type="email" required /></div>
          <div className="form-group"><label>登录密码 *</label><input name="password" type="password" required minLength={6} /></div>
          <div className="form-group"><label>角色 *</label>
            <select name="role"><option value="USER">普通用户</option><option value="ADMIN">管理员</option></select>
          </div>
          {error && <div style={{ color: 'var(--danger)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>{error}</div>}
          <div className="modal-footer"><button type="button" className="btn btn-grey" onClick={() => setShowModal(false)}>取消</button><button type="submit" className="btn btn-primary">创建</button></div>
        </form>
      </Modal>}
    </div>
  );
}
