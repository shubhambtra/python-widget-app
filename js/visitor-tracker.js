/**
 * Website Visitor Tracking Script
 * Automatically tracks page visits and sends to the API
 */
(function() {
    'use strict';

    // Generate or get session ID from sessionStorage
    function getSessionId() {
        let sessionId = sessionStorage.getItem('visitor_session_id');
        if (!sessionId) {
            sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('visitor_session_id', sessionId);
        }
        return sessionId;
    }

    // Get visit source from page
    function getVisitSource() {
        const path = window.location.pathname.toLowerCase();
        if (path === '/' || path === '/index.html') return 'landing';
        if (path.includes('login')) return 'login';
        if (path.includes('register')) return 'register';
        if (path.includes('support')) return 'support';
        if (path.includes('admin')) return 'admin';
        if (path.includes('guide')) return 'guide';
        if (path.includes('knowledge')) return 'knowledge';
        if (path.includes('profile')) return 'profile';
        return 'other';
    }

    // Track the visit
    async function trackVisit() {
        // Skip if CONFIG is not available
        if (typeof CONFIG === 'undefined' || !CONFIG.API_BASE) {
            return;
        }

        const visitData = {
            pageUrl: window.location.href,
            referrerUrl: document.referrer || null,
            userAgent: navigator.userAgent,
            visitSource: getVisitSource(),
            sessionId: getSessionId()
        };

        try {
            const response = await fetch(`${CONFIG.API_BASE}/WebsiteVisits/track`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(visitData)
            });

            if (response.ok) {
                const result = await response.json();
                // Store visit ID for reference
                sessionStorage.setItem('last_visit_id', result.data?.id || '');
            }
        } catch (error) {
            // Silent fail - don't disrupt user experience
        }
    }

    // Track on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', trackVisit);
    } else {
        // DOM already loaded
        trackVisit();
    }

    // Expose for manual tracking if needed
    window.VisitorTracker = {
        track: trackVisit,
        getSessionId: getSessionId
    };
})();
