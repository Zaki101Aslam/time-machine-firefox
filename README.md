# 🕰️ Time Machine (Google & YouTube)

A privacy-focused Firefox extension that gives you total control over the chronological landscape of the web. Filter out the modern "AI-generated" web to go retro, or clear away outdated archives to stay on the cutting edge.

![Retro Dashboard](https://img.shields.io/badge/Aesthetic-Neon_Retro-ff00ff)
![Privacy](https://img.shields.io/badge/Privacy-100%25_Local-00ff00)
![Status](https://img.shields.io/badge/Status-Awaiting_Review-yellow)

## 🚀 Status
**Note:** This extension has been submitted to the Mozilla Add-on Store and is currently **Awaiting Review**. Once approved, a direct installation link will be provided here.

## 🚀 Overview
**Time Machine** allows you to set a specific "Cutoff Date" and choose a direction:
- **Filter Future (Hide Newer):** Banishes everything published *after* your target date. Perfect for historical research or escaping modern content algorithms (YouTube Shorts, Google AI Overviews).
- **Filter Past (Hide Older):** Banishes everything published *before* your target date. Ideal for finding the most recent technical documentation or breaking news.

## ✨ Key Features
- **Intelligent Time Math:** Automatically parses relative dates (e.g., "3 weeks ago", "5日前") and calculates their exact position on the timeline.
- **Bi-Lingual Support:** Optimized for both **English** and **Japanese** search results and YouTube metadata.
- **Performance Focused:** Uses a debounced `MutationObserver` to handle infinite-scroll pages smoothly without draining CPU.
- **Privacy First:** Zero data collection. No tracking. No third-party APIs. All logic happens locally in your browser.

## 🛠️ Build and Test Instructions
If you want to test the extension manually before it is officially released on the store, follow these steps:

### 1. Prepare the Source
- Clone this repository: `git clone https://github.com/Zaki101Aslam/time-machine-firefox.git`
- Navigate to the project folder. Ensure you see `manifest.json`, `content.js`, `popup.html`, `popup.js`, and the `icon` files.

### 2. Load into Firefox (Temporary)
- Open Firefox and type `about:debugging` in the address bar.
- Click **"This Firefox"** on the left sidebar.
- Click the **"Load Temporary Add-on..."** button.
- Select the `manifest.json` file from your local folder.
- **Note:** Temporary add-ons disappear when you restart Firefox.

### 3. Permanent Testing (Advanced)
- If you wish to keep the extension across restarts without a store version, you can zip the contents of the folder:
  - Select all files in the directory (do not zip the parent folder itself).
  - Compress them into a file named `time-machine.zip`.
  - Use a tool like [web-ext](https://github.com/mozilla/web-ext) to run or sign it locally.

## 📟 How to Use
1. Click the **Time Machine** icon in your toolbar.
2. Choose your **Mode**: "Filter Future" or "Filter Past."
3. Select your **Target Date** using the calendar picker.
4. Click **Engage**. Your current tab will reload with the timeline filter active.

## 🤖 Built with AI
This project was built as an authentic, adaptive collaboration between a human developer and **Google Gemini**. The goal was to create a highly efficient, secure, and aesthetically unique tool using plain, readable JavaScript.

## 📜 License
This project is open-source and available under the [MIT License](LICENSE).
