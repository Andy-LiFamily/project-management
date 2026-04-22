import { Router, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest, requireAdmin } from '../middleware/auth.js';
import { sendFeatureCompleteEmail } from '../services/email.js';

const router = Router();

router.get('/project/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  const features = await prisma.feature.findMany({
    where: { projectId: req.params.projectId },
    include: {
      createdBy: { select: { username: true } },
      tasks: { include: { vendor: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(features);
});

router.post('/project/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  const { branchType, name, purpose, manager, buildDate, plannedStart, plannedEnd, status } = req.body;
  const feature = await prisma.feature.create({
    data: {
      projectId: req.params.projectId,
      branchType,
      name,
      purpose,
      manager,
      buildDate: buildDate ? new Date(buildDate) : null,
      plannedStart: new Date(plannedStart),
      plannedEnd: new Date(plannedEnd),
      status: status || 'NOT_STARTED',
      createdById: req.user!.id
    }
  });
  res.json(feature);
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const feature = await prisma.feature.findUnique({
    where: { id: req.params.id },
    include: {
      project: true,
      createdBy: { select: { username: true } },
      tasks: { include: { vendor: true } }
    }
  });
  if (!feature) return res.status(404).json({ error: '功能不存在' });

  // Fetch files for this feature
  const files = await prisma.file.findMany({
    where: { entityType: 'FEATURE', entityId: req.params.id }
  });

  // Also fetch files for all tasks under this feature
  const taskIds = feature.tasks.map(t => t.id);
  const taskFiles = taskIds.length > 0 ? await prisma.file.findMany({
    where: { entityType: 'TASK', entityId: { in: taskIds } }
  }) : [];

  // Attach files to their respective tasks
  const tasksWithFiles = feature.tasks.map(task => ({
    ...task,
    files: taskFiles.filter(f => f.entityId === task.id)
  }));

  res.json({
    ...feature,
    tasks: tasksWithFiles,
    files: files
  });
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const { branchType, name, purpose, manager, buildDate, plannedStart, plannedEnd, status, summary } = req.body;
  const data: any = { branchType, name, purpose, manager, summary };
  if (buildDate) data.buildDate = new Date(buildDate);
  if (plannedStart) data.plannedStart = new Date(plannedStart);
  if (plannedEnd) data.plannedEnd = new Date(plannedEnd);
  if (status) data.status = status;
  const feature = await prisma.feature.update({ where: { id: req.params.id }, data });
  res.json(feature);
});

router.put('/:id/complete', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { summary } = req.body;
    if (!summary || summary.trim() === '') {
      return res.status(400).json({ error: '请填写完成总结后才能标记为完成' });
    }
    const feature = await prisma.feature.findUnique({
      where: { id: req.params.id },
      include: {
        project: true,
        tasks: { include: { vendor: true } }
      }
    });
    if (!feature) return res.status(404).json({ error: '功能不存在' });
    const updated = await prisma.feature.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED', summary, actualEnd: new Date() }
    });
    const users = await prisma.user.findMany({ where: { active: true } });
    await sendFeatureCompleteEmail(users, feature.project, updated, feature.tasks as any, summary);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: '完成操作失败' });
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  await prisma.feature.delete({ where: { id: req.params.id } });
  res.json({ message: '功能已删除' });
});

export default router;
