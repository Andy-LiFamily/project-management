const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'pm_system_secret_key_2026';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MySQL Connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || '43.163.222.215',
  port: process.env.DB_PORT || 30177,
  user: 'root',
  password: process.env.DB_PASSWORD || 'G9P3BzH5F4hryte02v81lDfSKjOw76ku',
  database: 'pms_db',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4'
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// File Upload Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Email Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

// Response helper
const response = (code, message, data = null) => ({ code, message, data });

// Auth Middleware
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.json(response(401, '未登录'));
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.json(response(401, 'token无效'));
  }
};

// Admin middleware
const adminMiddleware = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.json(response(403, '无权限'));
  }
  next();
};

// ============ Auth APIs ============
app.post('/api/pm/auth/login', async (req, res) => {
  try {
    const { userId, password } = req.body;
    const [rows] = await pool.query(
      'SELECT f_id, f_user_id, f_user_name, f_password, f_role FROM t_pm_user WHERE f_user_id = ? AND f_status = 1',
      [userId]
    );
    if (rows.length === 0) return res.json(response(400, '用户不存在'));
    const user = rows[0];
    if (user.f_password !== password) return res.json(response(400, '密码错误'));
    const token = jwt.sign(
      { userId: user.f_user_id, userName: user.f_user_name, role: user.f_role },
      JWT_SECRET, { expiresIn: '24h' }
    );
    res.json(response(200, '登录成功', { token, userId: user.f_user_id, userName: user.f_user_name, role: user.f_role }));
  } catch (err) {
    res.json(response(500, err.message));
  }
});

// ============ User APIs (Admin only) ============
app.get('/api/pm/user', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT f_id, f_user_id, f_user_name, f_email, f_role, f_status, f_create_time FROM t_pm_user');
    res.json(response(200, 'success', rows));
  } catch (err) { res.json(response(500, err.message)); }
});

app.post('/api/pm/user', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId, userName, password, email, role } = req.body;
    await pool.query(
      'INSERT INTO t_pm_user (f_user_id, f_user_name, f_password, f_email, f_role) VALUES (?, ?, ?, ?, ?)',
      [userId, userName, password, email, role || 'user']
    );
    res.json(response(200, '用户创建成功'));
  } catch (err) { res.json(response(500, err.message)); }
});

app.put('/api/pm/user/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userName, password, email, role } = req.body;
    if (password) {
      await pool.query(
        'UPDATE t_pm_user SET f_user_name=?, f_password=?, f_email=?, f_role=? WHERE f_id=?',
        [userName, password, email, role, req.params.id]
      );
    } else {
      await pool.query(
        'UPDATE t_pm_user SET f_user_name=?, f_email=?, f_role=? WHERE f_id=?',
        [userName, email, role, req.params.id]
      );
    }
    res.json(response(200, '用户更新成功'));
  } catch (err) { res.json(response(500, err.message)); }
});

app.delete('/api/pm/user/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM t_pm_user WHERE f_id = ?', [req.params.id]);
    res.json(response(200, '用户删除成功'));
  } catch (err) { res.json(response(500, err.message)); }
});

// ============ Project APIs ============
app.get('/api/pm/project', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM t_pm_project ORDER BY f_create_time DESC');
    res.json(response(200, 'success', rows));
  } catch (err) { res.json(response(500, err.message)); }
});

app.post('/api/pm/project', authMiddleware, async (req, res) => {
  try {
    const { projectName, description, createUser } = req.body;
    const [result] = await pool.query(
      'INSERT INTO t_pm_project (f_project_name, f_description, f_create_user) VALUES (?, ?, ?)',
      [projectName, description, createUser]
    );
    res.json(response(200, '项目创建成功', { id: result.insertId }));
  } catch (err) { res.json(response(500, err.message)); }
});

app.put('/api/pm/project/:id', authMiddleware, async (req, res) => {
  try {
    const { projectName, description, targetDate } = req.body;
    await pool.query(
      'UPDATE t_pm_project SET f_project_name=?, f_description=?, f_target_date=? WHERE f_id=?',
      [projectName, description, targetDate, req.params.id]
    );
    res.json(response(200, '项目更新成功'));
  } catch (err) { res.json(response(500, err.message)); }
});

app.delete('/api/pm/project/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM t_pm_project WHERE f_id = ?', [req.params.id]);
    res.json(response(200, '项目删除成功'));
  } catch (err) { res.json(response(500, err.message)); }
});

// ============ Feature APIs ============
app.get('/api/pm/feature', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.query;
    let sql = 'SELECT * FROM t_pm_feature';
    if (projectId) sql += ' WHERE f_project_id = ?';
    sql += ' ORDER BY f_create_time DESC';
    const [rows] = projectId ? await pool.query(sql, [projectId]) : await pool.query(sql);
    res.json(response(200, 'success', rows));
  } catch (err) { res.json(response(500, err.message)); }
});

app.post('/api/pm/feature', authMiddleware, upload.single('document'), async (req, res) => {
  try {
    const { projectId, branch, featureName, purpose, ownerId, ownerName, createDate, targetDate } = req.body;
    const documentPath = req.file ? '/uploads/' + req.file.filename : null;
    await pool.query(
      'INSERT INTO t_pm_feature (f_project_id, f_branch, f_feature_name, f_purpose, f_owner_id, f_owner_name, f_create_date, f_target_date, f_document_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [projectId, branch, featureName, purpose, ownerId, ownerName, createDate, targetDate, documentPath]
    );
    res.json(response(200, '功能创建成功'));
  } catch (err) { res.json(response(500, err.message)); }
});

app.put('/api/pm/feature/:id', authMiddleware, async (req, res) => {
  try {
    const { featureName, purpose, ownerId, ownerName, createDate, targetDate, status, summary, completeDate } = req.body;
    await pool.query(
      'UPDATE t_pm_feature SET f_feature_name=?, f_purpose=?, f_owner_id=?, f_owner_name=?, f_create_date=?, f_target_date=?, f_status=?, f_summary=?, f_complete_date=? WHERE f_id=?',
      [featureName, purpose, ownerId, ownerName, createDate, targetDate, status, summary, completeDate, req.params.id]
    );
    res.json(response(200, '更新成功'));
  } catch (err) { res.json(response(500, err.message)); }
});

app.delete('/api/pm/feature/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM t_pm_feature WHERE f_id = ?', [req.params.id]);
    res.json(response(200, '功能删除成功'));
  } catch (err) { res.json(response(500, err.message)); }
});

// ============ Task APIs ============
app.get('/api/pm/task', authMiddleware, async (req, res) => {
  try {
    const { featureId } = req.query;
    let sql = 'SELECT t.*, s.f_supplier_name FROM t_pm_task t LEFT JOIN t_pm_supplier s ON t.f_supplier_id = s.f_id';
    if (featureId) sql += ' WHERE t.f_feature_id = ?';
    sql += ' ORDER BY t.f_target_date ASC';
    const [rows] = featureId ? await pool.query(sql, [featureId]) : await pool.query(sql);
    res.json(response(200, 'success', rows));
  } catch (err) { res.json(response(500, err.message)); }
});

app.post('/api/pm/task', authMiddleware, upload.single('document'), async (req, res) => {
  try {
    const { featureId, taskContent, targetDate, ownerId, ownerName, supplierId, status } = req.body;
    const documentPath = req.file ? '/uploads/' + req.file.filename : null;
    await pool.query(
      'INSERT INTO t_pm_task (f_feature_id, f_task_content, f_target_date, f_owner_id, f_owner_name, f_supplier_id, f_status, f_document_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [featureId, taskContent, targetDate, ownerId, ownerName, supplierId, status || '未开展', documentPath]
    );
    res.json(response(200, '分工创建成功'));
  } catch (err) { res.json(response(500, err.message)); }
});

app.put('/api/pm/task/:id', authMiddleware, async (req, res) => {
  try {
    const { taskContent, targetDate, ownerId, ownerName, supplierId, status, progress } = req.body;
    await pool.query(
      'UPDATE t_pm_task SET f_task_content=?, f_target_date=?, f_owner_id=?, f_owner_name=?, f_supplier_id=?, f_status=?, f_progress=? WHERE f_id=?',
      [taskContent, targetDate, ownerId, ownerName, supplierId, status, progress, req.params.id]
    );
    res.json(response(200, '更新成功'));
  } catch (err) { res.json(response(500, err.message)); }
});

// ============ Supplier APIs ============
app.get('/api/pm/supplier', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM t_pm_supplier ORDER BY f_create_time DESC');
    res.json(response(200, 'success', rows));
  } catch (err) { res.json(response(500, err.message)); }
});

app.post('/api/pm/supplier', authMiddleware, async (req, res) => {
  try {
    const { supplierName, contactPerson, contactPhone, projectLeader, projectPhone } = req.body;
    await pool.query(
      'INSERT INTO t_pm_supplier (f_supplier_name, f_contact_person, f_contact_phone, f_project_leader, f_project_phone) VALUES (?, ?, ?, ?, ?)',
      [supplierName, contactPerson, contactPhone, projectLeader, projectPhone]
    );
    res.json(response(200, '供应商创建成功'));
  } catch (err) { res.json(response(500, err.message)); }
});

// ============ Email APIs ============
app.post('/api/pm/email/send', authMiddleware, async (req, res) => {
  try {
    const { to, subject, content } = req.body;
    // In production, configure SMTP and send real email
    // For now, log the email
    await pool.query(
      'INSERT INTO t_pm_email_log (f_email_type, f_recipients, f_subject, f_content) VALUES (?, ?, ?, ?)',
      ['notification', to, subject, content]
    );
    res.json(response(200, '邮件发送成功'));
  } catch (err) { res.json(response(500, err.message)); }
});

// ============ Dashboard/Gantt APIs ============
app.get('/api/pm/dashboard', authMiddleware, async (req, res) => {
  try {
    const [projects] = await pool.query('SELECT * FROM t_pm_project ORDER BY f_create_time DESC');
    const [features] = await pool.query('SELECT * FROM t_pm_feature');
    const [tasks] = await pool.query('SELECT * FROM t_pm_task');
    res.json(response(200, 'success', { projects, features, tasks }));
  } catch (err) { res.json(response(500, err.message)); }
});

// ============ User List (for dropdown) ============
app.get('/api/pm/users', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT f_id, f_user_id, f_user_name, f_email FROM t_pm_user WHERE f_status = 1');
    res.json(response(200, 'success', rows));
  } catch (err) { res.json(response(500, err.message)); }
});

app.listen(PORT, () => {
  console.log(`PM System API running on port ${PORT}`);
});
