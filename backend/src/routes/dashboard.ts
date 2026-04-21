import { Router, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  const [projectCount, activeProjects, delayedProjects, featureCount, activeFeatures, taskCount, vendorCount] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.project.count({ where: { status: 'DELAYED' } }),
    prisma.feature.count(),
    prisma.feature.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.task.count(),
    prisma.vendor.count()
  ]);
  res.json({
    projectCount,
    activeProjects,
    delayedProjects,
    featureCount,
    activeFeatures,
    taskCount,
    vendorCount
  });
});

router.get('/gantt', authenticate, async (req: AuthRequest, res: Response) => {
  const projects = await prisma.project.findMany({
    where: { status: { in: ['IN_PROGRESS', 'DELAYED'] } },
    include: {
      features: {
        where: { status: { in: ['IN_PROGRESS', 'DELAYED', 'COMPLETED'] } }
      }
    }
  });
  res.json(projects);
});

export default router;
