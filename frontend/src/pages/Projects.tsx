import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { Modal } from './Projects';

const statusMap: Record<string, string> = {
  NOT_STARTED: '未开展', IN_PROGRESS: '进行中', DELAYED: '延误', COMPLETED: '已完成', TERMINATED: '已终止'
};

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => { api.get('/api/projects').then(r => setProjects(r.data)); }, []);

  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await api.post('/api/projects', {
      name: fd.get('name'),
      client: fd.get('client'),
      manager: fd.get('manager'),
      startDate: fd.get('startDate'),
      dueDate: fd.get('dueDate'),
      remark: fd.get('remark')
    });
    setShowModal(false);
    const r = await api.get('/api/projects'); setProjects(r.data);
  };

  const filtered = projects.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()) || p.client.includes(filter));

  return (
    <div className="main-content">
      <div className="container">
        <div className="card">
          <div className="card-header">
            <h2>📁 项目列表</h2>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 新建项目</button>
          </div>
          <div className="filter-bar">
            <input placeholder="搜索项目..." value={filter} onChange={e => setFilter(e.target.value)} style={{ maxWidth: '200px' }} />
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>项目名称</th><th>客户/内部</th><th>负责人</th><th>启动日期</th><th>计划完成</th><th>状态</th><th>操作</th></tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td><Link to={`/projects/${p.id}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>{p.name}</Link></td>
                    <td>{p.client}</td>
                    <td>{p.manager || '-'}</td>
                    <td>{new Date(p.startDate).toLocaleDateString('zh-CN')}</td>
                    <td>{new Date(p.dueDate).toLocaleDateString('zh-CN')}</td>
                    <td><span className={`badge ${p.status === 'DELAYED' ? 'badge-delayed' : p.status === 'COMPLETED' ? 'badge-completed' : p.status === 'IN_PROGRESS' ? 'badge-in-progress' : p.status === 'TERMINATED' ? 'badge-delayed' : 'badge-not-started'}`}>{statusMap[p.status]}</span></td>
                    <td><Link to={`/projects/${p.id}`} className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>查看</Link></td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>暂无项目</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && <Modal title="新建项目" onClose={() => setShowModal(false)}>
        <form onSubmit={create}>
          <div className="form-group"><label>项目名称 *</label><input name="name" required /></div>
          <div className="form-row">
            <div className="form-group"><label>客户/内部</label><input name="client" value="内部" /></div>
            <div className="form-group"><label>项目负责人</label><input name="manager" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>启动日期 *</label><input name="startDate" type="date" required /></div>
            <div className="form-group"><label>计划完成日期 *</label><input name="dueDate" type="date" required /></div>
          </div>
          <div className="form-group"><label>备注</label><textarea name="remark" rows={3} /></div>
          <div className="modal-footer"><button type="button" className="btn btn-grey" onClick={() => setShowModal(false)}>取消</button><button type="submit" className="btn btn-primary">创建</button></div>
        </form>
      </Modal>}
    </div>
  );
}
