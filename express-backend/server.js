require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');


const app = express();
const todoRouter = require('./routes/todoRoutes'); 


app.use(express.json());

app.use(cors({
  origin: "http://localhost:5173", 
  credentials: true, 
  methods: "GET,POST,PUT,DELETE", 
  allowedHeaders: "Content-Type,Authorization" 
}));


const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'root',
  database: process.env.DB_NAME || 'todo_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MariaDB');
    connection.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
})();


app.get('/', (req, res) => {
  res.send('Welcome to the TODO API 🚀');
});


app.get('/api/todo', async (req, res) => {
  try {
    const [todo] = await pool.query('SELECT * FROM todo ORDER BY created_at DESC');
    res.json(todo);
  } catch (err) {
    res.status(500).json({ message: '❌ Error retrieving data', error: err.message });
  }
});


app.post('/api/todo', async (req, res) => {
  const { name, status } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO todo (name, status) VALUES (?, ?)',
      [name, status || 'to-do']
    );
    const newTodo = {
      id: result.insertId,
      name,
      status: status || 'to-do',
      created_at: new Date(),
      updated_at: new Date(),
    };
    res.status(201).json(newTodo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/todo/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    if (!name && !status) {
      return res.status(400).json({ message: '❌ At least one field (name or status) is required' });
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
      return res.status(404).json({ message: '❌ Task not found' });
    }

    const [rows] = await pool.query(
      'SELECT id, name, status, updated_at FROM todo WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: '❌ Task not found after update' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({
      message: '❌ Error updating data',
      error: err.message,
    });
  }
});


app.delete('/api/todo/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM todo WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '❌ Task not found' });
    }

    res.json({ message: `✅ Task ${id} deleted successfully` });
  } catch (err) {
    res.status(500).json({ message: '❌ Error deleting data', error: err.message });
  }
});


app.use((req, res) => {
  res.status(404).json({ message: '❌ Route not found' });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
