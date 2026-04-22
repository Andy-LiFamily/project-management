import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

const uploadDir = process.env.UPLOAD_DIR || './uploads';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
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

// File upload
router.post('/', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: '请选择文件' });
    const { entityType, entityId } = req.body;
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
  } catch (error: any) {
    console.error('Upload error:', error.message);
    res.status(500).json({ error: '上传失败: ' + (error.message || '未知错误') });
  }
});

// List files by entity
router.get('/entity/:entityType/:entityId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const files = await prisma.file.findMany({
      where: { entityType: req.params.entityType as any, entityId: req.params.entityId },
      include: { uploader: { select: { username: true } } }
    });
    res.json(files);
  } catch (error: any) {
    console.error('List files error:', error.message);
    res.status(500).json({ error: '获取文件列表失败' });
  }
});

// Download file
router.get('/:id/download', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const fileId = req.params.id;
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) return res.status(404).json({ error: '文件不存在' });

    const filePath = path.join(uploadDir, file.filename);

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
  } catch (error: any) {
    console.error('Download error:', error.message);
    res.status(500).json({ error: '下载失败: ' + (error.message || '未知错误') });
  }
});

// Get single file by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const file = await prisma.file.findUnique({ where: { id: req.params.id } });
    if (!file) return res.status(404).json({ error: '文件不存在' });
    res.json(file);
  } catch (error: any) {
    console.error('Get file error:', error.message);
    res.status(500).json({ error: '获取文件信息失败' });
  }
});

// Delete file
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const file = await prisma.file.findUnique({ where: { id: req.params.id } });
    if (!file) return res.status(404).json({ error: '文件不存在' });
    const filePath = path.join(uploadDir, file.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await prisma.file.delete({ where: { id: req.params.id } });
    res.json({ message: '文件已删除' });
  } catch (error: any) {
    console.error('Delete file error:', error.message);
    res.status(500).json({ error: '删除文件失败' });
  }
});

export default router;
