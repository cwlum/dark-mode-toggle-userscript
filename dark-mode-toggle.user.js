// ==UserScript==
// @name         ☀️Dark Mode Toggle
// @author       Cervantes Wu (http://www.mriwu.us)
// @description  Ultra enhanced dark mode toggle with per-site settings, performance optimization, and device adaptation
// @namespace    https://github.com/cwlum/dark-mode-toggle-userscript
// @version      3.3.0
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
     * =========================================================================
     * UTILITY MODULE
     * =========================================================================
     */
    const Utils = {
        /**
         * Debounce function to limit how often a function is executed
         * @param {Function} func - Function to debounce
         * @param {number} delay - Delay in ms
         * @param {boolean} [immediate=false] - Whether to execute immediately
         * @return {Function} Debounced function
         */
        debounce(func, delay, immediate = false) {
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
        },

        /**
         * Throttle function to limit how often a function is executed
         * @param {Function} func - Function to throttle
         * @param {number} limit - Limit in ms
         * @param {boolean} [trailing=false] - Whether to execute after throttle period
         * @return {Function} Throttled function
         */
        throttle(func, limit, trailing = false) {
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
        },

        /**
         * Deep merge two objects.
         * @param {Object} target - The target object
         * @param {Object} source - The source object
         * @return {Object} The merged object
         */
        deepMerge(target, source) {
            const output = { ...target };

            if (this.isObject(target) && this.isObject(source)) {
                Object.keys(source).forEach(key => {
                    if (this.isObject(source[key])) {
                        if (!(key in target)) {
                            Object.assign(output, { [key]: source[key] });
                        } else {
                            output[key] = this.deepMerge(target[key], source[key]);
                        }
                    } else {
                        Object.assign(output, { [key]: source[key] });
                    }
                });
            }

            return output;
        },

        /**
         * Check if a variable is an object
         * @param {*} item - The item to check
         * @return {boolean} True if the item is an object
         */
        isObject(item) {
            return (item && typeof item === 'object' && !Array.isArray(item));
        },

        /**
         * Log with level filtering based on settings
         * @param {string} level - Log level
         * @param {string} message - Message to log
         * @param {any} data - Optional data to log
         */
        log(level, message, data = null) {
            const logLevels = { error: 0, warn: 1, info: 2, debug: 3 };
            const settingsLevel = settings.diagnostics?.logLevel ?? 'info';

            if (logLevels[level] <= logLevels[settingsLevel]) {
                const logMessage = `[Dark Mode Toggle] ${message}`;
                const logger = console[level] || console.log;
                logger(logMessage, data ?? '');

                if (settings.diagnostics?.enabled && (level === 'error' || level === 'warn')) {
                    diagnosticsData.issues.push({
                        type: level,
                        message: message,
                        timestamp: new Date().toISOString(),
                        data: data ? JSON.stringify(data) : null
                    });
                }
            }
        },

        /**
         * Create a button element with specified properties
         * @param {string} id - Button ID
         * @param {string} text - Button text content
         * @param {Function} onClick - Click handler
         * @return {HTMLButtonElement} Created button
         */
        createButton(id, text, onClick) {
            const button = document.createElement('button');
            button.id = id;
            button.textContent = text;
            button.addEventListener('click', onClick, { passive: true });
            eventListeners.push({ element: button, type: 'click', handler: onClick });
            return button;
        },

        /**
         * Gets the host for site matching
         * @return {string} Hostname
         */
        getCurrentSiteIdentifier() {
            return window.location.hostname;
        },
    };


    /**
     * =========================================================================
     * CONSTANTS & STATE
     * =========================================================================
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
        PER_SITE_SETTINGS_TOGGLE: 'perSiteSettingsToggle', // New element for per-site settings toggle
        USE_GLOBAL_POSITION_TOGGLE: 'useGlobalPositionToggle', // New element for global position toggle
        SETTINGS_OVERLAY: 'darkModeToggleOverlay',
        CLOSE_SETTINGS_BUTTON: 'closeDarkModeSettingsButton'
    };

    const STORAGE_KEYS = {
        SETTINGS: 'settings',
        DARK_MODE: 'darkMode',
        PER_SITE_SETTINGS_PREFIX: 'perSiteSettings_',
        CUSTOM_CSS_PREFIX: 'customCss_',
        PROBLEMATIC_SITES: 'problematicSites',
        DEVICE_INFO: 'deviceInfo' // New storage key for device information
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
        DEFAULT: {
            name: 'Default',
            brightness: 100,
            contrast: 90,
            sepia: 10
        },
        HIGH_CONTRAST: {
            name: 'High Contrast',
            brightness: 110,
            contrast: 110,
            sepia: 0
        },
        LOW_CONTRAST: {
            name: 'Low Contrast',
            brightness: 90,
            contrast: 80,
            sepia: 5
        },
        SEPIA: {
            name: 'Sepia',
            brightness: 100,
            contrast: 95,
            sepia: 40
        },
        NIGHT: {
            name: 'Night Mode',
            brightness: 80,
            contrast: 100,
            sepia: 0
        },
        ULTRA_DARK: {
            name: 'Ultra Dark',
            brightness: 70,
            contrast: 120,
            sepia: 0
        },
        MIDNIGHT: {
            name: 'Midnight',
            brightness: 60,
            contrast: 130,
            sepia: 0
        }
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
                ytd-watch-flexy {
                    background-color: var(--yt-spec-general-background-a, #181818) !important;
                }
                /* Fix for comment section */
                ytd-comments {
                    background-color: var(--yt-spec-general-background-a, #181818) !important;
                }
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
                body {
                    background-color: #15202b !important;
                }
                div[data-testid="primaryColumn"] {
                    background-color: #15202b !important;
                }
                /* Fix text color */
                div[data-testid="tweetText"] {
                    color: #ffffff !important;
                }
            `
        },
        'reddit.com': {
            description: 'Reddit has its own dark mode which may conflict',
            fixMethod: 'useCustomCss',
            customCss: `
                /* Force dark background on Reddit */
                body {
                    background-color: #1a1a1b !important;
                }
                .Post {
                    background-color: #272729 !important;
                }
                /* Fix text color */
                .Post * {
                    color: #d7dadc !important;
                }
            `,
            defaultButtonPosition: 'bottom-right' // Default position for Reddit
        },
        'github.com': {
            description: 'GitHub has its own dark mode which may conflict',
            fixMethod: 'useCustomCss',
            customCss: `
                /* Force dark background on GitHub */
                body {
                    background-color: #0d1117 !important;
                    color: #c9d1d9 !important;
                }
                .Header {
                    background-color: #161b22 !important;
                }
                .repository-content {
                    background-color: #0d1117 !important;
                }
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
        autoMode: false,
        buttonOpacity: 0.8,
        buttonSize: {
            width: 80,
            height: 40
        },
        transitionSpeed: 0.3,
        settingsButtonOffset: 20,
        settingsButtonVisible: true,
        settingsButtonVerticalPosition: 'center',
        settingsButtonVerticalOffset: 40,
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
            scanInterval: 2000
        },
        diagnostics: {
            enabled: false,
            logLevel: 'info',
            collectStats: true
        },
        // New settings for per-site configuration
        perSiteSettings: {
            enabled: true,
            useGlobalPosition: false
        },
        // New settings for device-based optimization
        deviceOptimization: {
            enabled: true,
            reducedMotion: false,
            reducedAnimations: false,
            lowPowerMode: false
        }
    };

    /**
     * ------------------------
     * GLOBAL STATE & UI REFERENCES
     * ------------------------
     */
    let settings = {};
    let uiVisible = false;
    let darkModeEnabled = false;
    let uiElements = {};
    let isInitialized = false;
    let scheduleCheckInterval = null;
    let dynamicScanInterval = null;
    let shadowRoots = new Set(); // Track shadow DOM roots
    let currentSiteCustomCSS = ''; // Current site's custom CSS
    let diagnosticsData = {
        siteInfo: {},
        performance: {},
        issues: []
    };
    let customStyleElements = []; // Track injected style elements
    let extremeModeActive = false; // Track if extreme mode is currently active
    let originalStyles = new Map(); // Store original element styles for restoration
    let forcedElementsCount = 0; // Count forced elements for diagnostics
    let deviceInfo = {
        type: 'desktop',
        performance: DEVICE_PERFORMANCE.HIGH,
        touchCapable: false,
        screenSize: {
            width: 0,
            height: 0
        },
        pixelRatio: 1,
        batteryLevel: null,
        isLowPowerMode: false
    };
    let currentSiteSettings = null; // Store current site-specific settings
    let eventListeners = []; // Track event listeners for cleanup
    let performanceMode = DEVICE_PERFORMANCE.HIGH; // Current performance mode

    /**
     * =========================================================================
     * MAIN SCRIPT LOGIC
     * =========================================================================
     */

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
            return Utils.throttle(func, delay, performanceMode !== DEVICE_PERFORMANCE.LOW);
        } else { // debounce
            return Utils.debounce(func, delay, performanceMode === DEVICE_PERFORMANCE.HIGH);
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
                if (pattern.includes('*')) {
                    const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
                    return new RegExp(`^${regexPattern}$`).test(url);
                }
                return url.includes(pattern);
            } catch (e) {
                Utils.log('error', `Invalid exclusion pattern: ${pattern}`, e);
                return false;
            }
        });
    }

    /**
     * Check if site is known to be problematic
     * @return {Object|null} Site info if problematic, null otherwise
     */
    function getProblematicSiteInfo() {
        const hostname = Utils.getCurrentSiteIdentifier();
        const entry = Object.entries(PROBLEMATIC_SITES)
            .find(([site]) => hostname.includes(site));
        return entry ? { ...entry[1], key: entry[0] } : null;
    }

    /**
     * Apply fixes for problematic sites
     */
    function applyProblematicSiteFixes() {
        const siteInfo = getProblematicSiteInfo();
        if (!siteInfo) return;

        Utils.log('info', `Applying fixes for problematic site: ${siteInfo.key}`, siteInfo);

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
                Utils.log('warn', `Unknown fix method: ${siteInfo.fixMethod}`);
        }

        // Apply default button position for problematic site if available
        if (siteInfo.defaultButtonPosition && currentSiteSettings?.useGlobalPosition === false) {
            currentSiteSettings.position = siteInfo.defaultButtonPosition;
            SettingsManager.savePerSite();
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
            // Use getElementById for better performance if ID selector
            if (selector.startsWith('#') && !selector.includes(' ')) {
                const id = selector.substring(1);
                const element = document.getElementById(id);
                if (element) {
                    applyStylesToElement(element, styles);
                    return;
                }
            }

            // Use getElementsByClassName for better performance if class selector
            if (selector.startsWith('.') && !selector.includes(' ')) {
                const className = selector.substring(1);
                const elements = document.getElementsByClassName(className);
                if (elements.length > 0) {
                    Array.from(elements).forEach(el => applyStylesToElement(el, styles));
                    return;
                }
            }

            // Fall back to querySelectorAll for complex selectors
            const elements = Array.from(document.querySelectorAll(selector));

            // Also try to find elements in shadow DOM if enabled
            if (settings.dynamicSelectors?.detectShadowDOM) {
                shadowRoots.forEach(root => {
                    try {
                        elements.push(...root.querySelectorAll(selector));
                    } catch (error) {
                        Utils.log('debug', `Error querying shadow DOM: ${error.message}`, { selector, root });
                    }
                });
            }

            elements.forEach(applyStylesToElement, styles);

        } catch (error) {
            Utils.log('error', `Error forcing element styles: ${error.message}`, { selector, styles });
        }
    }

    /**
     * Apply styles to a specific element (extracted for reuse)
     * @param {Element} element - Element to style
     * @param {Object} styles - Styles to apply
     */
    function applyStylesToElement(element, styles) {
        if (!originalStyles.has(element)) {
            // Store original inline styles for potential restoration
            originalStyles.set(element, element.getAttribute('style') || '');
        }

        // Apply forced styles
        let styleString = '';
        for (const [property, value] of Object.entries(styles)) {
            styleString += `${property}: ${value}; `;
        }

        element.setAttribute('style', styleString);
        forcedElementsCount++;
    }

    /**
     * Inject custom CSS to the page
     * @param {string} css - CSS to inject
     * @param {string} id - Identifier for the style element
     */
    function injectCustomCSS(css, id) {
        // Remove existing style with same ID if it exists
        document.getElementById(id)?.remove();
        customStyleElements = customStyleElements.filter(el => el.id !== id);

        // Create and inject new style
        try {
            const style = document.createElement('style');
            style.id = id;
            style.textContent = css;
            (document.head || document.documentElement).appendChild(style);
            customStyleElements.push(style);

            Utils.log('debug', `Injected custom CSS with ID: ${id}`, { length: css.length });
        } catch (error) {
            Utils.log('error', `Error injecting custom CSS: ${error.message}`, { id });
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
                domain: Utils.getCurrentSiteIdentifier(),
                title: document.title,
                theme: detectSiteThemeSettings(),
                shadowDOMCount: shadowRoots.size,
                iframeCount: document.querySelectorAll('iframe').length,
                customStylesCount: customStyleElements.length,
                forcedElementsCount: forcedElementsCount,
                problematicSite: !!getProblematicSiteInfo(),
                screenWidth: window.innerWidth,
                screenHeight: window.innerHeight,
                deviceInfo
            };
        } catch (error) {
            Utils.log('error', `Error collecting site info: ${error.message}`);
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

        // Check for common theme classes/attributes on html or body
        const htmlElement = document.documentElement;
        const bodyElement = document.body;

        if (htmlElement) {
            if (htmlElement.classList.contains('dark') ||
                htmlElement.classList.contains('darkmode') ||
                htmlElement.classList.contains('dark-mode') ||
                htmlElement.getAttribute('data-theme') === 'dark' ||
                htmlElement.getAttribute('theme') === 'dark') {
                result.hasDarkMode = true;
                result.darkModeClasses = true;
            }
        }

        if (bodyElement) {
            if (bodyElement.classList.contains('dark') ||
                bodyElement.classList.contains('darkmode') ||
                bodyElement.classList.contains('dark-mode') ||
                bodyElement.getAttribute('data-theme') === 'dark' ||
                bodyElement.getAttribute('theme') === 'dark') {
                result.hasDarkMode = true;
                result.darkModeClasses = true;
            }
        }

        // Check for common dark mode toggles
        const darkModeToggleSelectors = [
            '[aria-label*="dark mode"]',
            '[aria-label*="night mode"]',
            '[title*="dark mode"]',
            '[title*="night mode"]',
            '[data-action*="dark-mode"]',
            '[data-action*="night-mode"]',
            '[class*="darkModeToggle"]',
            '[id*="dark-mode"]',
            '[id*="darkmode"]',
            'button:has(svg[aria-label*="dark"])',
            'svg[aria-label*="dark"]'
        ];

        // Use faster selector methods when possible
        const specialSelectors = document.querySelectorAll('[aria-label],[title],[data-action]');
        let hasToggle = false;

        for (const el of specialSelectors) {
            const ariaLabel = el.getAttribute('aria-label');
            const title = el.getAttribute('title');
            const dataAction = el.getAttribute('data-action');

            if ((ariaLabel && (ariaLabel.includes('dark mode') || ariaLabel.includes('night mode'))) ||
                (title && (title.includes('dark mode') || title.includes('night mode'))) ||
                (dataAction && (dataAction.includes('dark-mode') || dataAction.includes('night-mode')))) {
                hasToggle = true;
                break;
            }
        }

        if (!hasToggle) {
            // Fallback to more complex selectors
            const toggles = document.querySelectorAll(darkModeToggleSelectors.join(','));
            if (toggles.length > 0) {
                hasToggle = true;
            }
        }

        result.hasDarkModeToggle = hasToggle;

        return result;
    }

    /**
     * Generate a diagnostic report
     */
    function generateDiagnosticReport() {
        collectSiteInfo();

        const report = {
            timestamp: new Date().toISOString(),
            version: '3.1.0',
            settings: { ...settings },
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

        // Clean up sensitive information if needed
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
        const modalContainer = document.createElement('div');
        modalContainer.id = 'darkModeToggleDiagnostics';
        modalContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Modal content with responsive design
        const modal = document.createElement('div');
        modal.style.cssText = `
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            max-width: ${deviceInfo.type === 'mobile' ? '95%' : '80%'};
            max-height: ${deviceInfo.type === 'mobile' ? '90%' : '80%'};
            overflow: auto;
            color: #333;
            font-family: monospace;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        `;

        const heading = document.createElement('h2');
        heading.textContent = 'Dark Mode Toggle Diagnostic Report';
        heading.style.marginTop = '0';

        const reportPre = document.createElement('pre');
        reportPre.textContent = reportString;
        reportPre.style.cssText = `
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            white-space: pre-wrap;
            font-size: ${deviceInfo.type === 'mobile' ? '10px' : '12px'};
            max-height: ${deviceInfo.type === 'mobile' ? '300px' : '500px'};
            overflow: auto;
        `;

        const copyButton = createButton('copyDiagnosticsButton', 'Copy to Clipboard', () => {
            navigator.clipboard.writeText(reportString)
                .then(() => {
                    copyButton.textContent = 'Copied!';
                    setTimeout(() => {
                        copyButton.textContent = 'Copy to Clipboard';
                    }, 2000);
                })
                .catch(err => {
                    log('error', `Error copying to clipboard: ${err.message}`);
                    copyButton.textContent = 'Error copying';
                });
        });

        copyButton.style.cssText = `
            padding: 8px 16px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            margin-right: 10px;
            cursor: pointer;
        `;

        const closeButton = createButton('closeDiagnosticsButton', 'Close', () => {
            document.body.removeChild(modalContainer);
        });

        closeButton.style.cssText = `
            padding: 8px 16px;
            background-color: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
        `;
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
     * @param {Node} root - Root node to start scanning from
     */
    function findShadowRoots(root = document.documentElement) {
        if (!settings.dynamicSelectors?.detectShadowDOM) return;

        // Use a more efficient approach based on device performance
        if (performanceMode === DEVICE_PERFORMANCE.LOW) {
            // In low performance mode, only check critical elements
            const criticalElements = root.querySelectorAll('main, header, nav, footer, aside, [role="main"]');
            checkElementsForShadowRoot(criticalElements);
        } else {
            // In medium/high performance mode, use different approaches
            if (root.querySelectorAll) {
                // Try to be more selective by targeting common elements that might have shadow DOM
                const potentialShadowHosts = root.querySelectorAll('custom-element, [is], [shadow], [shadowroot], video-player, audio-player');
                checkElementsForShadowRoot(potentialShadowHosts);

                // If in high performance mode, check more elements
                if (performanceMode === DEVICE_PERFORMANCE.HIGH) {
                    const allElements = root.querySelectorAll('*');
                    checkElementsForShadowRoot(allElements);
                }
            }
        }
    }

    /**
     * Check elements for shadow roots (extracted for reuse)
     * @param {NodeList} elements - Elements to check
     */
    function checkElementsForShadowRoot(elements) {
        for (const element of elements) {
            if (element.shadowRoot && !shadowRoots.has(element.shadowRoot)) {
                shadowRoots.add(element.shadowRoot);
                log('debug', 'Found shadow root:', element);

                // Apply extreme mode to shadow DOM if active
                if (extremeModeActive) {
                    applyShadowDomExtremeDark(element.shadowRoot);
                }

                // Continue scanning inside shadow DOM
                findShadowRoots(element.shadowRoot);

                // Set up observer for changes within shadow DOM
                observeShadowDom(element.shadowRoot);
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
                // Use performance-based throttling
                const processChanges = adaptiveProcessing(() => {
                    // Check for new shadow roots
                    for (const mutation of mutations) {
                        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                            for (const node of mutation.addedNodes) {
                                if (node.nodeType === Node.ELEMENT_NODE) {
                                    findShadowRoots(node);

                                    // Apply extreme dark mode to new elements if active
                                    if (extremeModeActive) {
                                        applyExtremeDarkToElement(node);
                                    }
                                }
                            }
                        }
                    }
                }, 'throttle', {
                    [DEVICE_PERFORMANCE.HIGH]: 200,
                    [DEVICE_PERFORMANCE.MEDIUM]: 500,
                    [DEVICE_PERFORMANCE.LOW]: 1000
                });

                processChanges();
            });

            observer.observe(shadowRoot, {
                childList: true,
                subtree: true
            });
        } catch (error) {
            log('error', `Error observing shadow DOM: ${error.message}`, shadowRoot);
        }
    }

    /**
     * Apply extreme dark mode to shadow DOM
     * @param {ShadowRoot} shadowRoot - Shadow root to process
     */
    function applyShadowDomExtremeDark(shadowRoot) {
        if (!shadowRoot) return;

        try {
            // Inject styles into shadow DOM
            const style = document.createElement('style');
            style.textContent = `
                * {
                    background-color: #1a1a1a !important;
                    color: #ddd !important;
                    border-color: #444 !important;
                }
                a, a:visited {
                    color: #3a8ee6 !important;
                }
                input, textarea, select, button {
                    background-color: #2d2d2d !important;
                    color: #ddd !important;
                }
            `;
            shadowRoot.appendChild(style);

            // Track this style
            customStyleElements.push(style);

            Utils.log('debug', 'Applied extreme dark mode to shadow DOM', shadowRoot);
        } catch (error) {
            Utils.log('error', `Error applying extreme dark to shadow DOM: ${error.message}`, shadowRoot);
        }
    }

    /**
     * Apply extreme dark mode to a specific element and its children
     * @param {Element} element - Element to process
     */
    function applyExtremeDarkToElement(element) {
        if (!element || element.nodeType !== Node.ELEMENT_NODE) return;

        try {
            // Store original styles
            if (!originalStyles.has(element)) {
                originalStyles.set(element, element.getAttribute('style') || '');
            }

            // Apply dark styles
            let currentStyle = element.getAttribute('style') || '';
            let newStyle = currentStyle + '; background-color: #1a1a1a !important; color: #ddd !important; border-color: #444 !important;';
            element.setAttribute('style', newStyle);

            // Process all child elements
            if (element.children && element.children.length > 0) {
                // Process children with performance considerations
                if (performanceMode === DEVICE_PERFORMANCE.LOW && element.children.length > 20) {
                    // For low-performance devices with many children, process only important ones
                    const importantElements = element.querySelectorAll('p, h1, h2, h3, a, button, input, textarea');
                    for (const child of importantElements) {
                        applyExtremeDarkToElement(child);
                    }
                } else {
                    // Process all children
                    Array.from(element.children).forEach(child => {
                        applyExtremeDarkToElement(child);
                    });
                }
            }

            forcedElementsCount++;
        } catch (error) {
            log('error', `Error applying extreme dark to element: ${error.message}`, element);
        }
    }

    /**
     * Perform a deep scan of the document to apply extreme dark mode
     */
    function performDeepScan() {
        if (!settings.dynamicSelectors?.deepScan || !extremeModeActive) return;

        Utils.log('info', 'Performing deep scan for extreme dark mode');

        try {
            // Skip deep scan for low-performance devices or reduce scope
            if (performanceMode === DEVICE_PERFORMANCE.LOW) {
                // For low-performance devices, only target the most important elements
                const criticalElements = document.querySelectorAll('main, article, section, [role="main"], header, nav, footer');
                deepScanElements(criticalElements);
            } else {
                // For medium/high performance, scan more elements but still be selective
                const elements = performanceMode === DEVICE_PERFORMANCE.HIGH
                    ? document.querySelectorAll('body *')
                    : document.querySelectorAll('main *, article *, section *, [role="main"] *, header *, nav *, footer *');

                deepScanElements(elements);
            }

            // Shadow DOM processing based on performance
            if (performanceMode !== DEVICE_PERFORMANCE.LOW) {
                shadowRoots.forEach(root => {
                    try {
                        const shadowElements = root.querySelectorAll('*');
                        deepScanElements(shadowElements);
                    } catch (error) {
                        Utils.log('debug', `Error processing shadow DOM elements: ${error.message}`, root);
                    }
                });
            }

            Utils.log('info', `Deep scan completed, processed ${forcedElementsCount} elements`);
        } catch (error) {
            Utils.log('error', `Error during deep scan: ${error.message}`);
        }
    }

    /**
     * Process elements for deep scan (extracted for reuse)
     * @param {NodeList} elements - Elements to process
     */
    function deepScanElements(elements) {
        for (const element of elements) {
            try {
                const computedStyle = window.getComputedStyle(element);
                const backgroundColor = computedStyle.backgroundColor;
                const color = computedStyle.color;

                // Check if element has light background and dark text
                if (isLightColor(backgroundColor) && isDarkColor(color)) {
                    // Store original styles
                    if (!originalStyles.has(element)) {
                        originalStyles.set(element, element.getAttribute('style') || '');
                    }

                    // Force dark background and light text
                    let currentStyle = element.getAttribute('style') || '';
                    let newStyle = currentStyle + '; background-color: #1a1a1a !important; color: #ddd !important;';
                    element.setAttribute('style', newStyle);
                    forcedElementsCount++;
                }

                // Look for problematic fixed elements (lightboxes, modals, etc.)
                if (computedStyle.position === 'fixed' || computedStyle.position === 'sticky') {
                    if (isLightColor(backgroundColor)) {
                        // Force dark background for fixed elements
                        let currentStyle = element.getAttribute('style') || '';
                        let newStyle = currentStyle + '; background-color: #1a1a1a !important;';
                        element.setAttribute('style', newStyle);
                        forcedElementsCount++;
                    }
                }
            } catch (error) {
                // Ignore individual element errors
                continue;
            }
        }
    }

    /**
     * Check if a color is light
     * @param {string} color - CSS color value
     * @return {boolean} Whether color is light
     */
    function isLightColor(color) {
        // Process color string to get RGB values
        let r, g, b;

        if (color.startsWith('rgb')) {
            const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
            if (match) {
                [, r, g, b] = match.map(Number);
            } else {
                return false;
            }
        } else if (color.startsWith('#')) {
            // Convert hex to RGB
            let hex = color.substring(1);
            if (hex.length === 3) {
                hex = hex.split('').map(c => c + c).join('');
            }
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        } else if (color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
            return false;
        } else {
            // For named colors, we'd need a mapping, but for simplicity
            // we'll just return false for unsupported formats
            return false;
        }

        // Calculate luminance - lighter colors have higher values
        // Formula: 0.299*R + 0.587*G + 0.114*B
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        // Luminance threshold (0.5 - 0.6 is a common range)
        return luminance > 0.55;
    }

    /**
     * Check if a color is dark
     * @param {string} color - CSS color value
     * @return {boolean} Whether color is dark
     */
    function isDarkColor(color) {
        return !isLightColor(color);
    }

    /**
     * Detect device type and capabilities
     */
    function detectDevice() {
        // Get screen dimensions
        deviceInfo.screenSize = {
            width: window.screen.width,
            height: window.screen.height
        };

        // Detect pixel ratio for high DPI screens
        deviceInfo.pixelRatio = window.devicePixelRatio || 1;

        // Detect touch capability
        deviceInfo.touchCapable = ('ontouchstart' in window) ||
                                (navigator.maxTouchPoints > 0) ||
                                (navigator.msMaxTouchPoints > 0);

        // Detect device type based on user agent and screen size
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isSmallScreen = window.innerWidth < 768;

        if (isMobile || isSmallScreen) {
            deviceInfo.type = 'mobile';
        } else {
            deviceInfo.type = 'desktop';
        }

        // Detect reduced motion preference
        deviceInfo.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Try to detect battery status if available
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                deviceInfo.batteryLevel = battery.level;
                deviceInfo.isLowPowerMode = battery.level < 0.2 && !battery.charging;

                // Update performance mode based on battery
                updatePerformanceMode();
            });
        }

        // Detect performance capabilities
        try {
            // Use device memory API if available
            if ('deviceMemory' in navigator) {
                const memory = navigator.deviceMemory;
                if (memory <= 2) {
                    deviceInfo.performance = DEVICE_PERFORMANCE.LOW;
                } else if (memory <= 4) {
                    deviceInfo.performance = DEVICE_PERFORMANCE.MEDIUM;
                } else {
                    deviceInfo.performance = DEVICE_PERFORMANCE.HIGH;
                }
            } else {
                // Fallback based on device type and pixel ratio
                if (deviceInfo.type === 'mobile') {
                    if (deviceInfo.pixelRatio >= 3) {
                        deviceInfo.performance = DEVICE_PERFORMANCE.MEDIUM; // High-end mobile
                    } else {
                        deviceInfo.performance = DEVICE_PERFORMANCE.LOW; // Standard mobile
                    }
                } else {
                    deviceInfo.performance = DEVICE_PERFORMANCE.HIGH; // Desktop default
                }
            }

            // Detect low-end devices by timing a complex operation
            const startTime = performance.now();
            for (let i = 0; i < 1000000; i++) {
                Math.sqrt(i);
            }
            const endTime = performance.now();
            const testDuration = endTime - startTime;

            // If the test took too long, downgrade performance estimation
            if (testDuration > 150) {
                deviceInfo.performance = DEVICE_PERFORMANCE.LOW;
            } else if (testDuration > 50 && deviceInfo.performance === DEVICE_PERFORMANCE.HIGH) {
                deviceInfo.performance = DEVICE_PERFORMANCE.MEDIUM;
            }

            updatePerformanceMode();
        } catch (error) {
            log('warn', 'Error detecting device performance', error);
            // Fallback to medium performance
            deviceInfo.performance = DEVICE_PERFORMANCE.MEDIUM;
            updatePerformanceMode();
        }

        log('info', 'Device detected', deviceInfo);
    }

    /**
     * Update performance mode based on device info and settings
     */
    function updatePerformanceMode() {
        // Start with device detected performance
        let mode = deviceInfo.performance;

        // Check device optimization settings
        if (settings.deviceOptimization?.enabled) {
            // If user has enabled low power mode, reduce performance
            if (settings.deviceOptimization.lowPowerMode || deviceInfo.isLowPowerMode) {
                mode = mode === DEVICE_PERFORMANCE.HIGH ? DEVICE_PERFORMANCE.MEDIUM : DEVICE_PERFORMANCE.LOW;
            }

            // If user prefers reduced motion, consider reducing performance
            if (settings.deviceOptimization.reducedMotion || deviceInfo.prefersReducedMotion) {
                if (mode === DEVICE_PERFORMANCE.HIGH) {
                    mode = DEVICE_PERFORMANCE.MEDIUM;
                }
            }
        }

        // Update global performance mode
        performanceMode = mode;

        // Adjust settings based on performance mode
        if (performanceMode === DEVICE_PERFORMANCE.LOW) {
            // Reduce animation speed
            settings.transitionSpeed = 0.1;
            // Increase debounce/throttle delays
            // Disable deep scanning in extreme mode
            if (settings.dynamicSelectors) {
                settings.dynamicSelectors.scanInterval = 5000; // Longer interval between scans
                settings.dynamicSelectors.deepScan = false; // Disable deep scanning
            }
        } else if (performanceMode === DEVICE_PERFORMANCE.MEDIUM) {
            // Moderate settings
            settings.transitionSpeed = 0.2;
            if (settings.dynamicSelectors) {
                settings.dynamicSelectors.scanInterval = 3000;
            }
        }

        // Update UI button sizing for touch devices
        if (deviceInfo.touchCapable) {
            const touchSize = Math.max(40, Math.min(50, Math.floor(window.innerWidth * 0.12)));
            settings.buttonSize = {
                width: touchSize * 2,
                height: touchSize
            };
            // Larger offsets for touch devices
            settings.offsetX = Math.max(30, Math.floor(window.innerWidth * 0.04));
            settings.offsetY = Math.max(30, Math.floor(window.innerHeight * 0.04));
        }

        log('info', `Performance mode set to: ${performanceMode}`);
    }

    /**
     * =========================================================================
     * SETTINGS MANAGER
     * =========================================================================
     */
    const SettingsManager = {
        async load() {
            await this.loadGlobal();
            await this.loadPerSite();
        },

        async loadGlobal() {
            try {
                const storedSettings = await GM.getValue(STORAGE_KEYS.SETTINGS, {});
                settings = Utils.deepMerge(DEFAULT_SETTINGS, storedSettings);
                const storedDeviceInfo = await GM.getValue(STORAGE_KEYS.DEVICE_INFO, null);
                if (storedDeviceInfo) {
                    deviceInfo = { ...deviceInfo, ...storedDeviceInfo };
                }
                Utils.log('info', 'Global settings loaded');
            } catch (error) {
                Utils.log('error', 'Failed to load global settings', error);
                settings = { ...DEFAULT_SETTINGS };
            }
        },

        async loadPerSite() {
            const siteKey = STORAGE_KEYS.PER_SITE_SETTINGS_PREFIX + Utils.getCurrentSiteIdentifier();
            try {
                const stored = await GM.getValue(siteKey, null);
                if (stored) {
                    currentSiteSettings = stored;
                    this.applyPerSite();
                    const cssKey = STORAGE_KEYS.CUSTOM_CSS_PREFIX + Utils.getCurrentSiteIdentifier();
                    currentSiteCustomCSS = await GM.getValue(cssKey, '');
                    Utils.log('info', `Loaded per-site settings for ${Utils.getCurrentSiteIdentifier()}`);
                } else {
                    this.initializePerSite();
                    Utils.log('info', `No per-site settings found for ${Utils.getCurrentSiteIdentifier()}. Initialized.`);
                }
            } catch (error) {
                Utils.log('error', 'Failed to load per-site settings', error);
                this.initializePerSite();
            }
        },

        applyPerSite() {
            if (!currentSiteSettings) return;

            if (settings.perSiteSettings?.enabled && !currentSiteSettings.useGlobalPosition) {
                settings.position = currentSiteSettings.position ?? settings.position;
                settings.offsetX = currentSiteSettings.offsetX ?? settings.offsetX;
                settings.offsetY = currentSiteSettings.offsetY ?? settings.offsetY;
            }
            settings.brightness = currentSiteSettings.brightness ?? settings.brightness;
            settings.contrast = currentSiteSettings.contrast ?? settings.contrast;
            settings.sepia = currentSiteSettings.sepia ?? settings.sepia;
            darkModeEnabled = currentSiteSettings.darkModeEnabled ?? darkModeEnabled;
            if (settings.extremeMode) {
                settings.extremeMode.enabled = currentSiteSettings.extremeModeEnabled ?? settings.extremeMode.enabled;
            }
        },

        initializePerSite() {
            currentSiteSettings = {
                position: settings.position,
                offsetX: settings.offsetX,
                offsetY: settings.offsetY,
                useGlobalPosition: true,
                brightness: settings.brightness,
                contrast: settings.contrast,
                sepia: settings.sepia,
                darkModeEnabled: darkModeEnabled,
                extremeModeEnabled: settings.extremeMode?.enabled,
            };
        },

        save: Utils.debounce(async () => {
            try {
                await GM.setValue(STORAGE_KEYS.SETTINGS, settings);
                await GM.setValue(STORAGE_KEYS.DEVICE_INFO, deviceInfo);
                await SettingsManager.savePerSite();
                Utils.log('debug', 'All settings saved');

                // Call update functions after saving
                updateButtonPosition();
                DarkModeManager.updateDarkReaderConfig();
                updateExclusionListDisplay();
                setupScheduleChecking();
                setupDynamicScanning();
            } catch (error) {
                Utils.log('error', 'Failed to save settings', error);
            }
        }, 250),

        async savePerSite() {
            if (!currentSiteSettings) {
                this.initializePerSite();
            } else {
                if (!currentSiteSettings.useGlobalPosition) {
                    currentSiteSettings.position = settings.position;
                    currentSiteSettings.offsetX = settings.offsetX;
                    currentSiteSettings.offsetY = settings.offsetY;
                }
                currentSiteSettings.brightness = settings.brightness;
                currentSiteSettings.contrast = settings.contrast;
                currentSiteSettings.sepia = settings.sepia;
                currentSiteSettings.darkModeEnabled = darkModeEnabled;
                currentSiteSettings.extremeModeEnabled = settings.extremeMode?.enabled;
            }

            const siteKey = STORAGE_KEYS.PER_SITE_SETTINGS_PREFIX + Utils.getCurrentSiteIdentifier();
            await GM.setValue(siteKey, currentSiteSettings);

            if (currentSiteCustomCSS) {
                const cssKey = STORAGE_KEYS.CUSTOM_CSS_PREFIX + Utils.getCurrentSiteIdentifier();
                await GM.setValue(cssKey, currentSiteCustomCSS);
            }
        },

        async reset() {
            if (!confirm('Are you sure you want to reset all settings?')) return;
            try {
                const allKeys = (await GM.listValues?.()) ?? [];
                const keysToDelete = allKeys.filter(k =>
                    k.startsWith(STORAGE_KEYS.PER_SITE_SETTINGS_PREFIX) ||
                    k.startsWith(STORAGE_KEYS.CUSTOM_CSS_PREFIX)
                );
                await Promise.all(keysToDelete.map(key => GM.deleteValue(key)));

                settings = { ...DEFAULT_SETTINGS };
                darkModeEnabled = false;
                currentSiteCustomCSS = '';
                this.initializePerSite();

                await GM.setValue(STORAGE_KEYS.SETTINGS, settings);
                await GM.setValue(STORAGE_KEYS.DARK_MODE, false);

                // Clean up UI and state
                customStyleElements.forEach(style => style.remove());
                customStyleElements = [];
                originalStyles.forEach((style, el) => el.setAttribute('style', style || ''));
                originalStyles.clear();
                forcedElementsCount = 0;

                // Update UI
                updateButtonPosition();
                DarkModeManager.updateDarkReaderConfig();
                updateUIValues();
            try {
                ui.focus({ preventScroll: true });
            } catch (error) {
                ui.focus();
            }
                updateButtonState();
                updateExclusionListDisplay();
                toggleDarkMode(false);
                setupScheduleChecking();
                setupDynamicScanning();

                alert('All settings have been reset.');
            } catch (error) {
                Utils.log('error', 'Error during settings reset', error);
                alert('An error occurred during reset.');
            }
        },

        async export() {
            try {
                const allKeys = (await GM.listValues?.()) ?? [];
                const perSite = {};
                const customCss = {};
                await Promise.all(allKeys.map(async (key) => {
                    if (key.startsWith(STORAGE_KEYS.PER_SITE_SETTINGS_PREFIX)) {
                        perSite[key] = await GM.getValue(key);
                    } else if (key.startsWith(STORAGE_KEYS.CUSTOM_CSS_PREFIX)) {
                        customCss[key] = await GM.getValue(key);
                    }
                }));

                const exportData = {
                    global: settings,
                    perSite,
                    customCss,
                    darkModeEnabled,
                    deviceInfo,
                    version: '3.1.0'
                };

                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'dark-mode-toggle-settings.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (error) {
                Utils.log('error', 'Failed to export settings', error);
                alert('Failed to export settings.');
            }
        },

        async import(file) {
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (!data.global || !data.version) throw new Error('Invalid file');

                    settings = Utils.deepMerge(DEFAULT_SETTINGS, data.global);
                    deviceInfo = { ...deviceInfo, ...(data.deviceInfo ?? {}) };
                    darkModeEnabled = data.darkModeEnabled ?? darkModeEnabled;

                    await GM.setValue(STORAGE_KEYS.SETTINGS, settings);
                    await GM.setValue(STORAGE_KEYS.DEVICE_INFO, deviceInfo);
                    await GM.setValue(STORAGE_KEYS.DARK_MODE, darkModeEnabled);

                    if (data.perSite) {
                        await Promise.all(Object.entries(data.perSite).map(([k, v]) => GM.setValue(k, v)));
                    }
                    if (data.customCss) {
                        await Promise.all(Object.entries(data.customCss).map(([k, v]) => GM.setValue(k, v)));
                    }

                    await this.loadPerSite(); // Reload per-site settings for current site
                    updateUIValues();
                    toggleDarkMode(darkModeEnabled);
                    alert('Settings imported successfully!');
                } catch (error) {
                    Utils.log('error', 'Failed to import settings', error);
                    alert('Failed to import settings: Invalid file format.');
                }
            };
            reader.readAsText(file);
        }
    };

    /**
     * =========================================================================
     * DARK MODE MANAGER
     * =========================================================================
     */
    const DarkModeManager = {
        async toggle(force) {
            const newState = force !== undefined ? force : !darkModeEnabled;
            if (newState === darkModeEnabled) return;

            darkModeEnabled = newState;

            if (darkModeEnabled && isSiteExcluded(window.location.href)) {
                darkModeEnabled = false;
                Utils.log('info', 'Site excluded, dark mode remains disabled.');
            }

            extremeModeActive = darkModeEnabled && settings.extremeMode?.enabled;

            if (darkModeEnabled) {
                this.enable();
            } else {
                this.disable();
            }

            await GM.setValue(STORAGE_KEYS.DARK_MODE, darkModeEnabled);
            updateButtonState();
            await SettingsManager.savePerSite();
        },

        enable() {
            this.updateDarkReaderConfig();
            if (extremeModeActive) this.applyExtremeMode();
            applyProblematicSiteFixes();
            if (currentSiteCustomCSS && (extremeModeActive || settings.extremeMode?.useCustomCSS)) {
                injectCustomCSS(currentSiteCustomCSS, 'custom-site-css');
            }
            Utils.log('info', `Dark mode enabled${extremeModeActive ? ' with extreme mode' : ''}`);
        },

        disable() {
            DarkReader.disable();
            this.removeExtremeMode();
            Utils.log('info', 'Dark mode disabled.');
        },

        updateDarkReaderConfig() {
            if (!darkModeEnabled || isSiteExcluded(window.location.href)) {
                DarkReader.disable();
                return;
            }

            const config = {
                brightness: settings.brightness,
                contrast: settings.contrast,
                sepia: settings.sepia,
                fontFamily: settings.fontFamily,
            };

            if (settings.extremeMode?.enabled) {
                config.ignoreImageAnalysis = settings.extremeMode.ignoreImageAnalysis;
                config.mode = 1; // Dynamic mode
            }

            if (performanceMode === DEVICE_PERFORMANCE.LOW) {
                config.mode = 0; // Classic mode is faster
                config.useFont = false;
            }

            DarkReader.enable(config);
        },

        applyExtremeMode() {
            if (!settings.extremeMode?.enabled) return;
            extremeModeActive = true;
            Utils.log('info', 'Applying extreme mode');

            const extremeCss = `
            html, body {
                background-color: #121212 !important;
                color: #ddd !important;
            }
            p, h1, h2, h3, h4, h5, h6, span, label, li, td, th {
                color: #ddd !important;
            }
            input, textarea, select {
                background-color: #2d2d2d !important;
                color: #ddd !important;
                border-color: #444 !important;
            }
            button, [role="button"], .button, [type="button"], [type="submit"] {
                background-color: #2d2d2d !important;
                color: #ddd !important;
                border-color: #555 !important;
            }
            a, a:visited {
                color: #3a8ee6 !important;
            }
            [class*="dialog"], [class*="modal"], [class*="popup"], [class*="tooltip"],
            [class*="menu"], [class*="drawer"], [class*="sidebar"], [class*="panel"],
            [role="dialog"], [role="alert"], [role="alertdialog"], [role="menu"] {
                background-color: #1a1a1a !important;
                color: #ddd !important;
                border-color: #444 !important;
            }
            [style*="position: fixed"], [style*="position:fixed"],
            [style*="position: sticky"], [style*="position:sticky"] {
                background-color: #1a1a1a !important;
            }
        `;
            injectCustomCSS(extremeCss, 'extreme-mode-css');

            if (settings.extremeMode.forceDarkElements) {
                forceElementStyles('body', { backgroundColor: '#121212 !important', color: '#ddd !important' });
                forceElementStyles('main, article, section, [role="main"]', { backgroundColor: '#1a1a1a !important', color: '#ddd !important' });
                forceElementStyles('header, nav, footer, aside', { backgroundColor: '#1a1a1a !important', color: '#ddd !important' });
                findShadowRoots();
                if (settings.dynamicSelectors?.deepScan && performanceMode !== DEVICE_PERFORMANCE.LOW) {
                    performDeepScan();
                }
            }
        },

        removeExtremeMode() {
            if (!extremeModeActive && customStyleElements.length === 0 && originalStyles.size === 0) return;
            extremeModeActive = false;
            Utils.log('info', 'Removing extreme mode');
            customStyleElements.forEach(style => style.remove());
            customStyleElements = [];
            originalStyles.forEach((style, el) => el.setAttribute('style', style || ''));
            originalStyles.clear();
            forcedElementsCount = 0;
        }
    };

    const toggleDarkMode = (...args) => DarkModeManager.toggle(...args);

    /**
     * Check scheduled dark mode and apply if needed
     */
    function checkScheduledDarkMode() {
        if (!settings.scheduledDarkMode?.enabled) return;

        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTime = currentHours * 60 + currentMinutes; // Convert to minutes since midnight

        // Parse schedule times
        const [startHours, startMinutes] = settings.scheduledDarkMode.startTime.split(':').map(Number);
        const [endHours, endMinutes] = settings.scheduledDarkMode.endTime.split(':').map(Number);

        const startTime = startHours * 60 + startMinutes;
        const endTime = endHours * 60 + endMinutes;

        let shouldBeDark;

        // Handle time ranges that cross midnight
        if (startTime > endTime) {
            // Example: 22:00 to 06:00 - dark mode is active across midnight
            shouldBeDark = currentTime >= startTime || currentTime < endTime;
        } else {
            // Example: 06:00 to 22:00 - dark mode is active within the same day
            shouldBeDark = currentTime >= startTime && currentTime < endTime;
        }

        // Only toggle if the current state doesn't match what it should be
        if (shouldBeDark !== darkModeEnabled) {
            Utils.log('info', `Scheduled dark mode: Setting to ${shouldBeDark ? 'enabled' : 'disabled'}`);
            toggleDarkMode(shouldBeDark);
        }
    }

    /**
     * Setup the interval for checking scheduled dark mode
     */
    function setupScheduleChecking() {
        clearInterval(scheduleCheckInterval);
        scheduleCheckInterval = null;

        if (settings.scheduledDarkMode?.enabled) {
            checkScheduledDarkMode();
            scheduleCheckInterval = setInterval(checkScheduledDarkMode, 60000);
        }
    }

    /**
     * Setup dynamic scanning interval
     */
    function setupDynamicScanning() {
        clearInterval(dynamicScanInterval);
        dynamicScanInterval = null;

        if (settings.dynamicSelectors?.enabled) {
            let scanInterval = settings.dynamicSelectors.scanInterval ?? 2000;
            if (performanceMode === DEVICE_PERFORMANCE.LOW) scanInterval = Math.max(scanInterval, 5000);
            else if (performanceMode === DEVICE_PERFORMANCE.MEDIUM) scanInterval = Math.max(scanInterval, 3000);

            dynamicScanInterval = setInterval(() => {
                if (settings.dynamicSelectors.detectShadowDOM) findShadowRoots();
                if (darkModeEnabled && extremeModeActive && settings.dynamicSelectors.deepScan && performanceMode !== DEVICE_PERFORMANCE.LOW) {
                    throttledDeepScan();
                }
            }, scanInterval);
        }
    }

    // Throttle deep scan to avoid performance issues
    const throttledDeepScan = Utils.throttle(performDeepScan, 5000);

    /**
     * Apply a theme preset to the current settings
     * @param {string} presetKey - The key of the preset to apply
     */
    function applyThemePreset(presetKey) {
        const preset = THEME_PRESETS[presetKey];
        if (!preset) return;

        settings.brightness = preset.brightness;
        settings.contrast = preset.contrast;
        settings.sepia = preset.sepia;

        updateUIValues();
        SettingsManager.save();
        DarkModeManager.updateDarkReaderConfig();
    }

    /**
     * ------------------------
     * UI MANAGEMENT
     * ------------------------
     */

    /**
     * Create the dark mode toggle button
     */
    function createToggleButton() {
        if (document.getElementById(ELEMENT_IDS.BUTTON)) return;

        const button = document.createElement('button');
        button.id = ELEMENT_IDS.BUTTON;
        button.innerHTML = `<span class="icon">${settings.iconMoon}</span>`;
        button.setAttribute('aria-label', 'Toggle Dark Mode');
        button.setAttribute('title', 'Toggle Dark Mode');

        // Use a simpler click handler to improve performance
        button.addEventListener('click', (e) => {
            e.preventDefault();
            toggleDarkMode();
        }, { passive: false });

        document.body.appendChild(button);
        updateButtonPosition();
    }

    /**
     * Update the button position based on settings
     */
    function updateButtonPosition() {
        const button = document.getElementById(ELEMENT_IDS.BUTTON);
        if (!button) return;

        // Get position from current settings (which may be overridden by per-site settings)
        const { position, offsetX, offsetY } = settings;

        button.style.bottom = '';
        button.style.top = '';
        button.style.left = '';
        button.style.right = '';

        switch (position) {
            case 'top-left':
                button.style.top = `${offsetY}px`;
                button.style.left = `${offsetX}px`;
                break;
            case 'top-right':
                button.style.top = `${offsetY}px`;
                button.style.right = `${offsetX}px`;
                break;
            case 'bottom-left':
                button.style.bottom = `${offsetY}px`;
                button.style.left = `${offsetX}px`;
                break;
            case 'bottom-right':
            default:
                button.style.bottom = `${offsetY}px`;
                button.style.right = `${offsetX}px`;
                break;
        }
    }

    /**
     * Update the visual state of the toggle button
     */
    function updateButtonState() {
        const button = document.getElementById(ELEMENT_IDS.BUTTON);
        if (!button) return;

        if (darkModeEnabled) {
            button.classList.add('dark');
            button.setAttribute('aria-label', 'Disable Dark Mode');
            button.setAttribute('title', 'Disable Dark Mode');
        } else {
            button.classList.remove('dark');
            button.setAttribute('aria-label', 'Enable Dark Mode');
            button.setAttribute('title', 'Enable Dark Mode');
        }
    }

    /**
     * Create the settings UI panel
     */
    function createUI() {
        if (document.getElementById(ELEMENT_IDS.UI)) return;

        let overlay = document.getElementById(ELEMENT_IDS.SETTINGS_OVERLAY);
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = ELEMENT_IDS.SETTINGS_OVERLAY;
            overlay.setAttribute('aria-hidden', 'true');
            overlay.addEventListener('click', () => toggleUI(false), { passive: true });
            document.body.appendChild(overlay);
        }
        uiElements.settingsOverlay = overlay;

        const ui = document.createElement('div');
        ui.id = ELEMENT_IDS.UI;
        ui.setAttribute('role', 'dialog');
        ui.setAttribute('aria-modal', 'true');
        ui.setAttribute('aria-label', 'Dark Mode Settings');
        ui.setAttribute('aria-hidden', 'true');
        ui.setAttribute('tabindex', '-1');

        const header = document.createElement('div');
        header.className = 'settings-header';

        const title = document.createElement('h2');
        title.className = 'settings-title';
        title.textContent = 'Dark Mode Settings';
        header.appendChild(title);

        uiElements.closeSettingsButton = Utils.createButton(
            ELEMENT_IDS.CLOSE_SETTINGS_BUTTON,
            '×',
            () => toggleUI(false)
        );
        uiElements.closeSettingsButton.classList.add('settings-close');
        uiElements.closeSettingsButton.setAttribute('aria-label', 'Close Settings Panel');
        uiElements.closeSettingsButton.setAttribute('type', 'button');
        uiElements.closeSettingsButton.setAttribute('title', 'Close Settings');
        header.appendChild(uiElements.closeSettingsButton);

        ui.appendChild(header);

        // Per-site settings section
        const perSiteSection = createSettingSection('Site-Specific Settings');

        // Per-site settings toggle
        uiElements.perSiteSettingsToggle = document.createElement('input');
        uiElements.perSiteSettingsToggle.type = 'checkbox';
        uiElements.perSiteSettingsToggle.id = ELEMENT_IDS.PER_SITE_SETTINGS_TOGGLE;
        uiElements.perSiteSettingsToggle.checked = settings.perSiteSettings?.enabled;
        uiElements.perSiteSettingsToggle.addEventListener('change', (e) => {
            settings.perSiteSettings.enabled = e.target.checked;
            SettingsManager.save();
            // Update use global position toggle visibility
            uiElements.useGlobalPositionToggle.parentElement.style.display = e.target.checked ? 'block' : 'none';
        });

        perSiteSection.appendChild(createFormGroup(
            createLabel('Enable Per-Site Settings:'),
            uiElements.perSiteSettingsToggle
        ));

        // Use global position toggle
        uiElements.useGlobalPositionToggle = document.createElement('input');
        uiElements.useGlobalPositionToggle.type = 'checkbox';
        uiElements.useGlobalPositionToggle.id = ELEMENT_IDS.USE_GLOBAL_POSITION_TOGGLE;
        uiElements.useGlobalPositionToggle.checked = currentSiteSettings?.useGlobalPosition ?? true;
        uiElements.useGlobalPositionToggle.addEventListener('change', (e) => {
            if (!currentSiteSettings) { // Should not happen if logic is correct, but as a safeguard
                SettingsManager.loadPerSite().then(() => {
                    currentSiteSettings.useGlobalPosition = e.target.checked;
                    SettingsManager.savePerSite();
                });
            } else {
                currentSiteSettings.useGlobalPosition = e.target.checked;
                if (!e.target.checked) {
                    // Using site-specific position, save current global values as site-specific
                    currentSiteSettings.position = settings.position;
                    currentSiteSettings.offsetX = settings.offsetX;
                    currentSiteSettings.offsetY = settings.offsetY;
                }
                SettingsManager.savePerSite();
            }
        });

        const useGlobalPositionGroup = createFormGroup(
            createLabel('Use Global Button Position:'),
            uiElements.useGlobalPositionToggle
        );

        // Only show global position toggle if per-site settings are enabled
        useGlobalPositionGroup.style.display = settings.perSiteSettings?.enabled ? 'block' : 'none';

        perSiteSection.appendChild(useGlobalPositionGroup);

        // Current site info
        const currentSiteInfo = document.createElement('div');
        currentSiteInfo.className = 'site-info';
        currentSiteInfo.textContent = `Current site: ${Utils.getCurrentSiteIdentifier()}`;
        perSiteSection.appendChild(currentSiteInfo);

        ui.appendChild(perSiteSection);

        // Position settings section
        const positionSection = createSettingSection('Button Position');

        const positionLabel = document.createElement('label');
        positionLabel.textContent = 'Position:';
        uiElements.positionSelect = document.createElement('select');
        uiElements.positionSelect.id = 'positionSelect';
        uiElements.positionSelect.setAttribute('aria-label', 'Button Position');

        const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        positions.forEach(pos => {
            const option = document.createElement('option');
            option.value = pos;
            option.textContent = pos;
            option.selected = settings.position === pos;
            uiElements.positionSelect.appendChild(option);
        });

        uiElements.positionSelect.addEventListener('change', (e) => {
            settings.position = e.target.value;
            SettingsManager.save();
        });

        positionSection.appendChild(createFormGroup(positionLabel, uiElements.positionSelect));

        // X and Y offset inputs
        uiElements.offsetXInput = createNumberInput('offsetXInput', 'Horizontal Offset', settings.offsetX, (e) => {
            settings.offsetX = parseInt(e.target.value);
            SettingsManager.save();
        });

        uiElements.offsetYInput = createNumberInput('offsetYInput', 'Vertical Offset', settings.offsetY, (e) => {
            settings.offsetY = parseInt(e.target.value);
            SettingsManager.save();
        });

        positionSection.appendChild(createFormGroup(createLabel('Offset X:'), uiElements.offsetXInput));
        positionSection.appendChild(createFormGroup(createLabel('Offset Y:'), uiElements.offsetYInput));

        // Settings button visibility toggle
        uiElements.settingsButtonVisibilityToggle = document.createElement('input');
        uiElements.settingsButtonVisibilityToggle.type = 'checkbox';
        uiElements.settingsButtonVisibilityToggle.id = 'settingsButtonVisibilityToggle';
        uiElements.settingsButtonVisibilityToggle.checked = settings.settingsButtonVisible ?? DEFAULT_SETTINGS.settingsButtonVisible;
        uiElements.settingsButtonVisibilityToggle.addEventListener('change', (e) => {
            settings.settingsButtonVisible = e.target.checked;
            SettingsManager.save();
            updateSettingsButtonPosition();
        });

        positionSection.appendChild(createFormGroup(
            createLabel('Show Settings Button:'),
            uiElements.settingsButtonVisibilityToggle
        ));

        // Settings button horizontal offset input
        uiElements.settingsButtonOffsetInput = createNumberInput('settingsButtonOffsetInput', 'Settings Button Horizontal Offset',
            settings.settingsButtonOffset ?? DEFAULT_SETTINGS.settingsButtonOffset, (e) => {
            settings.settingsButtonOffset = parseInt(e.target.value);
            SettingsManager.save();
            updateSettingsButtonPosition();
        });

        positionSection.appendChild(createFormGroup(createLabel('Settings Button Horizontal Offset:'), uiElements.settingsButtonOffsetInput));

        // Settings button vertical position select
        uiElements.settingsButtonVerticalPositionSelect = document.createElement('select');
        uiElements.settingsButtonVerticalPositionSelect.id = 'settingsButtonVerticalPositionSelect';
        uiElements.settingsButtonVerticalPositionSelect.setAttribute('aria-label', 'Settings Button Vertical Position');

        const settingsButtonVerticalPositions = [
            { value: 'top', label: 'Top' },
            { value: 'center', label: 'Center' },
            { value: 'bottom', label: 'Bottom' }
        ];

        settingsButtonVerticalPositions.forEach(({ value, label }) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            option.selected = (settings.settingsButtonVerticalPosition ?? DEFAULT_SETTINGS.settingsButtonVerticalPosition) === value;
            uiElements.settingsButtonVerticalPositionSelect.appendChild(option);
        });

        uiElements.settingsButtonVerticalPositionSelect.addEventListener('change', (e) => {
            settings.settingsButtonVerticalPosition = e.target.value;
            SettingsManager.save();
            updateSettingsButtonPosition();
            updateSettingsButtonControlState();
        });

        positionSection.appendChild(createFormGroup(
            createLabel('Settings Button Vertical Position:'),
            uiElements.settingsButtonVerticalPositionSelect
        ));

        // Settings button vertical offset input
        uiElements.settingsButtonVerticalOffsetInput = createNumberInput(
            'settingsButtonVerticalOffsetInput',
            'Settings Button Vertical Offset',
            settings.settingsButtonVerticalOffset ?? DEFAULT_SETTINGS.settingsButtonVerticalOffset,
            (e) => {
                settings.settingsButtonVerticalOffset = parseInt(e.target.value);
                SettingsManager.save();
                updateSettingsButtonPosition();
            }
        );

        const settingsButtonVerticalOffsetGroup = createFormGroup(
            createLabel('Settings Button Vertical Offset:'),
            uiElements.settingsButtonVerticalOffsetInput
        );
        uiElements.settingsButtonVerticalOffsetGroup = settingsButtonVerticalOffsetGroup;

        positionSection.appendChild(settingsButtonVerticalOffsetGroup);
        updateSettingsButtonControlState();

        ui.appendChild(positionSection);

        // Device Optimization Section (new)
        const deviceSection = createSettingSection('Device Optimization');

        // Device info display
        const deviceInfoDisplay = document.createElement('div');
        deviceInfoDisplay.className = 'device-info';
        deviceInfoDisplay.innerHTML = `
            <p>Device Type: <span class="device-value">${deviceInfo.type}</span></p>
            <p>Performance Level: <span class="device-value">${deviceInfo.performance}</span></p>
        `;
        deviceSection.appendChild(deviceInfoDisplay);

        // Device optimization toggle
        uiElements.deviceOptimizationToggle = document.createElement('input');
        uiElements.deviceOptimizationToggle.type = 'checkbox';
        uiElements.deviceOptimizationToggle.id = 'deviceOptimizationToggle';
        uiElements.deviceOptimizationToggle.checked = settings.deviceOptimization?.enabled;
        uiElements.deviceOptimizationToggle.addEventListener('change', (e) => {
            settings.deviceOptimization.enabled = e.target.checked;
            SettingsManager.save();
            updatePerformanceMode();
        });

        deviceSection.appendChild(createFormGroup(
            createLabel('Enable Device Optimization:'),
            uiElements.deviceOptimizationToggle
        ));

        // Reduced motion toggle
        uiElements.reducedMotionToggle = document.createElement('input');
        uiElements.reducedMotionToggle.type = 'checkbox';
        uiElements.reducedMotionToggle.id = 'reducedMotionToggle';
        uiElements.reducedMotionToggle.checked = settings.deviceOptimization?.reducedMotion;
        uiElements.reducedMotionToggle.addEventListener('change', (e) => {
            settings.deviceOptimization.reducedMotion = e.target.checked;
            SettingsManager.save();
            updatePerformanceMode();
        });

        deviceSection.appendChild(createFormGroup(
            createLabel('Reduce Animations:'),
            uiElements.reducedMotionToggle
        ));

        // Low power mode toggle
        uiElements.lowPowerModeToggle = document.createElement('input');
        uiElements.lowPowerModeToggle.type = 'checkbox';
        uiElements.lowPowerModeToggle.id = 'lowPowerModeToggle';
        uiElements.lowPowerModeToggle.checked = settings.deviceOptimization?.lowPowerMode;
        uiElements.lowPowerModeToggle.addEventListener('change', (e) => {
            settings.deviceOptimization.lowPowerMode = e.target.checked;
            SettingsManager.save();
            updatePerformanceMode();
        });

        deviceSection.appendChild(createFormGroup(
            createLabel('Low Power Mode:'),
            uiElements.lowPowerModeToggle
        ));

        // Add explanation
        const deviceExplanation = document.createElement('p');
        deviceExplanation.className = 'info-text';
        deviceExplanation.textContent = 'Optimization adjusts performance based on your device capabilities.';
        deviceSection.appendChild(deviceExplanation);

        ui.appendChild(deviceSection);

        // Theme presets section
        const themePresetsSection = createSettingSection('Theme Presets');

        uiElements.themePresetsSelect = document.createElement('select');
        uiElements.themePresetsSelect.id = ELEMENT_IDS.THEME_PRESETS_SELECT;
        uiElements.themePresetsSelect.setAttribute('aria-label', 'Theme Presets');

        // Add blank option
        const blankOption = document.createElement('option');
        blankOption.value = '';
        blankOption.textContent = '-- Select Preset --';
        uiElements.themePresetsSelect.appendChild(blankOption);

        // Add all theme presets
        Object.entries(THEME_PRESETS).forEach(([key, preset]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = preset.name;
            uiElements.themePresetsSelect.appendChild(option);
        });

        uiElements.themePresetsSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                applyThemePreset(e.target.value);
                // Reset select back to blank option
                e.target.value = '';
            }
        });

        themePresetsSection.appendChild(createFormGroup(
            createLabel('Apply Preset:'),
            uiElements.themePresetsSelect
        ));

        ui.appendChild(themePresetsSection);

        // Dark mode settings section
        const darkModeSection = createSettingSection('Dark Mode Settings');

        // Brightness, contrast, sepia inputs
        uiElements.brightnessInput = createRangeInput('brightnessInput', 'Brightness', settings.brightness, 0, 150, (e) => {
            settings.brightness = parseInt(e.target.value);
            updateValueDisplay('brightnessValue', settings.brightness);
            SettingsManager.save();
        });

        uiElements.contrastInput = createRangeInput('contrastInput', 'Contrast', settings.contrast, 50, 150, (e) => {
            settings.contrast = parseInt(e.target.value);
            updateValueDisplay('contrastValue', settings.contrast);
            SettingsManager.save();
        });

        uiElements.sepiaInput = createRangeInput('sepiaInput', 'Sepia', settings.sepia, 0, 100, (e) => {
            settings.sepia = parseInt(e.target.value);
            updateValueDisplay('sepiaValue', settings.sepia);
            SettingsManager.save();
        });

        darkModeSection.appendChild(createFormGroup(
            createLabel('Brightness:'),
            uiElements.brightnessInput,
            createValueDisplay('brightnessValue', settings.brightness)
        ));

        darkModeSection.appendChild(createFormGroup(
            createLabel('Contrast:'),
            uiElements.contrastInput,
            createValueDisplay('contrastValue', settings.contrast)
        ));

        darkModeSection.appendChild(createFormGroup(
            createLabel('Sepia:'),
            uiElements.sepiaInput,
            createValueDisplay('sepiaValue', settings.sepia)
        ));

        ui.appendChild(darkModeSection);

        // Extreme Mode section
        const extremeModeSection = createSettingSection('Extreme Mode');

        // Extreme mode toggle
        uiElements.extremeModeToggle = document.createElement('input');
        uiElements.extremeModeToggle.type = 'checkbox';
        uiElements.extremeModeToggle.id = ELEMENT_IDS.EXTREME_MODE_TOGGLE;
        uiElements.extremeModeToggle.checked = settings.extremeMode?.enabled;
        uiElements.extremeModeToggle.addEventListener('change', (e) => {
            settings.extremeMode.enabled = e.target.checked;
            SettingsManager.save();
            // Update dark mode immediately if it's enabled
            if (darkModeEnabled) toggleDarkMode(true);
        });

        extremeModeSection.appendChild(createFormGroup(
            createLabel('Enable Extreme Mode:'),
            uiElements.extremeModeToggle
        ));

        // Force dark elements toggle
        uiElements.forceDarkToggle = document.createElement('input');
        uiElements.forceDarkToggle.type = 'checkbox';
        uiElements.forceDarkToggle.id = ELEMENT_IDS.FORCE_DARK_TOGGLE;
        uiElements.forceDarkToggle.checked = settings.extremeMode?.forceDarkElements;
        uiElements.forceDarkToggle.addEventListener('change', (e) => {
            settings.extremeMode.forceDarkElements = e.target.checked;
            SettingsManager.save();
        });

        extremeModeSection.appendChild(createFormGroup(
            createLabel('Force Dark Elements:'),
            uiElements.forceDarkToggle
        ));

        // Custom CSS toggle
        uiElements.customCssToggle = document.createElement('input');
        uiElements.customCssToggle.type = 'checkbox';
        uiElements.customCssToggle.id = 'customCssToggle';
        uiElements.customCssToggle.checked = settings.extremeMode?.useCustomCSS;
        uiElements.customCssToggle.addEventListener('change', (e) => {
            settings.extremeMode.useCustomCSS = e.target.checked;
            SettingsManager.save();
        });

        extremeModeSection.appendChild(createFormGroup(
            createLabel('Use Custom CSS:'),
            uiElements.customCssToggle
        ));

        // Custom CSS textarea
        uiElements.customCssTextarea = document.createElement('textarea');
        uiElements.customCssTextarea.id = ELEMENT_IDS.CUSTOM_CSS_TEXTAREA;
        uiElements.customCssTextarea.setAttribute('aria-label', 'Custom CSS');
        uiElements.customCssTextarea.setAttribute('placeholder', 'Enter custom CSS for this site...');
        uiElements.customCssTextarea.value = currentSiteCustomCSS ?? '';
        uiElements.customCssTextarea.rows = 6;
        uiElements.customCssTextarea.addEventListener('change', (e) => {
            currentSiteCustomCSS = e.target.value;
            SettingsManager.savePerSite();

            // Apply custom CSS if dark mode is enabled
            if (darkModeEnabled && (extremeModeActive || settings.extremeMode?.useCustomCSS)) {
                injectCustomCSS(currentSiteCustomCSS, 'custom-site-css');
            }
        });

        extremeModeSection.appendChild(createFormGroup(
            createLabel('Custom CSS for This Site:'),
            uiElements.customCssTextarea
        ));

        // Add explanation
        const extremeModeExplanation = document.createElement('p');
        extremeModeExplanation.className = 'info-text';
        extremeModeExplanation.textContent = 'Extreme mode forces dark theme on resistant websites. May affect performance.';
        extremeModeSection.appendChild(extremeModeExplanation);

        ui.appendChild(extremeModeSection);

        // Dynamic Selectors section
        const dynamicSelectorsSection = createSettingSection('Advanced Compatibility');

        // Dynamic selectors toggle
        uiElements.dynamicSelectorsToggle = document.createElement('input');
        uiElements.dynamicSelectorsToggle.type = 'checkbox';
        uiElements.dynamicSelectorsToggle.id = ELEMENT_IDS.DYNAMIC_SELECTORS_TOGGLE;
        uiElements.dynamicSelectorsToggle.checked = settings.dynamicSelectors?.enabled;
        uiElements.dynamicSelectorsToggle.addEventListener('change', (e) => {
            settings.dynamicSelectors.enabled = e.target.checked;
            SettingsManager.save();
            setupDynamicScanning();
        });

        dynamicSelectorsSection.appendChild(createFormGroup(
            createLabel('Dynamic Monitoring:'),
            uiElements.dynamicSelectorsToggle
        ));

        // Shadow DOM detection toggle
        uiElements.shadowDomToggle = document.createElement('input');
        uiElements.shadowDomToggle.type = 'checkbox';
        uiElements.shadowDomToggle.id = 'shadowDomToggle';
        uiElements.shadowDomToggle.checked = settings.dynamicSelectors?.detectShadowDOM;
        uiElements.shadowDomToggle.addEventListener('change', (e) => {
            settings.dynamicSelectors.detectShadowDOM = e.target.checked;
            SettingsManager.save();
            // Clear and rebuild shadow root set if needed
            if (e.target.checked) {
                shadowRoots.clear();
                findShadowRoots();
            }
        });

        dynamicSelectorsSection.appendChild(createFormGroup(
            createLabel('Shadow DOM Support:'),
            uiElements.shadowDomToggle
        ));

        // Deep scan toggle
        uiElements.deepScanToggle = document.createElement('input');
        uiElements.deepScanToggle.type = 'checkbox';
        uiElements.deepScanToggle.id = 'deepScanToggle';
        uiElements.deepScanToggle.checked = settings.dynamicSelectors?.deepScan;
        uiElements.deepScanToggle.addEventListener('change', (e) => {
            settings.dynamicSelectors.deepScan = e.target.checked;
            SettingsManager.save();
        });

        dynamicSelectorsSection.appendChild(createFormGroup(
            createLabel('Enable Deep Scanning:'),
            uiElements.deepScanToggle
        ));

        // Scan interval input
        uiElements.scanIntervalInput = createNumberInput('scanIntervalInput', 'Scan Interval (ms)',
            settings.dynamicSelectors?.scanInterval ?? DEFAULT_SETTINGS.dynamicSelectors.scanInterval, (e) => {
            settings.dynamicSelectors.scanInterval = Math.max(1000, parseInt(e.target.value));
            SettingsManager.save();
            setupDynamicScanning();
        });

        dynamicSelectorsSection.appendChild(createFormGroup(
            createLabel('Scan Interval (ms):'),
            uiElements.scanIntervalInput
        ));

        // Add explanation
        const dynamicExplanation = document.createElement('p');
        dynamicExplanation.className = 'info-text';
        dynamicExplanation.textContent = 'These settings improve compatibility with dynamic websites but may affect performance.';
        dynamicSelectorsSection.appendChild(dynamicExplanation);

        ui.appendChild(dynamicSelectorsSection);

        // Scheduled dark mode section
        const scheduleSection = createSettingSection('Schedule Dark Mode');

        // Schedule toggle
        uiElements.scheduleEnabledToggle = document.createElement('input');
        uiElements.scheduleEnabledToggle.type = 'checkbox';
        uiElements.scheduleEnabledToggle.id = ELEMENT_IDS.SCHEDULE_ENABLED_TOGGLE;
        uiElements.scheduleEnabledToggle.checked = settings.scheduledDarkMode?.enabled;
        uiElements.scheduleEnabledToggle.addEventListener('change', (e) => {
            settings.scheduledDarkMode.enabled = e.target.checked;
            SettingsManager.save();
            setupScheduleChecking();
        });

        // Schedule time inputs
        uiElements.scheduleStartTime = document.createElement('input');
        uiElements.scheduleStartTime.type = 'time';
        uiElements.scheduleStartTime.id = ELEMENT_IDS.SCHEDULE_START_TIME;
        uiElements.scheduleStartTime.value = settings.scheduledDarkMode?.startTime ?? DEFAULT_SETTINGS.scheduledDarkMode.startTime;
        uiElements.scheduleStartTime.addEventListener('change', (e) => {
            settings.scheduledDarkMode.startTime = e.target.value;
            SettingsManager.save();
        });

        uiElements.scheduleEndTime = document.createElement('input');
        uiElements.scheduleEndTime.type = 'time';
        uiElements.scheduleEndTime.id = ELEMENT_IDS.SCHEDULE_END_TIME;
        uiElements.scheduleEndTime.value = settings.scheduledDarkMode?.endTime ?? DEFAULT_SETTINGS.scheduledDarkMode.endTime;
        uiElements.scheduleEndTime.addEventListener('change', (e) => {
            settings.scheduledDarkMode.endTime = e.target.value;
            SettingsManager.save();
        });

        scheduleSection.appendChild(createFormGroup(
            createLabel('Enable Schedule:'),
            uiElements.scheduleEnabledToggle
        ));

        scheduleSection.appendChild(createFormGroup(
            createLabel('Start Time:'),
            uiElements.scheduleStartTime
        ));

        scheduleSection.appendChild(createFormGroup(
            createLabel('End Time:'),
            uiElements.scheduleEndTime
        ));

        const scheduleExplanation = document.createElement('p');
        scheduleExplanation.className = 'schedule-info';
        scheduleExplanation.textContent = 'Note: If start time is after end time, dark mode will be active overnight.';
        scheduleSection.appendChild(scheduleExplanation);

        ui.appendChild(scheduleSection);

        // Appearance settings section
        const appearanceSection = createSettingSection('Appearance');

        // Font family input
        uiElements.fontFamilyInput = document.createElement('input');
        uiElements.fontFamilyInput.type = 'text';
        uiElements.fontFamilyInput.id = 'fontFamilyInput';
        uiElements.fontFamilyInput.setAttribute('aria-label', 'Font Family');
        uiElements.fontFamilyInput.value = settings.fontFamily;
        uiElements.fontFamilyInput.addEventListener('change', (e) => {
            settings.fontFamily = e.target.value;
            SettingsManager.save();
        });

        appearanceSection.appendChild(createFormGroup(createLabel('Font Family:'), uiElements.fontFamilyInput));

        // Color inputs
        uiElements.themeColorInput = document.createElement('input');
        uiElements.themeColorInput.type = 'color';
        uiElements.themeColorInput.id = 'themeColorInput';
        uiElements.themeColorInput.setAttribute('aria-label', 'Theme Color');
        uiElements.themeColorInput.value = settings.themeColor;
        uiElements.themeColorInput.addEventListener('change', (e) => {
            settings.themeColor = e.target.value;
            applyUIStyles();
            SettingsManager.save();
        });

        uiElements.textColorInput = document.createElement('input');
        uiElements.textColorInput.type = 'color';
        uiElements.textColorInput.id = 'textColorInput';
        uiElements.textColorInput.setAttribute('aria-label', 'Text Color');
        uiElements.textColorInput.value = settings.textColor;
        uiElements.textColorInput.addEventListener('change', (e) => {
            settings.textColor = e.target.value;
            applyUIStyles();
            SettingsManager.save();
        });

        appearanceSection.appendChild(createFormGroup(createLabel('UI Theme Color:'), uiElements.themeColorInput));
        appearanceSection.appendChild(createFormGroup(createLabel('UI Text Color:'), uiElements.textColorInput));

        ui.appendChild(appearanceSection);

        // Site exclusions section
        const exclusionsSection = createSettingSection('Site Exclusions');

        uiElements.siteExclusionInput = document.createElement('input');
        uiElements.siteExclusionInput.type = 'text';
        uiElements.siteExclusionInput.id = ELEMENT_IDS.SITE_EXCLUSION_INPUT;
        uiElements.siteExclusionInput.setAttribute('aria-label', 'Enter URL to exclude');
        uiElements.siteExclusionInput.placeholder = 'Enter URL to exclude (e.g. example.com/*)';

        const exclusionInputGroup = document.createElement('div');
        exclusionInputGroup.className = 'input-group';
        exclusionInputGroup.appendChild(uiElements.siteExclusionInput);

        const addCurrentSiteButton = Utils.createButton('addCurrentSiteButton', '+ Current Site', () => {
            const currentSite = Utils.getCurrentSiteIdentifier();
            if (currentSite && !settings.exclusionList.includes(currentSite)) {
                settings.exclusionList.push(currentSite);
                SettingsManager.save();
                updateExclusionListDisplay();
            }
        });

        const addButton = Utils.createButton('addExclusionButton', '+ Add', () => {
            const url = uiElements.siteExclusionInput.value.trim();
            if (url && !settings.exclusionList.includes(url)) {
                settings.exclusionList.push(url);
                SettingsManager.save();
                updateExclusionListDisplay();
                uiElements.siteExclusionInput.value = '';
            }
        });

        exclusionInputGroup.appendChild(addButton);
        exclusionInputGroup.appendChild(addCurrentSiteButton);
        exclusionsSection.appendChild(exclusionInputGroup);

        uiElements.siteExclusionList = document.createElement('ul');
        uiElements.siteExclusionList.id = ELEMENT_IDS.SITE_EXCLUSION_LIST;
        uiElements.siteExclusionList.setAttribute('aria-label', 'Excluded Sites');
        exclusionsSection.appendChild(uiElements.siteExclusionList);

        ui.appendChild(exclusionsSection);

        // Diagnostics section
        const diagnosticsSection = createSettingSection('Diagnostics');

        // Diagnostics enabled toggle
        uiElements.diagnosticsToggle = document.createElement('input');
        uiElements.diagnosticsToggle.type = 'checkbox';
        uiElements.diagnosticsToggle.id = 'diagnosticsToggle';
        uiElements.diagnosticsToggle.checked = settings.diagnostics?.enabled;
        uiElements.diagnosticsToggle.addEventListener('change', (e) => {
            settings.diagnostics.enabled = e.target.checked;
            SettingsManager.save();
        });

        diagnosticsSection.appendChild(createFormGroup(
            createLabel('Enable Diagnostics:'),
            uiElements.diagnosticsToggle
        ));

        // Log level select
        uiElements.logLevelSelect = document.createElement('select');
        uiElements.logLevelSelect.id = 'logLevelSelect';
        uiElements.logLevelSelect.setAttribute('aria-label', 'Log Level');

        const logLevels = ['error', 'warn', 'info', 'debug'];
        logLevels.forEach(level => {
            const option = document.createElement('option');
            option.value = level;
            option.textContent = level.charAt(0).toUpperCase() + level.slice(1);
            option.selected = settings.diagnostics?.logLevel === level;
            uiElements.logLevelSelect.appendChild(option);
        });

        uiElements.logLevelSelect.addEventListener('change', (e) => {
            settings.diagnostics.logLevel = e.target.value;
            SettingsManager.save();
        });

        diagnosticsSection.appendChild(createFormGroup(
            createLabel('Log Level:'),
            uiElements.logLevelSelect
        ));

        // Show diagnostics button
        const showDiagnosticsButton = Utils.createButton(ELEMENT_IDS.SHOW_DIAGNOSTICS_BUTTON, 'Show Diagnostic Report', showDiagnosticReport);
        diagnosticsSection.appendChild(showDiagnosticsButton);

        // Add explanation
        const diagnosticsExplanation = document.createElement('p');
        diagnosticsExplanation.className = 'info-text';
        diagnosticsExplanation.textContent = 'Diagnostics help identify and fix issues with specific websites.';
        diagnosticsSection.appendChild(diagnosticsExplanation);

        ui.appendChild(diagnosticsSection);

        // Import/Export section
        const importExportSection = createSettingSection('Import/Export');

        // Export button
        const exportButton = Utils.createButton(ELEMENT_IDS.EXPORT_SETTINGS_BUTTON, 'Export Settings', SettingsManager.export);

        // Import button and file input
        uiElements.importSettingsInput = document.createElement('input');
        uiElements.importSettingsInput.type = 'file';
        uiElements.importSettingsInput.id = ELEMENT_IDS.IMPORT_SETTINGS_INPUT;
        uiElements.importSettingsInput.accept = '.json';
        uiElements.importSettingsInput.style.display = 'none';

        uiElements.importSettingsInput.addEventListener('change', (e) => SettingsManager.import(e.target.files[0]));

        const importButton = Utils.createButton(ELEMENT_IDS.IMPORT_SETTINGS_BUTTON, 'Import Settings', () => {
            uiElements.importSettingsInput.click();
        });

        importExportSection.appendChild(exportButton);
        importExportSection.appendChild(importButton);
        importExportSection.appendChild(uiElements.importSettingsInput);

        ui.appendChild(importExportSection);

        // Actions section
        const actionsSection = createSettingSection('Actions');

        // Reset settings button
        const resetSettingsButton = Utils.createButton(ELEMENT_IDS.RESET_SETTINGS_BUTTON, 'Reset All Settings', SettingsManager.reset);
        actionsSection.appendChild(resetSettingsButton);

        ui.appendChild(actionsSection);

        // Version info
        const versionInfo = document.createElement('div');
        versionInfo.className = 'version-info';
        versionInfo.textContent = 'Enhanced Dark Mode Toggle v3.3.0';
        ui.appendChild(versionInfo);

        document.body.appendChild(ui);
        updateExclusionListDisplay();
}

    /**
     * Create a settings section with title
     * @param {string} title - Section title
     * @return {HTMLElement} Section container
     */
    function createSettingSection(title) {
        const section = document.createElement('section');
        section.className = 'settings-section';

        const heading = document.createElement('h3');
        heading.textContent = title;
        section.appendChild(heading);

        return section;
    }

    /**
     * Create a form group with label and input
     * @param {HTMLElement} label - Label element
     * @param {HTMLElement} input - Input element
     * @param {HTMLElement} [extra] - Optional extra element
     * @return {HTMLElement} Form group container
     */
    function createFormGroup(label, input, extra) {
        const group = document.createElement('div');
        group.className = 'form-group';
        group.appendChild(label);
        group.appendChild(input);
        if (extra) group.appendChild(extra);
        return group;
    }

    /**
     * Create a label element
     * @param {string} text - Label text
     * @return {HTMLLabelElement} Label element
     */
    function createLabel(text) {
        const label = document.createElement('label');
        label.textContent = text;
        return label;
    }

    /**
     * Create a number input element
     * @param {string} id - Element ID
     * @param {string} ariaLabel - Accessibility label
     * @param {number} value - Initial value
     * @param {Function} onChange - Change handler
     * @return {HTMLInputElement} Input element
     */
    function createNumberInput(id, ariaLabel, value, onChange) {
        const input = document.createElement('input');
        input.type = 'number';
        input.id = id;
        input.setAttribute('aria-label', ariaLabel);
        input.value = value;
        input.addEventListener('change', onChange);
        return input;
    }

    /**
     * Create a range input with value display
     * @param {string} id - Element ID
     * @param {string} ariaLabel - Accessibility label
     * @param {number} value - Initial value
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @param {Function} onChange - Change handler
     * @return {HTMLInputElement} Range input element
     */
    function createRangeInput(id, ariaLabel, value, min, max, onChange) {
        const input = document.createElement('input');
        input.type = 'range';
        input.id = id;
        input.setAttribute('aria-label', ariaLabel);
        input.min = min;
        input.max = max;
        input.value = value;
        input.addEventListener('input', onChange);
        return input;
    }

    /**
     * Create a value display span
     * @param {string} id - Element ID
     * @param {number} value - Initial value
     * @return {HTMLSpanElement} Value display span
     */
    function createValueDisplay(id, value) {
        const span = document.createElement('span');
        span.id = id;
        span.className = 'value-display';
        span.textContent = value;
        return span;
    }

    /**
     * Update a value display element
     * @param {string} id - Element ID
     * @param {number} value - New value
     */
    function updateValueDisplay(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    /**
     * Update the exclusion list display
     */
    function updateExclusionListDisplay() {
        if (!uiElements.siteExclusionList) return;

        uiElements.siteExclusionList.innerHTML = '';

        if (settings.exclusionList.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = 'No sites excluded';
            uiElements.siteExclusionList.appendChild(emptyMessage);
            return;
        }

        settings.exclusionList.forEach(excludedSite => {
            const listItem = document.createElement('li');
            const siteText = document.createElement('span');
            siteText.textContent = excludedSite;
            siteText.className = 'site-url';
            listItem.appendChild(siteText);

            const removeButton = Utils.createButton(`remove-${excludedSite}`, '✕', () => {
                settings.exclusionList = settings.exclusionList.filter(site => site !== excludedSite);
                SettingsManager.save();
                updateExclusionListDisplay();
            });
            removeButton.className = 'remove-button';
            listItem.appendChild(removeButton);

            uiElements.siteExclusionList.appendChild(listItem);
        });
    }

    /**
     * Create a button to toggle the settings UI
     */
    function createToggleUIButton() {
        if (document.getElementById(ELEMENT_IDS.TOGGLE_UI_BUTTON)) return;

        const toggleUIButton = Utils.createButton(ELEMENT_IDS.TOGGLE_UI_BUTTON, '', toggleUI);
        toggleUIButton.innerHTML = SVG_ICONS.GEAR;
        toggleUIButton.setAttribute('aria-label', 'Dark Mode Settings');
        toggleUIButton.setAttribute('title', 'Dark Mode Settings');

        document.body.appendChild(toggleUIButton);
        updateSettingsButtonPosition();
    }

    /**
     * Update position of the settings button based on offset setting
     */
    function updateSettingsButtonPosition() {
        const button = document.getElementById(ELEMENT_IDS.TOGGLE_UI_BUTTON);
        if (!button) return;

        const isVisible = settings.settingsButtonVisible ?? DEFAULT_SETTINGS.settingsButtonVisible;
        const horizontalOffset = settings.settingsButtonOffset ?? DEFAULT_SETTINGS.settingsButtonOffset;
        const verticalPosition = settings.settingsButtonVerticalPosition ?? DEFAULT_SETTINGS.settingsButtonVerticalPosition;
        const verticalOffset = settings.settingsButtonVerticalOffset ?? DEFAULT_SETTINGS.settingsButtonVerticalOffset;

        button.style.display = isVisible ? 'flex' : 'none';
        if (!isVisible) return;

        button.style.right = `${horizontalOffset}px`;
        button.style.top = '';
        button.style.bottom = '';

        let baseTransform = 'none';
        let hoverTransform = 'scale(1.1)';

        switch (verticalPosition) {
            case 'top':
                button.style.top = `${verticalOffset}px`;
                break;
            case 'bottom':
                button.style.bottom = `${verticalOffset}px`;
                break;
            case 'center':
            default:
                button.style.top = '50%';
                baseTransform = 'translateY(-50%)';
                hoverTransform = 'translateY(-50%) scale(1.1)';
                break;
        }

        button.style.setProperty('--toggle-ui-transform', baseTransform);
        button.style.setProperty('--toggle-ui-hover-transform', hoverTransform);
    }

    function updateSettingsButtonControlState() {
        if (!uiElements.settingsButtonVerticalOffsetInput) return;
        const isCenter = (settings.settingsButtonVerticalPosition ?? DEFAULT_SETTINGS.settingsButtonVerticalPosition) === 'center';
        uiElements.settingsButtonVerticalOffsetInput.disabled = isCenter;
        if (uiElements.settingsButtonVerticalOffsetGroup) {
            uiElements.settingsButtonVerticalOffsetGroup.classList.toggle('disabled', isCenter);
        }
    }

    /**
     * Toggle the visibility of the settings UI
     */
    function toggleUI(forceState) {
        if (forceState && typeof forceState === 'object' && 'type' in forceState) {
            forceState = undefined;
        }

        const ui = document.getElementById(ELEMENT_IDS.UI);
        const overlay = document.getElementById(ELEMENT_IDS.SETTINGS_OVERLAY);
        if (!ui) return;

        const shouldShow = typeof forceState === 'boolean' ? forceState : !uiVisible;
        uiVisible = shouldShow;

        if (shouldShow) {
            ui.classList.add('visible');
            ui.setAttribute('aria-hidden', 'false');
            overlay?.classList.add('visible');
            overlay?.setAttribute('aria-hidden', 'false');
            document.body.classList.add('dark-mode-settings-open');
            updateUIValues();
            try {
                ui.focus({ preventScroll: true });
            } catch (error) {
                ui.focus();
            }
        } else {
            ui.classList.remove('visible');
            ui.setAttribute('aria-hidden', 'true');
            overlay?.classList.remove('visible');
            overlay?.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('dark-mode-settings-open');
            ui.blur();
        }
    }

    function handleSettingsKeydown(event) {
        if (event.key === 'Escape' && uiVisible) {
            toggleUI(false);
        }
    }

    /**
     * Update UI element values based on current settings
     */
    function updateUIValues() {
        // Skip if UI elements aren't initialized
        if (!uiElements.positionSelect) return;

        uiElements.positionSelect.value = settings.position;
        uiElements.offsetXInput.value = settings.offsetX;
        uiElements.offsetYInput.value = settings.offsetY;
        uiElements.brightnessInput.value = settings.brightness;
        updateValueDisplay('brightnessValue', settings.brightness);
        uiElements.contrastInput.value = settings.contrast;
        updateValueDisplay('contrastValue', settings.contrast);
        uiElements.sepiaInput.value = settings.sepia;
        updateValueDisplay('sepiaValue', settings.sepia);
        uiElements.themeColorInput.value = settings.themeColor;
        uiElements.textColorInput.value = settings.textColor;
        uiElements.fontFamilyInput.value = settings.fontFamily;

        // Update settings button offset value if it exists
        if (uiElements.settingsButtonOffsetInput) {
            uiElements.settingsButtonOffsetInput.value = settings.settingsButtonOffset ?? DEFAULT_SETTINGS.settingsButtonOffset;
        }
        if (uiElements.settingsButtonVisibilityToggle) {
            uiElements.settingsButtonVisibilityToggle.checked = settings.settingsButtonVisible ?? DEFAULT_SETTINGS.settingsButtonVisible;
        }
        if (uiElements.settingsButtonVerticalPositionSelect) {
            uiElements.settingsButtonVerticalPositionSelect.value = settings.settingsButtonVerticalPosition ?? DEFAULT_SETTINGS.settingsButtonVerticalPosition;
        }
        if (uiElements.settingsButtonVerticalOffsetInput) {
            uiElements.settingsButtonVerticalOffsetInput.value = settings.settingsButtonVerticalOffset ?? DEFAULT_SETTINGS.settingsButtonVerticalOffset;
        }
        updateSettingsButtonControlState();

        // Update extreme mode values
        if (uiElements.extremeModeToggle && settings.extremeMode) {
            uiElements.extremeModeToggle.checked = settings.extremeMode.enabled;
            uiElements.forceDarkToggle.checked = settings.extremeMode.forceDarkElements;
            uiElements.customCssToggle.checked = settings.extremeMode.useCustomCSS;
            uiElements.customCssTextarea.value = currentSiteCustomCSS ?? '';
        }

        // Update dynamic selectors values
        if (uiElements.dynamicSelectorsToggle && settings.dynamicSelectors) {
            uiElements.dynamicSelectorsToggle.checked = settings.dynamicSelectors.enabled;
            uiElements.shadowDomToggle.checked = settings.dynamicSelectors.detectShadowDOM;
            uiElements.deepScanToggle.checked = settings.dynamicSelectors.deepScan;
            uiElements.scanIntervalInput.value = settings.dynamicSelectors.scanInterval;
        }

        // Update scheduled dark mode values
        if (uiElements.scheduleEnabledToggle && settings.scheduledDarkMode) {
            uiElements.scheduleEnabledToggle.checked = settings.scheduledDarkMode.enabled;
            uiElements.scheduleStartTime.value = settings.scheduledDarkMode.startTime;
            uiElements.scheduleEndTime.value = settings.scheduledDarkMode.endTime;
        }

        // Update diagnostics values
        if (uiElements.diagnosticsToggle && settings.diagnostics) {
            uiElements.diagnosticsToggle.checked = settings.diagnostics.enabled;
            uiElements.logLevelSelect.value = settings.diagnostics.logLevel;
        }

        updateExclusionListDisplay();
    }

    /**
     * Apply UI styles dynamically based on settings
     */
    function applyUIStyles() {
        const ui = document.getElementById(ELEMENT_IDS.UI);
        if (ui) {
            ui.style.backgroundColor = settings.themeColor;
            ui.style.color = settings.textColor;
            ui.style.fontFamily = settings.fontFamily;
        }

        // If previous styles exist, remove them
        document.getElementById('darkModeToggleStyle')?.remove();

        // Add updated styles
        GM.addStyle(generateStyles());
    }

    /**
     * Generate CSS styles based on current settings
     * @return {string} CSS styles
     */
    function generateStyles() {
        const {
            themeColor,
            textColor,
            iconMoon,
            iconSun,
            buttonOpacity,
            transitionSpeed,
            buttonSize,
            settingsButtonOffset
        } = settings;

        return `
            /* Settings overlay */
            #${ELEMENT_IDS.SETTINGS_OVERLAY} {
                position: fixed;
                inset: 0;
                background: rgba(15, 18, 30, 0.45);
                backdrop-filter: blur(4px);
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
                z-index: 2147483643;
            }

            #${ELEMENT_IDS.SETTINGS_OVERLAY}.visible {
                opacity: 1;
                pointer-events: auto;
            }

            body.dark-mode-settings-open {
                overflow: hidden;
            }

            /* Toggle button styles */
            #${ELEMENT_IDS.BUTTON} {
                width: ${buttonSize.width}px;
                height: ${buttonSize.height}px;
                background-color: #fff;
                border-radius: ${buttonSize.height / 2}px;
                border: none;
                cursor: pointer;
                z-index: 9999;
                opacity: ${buttonOpacity};
                transition: all ${transitionSpeed}s cubic-bezier(0.25, 0.8, 0.25, 1);
                display: flex;
                align-items: center;
                padding: 0 4px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
                position: fixed;
                outline: none;
                /* Enhanced z-index to ensure visibility */
                z-index: 2147483647;
            }

            #${ELEMENT_IDS.BUTTON}:hover {
                opacity: 1;
                transform: scale(1.05);
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
            }

            #${ELEMENT_IDS.BUTTON}:focus-visible {
                box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.6);
                outline: none;
            }

            #${ELEMENT_IDS.BUTTON} .icon {
                width: ${buttonSize.height - 8}px;
                height: ${buttonSize.height - 8}px;
                border-radius: 50%;
                transition: transform ${transitionSpeed}s cubic-bezier(0.68, -0.55, 0.265, 1.55),
                            background-color ${transitionSpeed}s ease,
                            -webkit-mask-image ${transitionSpeed}s ease,
                            mask-image ${transitionSpeed}s ease;
                display: flex;
                justify-content: center;
                align-items: center;
                -webkit-mask-image: url('data:image/svg+xml;utf8,${encodeURIComponent(iconMoon)}');
                mask-image: url('data:image/svg+xml;utf8,${encodeURIComponent(iconMoon)}');
                -webkit-mask-size: cover;
                mask-size: cover;
                background-color: #333;
            }

            #${ELEMENT_IDS.BUTTON}.dark {
                background-color: #000;
            }

            #${ELEMENT_IDS.BUTTON}.dark .icon {
                transform: translateX(${buttonSize.width - buttonSize.height}px);
                -webkit-mask-image: url('data:image/svg+xml;utf8,${encodeURIComponent(iconSun)}');
                mask-image: url('data:image/svg+xml;utf8,${encodeURIComponent(iconSun)}');
                background-color: #fff;
            }

            /* Settings UI Styles */
            #${ELEMENT_IDS.UI} {
                position: fixed;
                top: 50%;
                right: clamp(16px, 4vw, 64px);
                transform: translateY(-50%) scale(0.96);
                opacity: 0;
                pointer-events: none;
                background-color: ${themeColor};
                color: ${textColor};
                border-radius: 16px;
                border: 1px solid rgba(0, 0, 0, 0.08);
                box-shadow: 0 24px 48px rgba(5, 8, 20, 0.25);
                width: min(380px, 92vw);
                max-height: 80vh;
                overflow-y: auto;
                padding: 24px 24px 28px;
                font-family: ${settings.fontFamily};
                transition: opacity 0.25s ease, transform 0.25s ease;
                z-index: 2147483647;
            }

            #${ELEMENT_IDS.UI}.visible {
                opacity: 1;
                transform: translateY(-50%) scale(1);
                pointer-events: auto;
            }

            #${ELEMENT_IDS.UI} .settings-header {
                position: sticky;
                top: -24px;
                margin: -24px -24px 16px;
                padding: 20px 24px 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                background-color: ${themeColor};
                background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.88) 100%);
                border-bottom: 1px solid rgba(0, 0, 0, 0.08);
                border-radius: 16px 16px 0 0;
                backdrop-filter: blur(6px);
                color: ${textColor};
            }

            #${ELEMENT_IDS.UI} .settings-title {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                letter-spacing: 0.25px;
            }

            #${ELEMENT_IDS.UI} .settings-close {
                background: rgba(0, 0, 0, 0.05);
                border: none;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                line-height: 1;
                color: ${textColor};
                cursor: pointer;
                transition: background-color 0.2s ease, transform 0.2s ease;
                padding: 0;
                margin: 0;
            }

            #${ELEMENT_IDS.UI} .settings-close:hover {
                background: rgba(0, 0, 0, 0.1);
                transform: scale(1.05);
            }

            #${ELEMENT_IDS.UI} h3 {
                margin-top: 24px;
                margin-bottom: 12px;
                font-size: 13px;
                font-weight: 600;
                color: ${textColor};
                opacity: 0.8;
                letter-spacing: 0.4px;
                text-transform: uppercase;
            }

            #${ELEMENT_IDS.UI} .settings-section {
                margin-bottom: 20px;
            }

            #${ELEMENT_IDS.UI} .form-group {
                margin-bottom: 16px;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            #${ELEMENT_IDS.UI} .form-group.disabled {
                opacity: 0.6;
            }

            #${ELEMENT_IDS.UI} label {
                display: block;
                font-weight: 500;
                font-size: 13px;
                color: ${textColor};
                opacity: 0.7;
            }

            #${ELEMENT_IDS.UI} select,
            #${ELEMENT_IDS.UI} input[type="number"],
            #${ELEMENT_IDS.UI} input[type="color"],
            #${ELEMENT_IDS.UI} input[type="text"],
            #${ELEMENT_IDS.UI} input[type="time"] {
                padding: 9px 12px;
                border: 1px solid rgba(0, 0, 0, 0.12);
                border-radius: 10px;
                color: ${textColor};
                width: 100%;
                box-sizing: border-box;
                font-size: 13px;
                background-color: rgba(255, 255, 255, 0.92);
                transition: border-color 0.2s ease, box-shadow 0.2s ease;
            }

            #${ELEMENT_IDS.UI} select:focus,
            #${ELEMENT_IDS.UI} input[type="number"]:focus,
            #${ELEMENT_IDS.UI} input[type="color"]:focus,
            #${ELEMENT_IDS.UI} input[type="text"]:focus,
            #${ELEMENT_IDS.UI} input[type="time"]:focus,
            #${ELEMENT_IDS.UI} textarea:focus {
                outline: none;
                border-color: rgba(63, 123, 255, 0.6);
                box-shadow: 0 0 0 3px rgba(63, 123, 255, 0.12);
            }

            #${ELEMENT_IDS.UI} input[type="range"] {
                width: 100%;
            }

            #${ELEMENT_IDS.UI} textarea {
                padding: 9px 12px;
                border: 1px solid rgba(0, 0, 0, 0.12);
                border-radius: 12px;
                color: ${textColor};
                width: 100%;
                box-sizing: border-box;
                font-size: 13px;
                font-family: monospace;
                resize: vertical;
                background-color: rgba(255, 255, 255, 0.92);
                transition: border-color 0.2s ease, box-shadow 0.2s ease;
            }

            #${ELEMENT_IDS.UI} .value-display {
                display: inline-block;
                margin-left: 5px;
                font-size: 12px;
                color: ${textColor};
                opacity: 0.8;
                width: 30px;
                text-align: right;
            }

            #${ELEMENT_IDS.UI} .input-group {
                display: flex;
                gap: 5px;
                margin-bottom: 10px;
            }

            #${ELEMENT_IDS.UI} .input-group input {
                flex-grow: 1;
            }

            #${ELEMENT_IDS.UI} ul#${ELEMENT_IDS.SITE_EXCLUSION_LIST} {
                list-style-type: none;
                padding: 0;
                margin: 0;
                max-height: 150px;
                overflow-y: auto;
                border: 1px solid rgba(0, 0, 0, 0.1);
                border-radius: 4px;
                padding: 5px;
                background: rgba(255, 255, 255, 0.5);
            }

            #${ELEMENT_IDS.UI} ul#${ELEMENT_IDS.SITE_EXCLUSION_LIST} li {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 5px;
                margin-bottom: 3px;
                border-bottom: 1px solid rgba(0, 0, 0, 0.05);
                font-size: 12px;
            }

            #${ELEMENT_IDS.UI} ul#${ELEMENT_IDS.SITE_EXCLUSION_LIST} li:last-child {
                border-bottom: none;
                margin-bottom: 0;
            }

            #${ELEMENT_IDS.UI} .site-url {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                flex-grow: 1;
                padding-right: 5px;
            }

            #${ELEMENT_IDS.UI} .empty-message {
                color: rgba(0, 0, 0, 0.5);
                text-align: center;
                font-style: italic;
                padding: 10px;
            }

            #${ELEMENT_IDS.UI} button {
                background: linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 240, 240, 0.95) 100%);
                color: ${textColor};
                padding: 8px 12px;
                border: 1px solid rgba(0, 0, 0, 0.1);
                border-radius: 10px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
                margin-right: 6px;
                margin-bottom: 8px;
            }

            #${ELEMENT_IDS.UI} button:hover {
                background-color: rgba(240, 240, 240, 1);
                box-shadow: 0 10px 18px rgba(15, 18, 30, 0.12);
                transform: translateY(-1px);
            }

            #${ELEMENT_IDS.UI} .remove-button {
                padding: 2px 6px;
                font-size: 10px;
                background-color: #ff5252;
                color: white;
                border-radius: 3px;
                border: none;
                margin: 0;
            }

            #${ELEMENT_IDS.UI} .remove-button:hover {
                background-color: #ff1a1a;
            }

            /* Reset Settings Button Styles */
            #${ELEMENT_IDS.RESET_SETTINGS_BUTTON} {
                background: linear-gradient(180deg, #ff6b6b 0%, #f03535 100%);
                color: #fff;
                border: none;
                width: 100%;
                margin-top: 12px;
                box-shadow: 0 12px 24px rgba(240, 53, 53, 0.25);
            }

            #${ELEMENT_IDS.RESET_SETTINGS_BUTTON}:hover {
                transform: translateY(-1px);
                box-shadow: 0 16px 32px rgba(240, 53, 53, 0.35);
            }

            #${ELEMENT_IDS.EXPORT_SETTINGS_BUTTON},
            #${ELEMENT_IDS.IMPORT_SETTINGS_BUTTON} {
                background: linear-gradient(180deg, #51d1a6 0%, #2f9d76 100%);
                color: #fff;
                border: none;
                width: calc(50% - 6px);
                margin-top: 8px;
            }

            #${ELEMENT_IDS.EXPORT_SETTINGS_BUTTON}:hover,
            #${ELEMENT_IDS.IMPORT_SETTINGS_BUTTON}:hover {
                transform: translateY(-1px);
                box-shadow: 0 12px 22px rgba(47, 157, 118, 0.25);
            }

            #${ELEMENT_IDS.SHOW_DIAGNOSTICS_BUTTON} {
                background: linear-gradient(180deg, #5fa8ff 0%, #2f6bff 100%);
                color: #fff;
                border: none;
                width: 100%;
                margin-top: 8px;
            }

            #${ELEMENT_IDS.SHOW_DIAGNOSTICS_BUTTON}:hover {
                transform: translateY(-1px);
                box-shadow: 0 12px 22px rgba(47, 107, 255, 0.25);
            }

            .schedule-info, .info-text {
                font-size: 11px;
                color: rgba(0, 0, 0, 0.6);
                font-style: italic;
                margin-top: 5px;
                margin-bottom: 5px;
            }

            /* Toggle UI Button Styles */
            #${ELEMENT_IDS.TOGGLE_UI_BUTTON} {
                position: fixed;
                top: 50%;
                right: ${settingsButtonOffset || DEFAULT_SETTINGS.settingsButtonOffset}px;
                transform: var(--toggle-ui-transform, translateY(-50%));
                background-color: rgba(240, 240, 240, 0.8);
                border: 1px solid rgba(0, 0, 0, 0.1);
                padding: 8px;
                z-index: 2147483645; /* One less than main button */
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
                transition: all 0.3s ease;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            #${ELEMENT_IDS.TOGGLE_UI_BUTTON}:hover {
                background-color: rgba(240, 240, 240, 1);
                transform: var(--toggle-ui-hover-transform, translateY(-50%) scale(1.1));
            }

            #${ELEMENT_IDS.TOGGLE_UI_BUTTON} svg {
                width: 20px;
                height: 20px;
                color: #555;
            }

            .version-info {
                margin-top: 15px;
                font-size: 10px;
                opacity: 0.6;
                text-align: center;
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

            if (
                (!shortcut.alt || e.altKey) &&
                (!shortcut.shift || e.shiftKey) &&
                (!shortcut.ctrl || e.ctrlKey) &&
                (!shortcut.meta || e.metaKey) &&
                e.key.toLowerCase() === shortcut.key.toLowerCase()
            ) {
                // Prevent default browser action if shortcut is triggered
                e.preventDefault();
                toggleDarkMode();
            }
        });
    }

    /**
     * Register menu commands for easier access
     */
    function registerMenuCommands() {
        if (typeof GM.registerMenuCommand !== 'function') {
            Utils.log('debug', 'Menu commands not supported by userscript manager');
            return;
        }
        try {
            GM.registerMenuCommand('Toggle Dark Mode', () => toggleDarkMode());
            GM.registerMenuCommand('Open Settings', () => {
                if (!uiVisible) toggleUI();
            });
            GM.registerMenuCommand('Toggle Extreme Mode', () => {
                settings.extremeMode.enabled = !settings.extremeMode.enabled;
                SettingsManager.save();
                if (darkModeEnabled) toggleDarkMode(true);
            });
        } catch (error) {
            Utils.log('error', 'Failed to register menu commands', error);
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
        isInitialized = true;

        Utils.log('info', 'Enhanced Dark Mode Toggle: Initializing...');

        await SettingsManager.load();

        // Register menu commands
        registerMenuCommands();

        // Create UI elements
        createToggleButton();
        createUI();
        createToggleUIButton();
        document.addEventListener('keydown', handleSettingsKeydown, { passive: true });

        // Update UI state
        updateUIValues();
        applyUIStyles();

        // Initialize dark mode state
        toggleDarkMode(await GM.getValue(STORAGE_KEYS.DARK_MODE, false));

        // Set up keyboard shortcuts
        setupKeyboardShortcuts();

        // Set up scheduled dark mode checking
        setupScheduleChecking();

        // Set up dynamic scanning
        setupDynamicScanning();

        // Track problematic sites for diagnostics
        if (settings.diagnostics?.enabled) {
            collectSiteInfo();
        }

        Utils.log('info', 'Enhanced Dark Mode Toggle: Initialization complete');
    }

    /**
     * Setup DOM mutation observer to ensure UI elements persist
     */
    function setupMutationObserver() {
        const observerCallback = Utils.debounce(() => {
            if (!document.getElementById(ELEMENT_IDS.BUTTON)) {
                Utils.log('info', 'Main toggle button missing, recreating...');
                createToggleButton();
                updateButtonPosition();
                updateButtonState();
            }
            if (!document.getElementById(ELEMENT_IDS.TOGGLE_UI_BUTTON)) {
                Utils.log('info', 'Settings UI toggle button missing, recreating...');
                createToggleUIButton();
            }
            if (uiVisible && !document.getElementById(ELEMENT_IDS.UI)) {
                Utils.log('info', 'Settings UI panel missing while visible, recreating...');
                createUI();
                updateUIValues();
                applyUIStyles();
                toggleUI(true); // Ensure UI is visible after recreation
            }
            if (darkModeEnabled && extremeModeActive) {
                findShadowRoots();
            }
        }, 500, true); // Use immediate debounce for responsiveness

        const observer = new MutationObserver(observerCallback);

        // Observe the body for child additions/removals. More performant than observing the whole documentElement subtree.
        observer.observe(document.body, {
            childList: true,
            subtree: true, // Still needed for elements being removed from deep within the body
        });
    }

    /**
     * Handle script initialization based on document readiness
     */
    function initializationHandler() {
        // Check if document is ready to process
        const initNow = () => {
            init().then(() => {
                setupMutationObserver();
            });
        };

        // Handle cases where document body might not be available immediately
        if (document.body) {
            initNow();
        } else {
            // Create a lightweight observer to wait for body
            const bodyObserver = new MutationObserver(() => {
                if (document.body) {
                    bodyObserver.disconnect();
                    initNow();
                }
            });

            bodyObserver.observe(document.documentElement, {
                childList: true,
                subtree: true
            });

            // Fallback timeout to ensure initialization
            setTimeout(() => {
                bodyObserver.disconnect();

                // Force create a body if it doesn't exist (rare cases)
                if (!document.body) {
                    const body = document.createElement('body');
                    document.documentElement.appendChild(body);
                }

                initNow();
            }, 2000);
        }
    }

    // Begin initialization with document ready state detection
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializationHandler);
    } else {
        initializationHandler();
    }

})();
