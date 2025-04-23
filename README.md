# Enhanced Dark Mode Toggle User Script

![Version](https://img.shields.io/badge/version-3.1.0-orange)
![License](https://img.shields.io/badge/license-MIT-yellow)
![Last Updated](https://img.shields.io/badge/last%20updated-2025--04--23-informational)

A powerful user script that adds a customizable dark mode toggle button to any website, with enhanced compatibility and advanced features to work on even the most resistant sites.

## Features

*   **Universal Dark Mode Compatibility:** Works on virtually all websites, even those with their own dark mode or resistant to dark mode implementation.
*   **Extreme Mode:** Forces dark theme on resistant websites with site-specific optimizations.
*   **Dynamic Selectors & Shadow DOM Support:** Automatically detects and applies dark mode to dynamically loaded content and shadow DOM elements.
*   **Custom CSS Per Site:** Add your own custom CSS rules for specific websites that persist between visits.
*   **Site-Specific Fixes:** Built-in optimizations for problematic sites like YouTube, Twitter/X, Facebook, Reddit, and GitHub.
*   **Device-Aware Optimization:** Automatically detects device type, performance capabilities, and battery status to optimize functionality.
*   **Adaptive Performance Modes:** Adjusts scanning frequency and processing intensity based on device capabilities (High/Medium/Low).
*   **Mobile & Touch Support:** Optimized button sizes and positioning for touch devices and mobile screens.
*   **Reduced Motion Options:** Accessibility settings to reduce animations for users who prefer less motion.
*   **Low Power Mode:** Battery-aware features that reduce resource usage when battery is low.
*   **Per-Site Position Settings:** Remember button position separately for each website.
*   **Diagnostic System:** Troubleshoot issues with specific websites and generate diagnostic reports.
*   **Easy Dark Mode Toggle:**  Quickly enable or disable dark mode with a single click.
*   **Customizable UI:**  Adjust the position, colors, font, and other UI elements to match your preferences.
*   **DarkReader Integration:**  Leverages DarkReader for advanced dark mode conversion, providing excellent results on most websites.
*   **Site Exclusion:**  Exclude specific websites where you don't want dark mode to be applied, with support for wildcards.
*   **Scheduled Dark Mode:** Set up automatic switching between light and dark modes based on specific times.
*   **Theme Presets:** Choose from multiple predefined themes including High Contrast, Low Contrast, Sepia, Night Mode, Ultra Dark, and Midnight.
*   **Import/Export Settings:** Back up and restore all your preferences and site-specific settings.
*   **Keyboard Shortcuts:** Toggle dark mode quickly using configurable keyboard shortcuts (default: Alt+Shift+D).
*   **Persistent Settings:**  Your settings are saved and automatically applied across all websites.
*   **Lightweight and Efficient:**  Minimal impact on website performance with optimized scanning.

## Installation

1.  Install a userscript manager such as [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Safari, Edge).
2.  Click the following link to install the script: [dark-mode-toggle.user.js](https://github.com/cwlum/dark-mode-toggle-userscript/raw/main/dark-mode-toggle.user.js)
3.  Tampermonkey will prompt you to install the script. Click "Install".

## Usage

After installation, a dark mode toggle button will appear on every website you visit.

*   **Click the button** to toggle dark mode on or off.
*   **Press Alt+Shift+D** (default shortcut) to toggle dark mode from anywhere on the page.
*   **Click the gear icon** on the right side of the screen to open the settings panel.
*   **In the settings panel,** you can:
    *   Change the button's position (top-left, top-right, bottom-left, bottom-right).
    *   Adjust the button's offset from the edge of the screen.
    *   Apply theme presets for quick visual style changes.
    *   Configure DarkReader settings (brightness, contrast, sepia).
    *   Enable Extreme Mode for resistant websites.
    *   Add custom CSS for the current website.
    *   Configure dynamic monitoring settings for improved compatibility.
    *   Set up automatic dark mode scheduling with custom times.
    *   Change the UI theme color and text color.
    *   Set the font family for the UI.
    *   Add websites to the exclusion list with support for wildcards.
    *   Configure device optimization settings for better performance.
    *   Generate diagnostic reports to troubleshoot issues.
    *   Import and export your settings for backup or sharing.
    *   Reset all settings to their defaults.

## Configuration Options

The following configuration options are available in the settings panel:

### Site-Specific Settings
*   **Enable Per-Site Settings:** Save different settings for each website.
*   **Use Global Button Position:** Choose whether to use global position settings or site-specific position.
*   **Current Site Info:** Shows the identifier for the current website.

### Button Position
*   **Position:** The position of the toggle button on the screen.
*   **Offset X/Y:** The horizontal/vertical offset of the toggle button from the edge of the screen (in pixels).
*   **Settings Button Offset:** Adjust the position of the settings button on the screen.

### Device Optimization
*   **Enable Device Optimization:** Automatically adjust performance based on device capabilities.
*   **Reduce Animations:** Minimize animations for better performance or accessibility.
*   **Low Power Mode:** Conserve battery by reducing processing intensity when battery is low.

### Theme Settings
*   **Theme Presets:** Quickly apply predefined visual themes (Default, High Contrast, Low Contrast, Sepia, Night Mode, Ultra Dark, Midnight).
*   **Brightness/Contrast/Sepia:** Fine-tune the dark mode filter appearance (0-150).

### Extreme Mode
*   **Enable Extreme Mode:** Force dark theme on resistant websites.
*   **Force Dark Elements:** Actively identify and convert light elements to dark mode.
*   **Use Custom CSS:** Apply custom CSS rules specific to the current site.
*   **Custom CSS Editor:** Write site-specific CSS rules that persist between visits.

### Advanced Compatibility
*   **Dynamic Monitoring:** Monitor the page for changes and apply dark mode to new elements.
*   **Shadow DOM Support:** Detect and apply dark mode to shadow DOM elements.
*   **Deep Scanning:** Perform comprehensive analysis of page elements for better dark mode coverage.
*   **Scan Interval:** Set how frequently (in milliseconds) the page should be scanned for changes.

### Scheduled Dark Mode
*   **Enable Schedule:** Enable/disable automatic dark mode switching at specific times.
*   **Start/End Time:** Set when dark mode should automatically activate and deactivate.

### Appearance
*   **Font Family:** The font family used for the UI elements.
*   **UI Theme/Text Color:** Customize the appearance of the settings panel.

### Site Exclusions
*   **Site Exclusion List:** A list of websites where dark mode should not be applied. Supports wildcards (e.g., "example.com/*").

### Diagnostics
*   **Enable Diagnostics:** Collect information about website compatibility issues.
*   **Log Level:** Set the detail level for diagnostic logging (error, warn, info, debug).
*   **Diagnostic Report:** Generate a detailed report for troubleshooting issues.

### Import/Export
*   **Import/Export Settings:** Back up or restore all your settings to/from a JSON file.

## Troubleshooting

If you encounter websites where dark mode doesn't work well:

1. **Enable Extreme Mode:** Open the settings panel and turn on "Enable Extreme Mode"
2. **Try Deep Scanning:** Enable "Deep Scanning" in the Advanced Compatibility section
3. **Use Custom CSS:** For site-specific issues, add custom CSS rules in the Extreme Mode section
4. **Generate a Diagnostic Report:** Click "Show Diagnostic Report" in the Diagnostics section to identify specific issues
5. **Exclude Problematic Sites:** If nothing else works, consider adding the site to the exclusion list

## Contributing

Contributions are welcome! If you find a bug or have a feature request, please create an issue on the [issue tracker](https://github.com/cwlum/dark-mode-toggle-userscript/issues).

If you would like to contribute code, please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Updates
<details>
<summary><strong>Changelog</strong> (Click to expand)</summary>
---
   

**v3.1.0**

* **Device-Aware Optimization:** Added automatic detection of device type, performance capabilities, and battery status
* **Adaptive Performance Modes:** Added High/Medium/Low performance modes with automatic adjustment
* **Mobile & Touch Support:** Improved usability on mobile devices with optimized button sizes
* **Per-Site Position Settings:** Added ability to remember button position separately for each website
* **Battery-Aware Features:** Added low power mode that activates automatically on low battery
* **Reduced Motion Options:** Added accessibility settings to reduce animations
* **Performance Improvements:** Optimized processing and scanning for better efficiency
* **User Interface Enhancements:** Added device information display in settings
* **Enhanced Diagnostics:** Added device and performance information to diagnostic reports

**v3.0.0**

* **Universal Compatibility:** Complete overhaul to ensure dark mode works on virtually all websites.
* **Extreme Mode:** Added powerful new mode to force dark theme on resistant websites.
* **Shadow DOM Support:** Added detection and monitoring of shadow DOM elements for complete coverage.
* **Custom CSS Editor:** Added per-site custom CSS editor for fine-tuned control.
* **Site-Specific Optimizations:** Built-in fixes for problematic sites like YouTube, Twitter/X, Facebook, Reddit, and GitHub.
* **Dynamic DOM Monitoring:** Enhanced page monitoring to catch dynamically loaded content.
* **Deep Scanning:** Added intelligent element analysis for comprehensive dark mode coverage.
* **New Theme Presets:** Added Ultra Dark and Midnight mode presets for darker experiences.
* **Diagnostic System:** Added troubleshooting tools to identify and fix compatibility issues.
* **Performance Optimization:** Improved scanning performance with throttling and debouncing.
* **Enhanced Z-index Management:** Ensures buttons and UI remain visible on all websites.
* **Redesigned Settings UI:** Reorganized settings for better usability with new options.
* **Context Menu Integration:** Added support for userscript manager context menu commands.

**v2.5.0**

* **Scheduled Dark Mode:** Added automatic switching between light and dark modes based on configurable times.
* **Theme Presets:** Added quick-select theme presets including Default, High Contrast, Low Contrast, Sepia, and Night Mode.
* **Import/Export Functionality:** Added ability to backup and restore all settings including per-site preferences.
* **Enhanced Site Exclusion:** Added support for wildcard patterns in the exclusion list for more flexible site matching.
* **Keyboard Shortcuts:** Added configurable keyboard shortcuts for toggling dark mode (default: Alt+Shift+D).
* **Performance Improvements:** Optimized mutation observer implementation for better efficiency.
* **Improved Error Handling:** Enhanced error handling for settings operations.
* **Code Structure:** Further improved code organization and reduced redundancy.

**v2.4.0**

* **Performance Optimization:** Improved script performance with optimized DOM operations and debounced functions to reduce resource usage.
* **Enhanced Settings UI:** Restructured settings panel with clear sections, improved sliders with visual value display, and smoother animations.
* **Customizable Settings Button:** Added ability to adjust the settings button position through a new offset control.
* **Improved Site Exclusion:** Added "Add Current Site" button for one-click exclusion of the current website.
* **Better Visual Feedback:** Real-time value displays for brightness, contrast and sepia settings.
* **Code Restructuring:** Complete code organization with modular functions and clear section headers for better maintenance.
* **Enhanced Error Handling:** Improved error reporting and recovery for better stability.
* **Better Documentation:** Added comprehensive comments throughout the codebase.

**v2.3.0**

*   **Real-time Settings Feedback:**  DarkReader settings (Brightness, Contrast, Sepia) now update in real-time as you adjust them in the UI, providing immediate visual feedback.
*   **Improved Accessibility:** Added ARIA labels to key UI elements, making the script more accessible to users with screen readers.
*   **Smoother Button Positioning:** Added transition effects to the toggle button's position changes.
*   **Enhanced Error Handling:** Improved error handling for settings loading/saving and reset operations.
*   **Lazy Initialization**: Added lazy initialization logic to improve initial page load time on some sites.

**v2.2.0**

*   **Per-Site Preferences:**  Added the ability to save and load dark mode settings on a per-website basis.  Your preferred brightness, contrast, button position, and even the dark mode state itself are now remembered for each site you visit!
*   **Enhanced Settings Persistence:** Settings will persist across different websites automatically.
*   **Improved UI:** Updated the user interface to have better responsiveness on different devices.

**v2.1.0**

*   **Code Refactoring:** Improved code structure for better maintainability and readability.
*   **Bug Fixes:** Resolved minor issues with the UI display on certain websites.
*   **Enhanced documentation:** Added detailed comments for easy understanding.

**v2.0.0**

*   **UI Redesign:** Complete overhaul of the settings user interface, offering more intuitive controls and customization options.
*   **Site Exclusion List:**  Introduced a feature to exclude specific websites from dark mode.
*   **Dynamic UI Styling:** The UI theme color, text color, and font family can now be customized.

</details>
