document.addEventListener('DOMContentLoaded', function () {
  // DOM Elements
  const loginSection = document.getElementById('login-section');
  const appSection = document.getElementById('app-section');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const showRegisterLink = document.getElementById('show-register');
  const showLoginLink = document.getElementById('show-login');
  const backToLogin = document.getElementById('back-to-login');
  const userEmail = document.getElementById('user-email');
  const logoutBtn = document.getElementById('logout-btn');

  // To-Do elements
  const taskInput = document.getElementById('task-input');
  const taskList = document.getElementById('task-list');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const tasksCount = document.getElementById('tasks-count');
  const progressBar = document.getElementById('progress-bar');
  const clearCompletedBtn = document.getElementById('clear-completed');

  let authToken = localStorage.getItem('authToken');
  let currentFilter = 'all';
  let allTasks = [];

  // Проверка входа
  if (authToken) {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    userEmail.textContent = user.email || 'Пользователь';
    loginSection.style.display = 'none';
    appSection.style.display = 'block';
    loadTasks();
  } else {
    loginSection.style.display = 'flex';
    appSection.style.display = 'none';
  }

  // ========== API ==========
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

  // ========== AUTH ==========
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      const res = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify({ email }));
        authToken = data.token;
        userEmail.textContent = email;
        loginSection.style.display = 'none';
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
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    try {
      const res = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        alert('✅ Регистрация успешна! Теперь войдите.');
        showLoginLink.click();
      } else {
        alert('❌ ' + data.error);
      }
    } catch (err) {
      alert('Ошибка подключения к серверу');
    }
  });

  // Переключение форм
  showRegisterLink?.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    document.querySelector('.auth-toggle').style.display = 'none';
    backToLogin.style.display = 'block';
  });
  showLoginLink?.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    document.querySelector('.auth-toggle').style.display = 'block';
    backToLogin.style.display = 'none';
  });

  // ========== ВЫХОД ==========
  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    loginSection.style.display = 'flex';
    appSection.style.display = 'none';
    taskList.innerHTML = '';
    tasksCount.textContent = '0 задач';
    progressBar.style.width = '0%';
  });

  // ========== TO-DO ==========
  async function loadTasks() {
    try {
      const res = await apiFetch('/api/tasks');
      allTasks = await res.json();
      renderTasks();
      updateTasksCount();
    } catch (err) {
      alert('Ошибка загрузки задач');
    }
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

  function renderTasks() {
    let filtered = allTasks;
    if (currentFilter === 'active') filtered = allTasks.filter(t => !t.completed);
    if (currentFilter === 'completed') filtered = allTasks.filter(t => t.completed);

    taskList.innerHTML = '';
    if (filtered.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'empty-state';
      let msg = 'Нет задач';
      if (currentFilter === 'all') msg = 'Список пуст. Добавьте задачу!';
      else if (currentFilter === 'active') msg = 'Нет активных задач!';
      else if (currentFilter === 'completed') msg = 'Нет завершённых задач!';
      empty.innerHTML = `<i class="fas fa-clipboard-list"></i><br>${msg}`;
      taskList.appendChild(empty);
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
      li.querySelector('.task-checkbox').addEventListener('change', () => toggleTask(task.id, !task.completed));
      li.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));
      taskList.appendChild(li);
    });
  }

  function updateTasksCount() {
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.completed).length;
    const active = total - completed;
    tasksCount.textContent = `${active} активных, ${completed} завершённых, всего ${total}`;
    progressBar.style.width = total ? `${(completed / total) * 100}%` : '0%';
  }

  // Добавление по Enter
  taskInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const text = taskInput.value.trim();
      if (text) {
        addTask(text);
        taskInput.value = '';
      }
    }
  });

  // ФИЛЬТРАЦИЯ — исправлено!
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      filterBtns.forEach(b => b.classList.toggle('active', b === btn));
      renderTasks(); // <-- главная строка: перерисовка при смене фильтра
    });
  });

  // Очистка завершённых
  clearCompletedBtn?.addEventListener('click', async () => {
    if (!allTasks.some(t => t.completed)) {
      alert('Нет завершённых задач для очистки!');
      return;
    }
    if (confirm('Удалить все завершённые задачи?')) {
      const completedIds = allTasks.filter(t => t.completed).map(t => t.id);
      for (const id of completedIds) {
        await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' });
      }
      loadTasks();
    }
  });
});