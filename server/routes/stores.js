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
    const {
      numero,
      nome,
      formato,
      area,
      telefone,
      dot_operacional_id,
      aderente_id,
      situacao_pdv,
      data_abertura,
      ultima_retoma,
      distrito,
      amplitude_horaria,
      morada,
      codigo_postal,
      conjugue_adh
    } = req.body;

    // Check for duplicate numero
    if (numero) {
      const existing = await query('SELECT id FROM stores WHERE numero = $1', [numero]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Já existe uma loja com esse número.' });
      }
    }

    const result = await query(
      `INSERT INTO stores (
        numero, nome, formato, area, telefone, dot_operacional_id, aderente_id, situacao_pdv, data_abertura, ultima_retoma, distrito, amplitude_horaria, morada, codigo_postal, conjugue_adh
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      ) RETURNING *`,
      [
        numero || null,
        nome || null,
        formato || null,
        area || null,
        telefone || null,
        dot_operacional_id || null,
        aderente_id || null,
        situacao_pdv || null,
        data_abertura || null,
        ultima_retoma || null,
        distrito || null,
        amplitude_horaria || null,
        morada || null,
        codigo_postal || null,
        conjugue_adh || null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({ error: 'Failed to create store' });
  }
});

// Update store
router.put('/:id', async (req, res) => {
  try {
    const {
      numero,
      nome,
      formato,
      area,
      telefone,
      dot_operacional_id,
      aderente_id,
      situacao_pdv,
      data_abertura,
      ultima_retoma,
      distrito,
      amplitude_horaria,
      morada,
      codigo_postal,
      conjugue_adh,
      lugares_estacionamento,
      pac
    } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (numero !== undefined) {
      updates.push(`numero = $${paramCount++}`);
      values.push(numero);
    }
    if (nome !== undefined) {
      updates.push(`nome = $${paramCount++}`);
      values.push(nome);
    }
    if (formato !== undefined) {
      updates.push(`formato = $${paramCount++}`);
      values.push(formato);
    }
    if (area !== undefined) {
      updates.push(`area = $${paramCount++}`);
      values.push(area);
    }
    if (telefone !== undefined) {
      updates.push(`telefone = $${paramCount++}`);
      values.push(telefone);
    }
    if (dot_operacional_id !== undefined) {
      updates.push(`dot_operacional_id = $${paramCount++}`);
      values.push(dot_operacional_id);
    }
    if (aderente_id !== undefined) {
      updates.push(`aderente_id = $${paramCount++}`);
      values.push(aderente_id);
    }
    if (situacao_pdv !== undefined) {
      updates.push(`situacao_pdv = $${paramCount++}`);
      values.push(situacao_pdv);
    }
    if (data_abertura !== undefined) {
      updates.push(`data_abertura = $${paramCount++}`);
      values.push(data_abertura);
    }
    if (ultima_retoma !== undefined) {
      updates.push(`ultima_retoma = $${paramCount++}`);
      values.push(ultima_retoma);
    }
    if (distrito !== undefined) {
      updates.push(`distrito = $${paramCount++}`);
      values.push(distrito);
    }
    if (amplitude_horaria !== undefined) {
      updates.push(`amplitude_horaria = $${paramCount++}`);
      values.push(amplitude_horaria);
    }
    if (morada !== undefined) {
      updates.push(`morada = $${paramCount++}`);
      values.push(morada);
    }
    if (codigo_postal !== undefined) {
      updates.push(`codigo_postal = $${paramCount++}`);
      values.push(codigo_postal);
    }
    if (conjugue_adh !== undefined) {
      updates.push(`conjugue_adh = $${paramCount++}`);
      values.push(conjugue_adh);
    }
    if (lugares_estacionamento !== undefined) {
      updates.push(`lugares_estacionamento = $${paramCount++}`);
      values.push(lugares_estacionamento);
    }
    if (pac !== undefined) {
      updates.push(`pac = $${paramCount++}`);
      values.push(pac);
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
