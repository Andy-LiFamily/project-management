import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/register', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    const { username, email, password, role } = req.body;
    const userCount = await prisma.user.count({ where: { active: true } });
    if (userCount >= 10) {
      return res.status(400).json({ error: '系统用户数量已达上限（10人），无法创建新用户' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, password: hashed, role: role || 'USER' }
    });
    res.json({ id: user.id, username: user.username, email: user.email, role: user.role });
  } catch (error) {
    res.status(400).json({ error: '邮箱已存在或数据无效' });
  }
});

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    res.json({ token, id: user.id, username: user.username, email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ error: '登录失败' });
  }
});

router.post('/logout', (req: AuthRequest, res: Response) => {
  res.clearCookie('token');
  res.json({ message: '已退出登录' });
});

router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  res.json({ id: req.user!.id, username: req.user!.username, email: req.user!.email, role: req.user!.role });
});

router.put('/password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ error: '用户不存在' });
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) return res.status(400).json({ error: '原密码错误' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    res.json({ message: '密码修改成功' });
  } catch (error) {
    res.status(500).json({ error: '密码修改失败' });
  }
});

export default router;
