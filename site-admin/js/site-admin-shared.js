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
