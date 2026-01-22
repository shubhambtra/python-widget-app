// Admin Dashboard Shared Utilities
// This file contains shared functions and state used across all admin pages

// ==================== AUTH & CONFIG ====================
const API_BASE = CONFIG.API_BASE;
const toast = document.getElementById('toast');

// Get params from URL
const params = new URLSearchParams(location.search);
const authToken = params.get('token');
const currentUser = params.get('user');

// Set user info if elements exist
if (document.getElementById('userName')) {
  document.getElementById('userName').textContent = currentUser || 'Admin';
}
if (document.getElementById('userAvatar')) {
  document.getElementById('userAvatar').textContent = (currentUser || 'A')[0].toUpperCase();
}

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'error') {
  const toastEl = document.getElementById('toast');
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.className = `toast ${type} show`;
  setTimeout(() => toastEl.classList.remove('show'), 3000);
}

// ==================== NAVIGATION ====================
function logout() {
  location.href = '/login';
}

// Build URL with auth params
function buildAdminUrl(page) {
  const params = new URLSearchParams();
  if (authToken) params.set('token', authToken);
  if (currentUser) params.set('user', currentUser);
  return `${page}?${params.toString()}`;
}

// ==================== DATE FORMATTERS ====================
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// ==================== STRING HELPERS ====================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function stripHtmlTags(html) {
  const div = document.createElement('div');
  div.innerHTML = html || '';
  return div.textContent || div.innerText || '';
}

// ==================== MODAL HELPERS ====================
function openModal(modalId) {
  document.getElementById(modalId).classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
  document.body.style.overflow = '';
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('show');
      document.body.style.overflow = '';
    }
  });
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.show').forEach(modal => {
      modal.classList.remove('show');
    });
    document.body.style.overflow = '';
  }
});

// ==================== AUTH CHECK ====================
function checkAuth() {
  if (!authToken) {
    showToast('No authentication token. Please login again.');
    setTimeout(() => location.href = '/login', 2000);
    return false;
  }
  return true;
}

// Handle API response errors
async function handleApiResponse(response, errorMessage) {
  if (response.status === 401 || response.status === 403) {
    showToast('Session expired. Please login again.');
    setTimeout(() => location.href = '/login', 2000);
    return null;
  }

  if (!response.ok) {
    throw new Error(errorMessage || 'Request failed');
  }

  return response.json();
}

// ==================== FETCH WRAPPER ====================
async function apiFetch(url, options = {}) {
  const defaultOptions = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  const mergedOptions = { ...defaultOptions, ...options, headers: { ...defaultOptions.headers, ...options.headers } };

  // Remove Content-Type for FormData
  if (options.body instanceof FormData) {
    delete mergedOptions.headers['Content-Type'];
  }

  return fetch(url, mergedOptions);
}

// ==================== NAVIGATION ACTIVE STATE ====================
function setActiveNavItem(navId) {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const activeItem = document.getElementById(navId);
  if (activeItem) {
    activeItem.classList.add('active');
  }
}

// ==================== LOADING STATE ====================
function showLoadingState(containerId, message = 'Loading...') {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>${message}</p>
      </div>
    `;
  }
}

function showEmptyState(containerId, icon, title, description) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
      <div class="empty-state">
        ${icon}
        <h3>${title}</h3>
        <p>${description}</p>
      </div>
    `;
  }
}

function showErrorState(containerId, message) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3>Error</h3>
        <p>${escapeHtml(message)}</p>
      </div>
    `;
  }
}
