// Mock Backend - Using LocalStorage for "formality"
const STORAGE_KEYS = {
    USERS: 'todo_elite_users',
    TASKS: 'todo_elite_tasks',
    SESSION: 'todo_user'
};

// Global State
let currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION));
let currentTasks = [];
let currentFilter = 'all';

// -------------------------------------------------------------------
// AUTHENTICATION LOGIC (Frontend Only)
// -------------------------------------------------------------------
const AuthService = {
    signup: (name, email, password) => {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        if (users.find(u => u.email === email)) {
            throw new Error('Email already exists');
        }
        
        const newUser = { id: Date.now().toString(), name, email, password };
        users.push(newUser);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        return newUser;
    },

    login: (email, password) => {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) throw new Error('Invalid email or password');
        
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
        return user;
    },

    logout: () => {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
        window.location.href = 'index.html';
    }
};

// -------------------------------------------------------------------
// TASK MANAGEMENT LOGIC (Frontend Only)
// -------------------------------------------------------------------
const TaskService = {
    getTasks: (userId) => {
        const allTasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
        return allTasks.filter(t => t.userId === userId);
    },

    addTask: (title, userId) => {
        const allTasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
        const newTask = {
            id: Date.now().toString(),
            title,
            completed: false,
            userId
        };
        allTasks.push(newTask);
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(allTasks));
        return newTask;
    },

    updateTask: (id, updates) => {
        let allTasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
        allTasks = allTasks.map(t => t.id === id ? { ...t, ...updates } : t);
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(allTasks));
        return allTasks.find(t => t.id === id);
    },

    deleteTask: (id) => {
        let allTasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
        allTasks = allTasks.filter(t => t.id !== id);
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(allTasks));
    }
};

// -------------------------------------------------------------------
// UI & INITIALIZATION
// -------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const isPublicPage = window.location.pathname.endsWith('index.html') || 
                         window.location.pathname.endsWith('signup.html') ||
                         window.location.pathname === '/' ||
                         window.location.pathname === '';

    if (!currentUser && !isPublicPage) {
        window.location.href = 'index.html';
        return;
    }

    if (currentUser && isPublicPage) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Dashboard Initialization
    if (!isPublicPage && currentUser) {
        const userNameEl = document.getElementById('userName');
        if (userNameEl) userNameEl.textContent = currentUser.name;
        
        setupDashboardListeners();
        loadTasks();
    }
});

function setupDashboardListeners() {
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.onclick = () => AuthService.logout();

    // Add Task
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskInput = document.getElementById('newTaskInput');
    if (addTaskBtn && taskInput) {
        addTaskBtn.onclick = () => handleAddTask();
        taskInput.onkeypress = (e) => { if (e.key === 'Enter') handleAddTask(); };
    }

    // Filter Buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        };
    });
}

// -------------------------------------------------------------------
// ACTIONS
// -------------------------------------------------------------------
function loadTasks() {
    toggleLoader(true);
    setTimeout(() => { // Simulate short delay
        currentTasks = TaskService.getTasks(currentUser.id);
        renderTasks();
        toggleLoader(false);
    }, 300);
}

function handleAddTask() {
    const input = document.getElementById('newTaskInput');
    const title = input.value.trim();
    if (!title) return;

    const newTask = TaskService.addTask(title, currentUser.id);
    currentTasks.unshift(newTask);
    input.value = '';
    renderTasks();
    showToast('Task added!', 'success');
}

function toggleTaskStatus(id, completed) {
    const updated = TaskService.updateTask(id, { completed: !completed });
    currentTasks = currentTasks.map(t => t.id === id ? updated : t);
    renderTasks();
}

function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    TaskService.deleteTask(id);
    currentTasks = currentTasks.filter(t => t.id !== id);
    renderTasks();
    showToast('Task deleted', 'success');
}

function editTask(id) {
    const task = currentTasks.find(t => t.id === id);
    const newTitle = prompt('Edit task:', task.title);
    if (!newTitle || newTitle.trim() === '' || newTitle === task.title) return;

    const updated = TaskService.updateTask(id, { title: newTitle.trim() });
    currentTasks = currentTasks.map(t => t.id === id ? updated : t);
    renderTasks();
    showToast('Task updated!', 'success');
}

// -------------------------------------------------------------------
// RENDERING & HELPERS
// -------------------------------------------------------------------
function renderTasks() {
    const container = document.getElementById('todoList');
    const emptyState = document.getElementById('emptyState');
    if (!container) return;

    let tasksToRender = currentTasks;
    if (currentFilter === 'pending') tasksToRender = currentTasks.filter(t => !t.completed);
    if (currentFilter === 'completed') tasksToRender = currentTasks.filter(t => t.completed);

    if (tasksToRender.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    container.innerHTML = tasksToRender.map(task => `
        <div class="todo-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
            <div class="todo-content">${escapeHtml(task.title)}</div>
            <div class="todo-actions">
                <button class="icon-btn check-btn" onclick="toggleTaskStatus('${task.id}', ${task.completed})">
                    ${task.completed ? '↩️' : '✅'}
                </button>
                <button class="icon-btn edit-btn" onclick="editTask('${task.id}')">✏️</button>
                <button class="icon-btn delete-btn" onclick="deleteTask('${task.id}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

function toggleLoader(show) {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = show ? 'block' : 'none';
}

function showToast(message, type) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.borderColor = type === 'success' ? 'var(--success)' : 'var(--danger)'; 
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
