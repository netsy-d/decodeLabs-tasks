/**
 * ========================================
 * MindKeep - Interactive Task Manager
 * Project 3: Interactive Web Elements
 * ========================================
 */

// ========================================
// STATE MANAGEMENT
// ========================================

let tasks = [];
let currentTheme = 'light';
let editingTaskId = null;

// ========================================
// DOM REFS
// ========================================

const taskForm = document.querySelector('.js-task-form');
const taskInput = document.querySelector('.js-task-input');
const contentInput = document.querySelector('.js-content-input');
const timeInput = document.querySelector('.js-time-input');
const remindCheck = document.querySelector('.js-remind-check');
const taskList = document.querySelector('.js-task-list');
const taskCounter = document.querySelector('.js-task-counter');
const emptyState = document.querySelector('.js-empty-state');
const themeToggle = document.querySelector('.js-theme-toggle');
const attachBtns = document.querySelectorAll('.js-attach-btn');
const submitBtn = document.querySelector('.js-submit-btn');

// ========================================
// INITIALIZATION
// ========================================

function init() {
  console.log('MindKeep initialized!');
  
  loadTasks();
  loadTheme();
  setDefaultTime();
  renderTasks();
  setupEventListeners();
  setupKeyboardShortcuts();
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
  if (taskForm) {
    taskForm.addEventListener('submit', handleAddTask);
    console.log('Form listener attached');
  }
  
  if (themeToggle) {
    themeToggle.addEventListener('click', handleThemeToggle);
    console.log('Theme toggle listener attached');
  }
  
  attachBtns.forEach(btn => {
    btn.addEventListener('click', handleAttachButton);
  });
  console.log('Attachment buttons listeners attached');

  // Clear editing state when clicking outside
  document.addEventListener('click', function(e) {
    if (editingTaskId && !e.target.closest('#add-task')) {
      cancelEditing();
    }
  });
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', function(e) {
    // Ctrl+Enter to submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (document.activeElement === taskInput || 
          document.activeElement === contentInput ||
          document.activeElement === timeInput) {
        e.preventDefault();
        taskForm.dispatchEvent(new Event('submit'));
      }
    }
    
    // Escape to cancel editing
    if (e.key === 'Escape' && editingTaskId) {
      cancelEditing();
    }
  });
}

// ========================================
// HANDLE ADD TASK
// ========================================

function handleAddTask(e) {
  e.preventDefault();
  console.log('Add task triggered!');
  
  const title = taskInput.value.trim();
  const content = contentInput.value.trim();
  const time = timeInput.value;
  const remind = remindCheck.checked;
  
  if (!title) {
    showNotification('Please enter a task title.', 'warning');
    taskInput.focus();
    taskInput.style.borderColor = '#e53e3e';
    setTimeout(() => {
      taskInput.style.borderColor = '';
    }, 3000);
    return;
  }
  
  // Check for duplicate task (case insensitive)
  const duplicate = tasks.some(t => 
    t.title.toLowerCase() === title.toLowerCase() && 
    !t.completed &&
    t.id !== editingTaskId
  );
  
  if (duplicate) {
    showNotification('A task with this title already exists!', 'warning');
    return;
  }
  
  if (editingTaskId) {
    // Update existing task
    const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
    if (taskIndex !== -1) {
      tasks[taskIndex] = {
        ...tasks[taskIndex],
        title: title,
        content: content || 'No additional details',
        time: time || new Date().toISOString().slice(0, 16),
        remind: remind,
        updatedAt: new Date().toISOString()
      };
      showNotification('Task updated successfully!', 'success');
    }
    editingTaskId = null;
    submitBtn.textContent = '➕ add task';
    submitBtn.style.backgroundColor = '';
  } else {
    // Add new task
    const task = {
      id: Date.now(),
      title: title,
      content: content || 'No additional details',
      time: time || new Date().toISOString().slice(0, 16),
      remind: remind,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    tasks.unshift(task);
    showNotification('Task added successfully!', 'success');
    console.log('Task added:', task.title);
  }
  
  saveTasks();
  renderTasks();
  clearForm();
  taskInput.focus();
}

// ========================================
// HANDLE THEME TOGGLE
// ========================================

function handleThemeToggle() {
  console.log('Theme toggle clicked!');
  
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  localStorage.setItem('mindkeep-theme', currentTheme);
  applyTheme(currentTheme);
  
  const icon = themeToggle.querySelector('.theme-toggle__icon');
  if (icon) {
    icon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
  }
  
  // Add animation feedback
  themeToggle.style.transform = 'rotate(360deg)';
  setTimeout(() => {
    themeToggle.style.transform = '';
  }, 300);
}

// ========================================
// HANDLE ATTACH BUTTON
// ========================================

function handleAttachButton(e) {
  const btn = e.currentTarget;
  const type = btn.dataset.type;
  console.log('Attachment clicked:', type);
  
  // For image and doc, open file picker
  if (type === 'image' || type === 'doc') {
    openFilePicker(type);
    return;
  }
  
  // For link and note, insert templates
  const templates = {
    'link': '🔗 https://example.com/',
    'note': '📝 Write your note here...'
  };
  
  const template = templates[type] || '';
  if (!template || !contentInput) return;
  
  // Insert at cursor position or append
  const start = contentInput.selectionStart;
  const end = contentInput.selectionEnd;
  const text = contentInput.value;
  
  if (start !== undefined && start !== null) {
    contentInput.value = text.substring(0, start) + template + text.substring(end);
    const newCursorPos = start + template.length;
    contentInput.selectionStart = contentInput.selectionEnd = newCursorPos;
  } else {
    contentInput.value += (contentInput.value ? '\n' : '') + template;
  }
  
  contentInput.focus();
  
  // Visual feedback
  btn.style.transform = 'scale(0.95)';
  setTimeout(() => {
    btn.style.transform = '';
  }, 200);
}

// ========================================
// OPEN FILE PICKER
// ========================================

function openFilePicker(type) {
  // Create hidden file input
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  
  // Set accept based on type
  if (type === 'image') {
    fileInput.accept = 'image/*';
  } else if (type === 'doc') {
    fileInput.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.csv,.rtf';
  }
  
  fileInput.multiple = false;
  
  fileInput.addEventListener('change', function(e) {
    const file = this.files[0];
    if (!file) return;
    
    // Format the content based on type
    let content = '';
    if (type === 'image') {
      content = `🖼️ ${file.name}`;
    } else if (type === 'doc') {
      content = `📄 ${file.name}`;
    }
    
    // Insert file name into textarea
    insertFileContent(content);
    
    // Show notification
    showNotification(`📎 ${file.name} attached successfully!`, 'success');
    
    // Clean up the file input
    this.remove();
  });
  
  // Trigger file picker
  fileInput.click();
}

// ========================================
// INSERT FILE CONTENT
// ========================================

function insertFileContent(content) {
  if (!contentInput) return;
  
  // Insert at cursor position
  const start = contentInput.selectionStart;
  const end = contentInput.selectionEnd;
  const text = contentInput.value;
  
  if (start !== undefined && start !== null) {
    contentInput.value = text.substring(0, start) + content + text.substring(end);
    const newCursorPos = start + content.length;
    contentInput.selectionStart = contentInput.selectionEnd = newCursorPos;
  } else {
    contentInput.value += (contentInput.value ? '\n' : '') + content;
  }
  
  contentInput.focus();
}

// ========================================
// RENDER TASKS
// ========================================

function renderTasks() {
  if (!taskList) return;
  
  taskList.innerHTML = '';
  updateCounter();
  
  if (tasks.length === 0) {
    if (emptyState) emptyState.classList.remove('is-hidden');
    return;
  }
  if (emptyState) emptyState.classList.add('is-hidden');
  
  // Sort tasks: pending first, then by time
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return new Date(a.time) - new Date(b.time);
  });
  
  sortedTasks.forEach(task => {
    const article = createTaskElement(task);
    taskList.appendChild(article);
  });
}

function createTaskElement(task) {
  const article = document.createElement('article');
  article.dataset.taskId = task.id;
  article.className = `task-item ${task.completed ? 'completed' : ''}`;
  
  // Title with edit button
  const titleWrapper = document.createElement('div');
  titleWrapper.className = 'task-title-wrapper';
  
  const title = document.createElement('h3');
  title.textContent = task.title;
  titleWrapper.appendChild(title);
  
  if (!task.completed) {
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.innerHTML = '✏️';
    editBtn.title = 'Edit task';
    editBtn.setAttribute('aria-label', 'Edit task');
    editBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      handleEditTask(task.id);
    });
    titleWrapper.appendChild(editBtn);
  }
  
  article.appendChild(titleWrapper);
  
  // Meta info
  const meta = document.createElement('p');
  meta.className = 'task-meta';
  
  const timeIcon = document.createElement('span');
  timeIcon.textContent = '⏰';
  meta.appendChild(timeIcon);
  
  const time = document.createElement('time');
  time.dateTime = task.time;
  time.textContent = formatTime(task.time);
  meta.appendChild(time);
  
  if (task.remind) {
    const reminder = document.createElement('span');
    reminder.className = 'reminder-badge';
    reminder.textContent = '🔔 10 min before';
    meta.appendChild(reminder);
  }
  
  article.appendChild(meta);
  
  // Content block
  const contentBlock = document.createElement('div');
  contentBlock.className = 'content-block';
  
  const contentLines = task.content.split('\n').filter(line => line.trim());
  
  if (contentLines.length > 0) {
    const ul = document.createElement('ul');
    contentLines.forEach(line => {
      const li = document.createElement('li');
      const parsed = parseContentLine(line);
      li.appendChild(parsed);
      ul.appendChild(li);
    });
    contentBlock.appendChild(ul);
  }
  article.appendChild(contentBlock);
  
  // Task actions
  const actions = document.createElement('div');
  actions.className = 'task-actions';
  
  const status = document.createElement('span');
  status.className = `status ${task.completed ? 'done' : 'pending'}`;
  status.textContent = task.completed ? '✅ done' : '⏳ pending';
  actions.appendChild(status);
  
  const actionsRight = document.createElement('div');
  actionsRight.className = 'actions-right';
  
  // Toggle done button
  const doneBtn = document.createElement('button');
  doneBtn.className = 'done-btn';
  doneBtn.textContent = task.completed ? '↩️ undo' : '✔ done';
  doneBtn.setAttribute('aria-label', task.completed ? 'Mark as pending' : 'Mark as done');
  doneBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    handleToggleDone(task.id);
  });
  actionsRight.appendChild(doneBtn);
  
  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = '✕ delete';
  deleteBtn.setAttribute('aria-label', 'Delete task');
  deleteBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    handleDeleteTask(task.id);
  });
  actionsRight.appendChild(deleteBtn);
  
  actions.appendChild(actionsRight);
  article.appendChild(actions);
  
  return article;
}

// ========================================
// PARSE CONTENT LINE
// ========================================

function parseContentLine(line) {
  const fragment = document.createDocumentFragment();
  
  // Check for URLs (including http, https, and common domains)
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}[^\s]*)/g;
  let lastIndex = 0;
  let match;
  let hasUrl = false;
  
  while ((match = urlRegex.exec(line)) !== null) {
    hasUrl = true;
    // Add text before URL
    if (match.index > lastIndex) {
      fragment.appendChild(document.createTextNode(line.substring(lastIndex, match.index)));
    }
    
    // Add URL as link
    const url = match[0];
    const link = document.createElement('a');
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      link.href = 'https://' + url;
    } else {
      link.href = url;
    }
    link.textContent = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'task-link';
    
    // Check if it's an image file
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i)) {
      link.classList.add('image-link');
      // Add image icon
      link.textContent = '🖼️ ' + url.split('/').pop();
    }
    // Check if it's a document file
    else if (url.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|rtf)$/i)) {
      link.classList.add('doc-link');
      // Add document icon
      link.textContent = '📄 ' + url.split('/').pop();
    }
    
    fragment.appendChild(link);
    lastIndex = match.index + match[0].length;
  }
  
  if (hasUrl) {
    // Add remaining text after last URL
    if (lastIndex < line.length) {
      fragment.appendChild(document.createTextNode(line.substring(lastIndex)));
    }
  } else {
    // No URLs, check for file attachments with emojis
    const fileMatch = line.match(/^(🖼️|📄)\s+(.+)/);
    if (fileMatch) {
      const emoji = fileMatch[1];
      const fileName = fileMatch[2];
      const span = document.createElement('span');
      span.textContent = line;
      
      // Check if it's an image or document reference
      if (emoji === '🖼️' || emoji === '📄') {
        span.className = 'file-attachment';
      }
      fragment.appendChild(span);
    } else {
      fragment.appendChild(document.createTextNode(line));
    }
  }
  
  return fragment;
}

// ========================================
// HANDLE EDIT TASK
// ========================================

function handleEditTask(id) {
  console.log('Editing task:', id);
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  
  // Populate form with task data
  taskInput.value = task.title;
  contentInput.value = task.content === 'No additional details' ? '' : task.content;
  timeInput.value = task.time;
  remindCheck.checked = task.remind;
  
  // Update UI
  editingTaskId = id;
  submitBtn.textContent = '✏️ update task';
  submitBtn.style.backgroundColor = '#f6ad55';
  
  // Scroll to form
  document.querySelector('#add-task').scrollIntoView({ behavior: 'smooth' });
  taskInput.focus();
  taskInput.select();
  
  // Highlight the task being edited
  document.querySelectorAll('.task-item').forEach(el => {
    el.style.borderLeftColor = '';
    if (parseInt(el.dataset.taskId) === id) {
      el.style.borderLeftColor = '#f6ad55';
      el.style.borderLeftWidth = '6px';
    }
  });
}

function cancelEditing() {
  if (editingTaskId) {
    editingTaskId = null;
    submitBtn.textContent = '➕ add task';
    submitBtn.style.backgroundColor = '';
    clearForm();
    
    // Reset highlights
    document.querySelectorAll('.task-item').forEach(el => {
      el.style.borderLeftColor = '';
      el.style.borderLeftWidth = '';
    });
  }
}

// ========================================
// HANDLE TOGGLE DONE
// ========================================

function handleToggleDone(id) {
  console.log('Toggling done for task:', id);
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    task.updatedAt = new Date().toISOString();
    saveTasks();
    renderTasks();
    
    const message = task.completed ? 'Task completed! 🎉' : 'Task reopened';
    showNotification(message, 'success');
  }
}

// ========================================
// HANDLE DELETE TASK
// ========================================

function handleDeleteTask(id) {
  console.log('Deleting task:', id);
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  
  if (confirm(`Delete task "${task.title}"?`)) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
    showNotification('Task deleted', 'info');
    
    // Cancel editing if this task was being edited
    if (editingTaskId === id) {
      cancelEditing();
    }
  }
}

// ========================================
// NOTIFICATION SYSTEM
// ========================================

function showNotification(message, type = 'info') {
  // Remove existing notification
  const existing = document.querySelector('.notification');
  if (existing) {
    existing.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  const colors = {
    success: '#38a169',
    warning: '#d69e2e',
    error: '#e53e3e',
    info: '#4a9eff'
  };
  
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    background: ${colors[type] || colors.info};
    color: white;
    border-radius: 8px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    animation: slideIn 0.3s ease;
    max-width: 400px;
    font-size: 14px;
  `;
  
  document.body.appendChild(notification);
  
  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ========================================
// UI HELPERS
// ========================================

function updateCounter() {
  if (!taskCounter) return;
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  
  let text = '';
  if (total === 0) {
    text = '0 tasks';
  } else if (completed === total) {
    text = `✅ ${total} tasks (all done!)`;
  } else {
    text = `${pending} pending · ${total} total`;
  }
  taskCounter.textContent = text;
}

function clearForm() {
  if (taskInput) taskInput.value = '';
  if (contentInput) contentInput.value = '';
  setDefaultTime();
  if (remindCheck) remindCheck.checked = true;
  
  // Reset submit button
  if (submitBtn) {
    submitBtn.textContent = '➕ add task';
    submitBtn.style.backgroundColor = '';
  }
  editingTaskId = null;
}

function setDefaultTime() {
  if (!timeInput) return;
  const now = new Date();
  now.setHours(now.getHours() + 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  timeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatTime(datetime) {
  if (!datetime) return 'No time set';
  try {
    const date = new Date(datetime);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    if (date < today) {
      return `${timeStr} (past)`;
    } else if (date < tomorrow) {
      return `today ${timeStr}`;
    } else {
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${dateStr} ${timeStr}`;
    }
  } catch (e) {
    return 'Invalid date';
  }
}

// ========================================
// THEME MANAGEMENT
// ========================================

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('is-dark-mode');
  } else {
    document.body.classList.remove('is-dark-mode');
  }
}

function loadTheme() {
  const saved = localStorage.getItem('mindkeep-theme');
  if (saved === 'dark' || saved === 'light') {
    currentTheme = saved;
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    currentTheme = prefersDark ? 'dark' : 'light';
  }
  
  applyTheme(currentTheme);
  
  const icon = themeToggle ? themeToggle.querySelector('.theme-toggle__icon') : null;
  if (icon) {
    icon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
  }
}

// ========================================
// PERSISTENCE
// ========================================

function loadTasks() {
  const saved = localStorage.getItem('mindkeep-tasks');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Validate and sanitize tasks
      tasks = parsed.filter(task => 
        task && 
        typeof task === 'object' && 
        task.id && 
        task.title
      );
      console.log('Loaded tasks from localStorage:', tasks.length);
    } catch (e) {
      console.error('Failed to parse tasks:', e);
      tasks = [];
      seedSampleTasks();
    }
  } else {
    seedSampleTasks();
  }
}

function seedSampleTasks() {
  tasks = [
    {
      id: Date.now() - 100000,
      title: 'Review design mockup',
      content: '🔗 figma.com/design/project-v2\n📄 style-guide.pdf\n📝 Check the color palette and typography',
      time: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
      remind: true,
      completed: false,
      createdAt: new Date(Date.now() - 100000).toISOString(),
      updatedAt: new Date(Date.now() - 100000).toISOString()
    },
    {
      id: Date.now() - 50000,
      title: 'Prepare weekly report',
      content: '📄 weekly-metrics.xlsx\n🔗 drive.google.com/reports\n📝 Include last week\'s performance data',
      time: new Date(Date.now() + 7200000).toISOString().slice(0, 16),
      remind: true,
      completed: false,
      createdAt: new Date(Date.now() - 50000).toISOString(),
      updatedAt: new Date(Date.now() - 50000).toISOString()
    }
  ];
  saveTasks();
  console.log('Seeded sample tasks');
}

function saveTasks() {
  try {
    localStorage.setItem('mindkeep-tasks', JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks:', e);
  }
}

// ========================================
// EXPORT FUNCTIONS (for testing)
// ========================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    tasks,
    handleAddTask,
    handleToggleDone,
    handleDeleteTask,
    handleEditTask,
    renderTasks
  };
}

// ========================================
// START THE APP
// ========================================

document.addEventListener('DOMContentLoaded', init);
console.log('MindKeep script loaded!');