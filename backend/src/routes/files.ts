import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

const uploadDir = process.env.UPLOAD_DIR || './uploads';

// Ensure upload directory exists
const fs = await import('fs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('不支持的文件类型'));
  }
});

router.post('/', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: '请选择文件' });
    const { entityType, entityId } = req.body;
    console.log('File uploaded:', req.file);
    const file = await prisma.file.create({
      data: {
        entityType,
        entityId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        uploaderId: req.user!.id
      }
    });
    res.json(file);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: '上传失败' });
  }
});

router.get('/:entityType/:entityId', authenticate, async (req: AuthRequest, res: Response) => {
  const files = await prisma.file.findMany({
    where: { entityType: req.params.entityType as any, entityId: req.params.entityId },
    include: { uploader: { select: { username: true } } }
  });
  res.json(files);
});

router.get('/:id/download', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const file = await prisma.file.findUnique({ where: { id: req.params.id } });
    if (!file) return res.status(404).json({ error: '文件不存在' });

    const fs = await import('fs');
    const pathMod = await import('path');
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = pathMod.join(uploadDir, file.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文件未找到' });
    }

    const buffer = fs.readFileSync(filePath);
    const base64 = buffer.toString('base64');

    res.json({
      filename: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      data: base64
    });
  } catch (error) {
    res.status(500).json({ error: '下载失败' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const file = await prisma.file.findUnique({ where: { id: req.params.id } });
  if (!file) return res.status(404).json({ error: '文件不存在' });
  res.json(file);
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const file = await prisma.file.findUnique({ where: { id: req.params.id } });
  if (!file) return res.status(404).json({ error: '文件不存在' });
  const fs = await import('fs');
  const pathMod = await import('path');
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  const filePath = pathMod.join(uploadDir, file.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  await prisma.file.delete({ where: { id: req.params.id } });
  res.json({ message: '文件已删除' });
});

export default router;
