// frontend/script.js
document.addEventListener('DOMContentLoaded', function () {
  // DOM
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const authSection = document.getElementById('auth-section');
  const appSection = document.getElementById('app-section');

  const taskInput = document.getElementById('task-input');
  const taskList = document.getElementById('task-list');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const tasksCount = document.getElementById('tasks-count');
  const progressBar = document.getElementById('progress-bar');
  const clearCompletedBtn = document.getElementById('clear-completed');

  let authToken = localStorage.getItem('authToken');
  let currentFilter = 'all';

  // Показать нужный экран
  if (authToken) {
    authSection.style.display = 'none';
    appSection.style.display = 'block';
    loadTasks();
  } else {
    authSection.style.display = 'block';
    appSection.style.display = 'none';
  }

  // ===== АВТОРИЗАЦИЯ =====
  function apiFetch(url, options = {}) {
    return fetch(`http://localhost:3000${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        ...options.headers
      }
    });
  }

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    try {
      const res = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('authToken', data.token);
        authToken = data.token;
        authSection.style.display = 'none';
        appSection.style.display = 'block';
        loadTasks();
      } else {
        alert('❌ ' + data.error);
      }
    } catch (err) {
      alert('Ошибка подключения к серверу');
    }
  });

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    if (password.length < 6) {
      alert('Пароль должен быть не менее 6 символов');
      return;
    }
    try {
      const res = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        alert('✅ Регистрация успешна! Войдите.');
      } else {
        alert('❌ ' + data.error);
      }
    } catch (err) {
      alert('Ошибка подключения к серверу');
    }
  });

  // ===== ЗАДАЧИ =====
  async function loadTasks() {
    const res = await apiFetch('/api/tasks');
    const tasks = await res.json();
    renderTasks(tasks);
    updateTasksCount(tasks);
  }

  async function addTask(text) {
    await apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify({ text }) });
    loadTasks();
  }

  async function toggleTask(id, completed) {
    await apiFetch(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ completed }) });
    loadTasks();
  }

  async function deleteTask(id) {
    await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' });
    loadTasks();
  }

  function renderTasks(tasks) {
    let filtered = tasks;
    if (currentFilter === 'active') filtered = tasks.filter(t => !t.completed);
    if (currentFilter === 'completed') filtered = tasks.filter(t => t.completed);

    taskList.innerHTML = '';
    if (filtered.length === 0) {
      taskList.innerHTML = `<li class="empty-state"><i class="fas fa-clipboard-list"></i><br>Нет задач</li>`;
      return;
    }

    filtered.forEach(task => {
      const li = document.createElement('li');
      li.className = `task-item ${task.completed ? 'completed' : ''}`;
      li.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <span class="task-text">${task.text}</span>
        <button class="delete-btn"><i class="fas fa-trash"></i></button>
      `;
      li.querySelector('.task-checkbox').onchange = () => toggleTask(task.id, !task.completed);
      li.querySelector('.delete-btn').onclick = () => deleteTask(task.id);
      taskList.appendChild(li);
    });
  }

  function updateTasksCount(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    tasksCount.textContent = `${active} активных, ${completed} завершённых, всего ${total}`;
    progressBar.style.width = total ? `${(completed / total) * 100}%` : '0%';
  }

  // ===== ОБРАБОТЧИКИ =====
  taskInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const text = taskInput.value.trim();
      if (text) {
        addTask(text);
        taskInput.value = '';
      }
    }
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      filterBtns.forEach(b => b.classList.toggle('active', b === btn));
      // задачи перерисуются при следующем loadTasks (например, после добавления)
    });
  });

  clearCompletedBtn?.addEventListener('click', async () => {
    if (confirm('Удалить все завершённые задачи?')) {
      const res = await apiFetch('/api/tasks');
      const tasks = await res.json();
      const completedIds = tasks.filter(t => t.completed).map(t => t.id);
      for (const id of completedIds) {
        await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' });
      }
      loadTasks();
    }
  });
});