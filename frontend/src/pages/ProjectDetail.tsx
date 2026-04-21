import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Modal } from './Projects';
import { api } from '../utils/api';

const statusMap: Record<string, string> = {
  NOT_STARTED: '未开展', IN_PROGRESS: '进行中', DELAYED: '延误', COMPLETED: '已完成'
};
const branchMap: Record<string, string> = { SOFTWARE: '软件', HARDWARE: '硬件' };

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [showFeature, setShowFeature] = useState(false);

  useEffect(() => { loadProject(); }, [id]);

  const loadProject = () => api.get(`/api/projects/${id}`).then(r => setProject(r.data));

  const createFeature = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await api.post(`/api/features/project/${id}`, {
      branchType: fd.get('branchType'),
      name: fd.get('name'),
      purpose: fd.get('purpose'),
      manager: fd.get('manager'),
      plannedStart: fd.get('plannedStart'),
      plannedEnd: fd.get('plannedEnd')
    });
    setShowFeature(false);
    loadProject();
  };

  if (!project) return <div className="main-content"><div className="container" style={{ padding: '2rem', textAlign: 'center' }}>加载中...</div></div>;

  return (
    <div className="main-content">
      <div className="container">
        <div className="detail-header">
          <div>
            <h2>📁 {project.name}</h2>
            <span className={`badge ${project.status === 'DELAYED' ? 'badge-delayed' : project.status === 'COMPLETED' ? 'badge-completed' : project.status === 'IN_PROGRESS' ? 'badge-in-progress' : 'badge-not-started'}`}>{statusMap[project.status]}</span>
          </div>
          <Link to="/projects" className="btn btn-grey">← 返回列表</Link>
        </div>

        <div className="detail-meta">
          <div className="item"><div className="label">客户/内部</div><div className="value">{project.client}</div></div>
          <div className="item"><div className="label">项目负责人</div><div className="value">{project.manager || '-'}</div></div>
          <div className="item"><div className="label">启动日期</div><div className="value">{new Date(project.startDate).toLocaleDateString('zh-CN')}</div></div>
          <div className="item"><div className="label">计划完成</div><div className="value">{new Date(project.dueDate).toLocaleDateString('zh-CN')}</div></div>
          {project.finishDate && <div className="item"><div className="label">实际完成</div><div className="value">{new Date(project.finishDate).toLocaleDateString('zh-CN')}</div></div>}
        </div>

        {project.remark && <div className="card"><strong>备注：</strong>{project.remark}</div>}

        <div className="card">
          <div className="card-header">
            <h2>📋 功能列表</h2>
            <button className="btn btn-primary" onClick={() => setShowFeature(true)}>+ 新建功能</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>功能名称</th><th>分支</th><th>负责人</th><th>计划开始</th><th>计划完成</th><th>状态</th><th>操作</th></tr></thead>
              <tbody>
                {project.features?.map((f: any) => (
                  <tr key={f.id}>
                    <td><Link to={`/features/${f.id}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{f.name}</Link></td>
                    <td>{branchMap[f.branchType]}</td>
                    <td>{f.manager || '-'}</td>
                    <td>{new Date(f.plannedStart).toLocaleDateString('zh-CN')}</td>
                    <td>{new Date(f.plannedEnd).toLocaleDateString('zh-CN')}</td>
                    <td><span className={`badge ${f.status === 'DELAYED' ? 'badge-delayed' : f.status === 'COMPLETED' ? 'badge-completed' : f.status === 'IN_PROGRESS' ? 'badge-in-progress' : 'badge-not-started'}`}>{statusMap[f.status]}</span></td>
                    <td><Link to={`/features/${f.id}`} className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>查看详情</Link></td>
                  </tr>
                ))}
                {(!project.features || project.features.length === 0) && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>暂无功能</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showFeature && <Modal title="新建功能" onClose={() => setShowFeature(false)}>
        <form onSubmit={createFeature}>
          <div className="form-group"><label>功能名称 *</label><input name="name" required /></div>
          <div className="form-row">
            <div className="form-group"><label>分支类型 *</label><select name="branchType" required><option value="SOFTWARE">🖥️ 软件</option><option value="HARDWARE">⚙️ 硬件</option></select></div>
            <div className="form-group"><label>负责人</label><input name="manager" /></div>
          </div>
          <div className="form-group"><label>目的说明</label><textarea name="purpose" rows={2} /></div>
          <div className="form-row">
            <div className="form-group"><label>计划开始 *</label><input name="plannedStart" type="date" required /></div>
            <div className="form-group"><label>计划完成 *</label><input name="plannedEnd" type="date" required /></div>
          </div>
          <div className="modal-footer"><button type="button" className="btn btn-grey" onClick={() => setShowFeature(false)}>取消</button><button type="submit" className="btn btn-primary">创建</button></div>
        </form>
      </Modal>}
    </div>
  );
}
