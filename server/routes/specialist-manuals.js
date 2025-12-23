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

// Configure upload directory for specialist manuals
const uploadsDir = path.join(__dirname, '../../public/specialist-manuals');
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

// Get all specialist areas
router.get('/areas', async (req, res) => {
  try {
    const areas = [
      'Frutas e Legumes',
      'Padaria Pastelaria LS',
      'Charcutaria e Queijos',
      'Talho',
      'Peixaria',
      'Pronto a Comer'
    ];
    res.json(areas);
  } catch (error) {
    console.error('Get areas error:', error);
    res.status(500).json({ error: 'Failed to fetch areas' });
  }
});

// Get manuals by area
router.get('/area/:area', async (req, res) => {
  try {
    const { area } = req.params;
    const result = await query(
      `SELECT id, area, filename, original_filename, file_size, master_user_manual, 
              uploaded_by, created_at FROM specialist_manuals 
       WHERE area = $1 ORDER BY master_user_manual DESC, created_at DESC`,
      [area]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get manuals by area error:', error);
    res.status(500).json({ error: 'Failed to fetch manuals' });
  }
});

// Get all manuals (admin only)
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, area, filename, original_filename, file_size, master_user_manual, 
              uploaded_by, created_at FROM specialist_manuals 
       ORDER BY area, master_user_manual DESC, created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get all manuals error:', error);
    res.status(500).json({ error: 'Failed to fetch manuals' });
  }
});

// Upload new manual (admin only)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { area, masterUserManual } = req.body;
    const uploadedBy = req.headers['x-user-id'];

    if (!area) {
      // Delete the uploaded file if area is not provided
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Area is required' });
    }

    const result = await query(
      `INSERT INTO specialist_manuals (area, filename, original_filename, file_path, file_size, master_user_manual, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, area, filename, original_filename, file_size, master_user_manual, uploaded_by, created_at`,
      [
        area,
        req.file.filename,
        req.file.originalname,
        `/specialist-manuals/${req.file.filename}`,
        req.file.size,
        masterUserManual === 'true' || masterUserManual === true,
        uploadedBy
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Upload manual error:', error);
    // Clean up uploaded file if database insert fails
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    res.status(500).json({ error: 'Failed to upload manual' });
  }
});

// Delete manual (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get the file info before deleting from database
    const result = await query(
      'SELECT filename, file_path FROM specialist_manuals WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Manual not found' });
    }

    const { filename, file_path } = result.rows[0];

    // Delete from database
    await query('DELETE FROM specialist_manuals WHERE id = $1', [id]);

    // Delete file from disk
    const filePath = path.join(uploadsDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'Manual deleted successfully' });
  } catch (error) {
    console.error('Delete manual error:', error);
    res.status(500).json({ error: 'Failed to delete manual' });
  }
});

// Update manual (toggle master user manual flag)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { masterUserManual } = req.body;

    const result = await query(
      `UPDATE specialist_manuals SET master_user_manual = $1 
       WHERE id = $2
       RETURNING id, area, filename, original_filename, file_size, master_user_manual, uploaded_by, created_at`,
      [masterUserManual, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Manual not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update manual error:', error);
    res.status(500).json({ error: 'Failed to update manual' });
  }
});

export default router;
