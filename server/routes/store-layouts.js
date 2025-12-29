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

// Base uploads directory for store layouts
const baseUploadsDir = path.join(__dirname, '../../public/store-layouts');
if (!fs.existsSync(baseUploadsDir)) {
  fs.mkdirSync(baseUploadsDir, { recursive: true });
}

// Configure multer storage (we create per-store subfolder at runtime)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Default to base dir; we'll move based on storeId in filename logic
    cb(null, baseUploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const storeId = req.body.storeId || 'unknown';
    // Try to fix garbled UTF-8: if it has mojibake patterns, decode from binary
    let original = file.originalname || '';
    try {
      // If we see garbled chars like Ã, try binary->utf8 conversion
      if (/Ã|Â|Ñ|Ä|Ë/.test(original)) {
        original = Buffer.from(original, 'binary').toString('utf8');
      }
    } catch (e) {
      // Keep original if conversion fails
    }
    const normalized = original.normalize('NFC');
    // Sanitize only forbidden path characters
    const safeOriginal = normalized.replace(/[\\\/:*?"<>|]/g, '_').trim();
    const filename = `${storeId}-${timestamp}-${safeOriginal}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// Helper to ensure per-store dir exists and move file if needed
function ensureStoreSubdir(originalPath, filename, storeId) {
  try {
    const subDir = path.join(baseUploadsDir, String(storeId));
    if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });
    const destPath = path.join(subDir, filename);
    if (originalPath !== destPath) {
      fs.renameSync(originalPath, destPath);
    }
    return destPath;
  } catch (e) {
    return originalPath;
  }
}

// List layouts by store (optional query storeId). Returns latest per type if requested as summary=true
router.get('/', async (req, res) => {
  try {
    const { storeId, summary } = req.query;
    if (storeId) {
      const result = await query(
        `SELECT id, store_id, layout_type, filename, original_filename, file_path, file_size, mime_type, uploaded_by, created_at
         FROM store_layouts WHERE store_id = $1 ORDER BY created_at DESC`,
        [storeId]
      );
      if (summary === 'true') {
        // Reduce to latest per type
        const seen = new Set();
        const filtered = [];
        for (const row of result.rows) {
          if (!seen.has(row.layout_type)) {
            seen.add(row.layout_type);
            filtered.push(row);
          }
        }
        return res.json(filtered);
      }
      return res.json(result.rows);
    }
    // No storeId -> return all (admin)
    const all = await query(
      `SELECT id, store_id, layout_type, filename, original_filename, file_path, file_size, mime_type, uploaded_by, created_at
       FROM store_layouts ORDER BY store_id, layout_type, created_at DESC`
    );
    res.json(all.rows);
  } catch (error) {
    console.error('Get store layouts error:', error);
    res.status(500).json({ error: 'Failed to fetch store layouts' });
  }
});

// Upload a layout (admin only)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { storeId, layoutType } = req.body;
    const uploadedBy = req.headers['x-user-id'];

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    if (!storeId || !layoutType) {
      // Clean up
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'storeId and layoutType are required' });
    }

    // Validate type-specific extensions
    const ext = path.extname(req.file.originalname).toLowerCase();
    const isPdf = ext === '.pdf';
    const isDwg = ext === '.dwg';

    if (layoutType === 'PLANTA_LOJA') {
      if (!isPdf) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Planta da Loja deve ser PDF' });
      }
    } else if (layoutType === 'LAYOUT_FORMATO') {
      if (!(isPdf || isDwg)) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Layout do Formato deve ser PDF ou DWG' });
      }
    } else {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'layoutType inválido' });
    }

    // Move file to per-store subdir
    const finalPath = ensureStoreSubdir(req.file.path, req.file.filename, storeId);
    const relativePath = `/store-layouts/${storeId}/${req.file.filename}`;

    const result = await query(
      `INSERT INTO store_layouts (store_id, layout_type, filename, original_filename, file_path, file_size, mime_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, store_id, layout_type, filename, original_filename, file_path, file_size, mime_type, uploaded_by, created_at`,
      [
        storeId,
        layoutType,
        req.file.filename,
        req.file.originalname,
        relativePath,
        req.file.size,
        req.file.mimetype,
        uploadedBy
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Upload store layout error:', error);
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({ error: 'Failed to upload store layout' });
  }
});

// Delete layout (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT store_id, filename FROM store_layouts WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Layout não encontrado' });
    }
    const { store_id, filename } = result.rows[0];

    await query('DELETE FROM store_layouts WHERE id = $1', [id]);

    const filePath = path.join(baseUploadsDir, String(store_id), filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'Layout eliminado com sucesso' });
  } catch (error) {
    console.error('Delete layout error:', error);
    res.status(500).json({ error: 'Failed to delete store layout' });
  }
});

// Stream file by ID (safe against SPA fallback)
router.get('/file/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT store_id, filename, original_filename, mime_type FROM store_layouts WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ficheiro não encontrado' });
    }
    const { store_id, filename, original_filename, mime_type } = result.rows[0];
    const absPath = path.join(baseUploadsDir, String(store_id), filename);
    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ error: 'Ficheiro não existe no servidor' });
    }
    if (mime_type) {
      res.type(mime_type);
    }
    res.sendFile(absPath);
  } catch (error) {
    console.error('Stream file error:', error);
    res.status(500).json({ error: 'Falha ao carregar ficheiro' });
  }
});

export default router;
