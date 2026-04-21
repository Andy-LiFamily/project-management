import { Router, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, username: true, email: true, role: true, createdAt: true }
  });
  res.json(users);
});

router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { username, email, password, role } = req.body;
  const bcrypt = (await import('bcryptjs')).default;
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, email, password: hashed, role: role || 'USER' }
  });
  res.json({ id: user.id, username: user.username, email: user.email, role: user.role });
});

router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  if (req.params.id === req.user!.id) {
    return res.status(400).json({ error: '不能删除自己的账号' });
  }
  await prisma.user.update({
    where: { id: req.params.id },
    data: { active: false }
  });
  res.json({ message: '用户已删除' });
});

export default router;
