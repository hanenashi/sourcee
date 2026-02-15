# Sourcee

The ultimate HTML export tool. Capture, beautify, and save webpages as self-contained HTML files.

**v2.0 - Mobile Optimized (Kiwi/Firefox Android) & Desktop Ready**

## 📥 Installation

**[CLICK HERE TO INSTALL SCRIPT](https://github.com/hanenashi/sourcee/raw/main/sourcee.user.js)**

*Requires a UserScript manager like [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).*

## ✨ Features

* **Fetch Source:** Downloads the raw HTML exactly as the server sent it.
* **DOM Snapshot:** Saves the page exactly as it looks right now (including changes made by JavaScript).
* **Pretty Print:** Fetches the source and formats the code for readability.
* **Self-Contained:** The magic mode. It downloads all images on the page, converts them to Base64, and embeds them into the HTML. The result is a single `.html` file that works perfectly offline.
* **Mobile Friendly:**
    * Draggable widget (doesn't block your view).
    * Touch-optimized UI.
    * Z-Index handling for mobile nav bars.
    * Safe injection (works on Kiwi Browser & Firefox Android).

## 📱 Usage

1.  Install the script.
2.  Visit any webpage.
3.  Look for the **Sourcee** floating button (bottom right).
4.  **Tap/Click** to open the menu.
5.  **Drag** the button to move it if it's in the way.

## ⚙️ Options

* **Timestamp:** Auto-names files with the current date/time (e.g., `page_2023-10-27.html`).
* **Limit:** Set a maximum number of images to embed (useful for infinite scroll pages or galleries).
* **Cancel/Save Partial:** If the "Self-Contained" process is taking too long or gets stuck, you can hit "Stop" and choose to save whatever has been processed so far.
