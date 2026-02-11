/**
 * ChatApp Configuration v1.1
 *
 * Edit this file to configure URLs for different environments.
 * This file is loaded by all HTML pages.
 */

const CONFIG = {
    // API Configuration
    // For local development: http://localhost:5000
    // For production: https://api.yourdomain.com
    API_URL: 'http://localhost:5000',
    //API_URL: 'https://chatapp.code2night.com',
    // WebSocket Configuration
    // For local development: ws://localhost:5000
    // For production: wss://api.yourdomain.com
    //WS_URL: 'wss://chatapp.code2night.com',
    WS_URL: 'ws://localhost:5000',
    // Frontend URL (for redirects, etc.)
    // For local development: http://localhost:8000
    // For production: https://app.yourdomain.com
    APP_URL: window.location.origin,

    // Widget URL (where widget.js is hosted)
    // For local development: http://localhost:8000
    // For production: https://widget.yourdomain.com or same as APP_URL
    WIDGET_URL: window.location.origin
};

// Computed values (don't edit these)
CONFIG.API_BASE = `${CONFIG.API_URL}/api`;
CONFIG.WS_CHAT = `${CONFIG.WS_URL}/ws/chat`;
CONFIG.WS_SUPPORT = `${CONFIG.WS_URL}/ws/support`;

// Freeze config to prevent accidental modifications
Object.freeze(CONFIG);

// Export for modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
