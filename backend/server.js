// backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./db');
const app = express();

const PORT = 3000;
const SECRET = 'my-super-secret-todo-key-2025';

app.use(helmet());
app.use(cors());
app.use(express.json());

// ===== РЕГИСТРАЦИЯ =====
app.post('/api/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Email и пароль (мин. 6 символов) обязательны' });
  }

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).json({ error: 'Ошибка сервера' });
    db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hash], function(err) {
      if (err) return res.status(400).json({ error: 'Пользователь уже существует' });
      res.json({ message: 'Регистрация успешна' });
    });
  });
});

// ===== ВХОД =====
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err || !user) return res.status(400).json({ error: 'Неверный email или пароль' });
    bcrypt.compare(password, user.password, (err, match) => {
      if (!match) return res.status(400).json({ error: 'Неверный email или пароль' });
      const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '7d' });
      res.json({ token, userId: user.id });
    });
  });
});

// ===== ПОЛУЧИТЬ ЗАДАЧИ =====
app.get('/api/tasks', authenticate, (req, res) => {
  db.all('SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC', [req.user.userId], (err, tasks) => {
    if (err) return res.status(500).json({ error: 'Ошибка загрузки задач' });
    res.json(tasks);
  });
});

// ===== ДОБАВИТЬ ЗАДАЧУ =====
app.post('/api/tasks', authenticate, (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Текст задачи обязателен' });
  db.run('INSERT INTO tasks (user_id, text) VALUES (?, ?)', [req.user.userId, text], function(err) {
    if (err) return res.status(500).json({ error: 'Ошибка добавления задачи' });
    res.status(201).json({ id: this.lastID, text, completed: false });
  });
});

// ===== ОБНОВИТЬ СТАТУС =====
app.patch('/api/tasks/:id', authenticate, (req, res) => {
  const { completed } = req.body;
  db.run('UPDATE tasks SET completed = ? WHERE id = ? AND user_id = ?', [completed ? 1 : 0, req.params.id, req.user.userId], function(err) {
    if (err || this.changes === 0) return res.status(404).json({ error: 'Задача не найдена' });
    res.json({ message: 'Обновлено' });
  });
});

// ===== УДАЛИТЬ ЗАДАЧУ =====
app.delete('/api/tasks/:id', authenticate, (req, res) => {
  db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId], function(err) {
    if (err || this.changes === 0) return res.status(404).json({ error: 'Задача не найдена' });
    res.json({ message: 'Удалено' });
  });
});

// ===== ПРОМЕЖУТОЧНОЕ ПО — ПРОВЕРКА ТОКЕНА =====
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Требуется авторизация' });
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Неверный токен' });
    req.user = user;
    next();
  });
}

app.listen(PORT, () => {
  console.log(`✅ Бэкенд запущен на http://localhost:${PORT}`);
});