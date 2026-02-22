# 🕰️ Time Machine (Google & YouTube)

A privacy-focused Firefox extension that gives you total control over the chronological landscape of the web. Filter out the modern "AI-generated" web to go retro, or clear away outdated archives to stay on the cutting edge.

![Retro Dashboard](https://img.shields.io/badge/Aesthetic-Neon_Retro-ff00ff)
![Privacy](https://img.shields.io/badge/Privacy-100%25_Local-00ff00)
![Platform](https://img.shields.io/badge/Platform-Firefox-orange)

## 🚀 Overview

**Time Machine** allows you to set a specific "Cutoff Date" and choose a direction:
- **Filter Future (Hide Newer):** Banishes everything published *after* your target date. Perfect for historical research or escaping modern content algorithms (YouTube Shorts, Google AI Overviews).
- **Filter Past (Hide Older):** Banishes everything published *before* your target date. Ideal for finding the most recent technical documentation or breaking news.

## ✨ Key Features

- **Intelligent Time Math:** Automatically parses relative dates (e.g., "3 weeks ago", "5日前") and calculates their exact position on the timeline.
- **Bi-Lingual Support:** Optimized for both **English** and **Japanese** search results and YouTube metadata.
- **Performance Focused:** Uses a debounced `MutationObserver` to handle infinite-scroll pages smoothly without draining CPU.
- **Privacy First:** Zero data collection. No tracking. No third-party APIs. All logic happens locally in your browser.

## 🛠️ Installation

### For Developers (Temporary Load)
1. Clone this repository.
2. Open Firefox and type `about:debugging` in the address bar.
3. Click **"This Firefox"**.
4. Click **"Load Temporary Add-on..."**.
5. Select the `manifest.json` file from this project folder.

### For Users
*Once published, add the link to the Firefox Add-ons store here.*

## 📟 How to Use
1. Click the **Time Machine** icon in your toolbar.
2. Choose your **Mode**: "Filter Future" or "Filter Past."
3. Select your **Target Date** using the calendar picker.
4. Click **Engage**. Your current tab will reload with the timeline filter active.

## 🤖 Built with AI
This project was built as an authentic, adaptive collaboration between a human developer and **Google Gemini**. The goal was to create a highly efficient, secure, and aesthetically unique tool using plain, readable JavaScript.

## 📜 License
This project is open-source and available under the [MIT License](LICENSE).