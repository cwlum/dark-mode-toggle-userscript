// ==UserScript==
// @name         ☀️Dark Mode Toggle
// @author       Cervantes Wu (http://www.mriwu.us)
// @description  Dark mode toggle button with SVG icons, customizable UI, and advanced features, with per-site preferences. Optimized for user experience and responsiveness.
// @namespace    https://github.com/cwlum/dark-mode-toggle-userscript
// @version      2.3.0
// @match        *://*/*
// @exclude      devtools://*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.addStyle
// @grant        GM.deleteValue
// @require      https://unpkg.com/darkreader@4.9.58/darkreader.js
// @homepageURL  https://github.com/cwlum/dark-mode-toggle-userscript
// @supportURL   https://github.com/cwlum/dark-mode-toggle-userscript/issues
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // --- Constants ---
    const BUTTON_ID = 'darkModeToggle';
    const UI_ID = 'darkModeToggleUI';
    const TOGGLE_UI_BUTTON_ID = 'toggleDarkModeUIButton';
    const RESET_SETTINGS_BUTTON_ID = 'resetSettingsButton';
    const SITE_EXCLUSION_INPUT_ID = 'siteExclusionInput';
    const SITE_EXCLUSION_LIST_ID = 'siteExclusionList';
    const PER_SITE_SETTINGS_PREFIX = 'perSiteSettings_';

    // --- SVG Icons ---
    const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;

    // --- Default Settings ---
    const defaultSettings = {
        position: 'bottom-right',
        offsetX: 30,
        offsetY: 30,
        brightness: 100,
        contrast: 90,
        sepia: 10,
        themeColor: '#f7f7f7',
        textColor: '#444',
        fontFamily: 'sans-serif',
        exclusionList: [],
        iconMoon: moonIcon,
        iconSun: sunIcon,
        autoMode: false,
    };

    // --- Global Variables ---
    let settings = { ...defaultSettings };
    let uiVisible = false;
    let darkModeEnabled = false;

    // --- UI element references ---
    const uiElements = {};

    // --- Helper Functions ---

    // Debounce function
    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    // Check if the current site is excluded
    function isSiteExcluded(url) {
        return settings.exclusionList.some(excluded => url.startsWith(excluded));
    }

    // Function to create a button
    function createButton(id, text, onClick) {
        const button = document.createElement('button');
        button.id = id;
        button.textContent = text;
        button.addEventListener('click', onClick);
        return button;
    }

    // Update the exclusion list display
    function updateExclusionListDisplay() {
        if (!uiElements.siteExclusionList) return;

        uiElements.siteExclusionList.innerHTML = '';

        settings.exclusionList.forEach(excludedSite => {
            const listItem = document.createElement('li');
            listItem.textContent = excludedSite;

            const removeButton = createButton('removeButton-' + excludedSite, 'Remove', () => {
                settings.exclusionList = settings.exclusionList.filter(site => site !== excludedSite);
                saveSettings();
                updateExclusionListDisplay();
            });

            listItem.appendChild(removeButton);
            uiElements.siteExclusionList.appendChild(listItem);
        });
    }

    // Get per-site settings from storage
    async function loadPerSiteSettings() {
        const siteKey = PER_SITE_SETTINGS_PREFIX + window.location.hostname;
        try {
            const storedSettings = await GM.getValue(siteKey, null);
            if (storedSettings) {
                settings = { ...settings, ...storedSettings };
                darkModeEnabled = storedSettings.darkModeEnabled !== undefined ? storedSettings.darkModeEnabled : false;
                console.log(`Loaded per-site settings for ${window.location.hostname}:`, storedSettings);
            } else {
                console.log(`No per-site settings found for ${window.location.hostname}. Using global settings.`);
            }
        } catch (error) {
            console.error(`Failed to load per-site settings for ${window.location.hostname}:`, error);
        }
    }

    // Save per-site settings to storage
    async function savePerSiteSettings() {
        const siteKey = PER_SITE_SETTINGS_PREFIX + window.location.hostname;
        const perSiteSettings = {
            brightness: settings.brightness,
            contrast: settings.contrast,
            sepia: settings.sepia,
            position: settings.position,
            offsetX: settings.offsetX,
            offsetY: settings.offsetY,
            darkModeEnabled: darkModeEnabled,
            fontFamily: settings.fontFamily,
            themeColor: settings.themeColor,
            textColor: settings.textColor
        };
        try {
            await GM.setValue(siteKey, perSiteSettings);
            console.log(`Saved per-site settings for ${window.location.hostname}:`, perSiteSettings);
        } catch (error) {
            console.error(`Failed to save per-site settings for ${window.location.hostname}:`, error);
        }
    }

    // --- Setting Load/Save/Reset ---

    // Load settings from GM storage
    async function loadSettings() {
        try {
            const storedSettings = await GM.getValue('settings', defaultSettings);
            settings = { ...defaultSettings, ...storedSettings };
            updateButtonPosition();

            if (!Array.isArray(settings.exclusionList)) {
                settings.exclusionList = [];
                saveSettings();
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            settings = { ...defaultSettings };
            console.warn('Using default settings due to load failure.'); // Changed alert to console.warn
        }
    }

    // Save settings to GM storage (Debounced)
    const saveSettingsDebounced = debounce(async () => {
        try {
            await GM.setValue('settings', settings);
            updateButtonPosition();
            updateDarkReaderConfig();
            updateExclusionListDisplay();
        } catch (error) {
            console.error('Failed to save settings:', error);
            console.error('Settings not saved. Check console for errors.'); // Changed alert to console.error
        }
    }, 300); // Reduced delay to 300ms

    function saveSettings() {
        saveSettingsDebounced();
        savePerSiteSettings();
    }

    // Reset settings to default
    async function resetSettings() {
        if (confirm('Are you sure you want to reset settings to default? This will clear ALL settings.')) {
            try { // Added try-catch for error handling
                for (const key in defaultSettings) {
                    await GM.deleteValue(key);
                }

                settings = { ...defaultSettings };
                await GM.setValue('settings', settings);
                darkModeEnabled = false;

                updateButtonPosition();
                updateDarkReaderConfig();
                updateUIValues();
                updateButtonState();
                updateExclusionListDisplay();
                toggleDarkMode(false);
                await savePerSiteSettings();

            } catch (error) {
                console.error("Error during reset:", error);
                alert("An error occurred during settings reset. Please check the console.");
            }
        }
    }

    // --- UI Update Functions ---

    // Update UI element values based on current settings
    function updateUIValues() {
        if (!uiElements.positionSelect) return;

        uiElements.positionSelect.value = settings.position;
        uiElements.offsetXInput.value = settings.offsetX;
        uiElements.offsetYInput.value = settings.offsetY;
        uiElements.brightnessInput.value = settings.brightness;
        uiElements.contrastInput.value = settings.contrast;
        uiElements.sepiaInput.value = settings.sepia;
        uiElements.themeColorInput.value = settings.themeColor;
        uiElements.textColorInput.value = settings.textColor;
        uiElements.fontFamilyInput.value = settings.fontFamily;
        updateExclusionListDisplay();
    }

    // Function to update the button's class based on the dark mode state
    function updateButtonState() {
        const button = document.getElementById(BUTTON_ID);
        if (!button) return;

        if (darkModeEnabled) {
            button.classList.add('dark');
            button.setAttribute('aria-label', 'Disable Dark Mode'); // Accessibility
        } else {
            button.classList.remove('dark');
            button.setAttribute('aria-label', 'Enable Dark Mode'); // Accessibility
        }
    }

    // --- Dark Mode Logic ---

    // Toggle dark mode function (with optional force parameter)
    async function toggleDarkMode(force) {
        darkModeEnabled = force !== undefined ? force : !darkModeEnabled;

        const button = document.getElementById(BUTTON_ID);

        if (darkModeEnabled) {
            if (!isSiteExcluded(window.location.href)) {
                updateDarkReaderConfig();
                await GM.setValue('darkMode', true);
                button.classList.add('dark');
                console.log('Dark mode enabled.');
            } else {
                darkModeEnabled = false;
                button.classList.remove('dark');
                console.log('Site excluded. Dark mode disabled.');
                DarkReader.disable();
                await GM.setValue('darkMode', false);
            }
        } else {
            DarkReader.disable();
            await GM.setValue('darkMode', false);
            button.classList.remove('dark');
            console.log('Dark mode disabled.');
        }
        await savePerSiteSettings();
    }

    // Update DarkReader configuration
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

    // --- DOM Element Creation ---

    // Create toggle button
    function createToggleButton() {
        const button = document.createElement('button');
        button.id = BUTTON_ID;
        button.innerHTML = `<span class="icon">${moonIcon}</span>`; // Initial icon
        button.setAttribute('aria-label', 'Toggle Dark Mode'); // Accessibility
        document.body.appendChild(button);
        button.addEventListener('click', () => {
            toggleDarkMode();
        });
        updateButtonPosition();
    }

    // Update Button Position based on settings
    function updateButtonPosition() {
        const button = document.getElementById(BUTTON_ID);
        if (!button) return;

        const { position, offsetX, offsetY } = settings;

        button.style.bottom = '';
        button.style.top = '';
        button.style.left = '';
        button.style.right = '';
        button.style.transition = 'all 0.3s ease'; // Add transition for smoother position changes

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

    // Create UI
    function createUI() {
        const ui = document.createElement('div');
        ui.id = UI_ID;
        ui.setAttribute('aria-label', 'Dark Mode Settings');  // Accessibility

        // --- Position Settings ---

        const positionLabel = document.createElement('label');
        positionLabel.textContent = 'Position:';
        uiElements.positionSelect = document.createElement('select');
        uiElements.positionSelect.id = 'positionSelect';
        uiElements.positionSelect.setAttribute('aria-label', 'Button Position');  // Accessibility
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
        ui.appendChild(positionLabel);
        ui.appendChild(uiElements.positionSelect);

        const offsetXLabel = document.createElement('label');
        offsetXLabel.textContent = 'Offset X:';
        uiElements.offsetXInput = document.createElement('input');
        uiElements.offsetXInput.type = 'number';
        uiElements.offsetXInput.id = 'offsetXInput';
        uiElements.offsetXInput.setAttribute('aria-label', 'Horizontal Offset');  // Accessibility
        uiElements.offsetXInput.value = settings.offsetX;
        uiElements.offsetXInput.addEventListener('change', (e) => {
            settings.offsetX = parseInt(e.target.value);
            saveSettings();
        });
        ui.appendChild(offsetXLabel);
        ui.appendChild(uiElements.offsetXInput);

        const offsetYLabel = document.createElement('label');
        offsetYLabel.textContent = 'Offset Y:';
        uiElements.offsetYInput = document.createElement('input');
        uiElements.offsetYInput.type = 'number';
        uiElements.offsetYInput.id = 'offsetYInput';
        uiElements.offsetYInput.setAttribute('aria-label', 'Vertical Offset');  // Accessibility
        uiElements.offsetYInput.value = settings.offsetY;
        uiElements.offsetYInput.addEventListener('change', (e) => {
            settings.offsetY = parseInt(e.target.value);
            saveSettings();
        });
        ui.appendChild(offsetYLabel);
        ui.appendChild(uiElements.offsetYInput);

        // --- DarkReader Settings ---

        const brightnessLabel = document.createElement('label');
        brightnessLabel.textContent = 'Brightness:';
        uiElements.brightnessInput = document.createElement('input');
        uiElements.brightnessInput.type = 'number';
        uiElements.brightnessInput.id = 'brightnessInput';
        uiElements.brightnessInput.setAttribute('aria-label', 'Brightness');  // Accessibility
        uiElements.brightnessInput.value = settings.brightness;
        uiElements.brightnessInput.min = 0;
        uiElements.brightnessInput.max = 100;
        uiElements.brightnessInput.addEventListener('input', (e) => {  // Using 'input' for real-time feedback
            settings.brightness = parseInt(e.target.value);
            saveSettings();  // Save settings on every input change
        });
        ui.appendChild(brightnessLabel);
        ui.appendChild(uiElements.brightnessInput);

        const contrastLabel = document.createElement('label');
        uiElements.contrastInput = document.createElement('input');
        contrastLabel.textContent = 'Contrast:';
        uiElements.contrastInput.type = 'number';
        uiElements.contrastInput.id = 'contrastInput';
        uiElements.contrastInput.setAttribute('aria-label', 'Contrast');  // Accessibility
        uiElements.contrastInput.value = settings.contrast;
        uiElements.contrastInput.min = 0;
        uiElements.contrastInput.max = 100;
        uiElements.contrastInput.addEventListener('input', (e) => {  // Using 'input' for real-time feedback
            settings.contrast = parseInt(e.target.value);
            saveSettings();  // Save settings on every input change
        });
        ui.appendChild(contrastLabel);
        ui.appendChild(uiElements.contrastInput);

        const sepiaLabel = document.createElement('label');
        sepiaLabel.textContent = 'Sepia:';
        uiElements.sepiaInput = document.createElement('input');
        uiElements.sepiaInput.type = 'number';
        uiElements.sepiaInput.id = 'sepiaInput';
        uiElements.sepiaInput.setAttribute('aria-label', 'Sepia');  // Accessibility
        uiElements.sepiaInput.value = settings.sepia;
        uiElements.sepiaInput.min = 0;
        uiElements.sepiaInput.max = 100;
        uiElements.sepiaInput.addEventListener('input', (e) => {  // Using 'input' for real-time feedback
            settings.sepia = parseInt(e.target.value);
            saveSettings();  // Save settings on every input change
        });
        ui.appendChild(sepiaLabel);
        ui.appendChild(uiElements.sepiaInput);

        // --- Font Settings ---
        const fontFamilyLabel = document.createElement('label');
        fontFamilyLabel.textContent = 'Font Family:';
        uiElements.fontFamilyInput = document.createElement('input');
        uiElements.fontFamilyInput.type = 'text';
        uiElements.fontFamilyInput.id = 'fontFamilyInput';
        uiElements.fontFamilyInput.setAttribute('aria-label', 'Font Family');  // Accessibility
        uiElements.fontFamilyInput.value = settings.fontFamily;
        uiElements.fontFamilyInput.addEventListener('change', (e) => {
            settings.fontFamily = e.target.value;
            saveSettings();
        });
        ui.appendChild(fontFamilyLabel);
        ui.appendChild(uiElements.fontFamilyInput);

        // --- Theme Settings ---

        const themeColorLabel = document.createElement('label');
        themeColorLabel.textContent = 'UI Theme Color:';
        uiElements.themeColorInput = document.createElement('input');
        uiElements.themeColorInput.type = 'color';
        uiElements.themeColorInput.id = 'themeColorInput';
        uiElements.themeColorInput.setAttribute('aria-label', 'Theme Color');  // Accessibility
        uiElements.themeColorInput.value = settings.themeColor;
        uiElements.themeColorInput.addEventListener('change', (e) => {
            settings.themeColor = e.target.value;
            applyUIStyles();
            saveSettings();
        });
        ui.appendChild(themeColorLabel);
        ui.appendChild(uiElements.themeColorInput);

        const textColorLabel = document.createElement('label');
        textColorLabel.textContent = 'UI Text Color:';
        uiElements.textColorInput = document.createElement('input');
        uiElements.textColorInput.type = 'color';
        uiElements.textColorInput.id = 'textColorInput';
        uiElements.textColorInput.setAttribute('aria-label', 'Text Color');  // Accessibility
        uiElements.textColorInput.value = settings.textColor;
        uiElements.textColorInput.addEventListener('change', (e) => {
            settings.textColor = e.target.value;
            applyUIStyles();
            saveSettings();
        });
        ui.appendChild(textColorLabel);
        ui.appendChild(uiElements.textColorInput);

        // --- Site Exclusion ---
        const siteExclusionLabel = document.createElement('label');
        siteExclusionLabel.textContent = 'Exclude Site:';

        uiElements.siteExclusionInput = document.createElement('input');
        uiElements.siteExclusionInput.type = 'text';
        uiElements.siteExclusionInput.id = SITE_EXCLUSION_INPUT_ID;
        uiElements.siteExclusionInput.setAttribute('aria-label', 'Enter URL to exclude');  // Accessibility
        uiElements.siteExclusionInput.placeholder = 'Enter URL to exclude';

        const addButton = createButton('addExclusionButton', 'Add Exclusion', () => {
            const url = uiElements.siteExclusionInput.value.trim();
            if (url && !settings.exclusionList.includes(url)) {
                settings.exclusionList.push(url);
                saveSettings();
                updateExclusionListDisplay();
                uiElements.siteExclusionInput.value = '';
            }
        });

        uiElements.siteExclusionList = document.createElement('ul');
        uiElements.siteExclusionList.id = SITE_EXCLUSION_LIST_ID;
        uiElements.siteExclusionList.setAttribute('aria-label', 'Excluded Sites');  // Accessibility

        ui.appendChild(siteExclusionLabel);
        ui.appendChild(uiElements.siteExclusionInput);
        ui.appendChild(addButton);
        ui.appendChild(uiElements.siteExclusionList);

        // --- Reset Settings Button ---

        const resetSettingsButton = createButton(RESET_SETTINGS_BUTTON_ID, 'Reset Settings', resetSettings);
        ui.appendChild(resetSettingsButton);

        document.body.appendChild(ui);
    }

    // Create a button to toggle the UI
    function createToggleUIButton() {
        const toggleUIButton = createButton(TOGGLE_UI_BUTTON_ID, 'Settings', toggleUI);
        document.body.appendChild(toggleUIButton);
    }

    // Toggle the visibility of the settings UI
    function toggleUI() {
        const ui = document.getElementById(UI_ID);
        uiVisible = !uiVisible;
        if (uiVisible) {
            ui.classList.add('visible');
            ui.setAttribute('aria-hidden', 'false');  // Accessibility
        } else {
            ui.classList.remove('visible');
            ui.setAttribute('aria-hidden', 'true');   // Accessibility
        }
    }

    // --- Dynamic Styles ---

    // Apply UI styles dynamically based on settings
    function applyUIStyles() {
        const ui = document.getElementById(UI_ID);
        if (ui) {
            ui.style.backgroundColor = settings.themeColor;
            ui.style.color = settings.textColor;
            ui.style.fontFamily = settings.fontFamily;
        }

        GM.addStyle(generateStyles());
    }

    // --- Styling ---

    function generateStyles() {
        const { themeColor, textColor, iconMoon, iconSun } = settings;

        return `
            #${BUTTON_ID} {
                width: 80px;
                height: 40px;
                background-color: #fff;
                border-radius: 20px;
                border: none;
                cursor: pointer;
                z-index: 1000;
                opacity: 0.8;
                transition-property: transform, opacity, box-shadow, background-color;
                transition-duration: 0.3s;
                transition-timing-function: cubic-bezier(0.25, 0.8, 0.25, 1), ease, ease, ease;
                display: flex;
                align-items: center;
                padding: 0 4px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
                position: fixed;
            }

            #${BUTTON_ID}:hover {
                opacity: 1;
                transform: scale(1.1);
                transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
            }

            #${BUTTON_ID} .icon {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                transition-property: transform, background-color, -webkit-mask-image, mask-image;
                transition-duration: 0.3s;
                transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55), ease, ease, ease;
                z-index: 1;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 20px;
                color: #333;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
                background: none;
                -webkit-mask-image: url('data:image/svg+xml;utf8,${iconMoon}');
                mask-image: url('data:image/svg+xml;utf8,${iconMoon}');
                -webkit-mask-size: cover;
                mask-size: cover;
                background-color: #333;
            }

            #${BUTTON_ID}.dark {
                background-color: #000;
            }

            #${BUTTON_ID}.dark .icon {
                transform: translateX(40px);
                color: #ffeb3b;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
                background: none;
                -webkit-mask-image: url('data:image/svg+xml;utf8,${iconSun}');
                mask-image: url('data:image/svg+xml;utf8,${iconSun}');
                -webkit-mask-size: cover;
                mask-size: cover;
                background-color: #fff;
            }

            /* UI Styles */
            #${UI_ID} {
                position: fixed;
                top: 20px;
                left: 20px;
                background-color: ${themeColor};
                border: 1px solid #ddd;
                padding: 15px;
                z-index: 1001;
                border-radius: 8px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                display: none;
                color: ${textColor};
                font-family: ${settings.fontFamily};
                max-width: 90vw;
                max-height: 80vh;
                overflow: auto;
            }

            #${UI_ID}.visible {
                display: block;
            }

            #${UI_ID} label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
            }

            #${UI_ID} select, #${UI_ID} input[type="number"], #${UI_ID} input[type="color"], #${UI_ID} input[type="text"] {
                margin-bottom: 12px;
                padding: 8px;
                border: 1px solid #ccc;
                border-radius: 4px;
                color: #555;
                width: 100%;
                max-width: 150px;
                box-sizing: border-box;
            }

            #${UI_ID} ul#${SITE_EXCLUSION_LIST_ID} {
                list-style-type: none;
                padding: 0;
            }

            #${UI_ID} ul#${SITE_EXCLUSION_LIST_ID} li {
                margin-bottom: 5px;
            }

            #${UI_ID} ul#${SITE_EXCLUSION_LIST_ID} li button {
                margin-left: 10px;
                background-color: #f44336;
                color: white;
                border: none;
                padding: 5px 8px;
                border-radius: 4px;
                cursor: pointer;
            }

            /* Toggle UI Button Styles */
            #${TOGGLE_UI_BUTTON_ID} {
                position: fixed;
                top: 50%;
                right: 0;
                transform: translateY(-50%) rotate(-90deg);
                background-color: #ddd;
                border: 1px solid #ccc;
                padding: 8px 12px;
                z-index: 1002;
                border-radius: 5px;
                cursor: pointer;
                color: #444;
                font-size: 14px;
                white-space: nowrap;
            }

            #${TOGGLE_UI_BUTTON_ID}:hover {
                background-color: #eee;
            }

            /* Reset Settings Button Styles */
            #${RESET_SETTINGS_BUTTON_ID} {
                background-color: #f44336;
                color: white;
                padding: 8px 12px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                margin-top: 10px;
            }

            #${RESET_SETTINGS_BUTTON_ID}:hover {
                background-color: #da190b;
            }
        `;
    }

    // Initial style injection
    GM.addStyle(generateStyles());

    // --- Initialization ---

    async function init() {
        await loadSettings();
        await loadPerSiteSettings();

        createToggleButton();
        createUI();
        createToggleUIButton();

        updateUIValues();
        applyUIStyles();

        darkModeEnabled = await GM.getValue('darkMode', false);
        if (darkModeEnabled && !isSiteExcluded(window.location.href)) {
            toggleDarkMode(true);
        } else {
            toggleDarkMode(false);
        }
        updateButtonState();
    }

    // --- DOM Mutation Observer ---
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                const buttonExists = document.getElementById(BUTTON_ID);
                if (!buttonExists) {
                    console.log('Button lost, recreating...');
                    createToggleButton();
                    updateButtonPosition();
                    updateButtonState();
                }

                const uiExists = document.getElementById(UI_ID);
                if (!uiExists) {
                    console.log('UI lost, recreating...');
                    createUI();
                    updateUIValues();
                    applyUIStyles();
                }

                const toggleUIButtonExists = document.getElementById(TOGGLE_UI_BUTTON_ID);
                if (!toggleUIButtonExists) {
                    console.log('Toggle UI button lost, recreating...');
                    createToggleUIButton();
                }
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // --- Lazy Initialization ---
    // Delay the script initialization until the DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
