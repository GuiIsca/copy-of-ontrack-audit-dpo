import express from 'express';
import { query } from '../db/index.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure upload directory for folhetos
const uploadsDir = path.join(__dirname, '../../public/folhetos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.originalname}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Only allow PDF files
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Get all folhetos
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, filename, original_filename, file_size, uploaded_by, created_at 
       FROM folhetos ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get folhetos error:', error);
    res.status(500).json({ error: 'Failed to fetch folhetos' });
  }
});

// Upload new folheto (admin only)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const uploadedBy = req.headers['x-user-id'];

    const result = await query(
      `INSERT INTO folhetos (filename, original_filename, file_path, file_size, uploaded_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, filename, original_filename, file_size, uploaded_by, created_at`,
      [
        req.file.filename,
        req.file.originalname,
        `/folhetos/${req.file.filename}`,
        req.file.size,
        uploadedBy
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Upload folheto error:', error);
    // Clean up uploaded file if database insert fails
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    res.status(500).json({ error: 'Failed to upload folheto' });
  }
});

// Delete folheto (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get the file info before deleting from database
    const result = await query(
      'SELECT filename, file_path FROM folhetos WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Folheto not found' });
    }

    const { filename } = result.rows[0];

    // Delete from database
    await query('DELETE FROM folhetos WHERE id = $1', [id]);

    // Delete file from disk
    const filePath = path.join(uploadsDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'Folheto deleted successfully' });
  } catch (error) {
    console.error('Delete folheto error:', error);
    res.status(500).json({ error: 'Failed to delete folheto' });
  }
});

export default router;
