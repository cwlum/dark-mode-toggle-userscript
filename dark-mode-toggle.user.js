// ==UserScript==
// @name         ☀️Dark Mode Toggle
// @author       Cervantes Wu (http://www.mriwu.us)
// @description  Enhanced dark mode toggle with improved performance, better code organization, and advanced site-specific preferences
// @namespace    https://github.com/cwlum/dark-mode-toggle-userscript
// @version      2.5.0
// @match        *://*/*
// @exclude      devtools://*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.addStyle
// @grant        GM.deleteValue
// @grant        GM.listValues
// @require      https://unpkg.com/darkreader@4.9.58/darkreader.js
// @homepageURL  https://github.com/cwlum/dark-mode-toggle-userscript
// @supportURL   https://github.com/cwlum/dark-mode-toggle-userscript/issues
// @license      MIT
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
        THEME_PRESETS_SELECT: 'themePresetsSelect'
    };

    const STORAGE_KEYS = {
        SETTINGS: 'settings',
        DARK_MODE: 'darkMode',
        PER_SITE_SETTINGS_PREFIX: 'perSiteSettings_'
    };

    // Complete SVG icons for moon and sun
    const SVG_ICONS = {
        MOON: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
        SUN: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
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
        settingsButtonOffset: 20, // New setting to control the settings button position
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

    /**
     * ------------------------
     * UTILITY FUNCTIONS
     * ------------------------
     */
    
    /**
     * Debounce function to limit how often a function is executed
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in ms
     * @return {Function} Debounced function
     */
    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    /**
     * Check if current site is in the exclusion list
     * @param {string} url - Current URL to check
     * @return {boolean} Whether site is excluded
     */
    function isSiteExcluded(url) {
        return settings.exclusionList.some(pattern => {
            // Support basic wildcards
            if (pattern.includes('*')) {
                const regexPattern = pattern
                    .replace(/\./g, '\\.')
                    .replace(/\*/g, '.*');
                return new RegExp('^' + regexPattern + '$').test(url);
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
                settings = { ...settings, ...storedSettings };
                darkModeEnabled = typeof storedSettings.darkModeEnabled === 'boolean' 
                    ? storedSettings.darkModeEnabled 
                    : false;
                console.log(`Loaded per-site settings for ${getCurrentSiteIdentifier()}:`, storedSettings);
            } else {
                console.log(`No per-site settings found for ${getCurrentSiteIdentifier()}. Using global settings.`);
            }
        } catch (error) {
            console.error(`Failed to load per-site settings:`, error);
        }
    }

    /**
     * Save per-site settings to storage
     * @return {Promise<void>}
     */
    async function savePerSiteSettings() {
        const siteKey = STORAGE_KEYS.PER_SITE_SETTINGS_PREFIX + getCurrentSiteIdentifier();
        const perSiteSettings = {
            brightness: settings.brightness,
            contrast: settings.contrast,
            sepia: settings.sepia,
            darkModeEnabled: darkModeEnabled
        };
        
        try {
            await GM.setValue(siteKey, perSiteSettings);
            console.log(`Saved per-site settings for ${getCurrentSiteIdentifier()}:`, perSiteSettings);
        } catch (error) {
            console.error(`Failed to save per-site settings:`, error);
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
            
            if (!Array.isArray(settings.exclusionList)) {
                settings.exclusionList = [];
            }
            
            // Ensure scheduledDarkMode settings exist
            if (!settings.scheduledDarkMode) {
                settings.scheduledDarkMode = DEFAULT_SETTINGS.scheduledDarkMode;
            }
            
            // Ensure keyboard shortcut settings exist
            if (!settings.keyboardShortcut) {
                settings.keyboardShortcut = DEFAULT_SETTINGS.keyboardShortcut;
            }
            
            updateButtonPosition();
        } catch (error) {
            console.error('Failed to load settings:', error);
            settings = { ...DEFAULT_SETTINGS };
            console.warn('Using default settings due to load failure.');
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
        } catch (error) {
            console.error('Failed to save settings:', error);
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
                
                // Find all per-site settings keys
                const allKeys = await GM.listValues ? GM.listValues() : [];
                if (Array.isArray(allKeys)) {
                    allKeys.forEach(key => {
                        if (key.startsWith(STORAGE_KEYS.PER_SITE_SETTINGS_PREFIX)) {
                            siteKeys.push(key);
                        }
                    });
                }
                
                // Delete all per-site settings
                for (const key of siteKeys) {
                    await GM.deleteValue(key);
                }

                // Reset all global settings
                settings = { ...DEFAULT_SETTINGS };
                await GM.setValue(STORAGE_KEYS.SETTINGS, settings);
                await GM.setValue(STORAGE_KEYS.DARK_MODE, false);
                
                darkModeEnabled = false;

                // Update UI to reflect changes
                updateButtonPosition();
                updateDarkReaderConfig();
                updateUIValues();
                updateButtonState();
                updateExclusionListDisplay();
                toggleDarkMode(false);
                await savePerSiteSettings();
                
                // Reset schedule checking
                setupScheduleChecking();

                alert('All settings have been reset to defaults.');

            } catch (error) {
                console.error("Error during reset:", error);
                alert("An error occurred during settings reset. Please check the console.");
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
            const allKeys = await GM.listValues ? GM.listValues() : [];
            
            if (Array.isArray(allKeys)) {
                for (const key of allKeys) {
                    if (key.startsWith(STORAGE_KEYS.PER_SITE_SETTINGS_PREFIX)) {
                        const siteData = await GM.getValue(key);
                        perSiteSettings[key] = siteData;
                    }
                }
            }
            
            const exportData = {
                global: settings,
                perSite: perSiteSettings,
                darkModeEnabled: darkModeEnabled,
                version: '2.5.0'
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
            
        } catch (error) {
            console.error('Failed to export settings:', error);
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
                    
                    // Update UI to reflect imported settings
                    updateButtonPosition();
                    updateDarkReaderConfig();
                    updateUIValues();
                    updateButtonState();
                    updateExclusionListDisplay();
                    setupScheduleChecking();
                    
                    alert('Settings imported successfully!');
                    
                } catch (parseError) {
                    console.error('Failed to parse settings file:', parseError);
                    alert('Failed to import settings: Invalid file format');
                }
            };
            
            reader.readAsText(file);
            
        } catch (error) {
            console.error('Failed to import settings:', error);
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
        darkModeEnabled = force !== undefined ? force : !darkModeEnabled;

        const button = document.getElementById(ELEMENT_IDS.BUTTON);
        if (!button) return;

        if (darkModeEnabled) {
            if (!isSiteExcluded(window.location.href)) {
                updateDarkReaderConfig();
                await GM.setValue(STORAGE_KEYS.DARK_MODE, true);
                console.log('Dark mode enabled.');
            } else {
                darkModeEnabled = false;
                DarkReader.disable();
                await GM.setValue(STORAGE_KEYS.DARK_MODE, false);
                console.log('Site excluded. Dark mode disabled.');
            }
        } else {
            DarkReader.disable();
            await GM.setValue(STORAGE_KEYS.DARK_MODE, false);
            console.log('Dark mode disabled.');
        }
        
        updateButtonState();
        await savePerSiteSettings();
    }

    /**
     * Update Dark Reader configuration based on current settings
     */
    function updateDarkReaderConfig() {
        if (darkModeEnabled && !isSiteExcluded(window.location.href)) {
            DarkReader.enable({
                brightness: settings.brightness,
                contrast: settings.contrast,
                sepia: settings.sepia,
                style: {
                    fontFamily: settings.fontFamily
                }
            });
        } else {
            DarkReader.disable();
        }
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
            console.log(`Scheduled dark mode: Setting to ${shouldBeDark ? 'enabled' : 'disabled'}`);
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
     * UI MANAGEMENT
     * ------------------------
     */
    
    /**
     * Create the dark mode toggle button
     */
    function createToggleButton() {
        const existingButton = document.getElementById(ELEMENT_IDS.BUTTON);
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
        const button = document.getElementById(ELEMENT_IDS.BUTTON);
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
        const existingUI = document.getElementById(ELEMENT_IDS.UI);
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
        versionInfo.textContent = 'Dark Mode Toggle v2.5.0';
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
     * Create a button to toggle the settings UI
     */
    function createToggleUIButton() {
        const existingButton = document.getElementById(ELEMENT_IDS.TOGGLE_UI_BUTTON);
        if (existingButton) return;
        
        const toggleUIButton = createButton(ELEMENT_IDS.TOGGLE_UI_BUTTON, 'Settings', toggleUI);
        document.body.appendChild(toggleUIButton);
        updateSettingsButtonPosition();
    }

    /**
     * Update position of the settings button based on offset setting
     */
    function updateSettingsButtonPosition() {
        const button = document.getElementById(ELEMENT_IDS.TOGGLE_UI_BUTTON);
        if (button) {
            button.style.right = `${settings.settingsButtonOffset || DEFAULT_SETTINGS.settingsButtonOffset}px`;
        }
    }

    /**
     * Toggle the visibility of the settings UI
     */
    function toggleUI() {
        const ui = document.getElementById(ELEMENT_IDS.UI);
        uiVisible = !uiVisible;
        
        if (uiVisible) {
            ui.classList.add('visible');
            ui.setAttribute('aria-hidden', 'false');
            updateUIValues();
        } else {
            ui.classList.remove('visible');
            ui.setAttribute('aria-hidden', 'true');
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
        
        // Update scheduled dark mode values
        if (uiElements.scheduleEnabledToggle && settings.scheduledDarkMode) {
            uiElements.scheduleEnabledToggle.checked = settings.scheduledDarkMode.enabled;
            uiElements.scheduleStartTime.value = settings.scheduledDarkMode.startTime;
            uiElements.scheduleEndTime.value = settings.scheduledDarkMode.endTime;
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
        const existingStyle = document.getElementById('darkModeToggleStyle');
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
                z-index: 9998;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                display: none;
                color: ${textColor};
                font-family: ${settings.fontFamily};
                max-width: 90vw;
                max-height: 80vh;
                overflow: auto;
                width: 300px;
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

            .schedule-info {
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
                transform: translateY(-50%) rotate(-90deg);
                transform-origin: 100% 50%;
                background-color: rgba(240, 240, 240, 0.8);
                border: 1px solid rgba(0, 0, 0, 0.1);
                padding: 5px 10px;
                z-index: 9997;
                border-radius: 5px 5px 0 0;
                cursor: pointer;
                color: #444;
                font-size: 12px;
                white-space: nowrap;
                box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
                transition: all 0.3s ease;
            }

            #${ELEMENT_IDS.TOGGLE_UI_BUTTON}:hover {
                background-color: rgba(240, 240, 240, 1);
                padding-bottom: 8px;
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
        
        console.log('Dark Mode Toggle: Initializing...');
        
        await loadSettings();
        await loadPerSiteSettings();

        // Create UI elements
        createToggleButton();
        createUI();
        createToggleUIButton();

        // Update UI state
        updateUIValues();
        applyUIStyles();

        // Initialize dark mode state
        darkModeEnabled = await GM.getValue(STORAGE_KEYS.DARK_MODE, false);
        if (darkModeEnabled && !isSiteExcluded(window.location.href)) {
            toggleDarkMode(true);
        } else {
            toggleDarkMode(false);
        }
        
        // Set up keyboard shortcuts
        setupKeyboardShortcuts();
        
        // Set up scheduled dark mode checking
        setupScheduleChecking();
        
        console.log('Dark Mode Toggle: Initialization complete');
    }

    /**
     * Setup DOM mutation observer to ensure UI elements persist
     */
    function setupMutationObserver() {
        // More targeted mutation observer approach
        const observer = new MutationObserver(debounce(() => {
            // Only check for critical UI elements and recreate if missing
            const buttonExists = document.getElementById(ELEMENT_IDS.BUTTON);
            if (!buttonExists) {
                console.log('Dark Mode Toggle: Button missing, recreating...');
                createToggleButton();
                updateButtonPosition();
                updateButtonState();
            }

            const toggleUIButtonExists = document.getElementById(ELEMENT_IDS.TOGGLE_UI_BUTTON);
            if (!toggleUIButtonExists) {
                console.log('Dark Mode Toggle: Settings button missing, recreating...');
                createToggleUIButton();
            }

            // Only recreate UI when it's supposed to be visible but is missing
            if (uiVisible) {
                const uiExists = document.getElementById(ELEMENT_IDS.UI);
                if (!uiExists) {
                    console.log('Dark Mode Toggle: UI missing, recreating...');
                    createUI();
                    updateUIValues();
                    applyUIStyles();
                    // Make it visible again since creating it doesn't automatically show it
                    const newUI = document.getElementById(ELEMENT_IDS.UI);
                    if (newUI) {
                        newUI.classList.add('visible');
                        newUI.setAttribute('aria-hidden', 'false');
                    }
                }
            }
        }, 300));  // Reduced from 500ms to 300ms for better responsiveness

        // Observe the body but with a subtree depth of 1 to avoid expensive deep watching
        observer.observe(document.body, {
            childList: true,
            subtree: false
        });
    }

    /**
     * Handle script initialization based on document readiness
     */
    function initializationHandler() {
        // Wait for document body to be available
        if (!document.body) {
            setTimeout(initializationHandler, 50);
            return;
        }
        
        init().then(() => {
            setupMutationObserver();
        });
    }

    // Begin initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializationHandler);
    } else {
        initializationHandler();
    }

})();
