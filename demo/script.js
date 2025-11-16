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

  let currentUserEmail = localStorage.getItem('currentUserEmail');
  let currentFilter = 'all';
  let allTasks = [];

  // === ИНИЦИАЛИЗАЦИЯ ЛОКАЛЬНОЙ "БАЗЫ" ===
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify({
      '0gi1y@2200freefonts.com': {
        password: '123456',
        tasks: [
          { id: Date.now(), text: 'Добро пожаловать в демо-версию!', completed: false }
        ]
      }
    }));
  }

  // === АВТОВХОД ===
  if (currentUserEmail) {
    const users = JSON.parse(localStorage.getItem('users'));
    if (users[currentUserEmail]) {
      userEmail.textContent = currentUserEmail;
      loginSection.style.display = 'none';
      appSection.style.display = 'block';
      loadTasks();
    } else {
      localStorage.removeItem('currentUserEmail');
    }
  }

  // === ПЕРЕКЛЮЧЕНИЕ ФОРМ ===
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

  // === РЕГИСТРАЦИЯ ===
  registerForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    const users = JSON.parse(localStorage.getItem('users'));

    if (users[email]) {
      alert('❌ Пользователь с таким email уже существует');
      return;
    }

    users[email] = { password, tasks: [] };
    localStorage.setItem('users', JSON.stringify(users));
    alert('✅ Регистрация успешна! Теперь войдите.');
    showLoginLink.click();
  });

  // === ВХОД ===
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const users = JSON.parse(localStorage.getItem('users'));

    if (!users[email] || users[email].password !== password) {
      alert('❌ Неверный email или пароль');
      return;
    }

    localStorage.setItem('currentUserEmail', email);
    currentUserEmail = email;
    userEmail.textContent = email;
    loginSection.style.display = 'none';
    appSection.style.display = 'block';
    loadTasks();
  });

  // === ВЫХОД ===
  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('currentUserEmail');
    currentUserEmail = null;
    loginSection.style.display = 'flex';
    appSection.style.display = 'none';
    taskList.innerHTML = '';
    tasksCount.textContent = '0 задач';
    progressBar.style.width = '0%';
  });

  // === ЗАДАЧИ — РАБОТА С localStorage ===
  function loadTasks() {
    const users = JSON.parse(localStorage.getItem('users'));
    allTasks = users[currentUserEmail]?.tasks || [];
    renderTasks();
    updateTasksCount();
  }

  function saveTasks() {
    const users = JSON.parse(localStorage.getItem('users'));
    users[currentUserEmail].tasks = allTasks;
    localStorage.setItem('users', JSON.stringify(users));
  }

  function addTask(text) {
    if (!text.trim()) return;
    allTasks.push({ id: Date.now(), text: text.trim(), completed: false });
    saveTasks();
    loadTasks();
  }

  function toggleTask(id) {
    const task = allTasks.find(t => t.id === id);
    if (task) task.completed = !task.completed;
    saveTasks();
    loadTasks();
  }

  function deleteTask(id) {
    allTasks = allTasks.filter(t => t.id !== id);
    saveTasks();
    loadTasks();
  }

  function clearCompleted() {
    allTasks = allTasks.filter(t => !t.completed);
    saveTasks();
    loadTasks();
  }

  // === РЕНДЕР ===
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
      li.querySelector('.task-checkbox').addEventListener('change', () => toggleTask(task.id));
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

  // === СОБЫТИЯ ===
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
      renderTasks();
    });
  });

  clearCompletedBtn?.addEventListener('click', () => {
    if (!allTasks.some(t => t.completed)) {
      alert('Нет завершённых задач для очистки!');
      return;
    }
    if (confirm('Удалить все завершённые задачи?')) {
      clearCompleted();
    }
  });
});