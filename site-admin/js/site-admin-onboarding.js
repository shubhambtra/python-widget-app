// Site Admin Onboarding Wizard
// Guides new users through setting up agents and installing the widget

// ==================== STATE MANAGEMENT ====================
const ONBOARDING_KEY = `assistica_onboarding_${siteId}`;

function getOnboardingState() {
  try {
    const stored = localStorage.getItem(ONBOARDING_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Error reading onboarding state:', e);
  }
  return {
    completed: false,
    currentStep: 1,
    agentsAdded: 0,
    widgetCodeCopied: false,
    dismissedAt: null
  };
}

function saveOnboardingState(state) {
  try {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Error saving onboarding state:', e);
  }
}

function resetOnboardingState() {
  const state = {
    completed: false,
    currentStep: 1,
    agentsAdded: 0,
    widgetCodeCopied: false,
    dismissedAt: null
  };
  saveOnboardingState(state);
  return state;
}

// ==================== WIZARD LIFECYCLE ====================
function checkOnboarding() {
  const state = getOnboardingState();

  // Don't show if already completed
  if (state.completed) {
    return;
  }

  // Don't show if dismissed within last 24 hours
  if (state.dismissedAt) {
    const dismissed = new Date(state.dismissedAt);
    const now = new Date();
    const hoursSinceDismiss = (now - dismissed) / (1000 * 60 * 60);
    if (hoursSinceDismiss < 24) {
      return;
    }
  }

  // Show wizard
  openOnboardingWizard();
}

function openOnboardingWizard() {
  // Remove existing wizard if present
  const existing = document.getElementById('onboardingWizard');
  if (existing) existing.remove();

  const state = getOnboardingState();

  const wizardHtml = `
    <div class="onboarding-overlay show" id="onboardingWizard">
      <div class="onboarding-wizard">
        <div class="wizard-header">
          <button class="wizard-close" onclick="dismissOnboarding()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div class="wizard-logo">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 class="wizard-title" id="wizardMainTitle">Welcome to Assistica</h1>
          <p class="wizard-subtitle" id="wizardMainSubtitle">Let's get your support chat up and running</p>
        </div>

        <div class="wizard-progress" id="wizardProgress">
          ${renderProgressSteps(state.currentStep)}
        </div>

        <div class="wizard-content" id="wizardContent">
          ${renderStep(state.currentStep)}
        </div>

        <div class="wizard-footer" id="wizardFooter">
          ${renderFooter(state.currentStep)}
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', wizardHtml);
}

function closeOnboardingWizard() {
  const wizard = document.getElementById('onboardingWizard');
  if (wizard) {
    wizard.classList.remove('show');
    setTimeout(() => wizard.remove(), 300);
  }
}

function dismissOnboarding() {
  const state = getOnboardingState();
  state.dismissedAt = new Date().toISOString();
  saveOnboardingState(state);
  closeOnboardingWizard();
}

function completeOnboarding() {
  const state = getOnboardingState();
  state.completed = true;
  saveOnboardingState(state);
  closeOnboardingWizard();
}

// ==================== PROGRESS RENDERING ====================
function renderProgressSteps(currentStep) {
  const steps = [1, 2, 3, 4];
  let html = '';

  steps.forEach((step, index) => {
    let stepClass = 'wizard-progress-step';
    let content = step;

    if (step < currentStep) {
      stepClass += ' completed';
      content = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`;
    } else if (step === currentStep) {
      stepClass += ' active';
    }

    html += `<div class="${stepClass}">${content}</div>`;

    // Add connector between steps
    if (index < steps.length - 1) {
      const connectorClass = step < currentStep ? 'wizard-progress-connector completed' : 'wizard-progress-connector';
      html += `<div class="${connectorClass}"></div>`;
    }
  });

  return html;
}

function updateProgress(step) {
  const progressEl = document.getElementById('wizardProgress');
  if (progressEl) {
    progressEl.innerHTML = renderProgressSteps(step);
  }
}

// ==================== STEP RENDERING ====================
function renderStep(step) {
  switch (step) {
    case 1: return renderStep1();
    case 2: return renderStep2();
    case 3: return renderStep3();
    case 4: return renderStep4();
    default: return renderStep1();
  }
}

function renderStep1() {
  return `
    <div class="wizard-step active" data-step="1">
      <div class="wizard-illustration blue">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <h2 class="wizard-step-title" style="text-align: center;">Get Your Support Chat Running</h2>
      <p class="wizard-step-desc" style="text-align: center;">
        In just 2 simple steps, you'll have a fully functional support chat on your website.
        Add your team members and install the widget - it only takes a few minutes.
      </p>
      <div style="background: #f0f9ff; border-radius: 12px; padding: 20px; margin-top: 24px;">
        <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 16px;">
          <div style="width: 32px; height: 32px; background: #0ea5e9; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <div style="font-weight: 600; color: #0369a1; margin-bottom: 4px;">Step 1: Add Support Agents</div>
            <div style="font-size: 13px; color: #64748b;">Invite your team members to help manage conversations</div>
          </div>
        </div>
        <div style="display: flex; align-items: flex-start; gap: 16px;">
          <div style="width: 32px; height: 32px; background: #0ea5e9; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <div>
            <div style="font-weight: 600; color: #0369a1; margin-bottom: 4px;">Step 2: Install the Widget</div>
            <div style="font-size: 13px; color: #64748b;">Add a simple code snippet to your website</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderStep2() {
  const state = getOnboardingState();
  const agentsAddedHtml = state.agentsAdded > 0 ? `
    <div class="wizard-agent-added">
      <div class="wizard-agent-added-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div class="wizard-agent-added-text">
        <strong>${state.agentsAdded} agent${state.agentsAdded > 1 ? 's' : ''}</strong> added successfully
      </div>
    </div>
  ` : '';

  return `
    <div class="wizard-step active" data-step="2">
      <div class="wizard-illustration purple">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
      <h2 class="wizard-step-title" style="text-align: center;">Add Support Agents</h2>
      <p class="wizard-step-desc" style="text-align: center;">
        Agents are team members who can view and respond to customer conversations.
        You can add more agents later from the Agents page.
      </p>

      ${agentsAddedHtml}

      <form id="wizardAddAgentForm" onsubmit="wizardAddAgent(event)">
        <div class="wizard-form-group">
          <label class="wizard-form-label">Agent Email Address</label>
          <input type="email" class="wizard-form-input" id="wizardAgentEmail" placeholder="agent@company.com" required>
          <div class="form-help" style="margin-top: 6px;">The agent must already have a registered account</div>
        </div>

        <div style="margin-top: 20px;">
          <div style="font-size: 14px; font-weight: 600; color: #334155; margin-bottom: 12px;">Permissions</div>

          <div class="wizard-toggle-group">
            <div class="wizard-toggle-label">Can View Conversations</div>
            <label class="toggle-switch">
              <input type="checkbox" id="wizardCanView" checked>
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="wizard-toggle-group">
            <div class="wizard-toggle-label">Can Respond to Messages</div>
            <label class="toggle-switch">
              <input type="checkbox" id="wizardCanRespond" checked>
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="wizard-toggle-group">
            <div class="wizard-toggle-label">Can Close Conversations</div>
            <label class="toggle-switch">
              <input type="checkbox" id="wizardCanClose" checked>
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="wizard-toggle-group">
            <div class="wizard-toggle-label">Can Manage Settings (Admin)</div>
            <label class="toggle-switch">
              <input type="checkbox" id="wizardCanManage">
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <button type="submit" class="wizard-btn wizard-btn-secondary" style="margin-top: 16px; width: 100%;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Agent
        </button>
      </form>
    </div>
  `;
}

function renderStep3() {
  const widgetCode = generateWidgetCode();

  return `
    <div class="wizard-step active" data-step="3">
      <div class="wizard-illustration blue">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      </div>
      <h2 class="wizard-step-title" style="text-align: center;">Install the Widget</h2>
      <p class="wizard-step-desc" style="text-align: center;">
        Copy the code snippet below and add it to your website to enable the chat widget.
      </p>

      <div class="wizard-instructions">
        <div class="wizard-instruction-item">
          <div class="wizard-instruction-number">1</div>
          <div class="wizard-instruction-text">
            Copy the code snippet below by clicking the <strong>Copy Code</strong> button
          </div>
        </div>
        <div class="wizard-instruction-item">
          <div class="wizard-instruction-number">2</div>
          <div class="wizard-instruction-text">
            Open your website's HTML file (or template)
          </div>
        </div>
        <div class="wizard-instruction-item">
          <div class="wizard-instruction-number">3</div>
          <div class="wizard-instruction-text">
            Paste the code just before the closing <code>&lt;/body&gt;</code> tag
          </div>
        </div>
      </div>

      <div class="wizard-code-block">
        <button type="button" class="wizard-code-copy" id="wizardCopyBtn" onclick="wizardCopyCode()">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span id="wizardCopyBtnText">Copy Code</span>
        </button>
        <pre id="wizardCodeSnippet">${escapeHtmlForDisplay(widgetCode)}</pre>
      </div>
    </div>
  `;
}

function renderStep4() {
  const state = getOnboardingState();

  return `
    <div class="wizard-step active" data-step="4">
      <div class="wizard-success-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 class="wizard-step-title" style="text-align: center;">You're All Set!</h2>
      <p class="wizard-step-desc" style="text-align: center;">
        Your support chat is ready to go. Here's a summary of what you've set up:
      </p>

      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <div style="width: 24px; height: 24px; background: ${state.agentsAdded > 0 ? '#22c55e' : '#94a3b8'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span style="font-size: 14px; color: ${state.agentsAdded > 0 ? '#166534' : '#64748b'};">
            ${state.agentsAdded > 0 ? `${state.agentsAdded} agent${state.agentsAdded > 1 ? 's' : ''} added` : 'No agents added yet'}
          </span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 24px; height: 24px; background: ${state.widgetCodeCopied ? '#22c55e' : '#94a3b8'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span style="font-size: 14px; color: ${state.widgetCodeCopied ? '#166534' : '#64748b'};">
            ${state.widgetCodeCopied ? 'Widget code copied' : 'Widget code not copied yet'}
          </span>
        </div>
      </div>

      <p style="font-size: 14px; color: #64748b; text-align: center; margin-bottom: 8px;">
        What would you like to do next?
      </p>

      <div class="wizard-actions-grid">
        <a href="${buildSiteAdminUrl('site-admin-overview.html')}" class="wizard-action-btn" onclick="completeOnboarding()">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span>Dashboard</span>
        </a>
        <a href="${buildSiteAdminUrl('site-admin-widget.html')}" class="wizard-action-btn" onclick="completeOnboarding()">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <span>Customize Widget</span>
        </a>
        <a href="${buildSiteAdminUrl('site-admin-agents.html')}" class="wizard-action-btn" onclick="completeOnboarding()">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>View Agents</span>
        </a>
      </div>
    </div>
  `;
}

// ==================== FOOTER RENDERING ====================
function renderFooter(step) {
  switch (step) {
    case 1:
      return `
        <div class="wizard-footer-left">
          <span class="wizard-skip-link" onclick="dismissOnboarding()">Skip for now</span>
        </div>
        <div class="wizard-footer-right">
          <button class="wizard-btn wizard-btn-primary" onclick="goToStep(2)">
            Get Started
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      `;
    case 2:
      return `
        <div class="wizard-footer-left">
          <button class="wizard-btn wizard-btn-secondary" onclick="goToStep(1)">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Back
          </button>
        </div>
        <div class="wizard-footer-right">
          <span class="wizard-skip-link" onclick="goToStep(3)">Skip this step</span>
          <button class="wizard-btn wizard-btn-primary" onclick="goToStep(3)">
            Continue
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      `;
    case 3:
      return `
        <div class="wizard-footer-left">
          <button class="wizard-btn wizard-btn-secondary" onclick="goToStep(2)">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Back
          </button>
        </div>
        <div class="wizard-footer-right">
          <span class="wizard-skip-link" onclick="goToStep(4)">I'll do this later</span>
          <button class="wizard-btn wizard-btn-primary" onclick="goToStep(4)">
            I've Installed It
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      `;
    case 4:
      return `
        <div class="wizard-footer-left">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" id="wizardShowAgain" style="width: 16px; height: 16px; cursor: pointer;">
            <span style="font-size: 13px; color: #64748b;">Show this wizard again next time</span>
          </label>
        </div>
        <div class="wizard-footer-right">
          <button class="wizard-btn wizard-btn-primary" onclick="finishOnboarding()">
            Finish Setup
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      `;
    default:
      return '';
  }
}

// ==================== NAVIGATION ====================
function goToStep(step) {
  const state = getOnboardingState();
  state.currentStep = step;
  saveOnboardingState(state);

  // Update UI
  updateProgress(step);
  document.getElementById('wizardContent').innerHTML = renderStep(step);
  document.getElementById('wizardFooter').innerHTML = renderFooter(step);

  // Update header titles based on step
  const titleEl = document.getElementById('wizardMainTitle');
  const subtitleEl = document.getElementById('wizardMainSubtitle');

  if (step === 1) {
    titleEl.textContent = 'Welcome to Assistica';
    subtitleEl.textContent = "Let's get your support chat up and running";
  } else if (step === 4) {
    titleEl.textContent = 'Setup Complete';
    subtitleEl.textContent = 'Your support chat is ready to use';
  } else {
    titleEl.textContent = 'Setup Wizard';
    subtitleEl.textContent = `Step ${step} of 4`;
  }
}

function finishOnboarding() {
  const showAgain = document.getElementById('wizardShowAgain');
  if (showAgain && showAgain.checked) {
    // Reset state to show again
    resetOnboardingState();
  } else {
    completeOnboarding();
  }
  closeOnboardingWizard();
}

// ==================== AGENT FUNCTIONS ====================
async function wizardAddAgent(e) {
  e.preventDefault();

  const email = document.getElementById('wizardAgentEmail').value.trim();
  if (!email) return;

  const canView = document.getElementById('wizardCanView').checked;
  const canRespond = document.getElementById('wizardCanRespond').checked;
  const canClose = document.getElementById('wizardCanClose').checked;
  const canManage = document.getElementById('wizardCanManage').checked;

  try {
    await apiPost(`/sites/${siteId}/agents`, {
      email: email,
      canView: canView,
      canRespond: canRespond,
      canCloseConversations: canClose,
      canManageSettings: canManage
    });

    // Update state
    const state = getOnboardingState();
    state.agentsAdded = (state.agentsAdded || 0) + 1;
    saveOnboardingState(state);

    // Show success and refresh step
    showToast('Agent added successfully!', 'success');
    document.getElementById('wizardAgentEmail').value = '';
    document.getElementById('wizardContent').innerHTML = renderStep(2);

  } catch (err) {
    console.error('Error adding agent:', err);
    showToast('Failed to add agent. Make sure the user exists.', 'error');
  }
}

// ==================== WIDGET CODE ====================
function generateWidgetCode() {
  const widgetUrl = typeof CONFIG !== 'undefined' && CONFIG.WIDGET_URL ? CONFIG.WIDGET_URL : window.location.origin;
  const apiKey = siteData && siteData.apiKey ? siteData.apiKey : 'YOUR_API_KEY';

  return `<!-- Assistica AI Widget -->
<script>
  (function(w,d,s,o){
    w.AssisticaAIWidget=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    var js=d.createElement(s),fs=d.getElementsByTagName(s)[0];
    js.src='${widgetUrl}/static/widget.js';
    js.async=1;fs.parentNode.insertBefore(js,fs);
  })(window,document,'script','chatapp');

  chatapp('init', {
    siteId: '${siteId}',
    apiKey: '${apiKey}'
  });
<\/script>`;
}

function escapeHtmlForDisplay(html) {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function wizardCopyCode() {
  const code = generateWidgetCode();

  navigator.clipboard.writeText(code).then(() => {
    // Update state
    const state = getOnboardingState();
    state.widgetCodeCopied = true;
    saveOnboardingState(state);

    // Update button
    const btn = document.getElementById('wizardCopyBtn');
    const btnText = document.getElementById('wizardCopyBtnText');
    if (btn && btnText) {
      btn.classList.add('copied');
      btnText.textContent = 'Copied!';

      setTimeout(() => {
        btn.classList.remove('copied');
        btnText.textContent = 'Copy Code';
      }, 2000);
    }

    showToast('Widget code copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy code', 'error');
  });
}

// ==================== SETUP GUIDE BUTTON ====================
function injectSetupGuideButton() {
  const sidebarFooter = document.querySelector('.sidebar-footer');
  if (!sidebarFooter) return;

  // Check if already injected
  if (document.getElementById('setupGuideBtn')) return;

  const actionsContainer = sidebarFooter.querySelector('.sidebar-actions');
  if (!actionsContainer) return;

  const btn = document.createElement('button');
  btn.id = 'setupGuideBtn';
  btn.className = 'setup-guide-btn';
  btn.onclick = openOnboardingWizard;
  btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
    Setup Guide
  `;

  // Insert before the actions container
  actionsContainer.parentNode.insertBefore(btn, actionsContainer);
}

// ==================== INITIALIZATION ====================
// Wait for siteData to be loaded before checking onboarding
let onboardingInitialized = false;

function initOnboarding() {
  if (onboardingInitialized) return;
  onboardingInitialized = true;

  // Inject the setup guide button
  injectSetupGuideButton();

  // Check if we should show the wizard
  // Delay slightly to ensure siteData is loaded
  setTimeout(() => {
    checkOnboarding();
  }, 500);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOnboarding);
} else {
  initOnboarding();
}
