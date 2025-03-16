const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/api/todo', async (req, res) => {
  try {
    const [todo] = await pool.query('SELECT * FROM todo ORDER BY created_at DESC');
    res.json(todo);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving data', error: err.message });
  }
});


router.post('/api/todo', async (req, res) => {
  try {
    const { name, status } = req.body;
    if (!name || !status) {
      return res.status(400).json({ message: 'Name and status are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO todo (name, status, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
      [name, status]
    );

    res.status(201).json({ id: result.insertId, name, status });
  } catch (err) {
    res.status(500).json({ message: 'Error inserting data', error: err.message });
  }
});


router.put('/api/todo/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    if (!name && !status) {
      return res.status(400).json({ message: 'At least one field (name or status) is required' });
    }

    const fields = [];
    const values = [];

    if (name) {
      fields.push('name = ?');
      values.push(name);
    }

    if (status) {
      fields.push('status = ?');
      values.push(status);
    }

    values.push(id);

    const [updateResult] = await pool.query(
      `UPDATE todo SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const [rows] = await pool.query(
      'SELECT id, name, status, updated_at FROM todo WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: ' Task not found after update' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error updating data', error: err.message });
  }
});


router.delete('/api/todo/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM todo WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: `Task ${id} deleted successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting data', error: err.message });
  }
});

module.exports = router;