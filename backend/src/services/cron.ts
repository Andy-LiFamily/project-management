import { prisma } from '../utils/prisma.js';
import { sendOverdueEmail } from './email.js';

const checkOverdueItems = async () => {
  const now = new Date();
  
  const features = await prisma.feature.findMany({
    where: {
      status: { not: 'COMPLETED' },
      plannedEnd: { lt: now }
    },
    include: { project: true }
  });

  for (const feature of features) {
    if (feature.status !== 'DELAYED') {
      await prisma.feature.update({
        where: { id: feature.id },
        data: { status: 'DELAYED' }
      });
    }

    const users = await prisma.user.findMany({ where: { active: true } });
    await sendOverdueEmail(users, {
      projectName: feature.project.name,
      featureName: feature.name,
      featureManager: feature.manager || undefined,
      plannedDate: feature.plannedEnd,
      type: 'feature'
    });
  }

  const allTasks = await prisma.task.findMany({
    where: {
      status: { not: 'COMPLETED' },
      targetDate: { lt: now }
    },
    include: {
      feature: { include: { project: true } },
      vendor: true
    }
  });

  for (const task of allTasks) {
    if (task.status !== 'DELAYED') {
      await prisma.task.update({
        where: { id: task.id },
        data: { status: 'DELAYED' }
      });
    }

    const users = await prisma.user.findMany({ where: { active: true } });
    await sendOverdueEmail(users, {
      projectName: task.feature.project.name,
      featureName: task.feature.name,
      taskContent: task.workContent,
      taskManager: task.manager || undefined,
      featureManager: task.feature.manager || undefined,
      plannedDate: task.targetDate,
      type: 'task'
    });
  }

  console.log(`[Cron] Overdue check completed at ${new Date().toISOString()}`);
};

checkOverdueItems().then(() => process.exit(0)).catch(console.error);
