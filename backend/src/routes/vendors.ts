import { Router, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const vendors = await prisma.vendor.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(vendors);
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const vendor = await prisma.vendor.create({ data: req.body });
  res.json(vendor);
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const vendor = await prisma.vendor.update({ where: { id: req.params.id }, data: req.body });
  res.json(vendor);
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  await prisma.vendor.delete({ where: { id: req.params.id } });
  res.json({ message: '供应商已删除' });
});

export default router;
