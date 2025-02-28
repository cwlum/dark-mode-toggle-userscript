// ==UserScript==
// @name         ☀️Dark Mode Toggle
// @author       Cervantes Wu (http://www.mriwu.us)
// @description  Ultra enhanced dark mode toggle with improved compatibility, extreme mode, dynamic selectors, per-site memory, and advanced DOM monitoring
// @namespace    https://github.com/cwlum/dark-mode-toggle-userscript
// @version      3.1.0
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
        SHOW_DIAGNOSTICS_BUTTON: 'showDiagnosticsButton'
    };

    const STORAGE_KEYS = {
        SETTINGS: 'settings',
        DARK_MODE: 'darkMode',
        PER_SITE_SETTINGS_PREFIX: 'perSiteSettings_',
        CUSTOM_CSS_PREFIX: 'customCss_',
        PROBLEMATIC_SITES: 'problematicSites'
    };

    const SITE_PROFILES = {
        DEFAULT: 'default',
        NEWS: 'news',
        FORUM: 'forum',
        DOCUMENTATION: 'documentation',
        VIDEO: 'video',
        SOCIAL: 'social'
    };

    const QUICK_ACTIONS = {
        TOGGLE: 'toggle',
        EXTREME: 'extreme',
        SETTINGS: 'settings',
        RESET: 'reset',
        PRESETS: 'presets',
        SAVE: 'save'
    };

    // Complete SVG icons for moon and sun
    const SVG_ICONS = {
        MOON: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
        SUN: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
        GEAR: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`
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
        // New extreme mode presets
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
            `
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
            `
        }
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
        // New settings for enhanced functionality
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
        // Site profiles for quick configuration
        siteProfiles: {
            default: {
                brightness: 100,
                contrast: 90,
                sepia: 10,
                extremeMode: false
            },
            news: {
                brightness: 95,
                contrast: 95,
                sepia: 5,
                extremeMode: false
            },
            forum: {
                brightness: 100,
                contrast: 85,
                sepia: 0,
                extremeMode: false
            },
            documentation: {
                brightness: 100,
                contrast: 90,
                sepia: 15,
                extremeMode: false
            },
            video: {
                brightness: 80,
                contrast: 110,
                sepia: 0,
                extremeMode: true
            },
            social: {
                brightness: 90,
                contrast: 95,
                sepia: 5,
                extremeMode: true
            }
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
    let elementsCache = new Map(); // Cache for frequently accessed elements
    let pendingOperations = new Set(); // Track pending heavy operations
    let lastDeepScanTime = 0; // Last time a deep scan was performed
    let isInitialScan = true; // Flag to track initial scan vs subsequent scans
    let observers = []; // Store mutation observers for potential cleanup

    /**
     * ------------------------
     * UTILITY FUNCTIONS
     * ------------------------
     */
    
    /**
     * Get an element by ID with caching
     * @param {string} id - Element ID to get
     * @return {HTMLElement|null} The element or null if not found
     */
    function getElement(id) {
        if (elementsCache.has(id)) {
            const element = elementsCache.get(id);
            // Verify the element is still in the DOM
            if (document.contains(element)) {
                return element;
            }
            // Element no longer in DOM, remove from cache
            elementsCache.delete(id);
        }
        
        const element = document.getElementById(id);
        if (element) {
            elementsCache.set(id, element);
        }
        return element;
    }

    /**
     * Clear specific cached elements when they're no longer needed
     * @param {Array<string>} ids - Element IDs to clear from cache
     */
    function clearElementsCache(ids = []) {
        if (ids.length === 0) {
            elementsCache.clear();
        } else {
            ids.forEach(id => elementsCache.delete(id));
        }
    }

    /**
     * Improved debounce function with options
     * @param {Function} func - Function to debounce
     * @param {number} wait - Delay in ms
     * @param {Object} options - Options like leading/trailing
     * @return {Function} Debounced function
     */
    function debounce(func, wait, options = {}) {
        let timeout;
        
        const { leading = false, trailing = true } = options;
        
        return function(...args) {
            const context = this;
            const invokeLeading = leading && !timeout;
            
            clearTimeout(timeout);
            
            timeout = setTimeout(() => {
                timeout = null;
                if (trailing) func.apply(context, args);
            }, wait);
            
            if (invokeLeading) func.apply(context, args);
        };
    }

    /**
     * Improved throttle function with options
     * @param {Function} func - Function to throttle
     * @param {number} limit - Limit in ms
     * @param {Object} options - Options like leading/trailing
     * @return {Function} Throttled function
     */
    function throttle(func, limit, options = {}) {
        let inThrottle;
        let lastFunc;
        let lastRan;
        
        const { leading = true, trailing = true } = options;
        
        return function(...args) {
            const context = this;
            
            if (!inThrottle && leading) {
                func.apply(context, args);
                lastRan = Date.now();
                inThrottle = true;
            } else {
                // Store last function call
                lastFunc = function() {
                    if (trailing) {
                        func.apply(context, args);
                    }
                };
            }
            
            clearTimeout(lastFunc._throttleTimeout);
            
            // Schedule last function call
            lastFunc._throttleTimeout = setTimeout(function() {
                if (trailing && lastFunc) {
                    lastFunc();
                }
                inThrottle = false;
            }, limit - (Date.now() - lastRan));
        };
    }

    /**
     * Log with level filtering based on settings
     * @param {string} level - Log level
     * @param {string} message - Message to log
     * @param {any} data - Optional data to log
     */
    function log(level, message, data = null) {
        const logLevels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };

        const settingsLevel = settings.diagnostics && settings.diagnostics.logLevel ? 
            settings.diagnostics.logLevel : 'info';
        
        if (logLevels[level] <= logLevels[settingsLevel]) {
            const logMessage = `[Dark Mode Toggle] ${message}`;
            
            switch (level) {
                case 'error':
                    console.error(logMessage, data || '');
                    if (settings.diagnostics && settings.diagnostics.enabled) {
                        diagnosticsData.issues.push({
                            type: 'error',
                            message: message,
                            timestamp: new Date().toISOString(),
                            data: data ? JSON.stringify(data) : null
                        });
                    }
                    break;
                case 'warn':
                    console.warn(logMessage, data || '');
                    if (settings.diagnostics && settings.diagnostics.enabled) {
                        diagnosticsData.issues.push({
                            type: 'warning',
                            message: message,
                            timestamp: new Date().toISOString(),
                            data: data ? JSON.stringify(data) : null
                        });
                    }
                    break;
                case 'info':
                    console.info(logMessage, data || '');
                    break;
                case 'debug':
                    console.debug(logMessage, data || '');
                    break;
            }
        }
    }

    /**
     * Enhanced check if current site is in the exclusion list
     * @param {string} url - Current URL to check
     * @return {boolean} Whether site is excluded
     */
    function isSiteExcluded(url) {
        return settings.exclusionList.some(pattern => {
            // Support advanced wildcards and regex-like patterns
            if (pattern.includes('*') || pattern.includes('?') || pattern.includes('^') || pattern.includes('$')) {
                try {
                    // Convert wildcard pattern to regex
                    let regexPattern = pattern
                        .replace(/\./g, '\\.')
                        .replace(/\*/g, '.*')
                        .replace(/\?/g, '.')
                        .replace(/\//g, '\\/');
                    
                    // Handle ^ and $ specifically
                    if (!regexPattern.startsWith('^')) regexPattern = '^' + regexPattern;
                    if (!regexPattern.endsWith('$')) regexPattern += '$';
                    
                    return new RegExp(regexPattern).test(url);
                } catch (e) {
                    // Fallback to simple check if regex parsing fails
                    log('warn', `Invalid exclusion pattern: ${pattern}`, e);
                    return url.startsWith(pattern);
                }
            }
            return url.startsWith(pattern);
        });
    }

    /**
     * Create a button element with specified properties
     * @param {string} id - Button ID
     * @param {string} text - Button text content
     * @param {Function} onClick - Click handler
     * @return {HTMLButtonElement} Created button
     */
    function createButton(id, text, onClick) {
        const button = document.createElement('button');
        button.id = id;
        button.textContent = text;
        button.addEventListener('click', onClick);
        return button;
    }

    /**
     * Gets the host+path without protocol for better site matching
     * @return {string} Host and path
     */
    function getCurrentSiteIdentifier() {
        return window.location.hostname;
    }

    /**
     * Check if site is known to be problematic
     * @return {Object|null} Site info if problematic, null otherwise
     */
    function getProblematicSiteInfo() {
        const hostname = window.location.hostname;
        
        for (const site in PROBLEMATIC_SITES) {
            if (hostname.includes(site)) {
                return {
                    ...PROBLEMATIC_SITES[site],
                    key: site
                };
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
                if (siteInfo.selectors && Array.isArray(siteInfo.selectors)) {
                    siteInfo.selectors.forEach(({ selector, styles }) => {
                        forceElementStyles(selector, styles);
                    });
                }
                break;
                
            default:
                log('warn', `Unknown fix method: ${siteInfo.fixMethod}`);
        }
    }

    /**
     * Force styles on elements matching a selector
     * @param {string} selector - CSS selector
     * @param {Object} styles - Styles to apply
     */
    function forceElementStyles(selector, styles) {
        try {
            const elements = Array.from(document.querySelectorAll(selector));
            
            // Also try to find elements in shadow DOM if enabled
            if (settings.dynamicSelectors && settings.dynamicSelectors.detectShadowDOM) {
                shadowRoots.forEach(root => {
                    try {
                        const shadowElements = Array.from(root.querySelectorAll(selector));
                        elements.push(...shadowElements);
                    } catch (error) {
                        log('debug', `Error querying shadow DOM: ${error.message}`, { selector, root });
                    }
                });
            }
            
            if (elements.length > 0) {
                elements.forEach(element => {
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
                });
                
                log('debug', `Forced styles on ${elements.length} elements`, { selector });
            }
        } catch (error) {
            log('error', `Error forcing element styles: ${error.message}`, { selector, styles });
        }
    }

    /**
     * Inject custom CSS to the page
     * @param {string} css - CSS to inject
     * @param {string} id - Identifier for the style element
     */
    function injectCustomCSS(css, id) {
        // Remove existing style with same ID if it exists
        const existingStyle = document.getElementById(id);
        if (existingStyle) {
            existingStyle.remove();
            customStyleElements = customStyleElements.filter(el => el.id !== id);
        }
        
        // Create and inject new style
        try {
            const style = document.createElement('style');
            style.id = id;
            style.innerHTML = css;
            document.head.appendChild(style);
            customStyleElements.push(style);
            
            log('debug', `Injected custom CSS with ID: ${id}`, { length: css.length });
        } catch (error) {
            log('error', `Error injecting custom CSS: ${error.message}`, { id });
        }
    }

    /**
     * Collect website information for diagnostics
     */
    function collectSiteInfo() {
        if (!settings.diagnostics || !settings.diagnostics.enabled) return;
        
        try {
            diagnosticsData.siteInfo = {
                url: window.location.href,
                domain: window.location.hostname,
                title: document.title,
                theme: detectSiteThemeSettings(),
                shadowDOMCount: shadowRoots.size,
                iframeCount: document.querySelectorAll('iframe').length,
                customStylesCount: customStyleElements.length,
                forcedElementsCount: forcedElementsCount,
                problematicSite: getProblematicSiteInfo() ? true : false,
                screenWidth: window.innerWidth,
                screenHeight: window.innerHeight
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
        
        const toggles = document.querySelectorAll(darkModeToggleSelectors.join(','));
        if (toggles.length > 0) {
            result.hasDarkModeToggle = true;
        }
        
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
                shadowRootsCount: shadowRoots.size
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
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            max-width: 80%;
            max-height: 80%;
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
            font-size: 12px;
            max-height: 500px;
            overflow: auto;
        `;
        
        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy to Clipboard';
        copyButton.style.cssText = `
            padding: 8px 16px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            margin-right: 10px;
            cursor: pointer;
        `;
        copyButton.addEventListener('click', () => {
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
        
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.cssText = `
            padding: 8px 16px;
            background-color: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        closeButton.addEventListener('click', () => {
            document.body.removeChild(modalContainer);
        });
        
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
        if (!settings.dynamicSelectors || !settings.dynamicSelectors.detectShadowDOM) {
            return;
        }
        
        const elements = root.querySelectorAll('*');
        
        for (const element of elements) {
            // Check if element has shadow root
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
            });
            
            observer.observe(shadowRoot, {
                childList: true,
                subtree: true
            });
            
            // Store observer for potential cleanup
            observers.push(observer);
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
            Array.from(element.children).forEach(child => {
                applyExtremeDarkToElement(child);
            });
            
            forcedElementsCount++;
        } catch (error) {
            log('error', `Error applying extreme dark to element: ${error.message}`, element);
        }
    }

    /**
     * Optimized deep scan with better performance
     */
    function performDeepScan() {
        if (!settings.dynamicSelectors || !settings.dynamicSelectors.deepScan || !extremeModeActive) {
            return;
        }
        
        const now = Date.now();
        const minInterval = 2000; // Minimum time between scans in ms
        
        // Skip if we've run recently unless it's the initial scan
        if (!isInitialScan && now - lastDeepScanTime < minInterval) {
            return;
        }
        
        // If a scan is already in progress, don't start another
        if (pendingOperations.has('deepScan')) {
            return;
        }
        
        lastDeepScanTime = now;
        isInitialScan = false;
        pendingOperations.add('deepScan');
        
        log('info', 'Performing optimized deep scan for extreme dark mode');
        
        // Use RequestAnimationFrame for better performance
        requestAnimationFrame(() => {
            try {
                // Batch DOM operations by processing in chunks
                const processElementsInChunks = (elements, chunkSize = 50) => {
                    const total = elements.length;
                    let processed = 0;
                    let forcedCount = 0;
                    
                    const processChunk = () => {
                        const chunk = elements.slice(processed, processed + chunkSize);
                        processed += chunk.length;
                        
                        chunk.forEach(element => {
                            // Process only if still in extremeMode
                            if (!extremeModeActive) return;
                            
                            const computedStyle = window.getComputedStyle(element);
                            const backgroundColor = computedStyle.backgroundColor;
                            const color = computedStyle.color;
                            
                            // Skip already processed elements
                            if (originalStyles.has(element)) return;
                            
                            // Check if element needs dark mode
                            if (isLightColor(backgroundColor) && isDarkColor(color)) {
                                // Store original styles
                                originalStyles.set(element, element.getAttribute('style') || '');
                                
                                // Force dark background and light text
                                let currentStyle = element.getAttribute('style') || '';
                                let newStyle = currentStyle + '; background-color: #1a1a1a !important; color: #ddd !important;';
                                element.setAttribute('style', newStyle);
                                forcedCount++;
                            }
                            
                            // Special handling for fixed/sticky elements
                            if (computedStyle.position === 'fixed' || computedStyle.position === 'sticky') {
                                if (isLightColor(backgroundColor) && !originalStyles.has(element)) {
                                    originalStyles.set(element, element.getAttribute('style') || '');
                                    let currentStyle = element.getAttribute('style') || '';
                                    let newStyle = currentStyle + '; background-color: #1a1a1a !important;';
                                    element.setAttribute('style', newStyle);
                                    forcedCount++;
                                }
                            }
                        });
                        
                        // Update total forced elements count
                        forcedElementsCount += forcedCount;
                        
                        // If more elements to process, schedule next chunk
                        if (processed < total && extremeModeActive) {
                            setTimeout(() => requestAnimationFrame(processChunk), 0);
                        } else {
                            pendingOperations.delete('deepScan');
                            log('info', `Deep scan completed, processed ${forcedCount} elements`);
                        }
                    };
                    
                    // Start processing
                    processChunk();
                };
                
                // Get elements to process - filter out already processed ones
                const allBodyElements = Array.from(document.querySelectorAll('body *'));
                const elementsToProcess = allBodyElements.filter(el => !originalStyles.has(el));
                
                // Process the elements in chunks
                processElementsInChunks(elementsToProcess, 50);
                
                // Handle Shadow DOM separately with a smaller chunk size
                if (settings.dynamicSelectors.detectShadowDOM) {
                    shadowRoots.forEach(root => {
                        try {
                            const shadowElements = Array.from(root.querySelectorAll('*'))
                                .filter(el => !originalStyles.has(el));
                            processElementsInChunks(shadowElements, 20);
                        } catch (error) {
                            log('debug', `Error processing shadow DOM elements: ${error.message}`, root);
                        }
                    });
                }
                
            } catch (error) {
                pendingOperations.delete('deepScan');
                log('error', `Error during deep scan: ${error.message}`);
            }
        });
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
     * Improved memory management
     */
    function cleanupResources() {
        // Clear caches when not needed
        if (!uiVisible) {
            clearElementsCache();
        }
        
        // Clean up shadows that might be detached
        for (const root of shadowRoots) {
            if (!document.contains(root.host)) {
                shadowRoots.delete(root);
            }
        }
        
        // Clean up original styles that might be for removed elements
        for (const [element, _] of originalStyles) {
            if (!document.contains(element)) {
                originalStyles.delete(element);
            }
        }
    }

    /**
     * New feature: Toast notification system
     * @param {string} message - Message to show
     * @param {number} duration - Display duration in ms
     */
    function showToast(message, duration = 2000) {
        // Remove any existing toasts
        const existingToast = getElement('darkModeToast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.id = 'darkModeToast';
        toast.className = 'dark-mode-toast';
        toast.textContent = message;
        
        // Style the toast
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 2147483647;
            font-family: ${settings.fontFamily};
            font-size: 14px;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
        }, 10);
        
        // Animate out and remove
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    /**
     * Detect site type for automatic profile selection
     * @return {string} Detected site type
     */
    function detectSiteType() {
        const url = window.location.hostname;
        const htmlContent = document.documentElement.innerHTML.toLowerCase();
        const metaTags = document.querySelectorAll('meta[name], meta[property]');
        
        // Video sites detection
        if (
            url.includes('youtube.com') || 
            url.includes('vimeo.com') || 
            url.includes('netflix.com') ||
            url.includes('hulu.com') ||
            url.includes('twitch.tv') ||
            document.querySelectorAll('video').length > 0
        ) {
            return SITE_PROFILES.VIDEO;
        }
        
        // Social media detection
        if (
            url.includes('facebook.com') || 
            url.includes('twitter.com') || 
            url.includes('instagram.com') ||
            url.includes('linkedin.com') ||
            url.includes('reddit.com')
        ) {
            return SITE_PROFILES.SOCIAL;
        }
        
        // Documentation detection
        if (
            url.includes('docs.') || 
            url.includes('documentation') ||
            url.includes('github.com') ||
            url.includes('stackoverflow.com') ||
            htmlContent.includes('documentation') && 
            (htmlContent.includes('api') || htmlContent.includes('reference') || htmlContent.includes('guide'))
        ) {
            return SITE_PROFILES.DOCUMENTATION;
        }
        
        // Forum detection
        if (
            url.includes('forum') || 
            htmlContent.includes('forum') ||
            document.querySelectorAll('[class*="post"], [class*="thread"], [class*="topic"]').length > 5
        ) {
            return SITE_PROFILES.FORUM;
        }
        
        // News detection
        if (
            url.includes('news') || 
            htmlContent.includes('article') ||
            Array.from(metaTags).some(tag => {
                const name = tag.getAttribute('name') || tag.getAttribute('property') || '';
                return name.includes('article') || name.includes('publish');
            })
        ) {
            return SITE_PROFILES.NEWS;
        }
        
        return SITE_PROFILES.DEFAULT;
    }

    /**
     * Apply a site profile to customize settings 
     * @param {string} profileName - The profile name to apply
     */
    function applySiteProfile(profileName) {
        if (!settings.siteProfiles || !settings.siteProfiles[profileName]) {
            log('warn', `Profile ${profileName} not found`);
            return;
        }
        
        const profile = settings.siteProfiles[profileName];
        
        // Apply profile settings
        settings.brightness = profile.brightness;
        settings.contrast = profile.contrast;
        settings.sepia = profile.sepia;
        
        // Apply extreme mode if in profile
        if (typeof profile.extremeMode === 'boolean') {
            if (!settings.extremeMode) {
                settings.extremeMode = { ...DEFAULT_SETTINGS.extremeMode };
            }
            settings.extremeMode.enabled = profile.extremeMode;
        }
        
        // Remember which profile was applied
        settings.currentSiteType = profileName;
        
        // Update UI and save settings
        updateUIValues();
        updateDarkReaderConfig();
        
        log('info', `Applied site profile: ${profileName}`, profile);
    }

    /**
     * ------------------------
     * STORAGE MANAGEMENT
     * ------------------------
     */
    
    /**
     * Enhanced function to load per-site settings
     * @return {Promise<void>}
     */
    async function loadPerSiteSettings() {
        const siteKey = STORAGE_KEYS.PER_SITE_SETTINGS_PREFIX + getCurrentSiteIdentifier();
        try {
            const storedSettings = await GM.getValue(siteKey, null);
            if (storedSettings) {
                // Apply all stored settings for this site
                const prevExtremeMode = settings.extremeMode && settings.extremeMode.enabled;
                
                // Apply per-site settings more comprehensively
                settings = { ...settings, ...storedSettings };
                
                // Make sure we don't lose nested objects by merging them correctly
                if (storedSettings.extremeMode && settings.extremeMode) {
                    settings.extremeMode = { ...settings.extremeMode, ...storedSettings.extremeMode };
                }
                
                // Apply custom dynamic selector settings if they exist
                if (storedSettings.dynamicSelectors && settings.dynamicSelectors) {
                    settings.dynamicSelectors = { ...settings.dynamicSelectors, ...storedSettings.dynamicSelectors };
                }
                
                // Remember dark mode state for this site
                darkModeEnabled = typeof storedSettings.darkModeEnabled === 'boolean' 
                    ? storedSettings.darkModeEnabled 
                    : false;
                
                // Load custom CSS for this site if available
                const customCssKey = STORAGE_KEYS.CUSTOM_CSS_PREFIX + getCurrentSiteIdentifier();
                currentSiteCustomCSS = await GM.getValue(customCssKey, '');
                
                log('info', `Loaded comprehensive per-site settings for ${getCurrentSiteIdentifier()}:`, storedSettings);
                
                // If extreme mode status changed, we need to handle that
                if (prevExtremeMode !== (settings.extremeMode && settings.extremeMode.enabled)) {
                    log('info', `Extreme mode status changed for this site: ${settings.extremeMode && settings.extremeMode.enabled}`);
                }
            } else {
                log('info', `No per-site settings found for ${getCurrentSiteIdentifier()}. Using global settings.`);
                
                // Try to auto-detect site type and apply appropriate profile
                const detectedProfile = detectSiteType();
                if (detectedProfile && settings.siteProfiles && settings.siteProfiles[detectedProfile]) {
                    log('info', `Auto-detected site type: ${detectedProfile}. Applying profile.`);
                    applySiteProfile(detectedProfile);
                }
            }
        } catch (error) {
            log('error', `Failed to load per-site settings:`, error);
        }
    }

    /**
     * Enhanced function to save per-site settings
     * @return {Promise<void>}
     */
    async function savePerSiteSettings() {
        const siteKey = STORAGE_KEYS.PER_SITE_SETTINGS_PREFIX + getCurrentSiteIdentifier();
        
        // Save a more comprehensive set of settings for this site
        const perSiteSettings = {
            // Basic display settings
            brightness: settings.brightness,
            contrast: settings.contrast,
            sepia: settings.sepia,
            darkModeEnabled: darkModeEnabled,
            
            // Advanced settings
            extremeMode: settings.extremeMode,
            dynamicSelectors: settings.dynamicSelectors,
            
            // Site-specific metadata
            lastUpdated: new Date().toISOString(),
            siteType: settings.currentSiteType || 'custom',
            
            // Store whether this site has custom settings
            hasCustomSettings: true
        };
        
        try {
            await GM.setValue(siteKey, perSiteSettings);
            
            // Save custom CSS for this site if it exists
            if (currentSiteCustomCSS) {
                const customCssKey = STORAGE_KEYS.CUSTOM_CSS_PREFIX + getCurrentSiteIdentifier();
                await GM.setValue(customCssKey, currentSiteCustomCSS);
            }
            
            log('info', `Saved comprehensive per-site settings for ${getCurrentSiteIdentifier()}:`, perSiteSettings);
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
            const storedSettings = await GM.getValue(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
            settings = { ...DEFAULT_SETTINGS, ...storedSettings };
            
            // Ensure arrays and objects exist with defaults
            if (!Array.isArray(settings.exclusionList)) {
                settings.exclusionList = [];
            }
            
            if (!settings.scheduledDarkMode) {
                settings.scheduledDarkMode = DEFAULT_SETTINGS.scheduledDarkMode;
            }
            
            if (!settings.keyboardShortcut) {
                settings.keyboardShortcut = DEFAULT_SETTINGS.keyboardShortcut;
            }
            
            // Ensure new settings exist
            if (!settings.extremeMode) {
                settings.extremeMode = DEFAULT_SETTINGS.extremeMode;
            }
            
            if (!settings.dynamicSelectors) {
                settings.dynamicSelectors = DEFAULT_SETTINGS.dynamicSelectors;
            }
            
            if (!settings.diagnostics) {
                settings.diagnostics = DEFAULT_SETTINGS.diagnostics;
            }
            
            // Ensure site profiles exist
            if (!settings.siteProfiles) {
                settings.siteProfiles = DEFAULT_SETTINGS.siteProfiles;
            }
            
            updateButtonPosition();
            log('info', 'Settings loaded successfully');
        } catch (error) {
            log('error', 'Failed to load settings:', error);
            settings = { ...DEFAULT_SETTINGS };
            log('warn', 'Using default settings due to load failure.');
        }
    }

    /**
     * Save global settings to storage (debounced for performance)
     */
    const saveSettingsDebounced = debounce(async () => {
        try {
            await GM.setValue(STORAGE_KEYS.SETTINGS, settings);
            updateButtonPosition();
            updateDarkReaderConfig();
            updateExclusionListDisplay();
            
            // Update schedule checking if needed
            setupScheduleChecking();
            
            // Update dynamic selector scanning if needed
            setupDynamicScanning();
            
            log('debug', 'Settings saved successfully');
        } catch (error) {
            log('error', 'Failed to save settings:', error);
        }
    }, 250);

    /**
     * Save all settings including per-site settings
     */
    function saveSettings() {
        saveSettingsDebounced();
        savePerSiteSettings();
    }

    /**
     * Reset all settings to defaults with confirmation
     * @return {Promise<void>}
     */
    async function resetSettings() {
        if (confirm('Are you sure you want to reset settings to default? This will clear ALL settings.')) {
            try {
                const siteKeys = [];
                const customCssKeys = [];
                
                // Find all per-site settings keys
                const allKeys = await GM.listValues ? GM.listValues() : [];
                if (Array.isArray(allKeys)) {
                    allKeys.forEach(key => {
                        if (key.startsWith(STORAGE_KEYS.PER_SITE_SETTINGS_PREFIX)) {
                            siteKeys.push(key);
                        } else if (key.startsWith(STORAGE_KEYS.CUSTOM_CSS_PREFIX)) {
                            customCssKeys.push(key);
                        }
                    });
                }
                
                // Delete all per-site settings
                for (const key of siteKeys) {
                    await GM.deleteValue(key);
                }
                
                // Delete all custom CSS
                for (const key of customCssKeys) {
                    await GM.deleteValue(key);
                }

                // Reset all global settings
                settings = { ...DEFAULT_SETTINGS };
                await GM.setValue(STORAGE_KEYS.SETTINGS, settings);
                await GM.setValue(STORAGE_KEYS.DARK_MODE, false);
                
                darkModeEnabled = false;
                currentSiteCustomCSS = '';

                // Clean up any injected styles
                customStyleElements.forEach(style => {
                    try {
                        style.remove();
                    } catch (e) {
                        // Ignore errors
                    }
                });
                customStyleElements = [];
                
                // Reset original styles
                for (const [element, originalStyle] of originalStyles.entries()) {
                    try {
                        if (originalStyle) {
                            element.setAttribute('style', originalStyle);
                        } else {
                            element.removeAttribute('style');
                        }
                    } catch (e) {
                        // Ignore errors for elements that might have been removed
                    }
                }
                originalStyles.clear();
                forcedElementsCount = 0;

                // Update UI to reflect changes
                updateButtonPosition();
                updateDarkReaderConfig();
                updateUIValues();
                updateButtonState();
                updateExclusionListDisplay();
                toggleDarkMode(false);
                await savePerSiteSettings();
                
                // Reset intervals
                setupScheduleChecking();
                setupDynamicScanning();

                showToast('All settings have been reset to defaults');

            } catch (error) {
                log('error', "Error during reset:", error);
                showToast("An error occurred during settings reset");
            }
        }
    }

    /**
     * Export settings to a JSON file
     */
    async function exportSettings() {
        try {
            // Get all per-site settings
            const perSiteSettings = {};
            const customCssSettings = {};
            
            const allKeys = await GM.listValues ? GM.listValues() : [];
            
            if (Array.isArray(allKeys)) {
                for (const key of allKeys) {
                    if (key.startsWith(STORAGE_KEYS.PER_SITE_SETTINGS_PREFIX)) {
                        const siteData = await GM.getValue(key);
                        perSiteSettings[key] = siteData;
                    } else if (key.startsWith(STORAGE_KEYS.CUSTOM_CSS_PREFIX)) {
                        const cssData = await GM.getValue(key);
                        customCssSettings[key] = cssData;
                    }
                }
            }
            
            const exportData = {
                global: settings,
                perSite: perSiteSettings,
                customCss: customCssSettings,
                darkModeEnabled: darkModeEnabled,
                version: '3.1.0'
            };
            
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'dark-mode-toggle-settings.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 100);
            
            showToast('Settings exported successfully');
            
        } catch (error) {
            log('error', 'Failed to export settings:', error);
            showToast('Failed to export settings');
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
                    
                    if (!importData.global || !importData.version) {
                        throw new Error('Invalid settings file format');
                    }
                    
                    // Import global settings
                    settings = { ...DEFAULT_SETTINGS, ...importData.global };
                    await GM.setValue(STORAGE_KEYS.SETTINGS, settings);
                    
                    // Import dark mode state
                    if (typeof importData.darkModeEnabled === 'boolean') {
                        darkModeEnabled = importData.darkModeEnabled;
                        await GM.setValue(STORAGE_KEYS.DARK_MODE, darkModeEnabled);
                    }
                    
                    // Import per-site settings
                    if (importData.perSite) {
                        for (const [key, value] of Object.entries(importData.perSite)) {
                            await GM.setValue(key, value);
                        }
                    }
                    
                    // Import custom CSS settings
                    if (importData.customCss) {
                        for (const [key, value] of Object.entries(importData.customCss)) {
                            await GM.setValue(key, value);
                            
                            // Update current site custom CSS if relevant
                            const currentSiteKey = STORAGE_KEYS.CUSTOM_CSS_PREFIX + getCurrentSiteIdentifier();
                            if (key === currentSiteKey) {
                                currentSiteCustomCSS = value;
                            }
                        }
                    }
                    
                    // Update UI to reflect imported settings
                    updateButtonPosition();
                    updateDarkReaderConfig();
                    updateUIValues();
                    updateButtonState();
                    updateExclusionListDisplay();
                    setupScheduleChecking();
                    setupDynamicScanning();
                    
                    // Re-apply dark mode if needed
                    if (darkModeEnabled) {
                        toggleDarkMode(true);
                    }
                    
                    showToast('Settings imported successfully!');
                    
                } catch (parseError) {
                    log('error', 'Failed to parse settings file:', parseError);
                    showToast('Failed to import settings: Invalid file format');
                }
            };
            
            reader.readAsText(file);
            
        } catch (error) {
            log('error', 'Failed to import settings:', error);
            showToast('Failed to import settings');
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
        darkModeEnabled = force !== undefined ? force : !darkModeEnabled;

        const button = getElement(ELEMENT_IDS.BUTTON);
        if (!button) return;

        if (darkModeEnabled) {
            if (!isSiteExcluded(window.location.href)) {
                extremeModeActive = settings.extremeMode && settings.extremeMode.enabled;
                
                // Apply regular dark mode first
                updateDarkReaderConfig();
                
                // Apply extreme mode if enabled
                if (extremeModeActive) {
                    applyExtremeMode();
                }
                
                // Apply site-specific fixes if needed
                applyProblematicSiteFixes();
                
                // Apply custom CSS if it exists
                if (currentSiteCustomCSS && (extremeModeActive || settings.extremeMode.useCustomCSS)) {
                    injectCustomCSS(currentSiteCustomCSS, 'custom-site-css');
                }
                
                await GM.setValue(STORAGE_KEYS.DARK_MODE, true);
                log('info', 'Dark mode enabled' + (extremeModeActive ? ' with extreme mode' : ''));
            } else {
                darkModeEnabled = false;
                DarkReader.disable();
                removeExtremeMode();
                await GM.setValue(STORAGE_KEYS.DARK_MODE, false);
                log('info', 'Site excluded. Dark mode disabled.');
            }
        } else {
            DarkReader.disable();
            removeExtremeMode();
            await GM.setValue(STORAGE_KEYS.DARK_MODE, false);
            log('info', 'Dark mode disabled.');
        }
        
        updateButtonState();
        await savePerSiteSettings();
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
                style: {
                    fontFamily: settings.fontFamily
                }
            };
            
            // Add extreme mode settings
            if (settings.extremeMode && settings.extremeMode.enabled) {
                config.ignoreImageAnalysis = settings.extremeMode.ignoreImageAnalysis;
                // Fine-tune algorithm for better compatibility
                config.mode = 1; // 0 = classic, 1 = dynamic
                config.spreadExtremeMode = 50;
            }
            
            DarkReader.enable(config);
        } else {
            DarkReader.disable();
        }
    }

    /**
     * Apply extreme mode styles
     */
    function applyExtremeMode() {
        if (!settings.extremeMode || !settings.extremeMode.enabled) {
            return;
        }
        
        extremeModeActive = true;
        log('info', 'Applying extreme mode');
        
        // Inject global CSS for extreme mode
        const extremeCss = `
            html, body {
                background-color: #121212 !important;
                color: #ddd !important;
            }
            
            /* Force light text for paragraphs and headings */
            p, h1, h2, h3, h4, h5, h6, span, label, li, td, th {
                color: #ddd !important;
            }
            
            /* Dark inputs, textareas, and selects */
            input, textarea, select {
                background-color: #2d2d2d !important;
                color: #ddd !important;
                border-color: #444 !important;
            }
            
            /* Button styling */
            button, [role="button"], .button, [type="button"], [type="submit"] {
                background-color: #2d2d2d !important;
                color: #ddd !important;
                border-color: #555 !important;
            }
            
            /* Links */
            a, a:visited {
                color: #3a8ee6 !important;
            }
            
            /* Force backgrounds for common UI components */
            [class*="dialog"], [class*="modal"], [class*="popup"], [class*="tooltip"],
            [class*="menu"], [class*="drawer"], [class*="sidebar"], [class*="panel"],
            [role="dialog"], [role="alert"], [role="alertdialog"], [role="menu"] {
                background-color: #1a1a1a !important;
                color: #ddd !important;
                border-color: #444 !important;
            }
            
            /* Force fixed and sticky elements to be dark */
            [style*="position: fixed"], [style*="position:fixed"],
            [style*="position: sticky"], [style*="position:sticky"] {
                background-color: #1a1a1a !important;
            }
        `;
        
        injectCustomCSS(extremeCss, 'extreme-mode-css');
        
        // If forced elements is enabled, scan and force dark mode on elements
        if (settings.extremeMode.forceDarkElements) {
            // Force body and main content areas
            forceElementStyles('body', { 
                backgroundColor: '#121212 !important', 
                color: '#ddd !important' 
            });
            
            forceElementStyles('main, article, section, [role="main"]', { 
                backgroundColor: '#1a1a1a !important', 
                color: '#ddd !important' 
            });
            
            // Force fixed elements that may be problematic
            forceElementStyles('header, nav, footer, aside, [role="banner"], [role="navigation"], [role="complementary"]', {
                backgroundColor: '#1a1a1a !important',
                color: '#ddd !important'
            });
            
            // Find and apply to shadow DOMs
            findShadowRoots();
            
            // Perform a deep scan if enabled
            if (settings.dynamicSelectors && settings.dynamicSelectors.deepScan) {
                performDeepScan();
            }
        }
    }

    /**
     * Remove extreme mode styles
     */
    function removeExtremeMode() {
        extremeModeActive = false;
        log('info', 'Removing extreme mode');
        
        // Remove injected style elements
        customStyleElements.forEach(style => {
            try {
                style.remove();
            } catch (e) {
                // Ignore errors
            }
        });
        customStyleElements = [];
        
        // Restore original styles
        for (const [element, originalStyle] of originalStyles.entries()) {
            try {
                if (originalStyle) {
                    element.setAttribute('style', originalStyle);
                } else {
                    element.removeAttribute('style');
                }
            } catch (e) {
                // Ignore errors for elements that might have been removed
            }
        }
        originalStyles.clear();
        forcedElementsCount = 0;
    }

    /**
     * Check scheduled dark mode and apply if needed
     */
    function checkScheduledDarkMode() {
        if (!settings.scheduledDarkMode || !settings.scheduledDarkMode.enabled) return;
        
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
            log('info', `Scheduled dark mode: Setting to ${shouldBeDark ? 'enabled' : 'disabled'}`);
            toggleDarkMode(shouldBeDark);
        }
    }

    /**
     * Setup the interval for checking scheduled dark mode
     */
    function setupScheduleChecking() {
        // Clear any existing interval
        if (scheduleCheckInterval) {
            clearInterval(scheduleCheckInterval);
            scheduleCheckInterval = null;
        }
        
        // If scheduling is enabled, set up the interval
        if (settings.scheduledDarkMode && settings.scheduledDarkMode.enabled) {
            // Run immediately once
            checkScheduledDarkMode();
            
            // Then set up the interval to check every minute
            scheduleCheckInterval = setInterval(checkScheduledDarkMode, 60000);
        }
    }

    /**
     * Setup dynamic scanning interval
     */
    function setupDynamicScanning() {
        // Clear any existing interval
        if (dynamicScanInterval) {
            clearInterval(dynamicScanInterval);
            dynamicScanInterval = null;
        }
        
        // If dynamic selectors are enabled, set up the scanning interval
        if (settings.dynamicSelectors && settings.dynamicSelectors.enabled) {
            // Set up interval based on configured scan interval
            const scanInterval = settings.dynamicSelectors.scanInterval || 2000;
            
            dynamicScanInterval = setInterval(() => {
                // Find shadow DOM elements
                if (settings.dynamicSelectors.detectShadowDOM) {
                    if (!pendingOperations.has('shadowScan')) {
                        pendingOperations.add('shadowScan');
                        requestAnimationFrame(() => {
                            findShadowRoots();
                            pendingOperations.delete('shadowScan');
                        });
                    }
                }
                
                // If dark mode and extreme mode are both active, perform deep scan
                if (darkModeEnabled && extremeModeActive && settings.dynamicSelectors.deepScan) {
                    // Use throttled deep scan for performance
                    throttledDeepScan();
                }
                
                // Run memory cleanup occasionally
                cleanupResources();
            }, scanInterval);
        }
    }

    // Throttle deep scan to avoid performance issues
    const throttledDeepScan = throttle(performDeepScan, 5000);

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
        saveSettings();
        updateDarkReaderConfig();
    }

    /**
     * ------------------------
     * QUICK ACTIONS MENU
     * ------------------------
     */
    
    /**
     * Create the quick actions menu
     * @return {HTMLElement} The menu element
     */
    function createQuickActionsMenu() {
        const existingMenu = getElement('quickActionMenu');
        if (existingMenu) existingMenu.remove();
        
        const menu = document.createElement('div');
        menu.id = 'quickActionMenu';
        menu.className = 'quick-action-menu';
        menu.setAttribute('aria-label', 'Dark Mode Quick Actions');
        menu.style.display = 'none';
        
        // Add quick action buttons
        const actions = [
            { 
                id: QUICK_ACTIONS.TOGGLE, 
                icon: darkModeEnabled ? SVG_ICONS.SUN : SVG_ICONS.MOON, 
                text: darkModeEnabled ? 'Disable Dark Mode' : 'Enable Dark Mode',
                onClick: () => toggleDarkMode()
            },
            { 
                id: QUICK_ACTIONS.EXTREME, 
                icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 1.5V5.5M14.5 1.5V5.5M9.5 17.5V21.5M14.5 17.5V21.5M5.5 9.5H1.5M5.5 14.5H1.5M22.5 9.5H18.5M22.5 14.5H18.5M12 22.5C17.7989 22.5 22.5 17.7989 22.5 12C22.5 6.20101 17.7989 1.5 12 1.5C6.20101 1.5 1.5 6.20101 1.5 12C1.5 17.7989 6.20101 22.5 12 22.5Z" stroke="currentColor"/><path d="M12 16.5C14.4853 16.5 16.5 14.4853 16.5 12C16.5 9.51472 14.4853 7.5 12 7.5C9.51472 7.5 7.5 9.51472 7.5 12C7.5 14.4853 9.51472 16.5 12 16.5Z" fill="currentColor"/></svg>`, 
                text: (settings.extremeMode && settings.extremeMode.enabled) ? 'Disable Extreme Mode' : 'Enable Extreme Mode',
                onClick: () => {
                    if (!settings.extremeMode) {
                        settings.extremeMode = { ...DEFAULT_SETTINGS.extremeMode };
                    }
                    settings.extremeMode.enabled = !(settings.extremeMode && settings.extremeMode.enabled);
                    saveSettings();
                    
                    // Update dark mode immediately if it's enabled
                    if (darkModeEnabled) {
                        toggleDarkMode(true);
                    }
                    
                    // Update the menu
                    hideQuickActionsMenu();
                    setTimeout(showQuickActionsMenu, 300);
                }
            },
            { 
                id: QUICK_ACTIONS.PRESETS, 
                icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`, 
                text: 'Theme Presets',
                onClick: () => showPresetSelector()
            },
            { 
                id: QUICK_ACTIONS.SAVE, 
                icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>`, 
                text: 'Save for This Site',
                onClick: () => {
                    savePerSiteSettings();
                    showToast('Settings saved for this site');
                }
            },
            { 
                id: QUICK_ACTIONS.SETTINGS, 
                icon: SVG_ICONS.GEAR, 
                text: 'Full Settings',
                onClick: () => {
                    hideQuickActionsMenu();
                    const ui = getElement(ELEMENT_IDS.UI);
                    if (ui && !uiVisible) {
                        toggleUI();
                    }
                }
            }
        ];
        
        actions.forEach(action => {
            const button = document.createElement('button');
            button.className = 'quick-action-button';
            button.setAttribute('aria-label', action.text);
            button.setAttribute('title', action.text);
            button.innerHTML = `
                <span class="quick-action-icon">${action.icon}</span>
                <span class="quick-action-text">${action.text}</span>
            `;
            button.addEventListener('click', action.onClick);
            menu.appendChild(button);
        });
        
        document.body.appendChild(menu);
        return menu;
    }

    /**
     * Show the quick actions menu
     */
    function showQuickActionsMenu() {
        const menu = getElement('quickActionMenu') || createQuickActionsMenu();
        
        // Position menu near the toggle button
        const button = getElement(ELEMENT_IDS.BUTTON);
        if (button) {
            const buttonRect = button.getBoundingClientRect();
            const menuRect = menu.getBoundingClientRect();
            
            // Calculate position to show menu above the button by default
            let top = buttonRect.top - menuRect.height - 10;
            let left = buttonRect.left;
            
            // Check if menu would go off the top of the viewport
            if (top < 10) {
                // Show menu below the button instead
                top = buttonRect.bottom + 10;
            }
            
            // Check if menu would go off the right of the viewport
            if (left + menuRect.width > window.innerWidth - 10) {
                left = window.innerWidth - menuRect.width - 10;
            }
            
            menu.style.top = `${top}px`;
            menu.style.left = `${left}px`;
            menu.style.display = 'flex';
            
            // Add animation
            menu.style.opacity = '0';
            menu.style.transform = 'translateY(10px)';
            
            // Trigger animation
            setTimeout(() => {
                menu.style.opacity = '1';
                menu.style.transform = 'translateY(0)';
            }, 10);
            
            // Close when clicking outside
            document.addEventListener('click', handleOutsideClick);
        }
    }

    /**
     * Hide the quick actions menu
     */
    function hideQuickActionsMenu() {
        const menu = getElement('quickActionMenu');
        if (menu) {
            menu.style.opacity = '0';
            menu.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                menu.style.display = 'none';
            }, 300);
            
            // Remove outside click handler
            document.removeEventListener('click', handleOutsideClick);
        }
    }

    /**
     * Handle clicks outside the menu
     * @param {Event} e - Click event
     */
    function handleOutsideClick(e) {
        const menu = getElement('quickActionMenu');
        const button = getElement(ELEMENT_IDS.BUTTON);
        
        if (menu && button && !menu.contains(e.target) && !button.contains(e.target)) {
            hideQuickActionsMenu();
        }
    }

    /**
     * Show theme preset selector
     */
    function showPresetSelector() {
        hideQuickActionsMenu();
        
        // Create a floating preset selector
        const selector = document.createElement('div');
        selector.id = 'presetSelector';
        selector.className = 'preset-selector';
        
        const heading = document.createElement('h3');
        heading.textContent = 'Select Theme Preset';
        selector.appendChild(heading);
        
        // Add all theme presets
        Object.entries(THEME_PRESETS).forEach(([key, preset]) => {
            const presetButton = document.createElement('button');
            presetButton.className = 'preset-button';
            presetButton.textContent = preset.name;
            presetButton.addEventListener('click', () => {
                applyThemePreset(key);
                document.body.removeChild(selector);
                showToast(`Applied preset: ${preset.name}`);
            });
            selector.appendChild(presetButton);
        });
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.className = 'preset-close-button';
        closeButton.textContent = 'Close';
        closeButton.addEventListener('click', () => {
            document.body.removeChild(selector);
        });
        selector.appendChild(closeButton);
        
        // Position selector in the center of the viewport
        selector.style.position = 'fixed';
        selector.style.top = '50%';
        selector.style.left = '50%';
        selector.style.transform = 'translate(-50%, -50%)';
        selector.style.zIndex = '2147483647';
        
        document.body.appendChild(selector);
    }

    /**
     * Enhance the toggle button with advanced interactions
     */
    function enhanceToggleButton() {
        const button = getElement(ELEMENT_IDS.BUTTON);
        if (!button) return;
        
        // Add right-click handler
        button.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showQuickActionsMenu();
        });
        
        // Add long press handler for mobile
        let longPressTimer;
        button.addEventListener('touchstart', () => {
            longPressTimer = setTimeout(() => {
                showQuickActionsMenu();
            }, 600); // 600ms is a good threshold for long press
        });
        
        button.addEventListener('touchend', () => {
            clearTimeout(longPressTimer);
        });
        
        // Add double-click handler as another way to show the menu
        let lastClickTime = 0;
        button.addEventListener('click', (e) => {
            const currentTime = new Date().getTime();
            const doubleClickThreshold = 300; // 300ms between clicks
            
            if (currentTime - lastClickTime < doubleClickThreshold) {
                // It's a double click
                e.preventDefault();
                e.stopPropagation();
                showQuickActionsMenu();
            }
            
            lastClickTime = currentTime;
        });
        
        // Update button tooltip
        button.setAttribute('title', 'Toggle Dark Mode (right-click or long-press for options)');
    }

    /**
     * Add CSS for enhanced features
     */
    function addEnhancementStyles() {
        const styles = `
            /* Quick Action Menu */
            .quick-action-menu {
                position: fixed;
                background-color: ${settings.themeColor || '#f7f7f7'};
                border-radius: 8px;
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
                padding: 10px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                z-index: 2147483646;
                transition: opacity 0.3s, transform 0.3s;
                font-family: ${settings.fontFamily};
            }
            
            .quick-action-button {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                background-color: transparent;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                transition: background-color 0.2s;
                color: ${settings.textColor || '#444'};
            }
            
            .quick-action-button:hover {
                background-color: rgba(0, 0, 0, 0.1);
            }
            
            .quick-action-icon {
                width: 20px;
                height: 20px;
                margin-right: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .quick-action-icon svg {
                width: 18px;
                height: 18px;
            }
            
            .quick-action-text {
                font-size: 14px;
                white-space: nowrap;
            }
            
            /* Preset Selector */
            .preset-selector {
                background-color: ${settings.themeColor || '#f7f7f7'};
                border-radius: 8px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
                padding: 16px;
                width: 280px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                color: ${settings.textColor || '#444'};
                font-family: ${settings.fontFamily};
            }
            
            .preset-selector h3 {
                margin: 0 0 10px 0;
                font-size: 16px;
                text-align: center;
            }
            
            .preset-button {
                padding: 10px 14px;
                background-color: rgba(0, 0, 0, 0.05);
                border: 1px solid rgba(0, 0, 0, 0.1);
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
                color: ${settings.textColor || '#444'};
                font-family: ${settings.fontFamily};
            }
            
            .preset-button:hover {
                background-color: rgba(0, 0, 0, 0.1);
                transform: translateY(-1px);
            }
            
            .preset-close-button {
                margin-top: 10px;
                padding: 8px;
                background-color: transparent;
                border: 1px solid rgba(0, 0, 0, 0.1);
                border-radius: 4px;
                cursor: pointer;
                color: ${settings.textColor || '#444'};
            }
            /* Site Profiles Section */
            .site-info {
                background-color: rgba(0, 0, 0, 0.05);
                border-radius: 4px;
                padding: 10px;
                margin-top: 10px;
                font-size: 12px;
            }
            
            .site-info p {
                margin: 4px 0;
            }
            
            /* Dark mode button enhancements for mobile */
            @media (max-width: 768px) {
                #${ELEMENT_IDS.BUTTON} {
                    width: 60px;
                    height: 60px;
                    border-radius: 30px;
                }
                
                #${ELEMENT_IDS.BUTTON} .icon {
                    width: 30px;
                    height: 30px;
                }
                
                #${ELEMENT_IDS.TOGGLE_UI_BUTTON} {
                    width: 48px;
                    height: 48px;
                }
                
                #${ELEMENT_IDS.TOGGLE_UI_BUTTON} svg {
                    width: 24px;
                    height: 24px;
                }
                
                /* Make the settings panel mobile-friendly */
                #${ELEMENT_IDS.UI} {
                    max-width: 90vw;
                    max-height: 80vh;
                    top: 10vh;
                    left: 5vw;
                    right: 5vw;
                    width: auto;
                }
                
                /* Larger touch targets */
                #${ELEMENT_IDS.UI} button {
                    padding: 10px;
                    min-height: 44px;
                }
                
                #${ELEMENT_IDS.UI} input, 
                #${ELEMENT_IDS.UI} select {
                    min-height: 44px;
                }
            }
        `;
        
        // Inject the styles
        GM.addStyle(styles);
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
        const existingButton = getElement(ELEMENT_IDS.BUTTON);
        if (existingButton) return;
        
        const button = document.createElement('button');
        button.id = ELEMENT_IDS.BUTTON;
        button.innerHTML = `<span class="icon">${settings.iconMoon}</span>`;
        button.setAttribute('aria-label', 'Toggle Dark Mode');
        button.setAttribute('title', 'Toggle Dark Mode');
        
        button.addEventListener('click', () => {
            toggleDarkMode();
        });
        
        document.body.appendChild(button);
        updateButtonPosition();
    }

    /**
     * Update the button position based on settings
     */
    function updateButtonPosition() {
        const button = getElement(ELEMENT_IDS.BUTTON);
        if (!button) return;

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
        const button = getElement(ELEMENT_IDS.BUTTON);
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
        const existingUI = getElement(ELEMENT_IDS.UI);
        if (existingUI) return;
        
        const ui = document.createElement('div');
        ui.id = ELEMENT_IDS.UI;
        ui.setAttribute('aria-label', 'Dark Mode Settings');

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
            saveSettings();
        });
        
        positionSection.appendChild(createFormGroup(positionLabel, uiElements.positionSelect));

        // X and Y offset inputs
        uiElements.offsetXInput = createNumberInput('offsetXInput', 'Horizontal Offset', settings.offsetX, (e) => {
            settings.offsetX = parseInt(e.target.value);
            saveSettings();
        });
        
        uiElements.offsetYInput = createNumberInput('offsetYInput', 'Vertical Offset', settings.offsetY, (e) => {
            settings.offsetY = parseInt(e.target.value);
            saveSettings();
        });
        
        positionSection.appendChild(createFormGroup(createLabel('Offset X:'), uiElements.offsetXInput));
        positionSection.appendChild(createFormGroup(createLabel('Offset Y:'), uiElements.offsetYInput));

        // Settings button offset input
        uiElements.settingsButtonOffsetInput = createNumberInput('settingsButtonOffsetInput', 'Settings Button Offset', 
            settings.settingsButtonOffset || DEFAULT_SETTINGS.settingsButtonOffset, (e) => {
            settings.settingsButtonOffset = parseInt(e.target.value);
            saveSettings();
            updateSettingsButtonPosition();
        });
        
        positionSection.appendChild(createFormGroup(createLabel('Settings Button Position:'), uiElements.settingsButtonOffsetInput));
        
        ui.appendChild(positionSection);

        // Site Profiles section (NEW)
        ui.appendChild(createSiteProfilesSection());

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
            saveSettings();
        });
        
        uiElements.contrastInput = createRangeInput('contrastInput', 'Contrast', settings.contrast, 50, 150, (e) => {
            settings.contrast = parseInt(e.target.value);
            updateValueDisplay('contrastValue', settings.contrast);
            saveSettings();
        });
        
        uiElements.sepiaInput = createRangeInput('sepiaInput', 'Sepia', settings.sepia, 0, 100, (e) => {
            settings.sepia = parseInt(e.target.value);
            updateValueDisplay('sepiaValue', settings.sepia);
            saveSettings();
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
        uiElements.extremeModeToggle.checked = settings.extremeMode && settings.extremeMode.enabled;
        uiElements.extremeModeToggle.addEventListener('change', (e) => {
            if (!settings.extremeMode) {
                settings.extremeMode = { ...DEFAULT_SETTINGS.extremeMode };
            }
            settings.extremeMode.enabled = e.target.checked;
            saveSettings();
            
            // Update dark mode immediately if it's enabled
            if (darkModeEnabled) {
                toggleDarkMode(true);
            }
        });
        
        extremeModeSection.appendChild(createFormGroup(
            createLabel('Enable Extreme Mode:'), 
            uiElements.extremeModeToggle
        ));
        
        // Force dark elements toggle
        uiElements.forceDarkToggle = document.createElement('input');
        uiElements.forceDarkToggle.type = 'checkbox';
        uiElements.forceDarkToggle.id = ELEMENT_IDS.FORCE_DARK_TOGGLE;
        uiElements.forceDarkToggle.checked = settings.extremeMode && settings.extremeMode.forceDarkElements;
        uiElements.forceDarkToggle.addEventListener('change', (e) => {
            if (!settings.extremeMode) {
                settings.extremeMode = { ...DEFAULT_SETTINGS.extremeMode };
            }
            settings.extremeMode.forceDarkElements = e.target.checked;
            saveSettings();
        });
        
        extremeModeSection.appendChild(createFormGroup(
            createLabel('Force Dark Elements:'), 
            uiElements.forceDarkToggle
        ));
        
        // Custom CSS toggle
        uiElements.customCssToggle = document.createElement('input');
        uiElements.customCssToggle.type = 'checkbox';
        uiElements.customCssToggle.id = 'customCssToggle';
        uiElements.customCssToggle.checked = settings.extremeMode && settings.extremeMode.useCustomCSS;
        uiElements.customCssToggle.addEventListener('change', (e) => {
            if (!settings.extremeMode) {
                settings.extremeMode = { ...DEFAULT_SETTINGS.extremeMode };
            }
            settings.extremeMode.useCustomCSS = e.target.checked;
            saveSettings();
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
        uiElements.customCssTextarea.value = currentSiteCustomCSS || '';
        uiElements.customCssTextarea.rows = 6;
        uiElements.customCssTextarea.addEventListener('change', (e) => {
            currentSiteCustomCSS = e.target.value;
            savePerSiteSettings();
            
            // Apply custom CSS if dark mode is enabled
            if (darkModeEnabled && (extremeModeActive || settings.extremeMode.useCustomCSS)) {
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
        uiElements.dynamicSelectorsToggle.checked = settings.dynamicSelectors && settings.dynamicSelectors.enabled;
        uiElements.dynamicSelectorsToggle.addEventListener('change', (e) => {
            if (!settings.dynamicSelectors) {
                settings.dynamicSelectors = { ...DEFAULT_SETTINGS.dynamicSelectors };
            }
            settings.dynamicSelectors.enabled = e.target.checked;
            saveSettings();
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
        uiElements.shadowDomToggle.checked = settings.dynamicSelectors && settings.dynamicSelectors.detectShadowDOM;
        uiElements.shadowDomToggle.addEventListener('change', (e) => {
            if (!settings.dynamicSelectors) {
                settings.dynamicSelectors = { ...DEFAULT_SETTINGS.dynamicSelectors };
            }
            settings.dynamicSelectors.detectShadowDOM = e.target.checked;
            saveSettings();
            
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
        uiElements.deepScanToggle.checked = settings.dynamicSelectors && settings.dynamicSelectors.deepScan;
        uiElements.deepScanToggle.addEventListener('change', (e) => {
            if (!settings.dynamicSelectors) {
                settings.dynamicSelectors = { ...DEFAULT_SETTINGS.dynamicSelectors };
            }
            settings.dynamicSelectors.deepScan = e.target.checked;
            saveSettings();
        });
        
        dynamicSelectorsSection.appendChild(createFormGroup(
            createLabel('Enable Deep Scanning:'), 
            uiElements.deepScanToggle
        ));
        
        // Scan interval input
        uiElements.scanIntervalInput = createNumberInput('scanIntervalInput', 'Scan Interval (ms)', 
            settings.dynamicSelectors ? settings.dynamicSelectors.scanInterval : DEFAULT_SETTINGS.dynamicSelectors.scanInterval, (e) => {
            if (!settings.dynamicSelectors) {
                settings.dynamicSelectors = { ...DEFAULT_SETTINGS.dynamicSelectors };
            }
            settings.dynamicSelectors.scanInterval = Math.max(1000, parseInt(e.target.value));
            saveSettings();
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
        uiElements.scheduleEnabledToggle.checked = settings.scheduledDarkMode && settings.scheduledDarkMode.enabled;
        uiElements.scheduleEnabledToggle.addEventListener('change', (e) => {
            if (!settings.scheduledDarkMode) {
                settings.scheduledDarkMode = { ...DEFAULT_SETTINGS.scheduledDarkMode };
            }
            settings.scheduledDarkMode.enabled = e.target.checked;
            saveSettings();
            setupScheduleChecking();
        });
        
        // Schedule time inputs
        uiElements.scheduleStartTime = document.createElement('input');
        uiElements.scheduleStartTime.type = 'time';
        uiElements.scheduleStartTime.id = ELEMENT_IDS.SCHEDULE_START_TIME;
        uiElements.scheduleStartTime.value = settings.scheduledDarkMode ? settings.scheduledDarkMode.startTime : DEFAULT_SETTINGS.scheduledDarkMode.startTime;
        uiElements.scheduleStartTime.addEventListener('change', (e) => {
            if (!settings.scheduledDarkMode) {
                settings.scheduledDarkMode = { ...DEFAULT_SETTINGS.scheduledDarkMode };
            }
            settings.scheduledDarkMode.startTime = e.target.value;
            saveSettings();
        });
        
        uiElements.scheduleEndTime = document.createElement('input');
        uiElements.scheduleEndTime.type = 'time';
        uiElements.scheduleEndTime.id = ELEMENT_IDS.SCHEDULE_END_TIME;
        uiElements.scheduleEndTime.value = settings.scheduledDarkMode ? settings.scheduledDarkMode.endTime : DEFAULT_SETTINGS.scheduledDarkMode.endTime;
        uiElements.scheduleEndTime.addEventListener('change', (e) => {
            if (!settings.scheduledDarkMode) {
                settings.scheduledDarkMode = { ...DEFAULT_SETTINGS.scheduledDarkMode };
            }
            settings.scheduledDarkMode.endTime = e.target.value;
            saveSettings();
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
            saveSettings();
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
            saveSettings();
        });
        
        uiElements.textColorInput = document.createElement('input');
        uiElements.textColorInput.type = 'color';
        uiElements.textColorInput.id = 'textColorInput';
        uiElements.textColorInput.setAttribute('aria-label', 'Text Color');
        uiElements.textColorInput.value = settings.textColor;
        uiElements.textColorInput.addEventListener('change', (e) => {
            settings.textColor = e.target.value;
            applyUIStyles();
            saveSettings();
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
        
        const addCurrentSiteButton = createButton('addCurrentSiteButton', '+ Current Site', () => {
            const currentSite = window.location.origin;
            if (!settings.exclusionList.includes(currentSite)) {
                settings.exclusionList.push(currentSite);
                saveSettings();
                updateExclusionListDisplay();
            }
        });
        
        const addButton = createButton('addExclusionButton', '+ Add', () => {
            const url = uiElements.siteExclusionInput.value.trim();
            if (url && !settings.exclusionList.includes(url)) {
                settings.exclusionList.push(url);
                saveSettings();
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
        uiElements.diagnosticsToggle.checked = settings.diagnostics && settings.diagnostics.enabled;
        uiElements.diagnosticsToggle.addEventListener('change', (e) => {
            if (!settings.diagnostics) {
                settings.diagnostics = { ...DEFAULT_SETTINGS.diagnostics };
            }
            settings.diagnostics.enabled = e.target.checked;
            saveSettings();
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
            option.selected = settings.diagnostics && settings.diagnostics.logLevel === level;
            uiElements.logLevelSelect.appendChild(option);
        });
        
        uiElements.logLevelSelect.addEventListener('change', (e) => {
            if (!settings.diagnostics) {
                settings.diagnostics = { ...DEFAULT_SETTINGS.diagnostics };
            }
            settings.diagnostics.logLevel = e.target.value;
            saveSettings();
        });
        
        diagnosticsSection.appendChild(createFormGroup(
            createLabel('Log Level:'), 
            uiElements.logLevelSelect
        ));
        
        // Show diagnostics button
        const showDiagnosticsButton = createButton(ELEMENT_IDS.SHOW_DIAGNOSTICS_BUTTON, 'Show Diagnostic Report', showDiagnosticReport);
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
        const exportButton = createButton(ELEMENT_IDS.EXPORT_SETTINGS_BUTTON, 'Export Settings', exportSettings);
        
        // Import button and file input
        uiElements.importSettingsInput = document.createElement('input');
        uiElements.importSettingsInput.type = 'file';
        uiElements.importSettingsInput.id = ELEMENT_IDS.IMPORT_SETTINGS_INPUT;
        uiElements.importSettingsInput.accept = '.json';
        uiElements.importSettingsInput.style.display = 'none';
        
        uiElements.importSettingsInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                importSettings(e.target.files[0]);
            }
        });
        
        const importButton = createButton(ELEMENT_IDS.IMPORT_SETTINGS_BUTTON, 'Import Settings', () => {
            uiElements.importSettingsInput.click();
        });
        
        importExportSection.appendChild(exportButton);
        importExportSection.appendChild(importButton);
        importExportSection.appendChild(uiElements.importSettingsInput);
        
        ui.appendChild(importExportSection);

        // Actions section
        const actionsSection = createSettingSection('Actions');
        
        // Reset settings button
        const resetSettingsButton = createButton(ELEMENT_IDS.RESET_SETTINGS_BUTTON, 'Reset All Settings', resetSettings);
        actionsSection.appendChild(resetSettingsButton);
        
        ui.appendChild(actionsSection);

        // Version info
        const versionInfo = document.createElement('div');
        versionInfo.className = 'version-info';
        versionInfo.textContent = 'Enhanced Dark Mode Toggle v3.1.0';
        ui.appendChild(versionInfo);

        document.body.appendChild(ui);
        updateExclusionListDisplay();
    }

    /**
     * Create a site profiles section for the UI
     * @return {HTMLElement} Section element
     */
    function createSiteProfilesSection() {
        const section = createSettingSection('Site Profiles');
        
        // Profile selector
        const profileLabel = createLabel('Apply Profile:');
        uiElements.profileSelect = document.createElement('select');
        uiElements.profileSelect.id = 'profileSelect';
        uiElements.profileSelect.setAttribute('aria-label', 'Site Profile');
        
        // Add profiles from the predefined list
        Object.entries(SITE_PROFILES).forEach(([key, value]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = key.charAt(0) + key.slice(1).toLowerCase(); // Format nicely
            option.selected = settings.currentSiteType === value;
            uiElements.profileSelect.appendChild(option);
        });
        
        uiElements.profileSelect.addEventListener('change', (e) => {
            applySiteProfile(e.target.value);
            savePerSiteSettings();
        });
        
        section.appendChild(createFormGroup(profileLabel, uiElements.profileSelect));
        
        // Save as profile button
        const saveProfileButton = createButton('saveProfileButton', 'Save Current Settings for This Site', () => {
            savePerSiteSettings();
            showToast(`Settings for ${window.location.hostname} have been saved.`);
        });
        saveProfileButton.style.width = '100%';
        section.appendChild(saveProfileButton);
        
        // Reset site settings button
        const resetSiteButton = createButton('resetSiteButton', 'Reset Settings for This Site', async () => {
            if (confirm(`Are you sure you want to reset the settings for ${window.location.hostname}?`)) {
                const siteKey = STORAGE_KEYS.PER_SITE_SETTINGS_PREFIX + getCurrentSiteIdentifier();
                const customCssKey = STORAGE_KEYS.CUSTOM_CSS_PREFIX + getCurrentSiteIdentifier();
                
                await GM.deleteValue(siteKey);
                await GM.deleteValue(customCssKey);
                
                // Reset to global settings
                await loadSettings();
                
                // Reset custom CSS
                currentSiteCustomCSS = '';
                
                updateUIValues();
                updateDarkReaderConfig();
                
                showToast(`Settings for ${window.location.hostname} have been reset.`);
            }
        });
        resetSiteButton.style.width = '100%';
        resetSiteButton.style.marginTop = '5px';
        section.appendChild(resetSiteButton);
        
        // Site-specific information
        const siteInfoDiv = document.createElement('div');
        siteInfoDiv.className = 'site-info';
        siteInfoDiv.innerHTML = `
            <p><strong>Current Site:</strong> ${window.location.hostname}</p>
            <p><strong>Detected Type:</strong> <span id="detectedType">${settings.currentSiteType || detectSiteType() || 'Unknown'}</span></p>
            <p><strong>Has Custom Settings:</strong> <span id="hasCustomSettings">Loading...</span></p>
        `;
        section.appendChild(siteInfoDiv);
        
        // Add explanation
        const profileExplanation = document.createElement('p');
        profileExplanation.className = 'info-text';
        profileExplanation.textContent = 'Site profiles optimize dark mode for different types of websites. Your settings for each site are remembered.';
        section.appendChild(profileExplanation);
        
        return section;
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
        const element = getElement(id);
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

            const removeButton = createButton('removeButton-' + excludedSite.replace(/[^a-zA-Z0-9]/g, '-'), '✕', () => {
                settings.exclusionList = settings.exclusionList.filter(site => site !== excludedSite);
                saveSettings();
                updateExclusionListDisplay();
            });
            
            removeButton.className = 'remove-button';
            listItem.appendChild(removeButton);
            uiElements.siteExclusionList.appendChild(listItem);
        });
    }

    /**
     * Update site profile information
     */
    function updateSiteProfileInfo() {
        const detectedTypeElement = getElement('detectedType');
        const hasCustomSettingsElement = getElement('hasCustomSettings');
        
        if (detectedTypeElement) {
            detectedTypeElement.textContent = settings.currentSiteType || detectSiteType() || 'Default';
        }
        
        if (hasCustomSettingsElement) {
            // Check if this site has stored settings
            const siteKey = STORAGE_KEYS.PER_SITE_SETTINGS_PREFIX + getCurrentSiteIdentifier();
            GM.getValue(siteKey, null).then(value => {
                hasCustomSettingsElement.textContent = value ? 'Yes' : 'No';
            });
        }
    }

    /**
     * Create a button to toggle the settings UI
     */
    function createToggleUIButton() {
        const existingButton = getElement(ELEMENT_IDS.TOGGLE_UI_BUTTON);
        if (existingButton) return;
        
        const toggleUIButton = createButton(ELEMENT_IDS.TOGGLE_UI_BUTTON, 'Settings', toggleUI);
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
        const button = getElement(ELEMENT_IDS.TOGGLE_UI_BUTTON);
        if (button) {
            button.style.right = `${settings.settingsButtonOffset || DEFAULT_SETTINGS.settingsButtonOffset}px`;
        }
    }

    /**
     * Toggle the visibility of the settings UI
     */
    function toggleUI() {
        const ui = getElement(ELEMENT_IDS.UI);
        uiVisible = !uiVisible;
        
        if (uiVisible) {
            ui.classList.add('visible');
            ui.setAttribute('aria-hidden', 'false');
            updateUIValues();
        } else {
            ui.classList.remove('visible');
            ui.setAttribute('aria-hidden', 'true');
            
            // Run cleanup when UI is hidden
            cleanupResources();
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
            uiElements.settingsButtonOffsetInput.value = settings.settingsButtonOffset || DEFAULT_SETTINGS.settingsButtonOffset;
        }
        
        // Update site profile selector
        if (uiElements.profileSelect) {
            uiElements.profileSelect.value = settings.currentSiteType || detectSiteType() || 'default';
        }
        
        // Update extreme mode values
        if (uiElements.extremeModeToggle && settings.extremeMode) {
            uiElements.extremeModeToggle.checked = settings.extremeMode.enabled;
            uiElements.forceDarkToggle.checked = settings.extremeMode.forceDarkElements;
            uiElements.customCssToggle.checked = settings.extremeMode.useCustomCSS;
            uiElements.customCssTextarea.value = currentSiteCustomCSS || '';
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
        updateSiteProfileInfo();
    }

    /**
     * Apply UI styles dynamically based on settings
     */
    function applyUIStyles() {
        const ui = getElement(ELEMENT_IDS.UI);
        if (ui) {
            ui.style.backgroundColor = settings.themeColor;
            ui.style.color = settings.textColor;
            ui.style.fontFamily = settings.fontFamily;
        }

        // If previous styles exist, remove them
        const existingStyle = getElement('darkModeToggleStyle');
        if (existingStyle) existingStyle.remove();

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
                z-index: 2147483646;
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
                top: 20px;
                left: 20px;
                background-color: ${themeColor};
                border: 1px solid rgba(0, 0, 0, 0.1);
                padding: 15px;
                padding-top: 0;
                z-index: 2147483647; /* Maximum z-index to ensure visibility */
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                display: none;
                color: ${textColor};
                font-family: ${settings.fontFamily};
                max-width: 90vw;
                max-height: 80vh;
                overflow: auto;
                width: 320px; /* Increased width for new settings */
            }

            #${ELEMENT_IDS.UI}.visible {
                display: block;
                animation: fadeIn 0.2s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            #${ELEMENT_IDS.UI} h3 {
                margin-top: 15px;
                margin-bottom: 10px;
                font-size: 14px;
                font-weight: 600;
                color: ${textColor};
                border-bottom: 1px solid rgba(0, 0, 0, 0.1);
                padding-bottom: 5px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            #${ELEMENT_IDS.UI} .settings-section {
                margin-bottom: 15px;
            }

            #${ELEMENT_IDS.UI} .form-group {
                margin-bottom: 12px;
                display: flex;
                flex-direction: column;
            }

            #${ELEMENT_IDS.UI} label {
                display: block;
                margin-bottom: 5px;
                font-weight: 500;
                font-size: 13px;
            }

            #${ELEMENT_IDS.UI} select, 
            #${ELEMENT_IDS.UI} input[type="number"], 
            #${ELEMENT_IDS.UI} input[type="color"], 
            #${ELEMENT_IDS.UI} input[type="text"],
            #${ELEMENT_IDS.UI} input[type="time"] {
                padding: 8px;
                border: 1px solid rgba(0, 0, 0, 0.2);
                border-radius: 4px;
                color: #333;
                width: 100%;
                box-sizing: border-box;
                font-size: 13px;
            }

            #${ELEMENT_IDS.UI} input[type="range"] {
                width: 100%;
            }

            #${ELEMENT_IDS.UI} textarea {
                padding: 8px;
                border: 1px solid rgba(0, 0, 0, 0.2);
                border-radius: 4px;
                color: #333;
                width: 100%;
                box-sizing: border-box;
                font-size: 13px;
                font-family: monospace;
                resize: vertical;
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
                background-color: #f0f0f0;
                color: #333;
                padding: 6px 10px;
                border: 1px solid rgba(0, 0, 0, 0.2);
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: background-color 0.2s;
                margin-right: 5px;
                margin-bottom: 5px;
            }
            
            #${ELEMENT_IDS.UI} button:hover {
                background-color: #e0e0e0;
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
                background-color: #ff5252;
                color: white;
                padding: 8px 12px;
                border: none;
                width: 100%;
                margin-top: 10px;
            }

            #${ELEMENT_IDS.RESET_SETTINGS_BUTTON}:hover {
                background-color: #ff1a1a;
            }

            #${ELEMENT_IDS.EXPORT_SETTINGS_BUTTON}, 
            #${ELEMENT_IDS.IMPORT_SETTINGS_BUTTON} {
                background-color: #4CAF50;
                color: white;
                padding: 8px 12px;
                border: none;
                width: calc(50% - 5px);
                margin-top: 5px;
            }

            #${ELEMENT_IDS.EXPORT_SETTINGS_BUTTON}:hover, 
            #${ELEMENT_IDS.IMPORT_SETTINGS_BUTTON}:hover {
                background-color: #45a049;
            }

            #${ELEMENT_IDS.SHOW_DIAGNOSTICS_BUTTON} {
                background-color: #2196F3;
                color: white;
                padding: 8px 12px;
                border: none;
                width: 100%;
                margin-top: 5px;
            }

            #${ELEMENT_IDS.SHOW_DIAGNOSTICS_BUTTON}:hover {
                background-color: #0b7dda;
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
                transform: translateY(-50%);
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
                transform: translateY(-50%) scale(1.1);
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
        if (!settings.keyboardShortcut || !settings.keyboardShortcut.enabled) return;
        
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
        try {
            if (typeof GM.registerMenuCommand !== 'undefined') {
                GM.registerMenuCommand('Toggle Dark Mode', () => toggleDarkMode());
                GM.registerMenuCommand('Open Settings', () => {
                    const ui = getElement(ELEMENT_IDS.UI);
                    if (ui && !uiVisible) {
                        toggleUI();
                    }
                });
                GM.registerMenuCommand('Toggle Extreme Mode', () => {
                    if (!settings.extremeMode) {
                        settings.extremeMode = { ...DEFAULT_SETTINGS.extremeMode };
                    }
                    settings.extremeMode.enabled = !settings.extremeMode.enabled;
                    saveSettings();
                    
                    // Update dark mode immediately if it's enabled
                    if (darkModeEnabled) {
                        toggleDarkMode(true);
                    }
                });
            }
        } catch (error) {
            log('debug', 'Menu commands not supported by userscript manager');
        }
    }

    /**
     * ------------------------
     * OPTIMIZED MUTATION OBSERVER
     * ------------------------
     */
    
    /**
     * Optimized setup for the mutation observer
     * @return {Array<MutationObserver>} Observers for potential cleanup
     */
    function setupMutationObserver() {
        const config = {
            childList: true,
            subtree: true,
            attributes: false
        };
        
        // Use a more efficient debounce for processing mutations
        const debouncedHandler = debounce(() => {
            // Only check for critical UI elements and recreate if missing
            const buttonExists = getElement(ELEMENT_IDS.BUTTON);
            if (!buttonExists) {
                log('info', 'Dark Mode Toggle: Button missing, recreating...');
                createToggleButton();
                updateButtonPosition();
                updateButtonState();
            }

            const toggleUIButtonExists = getElement(ELEMENT_IDS.TOGGLE_UI_BUTTON);
            if (!toggleUIButtonExists) {
                log('info', 'Dark Mode Toggle: Settings button missing, recreating...');
                createToggleUIButton();
            }

            // Only recreate UI when it's supposed to be visible but is missing
            if (uiVisible) {
                const uiExists = getElement(ELEMENT_IDS.UI);
                if (!uiExists) {
                    log('info', 'Dark Mode Toggle: UI missing, recreating...');
                    createUI();
                    updateUIValues();
                    applyUIStyles();
                    // Make it visible again since creating it doesn't automatically show it
                    const newUI = getElement(ELEMENT_IDS.UI);
                    if (newUI) {
                        newUI.classList.add('visible');
                        newUI.setAttribute('aria-hidden', 'false');
                    }
                }
            }
        }, 100, { leading: false, trailing: true });
        
        // Use a separate throttled function for extreme mode operations
        const throttledExtremeModeHandler = throttle(() => {
            if (darkModeEnabled && extremeModeActive) {
                // Check for new shadow roots with rate limiting
                if (!pendingOperations.has('shadowScan')) {
                    pendingOperations.add('shadowScan');
                    requestAnimationFrame(() => {
                        findShadowRoots();
                        pendingOperations.delete('shadowScan');
                    });
                }
                
                // Prioritize critical elements like fixed headers/menus
                requestAnimationFrame(() => {
                    if (extremeModeActive) {
                        forceElementStyles('body', { 
                            backgroundColor: '#121212 !important', 
                            color: '#ddd !important' 
                        });
                        
                        forceElementStyles('header, nav, [role="banner"], [role="navigation"]', { 
                            backgroundColor: '#1a1a1a !important', 
                            color: '#ddd !important' 
                        });
                    }
                });
            }
        }, 500);
        
        // Create a more focused observer
        const observer = new MutationObserver(mutations => {
            // Quick check if we need to process these mutations
            const hasRelevantMutations = mutations.some(mutation => {
                // Only care about added nodes for UI reconstruction
                return mutation.type === 'childList' && mutation.addedNodes.length > 0;
            });
            
            if (hasRelevantMutations) {
                debouncedHandler();
            }
            
            // Extreme mode handling in a separate observer with different timing
            if (darkModeEnabled && extremeModeActive) {
                throttledExtremeModeHandler();
            }
        });

        // Observe body only instead of the entire document
        if (document.body) {
            observer.observe(document.body, config);
        }
        
        // Also set up a minimal observer for the head to catch style changes
        const headObserver = new MutationObserver(throttledExtremeModeHandler);
        if (document.head) {
            headObserver.observe(document.head, { 
                childList: true, 
                subtree: false
            });
        }
        
        // Store observers for reference
        observers = [observer, headObserver];
        
        return observers;
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
        
        log('info', 'Enhanced Dark Mode Toggle: Initializing v3.1.0...');
        
        await loadSettings();
        await loadPerSiteSettings();

        // Register menu commands
        registerMenuCommands();

        // Create UI elements
        createToggleButton();
        createUI();
        createToggleUIButton();

        // Update UI state
        updateUIValues();
        applyUIStyles();

        // Initialize dark mode state
        darkModeEnabled = await GM.getValue(STORAGE_KEYS.DARK_MODE, false);
        if (darkModeEnabled) {
            toggleDarkMode(true);
        } else {
            toggleDarkMode(false);
        }
        
        // Set up keyboard shortcuts
        setupKeyboardShortcuts();
        
        // Set up scheduled dark mode checking
        setupScheduleChecking();
        
        // Set up dynamic scanning
        setupDynamicScanning();
        
        // Track problematic sites for diagnostics
        if (settings.diagnostics && settings.diagnostics.enabled) {
            collectSiteInfo();
        }
        
        // Apply enhanced features
        enhancedInit();
        
        log('info', 'Enhanced Dark Mode Toggle: Initialization complete');
    }

    /**
     * Enhanced features initialization
     */
    function enhancedInit() {
        // Enhance the toggle button with additional interactions
        enhanceToggleButton();
        
        // Add styles for the new features
        addEnhancementStyles();
        
        // Show a welcome toast on first run or after update
        GM.getValue('lastVersion', null).then(version => {
            if (version !== '3.1.0') {
                GM.setValue('lastVersion', '3.1.0');
                
                setTimeout(() => {
                    showToast('Enhanced Dark Mode Toggle Updated! Right-click for new features.', 4000);
                }, 2000);
            }
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
