# Dark Mode Toggle User Script

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A user script that adds a customizable dark mode toggle button to any website.

<img src=https://github.com/cwlum/dark-mode-toggle-userscript/blob/main/picture.jpeg>


## Features

*   **Easy Dark Mode Toggle:**  Quickly enable or disable dark mode with a single click.
*   **Customizable UI:**  Adjust the position, colors, font, and other UI elements to match your preferences.
*   **DarkReader Integration:**  Leverages DarkReader for advanced dark mode conversion, providing excellent results on most websites.
*   **Site Exclusion:**  Exclude specific websites where you don't want dark mode to be applied.
*   **Persistent Settings:**  Your settings are saved and automatically applied across all websites.
*   **Lightweight and Efficient:**  Minimal impact on website performance.

## Installation

1.  Install a userscript manager such as [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Safari, Edge).
2.  Click the following link to install the script: [https://github.com/cwlum/dark-mode-toggle-userscript/raw/main/dark-mode-toggle.user.js](https://github.com/cwlum/dark-mode-toggle-userscript/raw/main/dark-mode-toggle.user.js)
3.  Tampermonkey will prompt you to install the script. Click "Install".

## Usage

After installation, a dark mode toggle button will appear on every website you visit.

*   **Click the button** to toggle dark mode on or off.
*   **Click the "Settings" button (vertical button on the right side)** to open the settings panel.
*   **In the settings panel,** you can:
    *   Change the button's position (top-left, top-right, bottom-left, bottom-right).
    *   Adjust the button's offset from the edge of the screen.
    *   Configure DarkReader settings (brightness, contrast, sepia).
    *   Change the UI theme color and text color.
    *   Set the font family for the UI.
    *   Add websites to the exclusion list to prevent dark mode from being applied on those sites.
    *   Reset all settings to their defaults.

## Configuration Options

The following configuration options are available in the settings panel:

*   **Position:** The position of the toggle button on the screen.
*   **Offset X:** The horizontal offset of the toggle button from the edge of the screen (in pixels).
*   **Offset Y:** The vertical offset of the toggle button from the edge of the screen (in pixels).
*   **Brightness:** The brightness of the dark mode filter (0-100).
*   **Contrast:** The contrast of the dark mode filter (0-100).
*   **Sepia:** The sepia of the dark mode filter (0-100).
*   **Font Family:** The font family used for the UI elements.
*   **UI Theme Color:** The background color of the settings panel.
*   **UI Text Color:** The text color of the settings panel.
*   **Site Exclusion List:** A list of websites where dark mode should not be applied.  Enter the URL of the website and click "Add Exclusion".

## Contributing

Contributions are welcome! If you find a bug or have a feature request, please create an issue on the [issue tracker](https://github.com/cwlum/dark-mode-toggle-userscript/issues).

If you would like to contribute code, please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Updates

**v2.3.0 (Current)**

*   **Improved Error Handling:** Added visual error messages that display in the UI if loading or saving settings fails. This makes it easier to troubleshoot potential issues.
*   **Visual Cue for Excluded Sites:** The toggle button now has a distinct visual appearance (dimmed with a dashed red border) when dark mode is enabled, but the *current* site is on the exclusion list.  This makes it immediately clear why dark mode isn't active.
*   **Chinese UI language:** Translate UI's labels to Chinese
*   **Settings Persistence:** Settings will persist across different websites automatically.
*   **Enhanced Settings Persistence:** Settings will persist across different websites automatically.
*   **Improved UI:** Updated the user interface to have better responsiveness on different devices.
  
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
