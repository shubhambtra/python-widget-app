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

// Handle subscription/trial expiration - show non-dismissible modal
let _subscriptionExpiredShown = false;
function handleSubscriptionExpired(errorCode) {
  if (_subscriptionExpiredShown) return;
  _subscriptionExpiredShown = true;

  const isTrial = errorCode === 'TRIAL_EXPIRED';
  const title = isTrial ? 'Trial Expired' : 'Subscription Expired';
  const message = isTrial
    ? 'Your free trial has expired. Please choose a plan to continue using the service.'
    : 'Your subscription has expired. Please renew or upgrade your plan to continue.';

  // Remove existing modal if any
  const existing = document.getElementById('subscriptionExpiredModal');
  if (existing) existing.remove();

  const modalHtml = `
    <div class="modal-overlay show" id="subscriptionExpiredModal" style="z-index: 10000;">
      <div class="modal" style="max-width: 480px;">
        <div class="modal-header">
          <h2 style="display: flex; align-items: center; gap: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#ef4444">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            ${title}
          </h2>
        </div>
        <div class="modal-body" style="padding: 24px;">
          <p style="color: var(--text-secondary, #64748b); font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
            ${message}
          </p>
          <button class="btn btn-primary" onclick="window.location.href=buildSiteAdminUrl('site-admin-subscription.html')" style="width: 100%; padding: 14px; font-size: 16px;">
            View Plans & Subscribe
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Check a 403 response for subscription expiration error codes
async function checkSubscriptionError(res) {
  try {
    const text = await res.text();
    if (!text) return false;
    const data = JSON.parse(text);
    const code = data.code || data.error;
    if (code === 'SUBSCRIPTION_EXPIRED' || code === 'TRIAL_EXPIRED') {
      handleSubscriptionExpired(code);
      return true;
    }
  } catch { /* ignore parse errors */ }
  return false;
}

// ==================== API HELPERS ====================
async function apiGet(endpoint) {
  console.log('API GET:', endpoint);
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('API GET response:', res.status, res.statusText);
    if (res.status === 401) {
      handleTokenExpired();
      throw new Error('Session expired');
    }
    if (res.status === 403) {
      const cloned = res.clone();
      if (await checkSubscriptionError(cloned)) {
        throw new Error('Subscription expired');
      }
      handleTokenExpired();
      throw new Error('Access denied');
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
    if (res.status === 401) {
      handleTokenExpired();
      throw new Error('Session expired');
    }
    if (res.status === 403) {
      const cloned = res.clone();
      if (await checkSubscriptionError(cloned)) {
        throw new Error('Subscription expired');
      }
      handleTokenExpired();
      throw new Error('Access denied');
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
    if (res.status === 401) {
      handleTokenExpired();
      throw new Error('Session expired');
    }
    if (res.status === 403) {
      const cloned = res.clone();
      if (await checkSubscriptionError(cloned)) {
        throw new Error('Subscription expired');
      }
      handleTokenExpired();
      throw new Error('Access denied');
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
    if (res.status === 401) {
      handleTokenExpired();
      throw new Error('Session expired');
    }
    if (res.status === 403) {
      const cloned = res.clone();
      if (await checkSubscriptionError(cloned)) {
        throw new Error('Subscription expired');
      }
      handleTokenExpired();
      throw new Error('Access denied');
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

// ==================== FREE PLAN TRIAL BANNER ====================
async function loadTrialBanner() {
  try {
    const res = await fetch(`${API_BASE}/subscriptions/sites/${siteId}/overview`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;
    const json = await res.json();
    const data = json.success ? json.data : json;
    const subscription = data?.subscription;
    if (!subscription) return;

    const plan = data?.plan;
    const isFree = plan && plan.monthlyPrice === 0;
    if (!isFree) return;

    const status = subscription.status;
    const now = new Date();
    let daysLeft = 0;
    let bannerText = '';

    if (status === 'trialing' && subscription.trialEnd) {
      daysLeft = Math.ceil((new Date(subscription.trialEnd) - now) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 0) {
        bannerText = 'Your free trial has expired.';
      } else {
        bannerText = `Free trial: <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong> remaining.`;
      }
    } else if (status === 'expired') {
      bannerText = 'Your free trial has expired.';
      daysLeft = 0;
    } else {
      return; // active paid plan, no banner needed
    }

    const isExpired = daysLeft <= 0;
    const isUrgent = daysLeft <= 3;
    const bgColor = isExpired ? '#ef4444' : isUrgent ? '#f59e0b' : '#0ea5e9';
    const upgradeUrl = buildSiteAdminUrl('site-admin-subscription.html');

    const bannerHtml = `
      <div id="freeTrialBanner" style="background: ${bgColor}; color: white; padding: 8px 24px; font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 12px; z-index: 49;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="flex-shrink: 0;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>${bannerText}</span>
        <a href="${upgradeUrl}" style="color: white; text-decoration: underline; font-weight: 600; white-space: nowrap;">Upgrade Now</a>
      </div>
    `;

    // Insert after topbar inside .main-content
    const topbar = document.querySelector('.main-content .topbar');
    if (topbar) {
      topbar.insertAdjacentHTML('afterend', bannerHtml);
    }
  } catch (err) {
    console.error('Trial banner error:', err);
  }
}

// Auto-load trial banner on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Delay slightly so auth check runs first
  setTimeout(loadTrialBanner, 500);
});

// ==================== REPORT ISSUE ====================
function openReportIssue() {
  const qp = new URLSearchParams();
  if (token) qp.set('token', token);
  if (siteId) qp.set('siteId', siteId);
  if (userName) qp.set('name', userName);
  // Try to get email from page if available
  const emailEl = document.getElementById('dropdownEmail') || document.getElementById('userEmail');
  if (emailEl && emailEl.textContent) qp.set('email', emailEl.textContent);
  window.open('/report-issue.html?' + qp.toString(), '_blank');
}

function injectReportIssueLink() {
  const sidebar = document.querySelector('.sidebar-nav') || document.querySelector('.sidebar');
  if (!sidebar) return;
  // Check if already injected
  if (document.getElementById('reportIssueSidebarLink')) return;

  const link = document.createElement('a');
  link.id = 'reportIssueSidebarLink';
  link.href = '#';
  link.className = 'nav-item';
  link.title = 'Report Issue';
  link.style.cssText = 'margin-top: 8px; border-top: 1px solid var(--border-color, rgba(255,255,255,0.08)); padding-top: 12px;';
  link.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
    <span>Report Issue</span>
  `;
  link.addEventListener('click', (e) => {
    e.preventDefault();
    openReportIssue();
  });
  sidebar.appendChild(link);
}

document.addEventListener('DOMContentLoaded', injectReportIssueLink);

// ==================== LIVE MONITOR ====================
function openLiveMonitor() {
  // Build Support URL with admin role for supervisor view
  // Uses siteId and token from current session (already available in this file)
  const supportUrl = `/Support.html?siteId=${siteId}&token=${token}&role=admin`;
  window.open(supportUrl, '_blank');
}
