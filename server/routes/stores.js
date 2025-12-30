import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// Get all stores
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM stores ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

// Get store by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM stores WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch store' });
  }
});

// Create store
router.post('/', async (req, res) => {
  try {
    const { codehex, brand, size, city, gpslat, gpslong, dotUserId, aderenteId } = req.body;
    const result = await query(
      `INSERT INTO stores (codehex, brand, size, city, gpslat, gpslong, dot_operacional_id, aderente_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [codehex, brand, size, city, gpslat || 0, gpslong || 0, dotUserId || null, aderenteId || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create store error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Store code already exists' });
    }
    res.status(500).json({ error: 'Failed to create store' });
  }
});

// Update store
router.put('/:id', async (req, res) => {
  try {
    const { codehex, brand, size, city, gpslat, gpslong, dotUserId, aderenteId, telefone } = req.body;
    
    // Build dynamic UPDATE query based on provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (codehex !== undefined) {
      updates.push(`codehex = $${paramCount++}`);
      values.push(codehex);
    }
    if (brand !== undefined) {
      updates.push(`brand = $${paramCount++}`);
      values.push(brand);
    }
    if (size !== undefined) {
      updates.push(`size = $${paramCount++}`);
      values.push(size);
    }
    if (city !== undefined) {
      updates.push(`city = $${paramCount++}`);
      values.push(city);
    }
    if (gpslat !== undefined) {
      updates.push(`gpslat = $${paramCount++}`);
      values.push(gpslat);
    }
    if (gpslong !== undefined) {
      updates.push(`gpslong = $${paramCount++}`);
      values.push(gpslong);
    }
    if (dotUserId !== undefined) {
      updates.push(`dot_operacional_id = $${paramCount++}`);
      values.push(dotUserId);
    }
    if (aderenteId !== undefined) {
      updates.push(`aderente_id = $${paramCount++}`);
      values.push(aderenteId);
    }
    if (telefone !== undefined) {
      updates.push(`telefone = $${paramCount++}`);
      values.push(telefone);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(req.params.id);
    const result = await query(
      `UPDATE stores SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({ error: 'Failed to update store' });
  }
});

// Delete store
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM stores WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }
    res.json({ message: 'Store deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete store' });
  }
});

export default router;
