import { Router, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const projects = await prisma.project.findMany({
    include: {
      createdBy: { select: { username: true } },
      vendor: { select: { id: true, name: true } },
      features: { select: { id: true, status: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(projects);
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { name, client, manager, vendorId, startDate, dueDate, remark } = req.body;
  const project = await prisma.project.create({
    data: {
      name,
      client: client || '内部',
      manager,
      vendorId: vendorId || null,
      startDate: new Date(startDate),
      dueDate: new Date(dueDate),
      remark,
      createdById: req.user!.id
    }
  });
  res.json(project);
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: {
      createdBy: { select: { username: true } },
      vendor: { select: { id: true, name: true } },
      features: {
        include: {
          tasks: true
        }
      }
    }
  });
  if (!project) return res.status(404).json({ error: '项目不存在' });
  res.json(project);
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const { name, client, manager, vendorId, startDate, dueDate, finishDate, status, summary, remark } = req.body;
  const data: any = { name, client, manager, remark };
  if (startDate) data.startDate = new Date(startDate);
  if (dueDate) data.dueDate = new Date(dueDate);
  if (finishDate) data.finishDate = new Date(finishDate);
  if (status) data.status = status;
  if (summary !== undefined) data.summary = summary;
  if (vendorId !== undefined) data.vendorId = vendorId || null;
  const project = await prisma.project.update({ where: { id: req.params.id }, data });
  res.json(project);
});

router.put('/:id/complete', authenticate, async (req: AuthRequest, res: Response) => {
  const { summary, status } = req.body;
  if (!summary || summary.trim() === '') {
    return res.status(400).json({ error: '请填写完成总结后才能标记为完成' });
  }
  const project = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!project) return res.status(404).json({ error: '项目不存在' });
  const updated = await prisma.project.update({
    where: { id: req.params.id },
    data: { status: status || 'COMPLETED', summary, finishDate: new Date() }
  });
  res.json(updated);
});

router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  await prisma.project.delete({ where: { id: req.params.id } });
  res.json({ message: '项目已删除' });
});

export default router;
