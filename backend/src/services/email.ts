import nodemailer from 'nodemailer';
import { User, Feature, Task, Project } from '@prisma/client';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

export interface OverdueEmailData {
  projectName: string;
  featureName?: string;
  taskContent?: string;
  taskManager?: string;
  featureManager?: string;
  plannedDate: Date;
  type: 'feature' | 'task';
}

export const sendOverdueEmail = async (users: User[], data: OverdueEmailData) => {
  const subject = `【延误提醒】${data.projectName}${data.featureName ? ' - ' + data.featureName : ''}`;
  const body = `
您好，

项目【${data.projectName}】存在延误情况：

${data.type === 'feature' ? `功能：${data.featureName}
负责人：${data.featureManager || '未指定'}
计划完成日期：${data.plannedDate.toLocaleDateString('zh-CN')}` : `任务：${data.taskContent}
负责人：${data.taskManager || '未指定'}
目标达成日期：${data.plannedDate.toLocaleDateString('zh-CN')}`}

原计划日期：${data.plannedDate.toLocaleDateString('zh-CN')}
当前状态：延误

请尽快处理。

此邮件由系统自动发送。
`.trim();

  for (const user of users) {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject,
      text: body
    });
  }
};

export const sendFeatureCompleteEmail = async (
  users: User[],
  project: Project,
  feature: Feature,
  tasks: (Task & { vendor?: { name: string } | null }),
  summary: string
) => {
  const subject = `【功能完成】${project.name} - ${feature.name}`;
  const taskList = tasks.map(t => `
任务：${t.workContent}
负责人：${t.manager || '未指定'}
${t.vendor ? '供应商：' + t.vendor.name : ''}
目标日期：${t.targetDate.toLocaleDateString('zh-CN')}
进度：${t.progress}%
状态：${t.status}
`).join('\n---\n');

  const body = `
您好，

项目【${project.name}】的功能【${feature.name}】已完成！

=== 项目信息 ===
项目名称：${project.name}
客户/内部：${project.client}
项目负责人：${project.manager || '未指定'}
启动日期：${project.startDate.toLocaleDateString('zh-CN')}

=== 功能信息 ===
功能名称：${feature.name}
分支类型：${feature.branchType === 'SOFTWARE' ? '软件' : '硬件'}
负责人：${feature.manager || '未指定'}
计划完成日期：${feature.plannedEnd.toLocaleDateString('zh-CN')}
实际完成日期：${new Date().toLocaleDateString('zh-CN')}

=== 任务汇总 ===
${taskList}

=== 完成总结 ===
${summary}

此邮件由系统自动发送。
`.trim();

  for (const user of users) {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject,
      text: body
    });
  }
};
