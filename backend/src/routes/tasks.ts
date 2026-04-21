import { Router, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/feature/:featureId', authenticate, async (req: AuthRequest, res: Response) => {
  const tasks = await prisma.task.findMany({
    where: { featureId: req.params.featureId },
    include: {
      vendor: true,
      createdBy: { select: { username: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(tasks);
});

router.post('/feature/:featureId', authenticate, async (req: AuthRequest, res: Response) => {
  const { workContent, targetDate, manager, vendorId, remark } = req.body;
  const feature = await prisma.feature.findUnique({ where: { id: req.params.featureId } });
  if (!feature) return res.status(404).json({ error: '功能不存在' });
  const task = await prisma.task.create({
    data: {
      featureId: req.params.featureId,
      projectId: feature.projectId,
      workContent,
      targetDate: new Date(targetDate),
      manager,
      vendorId,
      remark,
      createdById: req.user!.id
    }
  });
  res.json(task);
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: { vendor: true, feature: true }
  });
  if (!task) return res.status(404).json({ error: '任务不存在' });
  res.json(task);
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const { workContent, targetDate, manager, vendorId, progress, status, remark } = req.body;
  const data: any = { workContent, manager, vendorId, remark };
  if (targetDate) data.targetDate = new Date(targetDate);
  if (progress !== undefined) data.progress = progress;
  if (status) data.status = status;
  const task = await prisma.task.update({ where: { id: req.params.id }, data });
  res.json(task);
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  await prisma.task.delete({ where: { id: req.params.id } });
  res.json({ message: '任务已删除' });
});

export default router;
