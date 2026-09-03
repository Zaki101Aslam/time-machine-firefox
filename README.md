# 🕰️ Time Machine (Search & Video Timeline)

A privacy-focused Firefox extension that gives you total control over the chronological landscape of the web. Filter out the modern "AI-generated" web to go retro, clear away outdated archives to stay on the cutting edge, or travel back to historical web snapshots on any page.

![Status](https://img.shields.io/badge/Status-Published_%26_Passed_Review-brightgreen?style=flat-square)
![Aesthetic](https://img.shields.io/badge/Aesthetic-Neon_Retro-ff00ff?style=flat-square)
![Privacy](https://img.shields.io/badge/Privacy-100%25_Local-00ff00?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

| Browser | Install from ... |
| :---: | :--- |
| <img src="https://github.com/user-attachments/assets/b0136512-56a5-4856-8c50-4971c957a24f" width="48" alt="Get Time Machine for Firefox"> | [**Available on Firefox Add-ons (AMO)**](https://addons.mozilla.org/en-US/firefox/addon/time-machine-google-youtube/) |

---

## 🚀 Overview

**Time Machine** allows you to set a specific **Cutoff Date** and choose your chronological direction:

- **Filter Future (Hide Newer):** Banishes results, videos, and modern clutter published *after* your target date. Perfect for historical research, academic deep dives, or escaping modern content algorithms (YouTube Shorts, Google AI Overviews).
- **Filter Past (Hide Older):** Banishes everything published *before* your target date. Ideal for finding the latest documentation, breaking news, or cutting-edge technical updates.
- **Travel Page to Archive:** One-click teleportation to the exact historical snapshot of any webpage via the Wayback Machine at your target date.

---

## ✨ Key Features

- 🔍 **Native Google Time Travel:** Automatically synchronizes Google's built-in historical search parameter (`tbs=cdr:1`) so Google's search engine directly queries its historical index instead of returning empty modern pages.
- 🌍 **International & Multi-Engine Support:** Works seamlessly on **Google** (including 25+ regional domains such as `.com`, `.co.in`, `.co.uk`, `.ca`, `.de`, `.co.jp`), **YouTube**, **DuckDuckGo**, and **Bing**.
- 🚀 **Wayback Machine Integration:** Click **"Travel Page to Archive"** on any website (e.g., Wikipedia, news portals, developer documentation) to jump straight to its Wayback Machine snapshot at your target date.
- 🧠 **Intelligent Date Math:** Automatically parses:
  - Relative dates and abbreviations (e.g., `3 days ago`, `2 hrs ago`, `45 mins ago`, `3 wks ago`, `1 mo ago`, `2 yrs ago`).
  - Natural language terms (`Today`, `Yesterday`, `Just now`, `今日`, `昨日`).
  - Multilingual and Japanese dates (e.g., `3日前`, `2021年5月10日`, `15 Jan 2024`).
  - Standalone publication years in titles and snippets (`2024`, `2023`, `2018`).
- 🛑 **Clutter Elimination:** Automatically removes intrusive Google AI Overviews and hides entire YouTube Shorts shelves when looking back into the past.
- 🎨 **Dynamic Neon Cyberpunk UI:** Custom retro interface that dynamically shifts themes (Neon Green for Future/Retro, Neon Magenta for Past/Modern).
- 🔒 **Privacy First:** 100% local execution. Zero telemetry, zero analytics, zero external API calls.

---

## 📟 How to Use

1. Click the **Time Machine** icon in your browser toolbar.
2. Toggle **Power** to `ON`.
3. Choose your **Mode**:
   - **Filter Future** (Neon Green) to explore the web as it was in the past.
   - **Filter Past** (Neon Magenta) to keep only the newest content.
4. Pick your **Target Date** using the calendar input.
5. Click **Engage** — your active search tab updates immediately.
6. Want to view the current webpage as it looked on your target date? Click **🚀 Travel Page to Archive**.

---

## 🛠️ Developer & Local Testing Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/Zaki101Aslam/time-machine-firefox.git
cd time-machine-firefox
```

### 2. Run Automated Tests
Verify date parsing accuracy and timeline math:
```bash
node test/date_parser.test.js
```

### 3. Validate Manifest & Extension
Ensure Mozilla WebExtension compliance:
```bash
npx -y web-ext lint
```

### 4. Load into Firefox for Development
- Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
- Click **"Load Temporary Add-on..."**.
- Select the `manifest.json` file.
- Or launch an auto-reloading development browser instance:
  ```bash
  npx -y web-ext run
  ```

---

## 🤖 Built with AI

This project was built as an authentic, adaptive collaboration between a human developer and **Google Gemini**. The goal was to create a highly efficient, secure, and aesthetically unique timeline filter using clean, dependency-free vanilla JavaScript.

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).
