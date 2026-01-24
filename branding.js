/**
 * Branding Service
 *
 * Loads site settings from the API and applies branding dynamically across pages.
 * Include this file after config.js in any page that needs dynamic branding.
 */

const Branding = (function() {
    // Cache for site settings
    let cachedSettings = null;
    const CACHE_KEY = 'siteSettings';
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    // Default fallback values
    const defaults = {
        siteName: 'Assistica AI',
        siteLogo: null,
        favicon: null,
        copyrightText: null,
        seoTitle: null,
        seoDescription: null,
        seoKeywords: null
    };

    /**
     * Get cached settings from localStorage
     */
    function getCachedSettings() {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    return data;
                }
            }
        } catch (e) {
            console.warn('Failed to read cached settings:', e);
        }
        return null;
    }

    /**
     * Save settings to localStorage cache
     */
    function setCachedSettings(data) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('Failed to cache settings:', e);
        }
    }

    /**
     * Fetch site settings from API
     */
    async function fetchSettings() {
        try {
            const apiBase = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE : 'https://chatapp.code2night.com/api';
            const response = await fetch(`${apiBase}/SiteSettings`);

            if (response.ok) {
                const result = await response.json();
                if (result.data) {
                    cachedSettings = {
                        siteName: result.data.siteName || defaults.siteName,
                        siteLogo: result.data.siteLogo || defaults.siteLogo,
                        favicon: result.data.favicon || defaults.favicon,
                        copyrightText: result.data.copyrightText || defaults.copyrightText,
                        seoTitle: result.data.seoTitle || defaults.seoTitle,
                        seoDescription: result.data.seoDescription || defaults.seoDescription,
                        seoKeywords: result.data.seoKeywords || defaults.seoKeywords
                    };
                    setCachedSettings(cachedSettings);
                    return cachedSettings;
                }
            }
        } catch (error) {
            console.warn('Failed to fetch site settings:', error);
        }

        // Return defaults if fetch fails
        return defaults;
    }

    /**
     * Get the first letter of the site name for icon
     */
    function getIconLetter(siteName) {
        return siteName ? siteName.charAt(0).toUpperCase() : 'C';
    }

    /**
     * Convert relative URL to absolute URL using API base
     */
    function toAbsoluteUrl(url) {
        if (url && url.startsWith('/')) {
            const apiUrl = typeof CONFIG !== 'undefined' ? CONFIG.API_URL : 'https://chatapp.code2night.com';
            return apiUrl + url;
        }
        return url;
    }

    /**
     * Apply branding to DOM elements
     */
    function applyBranding(settings) {
        // Update elements with data-brand="name"
        document.querySelectorAll('[data-brand="name"]').forEach(el => {
            el.textContent = settings.siteName;
        });

        // Update elements with data-brand="icon"
        document.querySelectorAll('[data-brand="icon"]').forEach(el => {
            if (settings.siteLogo) {
                // If there's a logo image, replace with img element
                const logoUrl = toAbsoluteUrl(settings.siteLogo);
                el.innerHTML = `<img src="${logoUrl}" alt="${settings.siteName}" style="width: 100%; height: 100%; object-fit: contain;">`;
            } else {
                // Use first letter of site name
                el.textContent = getIconLetter(settings.siteName);
            }
        });

        // Update elements with data-brand="copyright"
        document.querySelectorAll('[data-brand="copyright"]').forEach(el => {
            const year = new Date().getFullYear();
            if (settings.copyrightText) {
                el.innerHTML = settings.copyrightText;
            } else {
                el.innerHTML = `&copy; ${year} ${settings.siteName}. All rights reserved.`;
            }
        });

        // Update page title
        updatePageTitle(settings);

        // Update favicon if provided
        if (settings.favicon) {
            updateFavicon(settings.favicon);
        }

        // Update meta tags
        updateMetaTags(settings);
    }

    /**
     * Update page title - replace all occurrences of ChatApp with the site name
     */
    function updatePageTitle(settings) {
        const currentTitle = document.title;
        const siteName = settings.siteName;

        // Replace all occurrences of "ChatApp" with the site name
        if (currentTitle.includes('ChatApp')) {
            document.title = currentTitle.replace(/ChatApp/g, siteName);
        }
    }

    /**
     * Update favicon
     */
    function updateFavicon(faviconUrl) {
        let link = document.querySelector("link[rel*='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = toAbsoluteUrl(faviconUrl);
    }

    /**
     * Update meta tags for SEO
     */
    function updateMetaTags(settings) {
        // Update meta description
        if (settings.seoDescription) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.name = 'description';
                document.head.appendChild(metaDesc);
            }
            metaDesc.content = settings.seoDescription;
        }

        // Update meta keywords
        if (settings.seoKeywords) {
            let metaKeywords = document.querySelector('meta[name="keywords"]');
            if (!metaKeywords) {
                metaKeywords = document.createElement('meta');
                metaKeywords.name = 'keywords';
                document.head.appendChild(metaKeywords);
            }
            metaKeywords.content = settings.seoKeywords;
        }
    }

    /**
     * Initialize branding - call this on page load
     */
    async function init() {
        // First, try to use cached settings for instant display
        const cached = getCachedSettings();
        if (cached) {
            cachedSettings = cached;
            applyBranding(cached);
        }

        // Then fetch fresh settings in background
        const fresh = await fetchSettings();
        if (fresh && JSON.stringify(fresh) !== JSON.stringify(cached)) {
            applyBranding(fresh);
        }
    }

    /**
     * Get current settings (for use by other scripts)
     */
    function getSettings() {
        return cachedSettings || defaults;
    }

    /**
     * Clear the cache (useful when settings are updated)
     */
    function clearCache() {
        try {
            localStorage.removeItem(CACHE_KEY);
            cachedSettings = null;
        } catch (e) {
            console.warn('Failed to clear cache:', e);
        }
    }

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public API
    return {
        init,
        getSettings,
        clearCache,
        applyBranding,
        fetchSettings
    };
})();
