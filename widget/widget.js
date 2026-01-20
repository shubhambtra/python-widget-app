(function () {
  // Prevent multiple instances
  if (window.ChatWidgetLoaded) return;
  window.ChatWidgetLoaded = true;

  const config = window.ChatWidget || {};
  const siteId = config.siteId;
  const baseUrl = config.baseUrl || "http://localhost:8000";

  if (!siteId) {
    console.error("ChatWidget: siteId is required");
    return;
  }

  // Create container
  const container = document.createElement("div");
  container.id = "chat-widget-container";
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  // Create iframe
  const iframe = document.createElement("iframe");
  iframe.id = "chat-widget-iframe";
  iframe.src = `${baseUrl}/static/Widget.html?siteId=${encodeURIComponent(siteId)}`;
  iframe.style.cssText = `
    width: 360px;
    height: 520px;
    border: none;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: white;
  `;
  iframe.allow = "clipboard-write";

  // Create notification badge (outside iframe)
  const badge = document.createElement("div");
  badge.id = "chat-widget-badge";
  badge.style.cssText = `
    position: absolute;
    top: -8px;
    right: -8px;
    background: #ef4444;
    color: white;
    font-size: 12px;
    font-weight: 600;
    min-width: 22px;
    height: 22px;
    border-radius: 11px;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
    animation: badgePop 0.3s ease;
  `;

  // Add animation keyframes
  const style = document.createElement("style");
  style.textContent = `
    @keyframes badgePop {
      0% { transform: scale(0); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
    @keyframes widgetShake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
  `;
  document.head.appendChild(style);

  container.appendChild(iframe);
  container.appendChild(badge);
  document.body.appendChild(container);

  // State
  let isCollapsed = false;
  let unreadCount = 0;

  // Handle messages from iframe
  window.addEventListener("message", (e) => {
    if (!e.data || typeof e.data !== "object") return;

    switch (e.data.type) {
      case "CHAT_COLLAPSE":
        collapse();
        break;

      case "CHAT_EXPAND":
        expand();
        break;

      case "CHAT_UNREAD":
        unreadCount = e.data.count || 0;
        updateBadge();
        break;
    }
  });

  function collapse() {
    isCollapsed = true;
    iframe.style.height = "56px";
    iframe.style.width = "200px";
    iframe.style.borderRadius = "28px";
    iframe.style.cursor = "pointer";
  }

  function expand() {
    isCollapsed = false;
    iframe.style.height = "520px";
    iframe.style.width = "360px";
    iframe.style.borderRadius = "16px";
    iframe.style.cursor = "default";
    unreadCount = 0;
    updateBadge();
  }

  function updateBadge() {
    if (unreadCount > 0 && isCollapsed) {
      badge.textContent = unreadCount > 9 ? "9+" : unreadCount;
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }
  }

  // Click on collapsed widget to expand
  iframe.addEventListener("click", () => {
    if (isCollapsed) {
      iframe.contentWindow.postMessage({ type: "EXPAND_WIDGET" }, "*");
    }
  });

  // Expose API
  window.ChatWidgetAPI = {
    expand: () => iframe.contentWindow.postMessage({ type: "EXPAND_WIDGET" }, "*"),
    collapse: () => iframe.contentWindow.postMessage({ type: "COLLAPSE_WIDGET" }, "*"),
    isCollapsed: () => isCollapsed,
    getUnreadCount: () => unreadCount
  };

})();
