// ==UserScript==
// @name         ☀️Dark Mode Toggle Enhanced (v3.2.0)
// @author       Cervantes Wu (http://www.mriwu.us) & Gemini
// @description  Ultra enhanced dark mode toggle with per-site settings, performance optimization, device adaptation, greyscale mode, etc.
// @namespace    https://github.com/cwlum/dark-mode-toggle-userscript
// @version      3.2.0
// @match        *://*/*
// @exclude      devtools://*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.addStyle
// @grant        GM.deleteValue
// @grant        GM.listValues
// @grant        GM.registerMenuCommand
// @grant        GM_addElement
// @grant        unsafeWindow
// @require      https://unpkg.com/darkreader@4.9.58/darkreader.js
// @homepageURL  https://github.com/cwlum/dark-mode-toggle-userscript
// @supportURL   https://github.com/cwlum/dark-mode-toggle-userscript/issues
// @license      MIT
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    /**
     * ------------------------
     * CONSTANTS
     * ------------------------
     */
    const ELEMENT_IDS = {
        BUTTON: 'darkModeToggle',
        UI: 'darkModeToggleUI',
        TOGGLE_UI_BUTTON: 'toggleDarkModeUIButton',
        RESET_SETTINGS_BUTTON: 'resetSettingsButton',
        SITE_EXCLUSION_INPUT: 'siteExclusionInput',
        SITE_EXCLUSION_LIST: 'siteExclusionList',
        AUTO_MODE_TOGGLE: 'autoModeToggle',
        EXPORT_SETTINGS_BUTTON: 'exportSettingsButton',
        IMPORT_SETTINGS_BUTTON: 'importSettingsButton',
        IMPORT_SETTINGS_INPUT: 'importSettingsInput',
        SCHEDULE_ENABLED_TOGGLE: 'scheduleEnabledToggle',
        SCHEDULE_START_TIME: 'scheduleStartTime',
        SCHEDULE_END_TIME: 'scheduleEndTime',
        THEME_PRESETS_SELECT: 'themePresetsSelect',
        EXTREME_MODE_TOGGLE: 'extremeModeToggle',
        CUSTOM_CSS_TEXTAREA: 'customCssTextarea',
        DYNAMIC_SELECTORS_TOGGLE: 'dynamicSelectorsToggle',
        FORCE_DARK_TOGGLE: 'forceDarkToggle',
        SHOW_DIAGNOSTICS_BUTTON: 'showDiagnosticsButton',
        PER_SITE_SETTINGS_TOGGLE: 'perSiteSettingsToggle',
        USE_GLOBAL_POSITION_TOGGLE: 'useGlobalPositionToggle',
        GREYSCALE_MODE_TOGGLE: 'greyscaleModeToggle', // New: Greyscale mode toggle
        COLOR_FILTER_TOGGLE: 'colorFilterToggle', // New: Color filter toggle
    };

    const STORAGE_KEYS = {
        SETTINGS: 'settings',
        DARK_MODE: 'darkMode',
        PER_SITE_SETTINGS_PREFIX: 'perSiteSettings_',
        CUSTOM_CSS_PREFIX: 'customCss_',
        PROBLEMATIC_SITES: 'problematicSites',
        DEVICE_INFO: 'deviceInfo'
    };

    // Complete SVG icons for moon and sun
    const SVG_ICONS = {
        MOON: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
        SUN: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
        GEAR: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
        MOBILE: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>`,
        DESKTOP: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`
    };

    // Theme presets for quick application
    const THEME_PRESETS = {
        DEFAULT: { name: 'Default', brightness: 100, contrast: 90, sepia: 10 },
        HIGH_CONTRAST: { name: 'High Contrast', brightness: 110, contrast: 110, sepia: 0 },
        LOW_CONTRAST: { name: 'Low Contrast', brightness: 90, contrast: 80, sepia: 5 },
        SEPIA: { name: 'Sepia', brightness: 100, contrast: 95, sepia: 40 },
        NIGHT: { name: 'Night Mode', brightness: 80, contrast: 100, sepia: 0 },
        ULTRA_DARK: { name: 'Ultra Dark', brightness: 70, contrast: 120, sepia: 0 },
        MIDNIGHT: { name: 'Midnight', brightness: 60, contrast: 130, sepia: 0 }
    };

    // List of known problematic sites and their specific fixes
    const PROBLEMATIC_SITES = {
        'youtube.com': {
            description: 'YouTube needs special handling for video player and comments',
            fixMethod: 'useCustomCss',
            customCss: `
                /* Fix for YouTube dark mode compatibility */
                html[dark] {
                    --yt-spec-text-primary: #f1f1f1 !important;
                    --yt-spec-text-secondary: #aaa !important;
                    --yt-spec-general-background-a: #181818 !important;
                }
                ytd-watch-flexy { background-color: var(--yt-spec-general-background-a, #181818) !important; }
                ytd-comments { background-color: var(--yt-spec-general-background-a, #181818) !important; }
            `
        },
        'facebook.com': {
            description: 'Facebook has its own dark mode which may conflict',
            fixMethod: 'forceElementStyles',
            selectors: [
                { selector: '[role="main"]', styles: { backgroundColor: '#1c1e21 !important' } },
                { selector: '[role="feed"]', styles: { backgroundColor: '#1c1e21 !important' } }
            ]
        },
        'twitter.com': {
            description: 'Twitter/X has its own dark mode which may conflict',
            fixMethod: 'useCustomCss',
            customCss: `
                /* Force dark background on Twitter/X */
                body { background-color: #15202b !important; }
                div[data-testid="primaryColumn"] { background-color: #15202b !important; }
                div[data-testid="tweetText"] { color: #ffffff !important; }
            `
        },
        'reddit.com': {
            description: 'Reddit has its own dark mode which may conflict',
            fixMethod: 'useCustomCss',
            customCss: `
                /* Force dark background on Reddit */
                body { background-color: #1a1a1b !important; }
                .Post { background-color: #272729 !important; }
                .Post * { color: #d7dadc !important; }
            `,
            defaultButtonPosition: 'bottom-right' // Default position for Reddit
        },
        'github.com': {
            description: 'GitHub has its own dark mode which may conflict',
            fixMethod: 'useCustomCss',
            customCss: `
                /* Force dark background on GitHub */
                body { background-color: #0d1117 !important; color: #c9d1d9 !important; }
                .Header { background-color: #161b22 !important; }
                .repository-content { background-color: #0d1117 !important; }
            `,
            defaultButtonPosition: 'top-right' // Default position for GitHub
        }
    };

    // Device performance categories
    const DEVICE_PERFORMANCE = {
        HIGH: 'high',
        MEDIUM: 'medium',
        LOW: 'low'
    };

    /**
     * ------------------------
     * DEFAULT SETTINGS
     * ------------------------
     */
    const DEFAULT_SETTINGS = {
        position: 'bottom-right',
        offsetX: 30,
        offsetY: 30,
        brightness: 100,
        contrast: 90,
        sepia: 10,
        themeColor: '#f7f7f7',
        textColor: '#444',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        exclusionList: [],
        iconMoon: SVG_ICONS.MOON,
        iconSun: SVG_ICONS.SUN,
        autoMode: false, // Not used currently
        buttonOpacity: 0.8,
        buttonSize: { width: 80, height: 40 },
        transitionSpeed: 0.3,
        settingsButtonOffset: 20,
        scheduledDarkMode: {
            enabled: false,
            startTime: '20:00',
            endTime: '07:00'
        },
        keyboardShortcut: {
            enabled: true,
            alt: true,
            shift: true,
            key: 'd'
        },
        extremeMode: {
            enabled: false,
            forceDarkElements: true,
            ignoreImageAnalysis: true,
            useCustomCSS: false,
            customCSSPerSite: {}
        },
        dynamicSelectors: {
            enabled: true,
            detectShadowDOM: true,
            deepScan: true,
            scanInterval: 2000 // Scan interval in ms
        },
        diagnostics: {
            enabled: false,
            logLevel: 'info',
            collectStats: true
        },
        perSiteSettings: {
            enabled: true,
            useGlobalPosition: false
        },
        deviceOptimization: {
            enabled: true,
            reducedMotion: false,
            reducedAnimations: false,
            lowPowerMode: false
        },
        appearance: { // New section
            greyscaleMode: false,
            colorFilter: false, // Example: hue-rotate
        }
    };

    /**
     * ------------------------
     * GLOBAL STATE & UI REFERENCES
     * ------------------------
     */
    let settings = { ...DEFAULT_SETTINGS };
    let uiVisible = false;
    let darkModeEnabled = false;
    let uiElements = {}; // References to UI elements
    let isInitialized = false;
    let scheduleCheckInterval = null;
    let dynamicScanInterval = null;
    let shadowRoots = new Set(); // Track shadow DOM roots
    let currentSiteCustomCSS = ''; // Current site's custom CSS
    let diagnosticsData = { siteInfo: {}, performance: {}, issues: [] };
    let customStyleElements = []; // Track injected style elements
    let extremeModeActive = false; // Track if extreme mode is currently active
    let originalStyles = new Map(); // Store original element styles for restoration
    let forcedElementsCount = 0; // Count forced elements for diagnostics
    let deviceInfo = { // Device information
        type: 'desktop',
        performance: DEVICE_PERFORMANCE.HIGH,
        touchCapable: false,
        screenSize: { width: 0, height: 0 },
        pixelRatio: 1,
        batteryLevel: null,
        isLowPowerMode: false
    };
    let currentSiteSettings = null; // Store current site-specific settings
    let eventListeners = []; // Track event listeners for cleanup
    let performanceMode = DEVICE_PERFORMANCE.HIGH; // Current performance mode

    /**
     * ------------------------
     * UTILITY FUNCTIONS
     * ------------------------
     */

    /**
     * Debounce function to limit how often a function is executed
     * Optimized version with immediate option
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in ms
     * @param {boolean} [immediate=false] - Whether to execute immediately
     * @return {Function} Debounced function
     */
    function debounce(func, delay, immediate = false) {
        let timeout;
        return function(...args) {
            const context = this;
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                timeout = null;
                if (!immediate) func.apply(context, args);
            }, delay);
            if (callNow) func.apply(context, args);
        };
    }

    /**
     * Throttle function to limit how often a function is executed
     * Enhanced version with trailing option
     * @param {Function} func - Function to throttle
     * @param {number} limit - Limit in ms
     * @param {boolean} [trailing=false] - Whether to execute after throttle period
     * @return {Function} Throttled function
     */
    function throttle(func, limit, trailing = false) {
        let lastFunc;
        let lastRan;
        return function(...args) {
            const context = this;
            if (!lastRan) {
                func.apply(context, args);
                lastRan = Date.now();
                return;
            }
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function() {
                if (Date.now() - lastRan >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, trailing ? limit - (Date.now() - lastRan) : 0);
        };
    }

    /**
     * Adaptive throttle/debounce based on device performance
     * @param {Function} func - Function to process
     * @param {string} type - Type of processing ('throttle' or 'debounce')
     * @param {Object} delays - Delays by performance level {high, medium, low}
     * @return {Function} Processed function
     */
    function adaptiveProcessing(func, type, delays) {
        const delay = delays[performanceMode] || delays[DEVICE_PERFORMANCE.MEDIUM];
        if (type === 'throttle') {
            return throttle(func, delay, performanceMode !== DEVICE_PERFORMANCE.LOW);
        } else { // debounce
            return debounce(func, delay, performanceMode === DEVICE_PERFORMANCE.HIGH);
        }
    }

    /**
     * Log with level filtering based on settings
     * @param {string} level - Log level (error, warn, info, debug)
     * @param {string} message - Message to log
     * @param {any} [data=null] - Optional data to log
     */
    function log(level, message, data = null) {
        const logLevels = { error: 0, warn: 1, info: 2, debug: 3 };
        const settingsLevel = settings.diagnostics?.logLevel || 'info';

        if (logLevels[level] <= logLevels[settingsLevel]) {
            const logMessage = `[Dark Mode Toggle] ${message}`;
            switch (level) {
                case 'error': console.error(logMessage, data || ''); break;
                case 'warn': console.warn(logMessage, data || ''); break;
                case 'info': console.info(logMessage, data || ''); break;
                case 'debug': console.debug(logMessage, data || ''); break;
            }
            // Add issue to diagnostics data
            if (settings.diagnostics?.enabled && (level === 'error' || level === 'warn')) {
                diagnosticsData.issues.push({
                    type: level,
                    message: message,
                    timestamp: new Date().toISOString(),
                    data: data ? JSON.stringify(data) : null
                });
            }
        }
    }

    /**
     * Check if current site is in the exclusion list
     * @param {string} url - Current URL to check
     * @return {boolean} Whether site is excluded
     */
    function isSiteExcluded(url) {
        return settings.exclusionList.some(pattern => {
            try {
                // Support basic wildcards
                if (pattern.includes('*')) {
                    const regexPattern = pattern
                        .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape regex characters
                        .replace(/\*/g, '.*'); // Convert wildcard to regex
                    return new RegExp('^' + regexPattern + '$').test(url);
                }
                // Simple substring check for non-wildcard patterns
                return url.includes(pattern);
            } catch (e) {
                log('warn', `Invalid exclusion pattern: ${pattern}`, e);
                return false;
            }
        });
    }

    /**
     * Create a button element with specified properties - performance optimized
     * @param {string} id - Button ID
     * @param {string} text - Button text content
     * @param {Function} onClick - Click handler
     * @param {string} [ariaLabel=''] - ARIA label for accessibility
     * @return {HTMLButtonElement} Created button
     */
    function createButton(id, text, onClick, ariaLabel = '') {
        const button = document.createElement('button');
        button.id = id;
        button.textContent = text;
        if (ariaLabel) button.setAttribute('aria-label', ariaLabel);
        // Use passive listeners when possible for better performance, but click usually needs preventDefault
        button.addEventListener('click', onClick, { passive: false });
        // Track event listener for potential cleanup
        eventListeners.push({ element: button, type: 'click', handler: onClick });
        return button;
    }

    /**
     * Gets the hostname for site matching
     * @return {string} Hostname
     */
    function getCurrentSiteIdentifier() {
        return window.location.hostname;
    }

    /**
     * Check if site is known to be problematic
     * @return {Object|null} Site info if problematic, null otherwise
     */
    function getProblematicSiteInfo() {
        const hostname = getCurrentSiteIdentifier();
        for (const site in PROBLEMATIC_SITES) {
            // Use includes for subdomain matching (e.g., mail.google.com matches google.com)
            if (hostname.includes(site)) {
                return { ...PROBLEMATIC_SITES[site], key: site };
            }
        }
        return null;
    }

    /**
     * Apply fixes for problematic sites
     */
    function applyProblematicSiteFixes() {
        const siteInfo = getProblematicSiteInfo();
        if (!siteInfo) return;
        log('info', `Applying fixes for problematic site: ${siteInfo.key}`, siteInfo);
        switch (siteInfo.fixMethod) {
            case 'useCustomCss':
                injectCustomCSS(siteInfo.customCss, 'problematic-site-fix');
                break;
            case 'forceElementStyles':
                siteInfo.selectors?.forEach(({ selector, styles }) => {
                    forceElementStyles(selector, styles);
                });
                break;
            default:
                log('warn', `Unknown fix method: ${siteInfo.fixMethod}`);
        }
        // Apply default button position for problematic site if available and not using global position
        if (siteInfo.defaultButtonPosition && currentSiteSettings && !currentSiteSettings.useGlobalPosition) {
            currentSiteSettings.position = siteInfo.defaultButtonPosition;
            savePerSiteSettings();
            updateButtonPosition();
        }
    }

    /**
     * Force styles on elements matching a selector
     * @param {string} selector - CSS selector
     * @param {Object} styles - Styles to apply
     */
    function forceElementStyles(selector, styles) {
        try {
            // Use faster methods first
            if (selector.startsWith('#') && !selector.includes(' ')) { // ID selector
                const element = document.getElementById(selector.substring(1));
                if (element) applyStylesToElement(element, styles);
                return;
            }
            if (selector.startsWith('.') && !selector.includes(' ')) { // Class selector
                const elements = document.getElementsByClassName(selector.substring(1));
                Array.from(elements).forEach(el => applyStylesToElement(el, styles));
                return;
            }

            // Fallback to querySelectorAll
            const elements = Array.from(document.querySelectorAll(selector));
            // Also try to find elements in shadow DOM if enabled
            if (settings.dynamicSelectors?.detectShadowDOM) {
                shadowRoots.forEach(root => {
                    try {
                        elements.push(...Array.from(root.querySelectorAll(selector)));
                    } catch (error) {
                        log('debug', `Error querying shadow DOM: ${error.message}`, { selector, root });
                    }
                });
            }
            elements.forEach(element => applyStylesToElement(element, styles));
        } catch (error) {
            log('error', `Error forcing element styles: ${error.message}`, { selector, styles });
        }
    }

    /**
     * Apply styles to a specific element (extracted for reuse)
     * @param {Element} element - Element to style
     * @param {Object} styles - Styles to apply
     */
    function applyStylesToElement(element, styles) {
        // Store original inline styles only once
        if (!originalStyles.has(element)) {
            originalStyles.set(element, element.getAttribute('style') || '');
        }
        // Apply forced styles by appending (respecting !important)
        let styleString = '';
        for (const [property, value] of Object.entries(styles)) {
            // Convert camelCase to kebab-case for CSS properties
            const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
            styleString += `${cssProperty}: ${value}; `;
        }
        // Append styles to existing inline styles
        element.style.cssText += styleString;
        forcedElementsCount++;
    }

    /**
     * Inject custom CSS to the page
     * @param {string} css - CSS to inject
     * @param {string} id - Identifier for the style element
     */
    function injectCustomCSS(css, id) {
        removeCustomCSS(id); // Remove existing style with same ID first
        try {
            const style = document.createElement('style');
            style.id = id;
            style.innerHTML = css;
            // Append to head or documentElement if head is not available yet
            (document.head || document.documentElement).appendChild(style);
            customStyleElements.push(style); // Track injected style
            log('debug', `Injected custom CSS with ID: ${id}`, { length: css.length });
        } catch (error) {
            log('error', `Error injecting custom CSS: ${error.message}`, { id });
        }
    }

    /**
     * Remove custom CSS by ID
     * @param {string} id - Identifier for the style element
     */
    function removeCustomCSS(id) {
        const existingStyle = document.getElementById(id);
        if (existingStyle) {
            existingStyle.remove();
            // Remove from tracking array
            customStyleElements = customStyleElements.filter(el => el.id !== id);
            log('debug', `Removed custom CSS with ID: ${id}`);
        }
    }

    /**
     * Collect website information for diagnostics
     */
    function collectSiteInfo() {
        if (!settings.diagnostics?.enabled) return;
        try {
            diagnosticsData.siteInfo = {
                url: window.location.href,
                domain: getCurrentSiteIdentifier(),
                title: document.title,
                theme: detectSiteThemeSettings(),
                shadowDOMCount: shadowRoots.size,
                iframeCount: document.querySelectorAll('iframe').length,
                customStylesCount: customStyleElements.length,
                forcedElementsCount: forcedElementsCount,
                problematicSite: !!getProblematicSiteInfo(),
                screenWidth: window.innerWidth,
                screenHeight: window.innerHeight,
                deviceInfo: deviceInfo
            };
        } catch (error) {
            log('error', `Error collecting site info: ${error.message}`);
        }
    }

    /**
     * Detect if site already has theme settings
     * @return {Object} Theme information
     */
    function detectSiteThemeSettings() {
        const result = {
            hasDarkMode: false,
            hasDarkModeToggle: false,
            mediaQueryPrefers: window.matchMedia('(prefers-color-scheme: dark)').matches,
            darkModeClasses: false
        };
        const html = document.documentElement;
        const body = document.body;
        // Check for common theme classes/attributes on html or body
        if (html) {
            const classList = html.classList;
            if (classList.contains('dark') || classList.contains('darkmode') || classList.contains('dark-mode') ||
                html.getAttribute('data-theme') === 'dark' || html.getAttribute('theme') === 'dark') {
                result.hasDarkMode = result.darkModeClasses = true;
            }
        }
        if (body && !result.hasDarkMode) { // Only check body if html doesn't have it
             const classList = body.classList;
             if (classList.contains('dark') || classList.contains('darkmode') || classList.contains('dark-mode') ||
                 body.getAttribute('data-theme') === 'dark' || body.getAttribute('theme') === 'dark') {
                 result.hasDarkMode = result.darkModeClasses = true;
             }
        }
        // Check for common dark mode toggles using efficient selectors first
        const toggleSelectors = [
            '[aria-label*="dark mode" i]', '[aria-label*="night mode" i]',
            '[title*="dark mode" i]', '[title*="night mode" i]',
            '[data-action*="dark-mode" i]', '[data-action*="night-mode" i]',
            '[class*="darkModeToggle" i]', '[id*="dark-mode" i]', '[id*="darkmode" i]',
            // ':has' might not be supported everywhere, use cautiously or provide fallback
            // 'button:has(svg[aria-label*="dark" i])',
            'svg[aria-label*="dark" i]'
        ];
        try {
            // Use querySelector for efficiency - stops at the first match
            if (document.querySelector(toggleSelectors.join(','))) {
                result.hasDarkModeToggle = true;
            }
        } catch (e) {
            // Ignore potential CSS selector errors (e.g., :has)
            log('debug', 'Error checking for dark mode toggle selectors', e);
        }
        return result;
    }

    /**
     * Generate a diagnostic report
     * @return {Object} Diagnostic report object
     */
    function generateDiagnosticReport() {
        collectSiteInfo(); // Ensure latest info
        const report = {
            timestamp: new Date().toISOString(),
            version: '3.2.0', // Update version
            settings: { ...settings }, // Include current settings
            siteInfo: diagnosticsData.siteInfo,
            issues: diagnosticsData.issues,
            performance: diagnosticsData.performance,
            currentState: {
                darkModeEnabled,
                extremeModeActive,
                forcedElementsCount,
                customStylesCount: customStyleElements.length,
                shadowRootsCount: shadowRoots.size,
                deviceInfo: deviceInfo,
                performanceMode: performanceMode,
                currentSiteSettings: currentSiteSettings
            }
        };
        // Clean up sensitive information if needed (e.g., keyboard shortcuts)
        delete report.settings.keyboardShortcut;
        return report;
    }

    /**
     * Show diagnostic report in UI
     */
    function showDiagnosticReport() {
        const report = generateDiagnosticReport();
        const reportString = JSON.stringify(report, null, 2);
        // Create a modal to display the report
        const modalContainerId = 'darkModeToggleDiagnostics';
        let modalContainer = document.getElementById(modalContainerId);
        if (modalContainer) modalContainer.remove(); // Remove old one if exists

        modalContainer = document.createElement('div');
        modalContainer.id = modalContainerId;
        modalContainer.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background-color: rgba(0, 0, 0, 0.7); z-index: 2147483647; /* Max z-index */
            display: flex; align-items: center; justify-content: center; padding: 15px;
        `;
        const modal = document.createElement('div');
        modal.style.cssText = `
            background-color: #fff; padding: 20px; border-radius: 8px;
            max-width: 90%; max-height: 90%; overflow: auto; color: #333;
            font-family: monospace; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        `;
        const heading = document.createElement('h2');
        heading.textContent = 'Dark Mode Toggle Diagnostic Report';
        heading.style.marginTop = '0';
        const reportPre = document.createElement('pre');
        reportPre.textContent = reportString;
        reportPre.style.cssText = `
            background-color: #f5f5f5; padding: 10px; border-radius: 4px;
            white-space: pre-wrap; font-size: ${deviceInfo.type === 'mobile' ? '10px' : '12px'};
            max-height: 60vh; /* Limit height */ overflow: auto;
        `;
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `display: flex; justify-content: flex-end; margin-top: 20px; gap: 10px;`;

        const copyButton = createButton('copyDiagnosticsButton', 'Copy to Clipboard', () => {
            navigator.clipboard.writeText(reportString)
                .then(() => { copyButton.textContent = 'Copied!'; setTimeout(() => { copyButton.textContent = 'Copy to Clipboard'; }, 2000); })
                .catch(err => { log('error', `Failed to copy to clipboard: ${err.message}`); copyButton.textContent = 'Copy Failed'; });
        });
        copyButton.style.cssText = `padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;`;

        const closeButton = createButton('closeDiagnosticsButton', 'Close', () => modalContainer.remove());
        closeButton.style.cssText = `padding: 8px 16px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;`;

        buttonContainer.appendChild(copyButton);
        buttonContainer.appendChild(closeButton);
        modal.appendChild(heading);
        modal.appendChild(reportPre);
        modal.appendChild(buttonContainer);
        modalContainer.appendChild(modal);
        document.body.appendChild(modalContainer);
    }

    /**
     * Find and monitor shadow DOM elements
     * @param {Node} [root=document.documentElement] - Root node to start scanning from
     */
    function findShadowRoots(root = document.documentElement) {
        if (!settings.dynamicSelectors?.detectShadowDOM) return;

        // Use a more efficient approach based on device performance
        // Query only common custom element tags or elements likely to host shadow DOM
        const selector = performanceMode === DEVICE_PERFORMANCE.LOW
            ? 'main, header, nav, footer, aside, [role="main"]' // Limit scope in low performance
            : '*'; // Scan more broadly otherwise

        try {
            const elements = root.querySelectorAll(selector);
            checkElementsForShadowRoot(elements);
        } catch(e) {
            // Ignore errors querying within shadow DOM, which can happen due to security restrictions
            if (root !== document.documentElement) {
                 log('debug', `Error querying inside Shadow Root: ${e.message}`, root);
            } else {
                 log('warn', `Error querying DOM: ${e.message}`, root);
            }
        }
    }

    /**
     * Check elements for shadow roots (extracted for reuse)
     * @param {NodeList} elements - Elements to check
     */
    function checkElementsForShadowRoot(elements) {
        for (const element of elements) {
            // Check if the element has a shadow root and we haven't tracked it yet
            if (element.shadowRoot && !shadowRoots.has(element.shadowRoot)) {
                shadowRoots.add(element.shadowRoot);
                log('debug', 'Found shadow root:', element);
                // Apply extreme mode styles to the new shadow DOM if active
                if (extremeModeActive) applyShadowDomExtremeDark(element.shadowRoot);
                // Recursively scan inside the new shadow root
                findShadowRoots(element.shadowRoot);
                // Set up mutation observer for changes within the shadow DOM
                observeShadowDom(element.shadowRoot);
            }
            // Recursively check child elements only in high performance mode to save resources
            if (performanceMode === DEVICE_PERFORMANCE.HIGH && element.children?.length > 0) {
                 checkElementsForShadowRoot(element.children);
            }
        }
    }

    /**
     * Observe shadow DOM for changes
     * @param {ShadowRoot} shadowRoot - Shadow root to observe
     */
    function observeShadowDom(shadowRoot) {
        if (!shadowRoot) return;
        try {
            const observer = new MutationObserver(mutations => {
                // Use performance-based throttling for processing changes
                const processChanges = adaptiveProcessing(() => {
                    for (const mutation of mutations) {
                        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                            for (const node of mutation.addedNodes) {
                                if (node.nodeType === Node.ELEMENT_NODE) {
                                    findShadowRoots(node); // Check for nested shadow roots
                                    if (extremeModeActive) applyExtremeDarkToElement(node); // Apply styles if needed
                                }
                            }
                        }
                    }
                }, 'throttle', {
                    [DEVICE_PERFORMANCE.HIGH]: 300,
                    [DEVICE_PERFORMANCE.MEDIUM]: 700,
                    [DEVICE_PERFORMANCE.LOW]: 1500
                });
                processChanges();
            });
            observer.observe(shadowRoot, { childList: true, subtree: true });
        } catch (error) {
            log('error', `Error observing shadow DOM: ${error.message}`, shadowRoot);
        }
    }

    /**
     * Apply extreme dark mode styles to shadow DOM
     * @param {ShadowRoot} shadowRoot - Shadow root to process
     */
    function applyShadowDomExtremeDark(shadowRoot) {
        if (!shadowRoot) return;
        try {
            // Inject base extreme styles into shadow DOM
            const styleId = `extreme-shadow-${shadowRoot.host.tagName || 'unknown'}`;
            const extremeShadowCss = `
                * {
                    background-color: #1a1a1a !important;
                    color: #ddd !important;
                    border-color: #444 !important;
                }
                a, a:visited { color: #3a8ee6 !important; }
                input, textarea, select, button {
                    background-color: #2d2d2d !important;
                    color: #ddd !important;
                    border: 1px solid #555 !important;
                }
            `;
            // Use injectCustomCSS to handle potential existing styles and tracking
            injectCustomCSS(extremeShadowCss, styleId);
            log('debug', 'Applied extreme dark mode to shadow DOM', shadowRoot);
        } catch (error) {
            log('error', `Error applying extreme dark to shadow DOM: ${error.message}`, shadowRoot);
        }
    }

    /**
     * Apply extreme dark mode to a specific element and its children
     * @param {Element} element - Element to process
     */
    function applyExtremeDarkToElement(element) {
        if (!element || element.nodeType !== Node.ELEMENT_NODE || element.tagName === 'STYLE' || element.tagName === 'SCRIPT') return;

        try {
            // Store original styles if not already stored
            if (!originalStyles.has(element)) {
                originalStyles.set(element, element.getAttribute('style') || '');
            }
            // Apply basic dark styles - avoid overly broad selectors here
            let currentStyle = element.getAttribute('style') || '';
            let newStyle = `background-color: #1a1a1a !important; color: #ddd !important; border-color: #444 !important;`;
            // Append new styles, respecting existing ones
            element.style.cssText += newStyle;

            forcedElementsCount++;

            // Process children recursively, but limit depth or frequency based on performance
            if (element.children && element.children.length > 0) {
                // Limit recursion depth in low performance mode
                if (performanceMode === DEVICE_PERFORMANCE.LOW && element.children.length > 10) {
                     // Only process direct children in low mode if many exist
                     // Or maybe process only specific tags?
                     // For now, let's just skip deep recursion in low mode
                } else {
                    Array.from(element.children).forEach(child => {
                        // Add a small delay or use requestAnimationFrame for very large trees?
                        // For simplicity, direct recursion for now.
                        applyExtremeDarkToElement(child);
                    });
                }
            }
        } catch (error) {
            log('error', `Error applying extreme dark to element: ${error.message}`, element);
        }
    }

    /**
     * Perform a deep scan of the document to apply extreme dark mode
     */
    function performDeepScan() {
        if (!settings.dynamicSelectors?.deepScan || !extremeModeActive) return;
        log('info', 'Performing deep scan for extreme dark mode');
        forcedElementsCount = 0; // Reset count for this scan

        try {
            // Adapt scan scope based on performance mode
            const selector = performanceMode === DEVICE_PERFORMANCE.LOW
                ? 'main, article, section, [role="main"], header, nav, footer' // Limited scope
                : performanceMode === DEVICE_PERFORMANCE.MEDIUM
                    ? 'main *, article *, section *, [role="main"] *, header *, nav *, footer *' // Moderate scope
                    : 'body *'; // Full scope (use with caution)

            const elements = document.querySelectorAll(selector);
            deepScanElements(elements);

            // Process shadow DOMs if not in low performance mode
            if (performanceMode !== DEVICE_PERFORMANCE.LOW) {
                shadowRoots.forEach(root => {
                    try {
                        const shadowElements = root.querySelectorAll('*');
                        deepScanElements(shadowElements);
                    } catch (error) {
                        log('debug', `Error processing shadow DOM elements during deep scan: ${error.message}`, root);
                    }
                });
            }
            log('info', `Deep scan completed, processed approx ${forcedElementsCount} elements`);
        } catch (error) {
            log('error', `Error during deep scan: ${error.message}`);
        }
    }

    /**
     * Process elements for deep scan (extracted for reuse)
     * @param {NodeList} elements - Elements to process
     */
    function deepScanElements(elements) {
        for (const element of elements) {
            // Skip elements that are typically not styled or problematic
            if (!element || element.nodeType !== Node.ELEMENT_NODE || ['SCRIPT', 'STYLE', 'META', 'LINK', 'HEAD'].includes(element.tagName)) {
                continue;
            }
            try {
                const computedStyle = window.getComputedStyle(element);
                const backgroundColor = computedStyle.backgroundColor;
                const color = computedStyle.color;

                // Check if element has light background and dark text (heuristic)
                if (isLightColor(backgroundColor) && isDarkColor(color)) {
                    if (!originalStyles.has(element)) {
                        originalStyles.set(element, element.getAttribute('style') || '');
                    }
                    // Force dark background and light text
                    element.style.setProperty('background-color', '#1a1a1a', 'important');
                    element.style.setProperty('color', '#ddd', 'important');
                    forcedElementsCount++;
                }

                // Handle potentially problematic fixed/sticky elements with light backgrounds
                if ((computedStyle.position === 'fixed' || computedStyle.position === 'sticky') && isLightColor(backgroundColor)) {
                     if (!originalStyles.has(element)) {
                         originalStyles.set(element, element.getAttribute('style') || '');
                     }
                     element.style.setProperty('background-color', '#1a1a1a', 'important');
                     forcedElementsCount++;
                }
            } catch (error) {
                // Ignore errors for individual elements (e.g., accessing styles of detached nodes)
                log('debug', `Error processing element during deep scan: ${error.message}`, element);
                continue;
            }
        }
    }

    /**
     * Check if a color is light (heuristic based on luminance)
     * @param {string} color - CSS color value (rgb, rgba, hex)
     * @return {boolean} Whether color is likely light
     */
    function isLightColor(color) {
        let r, g, b, a;
        try {
            if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return false;

            if (color.startsWith('rgb')) {
                const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
                if (!match) return false; // Invalid format
                [, r, g, b, a] = match.map(Number);
                if (a === 0) return false; // Transparent
            } else if (color.startsWith('#')) {
                let hex = color.substring(1);
                if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
                if (hex.length !== 6) return false; // Invalid format
                r = parseInt(hex.substring(0, 2), 16);
                g = parseInt(hex.substring(2, 4), 16);
                b = parseInt(hex.substring(4, 6), 16);
            } else {
                // Cannot reliably determine lightness for named colors or other formats without a lookup table
                return false;
            }
            // Calculate luminance using standard formula
            const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
            // Threshold for lightness (adjust as needed)
            return luminance > 0.55;
        } catch (e) {
            log('debug', `Error parsing color: ${color}`, e);
            return false; // Assume not light on error
        }
    }

    /**
     * Check if a color is dark (heuristic based on luminance)
     * @param {string} color - CSS color value
     * @return {boolean} Whether color is likely dark
     */
    function isDarkColor(color) {
         // A color is dark if it's not transparent and not light
         if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return false;
         return !isLightColor(color);
    }

    /**
     * Detect device type and capabilities
     */
    function detectDevice() {
        deviceInfo.screenSize = { width: window.screen.width, height: window.screen.height };
        deviceInfo.pixelRatio = window.devicePixelRatio || 1;
        deviceInfo.touchCapable = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isSmallScreen = window.innerWidth < 768;
        deviceInfo.type = (isMobileUA || isSmallScreen) ? 'mobile' : 'desktop';
        deviceInfo.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Battery status (if API available)
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                deviceInfo.batteryLevel = battery.level;
                deviceInfo.isLowPowerMode = battery.level < 0.2 && !battery.charging;
                updatePerformanceMode(); // Update mode based on battery
            }).catch(e => log('debug', 'Battery Status API not available or error.', e));
        }

        // Performance detection (heuristic)
        try {
            let perfLevel = DEVICE_PERFORMANCE.HIGH; // Default assumption
            if ('deviceMemory' in navigator && navigator.deviceMemory) {
                const memory = navigator.deviceMemory;
                if (memory <= 2) perfLevel = DEVICE_PERFORMANCE.LOW;
                else if (memory <= 4) perfLevel = DEVICE_PERFORMANCE.MEDIUM;
            } else if (deviceInfo.type === 'mobile') {
                perfLevel = (deviceInfo.pixelRatio >= 3) ? DEVICE_PERFORMANCE.MEDIUM : DEVICE_PERFORMANCE.LOW;
            }

            // Simple benchmark test (adjust threshold as needed)
            const startTime = performance.now();
            for (let i = 0; i < 500000; i++) { Math.sqrt(i); } // Reduced iterations
            const testDuration = performance.now() - startTime;

            if (testDuration > 100) perfLevel = DEVICE_PERFORMANCE.LOW; // Downgrade if slow
            else if (testDuration > 40 && perfLevel === DEVICE_PERFORMANCE.HIGH) perfLevel = DEVICE_PERFORMANCE.MEDIUM;

            deviceInfo.performance = perfLevel;
        } catch (error) {
            log('warn', 'Error detecting device performance', error);
            deviceInfo.performance = DEVICE_PERFORMANCE.MEDIUM; // Fallback
        }
        updatePerformanceMode(); // Set initial performance mode
        log('info', 'Device detected', deviceInfo);
    }

    /**
     * Update performance mode based on device info and settings
     */
    function updatePerformanceMode() {
        let mode = deviceInfo.performance; // Start with detected level
        // Apply user overrides from settings
        if (settings.deviceOptimization?.enabled) {
            if (settings.deviceOptimization.lowPowerMode || deviceInfo.isLowPowerMode) {
                mode = mode === DEVICE_PERFORMANCE.HIGH ? DEVICE_PERFORMANCE.MEDIUM : DEVICE_PERFORMANCE.LOW;
            }
            if (settings.deviceOptimization.reducedMotion || deviceInfo.prefersReducedMotion) {
                if (mode === DEVICE_PERFORMANCE.HIGH) mode = DEVICE_PERFORMANCE.MEDIUM;
            }
        }
        performanceMode = mode;

        // Adjust behavior based on the final performance mode
        log('info', `Performance mode set to: ${performanceMode}`);
        // Example adjustment: Modify scan interval based on mode
        if (settings.dynamicSelectors) {
            const baseInterval = settings.dynamicSelectors.scanInterval || DEFAULT_SETTINGS.dynamicSelectors.scanInterval;
            if (performanceMode === DEVICE_PERFORMANCE.LOW) {
                settings.dynamicSelectors.scanInterval = Math.max(baseInterval, 4000); // Longer interval
                settings.dynamicSelectors.deepScan = false; // Disable deep scan
            } else if (performanceMode === DEVICE_PERFORMANCE.MEDIUM) {
                settings.dynamicSelectors.scanInterval = Math.max(baseInterval, 2500);
            } else {
                 settings.dynamicSelectors.scanInterval = baseInterval; // Use configured/default
                 settings.dynamicSelectors.deepScan = DEFAULT_SETTINGS.dynamicSelectors.deepScan; // Re-enable if disabled
            }
        }
        // Adjust UI for touch devices
        if (deviceInfo.touchCapable) {
            const touchSize = Math.max(44, Math.min(50, Math.floor(window.innerWidth * 0.12))); // Min 44px for touch target
            settings.buttonSize = { width: touchSize * 1.8, height: touchSize };
            settings.offsetX = Math.max(20, Math.floor(window.innerWidth * 0.04));
            settings.offsetY = Math.max(20, Math.floor(window.innerHeight * 0.04));
        } else {
             // Restore default non-touch size if needed
             settings.buttonSize = DEFAULT_SETTINGS.buttonSize;
        }
        // Restart dynamic scanning with new interval if it's running
        if (dynamicScanInterval) {
            setupDynamicScanning();
        }
    }

    /**
     * Clean up tracked event listeners
     * Call this during reset or when UI is destroyed
     */
    function cleanupEventListeners() {
        log('debug', `Cleaning up ${eventListeners.length} event listeners.`);
        eventListeners.forEach(({ element, type, handler }) => {
            try {
                element.removeEventListener(type, handler);
            } catch (e) {
                // Ignore errors for elements that might no longer exist
            }
        });
        eventListeners = []; // Clear the tracking array
    }


    /**
     * ------------------------
     * STORAGE MANAGEMENT
     * ------------------------
     */

    /**
     * Load per-site settings from storage
     * @return {Promise<void>}
     */
    async function loadPerSiteSettings() {
        const siteKey = STORAGE_KEYS.PER_SITE_SETTINGS_PREFIX + getCurrentSiteIdentifier();
        try {
            const storedSettings = await GM.getValue(siteKey, null);
            if (storedSettings) {
                currentSiteSettings = storedSettings; // Store for reference
                // Apply per-site settings if enabled
                if (settings.perSiteSettings?.enabled) {
                    // Apply position only if not using global position
                    if (!storedSettings.useGlobalPosition && storedSettings.position) {
                        settings.position = storedSettings.position;
                        settings.offsetX = storedSettings.offsetX ?? settings.offsetX;
                        settings.offsetY = storedSettings.offsetY ?? settings.offsetY;
                    }
                    // Apply appearance settings
                    settings.brightness = storedSettings.brightness ?? settings.brightness;
                    settings.contrast = storedSettings.contrast ?? settings.contrast;
                    settings.sepia = storedSettings.sepia ?? settings.sepia;
                    // Apply appearance overrides (greyscale, color filter)
                    if (settings.appearance) {
                         settings.appearance.greyscaleMode = storedSettings.greyscaleMode ?? settings.appearance.greyscaleMode;
                         settings.appearance.colorFilter = storedSettings.colorFilter ?? settings.appearance.colorFilter;
                    }

                    darkModeEnabled = storedSettings.darkModeEnabled ?? false;
                    if (settings.extremeMode) {
                        settings.extremeMode.enabled = storedSettings.extremeModeEnabled ?? settings.extremeMode.enabled;
                    }
                }
                // Load custom CSS for this site
                const customCssKey = STORAGE_KEYS.CUSTOM_CSS_PREFIX + getCurrentSiteIdentifier();
                currentSiteCustomCSS = await GM.getValue(customCssKey, '');
                log('info', `Loaded per-site settings for ${getCurrentSiteIdentifier()}:`, storedSettings);
            } else {
                // Initialize default per-site settings object if none found
                currentSiteSettings = {
                    useGlobalPosition: settings.perSiteSettings?.useGlobalPosition ?? true,
                    position: settings.position,
                    offsetX: settings.offsetX,
                    offsetY: settings.offsetY,
                    brightness: settings.brightness,
                    contrast: settings.contrast,
                    sepia: settings.sepia,
                    greyscaleMode: settings.appearance?.greyscaleMode ?? false,
                    colorFilter: settings.appearance?.colorFilter ?? false,
                    darkModeEnabled: darkModeEnabled,
                    extremeModeEnabled: settings.extremeMode?.enabled ?? false
                };
                log('info', `No per-site settings found for ${getCurrentSiteIdentifier()}. Initialized defaults.`);
            }
        } catch (error) {
            log('error', `Failed to load per-site settings:`, error);
            // Initialize default on error
            currentSiteSettings = { useGlobalPosition: true, /* ... other defaults */ };
        }
    }

    /**
     * Save per-site settings to storage
     * @return {Promise<void>}
     */
    async function savePerSiteSettings() {
        if (!settings.perSiteSettings?.enabled) return; // Only save if per-site is enabled

        if (!currentSiteSettings) { // Ensure object exists
            currentSiteSettings = {};
        }
        // Update currentSiteSettings with the latest values from global settings
        currentSiteSettings.useGlobalPosition = settings.perSiteSettings.useGlobalPosition;
        if (!currentSiteSettings.useGlobalPosition) {
            currentSiteSettings.position = settings.position;
            currentSiteSettings.offsetX = settings.offsetX;
            currentSiteSettings.offsetY = settings.offsetY;
        }
        currentSiteSettings.brightness = settings.brightness;
        currentSiteSettings.contrast = settings.contrast;
        currentSiteSettings.sepia = settings.sepia;
        currentSiteSettings.greyscaleMode = settings.appearance?.greyscaleMode ?? false;
        currentSiteSettings.colorFilter = settings.appearance?.colorFilter ?? false;
        currentSiteSettings.darkModeEnabled = darkModeEnabled;
        currentSiteSettings.extremeModeEnabled = settings.extremeMode?.enabled ?? false;

        const siteKey = STORAGE_KEYS.PER_SITE_SETTINGS_PREFIX + getCurrentSiteIdentifier();
        try {
            await GM.setValue(siteKey, currentSiteSettings);
            // Save custom CSS separately
            const customCssKey = STORAGE_KEYS.CUSTOM_CSS_PREFIX + getCurrentSiteIdentifier();
            if (currentSiteCustomCSS) {
                await GM.setValue(customCssKey, currentSiteCustomCSS);
            } else {
                // Remove the key if CSS is empty to save space
                await GM.deleteValue(customCssKey);
            }
            log('info', `Saved per-site settings for ${getCurrentSiteIdentifier()}:`, currentSiteSettings);
        } catch (error) {
            log('error', `Failed to save per-site settings:`, error);
        }
    }

    /**
     * Load global settings from storage
     * @return {Promise<void>}
     */
    async function loadSettings() {
        try {
            const storedSettings = await GM.getValue(STORAGE_KEYS.SETTINGS, null);
            // Deep merge stored settings with defaults to ensure all keys exist
            settings = mergeDeep({ ...DEFAULT_SETTINGS }, storedSettings || {});

            // Ensure critical structures are correct type after merge
            if (!Array.isArray(settings.exclusionList)) settings.exclusionList = [];
            if (typeof settings.scheduledDarkMode !== 'object' || settings.scheduledDarkMode === null) settings.scheduledDarkMode = { ...DEFAULT_SETTINGS.scheduledDarkMode };
            if (typeof settings.keyboardShortcut !== 'object' || settings.keyboardShortcut === null) settings.keyboardShortcut = { ...DEFAULT_SETTINGS.keyboardShortcut };
            // ... ensure other nested objects like extremeMode, dynamicSelectors, etc.

            // Load device info if available
            const storedDeviceInfo = await GM.getValue(STORAGE_KEYS.DEVICE_INFO, null);
            if (storedDeviceInfo) deviceInfo = { ...deviceInfo, ...storedDeviceInfo };

            updateButtonPosition(); // Update button based on loaded global settings initially
            log('info', 'Global settings loaded successfully');
        } catch (error) {
            log('error', 'Failed to load global settings:', error);
            settings = { ...DEFAULT_SETTINGS }; // Fallback to defaults
            log('warn', 'Using default settings due to load failure.');
        }
    }

    /**
     * Simple deep merge function for settings objects
     * @param {Object} target - The target object
     * @param {Object} source - The source object
     * @return {Object} Merged object
     */
    function mergeDeep(target, source) {
        for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                const targetValue = target[key];
                const sourceValue = source[key];
                if (typeof sourceValue === 'object' && sourceValue !== null && !Array.isArray(sourceValue) &&
                    typeof targetValue === 'object' && targetValue !== null && !Array.isArray(targetValue)) {
                    // Recursively merge nested objects
                    target[key] = mergeDeep(targetValue, sourceValue);
                } else {
                    // Overwrite or add primitive values and arrays
                    target[key] = sourceValue;
                }
            }
        }
        return target;
    }


    /**
     * Save global settings to storage (debounced for performance)
     */
    const saveSettingsDebounced = debounce(async () => {
        try {
            await GM.setValue(STORAGE_KEYS.SETTINGS, settings);
            await GM.setValue(STORAGE_KEYS.DEVICE_INFO, deviceInfo); // Save detected device info

            // Update UI/behavior based on saved settings
            updateButtonPosition();
            updateDarkReaderConfig(); // Apply changes to DarkReader
            applyAdditionalFilters(); // Apply greyscale/color filters
            updateExclusionListDisplay();
            setupScheduleChecking(); // Restart schedule check if settings changed
            setupDynamicScanning(); // Restart dynamic scan if settings changed

            log('debug', 'Global settings saved successfully');
        } catch (error) {
            log('error', 'Failed to save global settings:', error);
        }
    }, 300); // Debounce saving by 300ms

    /**
     * Save all settings (global and per-site)
     */
    function saveSettings() {
        saveSettingsDebounced(); // Save global settings (debounced)
        savePerSiteSettings(); // Save per-site settings immediately
    }

    /**
     * Reset all settings to defaults with confirmation
     * @return {Promise<void>}
     */
    async function resetSettings() {
        if (confirm('Are you sure you want to reset ALL settings to default? This includes global and all per-site settings.')) {
            try {
                // Clear all tracked listeners first
                cleanupEventListeners();

                // Find and delete all per-site settings and custom CSS keys
                const allKeys = await GM.listValues ? await GM.listValues() : [];
                const deletePromises = [];
                if (Array.isArray(allKeys)) {
                    allKeys.forEach(key => {
                        if (key.startsWith(STORAGE_KEYS.PER_SITE_SETTINGS_PREFIX) ||
                            key.startsWith(STORAGE_KEYS.CUSTOM_CSS_PREFIX)) {
                            deletePromises.push(GM.deleteValue(key));
                        }
                    });
                }
                // Delete global settings and dark mode state
                deletePromises.push(GM.deleteValue(STORAGE_KEYS.SETTINGS));
                deletePromises.push(GM.deleteValue(STORAGE_KEYS.DARK_MODE));
                deletePromises.push(GM.deleteValue(STORAGE_KEYS.DEVICE_INFO));

                await Promise.all(deletePromises); // Wait for all deletions

                // Reset global state variables
                settings = { ...DEFAULT_SETTINGS };
                darkModeEnabled = false;
                currentSiteCustomCSS = '';
                currentSiteSettings = null; // Reset current site settings object
                originalStyles.clear(); // Clear stored original styles
                forcedElementsCount = 0;

                // Remove any injected custom CSS elements
                customStyleElements.forEach(style => style.remove());
                customStyleElements = [];

                // Re-initialize default per-site settings for the current site
                await loadPerSiteSettings(); // This will create default currentSiteSettings

                // Update UI immediately
                updateButtonPosition();
                updateDarkReaderConfig(); // Disables DarkReader
                applyAdditionalFilters(); // Removes filters
                updateUIValues(); // Update settings panel values
                updateButtonState(); // Update toggle button appearance
                updateExclusionListDisplay();
                toggleDarkMode(false); // Ensure dark mode is visually off

                // Restart intervals
                setupScheduleChecking();
                setupDynamicScanning();

                alert('All settings have been reset to defaults.');

            } catch (error) {
                log('error', "Error during settings reset:", error);
                alert("An error occurred during settings reset. Please check the console.");
            }
        }
    }

    /**
     * Export settings to a JSON file
     */
    async function exportSettings() {
        try {
            // Collect all relevant data
            const perSiteSettings = {};
            const customCssSettings = {};
            const allKeys = await GM.listValues ? await GM.listValues() : [];

            if (Array.isArray(allKeys)) {
                for (const key of allKeys) {
                    if (key.startsWith(STORAGE_KEYS.PER_SITE_SETTINGS_PREFIX)) {
                        perSiteSettings[key] = await GM.getValue(key);
                    } else if (key.startsWith(STORAGE_KEYS.CUSTOM_CSS_PREFIX)) {
                        customCssSettings[key] = await GM.getValue(key);
                    }
                }
            }

            const exportData = {
                version: '3.2.0', // Include version for compatibility checks
                global: settings,
                perSite: perSiteSettings,
                customCss: customCssSettings,
                darkModeEnabled: darkModeEnabled, // Export current state
                deviceInfo: deviceInfo // Export detected device info
            };

            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'dark-mode-toggle-settings.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 100); // Clean up blob URL

        } catch (error) {
            log('error', 'Failed to export settings:', error);
            alert('Failed to export settings. See console for details.');
        }
    }

    /**
     * Import settings from a JSON file
     * @param {File} file - The settings file to import
     */
    async function importSettings(file) {
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const importData = JSON.parse(e.target.result);
                    // Basic validation
                    if (!importData.global || !importData.version) {
                        throw new Error('Invalid settings file format or missing version.');
                    }
                    // Optional: Add version check here if needed
                    log('info', `Importing settings from version ${importData.version}`);

                    // Import global settings (merge with defaults for safety)
                    settings = mergeDeep({ ...DEFAULT_SETTINGS }, importData.global);
                    await GM.setValue(STORAGE_KEYS.SETTINGS, settings);

                    // Import device info if present
                    if (importData.deviceInfo) {
                        deviceInfo = { ...deviceInfo, ...importData.deviceInfo };
                        await GM.setValue(STORAGE_KEYS.DEVICE_INFO, deviceInfo);
                    }

                    // Import dark mode state
                    darkModeEnabled = importData.darkModeEnabled ?? false;
                    await GM.setValue(STORAGE_KEYS.DARK_MODE, darkModeEnabled);

                    // Import per-site settings
                    if (importData.perSite) {
                        for (const [key, value] of Object.entries(importData.perSite)) {
                             // Ensure key format is correct before saving
                             if (key.startsWith(STORAGE_KEYS.PER_SITE_SETTINGS_PREFIX)) {
                                 await GM.setValue(key, value);
                             }
                        }
                    }
                    // Import custom CSS settings
                    if (importData.customCss) {
                        for (const [key, value] of Object.entries(importData.customCss)) {
                             if (key.startsWith(STORAGE_KEYS.CUSTOM_CSS_PREFIX)) {
                                 await GM.setValue(key, value);
                             }
                        }
                    }

                    // Reload current site settings and CSS from imported data
                    await loadPerSiteSettings();

                    // Update UI and apply settings
                    updateButtonPosition();
                    updateDarkReaderConfig();
                    applyAdditionalFilters();
                    updateUIValues();
                    updateButtonState();
                    updateExclusionListDisplay();
                    setupScheduleChecking();
                    setupDynamicScanning();
                    toggleDarkMode(darkModeEnabled); // Re-apply dark mode state

                    alert('Settings imported successfully!');

                } catch (parseError) {
                    log('error', 'Failed to parse settings file:', parseError);
                    alert(`Failed to import settings: ${parseError.message}`);
                }
            };
            reader.readAsText(file);
        } catch (error) {
            log('error', 'Failed to import settings:', error);
            alert('Failed to import settings. See console for details.');
        }
    }

    /**
     * ------------------------
     * DARK MODE FUNCTIONALITY
     * ------------------------
     */

    /**
     * Toggle dark mode state and update the UI
     * @param {boolean} [force] - Force specific dark mode state
     * @return {Promise<void>}
     */
    async function toggleDarkMode(force) {
        const newState = force !== undefined ? force : !darkModeEnabled;
        if (newState === darkModeEnabled) return; // No change needed

        darkModeEnabled = newState;
        log('info', `Toggling dark mode ${darkModeEnabled ? 'ON' : 'OFF'}`);

        if (darkModeEnabled) {
            if (isSiteExcluded(window.location.href)) {
                log('info', 'Site is excluded, disabling dark mode.');
                darkModeEnabled = false; // Revert state
                DarkReader.disable();
                removeExtremeMode(); // Ensure extreme mode is off
                applyAdditionalFilters(); // Remove filters
                await GM.setValue(STORAGE_KEYS.DARK_MODE, false);
            } else {
                extremeModeActive = settings.extremeMode?.enabled ?? false;
                updateDarkReaderConfig(); // Apply DarkReader first
                applyAdditionalFilters(); // Apply greyscale/color filters
                if (extremeModeActive) applyExtremeMode(); // Apply extreme mode on top
                applyProblematicSiteFixes(); // Apply site-specific fixes
                // Apply custom CSS if it exists and extreme mode OR useCustomCSS is enabled
                if (currentSiteCustomCSS && (extremeModeActive || settings.extremeMode?.useCustomCSS)) {
                    injectCustomCSS(currentSiteCustomCSS, 'custom-site-css');
                }
                await GM.setValue(STORAGE_KEYS.DARK_MODE, true);
                log('info', 'Dark mode enabled' + (extremeModeActive ? ' with extreme mode' : ''));
            }
        } else {
            // Disabling dark mode
            DarkReader.disable();
            removeExtremeMode();
            applyAdditionalFilters(); // Remove filters
            removeCustomCSS('custom-site-css'); // Remove custom site CSS
            removeCustomCSS('problematic-site-fix'); // Remove problematic site fixes
            await GM.setValue(STORAGE_KEYS.DARK_MODE, false);
            log('info', 'Dark mode disabled.');
        }

        updateButtonState(); // Update button appearance
        await savePerSiteSettings(); // Save the new state for this site
    }

    /**
     * Update Dark Reader configuration based on current settings
     */
    function updateDarkReaderConfig() {
        if (darkModeEnabled && !isSiteExcluded(window.location.href)) {
            const config = {
                brightness: settings.brightness,
                contrast: settings.contrast,
                sepia: settings.sepia,
                // DarkReader doesn't directly support greyscale/hue-rotate filters
                // These will be handled by applyAdditionalFilters
                darkSchemeBackgroundColor: '#121212', // Common dark background
                darkSchemeTextColor: '#dddddd', // Common dark text color
            };

            // Apply extreme mode settings to DarkReader if active
            if (settings.extremeMode?.enabled) {
                config.ignoreImageAnalysis = settings.extremeMode.ignoreImageAnalysis;
                // Adjust DarkReader's internal mode for potentially better results in extreme cases
                // Mode 1 (Dynamic) might work better with forced styles
                config.mode = 1;
            } else {
                 config.mode = 0; // Default to Filter mode otherwise
            }

            // Performance optimizations for low-end devices
            if (performanceMode === DEVICE_PERFORMANCE.LOW) {
                config.mode = 0; // Filter mode is generally lighter
                config.styleSystemControls = false; // Don't style system controls
                // config.useFont = false; // Don't change fonts (already default)
                // config.excludedImageAnalysis = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp']; // Skip common images
            }

            DarkReader.enable(config);
        } else {
            DarkReader.disable();
        }
    }

    /**
     * Apply additional CSS filters (Greyscale, Color Filter)
     * These are applied via a separate style tag as DarkReader doesn't handle them directly.
     */
    function applyAdditionalFilters() {
        const filterId = 'dark-mode-additional-filters';
        removeCustomCSS(filterId); // Remove previous filters

        let filters = [];
        if (darkModeEnabled && !isSiteExcluded(window.location.href)) {
            if (settings.appearance?.greyscaleMode) {
                filters.push('grayscale(1)');
            }
            if (settings.appearance?.colorFilter) {
                // Example filter: simple hue rotation
                filters.push('hue-rotate(180deg)');
                // Could add more complex filters here based on settings
            }
        }

        if (filters.length > 0) {
            const filterCss = `html { filter: ${filters.join(' ')} !important; }`;
            injectCustomCSS(filterCss, filterId);
            log('debug', 'Applied additional filters:', filters);
        } else {
             log('debug', 'No additional filters to apply.');
        }
    }


    /**
     * Apply extreme mode styles
     */
    function applyExtremeMode() {
        if (!settings.extremeMode?.enabled) return;
        extremeModeActive = true;
        log('info', 'Applying extreme mode');
        forcedElementsCount = 0; // Reset count
        originalStyles.clear(); // Clear previous original styles

        // Inject global CSS overrides for extreme mode
        const extremeCss = `
            /* Global overrides */
            html, body, * {
                background-color: #121212 !important;
                color: #e0e0e0 !important;
                border-color: #555 !important;
                box-shadow: none !important; /* Remove shadows which might have light colors */
            }
            /* Reset specific elements that might resist */
            main, section, article, header, footer, nav, aside, div {
                 background-color: #121212 !important;
                 color: #e0e0e0 !important;
            }
            /* Links */
            a, a *, a:visited, a:visited * { color: #64b5f6 !important; }
            /* Inputs and buttons */
            input, textarea, select, button, [role="button"] {
                background-color: #333 !important;
                color: #e0e0e0 !important;
                border: 1px solid #666 !important;
            }
            /* Images - maybe slightly dim them? */
            img, svg, video { opacity: 0.85 !important; }
        `;
        injectCustomCSS(extremeCss, 'extreme-mode-css');

        // If forced element styling is enabled, perform a targeted scan
        if (settings.extremeMode.forceDarkElements) {
            // Force styles on key elements immediately
            forceElementStyles('body', { backgroundColor: '#121212 !important', color: '#e0e0e0 !important' });
            forceElementStyles('main, article, section, [role="main"]', { backgroundColor: '#1a1a1a !important' });
            // Find and apply to shadow DOMs discovered so far
            shadowRoots.forEach(applyShadowDomExtremeDark);
            // Perform a deep scan if enabled and performance allows
            if (settings.dynamicSelectors?.deepScan && performanceMode !== DEVICE_PERFORMANCE.LOW) {
                performDeepScan();
            }
        }
    }

    /**
     * Remove extreme mode styles and restore originals
     */
    function removeExtremeMode() {
        if (!extremeModeActive) return; // Only run if it was active
        extremeModeActive = false;
        log('info', 'Removing extreme mode');

        // Remove injected extreme mode CSS
        removeCustomCSS('extreme-mode-css');
        // Remove any extreme styles injected into shadow DOMs
        customStyleElements.filter(el => el.id.startsWith('extreme-shadow-')).forEach(el => removeCustomCSS(el.id));

        // Restore original styles stored in the map
        log('debug', `Restoring styles for ${originalStyles.size} elements.`);
        for (const [element, originalStyle] of originalStyles.entries()) {
            try {
                // Check if element still exists in DOM before attempting to set style
                if (document.contains(element)) {
                    element.setAttribute('style', originalStyle || ''); // Restore or remove style attribute
                }
            } catch (e) {
                // Ignore errors for elements that might have been removed from DOM
            }
        }
        originalStyles.clear(); // Clear the map to free memory
        forcedElementsCount = 0;
    }

    /**
     * Check scheduled dark mode and apply if needed
     */
    function checkScheduledDarkMode() {
        if (!settings.scheduledDarkMode?.enabled) return;

        try {
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const [startH, startM] = settings.scheduledDarkMode.startTime.split(':').map(Number);
            const [endH, endM] = settings.scheduledDarkMode.endTime.split(':').map(Number);
            const startTotalMinutes = startH * 60 + startM;
            const endTotalMinutes = endH * 60 + endM;

            let shouldBeDark;
            if (startTotalMinutes <= endTotalMinutes) { // Schedule does not cross midnight (e.g., 08:00 - 18:00)
                shouldBeDark = currentMinutes >= startTotalMinutes && currentMinutes < endTotalMinutes;
            } else { // Schedule crosses midnight (e.g., 20:00 - 07:00)
                shouldBeDark = currentMinutes >= startTotalMinutes || currentMinutes < endTotalMinutes;
            }

            // Only toggle if the state needs to change
            if (shouldBeDark !== darkModeEnabled) {
                log('info', `Scheduled dark mode: Setting to ${shouldBeDark ? 'enabled' : 'disabled'}`);
                toggleDarkMode(shouldBeDark);
            }
        } catch (e) {
            log('error', 'Error checking scheduled dark mode:', e);
            // Disable schedule on error to prevent loops?
            // settings.scheduledDarkMode.enabled = false;
            // saveSettings();
        }
    }

    /**
     * Setup the interval for checking scheduled dark mode
     */
    function setupScheduleChecking() {
        if (scheduleCheckInterval) clearInterval(scheduleCheckInterval);
        scheduleCheckInterval = null;
        if (settings.scheduledDarkMode?.enabled) {
            checkScheduledDarkMode(); // Check immediately
            scheduleCheckInterval = setInterval(checkScheduledDarkMode, 60000); // Check every minute
            log('info', 'Scheduled dark mode checking started.');
        } else {
             log('info', 'Scheduled dark mode checking stopped.');
        }
    }

    /**
     * Setup dynamic scanning interval based on settings and performance
     */
    function setupDynamicScanning() {
        if (dynamicScanInterval) clearInterval(dynamicScanInterval);
        dynamicScanInterval = null;

        if (settings.dynamicSelectors?.enabled) {
            // Get interval from settings, adjusted by performance mode
            const scanInterval = settings.dynamicSelectors.scanInterval; // Already adjusted by updatePerformanceMode
            log('info', `Starting dynamic scanning with interval: ${scanInterval}ms`);

            dynamicScanInterval = setInterval(() => {
                // Find new shadow DOM elements if enabled
                if (settings.dynamicSelectors.detectShadowDOM) {
                    findShadowRoots();
                }
                // If dark mode and extreme mode are active, perform deep scan (throttled)
                if (darkModeEnabled && extremeModeActive && settings.dynamicSelectors.deepScan) {
                    throttledDeepScan();
                }
            }, scanInterval);
        } else {
             log('info', 'Dynamic scanning stopped.');
        }
    }

    // Throttle deep scan to avoid performance issues, especially on complex pages
    const throttledDeepScan = throttle(performDeepScan, 5000); // Limit deep scan to once every 5 seconds max

    /**
     * Apply a theme preset to the current settings
     * @param {string} presetKey - The key of the preset to apply (e.g., 'HIGH_CONTRAST')
     */
    function applyThemePreset(presetKey) {
        const preset = THEME_PRESETS[presetKey];
        if (!preset) return;
        log('info', `Applying theme preset: ${preset.name}`);
        settings.brightness = preset.brightness;
        settings.contrast = preset.contrast;
        settings.sepia = preset.sepia;
        // Update UI immediately
        updateUIValues();
        // Save settings and re-apply DarkReader config
        saveSettings(); // This will trigger updateDarkReaderConfig via debounced save
        updateDarkReaderConfig(); // Apply immediately for responsiveness
    }

    /**
     * ------------------------
     * UI MANAGEMENT (Refactored)
     * ------------------------
     */

    /**
     * Create the main dark mode toggle button
     */
    function createToggleButton() {
        if (document.getElementById(ELEMENT_IDS.BUTTON)) return; // Already exists
        const button = document.createElement('button');
        button.id = ELEMENT_IDS.BUTTON;
        button.innerHTML = `<span class="icon">${settings.iconMoon}</span>`; // Initial icon
        button.setAttribute('aria-label', 'Toggle Dark Mode');
        button.setAttribute('title', 'Toggle Dark Mode');
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent potential interference
            toggleDarkMode();
        }, { passive: false });
        document.body.appendChild(button);
        updateButtonPosition(); // Set initial position
        updateButtonState(); // Set initial appearance
    }

    /**
     * Update the toggle button position based on settings
     */
    function updateButtonPosition() {
        const button = document.getElementById(ELEMENT_IDS.BUTTON);
        if (!button) return;
        // Use current settings (which might be per-site overrides)
        const { position, offsetX, offsetY } = settings;
        button.style.cssText = ''; // Clear previous inline styles related to position
        button.style.position = 'fixed'; // Ensure it's fixed
        button.style.zIndex = '2147483646'; // High z-index
        switch (position) {
            case 'top-left': button.style.top = `${offsetY}px`; button.style.left = `${offsetX}px`; break;
            case 'top-right': button.style.top = `${offsetY}px`; button.style.right = `${offsetX}px`; break;
            case 'bottom-left': button.style.bottom = `${offsetY}px`; button.style.left = `${offsetX}px`; break;
            case 'bottom-right': default: button.style.bottom = `${offsetY}px`; button.style.right = `${offsetX}px`; break;
        }
        // Apply size from settings
        button.style.width = `${settings.buttonSize.width}px`;
        button.style.height = `${settings.buttonSize.height}px`;
        button.style.borderRadius = `${settings.buttonSize.height / 2}px`; // Keep it pill-shaped
    }

    /**
     * Update the visual state (icon/class) of the toggle button
     */
    function updateButtonState() {
        const button = document.getElementById(ELEMENT_IDS.BUTTON);
        if (!button) return;
        const iconSpan = button.querySelector('.icon');
        if (darkModeEnabled) {
            button.classList.add('dark');
            button.setAttribute('aria-label', 'Disable Dark Mode');
            button.setAttribute('title', 'Disable Dark Mode');
            if (iconSpan) iconSpan.innerHTML = settings.iconSun; // Show sun icon
        } else {
            button.classList.remove('dark');
            button.setAttribute('aria-label', 'Enable Dark Mode');
            button.setAttribute('title', 'Enable Dark Mode');
             if (iconSpan) iconSpan.innerHTML = settings.iconMoon; // Show moon icon
        }
    }

    // --- UI Creation Refactored ---

    /** Create main settings UI container */
    function createUI() {
        if (document.getElementById(ELEMENT_IDS.UI)) return; // Already exists

        const ui = document.createElement('div');
        ui.id = ELEMENT_IDS.UI;
        ui.setAttribute('aria-label', 'Dark Mode Settings');
        ui.style.display = 'none'; // Initially hidden

        // Append sections created by helper functions
        ui.appendChild(createSiteSpecificSection());
        ui.appendChild(createPositionSection());
        ui.appendChild(createDeviceOptimizationSection());
        ui.appendChild(createThemePresetsSection());
        ui.appendChild(createDarkModeSettingsSection());
        ui.appendChild(createAppearanceSection()); // Add new appearance section
        ui.appendChild(createExtremeModeSection());
        ui.appendChild(createAdvancedCompatibilitySection());
        ui.appendChild(createScheduleSection());
        ui.appendChild(createExclusionsSection());
        ui.appendChild(createDiagnosticsSection());
        ui.appendChild(createImportExportSection());
        ui.appendChild(createActionsSection());

        // Version info
        const versionInfo = document.createElement('div');
        versionInfo.className = 'version-info';
        versionInfo.textContent = `Enhanced Dark Mode Toggle v${GM_info.script.version}`; // Use GM_info
        ui.appendChild(versionInfo);

        document.body.appendChild(ui);
        applyUIStyles(); // Apply base styles
        updateUIValues(); // Populate with current settings
    }

    /** Create Site-Specific Settings Section */
    function createSiteSpecificSection() {
        const section = createSettingSection('Site-Specific Settings');
        uiElements.perSiteSettingsToggle = createCheckbox(ELEMENT_IDS.PER_SITE_SETTINGS_TOGGLE, 'Enable Per-Site Settings:', settings.perSiteSettings?.enabled ?? true, (e) => {
            settings.perSiteSettings.enabled = e.target.checked;
            // Toggle visibility of the global position setting based on this
            const globalPosGroup = uiElements.useGlobalPositionToggle?.closest('.form-group');
            if (globalPosGroup) globalPosGroup.style.display = e.target.checked ? 'flex' : 'none';
            saveSettings();
            // Reload per-site settings to apply/remove overrides
            loadPerSiteSettings().then(() => {
                 updateButtonPosition();
                 updateUIValues(); // Reflect potential changes
            });
        });
        uiElements.useGlobalPositionToggle = createCheckbox(ELEMENT_IDS.USE_GLOBAL_POSITION_TOGGLE, 'Use Global Button Position:', currentSiteSettings?.useGlobalPosition ?? true, (e) => {
            if (!currentSiteSettings) currentSiteSettings = {}; // Ensure exists
            currentSiteSettings.useGlobalPosition = e.target.checked;
            if (!e.target.checked) { // If switching to site-specific, save current global pos
                currentSiteSettings.position = settings.position;
                currentSiteSettings.offsetX = settings.offsetX;
                currentSiteSettings.offsetY = settings.offsetY;
            }
            savePerSiteSettings();
            // Reload global settings if switching back to global, or apply site-specific now
             loadPerSiteSettings().then(() => {
                  updateButtonPosition();
             });
        });
        const currentSiteInfo = document.createElement('div');
        currentSiteInfo.className = 'site-info';
        currentSiteInfo.textContent = `Current site: ${getCurrentSiteIdentifier()}`;

        section.appendChild(uiElements.perSiteSettingsToggle);
        // Hide global position toggle initially if per-site is disabled
        const globalPosGroup = uiElements.useGlobalPositionToggle;
        if (!(settings.perSiteSettings?.enabled ?? true)) globalPosGroup.style.display = 'none';
        section.appendChild(globalPosGroup);
        section.appendChild(currentSiteInfo);
        return section;
    }

    /** Create Button Position Section */
    function createPositionSection() {
        const section = createSettingSection('Button Position');
        const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        uiElements.positionSelect = createSelect('positionSelect', 'Position:', positions, settings.position, (e) => {
            settings.position = e.target.value;
            saveSettings(); // Will trigger updateButtonPosition via debounced save
            updateButtonPosition(); // Update immediately
        });
        uiElements.offsetXInput = createNumberInput('offsetXInput', 'Offset X (px):', settings.offsetX, (e) => {
            settings.offsetX = parseInt(e.target.value) || 0;
            saveSettings();
            updateButtonPosition();
        });
        uiElements.offsetYInput = createNumberInput('offsetYInput', 'Offset Y (px):', settings.offsetY, (e) => {
            settings.offsetY = parseInt(e.target.value) || 0;
            saveSettings();
            updateButtonPosition();
        });
        uiElements.settingsButtonOffsetInput = createNumberInput('settingsButtonOffsetInput', 'Settings Gear Offset (px):', settings.settingsButtonOffset, (e) => {
            settings.settingsButtonOffset = parseInt(e.target.value) || 0;
            saveSettings();
            updateSettingsButtonPosition();
        });
        section.appendChild(uiElements.positionSelect);
        section.appendChild(uiElements.offsetXInput);
        section.appendChild(uiElements.offsetYInput);
        section.appendChild(uiElements.settingsButtonOffsetInput);
        return section;
    }

     /** Create Device Optimization Section */
    function createDeviceOptimizationSection() {
        const section = createSettingSection('Device Optimization');
        const deviceInfoDisplay = document.createElement('div');
        deviceInfoDisplay.className = 'device-info';
        deviceInfoDisplay.innerHTML = `
            <p>Detected Type: <span class="device-value">${deviceInfo.type}</span></p>
            <p>Detected Performance: <span class="device-value">${deviceInfo.performance}</span></p>
            ${deviceInfo.batteryLevel !== null ? `<p>Battery: <span class="device-value">${Math.round(deviceInfo.batteryLevel * 100)}%</span></p>` : ''}
        `;
        uiElements.deviceOptimizationToggle = createCheckbox('deviceOptimizationToggle', 'Enable Device Optimization:', settings.deviceOptimization?.enabled ?? true, (e) => {
            settings.deviceOptimization.enabled = e.target.checked;
            saveSettings();
            updatePerformanceMode(); // Re-evaluate performance mode
        });
        uiElements.reducedMotionToggle = createCheckbox('reducedMotionToggle', 'Reduce Animations:', settings.deviceOptimization?.reducedMotion ?? false, (e) => {
            settings.deviceOptimization.reducedMotion = e.target.checked;
            saveSettings();
            updatePerformanceMode();
        });
        uiElements.lowPowerModeToggle = createCheckbox('lowPowerModeToggle', 'Low Power Mode:', settings.deviceOptimization?.lowPowerMode ?? false, (e) => {
            settings.deviceOptimization.lowPowerMode = e.target.checked;
            saveSettings();
            updatePerformanceMode();
        });
        const explanation = createExplanation('Adjusts performance based on detected device capabilities and battery status.');

        section.appendChild(deviceInfoDisplay);
        section.appendChild(uiElements.deviceOptimizationToggle);
        section.appendChild(uiElements.reducedMotionToggle);
        section.appendChild(uiElements.lowPowerModeToggle);
        section.appendChild(explanation);
        return section;
    }

    /** Create Theme Presets Section */
    function createThemePresetsSection() {
        const section = createSettingSection('Theme Presets');
        const presetOptions = Object.entries(THEME_PRESETS).map(([key, preset]) => ({ value: key, text: preset.name }));
        uiElements.themePresetsSelect = createSelect('themePresetsSelect', 'Apply Preset:', presetOptions, '', (e) => {
            if (e.target.value) {
                applyThemePreset(e.target.value);
                e.target.value = ''; // Reset selection
            }
        }, '-- Select Preset --'); // Add placeholder option
        section.appendChild(uiElements.themePresetsSelect);
        return section;
    }

    /** Create Dark Mode Settings Section */
    function createDarkModeSettingsSection() {
        const section = createSettingSection('Dark Mode Filter');
        uiElements.brightnessInput = createRangeInput('brightnessInput', 'Brightness:', settings.brightness, 0, 150, (e) => {
            settings.brightness = parseInt(e.target.value);
            updateValueDisplay('brightnessValue', settings.brightness);
            saveSettings(); // Debounced save
            updateDarkReaderConfig(); // Immediate update
        }, 'brightnessValue');
        uiElements.contrastInput = createRangeInput('contrastInput', 'Contrast:', settings.contrast, 50, 150, (e) => {
            settings.contrast = parseInt(e.target.value);
            updateValueDisplay('contrastValue', settings.contrast);
            saveSettings();
            updateDarkReaderConfig();
        }, 'contrastValue');
        uiElements.sepiaInput = createRangeInput('sepiaInput', 'Sepia:', settings.sepia, 0, 100, (e) => {
            settings.sepia = parseInt(e.target.value);
            updateValueDisplay('sepiaValue', settings.sepia);
            saveSettings();
            updateDarkReaderConfig();
        }, 'sepiaValue');
        section.appendChild(uiElements.brightnessInput);
        section.appendChild(uiElements.contrastInput);
        section.appendChild(uiElements.sepiaInput);
        return section;
    }

     /** Create Appearance Section (New) */
    function createAppearanceSection() {
        const section = createSettingSection('Appearance');
        uiElements.fontFamilyInput = createTextInput('fontFamilyInput', 'UI Font Family:', settings.fontFamily, (e) => {
            settings.fontFamily = e.target.value;
            saveSettings();
            applyUIStyles(); // Update UI font immediately
        });
        uiElements.themeColorInput = createColorInput('themeColorInput', 'UI Theme Color:', settings.themeColor, (e) => {
            settings.themeColor = e.target.value;
            saveSettings();
            applyUIStyles();
        });
        uiElements.textColorInput = createColorInput('textColorInput', 'UI Text Color:', settings.textColor, (e) => {
            settings.textColor = e.target.value;
            saveSettings();
            applyUIStyles();
        });
        // New Appearance Toggles
        uiElements.greyscaleModeToggle = createCheckbox(ELEMENT_IDS.GREYSCALE_MODE_TOGGLE, 'Enable Greyscale Mode:', settings.appearance?.greyscaleMode ?? false, (e) => {
            settings.appearance.greyscaleMode = e.target.checked;
            saveSettings();
            applyAdditionalFilters(); // Apply filter change
        });
         uiElements.colorFilterToggle = createCheckbox(ELEMENT_IDS.COLOR_FILTER_TOGGLE, 'Enable Color Filter (Hue Rotate):', settings.appearance?.colorFilter ?? false, (e) => {
            settings.appearance.colorFilter = e.target.checked;
            saveSettings();
            applyAdditionalFilters();
        });

        section.appendChild(uiElements.fontFamilyInput);
        section.appendChild(uiElements.themeColorInput);
        section.appendChild(uiElements.textColorInput);
        section.appendChild(uiElements.greyscaleModeToggle);
        section.appendChild(uiElements.colorFilterToggle);
        return section;
    }

    /** Create Extreme Mode Section */
    function createExtremeModeSection() {
        const section = createSettingSection('Extreme Mode');
        uiElements.extremeModeToggle = createCheckbox(ELEMENT_IDS.EXTREME_MODE_TOGGLE, 'Enable Extreme Mode:', settings.extremeMode?.enabled ?? false, (e) => {
            settings.extremeMode.enabled = e.target.checked;
            saveSettings();
            toggleDarkMode(darkModeEnabled); // Re-apply dark mode with new extreme setting
        });
        uiElements.forceDarkToggle = createCheckbox(ELEMENT_IDS.FORCE_DARK_TOGGLE, 'Force Dark Elements (Experimental):', settings.extremeMode?.forceDarkElements ?? true, (e) => {
            settings.extremeMode.forceDarkElements = e.target.checked;
            saveSettings();
             if (extremeModeActive) toggleDarkMode(true); // Re-apply if active
        });
        uiElements.customCssToggle = createCheckbox('customCssToggle', 'Use Custom CSS with Extreme Mode:', settings.extremeMode?.useCustomCSS ?? false, (e) => {
            settings.extremeMode.useCustomCSS = e.target.checked;
            saveSettings();
             if (darkModeEnabled) toggleDarkMode(true); // Re-apply CSS if needed
        });
        uiElements.customCssTextarea = createTextarea(ELEMENT_IDS.CUSTOM_CSS_TEXTAREA, 'Custom CSS for This Site:', currentSiteCustomCSS, (e) => {
            currentSiteCustomCSS = e.target.value;
            savePerSiteSettings(); // Save CSS immediately
            // Re-apply CSS if dark mode is on and CSS should be used
            if (darkModeEnabled && (extremeModeActive || settings.extremeMode?.useCustomCSS)) {
                injectCustomCSS(currentSiteCustomCSS, 'custom-site-css');
            }
        }, 'Enter site-specific CSS rules...');
        const explanation = createExplanation('Forces dark theme on resistant sites. May impact performance or break site layout.');

        section.appendChild(uiElements.extremeModeToggle);
        section.appendChild(uiElements.forceDarkToggle);
        section.appendChild(uiElements.customCssToggle);
        section.appendChild(uiElements.customCssTextarea);
        section.appendChild(explanation);
        return section;
    }

    /** Create Advanced Compatibility Section */
    function createAdvancedCompatibilitySection() {
        const section = createSettingSection('Advanced Compatibility');
        uiElements.dynamicSelectorsToggle = createCheckbox(ELEMENT_IDS.DYNAMIC_SELECTORS_TOGGLE, 'Dynamic Content Monitoring:', settings.dynamicSelectors?.enabled ?? true, (e) => {
            settings.dynamicSelectors.enabled = e.target.checked;
            saveSettings();
            setupDynamicScanning(); // Start/stop scanning
        });
        uiElements.shadowDomToggle = createCheckbox('shadowDomToggle', 'Shadow DOM Support:', settings.dynamicSelectors?.detectShadowDOM ?? true, (e) => {
            settings.dynamicSelectors.detectShadowDOM = e.target.checked;
            saveSettings();
            if (e.target.checked) findShadowRoots(); // Scan immediately if enabled
            else shadowRoots.clear(); // Clear tracked roots if disabled
        });
        uiElements.deepScanToggle = createCheckbox('deepScanToggle', 'Enable Deep Scanning (Extreme Mode):', settings.dynamicSelectors?.deepScan ?? true, (e) => {
            settings.dynamicSelectors.deepScan = e.target.checked;
            saveSettings();
        });
        uiElements.scanIntervalInput = createNumberInput('scanIntervalInput', 'Scan Interval (ms):', settings.dynamicSelectors?.scanInterval ?? 2000, (e) => {
            settings.dynamicSelectors.scanInterval = Math.max(500, parseInt(e.target.value)) || 2000; // Min 500ms
            saveSettings();
            setupDynamicScanning(); // Restart with new interval
        });
        const explanation = createExplanation('Improves compatibility with dynamic sites but may affect performance. Lower scan interval uses more resources.');

        section.appendChild(uiElements.dynamicSelectorsToggle);
        section.appendChild(uiElements.shadowDomToggle);
        section.appendChild(uiElements.deepScanToggle);
        section.appendChild(uiElements.scanIntervalInput);
        section.appendChild(explanation);
        return section;
    }

    /** Create Schedule Section */
    function createScheduleSection() {
        const section = createSettingSection('Schedule Dark Mode');
        uiElements.scheduleEnabledToggle = createCheckbox(ELEMENT_IDS.SCHEDULE_ENABLED_TOGGLE, 'Enable Schedule:', settings.scheduledDarkMode?.enabled ?? false, (e) => {
            settings.scheduledDarkMode.enabled = e.target.checked;
            saveSettings();
            setupScheduleChecking(); // Start/stop checking
        });
        uiElements.scheduleStartTime = createTimeInput(ELEMENT_IDS.SCHEDULE_START_TIME, 'Start Time:', settings.scheduledDarkMode?.startTime ?? '20:00', (e) => {
            settings.scheduledDarkMode.startTime = e.target.value;
            saveSettings();
            if (settings.scheduledDarkMode.enabled) checkScheduledDarkMode(); // Check immediately
        });
        uiElements.scheduleEndTime = createTimeInput(ELEMENT_IDS.SCHEDULE_END_TIME, 'End Time:', settings.scheduledDarkMode?.endTime ?? '07:00', (e) => {
            settings.scheduledDarkMode.endTime = e.target.value;
            saveSettings();
             if (settings.scheduledDarkMode.enabled) checkScheduledDarkMode();
        });
        const explanation = createExplanation('Automatically enables/disables dark mode between the specified times. If start time is after end time, it spans across midnight.');

        section.appendChild(uiElements.scheduleEnabledToggle);
        section.appendChild(uiElements.scheduleStartTime);
        section.appendChild(uiElements.scheduleEndTime);
        section.appendChild(explanation);
        return section;
    }

    /** Create Site Exclusions Section */
    function createExclusionsSection() {
        const section = createSettingSection('Site Exclusions');
        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group';
        uiElements.siteExclusionInput = createTextInput(ELEMENT_IDS.SITE_EXCLUSION_INPUT, '', '', null, 'Enter URL pattern (e.g., example.com or *.example.com)');
        uiElements.siteExclusionInput.querySelector('input').style.flexGrow = '1'; // Make input take space

        const addButton = createButton('addExclusionButton', '+ Add', () => {
            const inputElement = uiElements.siteExclusionInput.querySelector('input');
            const url = inputElement.value.trim();
            if (url && !settings.exclusionList.includes(url)) {
                settings.exclusionList.push(url);
                saveSettings();
                updateExclusionListDisplay();
                inputElement.value = ''; // Clear input
            }
        });
        addButton.style.marginLeft = '5px';

         const addCurrentSiteButton = createButton('addCurrentSiteButton', '+ Current Site', () => {
            const currentSite = getCurrentSiteIdentifier(); // Just hostname
            if (currentSite && !settings.exclusionList.includes(currentSite)) {
                settings.exclusionList.push(currentSite);
                saveSettings();
                updateExclusionListDisplay();
            }
        });
        addCurrentSiteButton.style.marginLeft = '5px';

        inputGroup.appendChild(uiElements.siteExclusionInput);
        inputGroup.appendChild(addButton);
        inputGroup.appendChild(addCurrentSiteButton);

        uiElements.siteExclusionList = document.createElement('ul');
        uiElements.siteExclusionList.id = ELEMENT_IDS.SITE_EXCLUSION_LIST;
        uiElements.siteExclusionList.setAttribute('aria-label', 'Excluded Sites');

        section.appendChild(inputGroup);
        section.appendChild(uiElements.siteExclusionList);
        updateExclusionListDisplay(); // Initial population
        return section;
    }

    /** Create Diagnostics Section */
    function createDiagnosticsSection() {
        const section = createSettingSection('Diagnostics');
        uiElements.diagnosticsToggle = createCheckbox('diagnosticsToggle', 'Enable Diagnostics:', settings.diagnostics?.enabled ?? false, (e) => {
            settings.diagnostics.enabled = e.target.checked;
            saveSettings();
        });
        const logLevels = ['error', 'warn', 'info', 'debug'];
        uiElements.logLevelSelect = createSelect('logLevelSelect', 'Log Level:', logLevels, settings.diagnostics?.logLevel ?? 'info', (e) => {
            settings.diagnostics.logLevel = e.target.value;
            saveSettings();
        });
        const showDiagnosticsButton = createButton(ELEMENT_IDS.SHOW_DIAGNOSTICS_BUTTON, 'Show Diagnostic Report', showDiagnosticReport);
        showDiagnosticsButton.style.width = '100%';
        showDiagnosticsButton.style.marginTop = '10px';
        const explanation = createExplanation('Helps identify issues on specific websites. Check browser console for logs.');

        section.appendChild(uiElements.diagnosticsToggle);
        section.appendChild(uiElements.logLevelSelect);
        section.appendChild(showDiagnosticsButton);
        section.appendChild(explanation);
        return section;
    }

     /** Create Import/Export Section */
    function createImportExportSection() {
        const section = createSettingSection('Import/Export Settings');
        const buttonGroup = document.createElement('div');
        buttonGroup.style.display = 'flex';
        buttonGroup.style.gap = '10px';
        buttonGroup.style.marginTop = '5px';

        const exportButton = createButton(ELEMENT_IDS.EXPORT_SETTINGS_BUTTON, 'Export', exportSettings);
        exportButton.style.flex = '1';
        uiElements.importSettingsInput = document.createElement('input');
        uiElements.importSettingsInput.type = 'file';
        uiElements.importSettingsInput.id = ELEMENT_IDS.IMPORT_SETTINGS_INPUT;
        uiElements.importSettingsInput.accept = '.json';
        uiElements.importSettingsInput.style.display = 'none';
        uiElements.importSettingsInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) importSettings(e.target.files[0]);
            e.target.value = null; // Reset file input
        });
        const importButton = createButton(ELEMENT_IDS.IMPORT_SETTINGS_BUTTON, 'Import', () => uiElements.importSettingsInput.click());
        importButton.style.flex = '1';

        buttonGroup.appendChild(exportButton);
        buttonGroup.appendChild(importButton);
        section.appendChild(buttonGroup);
        section.appendChild(uiElements.importSettingsInput); // Add hidden file input
        return section;
    }

    /** Create Actions Section */
    function createActionsSection() {
        const section = createSettingSection('Actions');
        const resetSettingsButton = createButton(ELEMENT_IDS.RESET_SETTINGS_BUTTON, 'Reset All Settings', resetSettings);
        resetSettingsButton.style.width = '100%';
        resetSettingsButton.style.backgroundColor = '#f44336'; // Red color for warning
        resetSettingsButton.style.color = 'white';
        resetSettingsButton.style.marginTop = '10px';
        section.appendChild(resetSettingsButton);
        return section;
    }

    // --- UI Helper Functions ---

    /** Create a standard settings section container */
    function createSettingSection(title) {
        const section = document.createElement('section');
        section.className = 'settings-section';
        const heading = document.createElement('h3');
        heading.textContent = title;
        section.appendChild(heading);
        return section;
    }

    /** Create a form group container */
    function createFormGroup(labelElement, inputElement, extraElement = null) {
        const group = document.createElement('div');
        group.className = 'form-group';
        group.appendChild(labelElement);
        group.appendChild(inputElement);
        if (extraElement) group.appendChild(extraElement);
        return group;
    }

    /** Create a label element */
    function createLabel(text, forId = '') {
        const label = document.createElement('label');
        label.textContent = text;
        if (forId) label.htmlFor = forId;
        return label;
    }

    /** Create a checkbox input group */
    function createCheckbox(id, labelText, checked, onChange) {
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = id;
        input.checked = checked;
        input.addEventListener('change', onChange);
        const label = createLabel(labelText, id);
        // Wrap in a div for better layout control if needed, or return elements directly
        const group = document.createElement('div');
        group.className = 'form-group checkbox-group'; // Add class for styling
        group.appendChild(input);
        group.appendChild(label);
        // Store reference
        uiElements[id] = group; // Store the group or just the input? Input is probably better.
        uiElements[id] = input;
        return group; // Return the container
    }

    /** Create a number input group */
    function createNumberInput(id, labelText, value, onChange) {
        const input = document.createElement('input');
        input.type = 'number';
        input.id = id;
        input.value = value;
        input.addEventListener('change', onChange);
        const label = createLabel(labelText, id);
        const group = createFormGroup(label, input);
        uiElements[id] = input;
        return group;
    }

     /** Create a text input group */
    function createTextInput(id, labelText, value, onChange, placeholder = '') {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = id;
        input.value = value;
        if (placeholder) input.placeholder = placeholder;
        if (onChange) input.addEventListener('change', onChange);
        const label = createLabel(labelText, id);
        const group = createFormGroup(label, input);
        uiElements[id] = input;
        return group;
    }

     /** Create a textarea input group */
    function createTextarea(id, labelText, value, onChange, placeholder = '') {
        const textarea = document.createElement('textarea');
        textarea.id = id;
        textarea.value = value;
        textarea.rows = 5; // Default rows
        if (placeholder) textarea.placeholder = placeholder;
        if (onChange) textarea.addEventListener('input', onChange); // Use input for live changes
        const label = createLabel(labelText, id);
        const group = createFormGroup(label, textarea);
        uiElements[id] = textarea;
        return group;
    }


    /** Create a range input group with value display */
    function createRangeInput(id, labelText, value, min, max, onChange, valueDisplayId) {
        const input = document.createElement('input');
        input.type = 'range';
        input.id = id;
        input.min = min;
        input.max = max;
        input.value = value;
        const valueDisplay = document.createElement('span');
        valueDisplay.id = valueDisplayId;
        valueDisplay.className = 'value-display';
        valueDisplay.textContent = value;
        input.addEventListener('input', (e) => { // Use 'input' for live feedback
            valueDisplay.textContent = e.target.value;
            onChange(e);
        });
        const label = createLabel(labelText, id);
        const container = document.createElement('div'); // Container for input + value
        container.className = 'range-container';
        container.appendChild(input);
        container.appendChild(valueDisplay);
        const group = createFormGroup(label, container);
        uiElements[id] = input;
        return group;
    }

    /** Create a select dropdown group */
    function createSelect(id, labelText, options, selectedValue, onChange, placeholderOption = null) {
        const select = document.createElement('select');
        select.id = id;
        if (placeholderOption) {
             const ph = document.createElement('option');
             ph.value = '';
             ph.textContent = placeholderOption;
             ph.disabled = true; // Often good for placeholders
             ph.selected = !selectedValue; // Select if no value matches
             select.appendChild(ph);
        }
        options.forEach(opt => {
            const option = document.createElement('option');
            if (typeof opt === 'string') {
                option.value = opt;
                option.textContent = opt;
            } else { // Assume {value: 'val', text: 'Display Text'}
                option.value = opt.value;
                option.textContent = opt.text;
            }
            option.selected = option.value === selectedValue;
            select.appendChild(option);
        });
        select.addEventListener('change', onChange);
        const label = createLabel(labelText, id);
        const group = createFormGroup(label, select);
        uiElements[id] = select;
        return group;
    }

     /** Create a time input group */
    function createTimeInput(id, labelText, value, onChange) {
        const input = document.createElement('input');
        input.type = 'time';
        input.id = id;
        input.value = value;
        input.addEventListener('change', onChange);
        const label = createLabel(labelText, id);
        const group = createFormGroup(label, input);
        uiElements[id] = input;
        return group;
    }

     /** Create a color input group */
    function createColorInput(id, labelText, value, onChange) {
        const input = document.createElement('input');
        input.type = 'color';
        input.id = id;
        input.value = value;
        input.addEventListener('input', onChange); // Use input for live preview
        const label = createLabel(labelText, id);
        const group = createFormGroup(label, input);
        uiElements[id] = input;
        return group;
    }

    /** Create an explanation text paragraph */
    function createExplanation(text) {
        const p = document.createElement('p');
        p.className = 'info-text';
        p.textContent = text;
        return p;
    }

    /** Update a value display span */
    function updateValueDisplay(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    /** Update the exclusion list display in the UI */
    function updateExclusionListDisplay() {
        const listElement = uiElements.siteExclusionList;
        if (!listElement) return; // UI not ready
        listElement.innerHTML = ''; // Clear existing list
        if (settings.exclusionList.length === 0) {
            const emptyMsg = document.createElement('li');
            emptyMsg.textContent = 'No sites excluded.';
            emptyMsg.className = 'empty-message';
            listElement.appendChild(emptyMsg);
        } else {
            settings.exclusionList.forEach(excludedSite => {
                const listItem = document.createElement('li');
                const siteText = document.createElement('span');
                siteText.textContent = excludedSite;
                siteText.title = excludedSite; // Show full pattern on hover
                const removeButton = createButton(`remove-${excludedSite}`, '✕', () => {
                    settings.exclusionList = settings.exclusionList.filter(site => site !== excludedSite);
                    saveSettings();
                    updateExclusionListDisplay(); // Refresh list
                }, `Remove ${excludedSite} from exclusion list`);
                removeButton.className = 'remove-button'; // For styling
                listItem.appendChild(siteText);
                listItem.appendChild(removeButton);
                listElement.appendChild(listItem);
            });
        }
    }

    /** Create the settings toggle button (gear icon) */
    function createToggleUIButton() {
        if (document.getElementById(ELEMENT_IDS.TOGGLE_UI_BUTTON)) return;
        const toggleUIButton = createButton(ELEMENT_IDS.TOGGLE_UI_BUTTON, '', toggleUI, 'Open/Close Dark Mode Settings');
        toggleUIButton.innerHTML = SVG_ICONS.GEAR; // Use SVG icon
        toggleUIButton.className = 'settings-toggle-button'; // Add class for styling
        document.body.appendChild(toggleUIButton);
        updateSettingsButtonPosition();
    }

    /** Update position of the settings button */
    function updateSettingsButtonPosition() {
        const button = document.getElementById(ELEMENT_IDS.TOGGLE_UI_BUTTON);
        if (button) {
            // Position it relative to the main toggle button or fixed? Fixed is simpler.
            button.style.position = 'fixed';
            button.style.zIndex = '2147483645'; // Slightly lower than main button
            button.style.top = '20px'; // Example position
            button.style.right = `${settings.settingsButtonOffset || DEFAULT_SETTINGS.settingsButtonOffset}px`;
        }
    }

    /** Toggle the visibility of the settings UI */
    function toggleUI() {
        const ui = document.getElementById(ELEMENT_IDS.UI);
        if (!ui) { // Create UI if it doesn't exist (e.g., if removed by SPA navigation)
             createUI();
             ui = document.getElementById(ELEMENT_IDS.UI); // Get reference again
             if (!ui) return; // Still failed
        }
        uiVisible = !uiVisible;
        if (uiVisible) {
            updateUIValues(); // Ensure values are current before showing
            ui.style.display = 'block';
            ui.setAttribute('aria-hidden', 'false');
            // Optional: focus first element?
        } else {
            ui.style.display = 'none';
            ui.setAttribute('aria-hidden', 'true');
        }
    }

    /** Update UI element values based on current settings */
    function updateUIValues() {
        if (!isInitialized || !uiElements.positionSelect) return; // Ensure UI elements exist

        // Update values for all relevant UI elements
        // Use optional chaining (?) and nullish coalescing (??) for safety
        uiElements.perSiteSettingsToggle.checked = settings.perSiteSettings?.enabled ?? true;
        const globalPosGroup = uiElements.useGlobalPositionToggle?.closest('.form-group');
        if (globalPosGroup) globalPosGroup.style.display = settings.perSiteSettings?.enabled ? 'flex' : 'none';
        uiElements.useGlobalPositionToggle.checked = currentSiteSettings?.useGlobalPosition ?? true;

        uiElements.positionSelect.value = settings.position ?? DEFAULT_SETTINGS.position;
        uiElements.offsetXInput.value = settings.offsetX ?? DEFAULT_SETTINGS.offsetX;
        uiElements.offsetYInput.value = settings.offsetY ?? DEFAULT_SETTINGS.offsetY;
        uiElements.settingsButtonOffsetInput.value = settings.settingsButtonOffset ?? DEFAULT_SETTINGS.settingsButtonOffset;

        uiElements.deviceOptimizationToggle.checked = settings.deviceOptimization?.enabled ?? true;
        uiElements.reducedMotionToggle.checked = settings.deviceOptimization?.reducedMotion ?? false;
        uiElements.lowPowerModeToggle.checked = settings.deviceOptimization?.lowPowerMode ?? false;

        // Update Dark Mode Filter sliders and displays
        uiElements.brightnessInput.value = settings.brightness ?? DEFAULT_SETTINGS.brightness;
        updateValueDisplay('brightnessValue', settings.brightness ?? DEFAULT_SETTINGS.brightness);
        uiElements.contrastInput.value = settings.contrast ?? DEFAULT_SETTINGS.contrast;
        updateValueDisplay('contrastValue', settings.contrast ?? DEFAULT_SETTINGS.contrast);
        uiElements.sepiaInput.value = settings.sepia ?? DEFAULT_SETTINGS.sepia;
        updateValueDisplay('sepiaValue', settings.sepia ?? DEFAULT_SETTINGS.sepia);

        // Update Appearance section
        uiElements.fontFamilyInput.value = settings.fontFamily ?? DEFAULT_SETTINGS.fontFamily;
        uiElements.themeColorInput.value = settings.themeColor ?? DEFAULT_SETTINGS.themeColor;
        uiElements.textColorInput.value = settings.textColor ?? DEFAULT_SETTINGS.textColor;
        uiElements.greyscaleModeToggle.checked = settings.appearance?.greyscaleMode ?? false;
        uiElements.colorFilterToggle.checked = settings.appearance?.colorFilter ?? false;


        // Update Extreme Mode section
        uiElements.extremeModeToggle.checked = settings.extremeMode?.enabled ?? false;
        uiElements.forceDarkToggle.checked = settings.extremeMode?.forceDarkElements ?? true;
        uiElements.customCssToggle.checked = settings.extremeMode?.useCustomCSS ?? false;
        uiElements.customCssTextarea.value = currentSiteCustomCSS ?? '';

        // Update Advanced Compatibility section
        uiElements.dynamicSelectorsToggle.checked = settings.dynamicSelectors?.enabled ?? true;
        uiElements.shadowDomToggle.checked = settings.dynamicSelectors?.detectShadowDOM ?? true;
        uiElements.deepScanToggle.checked = settings.dynamicSelectors?.deepScan ?? true;
        uiElements.scanIntervalInput.value = settings.dynamicSelectors?.scanInterval ?? DEFAULT_SETTINGS.dynamicSelectors.scanInterval;

        // Update Schedule section
        uiElements.scheduleEnabledToggle.checked = settings.scheduledDarkMode?.enabled ?? false;
        uiElements.scheduleStartTime.value = settings.scheduledDarkMode?.startTime ?? DEFAULT_SETTINGS.scheduledDarkMode.startTime;
        uiElements.scheduleEndTime.value = settings.scheduledDarkMode?.endTime ?? DEFAULT_SETTINGS.scheduledDarkMode.endTime;

        // Update Diagnostics section
        uiElements.diagnosticsToggle.checked = settings.diagnostics?.enabled ?? false;
        uiElements.logLevelSelect.value = settings.diagnostics?.logLevel ?? DEFAULT_SETTINGS.diagnostics.logLevel;

        updateExclusionListDisplay(); // Update the list of excluded sites
    }

    /** Apply UI styles dynamically based on settings */
    function applyUIStyles() {
        const ui = document.getElementById(ELEMENT_IDS.UI);
        if (ui) {
            ui.style.backgroundColor = settings.themeColor;
            ui.style.color = settings.textColor;
            ui.style.fontFamily = settings.fontFamily;
            // Update styles for inputs/buttons within UI to match theme? Maybe too complex.
        }
        // Inject or update the main stylesheet for buttons and UI panel
        const styleId = 'darkModeToggleStyles';
        removeCustomCSS(styleId); // Remove old styles
        injectCustomCSS(generateStyles(), styleId); // Add new styles
    }

    /** Generate CSS styles based on current settings */
    function generateStyles() {
        // Destructure relevant settings for easier access
        const {
            themeColor, textColor, fontFamily, iconMoon, iconSun,
            buttonOpacity, transitionSpeed, buttonSize, settingsButtonOffset
        } = settings;

        // Base styles (can be quite long)
        return `
            /* Main Toggle Button */
            #${ELEMENT_IDS.BUTTON} {
                /* Position is set dynamically by updateButtonPosition */
                width: ${buttonSize.width}px;
                height: ${buttonSize.height}px;
                background-color: #fff;
                border-radius: ${buttonSize.height / 2}px; /* Pill shape */
                border: 1px solid rgba(0,0,0,0.1);
                cursor: pointer;
                opacity: ${buttonOpacity};
                transition: all ${transitionSpeed}s cubic-bezier(0.25, 0.8, 0.25, 1);
                display: flex;
                align-items: center;
                justify-content: center; /* Center icon */
                padding: 0;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                overflow: hidden; /* Hide overflow if icon is larger */
                outline: none;
            }
            #${ELEMENT_IDS.BUTTON}:hover {
                opacity: 1;
                transform: scale(1.05);
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
            }
            #${ELEMENT_IDS.BUTTON}:focus-visible { /* Modern focus outline */
                box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.6);
            }
            #${ELEMENT_IDS.BUTTON} .icon {
                display: inline-block;
                width: ${buttonSize.height * 0.6}px; /* Adjust icon size relative to button */
                height: ${buttonSize.height * 0.6}px;
                transition: transform ${transitionSpeed}s ease;
            }
             #${ELEMENT_IDS.BUTTON} .icon svg {
                 display: block;
                 width: 100%;
                 height: 100%;
                 fill: #333; /* Icon color for light mode */
             }
            #${ELEMENT_IDS.BUTTON}.dark {
                background-color: #333; /* Dark background for dark mode */
                border-color: rgba(255,255,255,0.2);
            }
             #${ELEMENT_IDS.BUTTON}.dark .icon svg {
                 fill: #eee; /* Icon color for dark mode */
             }

            /* Settings UI Panel */
            #${ELEMENT_IDS.UI} {
                position: fixed;
                top: 20px; /* Default position, can be adjusted */
                left: 20px;
                background-color: ${themeColor};
                color: ${textColor};
                font-family: ${fontFamily};
                border: 1px solid rgba(0, 0, 0, 0.1);
                padding: 15px;
                padding-top: 5px; /* Less top padding */
                z-index: 2147483647; /* Max z-index */
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                /* display: none; Set by toggleUI */
                width: 350px; /* Slightly wider for more options */
                max-width: 95vw;
                max-height: 90vh;
                overflow-x: hidden;
                overflow-y: auto;
                animation: fadeInSettings 0.2s ease-out;
            }
             @keyframes fadeInSettings {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }

            /* Settings Sections */
            #${ELEMENT_IDS.UI} .settings-section { margin-bottom: 18px; }
            #${ELEMENT_IDS.UI} h3 {
                margin: 15px 0 10px 0;
                font-size: 1em; /* Use em for relative sizing */
                font-weight: 600;
                color: ${textColor};
                opacity: 0.9;
                border-bottom: 1px solid rgba(0, 0, 0, 0.1);
                padding-bottom: 6px;
            }

            /* Form Groups & Inputs */
            #${ELEMENT_IDS.UI} .form-group {
                margin-bottom: 12px;
                display: flex;
                flex-wrap: wrap; /* Allow wrapping */
                align-items: center; /* Align items vertically */
                gap: 5px 10px; /* Row and column gap */
            }
            #${ELEMENT_IDS.UI} label {
                display: block;
                font-weight: 500;
                font-size: 0.9em;
                flex-basis: 120px; /* Give labels a base width */
                flex-grow: 0;
                padding-right: 5px;
                text-align: right; /* Align label text right */
            }
             #${ELEMENT_IDS.UI} .checkbox-group label { /* Checkbox labels next to box */
                 flex-basis: auto;
                 order: 1; /* Put label after checkbox */
                 text-align: left;
             }
             #${ELEMENT_IDS.UI} .checkbox-group input[type="checkbox"] {
                 order: 0;
                 margin-right: 5px;
             }

            #${ELEMENT_IDS.UI} input[type="text"],
            #${ELEMENT_IDS.UI} input[type="number"],
            #${ELEMENT_IDS.UI} input[type="time"],
            #${ELEMENT_IDS.UI} input[type="color"],
            #${ELEMENT_IDS.UI} select,
            #${ELEMENT_IDS.UI} textarea {
                padding: 8px 10px;
                border: 1px solid #ccc;
                border-radius: 4px;
                font-size: 0.9em;
                flex-grow: 1; /* Allow input to fill space */
                min-width: 100px; /* Prevent inputs becoming too small */
                box-sizing: border-box;
                background-color: #fff; /* Ensure background is light */
                color: #333; /* Ensure text is dark */
            }
             #${ELEMENT_IDS.UI} input[type="color"] { padding: 2px; height: 30px; min-width: 40px; flex-grow: 0; }
             #${ELEMENT_IDS.UI} textarea { width: 100%; flex-basis: 100%; resize: vertical; font-family: monospace; }

            /* Range input styling */
            #${ELEMENT_IDS.UI} .range-container { display: flex; align-items: center; flex-grow: 1; }
            #${ELEMENT_IDS.UI} input[type="range"] { flex-grow: 1; margin-right: 5px; cursor: pointer; }
            #${ELEMENT_IDS.UI} .value-display { font-size: 0.85em; min-width: 25px; text-align: right; opacity: 0.8; }

            /* Input Group (for exclusion add) */
            #${ELEMENT_IDS.UI} .input-group { display: flex; width: 100%; gap: 5px; }
            #${ELEMENT_IDS.UI} .input-group .form-group { flex-grow: 1; margin-bottom: 0; } /* Input takes space */
            #${ELEMENT_IDS.UI} .input-group button { flex-shrink: 0; } /* Prevent buttons shrinking */

            /* Exclusion List */
            #${ELEMENT_IDS.UI} ul#${ELEMENT_IDS.SITE_EXCLUSION_LIST} {
                list-style: none; padding: 8px; margin: 5px 0 0 0; max-height: 150px;
                overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; background: rgba(255,255,255,0.8);
            }
            #${ELEMENT_IDS.UI} ul#${ELEMENT_IDS.SITE_EXCLUSION_LIST} li {
                display: flex; justify-content: space-between; align-items: center;
                padding: 4px 0; margin-bottom: 2px; font-size: 0.85em;
                border-bottom: 1px dashed #eee;
            }
             #${ELEMENT_IDS.UI} ul#${ELEMENT_IDS.SITE_EXCLUSION_LIST} li:last-child { border-bottom: none; }
            #${ELEMENT_IDS.UI} ul#${ELEMENT_IDS.SITE_EXCLUSION_LIST} li span {
                 flex-grow: 1; padding-right: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            #${ELEMENT_IDS.UI} ul#${ELEMENT_IDS.SITE_EXCLUSION_LIST} .remove-button {
                padding: 1px 5px; font-size: 0.9em; background-color: #ffcdd2; color: #b71c1c;
                border: none; border-radius: 3px; cursor: pointer; flex-shrink: 0;
            }
             #${ELEMENT_IDS.UI} ul#${ELEMENT_IDS.SITE_EXCLUSION_LIST} .remove-button:hover { background-color: #ef9a9a; }
             #${ELEMENT_IDS.UI} ul#${ELEMENT_IDS.SITE_EXCLUSION_LIST} .empty-message { color: #999; font-style: italic; text-align: center; padding: 10px 0; }

            /* Buttons inside UI */
            #${ELEMENT_IDS.UI} button {
                background-color: #e0e0e0; color: #333; padding: 6px 12px; border: 1px solid #ccc;
                border-radius: 4px; cursor: pointer; font-size: 0.85em; transition: background-color 0.2s;
            }
            #${ELEMENT_IDS.UI} button:hover { background-color: #d5d5d5; }
            #${ELEMENT_IDS.UI} #${ELEMENT_IDS.RESET_SETTINGS_BUTTON} { background-color: #d32f2f; color: white; border-color: #b71c1c; }
            #${ELEMENT_IDS.UI} #${ELEMENT_IDS.RESET_SETTINGS_BUTTON}:hover { background-color: #c62828; }
            #${ELEMENT_IDS.UI} #${ELEMENT_IDS.EXPORT_SETTINGS_BUTTON}, #${ELEMENT_IDS.IMPORT_SETTINGS_BUTTON} { background-color: #388e3c; color: white; border-color: #2e7d32; }
            #${ELEMENT_IDS.UI} #${ELEMENT_IDS.EXPORT_SETTINGS_BUTTON}:hover, #${ELEMENT_IDS.IMPORT_SETTINGS_BUTTON}:hover { background-color: #2e7d32; }
            #${ELEMENT_IDS.UI} #${ELEMENT_IDS.SHOW_DIAGNOSTICS_BUTTON} { background-color: #1976d2; color: white; border-color: #1565c0; }
            #${ELEMENT_IDS.UI} #${ELEMENT_IDS.SHOW_DIAGNOSTICS_BUTTON}:hover { background-color: #1565c0; }

            /* Info/Explanation Text */
            #${ELEMENT_IDS.UI} .info-text, #${ELEMENT_IDS.UI} .site-info, #${ELEMENT_IDS.UI} .device-info {
                font-size: 0.8em; color: ${textColor}; opacity: 0.7; margin: 5px 0; padding-left: 5px;
                flex-basis: 100%; /* Make these take full width */
            }
             #${ELEMENT_IDS.UI} .device-info p { margin: 2px 0; }
             #${ELEMENT_IDS.UI} .device-info .device-value { font-weight: bold; }

            /* Settings Toggle Button (Gear) */
            .${ELEMENT_IDS.TOGGLE_UI_BUTTON.className} { /* Style using class if needed */
                 position: fixed; /* Positioned by updateSettingsButtonPosition */
                 background-color: rgba(240, 240, 240, 0.8);
                 border: 1px solid rgba(0, 0, 0, 0.1);
                 padding: 8px;
                 z-index: 2147483645; /* Below main toggle */
                 border-radius: 50%;
                 cursor: pointer;
                 box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
                 transition: all 0.2s ease;
                 width: 36px; height: 36px;
                 display: flex; align-items: center; justify-content: center;
             }
            .${ELEMENT_IDS.TOGGLE_UI_BUTTON.className}:hover {
                 background-color: rgba(240, 240, 240, 1);
                 transform: scale(1.1);
             }
            .${ELEMENT_IDS.TOGGLE_UI_BUTTON.className} svg {
                 width: 20px; height: 20px; fill: #555;
             }

            /* Version Info */
            #${ELEMENT_IDS.UI} .version-info {
                margin-top: 15px; font-size: 0.75em; text-align: center; opacity: 0.6;
            }
        `;
    }

    /**
     * Setup keyboard shortcuts for toggling dark mode
     */
    function setupKeyboardShortcuts() {
        if (!settings.keyboardShortcut?.enabled) return;
        document.addEventListener('keydown', (e) => {
            const shortcut = settings.keyboardShortcut;
            // Check if modifier keys match the settings
            if (
                (shortcut.alt === e.altKey) &&
                (shortcut.shift === e.shiftKey) &&
                (shortcut.ctrl === e.ctrlKey) &&
                (shortcut.meta === e.metaKey) && // Check meta key (Cmd on Mac)
                e.key.toLowerCase() === shortcut.key.toLowerCase()
            ) {
                // Check if the event target is an input field, textarea, or contenteditable
                // to avoid interfering with typing
                const targetTagName = e.target.tagName.toLowerCase();
                const isEditable = e.target.isContentEditable ||
                                   targetTagName === 'input' ||
                                   targetTagName === 'textarea' ||
                                   targetTagName === 'select';

                if (!isEditable) {
                    e.preventDefault(); // Prevent default browser action (e.g., opening menus)
                    e.stopPropagation(); // Stop event from bubbling further
                    log('debug', 'Keyboard shortcut triggered');
                    toggleDarkMode();
                } else {
                     log('debug', 'Keyboard shortcut ignored in editable field');
                }
            }
        });
    }

    /**
     * Register menu commands for easier access via Tampermonkey/Greasemonkey menu
     */
    function registerMenuCommands() {
        try {
            if (typeof GM.registerMenuCommand === 'function') {
                GM.registerMenuCommand('Toggle Dark Mode', () => toggleDarkMode());
                GM.registerMenuCommand('Open Settings', () => {
                    if (!uiVisible) toggleUI();
                });
                GM.registerMenuCommand('Toggle Extreme Mode', () => {
                    if (!settings.extremeMode) settings.extremeMode = { ...DEFAULT_SETTINGS.extremeMode };
                    settings.extremeMode.enabled = !settings.extremeMode.enabled;
                    saveSettings();
                    if (darkModeEnabled) toggleDarkMode(true); // Re-apply if dark mode is on
                    // Update checkbox in UI if visible
                    if (uiVisible && uiElements.extremeModeToggle) {
                         uiElements.extremeModeToggle.checked = settings.extremeMode.enabled;
                    }
                });
                 GM.registerMenuCommand('Add Current Site to Exclusions', () => {
                     const currentSite = getCurrentSiteIdentifier();
                     if (currentSite && !settings.exclusionList.includes(currentSite)) {
                         settings.exclusionList.push(currentSite);
                         saveSettings();
                         updateExclusionListDisplay();
                         // If dark mode is currently on, turn it off for this site
                         if (darkModeEnabled) toggleDarkMode(false);
                     }
                 });
            }
        } catch (error) {
            log('debug', 'Menu commands not supported or error registering:', error);
        }
    }

    /**
     * ------------------------
     * INITIALIZATION & LIFECYCLE
     * ------------------------
     */

    /**
     * Initialize the script
     * @return {Promise<void>}
     */
    async function init() {
        if (isInitialized) return;
        log('info', `Enhanced Dark Mode Toggle v${GM_info.script.version}: Initializing...`);

        // Detect device capabilities early
        detectDevice();

        // Load settings (global first, then per-site overrides)
        await loadSettings();
        await loadPerSiteSettings(); // This might override some global settings like position

        // Create UI elements (buttons, settings panel)
        // Ensure body exists before creating UI that appends to it
        if (!document.body) {
             await new Promise(resolve => {
                 if (document.body) resolve();
                 else new MutationObserver((_, obs) => {
                     if (document.body) { obs.disconnect(); resolve(); }
                 }).observe(document.documentElement, {childList: true});
             });
        }
        createToggleButton();
        createUI(); // Creates the hidden panel
        createToggleUIButton();

        // Apply styles and update UI values
        applyUIStyles(); // Generate and inject CSS
        updateUIValues(); // Populate UI with loaded settings

        // Initialize dark mode state based on storage (respecting exclusion)
        const initialDarkModeState = await GM.getValue(STORAGE_KEYS.DARK_MODE, false);
        if (initialDarkModeState && !isSiteExcluded(window.location.href)) {
            await toggleDarkMode(true);
        } else {
            await toggleDarkMode(false); // Ensure it's off if excluded or not previously on
        }

        // Set up background tasks
        setupKeyboardShortcuts();
        setupScheduleChecking();
        setupDynamicScanning();
        registerMenuCommands(); // Register Tampermonkey menu items

        // Collect initial diagnostics if enabled
        if (settings.diagnostics?.enabled) {
            collectSiteInfo();
        }

        isInitialized = true;
        log('info', 'Initialization complete.');
    }

    /**
     * Setup DOM mutation observer to handle dynamic content loading and ensure UI elements persist
     * (e.g., after SPA navigation)
     */
    function setupMutationObserver() {
        // Debounced function to handle mutations efficiently
        const handleMutations = debounce(() => {
            log('debug', 'Handling DOM mutations...');
            // 1. Recreate UI elements if they are missing
            if (!document.getElementById(ELEMENT_IDS.BUTTON)) {
                log('warn', 'Main toggle button missing, recreating...');
                createToggleButton();
            }
            if (!document.getElementById(ELEMENT_IDS.TOGGLE_UI_BUTTON)) {
                log('warn', 'Settings toggle button missing, recreating...');
                createToggleUIButton();
            }
            // Only recreate settings panel if it was supposed to be visible
            if (uiVisible && !document.getElementById(ELEMENT_IDS.UI)) {
                log('warn', 'Settings panel missing while visible, recreating...');
                createUI(); // Recreates and applies styles/values
                // Ensure it's visible after recreation
                const ui = document.getElementById(ELEMENT_IDS.UI);
                if (ui) {
                     ui.style.display = 'block';
                     ui.setAttribute('aria-hidden', 'false');
                }
            }

            // 2. Apply styles to new content if needed (especially in extreme mode)
            if (darkModeEnabled) {
                // Check for new shadow roots
                if (settings.dynamicSelectors?.detectShadowDOM) {
                    findShadowRoots();
                }
                // Re-apply extreme mode styles if active (might catch dynamically added elements)
                // This is partially handled by the dynamic scan interval, but can run here too.
                // Avoid running full deep scan on every minor mutation.
                // Maybe just re-apply to body/main?
                if (extremeModeActive && settings.extremeMode?.forceDarkElements) {
                     // forceElementStyles('body', { backgroundColor: '#121212 !important', color: '#e0e0e0 !important' });
                }
            }
        }, 500); // Debounce checks by 500ms

        // Observe the body for most changes (subtree and childList)
        // Use documentElement as fallback if body isn't ready yet
        const targetNode = document.body || document.documentElement;
        const observer = new MutationObserver(handleMutations);
        observer.observe(targetNode, {
            childList: true, // Detect added/removed nodes
            subtree: true,   // Observe descendants
            attributes: false // Usually don't need attribute changes
        });
        log('info', 'Mutation observer set up.');
    }

    /**
     * Handle script initialization ensuring the DOM is ready
     */
    function initializationHandler() {
        // Use a promise to wait for the body element
        const waitForBody = new Promise(resolve => {
            if (document.body) {
                resolve();
            } else {
                new MutationObserver((mutations, observer) => {
                    if (document.body) {
                        observer.disconnect();
                        resolve();
                    }
                }).observe(document.documentElement, { childList: true });
            }
        });

        waitForBody.then(async () => {
            await init(); // Initialize the script
            setupMutationObserver(); // Set up observer after initial setup
        }).catch(error => {
            console.error("[Dark Mode Toggle] Error during initialization:", error);
        });
    }

    // Start initialization based on document ready state
    if (document.readyState === 'loading') {
        // Use DOMContentLoaded for faster initialization than 'load'
        document.addEventListener('DOMContentLoaded', initializationHandler, { once: true });
    } else {
        // Document already loaded or interactive
        initializationHandler();
    }

})();
