# Sourcee

The ultimate HTML export and web reverse-engineering tool. Capture, beautify, inspect assets, and generate AI-ready context dumps directly from your browser.

**v4.0 - Advanced Asset Inspector & AI Context Dumps**

## 📥 Installation

**[CLICK HERE TO INSTALL SCRIPT](https://github.com/hanenashi/sourcee/raw/main/sourcee.user.js)**

*Requires a UserScript manager like [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).*

## ✨ Features

### 📄 Core Export Modes
* **Fetch Source:** Downloads the raw HTML exactly as the server sent it.
* **DOM Snapshot:** Saves the page exactly as it looks right now (including changes made by JavaScript).
* **Beautify Fetch:** Fetches the source and formats the code for readability.
* **Self-Contained (Images):** The magic mode. It downloads all `<img>` tags on the page, converts them to Base64, and embeds them into the HTML. Works with authenticated/paywalled images!

### 🤖 AI Context Dump (.md)
Instantly generate a clean, highly-readable Markdown file to feed to ChatGPT, Claude, or Gemini when asking for CSS/JS tweaks.
* **Smart Heuristics:** Identifies and labels injected code (e.g., Stylus themes, AdBlockers, UserScripts) so the AI knows exactly *where* to tell you to put your custom CSS.
* **Cross-Origin CSS:** Bypasses CORS to fetch external stylesheets and include their contents.
* **Privacy Safe:** Automatically strips out hidden CSRF tokens, form inputs, and massive SVGs/base64 blobs to protect your privacy and save AI token limits.

### 🧰 Asset Inspector (Network)
Easily rip a site's building blocks to reconstruct it locally.
* Scans the page for all external `.css`, `.js`, and `<iframe src="... ">` assets.
* Displays the originating domain for every file.
* **Smart Selection:** One-click buttons to isolate CSS, JS, or Iframes.
* Downloads files safely with their domain names prefixed so nothing overwrites.

### 📱 Mobile Optimized
* **Dynamic UI Scaling:** Auto-detects mobile devices and boosts UI size for easy tapping. Click the "UI" button to cycle through custom zoom levels (100% - 170%).
* **Bulletproof Dragging:** Draggable widget that gets out of your way, optimized specifically to not misfire on touch screens (Kiwi Browser / Firefox Android).

## 📱 Usage

1. Install the script.
2. Visit any webpage.
3. Look for the **Sourcee** floating button (bottom right).
4. **Tap/Click** to open the menu.
5. **Drag** the button to move it if it's in the way.

## ⚙️ Options

* **Time:** Auto-names files with the current date/time (e.g., `page_source_2023-10-27.html`).
* **Limit:** Set a maximum number of images to embed (useful for massive infinite-scroll pages).
* **UI:** Cycles the interface scale to perfectly match your device screen.
* **Cancel & Save Partial:** If a huge download is taking too long, hit "Stop" and instantly save whatever has been processed so far.
