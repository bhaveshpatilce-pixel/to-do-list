const API_BASE = 'https://to-do-list-production-ec7c.up.railway.app/api';
let currentUser = JSON.parse(localStorage.getItem('todo_user'));
let currentTasks = [];
let currentFilter = 'all';

// Initialize
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

    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = currentUser.name;

    setupEventListeners();
    fetchTasks();
});

function setupEventListeners() {
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.removeItem('todo_user');
            window.location.href = 'index.html';
        };
    }

    // Add Task
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskInput = document.getElementById('newTaskInput');
    if (addTaskBtn && taskInput) {
        addTaskBtn.onclick = () => addTask();
        taskInput.onkeypress = (e) => {
            if (e.key === 'Enter') addTask();
        };
    }

    // Filters
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.onclick = () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        };
    });
}

// API Calls
async function fetchTasks() {
    toggleLoader(true);
    try {
        const response = await fetch(`${API_BASE}/tasks/${currentUser.id}`);
        if (response.ok) {
            currentTasks = await response.json();
            renderTasks();
        } else {
            showToast('Failed to fetch tasks', 'error');
        }
    } catch (err) {
        showToast('Server connection failed', 'error');
    } finally {
        toggleLoader(false);
    }
}

async function addTask() {
    const input = document.getElementById('newTaskInput');
    const title = input.value.trim();
    if (!title) return;

    try {
        const response = await fetch(`${API_BASE}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                completed: false,
                userId: currentUser.id
            })
        });

        if (response.ok) {
            const newTask = await response.json();
            currentTasks.unshift(newTask);
            input.value = '';
            renderTasks();
            showToast('Task added!', 'success');
        }
    } catch (err) {
        showToast('Failed to add task', 'error');
    }
}

async function toggleTaskStatus(id, completed) {
    const task = currentTasks.find(t => t.id === id);
    if (!task) return;

    try {
        const response = await fetch(`${API_BASE}/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: task.title,
                completed: !completed
            })
        });

        if (response.ok) {
            const updatedTask = await response.json();
            currentTasks = currentTasks.map(t => t.id === id ? updatedTask : t);
            renderTasks();
        }
    } catch (err) {
        showToast('Failed to update task', 'error');
    }
}

async function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        const response = await fetch(`${API_BASE}/tasks/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            currentTasks = currentTasks.filter(t => t.id !== id);
            renderTasks();
            showToast('Task deleted', 'success');
        }
    } catch (err) {
        showToast('Failed to delete task', 'error');
    }
}

async function editTask(id) {
    const task = currentTasks.find(t => t.id === id);
    const newTitle = prompt('Edit task:', task.title);
    if (newTitle === null || newTitle.trim() === '' || newTitle === task.title) return;

    try {
        const response = await fetch(`${API_BASE}/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: newTitle.trim(),
                completed: task.completed
            })
        });

        if (response.ok) {
            const updatedTask = await response.json();
            currentTasks = currentTasks.map(t => t.id === id ? updatedTask : t);
            renderTasks();
            showToast('Task updated!', 'success');
        }
    } catch (err) {
        showToast('Failed to edit task', 'error');
    }
}

// UI Helpers
function renderTasks() {
    const container = document.getElementById('todoList');
    const emptyState = document.getElementById('emptyState');
    
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
                <button class="icon-btn check-btn" onclick="toggleTaskStatus('${task.id}', ${task.completed})" title="${task.completed ? 'Mark as pending' : 'Mark as complete'}">
                    ${task.completed ? '↩️' : '✅'}
                </button>
                <button class="icon-btn edit-btn" onclick="editTask('${task.id}')" title="Edit task">
                    ✏️
                </button>
                <button class="icon-btn delete-btn" onclick="deleteTask('${task.id}')" title="Delete task">
                    🗑️
                </button>
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
