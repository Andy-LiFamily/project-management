import { useEffect, useState } from 'react';
import { Modal } from './Projects';
import { api } from '../utils/api';

export default function Vendors() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editVendor, setEditVendor] = useState<any>(null);

  useEffect(() => { loadVendors(); }, []);

  const loadVendors = () => api.get('/api/vendors').then(r => setVendors(r.data));

  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = { name: fd.get('name'), contactPerson: fd.get('contactPerson'), contactPhone: fd.get('contactPhone'), projectPerson: fd.get('projectPerson'), projectPhone: fd.get('projectPhone') };
    if (editVendor) { await api.put(`/api/vendors/${editVendor.id}`, data); setEditVendor(null); }
    else await api.post('/api/vendors', data);
    setShowModal(false);
    loadVendors();
  };

  const del = async (id: string) => {
    if (!confirm('确定删除该供应商？')) return;
    await api.delete(`/api/vendors/${id}`);
    loadVendors();
  };

  return (
    <div className="main-content">
      <div className="container">
        <div className="card">
          <div className="card-header">
            <h2>🏢 供应商管理</h2>
            <button className="btn btn-primary" onClick={() => { setEditVendor(null); setShowModal(true); }}>+ 新建供应商</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>供应商名称</th><th>公司负责人</th><th>公司电话</th><th>项目负责人</th><th>项目电话</th><th>操作</th></tr></thead>
              <tbody>
                {vendors.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 500 }}>{v.name}</td>
                    <td>{v.contactPerson || '-'}</td>
                    <td>{v.contactPhone || '-'}</td>
                    <td>{v.projectPerson || '-'}</td>
                    <td>{v.projectPhone || '-'}</td>
                    <td>
                      <button className="btn btn-warning" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', marginRight: '0.3rem' }} onClick={() => { setEditVendor(v); setShowModal(true); }}>编辑</button>
                      <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => del(v.id)}>删除</button>
                    </td>
                  </tr>
                ))}
                {vendors.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>暂无供应商</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && <Modal title={editVendor ? '编辑供应商' : '新建供应商'} onClose={() => { setShowModal(false); setEditVendor(null); }}>
        <form onSubmit={create}>
          <div className="form-group"><label>供应商名称 *</label><input name="name" defaultValue={editVendor?.name} required /></div>
          <div className="form-row">
            <div className="form-group"><label>公司负责人</label><input name="contactPerson" defaultValue={editVendor?.contactPerson} /></div>
            <div className="form-group"><label>公司负责人电话</label><input name="contactPhone" defaultValue={editVendor?.contactPhone} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>项目负责人</label><input name="projectPerson" defaultValue={editVendor?.projectPerson} /></div>
            <div className="form-group"><label>项目负责人电话</label><input name="projectPhone" defaultValue={editVendor?.projectPhone} /></div>
          </div>
          <div className="modal-footer"><button type="button" className="btn btn-grey" onClick={() => { setShowModal(false); setEditVendor(null); }}>取消</button><button type="submit" className="btn btn-primary">{editVendor ? '保存' : '创建'}</button></div>
        </form>
      </Modal>}
    </div>
  );
}
