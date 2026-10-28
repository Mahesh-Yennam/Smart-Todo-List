# 📝 TaskFlow: Smart Multi-List & Checklist Manager — Gamility Tools

<p align="center">
  <strong>A clean, distraction-free productivity app for managing multiple independent checklists (Shopping, Groceries, Work Projects, Packing Lists, Daily Tasks) with 100% offline local persistence.</strong>
</p>

<p align="center">
  <a href="https://mahesh-yennam.github.io/Gamility/"><img src="https://img.shields.io/badge/Live_Portal-Gamility-0ea5e9?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Gamility Portal" /></a>
  <img src="https://img.shields.io/badge/Privacy-100%25_Client--Side-10b981?style=for-the-badge&logo=shield" alt="Client Side Privacy" />
  <img src="https://img.shields.io/badge/Storage-Local_Storage-8b5cf6?style=for-the-badge" alt="Local Storage" />
  <img src="https://img.shields.io/badge/Zero_Build-Vanilla_JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="Vanilla JS" />
</p>

---

## 🔒 100% Client-Side Privacy Guarantee

All your lists, checklist items, and task states are **stored strictly in your local browser (`localStorage`)**. No accounts, logins, telemetry, or remote server uploads. Your personal shopping lists, work priorities, and confidential notes never leave your device.

---

## ✨ Features

- **📑 Multi-List Management**:
  - Create separate dedicated lists for any purpose (e.g. *🛒 Grocery Shopping*, *🎯 Daily Priorities*, *✈️ Vacation Packing*, *💼 Work Sprint*).
  - Customize each list with an emoji badge and accent color.
  - Switch between lists instantly via the clean sidebar (or mobile drawer).
  - Rename, duplicate, clear completed items, or delete lists.

- **✅ Interactive Checklist Engine**:
  - **Quick Add**: Type and press `Enter` to append items instantly.
  - **Custom Animated Checkboxes**: Smooth check toggle with strikethrough transition.
  - **Priority Tags**: Flag urgent items with High (🔴), Medium (🟡), or Normal (🟢) tags.
  - **Inline Editing**: Double-click any item or click the edit pencil to update task text.
  - **Reordering**: Move items up or down with one click.
  - **Item Delete & Undo**: Instant deletion with an undo toast notification.

- **📊 Progress & Organization**:
  - **Real-Time Progress Meter**: Percentage bar showing completion (e.g. `4 of 7 tasks done • 57%`).
  - **Celebration Feedback**: Confetti glow when a checklist reaches 100% completion.
  - **Filter Tabs**: Toggle between `All`, `Active`, and `Completed` items.
  - **Instant Search**: Search tasks across the active list in real-time.
  - **Bulk Actions**: One-click "Mark All Completed", "Uncheck All", or "Clear Completed".

- **💾 Data Portability & Backup**:
  - **Export JSON**: Download your entire multi-list database as a backup file.
  - **Import JSON**: Restore lists from a previous backup file or paste JSON text.
  - **Copy as Text**: Copy formatted markdown checklist to clipboard for messaging or email.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Enter` (in input field) | Add item to active checklist |
| `Escape` | Cancel inline edit or close modal |
| `Ctrl / Cmd + N` | Focus quick-add input |
| `Ctrl / Cmd + Shift + L` | Create a new list |

---

## 📁 Repository Structure

```
tools/todo-list/
├── index.html          # Semantic HTML layout, sidebar, and checklist board
├── style.css           # Modern dark-mode styling, smooth animations & responsive queries
├── app.js              # State engine, localStorage sync, CRUD, and export/import
├── favicon.svg         # Bespoke vector checklist badge icon
├── site.webmanifest    # Progressive Web App manifest
├── robots.txt          # Search engine crawler policies
├── sitemap.xml         # XML sitemap
├── .gitignore          # Version control ignore rules
└── README.md           # Documentation & user guide
```

---

## 📜 Copyright & Terms

Copyright © 2026 [Gamility](https://mahesh-yennam.github.io/Gamility/). All rights reserved.  
Part of the [Gamility Platform](https://mahesh-yennam.github.io/Gamility/).
