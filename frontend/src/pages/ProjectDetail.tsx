import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Modal from '../components/Modal';
import { api } from '../utils/api';

const statusMap: Record<string, string> = {
  NOT_STARTED: '未开展', IN_PROGRESS: '进行中', DELAYED: '延误', COMPLETED: '已完成', TERMINATED: '已终止'
};
const branchMap: Record<string, string> = { SOFTWARE: '软件', HARDWARE: '硬件' };

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [showFeature, setShowFeature] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [summary, setSummary] = useState('');
  const [summaryError, setSummaryError] = useState('');
  const [vendors, setVendors] = useState<any[]>([]);
  const [projectFiles, setProjectFiles] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadProject(); }, [id]);
  useEffect(() => { api.get('/api/vendors').then(r => setVendors(r.data)); }, []);

  const loadProject = () => {
    api.get(`/api/projects/${id}`).then(r => { setProject(r.data); setSummary(r.data.summary || ''); });
    loadFiles();
  };

  const loadFiles = () => {
    api.get(`/api/files/entity/PROJECT/${id}`).then(r => setProjectFiles(r.data)).catch(() => setProjectFiles([]));
  };

  const updateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await api.put(`/api/projects/${id}`, {
      name: fd.get('name'),
      client: fd.get('client'),
      manager: fd.get('manager'),
      vendorId: fd.get('vendorId') || null,
      startDate: fd.get('startDate'),
      dueDate: fd.get('dueDate'),
      status: fd.get('status'),
      remark: fd.get('remark')
    });
    setShowEdit(false);
    loadProject();
  };

  const saveSummary = async () => {
    await api.put(`/api/projects/${id}`, { summary });
    loadProject();
  };

  const markComplete = async () => {
    if (!summary.trim()) { setSummaryError('请先填写完成总结'); return; }
    setSummaryError('');
    await api.put(`/api/projects/${id}/complete`, { summary, status: 'COMPLETED' });
    loadProject();
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    let success = 0, failed = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', 'PROJECT');
      formData.append('entityId', id!);
      try { await api.post('/api/files', formData); success++; } catch { failed++; }
    }
    if (fileRef.current) fileRef.current.value = '';
    if (failed > 0) alert(`上傳完成：成功 ${success} 個，失敗 ${failed} 個`);
    loadFiles();
  };

  const deleteFile = async (fileId: string) => {
    if (!confirm('确定删除该文件？')) return;
    await api.delete(`/api/files/${fileId}`);
    loadFiles();
  };

  const downloadFile = async (file: any) => {
    try {
      const res = await api.get(`/api/files/${file.id}/download`);
      const { data, mimeType, filename } = res.data;
      if (!data) { alert('文件數據無效'); return; }
      const binary = atob(data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch { alert('文件下載失敗'); }
  };

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
            <span className={`badge ${project.status === 'DELAYED' ? 'badge-delayed' : project.status === 'COMPLETED' ? 'badge-completed' : project.status === 'IN_PROGRESS' ? 'badge-in-progress' : project.status === 'TERMINATED' ? 'badge-delayed' : 'badge-not-started'}`}>{statusMap[project.status]}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-warning" onClick={() => setShowEdit(true)}>编辑</button>
            <Link to="/projects" className="btn btn-grey">← 返回列表</Link>
          </div>
        </div>

        <div className="detail-meta">
          <div className="item"><div className="label">客户/内部</div><div className="value">{project.client}</div></div>
          <div className="item"><div className="label">项目负责人</div><div className="value">{project.manager || '-'}</div></div>
          <div className="item"><div className="label">供应商</div><div className="value">{project.vendor?.name || '-'}</div></div>
          <div className="item"><div className="label">启动日期</div><div className="value">{new Date(project.startDate).toLocaleDateString('zh-CN')}</div></div>
          <div className="item"><div className="label">计划完成</div><div className="value">{new Date(project.dueDate).toLocaleDateString('zh-CN')}</div></div>
          {project.finishDate && <div className="item"><div className="label">实际完成</div><div className="value">{new Date(project.finishDate).toLocaleDateString('zh-CN')}</div></div>}
        </div>

        {project.remark && <div className="card"><strong>备注：</strong>{project.remark}</div>}

        <div className="card">
          <div className="card-header"><h2>📝 完成总结</h2></div>
          <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={4} placeholder="请填写完成总结..." style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem', fontFamily: 'inherit' }} />
          {summaryError && <div style={{ color: 'var(--danger)', marginTop: '0.5rem', fontSize: '0.85rem' }}>{summaryError}</div>}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={saveSummary}>💾 保存</button>
            <button className="btn btn-success" onClick={markComplete} disabled={project.status === 'COMPLETED'}>✅ 开发完成</button>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>📎 项目文件</h2></div>
          <div style={{ marginBottom: '1rem' }}>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" multiple onChange={uploadFile} />
          </div>
          <ul className="file-list">
            {projectFiles.map((f: any) => (
              <li key={f.id}>
                <span onClick={() => downloadFile(f)} style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}>{f.originalName}</span>
                <span style={{ color: '#999', fontSize: '0.75rem', marginLeft: '0.5rem' }}>{(f.size / 1024).toFixed(1)} KB</span>
                <button onClick={() => deleteFile(f.id)}>×</button>
              </li>
            ))}
            {projectFiles.length === 0 && <li style={{ color: '#999' }}>暂无文件</li>}
          </ul>
        </div>

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
                    <td><span className={`badge ${f.status === 'DELAYED' ? 'badge-delayed' : f.status === 'COMPLETED' ? 'badge-completed' : f.status === 'IN_PROGRESS' ? 'badge-in-progress' : f.status === 'TERMINATED' ? 'badge-delayed' : 'badge-not-started'}`}>{statusMap[f.status]}</span></td>
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

      {showEdit && <Modal title="编辑项目" onClose={() => setShowEdit(false)}>
        <form onSubmit={updateProject}>
          <div className="form-group"><label>项目名称 *</label><input name="name" defaultValue={project.name} required /></div>
          <div className="form-row">
            <div className="form-group"><label>客户/内部</label><input name="client" defaultValue={project.client} /></div>
            <div className="form-group"><label>项目负责人</label><input name="manager" defaultValue={project.manager || ''} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>供应商</label>
              <select name="vendorId" defaultValue={project.vendorId || ''}>
                <option value="">-- 无 --</option>
                {vendors.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>启动日期 *</label><input name="startDate" type="date" defaultValue={project.startDate?.split('T')[0]} required /></div>
            <div className="form-group"><label>计划完成日期 *</label><input name="dueDate" type="date" defaultValue={project.dueDate?.split('T')[0]} required /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>状态 *</label>
              <select name="status" defaultValue={project.status} required>
                <option value="NOT_STARTED">未开展</option>
                <option value="IN_PROGRESS">进行中</option>
                <option value="DELAYED">延误</option>
                <option value="COMPLETED">已完成</option>
                <option value="TERMINATED">已终止</option>
              </select>
            </div>
          </div>
          <div className="form-group"><label>备注</label><textarea name="remark" rows={3} defaultValue={project.remark || ''} /></div>
          <div className="modal-footer"><button type="button" className="btn btn-grey" onClick={() => setShowEdit(false)}>取消</button><button type="submit" className="btn btn-primary">保存</button></div>
        </form>
      </Modal>}
    </div>
  );
}
