// Site Admin Dashboard Shared Utilities
// This file contains shared functions and state used across all site admin pages

// ==================== AUTH & CONFIG ====================
const API_BASE = CONFIG.API_BASE;

// Get params from URL
const params = new URLSearchParams(location.search);
const siteId = params.get('siteId');
const token = params.get('token');
const userName = params.get('user');

// Redirect to login if no auth
if (!siteId || !token) {
  location.href = '/login';
}

// Set user info if elements exist
if (document.getElementById('userName')) {
  document.getElementById('userName').textContent = userName || 'Admin';
}
if (document.getElementById('userAvatar')) {
  document.getElementById('userAvatar').textContent = (userName || 'A')[0].toUpperCase();
}

// ==================== NAVIGATION ====================
function buildSiteAdminUrl(page) {
  const params = new URLSearchParams();
  params.set('siteId', siteId);
  params.set('token', token);
  if (userName) params.set('user', userName);
  return `${page}?${params.toString()}`;
}

function setupNavigation() {
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      if (page) {
        window.location.href = buildSiteAdminUrl(page);
      }
    });
  });

  // Knowledge Base link handler
  const knowledgeLink = document.getElementById('knowledgeBaseLink');
  if (knowledgeLink) {
    knowledgeLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = buildSiteAdminUrl('knowledge-base.html');
    });
  }
}

function logout() {
  location.href = '/login';
}

// Handle token expiration - redirect to login
function handleTokenExpired() {
  showToast('Session expired. Redirecting to login...', 'error');
  setTimeout(() => location.href = '/login', 1500);
}

// ==================== API HELPERS ====================
async function apiGet(endpoint) {
  console.log('API GET:', endpoint);
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('API GET response:', res.status, res.statusText);
    if (res.status === 401 || res.status === 403) {
      handleTokenExpired();
      throw new Error('Session expired');
    }
    if (!res.ok) {
      const text = await res.text();
      console.error('API error response:', text);
      throw new Error(`API error: ${res.status}`);
    }
    const text = await res.text();
    if (!text) {
      console.log('Empty response for:', endpoint);
      return null;
    }
    const data = JSON.parse(text);
    return data.success ? data.data : data;
  } catch (err) {
    console.error('API GET error:', endpoint, err);
    throw err;
  }
}

async function apiPost(endpoint, body) {
  console.log('API POST:', endpoint, body);
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (res.status === 401 || res.status === 403) {
      handleTokenExpired();
      throw new Error('Session expired');
    }
    if (!res.ok) {
      const text = await res.text();
      console.error('API POST error:', text);
      throw new Error(`API error: ${res.status}`);
    }
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text).data;
  } catch (err) {
    console.error('API POST error:', endpoint, err);
    throw err;
  }
}

async function apiPut(endpoint, body) {
  console.log('API PUT:', endpoint, body);
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (res.status === 401 || res.status === 403) {
      handleTokenExpired();
      throw new Error('Session expired');
    }
    if (!res.ok) {
      const text = await res.text();
      console.error('API PUT error:', text);
      throw new Error(`API error: ${res.status}`);
    }
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text).data;
  } catch (err) {
    console.error('API PUT error:', endpoint, err);
    throw err;
  }
}

async function apiDelete(endpoint) {
  console.log('API DELETE:', endpoint);
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 401 || res.status === 403) {
      handleTokenExpired();
      throw new Error('Session expired');
    }
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return true;
  } catch (err) {
    console.error('API DELETE error:', endpoint, err);
    throw err;
  }
}

// ==================== UI HELPERS ====================
function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

function showLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = 'flex';
  }
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('show');
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('show');
  }
}

// Close modals on overlay click
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  });
});

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="${type === 'success' ? '#22c55e' : type === 'info' ? '#3b82f6' : '#ef4444'}">
      ${type === 'success'
        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />'
        : type === 'info'
        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />'
        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />'}
    </svg>
    <span>${escapeHtml(message)}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ==================== FORMATTERS ====================
function formatTime(seconds) {
  if (!seconds) return 'N/A';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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
    showToast('New password must be at least 8 characters', 'error');
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast('New passwords do not match', 'error');
    return;
  }

  if (currentPassword === newPassword) {
    showToast('New password must be different from current password', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    if (res.ok) {
      showToast('Password changed successfully', 'success');
      closeModal('changePasswordModal');
      document.getElementById('changePasswordForm').reset();
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.message || data.detail || 'Failed to change password', 'error');
    }
  } catch (err) {
    if (err.message !== 'Session expired') {
      showToast(err.message || 'Failed to change password', 'error');
    }
  }
}

// Initialize change password modal on DOM ready
document.addEventListener('DOMContentLoaded', initChangePasswordModal);

// ==================== SITE INFO ====================
let siteData = null;

async function loadSiteInfo() {
  try {
    siteData = await apiGet(`/sites/${siteId}`);

    // Update sidebar site info
    const siteNameEl = document.getElementById('siteName');
    const siteDomainEl = document.getElementById('siteDomain');

    if (siteNameEl) siteNameEl.textContent = siteData.name || 'My Site';
    if (siteDomainEl) siteDomainEl.textContent = siteData.domain || 'No domain';

    return siteData;
  } catch (err) {
    console.error('Error loading site info:', err);
    showToast('Failed to load site information', 'error');
    return null;
  }
}

// ==================== LIVE MONITOR ====================
function openLiveMonitor() {
  // Get current user info from storage or URL params
  const userStr = sessionStorage.getItem('agentUser') || localStorage.getItem('agentUser');
  let userId = params.get('userId');
  let username = userName || 'Admin';

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      userId = userId || user.id;
      username = user.username || username;
    } catch (e) {
      console.warn('Could not parse user from storage');
    }
  }

  // Build Support URL with admin role for supervisor view
  const supportUrl = `/Support.html?site_id=${siteId}&user_id=${userId || 'admin'}&username=${encodeURIComponent(username)}&role=admin&token=${token}`;
  window.open(supportUrl, '_blank');
}
