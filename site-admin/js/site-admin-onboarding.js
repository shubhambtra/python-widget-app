// Site Admin Onboarding Wizard
// Guides new users through setting up agents and installing the widget

console.log('[Onboarding] Script loaded');

// ==================== STATE MANAGEMENT ====================
const ONBOARDING_KEY = `assistica_onboarding_${siteId}`;
console.log('[Onboarding] Key:', ONBOARDING_KEY);

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
  console.log('[Onboarding] checkOnboarding called');
  const state = getOnboardingState();
  console.log('[Onboarding] Current state:', state);

  // Don't show if already completed
  if (state.completed) {
    console.log('[Onboarding] Already completed, not showing');
    return;
  }

  // Don't show if dismissed within last 24 hours
  if (state.dismissedAt) {
    const dismissed = new Date(state.dismissedAt);
    const now = new Date();
    const hoursSinceDismiss = (now - dismissed) / (1000 * 60 * 60);
    console.log('[Onboarding] Dismissed', hoursSinceDismiss.toFixed(1), 'hours ago');
    if (hoursSinceDismiss < 24) {
      console.log('[Onboarding] Dismissed recently, not showing');
      return;
    }
  }

  // Show wizard
  console.log('[Onboarding] Opening wizard...');
  openOnboardingWizard();
}

function openOnboardingWizard() {
  console.log('[Onboarding] openOnboardingWizard called');

  // Remove existing wizard if present
  const existing = document.getElementById('onboardingWizard');
  if (existing) {
    console.log('[Onboarding] Removing existing wizard');
    existing.remove();
  }

  const state = getOnboardingState();
  console.log('[Onboarding] Creating wizard with state:', state);

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
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 class="wizard-step-title">Get Your Support Chat Running</h2>
        <p class="wizard-step-desc" style="margin-bottom: 0;">
          In just 2 simple steps, you'll have a fully functional support chat on your website.
        </p>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 16px; padding: 24px; border: 1px solid rgba(59, 130, 246, 0.2); transition: all 0.3s ease; cursor: default;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 24px rgba(59, 130, 246, 0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <span style="background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px;">STEP 1</span>
          </div>
          <div style="font-weight: 700; color: #1e40af; font-size: 18px; margin-bottom: 8px;">Add Support Agents</div>
          <div style="font-size: 14px; color: #64748b; line-height: 1.5;">Invite team members to help manage customer conversations</div>
        </div>
        <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 16px; padding: 24px; border: 1px solid rgba(34, 197, 94, 0.2); transition: all 0.3s ease; cursor: default;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 24px rgba(34, 197, 94, 0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #22c55e 0%, #10b981 100%); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 6px 16px rgba(34, 197, 94, 0.3);">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <span style="background: linear-gradient(135deg, #22c55e, #10b981); color: white; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px;">STEP 2</span>
          </div>
          <div style="font-weight: 700; color: #166534; font-size: 18px; margin-bottom: 8px;">Install the Widget</div>
          <div style="font-size: 14px; color: #64748b; line-height: 1.5;">Add a simple code snippet to your website</div>
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
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 class="wizard-step-title">Add Support Agents</h2>
        <p class="wizard-step-desc" style="margin-bottom: 0;">
          Agents are team members who can view and respond to customer conversations.
        </p>
      </div>

      ${agentsAddedHtml}

      <form id="wizardAddAgentForm" onsubmit="wizardAddAgent(event)">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
          <div>
            <div class="wizard-form-group" style="margin-bottom: 16px;">
              <label class="wizard-form-label">Agent Email Address</label>
              <input type="email" class="wizard-form-input" id="wizardAgentEmail" placeholder="agent@company.com" required>
            </div>
            <div class="wizard-form-group" style="margin-bottom: 16px;">
              <label class="wizard-form-label">Set Password</label>
              <input type="password" class="wizard-form-input" id="wizardAgentPassword" placeholder="Enter password for agent" required minlength="6">
              <div class="form-help" style="margin-top: 6px; font-size: 12px; color: #64748b;">Agent will receive login credentials via email</div>
            </div>
            <button type="submit" class="wizard-btn wizard-btn-primary" style="width: 100%;">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Agent
            </button>
          </div>
          <div>
            <div style="font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Permissions</div>
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
              <div class="wizard-toggle-label">Admin Access</div>
              <label class="toggle-switch">
                <input type="checkbox" id="wizardCanManage">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  `;
}

function renderStep3() {
  const widgetCode = generateWidgetCode();

  return `
    <div class="wizard-step active" data-step="3">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 class="wizard-step-title">Install the Widget</h2>
        <p class="wizard-step-desc" style="margin-bottom: 0;">
          Copy the code snippet and add it to your website to enable the chat widget.
        </p>
      </div>

      <div style="display: grid; grid-template-columns: 280px 1fr; gap: 24px;">
        <div>
          <div style="font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px;">How to Install</div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 12px; border: 1px solid #e2e8f0;">
              <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #0ea5e9, #6366f1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 13px; font-weight: 700; flex-shrink: 0;">1</div>
              <div style="font-size: 13px; color: #475569; line-height: 1.5; padding-top: 4px;">Click <strong>Copy Code</strong> button</div>
            </div>
            <div style="display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 12px; border: 1px solid #e2e8f0;">
              <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #0ea5e9, #6366f1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 13px; font-weight: 700; flex-shrink: 0;">2</div>
              <div style="font-size: 13px; color: #475569; line-height: 1.5; padding-top: 4px;">Open your website's HTML file</div>
            </div>
            <div style="display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 12px; border: 1px solid #e2e8f0;">
              <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #0ea5e9, #6366f1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 13px; font-weight: 700; flex-shrink: 0;">3</div>
              <div style="font-size: 13px; color: #475569; line-height: 1.5; padding-top: 4px;">Paste before <code style="background: #dbeafe; padding: 2px 6px; border-radius: 4px; color: #2563eb;">&lt;/body&gt;</code></div>
            </div>
          </div>
        </div>
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <div style="font-size: 13px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;">Widget Code</div>
            <button type="button" class="wizard-btn wizard-btn-primary" id="wizardCopyBtn" onclick="wizardCopyCode()" style="padding: 10px 20px; font-size: 13px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span id="wizardCopyBtnText">Copy Code</span>
            </button>
          </div>
          <div class="wizard-code-block" style="margin: 0; max-height: 220px; overflow-y: auto;">
            <pre id="wizardCodeSnippet" style="font-size: 12px;">${escapeHtmlForDisplay(widgetCode)}</pre>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderStep4() {
  const state = getOnboardingState();

  return `
    <div class="wizard-step active" data-step="4">
      <div style="display: flex; align-items: center; gap: 24px; margin-bottom: 24px;">
        <div class="wizard-success-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 class="wizard-step-title" style="margin-bottom: 4px;">You're All Set!</h2>
          <p class="wizard-step-desc" style="margin-bottom: 0;">
            Your support chat is ready to help your customers.
          </p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 14px; padding: 16px 20px; background: ${state.agentsAdded > 0 ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : 'linear-gradient(135deg, #fff7ed, #ffedd5)'}; border-radius: 14px; border: 1px solid ${state.agentsAdded > 0 ? '#86efac' : '#fed7aa'};">
          <div style="width: 36px; height: 36px; background: ${state.agentsAdded > 0 ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #f97316, #ea580c)'}; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="${state.agentsAdded > 0 ? 'M5 13l4 4L19 7' : 'M12 6v6m0 0v6m0-6h6m-6 0H6'}" />
            </svg>
          </div>
          <div>
            <div style="font-size: 15px; font-weight: 700; color: ${state.agentsAdded > 0 ? '#166534' : '#9a3412'};">
              ${state.agentsAdded > 0 ? `${state.agentsAdded} Agent${state.agentsAdded > 1 ? 's' : ''} Added` : 'No Agents Added'}
            </div>
            <div style="font-size: 12px; color: #64748b;">${state.agentsAdded > 0 ? 'Ready to handle chats' : 'Add agents later'}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 14px; padding: 16px 20px; background: ${state.widgetCodeCopied ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : 'linear-gradient(135deg, #fff7ed, #ffedd5)'}; border-radius: 14px; border: 1px solid ${state.widgetCodeCopied ? '#86efac' : '#fed7aa'};">
          <div style="width: 36px; height: 36px; background: ${state.widgetCodeCopied ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #f97316, #ea580c)'}; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="${state.widgetCodeCopied ? 'M5 13l4 4L19 7' : 'M12 6v6m0 0v6m0-6h6m-6 0H6'}" />
            </svg>
          </div>
          <div>
            <div style="font-size: 15px; font-weight: 700; color: ${state.widgetCodeCopied ? '#166534' : '#9a3412'};">
              ${state.widgetCodeCopied ? 'Widget Code Copied' : 'Widget Pending'}
            </div>
            <div style="font-size: 12px; color: #64748b;">${state.widgetCodeCopied ? 'Paste on your site' : 'Get code from Settings'}</div>
          </div>
        </div>
      </div>

      <div style="text-align: center; margin-bottom: 16px;">
        <span style="font-size: 14px; color: #64748b; font-weight: 500;">What would you like to do next?</span>
      </div>

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
          <span>Customize</span>
        </a>
        <a href="${buildSiteAdminUrl('site-admin-agents.html')}" class="wizard-action-btn" onclick="completeOnboarding()">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>Agents</span>
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
  const password = document.getElementById('wizardAgentPassword').value;
  if (!email || !password) return;

  const canView = document.getElementById('wizardCanView').checked;
  const canRespond = document.getElementById('wizardCanRespond').checked;
  const canClose = document.getElementById('wizardCanClose').checked;
  const canManage = document.getElementById('wizardCanManage').checked;

  try {
    await apiPost(`/sites/${siteId}/agents`, {
      email: email,
      password: password,
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
    showToast('Agent added successfully! Login credentials sent via email.', 'success');
    document.getElementById('wizardAgentEmail').value = '';
    document.getElementById('wizardAgentPassword').value = '';
    document.getElementById('wizardContent').innerHTML = renderStep(2);

  } catch (err) {
    console.error('Error adding agent:', err);
    showToast(err.message || 'Failed to add agent.', 'error');
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
  console.log('[Onboarding] initOnboarding called, initialized:', onboardingInitialized);
  if (onboardingInitialized) return;
  onboardingInitialized = true;

  // Inject the setup guide button
  console.log('[Onboarding] Injecting setup guide button...');
  injectSetupGuideButton();

  // Check if we should show the wizard
  // Delay slightly to ensure siteData is loaded
  console.log('[Onboarding] Will check onboarding in 500ms...');
  setTimeout(() => {
    checkOnboarding();
  }, 500);
}

// Initialize when DOM is ready
console.log('[Onboarding] Document readyState:', document.readyState);
if (document.readyState === 'loading') {
  console.log('[Onboarding] Adding DOMContentLoaded listener');
  document.addEventListener('DOMContentLoaded', initOnboarding);
} else {
  console.log('[Onboarding] DOM already ready, calling initOnboarding');
  initOnboarding();
}
