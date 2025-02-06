# Dark Mode Toggle User Script

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A user script that adds a customizable dark mode toggle button to any website.

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

## Author

Cervantes Wu - [http://www.mriwu.us](http://www.mriwu.us)
