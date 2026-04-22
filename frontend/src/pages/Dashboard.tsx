import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';


const statusMap: Record<string, { label: string; cls: string }> = {
  NOT_STARTED: { label: '未开展', cls: 'badge-not-started' },
  IN_PROGRESS: { label: '进行中', cls: 'badge-in-progress' },
  DELAYED: { label: '延误', cls: 'badge-delayed' },
  COMPLETED: { label: '已完成', cls: 'badge-completed' }
};

export default function Dashboard() {
  const [stats, setStats] = useState<any>({});
  const [ganttData, setGanttData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/dashboard/stats'),
      api.get('/api/dashboard/gantt')
    ]).then(([s, g]) => {
      setStats(s.data);
      setGanttData(g.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>加载中...</div>;

  return (
    <div className="main-content">
      <div className="container">
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.3rem' }}>📊 数据概览</h2>

        <div className="stats-grid">
          <Link to="/projects" style={{ textDecoration: 'none' }}><div className="stat-card"><div className="value">{stats.projectCount || 0}</div><div className="label">项目总数</div></div></Link>
          <Link to="/projects" style={{ textDecoration: 'none' }}><div className="stat-card"><div className="value" style={{ color: 'var(--success)' }}>{stats.activeProjects || 0}</div><div className="label">进行中</div></div></Link>
          <Link to="/projects" style={{ textDecoration: 'none' }}><div className="stat-card"><div className="value" style={{ color: 'var(--danger)' }}>{stats.delayedProjects || 0}</div><div className="label">延误项目</div></div></Link>
          <Link to="/projects" style={{ textDecoration: 'none' }}><div className="stat-card"><div className="value" style={{ color: 'var(--primary)' }}>{stats.featureCount || 0}</div><div className="label">功能总数</div></div></Link>
          <Link to="/projects" style={{ textDecoration: 'none' }}><div className="stat-card"><div className="value">{stats.taskCount || 0}</div><div className="label">任务总数</div></div></Link>
          <Link to="/vendors" style={{ textDecoration: 'none' }}><div className="stat-card"><div className="value">{stats.vendorCount || 0}</div><div className="label">供应商</div></div></Link>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>📅 甘特图概览</h2>
          </div>
          <GanttChart data={ganttData} />
        </div>
      </div>
    </div>
  );
}

function GanttChart({ data }: { data: any[] }) {
  const today = new Date();

  const rows = data.flatMap((p: any) => {
    const projectBar = {
      id: p.id,
      name: p.name,
      type: 'project',
      start: new Date(p.startDate),
      end: new Date(p.dueDate),
      status: p.status,
      isProject: true
    };
    const featureBars = p.features.map((f: any) => ({
      id: f.id,
      name: `  └ ${f.branchType === 'SOFTWARE' ? '🖥️ 软件' : '⚙️ 硬件'} ${f.name}`,
      type: f.branchType.toLowerCase(),
      start: new Date(f.plannedStart),
      end: new Date(f.plannedEnd),
      status: f.status
    }));
    return [projectBar, ...featureBars];
  });

  if (rows.length === 0) return <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>暂无进行中的项目</div>;

  const minDate = new Date(Math.min(...rows.map((r: any) => r.start.getTime())));
  const maxDate = new Date(Math.max(...rows.map((r: any) => r.end.getTime())));
  const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));

  const getPosition = (date: Date) => {
    const days = Math.max(0, (date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    return (days / totalDays) * 100;
  };

  const getWidth = (start: Date, end: Date) => {
    const days = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(3, (days / totalDays) * 100);
  };

  const todayPos = getPosition(today);

  return (
    <div className="gantt-container">
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', fontSize: '0.75rem', color: '#666', flexWrap: 'wrap' }}>
        <span>🟦 进行中</span><span>🔴 延误</span><span>⚫ 已完成</span>
        <span>🖥️ 软件</span><span>⚙️ 硬件</span>
      </div>
      <div style={{ position: 'relative', minWidth: '600px' }}>
        {rows.map((row: any) => {
          const left = getPosition(row.start);
          const width = getWidth(row.start, row.end);
          let cls = 'gantt-software';
          if (row.isProject) cls = row.status === 'DELAYED' ? 'gantt-delayed' : row.status === 'COMPLETED' ? 'gantt-completed' : 'gantt-project';
          else if (row.status === 'DELAYED') cls = 'gantt-delayed';
          else if (row.status === 'COMPLETED') cls = 'gantt-completed';
          else cls = row.type === 'software' ? 'gantt-software' : 'gantt-hardware';
          return (
            <div key={row.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minHeight: '36px' }}>
              <div style={{ width: '200px', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>{row.name}</div>
              <div style={{ flex: 1, position: 'relative', height: '32px', background: '#f0f0f0', borderRadius: '4px' }}>
                <div className={`gantt-bar ${cls}`} style={{ position: 'absolute', left: `${left}%`, width: `${width}%`, top: '2px', height: '28px' }} title={`${row.start.toLocaleDateString('zh-CN')} ~ ${row.end.toLocaleDateString('zh-CN')}`} />
              </div>
            </div>
          );
        })}
        {todayPos >= 0 && todayPos <= 100 && (
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${todayPos}%`, width: '2px', background: 'red', opacity: 0.7, zIndex: 10 }} title="今日" />
        )}
      </div>
    </div>
  );
}
