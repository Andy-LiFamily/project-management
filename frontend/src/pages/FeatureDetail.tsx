import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Modal } from './Projects';
import { api } from '../utils/api';

const statusMap: Record<string, string> = {
  NOT_STARTED: '未开展', IN_PROGRESS: '进行中', DELAYED: '延误', COMPLETED: '已完成'
};
const branchMap: Record<string, string> = { SOFTWARE: '软件', HARDWARE: '硬件' };

export default function FeatureDetail() {
  const { id } = useParams();
  const [feature, setFeature] = useState<any>(null);
  const [showTask, setShowTask] = useState(false);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadFeature(); }, [id]);

  const loadFeature = () => api.get(`/api/features/${id}`).then(r => { setFeature(r.data); setSummary(r.data.summary || ''); });

  const updateFeature = async (data: any) => {
    await api.put(`/api/features/${id}`, data);
    loadFeature();
  };

  const markComplete = async () => {
    if (!summary.trim()) { setError('请先填写完成总结'); return; }
    setError('');
    await api.put(`/api/features/${id}/complete`, { summary });
    loadFeature();
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', 'FEATURE');
    formData.append('entityId', id!);
    await api.post('/api/files', formData);
    if (fileRef.current) fileRef.current.value = '';
    loadFeature();
  };

  const deleteFile = async (fileId: string) => {
    await api.delete(`/api/files/${fileId}`);
    loadFeature();
  };

  const createTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await api.post(`/api/tasks/feature/${id}`, {
      workContent: fd.get('workContent'),
      targetDate: fd.get('targetDate'),
      manager: fd.get('manager'),
      vendorId: fd.get('vendorId') || null,
      remark: fd.get('remark')
    });
    setShowTask(false);
    loadFeature();
  };

  if (!feature) return <div className="main-content"><div className="container" style={{ padding: '2rem', textAlign: 'center' }}>加载中...</div></div>;

  const vendors = feature.tasks?.map((t: any) => t.vendor).filter(Boolean) || [];

  return (
    <div className="main-content">
      <div className="container">
        <div className="detail-header">
          <div>
            <h2>📋 {feature.name}</h2>
            <span style={{ marginLeft: '0.5rem' }} className={`badge ${feature.status === 'DELAYED' ? 'badge-delayed' : feature.status === 'COMPLETED' ? 'badge-completed' : feature.status === 'IN_PROGRESS' ? 'badge-in-progress' : 'badge-not-started'}`}>{statusMap[feature.status]}</span>
            <span style={{ marginLeft: '0.5rem' }} className="badge badge-in-progress">{branchMap[feature.branchType]}</span>
          </div>
          <Link to={`/projects/${feature.projectId}`} className="btn btn-grey">← 返回项目</Link>
        </div>

        <div className="detail-meta">
          <div className="item"><div className="label">目的说明</div><div className="value">{feature.purpose || '-'}</div></div>
          <div className="item"><div className="label">负责人</div><div className="value">{feature.manager || '-'}</div></div>
          <div className="item"><div className="label">计划开始</div><div className="value">{new Date(feature.plannedStart).toLocaleDateString('zh-CN')}</div></div>
          <div className="item"><div className="label">计划完成</div><div className="value">{new Date(feature.plannedEnd).toLocaleDateString('zh-CN')}</div></div>
          {feature.actualEnd && <div className="item"><div className="label">实际完成</div><div className="value">{new Date(feature.actualEnd).toLocaleDateString('zh-CN')}</div></div>}
        </div>

        {/* Completion Summary */}
        <div className="card">
          <div className="card-header"><h2>📝 完成总结</h2></div>
          <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={4} placeholder="请填写完成总结..." style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem', fontFamily: 'inherit' }} />
          {error && <div style={{ color: 'var(--danger)', marginTop: '0.5rem', fontSize: '0.85rem' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={() => updateFeature({ summary })}>💾 保存</button>
            <button className="btn btn-success" onClick={markComplete}>✅ 开发完成</button>
          </div>
        </div>

        {/* Files */}
        <div className="card">
          <div className="card-header"><h2>📎 规划文件</h2></div>
          <div style={{ marginBottom: '1rem' }}>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" onChange={uploadFile} />
          </div>
          <ul className="file-list">
            {feature.files?.filter((f: any) => f.entityType === 'FEATURE').map((f: any) => (
              <li key={f.id}>
                <span>{f.originalName}</span>
                <span style={{ color: '#999', fontSize: '0.75rem', marginLeft: '0.5rem' }}>{(f.size / 1024).toFixed(1)} KB</span>
                <button onClick={() => deleteFile(f.id)}>×</button>
              </li>
            ))}
            {(!feature.files || feature.files.length === 0) && <li style={{ color: '#999' }}>暂无文件</li>}
          </ul>
        </div>

        {/* Tasks */}
        <div className="card">
          <div className="card-header">
            <h2>📌 分工任务 ({feature.tasks?.length || 0})</h2>
            <button className="btn btn-primary" onClick={() => setShowTask(true)}>+ 新建任务</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>工作内容</th><th>负责人</th><th>目标日期</th><th>供应商</th><th>进度</th><th>状态</th></tr></thead>
              <tbody>
                {feature.tasks?.map((t: any) => (
                  <tr key={t.id}>
                    <td>{t.workContent}</td>
                    <td>{t.manager || '-'}</td>
                    <td>{new Date(t.targetDate).toLocaleDateString('zh-CN')}</td>
                    <td>{t.vendor?.name || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="progress-bar" style={{ width: '80px' }}><div className="fill" style={{ width: `${t.progress}%` }} /></div>
                        <span style={{ fontSize: '0.8rem' }}>{t.progress}%</span>
                      </div>
                    </td>
                    <td><span className={`badge ${t.status === 'DELAYED' ? 'badge-delayed' : t.status === 'COMPLETED' ? 'badge-completed' : t.status === 'IN_PROGRESS' ? 'badge-in-progress' : 'badge-not-started'}`}>{statusMap[t.status]}</span></td>
                  </tr>
                ))}
                {(!feature.tasks || feature.tasks.length === 0) && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>暂无任务</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showTask && <TaskModal feature={feature} onClose={() => setShowTask(false)} onCreated={loadFeature} />}
    </div>
  );
}

function TaskModal({ feature, onClose, onCreated }: { feature: any; onClose: () => void; onCreated: () => void }) {
  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await api.post(`/api/tasks/feature/${feature.id}`, {
      workContent: fd.get('workContent'),
      targetDate: fd.get('targetDate'),
      manager: fd.get('manager'),
      vendorId: fd.get('vendorId') || null,
      remark: fd.get('remark')
    });
    onCreated();
    onClose();
  };

  return (
    <Modal title="新建任务" onClose={onClose}>
      <form onSubmit={create}>
        <div className="form-group"><label>工作内容 *</label><textarea name="workContent" rows={3} required placeholder="请详细描述任务内容" /></div>
        <div className="form-row">
          <div className="form-group"><label>负责人</label><input name="manager" /></div>
          <div className="form-group"><label>目标达成日期 *</label><input name="targetDate" type="date" required /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>供应商</label>
            <select name="vendorId"><option value="">-- 无 --</option>
              {(feature.tasks || []).filter((t: any) => t.vendor).map((t: any) => <option key={t.vendor.id} value={t.vendor.id}>{t.vendor.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>备注</label><input name="remark" /></div>
        </div>
        <div className="modal-footer"><button type="button" className="btn btn-grey" onClick={onClose}>取消</button><button type="submit" className="btn btn-primary">创建</button></div>
      </form>
    </Modal>
  );
}
