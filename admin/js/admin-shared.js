// Admin Dashboard Shared Utilities
// This file contains shared functions and state used across all admin pages

// ==================== AUTH & CONFIG ====================
const API_BASE = CONFIG.API_BASE;
const toast = document.getElementById('toast');

// Get params from URL
const params = new URLSearchParams(location.search);
const authToken = params.get('token');
const currentUser = params.get('user');

// Get token function (for compatibility)
function getToken() {
  return authToken;
}

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

  const response = await fetch(url, mergedOptions);

  // Handle token expiration - redirect to login
  if (response.status === 401 || response.status === 403) {
    showToast('Session expired. Redirecting to login...', 'error');
    setTimeout(() => location.href = '/login', 1500);
    throw new Error('Session expired');
  }

  return response;
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

// ==================== CHANGE PASSWORD ====================
// Inject change password modal if not present
function initChangePasswordModal() {
  if (document.getElementById('changePasswordModal')) return;

  const modalHtml = `
    <div class="modal-overlay" id="changePasswordModal">
      <div class="modal" style="max-width: 480px;">
        <div class="modal-header">
          <h2>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="margin-right: 8px;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Change Password
          </h2>
          <button class="close-btn" onclick="closeModal('changePasswordModal')">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <form id="changePasswordForm" onsubmit="handleChangePassword(event)">
            <div class="form-group" style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 500; color: var(--text-primary);">Current Password</label>
              <input type="password" id="currentPassword" required placeholder="Enter current password"
                style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--card-bg); color: var(--text-primary); font-size: 14px;">
            </div>
            <div class="form-group" style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 500; color: var(--text-primary);">New Password</label>
              <input type="password" id="newPassword" required placeholder="Enter new password" minlength="8"
                style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--card-bg); color: var(--text-primary); font-size: 14px;">
              <small style="color: var(--text-secondary); font-size: 12px; margin-top: 4px; display: block;">Minimum 8 characters</small>
            </div>
            <div class="form-group" style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 500; color: var(--text-primary);">Confirm New Password</label>
              <input type="password" id="confirmPassword" required placeholder="Confirm new password"
                style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--card-bg); color: var(--text-primary); font-size: 14px;">
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('changePasswordModal')">Cancel</button>
          <button class="btn btn-primary" onclick="document.getElementById('changePasswordForm').requestSubmit()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Update Password
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

async function handleChangePassword(e) {
  e.preventDefault();

  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (newPassword.length < 8) {
    showToast('New password must be at least 8 characters');
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast('New passwords do not match');
    return;
  }

  if (currentPassword === newPassword) {
    showToast('New password must be different from current password');
    return;
  }

  try {
    const res = await apiFetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });

    if (res.ok) {
      showToast('Password changed successfully', 'success');
      closeModal('changePasswordModal');
      document.getElementById('changePasswordForm').reset();
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.message || data.detail || 'Failed to change password');
    }
  } catch (err) {
    if (err.message !== 'Session expired') {
      showToast(err.message || 'Failed to change password');
    }
  }
}

// Initialize change password modal on DOM ready
document.addEventListener('DOMContentLoaded', initChangePasswordModal);
