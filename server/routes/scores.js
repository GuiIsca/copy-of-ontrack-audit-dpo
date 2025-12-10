import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { auditId } = req.query;
    if (!auditId) return res.status(400).json({ error: 'auditId required' });
    const result = await query('SELECT * FROM audit_scores WHERE audit_id = $1', [auditId]);
    
    // Transform photo_url (string with comma-separated URLs) into photos array
    const rows = result.rows.map(row => {
      const photos = row.photo_url ? row.photo_url.split('|||').filter(Boolean) : [];
      return { ...row, photos };
    });
    
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { auditId, criteriaId, score, comment, photoUrl, allPhotos, evaluationType, requiresPhoto } = req.body;
    console.log('POST /api/scores received:', { 
      auditId, 
      criteriaId, 
      score, 
      scoreType: typeof score,
      scoreIsZero: score === 0,
      comment: comment ? 'YES' : 'NO', 
      photoUrl: photoUrl ? 'YES' : 'NO', 
      allPhotos: allPhotos?.length, 
      evaluationType, 
      requiresPhoto 
    });
    
    let finalPhotoUrl = '';
    
    // If allPhotos array is provided, use it directly (for operations like remove)
    if (allPhotos !== undefined) {
      finalPhotoUrl = Array.isArray(allPhotos) ? allPhotos.join('|||') : '';
    } else if (photoUrl) {
      // Adding a new photo - merge with existing
      const existing = await query(
        'SELECT photo_url FROM audit_scores WHERE audit_id = $1 AND criteria_id = $2',
        [auditId, criteriaId]
      );
      
      if (existing.rows.length > 0 && existing.rows[0].photo_url) {
        const existingPhotos = existing.rows[0].photo_url.split('|||').filter(Boolean);
        if (!existingPhotos.includes(photoUrl)) {
          finalPhotoUrl = [...existingPhotos, photoUrl].join('|||');
        } else {
          finalPhotoUrl = existing.rows[0].photo_url;
        }
      } else {
        finalPhotoUrl = photoUrl;
      }
    } else {
      // Keep existing photos if no photo operation
      const existing = await query(
        'SELECT photo_url FROM audit_scores WHERE audit_id = $1 AND criteria_id = $2',
        [auditId, criteriaId]
      );
      if (existing.rows.length > 0) {
        finalPhotoUrl = existing.rows[0].photo_url || '';
      }
    }
    
    console.log('Executing query with:', { auditId, criteriaId, score, comment: comment || 'NULL', finalPhotoUrl: finalPhotoUrl ? 'YES' : 'NO', evaluationType: evaluationType || 'OK_KO', requiresPhoto: requiresPhoto || false });
    
    const result = await query(
      `INSERT INTO audit_scores (audit_id, criteria_id, score, comment, photo_url, evaluation_type, requires_photo) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT (audit_id, criteria_id) 
       DO UPDATE SET score = $3, comment = $4, photo_url = $5, evaluation_type = $6, requires_photo = $7 
       RETURNING *`,
      [auditId, criteriaId, score, comment, finalPhotoUrl, evaluationType || 'OK_KO', requiresPhoto || false]
    );
    console.log('Score saved successfully, result:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error saving score:', error);
    res.status(500).json({ error: 'Failed to save score', details: error.message });
  }
});

export default router;
