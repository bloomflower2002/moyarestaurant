// =============================================
// COOKIE MANAGEMENT FUNCTIONS
// =============================================

/**
 * Set a cookie with name, value, and expiration days
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Number of days until expiration
 */
function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    const encodedValue = encodeURIComponent(value);
    document.cookie = `${name}=${encodedValue};expires=${expires.toUTCString()};path=/`;
}

/**
 * Get a cookie value by name
 * @param {string} name - Cookie name to retrieve
 * @returns {string|null} - Cookie value or null if not found
 */
function getCookie(name) {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');
    for(let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === ' ') cookie = cookie.substring(1);
        if (cookie.indexOf(nameEQ) === 0) {
            return decodeURIComponent(cookie.substring(nameEQ.length));
        }
    }
    return null;
}

/**
 * Delete a cookie by name
 * @param {string} name - Cookie name to delete
 */
function deleteCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

/**
 * Check if a cookie exists
 * @param {string} name - Cookie name to check
 * @returns {boolean} - True if cookie exists
 */
function cookieExists(name) {
    return getCookie(name) !== null;
}

/**
 * Get all cookies as an object
 * @returns {Object} - All cookies as key-value pairs
 */
function getAllCookies() {
    const cookies = {};
    const cookieArray = document.cookie.split(';');
    
    cookieArray.forEach(cookie => {
        if (cookie.trim()) {
            const [name, value] = cookie.trim().split('=');
            cookies[decodeURIComponent(name)] = decodeURIComponent(value);
        }
    });
    
    return cookies;
}

// =============================================
// THEME MANAGEMENT FUNCTIONS - UPDATED
// =============================================

/**
 * Save theme preference to cookie and apply it
 * @param {string} theme - Theme name ('light' or 'dark')
 */
function saveTheme(theme) {
    setCookie("theme", theme, 365);
    applyTheme(theme);
    updateThemeToggleButton(theme);
}

/**
 * Load saved theme from cookie and apply it
 * @returns {string} - The loaded theme
 */
function loadTheme() {
    const savedTheme = getCookie("theme") || "light";
    applyTheme(savedTheme);
    updateThemeToggleButton(savedTheme);
    return savedTheme;
}

/**
 * Apply theme to the document - FIXED VERSION
 * @param {string} theme - Theme name
 */
function applyTheme(theme) {
    console.log('Applying theme:', theme);
    
    // Remove any existing theme classes
    document.body.classList.remove('light-theme', 'dark-theme');
    
    // Add the new theme class
    document.body.classList.add(theme + '-theme');
    
    // Apply styles directly to elements (since CSS might not have the classes)
    if (theme === "dark") {
        // Dark mode styles
        document.body.style.backgroundColor = '#1a1a1a';
        document.body.style.color = 'white';
        
        // Style all elements that need dark mode
        document.querySelectorAll('.category-card, .item, .review, .contact-form').forEach(element => {
            element.style.backgroundColor = '#2d2d2d';
            element.style.color = 'white';
            element.style.borderColor = '#444';
        });
        
        // Style sections with dark backgrounds
        document.querySelectorAll('.category-grid, .category-grid1, .menu-slider1, .menu-slider23, .menu-slider12, .review-section, footer').forEach(section => {
            section.style.background = '#2d2d2d';
            section.style.color = 'white';
        });
        
        // Style specific elements
        document.querySelectorAll('.menu-heading, .combination').forEach(element => {
            element.style.color = '#ff8c42';
        });
        
        document.querySelectorAll('.more-link').forEach(link => {
            link.style.color = '#ff8c42';
        });
        
    } else {
        // Light mode styles - reset to original
        document.body.style.backgroundColor = '';
        document.body.style.color = '';
        
        // Reset all elements to original styles
        document.querySelectorAll('.category-card, .item, .review, .contact-form').forEach(element => {
            element.style.backgroundColor = '';
            element.style.color = '';
            element.style.borderColor = '';
        });
        
        // Reset sections
        document.querySelectorAll('.category-grid, .category-grid1, .menu-slider1, .menu-slider23, .menu-slider12, .review-section, footer').forEach(section => {
            section.style.background = '';
            section.style.color = '';
        });
        
        // Reset specific elements
        document.querySelectorAll('.menu-heading, .combination').forEach(element => {
            element.style.color = '';
        });
        
        document.querySelectorAll('.more-link').forEach(link => {
            link.style.color = '';
        });
    }
    
    console.log('Theme applied:', theme);
}

/**
 * Update theme toggle button appearance
 * @param {string} theme - Current theme
 */
function updateThemeToggleButton(theme) {
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
        toggleBtn.textContent = theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
        toggleBtn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    }
}

/**
 * Toggle between light and dark themes - IMPROVED
 */
function toggleTheme() {
    const currentTheme = getCookie("theme") || "light";
    const newTheme = currentTheme === "light" ? "dark" : "light";
    console.log('Toggling theme from', currentTheme, 'to', newTheme);
    saveTheme(newTheme);
}

// =============================================
// COOKIE CONSENT MANAGEMENT
// =============================================

/**
 * Accept all cookies and hide consent banner
 */
function acceptCookies() {
    setCookie("cookies_accepted", "true", 365);
    setCookie("cookies_necessary", "true", 365);
    setCookie("cookies_preferences", "true", 365);
    setCookie("cookies_analytics", "true", 365);
    
    hideCookieBanner();
    loadTheme(); // Load saved theme preferences
    
    // Dispatch event for analytics
    window.dispatchEvent(new CustomEvent('cookiesAccepted'));
    
    console.log("Cookies accepted and preferences saved.");
}

/**
 * Decline non-essential cookies
 */
function declineCookies() {
    setCookie("cookies_accepted", "false", 365);
    setCookie("cookies_necessary", "true", 365); // Necessary cookies are always enabled
    setCookie("cookies_preferences", "false", 365);
    setCookie("cookies_analytics", "false", 365);
    
    // Delete non-essential cookies
    deleteCookie("theme"); // Remove theme preference if it's considered non-essential
    
    hideCookieBanner();
    
    // Apply default theme
    applyTheme("light");
    
    console.log("Non-essential cookies declined.");
}

/**
 * Accept only necessary cookies
 */
function acceptNecessaryOnly() {
    setCookie("cookies_accepted", "necessary", 365);
    setCookie("cookies_necessary", "true", 365);
    setCookie("cookies_preferences", "false", 365);
    setCookie("cookies_analytics", "false", 365);
    
    hideCookieBanner();
    loadTheme(); // Still load theme as it might be considered necessary
    
    console.log("Only necessary cookies accepted.");
}

/**
 * Hide the cookie consent banner
 */
function hideCookieBanner() {
    const banner = document.getElementById('cookieConsent');
    if (banner) {
        banner.style.display = 'none';
    }
}

/**
 * Show the cookie consent banner
 */
function showCookieBanner() {
    const banner = document.getElementById('cookieConsent');
    if (banner) {
        banner.style.display = 'block';
    }
}

/**
 * Check if cookies are accepted
 * @returns {boolean} - True if cookies are accepted
 */
function areCookiesAccepted() {
    return getCookie("cookies_accepted") === "true";
}

/**
 * Check if specific cookie category is accepted
 * @param {string} category - Cookie category ('necessary', 'preferences', 'analytics')
 * @returns {boolean} - True if category is accepted
 */
function isCookieCategoryAccepted(category) {
    if (category === 'necessary') return true; // Necessary cookies are always enabled
    
    const accepted = getCookie("cookies_accepted");
    if (accepted === "false") return false;
    if (accepted === "necessary") return category === 'necessary';
    
    return getCookie(`cookies_${category}`) === "true";
}

// =============================================
// USER PREFERENCES FUNCTIONS
// =============================================

/**
 * Save user language preference
 * @param {string} language - Language code (e.g., 'en', 'es')
 */
function saveLanguagePreference(language) {
    if (isCookieCategoryAccepted('preferences')) {
        setCookie("user_language", language, 365);
        console.log("Language preference saved:", language);
    }
}

/**
 * Get user language preference
 * @returns {string} - Saved language or default
 */
function getLanguagePreference() {
    return getCookie("user_language") || "en";
}

/**
 * Save user settings to cookies
 * @param {Object} settings - Settings object
 */
function saveUserSettings(settings) {
    if (isCookieCategoryAccepted('preferences')) {
        setCookie("user_settings", JSON.stringify(settings), 365);
        console.log("User settings saved:", settings);
    }
}

/**
 * Get user settings from cookies
 * @returns {Object} - User settings object
 */
function getUserSettings() {
    const settings = getCookie("user_settings");
    return settings ? JSON.parse(settings) : {};
}

// =============================================
// SESSION MANAGEMENT FUNCTIONS
// =============================================

/**
 * Set user session cookie (for login)
 * @param {string} userId - User identifier
 * @param {string} sessionToken - Session token
 * @param {number} hours - Session duration in hours
 */
function setUserSession(userId, sessionToken, hours = 24) {
    setCookie("user_id", userId, hours / 24);
    setCookie("session_token", sessionToken, hours / 24);
    setCookie("session_start", new Date().toISOString(), hours / 24);
}

/**
 * Check if user has active session
 * @returns {boolean} - True if session is active
 */
function hasActiveSession() {
    return !!(getCookie("user_id") && getCookie("session_token"));
}

/**
 * Clear user session (logout)
 */
function clearUserSession() {
    deleteCookie("user_id");
    deleteCookie("session_token");
    deleteCookie("session_start");
}

// =============================================
// INITIALIZATION
// =============================================

/**
 * Initialize cookie functionality when DOM is loaded
 */
function initializeCookies() {
    // Check if we need to show cookie banner
    const consentGiven = getCookie("cookies_accepted");
    
    if (!consentGiven) {
        showCookieBanner();
    } else {
        // Load user preferences if accepted
        if (isCookieCategoryAccepted('preferences')) {
            loadTheme();
        }
    }
    
    // Initialize theme toggle button if it exists
    const currentTheme = getCookie("theme") || "light";
    updateThemeToggleButton(currentTheme);
    
    console.log("Cookie system initialized. Consent:", consentGiven);
}

/**
 * Reset all user preferences and cookies
 * (Useful for testing or GDPR compliance)
 */
function resetAllCookies() {
    const cookies = getAllCookies();
    Object.keys(cookies).forEach(cookieName => {
        deleteCookie(cookieName);
    });
    showCookieBanner();
    applyTheme("light");
    console.log("All cookies reset.");
}

// =============================================
// EVENT LISTENERS
// =============================================

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeCookies();
});

// Make functions globally available
window.cookieManager = {
    setCookie,
    getCookie,
    deleteCookie,
    cookieExists,
    getAllCookies,
    saveTheme,
    loadTheme,
    toggleTheme,
    acceptCookies,
    declineCookies,
    acceptNecessaryOnly,
    areCookiesAccepted,
    isCookieCategoryAccepted,
    saveLanguagePreference,
    getLanguagePreference,
    saveUserSettings,
    getUserSettings,
    setUserSession,
    hasActiveSession,
    clearUserSession,
    resetAllCookies
};

console.log("cookies.js loaded successfully!");