import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// Get all contact departments
router.get('/departments', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, created_at, updated_at FROM admin_contact_departments ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Get department by ID
router.get('/departments/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, created_at, updated_at FROM admin_contact_departments WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
});

// Create new department (Admin only)
router.post('/departments', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Department name is required' });
    }

    const result = await query(
      'INSERT INTO admin_contact_departments (name) VALUES ($1) RETURNING id, name, created_at, updated_at',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create department error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Department already exists' });
    }
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// Update department (Admin only)
router.put('/departments/:id', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Department name is required' });
    }

    const result = await query(
      'UPDATE admin_contact_departments SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, created_at, updated_at',
      [name, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update department error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Department name already exists' });
    }
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// Delete department (Admin only)
router.delete('/departments/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM admin_contact_departments WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json({ message: 'Department deleted' });
  } catch (error) {
    console.error('Delete department error:', error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Cannot delete department with existing messages' });
    }
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

// Create contact message (Aderente)
router.post('/messages', async (req, res) => {
  try {
    const { aderente_id, department_id, message } = req.body;
    
    if (!aderente_id || !department_id || !message || message.trim() === '') {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await query(
      `INSERT INTO aderente_contact_messages (aderente_id, department_id, message) 
       VALUES ($1, $2, $3) 
       RETURNING id, aderente_id, department_id, message, read, created_at, updated_at`,
      [aderente_id, department_id, message]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create contact message error:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

// Get all contact messages (Admin - all messages)
router.get('/messages', async (req, res) => {
  try {
    const { read } = req.query;
    let queryText = `
      SELECT 
        m.id, m.aderente_id, m.department_id, m.message, m.read, m.created_at, m.updated_at,
        u.fullname as aderente_name, u.email as aderente_email,
        d.name as department_name
      FROM aderente_contact_messages m
      JOIN users u ON m.aderente_id = u.id
      JOIN admin_contact_departments d ON m.department_id = d.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (read !== undefined) {
      queryText += ` AND m.read = $${paramCount}`;
      params.push(read === 'true');
      paramCount++;
    }

    queryText += ' ORDER BY m.created_at DESC';
    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get message by ID
router.get('/messages/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        m.id, m.aderente_id, m.department_id, m.message, m.read, m.created_at, m.updated_at,
        u.fullname as aderente_name, u.email as aderente_email,
        d.name as department_name
      FROM aderente_contact_messages m
      JOIN users u ON m.aderente_id = u.id
      JOIN admin_contact_departments d ON m.department_id = d.id
      WHERE m.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

// Mark message as read (Admin)
router.patch('/messages/:id/read', async (req, res) => {
  try {
    const result = await query(
      `UPDATE aderente_contact_messages 
       SET read = TRUE, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING id, aderente_id, department_id, message, read, created_at, updated_at`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// Delete message (Admin)
router.delete('/messages/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM aderente_contact_messages WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;
