# MINI-PROJECT SHORT TECHNICAL REPORT
**Course:** Cross-Platform Mobile App Development (VKU)  
**Mini-Project Title:** Mini-Project 1: Hybrid Mobile with Capacitor — Web-to-Native Bridge & Device APIs  
**Team / Student Name:** Nguyen Phuoc Quy  
**Submission Date:** 10/09/2026  

---

## 1. GENERAL INFORMATION & DELIVERABLE LINKS
* **Team Members:**
  1. Nguyen Phuoc Quy — Student ID: 22IT.EB055 — Role: Team Lead / Full-stack Architecture — Contribution: 100%
* **🔗 Live Demo URL:** [https://vku-field-survey-2ga.pages.dev](https://vku-field-survey-2ga.pages.dev)
* **💻 GitHub Repository:** [https://github.com/Quyved/VKU-Field-Survey](https://github.com/Quyved/VKU-Field-Survey)
* **📱 Android APK Download:** [vku-field-survey.apk (3.94 MB)](https://github.com/Quyved/VKU-Field-Survey/raw/main/vku-field-survey.apk)
* **🎥 Video Demo / Pairing:** Integrated dynamic QR code modal for instant mobile LAN synchronization.

---

## 2. FEATURE IMPLEMENTATION CHECKLIST
| # | Required Feature | Status | Implementation Details & Acceptance Level |
|:---:|---|:---:|---|
| 1 | Responsive Mobile Viewport & PWA | ✅ Complete | 100% responsive viewport, manifest.json standalone display, theme color, cache-first Service Worker v2. |
| 2 | Local Offline Persistence | ✅ Complete | IndexedDB state store for draft auto-save, evidence photos (Base64), and PENDING_SYNC survey queue. |
| 3 | Field Survey Form & Native Camera | ✅ Complete | Dynamic form, 1–5 star rating, detailed notes, and hardware Camera environment capture with instant preview. |
| 4 | Real-time Background Sync | ✅ Complete | Cloudflare Pages Functions (/api/surveys/sync) with UUID timestamp merge and 4s background auto-sync. |
| 5 | Capacitor Android Native Packaging | ✅ Complete | Configured capacitor.config.ts, built 3.94 MB debug APK via Gradle 8.14 & Android SDK 36. |
| 6 | Manual JSON Import / Export | ✅ Complete | Standalone JSON export download and import merging for air-gapped facility surveys. |

---

## 3. TECHNICAL ARCHITECTURE & PROJECT STRUCTURE
### 3.1. Project Directory Structure
```
vku-field-survey/
├── android/                    # Native Android Studio project (Capacitor Bridge & Gradle)
│   ├── app/build/outputs/apk/  # Compiled APK binaries (app-debug.apk)
│   └── variables.gradle        # SDK 36, compileSdk/targetSdk configuration
├── functions/api/              # Cloudflare Pages Functions (Edge Serverless Engine)
│   ├── surveys.js              # GET all surveys / POST new surveys with Cloud Store
│   ├── surveys/sync.js         # Two-way conflict resolution & delta merge endpoint
│   └── info.js                 # Network & LAN pairing metadata endpoint
├── www/                        # Web assets synchronized into Capacitor webDir
├── app.js                      # Core client logic, IndexedDB driver & sync orchestrator
├── capacitor.config.ts         # Capacitor CLI bridge definition (AppID, AppName, webDir)
├── index.html & styles.css     # Responsive mobile UI, ratings, tabs, modal QR dialog
├── sw.js & manifest.json       # Service Worker cache-first shell & PWA manifest
├── server.js                   # Local zero-dependency Node.js HTTP LAN testing server
└── vku-field-survey.apk        # Direct executable Android APK (3.94 MB)
```

### 3.2. State Management & Synchronization Flow
1. **Draft Auto-Saving:** Input keystrokes and photos auto-persist to IndexedDB key `vku-draft-v1`.
2. **Offline Queue:** Submissions receive a UUID v4, timestamps, and status `PENDING_SYNC` in IndexedDB before any network request.
3. **Multi-Channel Sync:** Pushes to Cloudflare Serverless Functions `/api/surveys/sync` and central cloud store with UUID-based conflict resolution.
4. **Autonomous Background Polling:** Non-blocking 4s polling syncs newly created records across devices in near real-time.

---

## 4. EMPIRICAL EVIDENCE & SCREENSHOTS
* **Figure 1:** Live PWA running on Cloudflare Pages (`vku-field-survey-2ga.pages.dev`) displaying online status, sync queue badge, phone pairing trigger, JSON import/export, and successfully synchronized survey cards ("Đã đồng bộ").
* **Figure 2:** Cloudflare Pages Production Deployment Dashboard showing successful automated CI/CD builds connected to GitHub repository (`Quyved/VKU-Field-Survey`).

---

## 5. TECHNICAL CHALLENGES & RESOLUTIONS
1. **Cross-Device State Synchronization on Static Cloud Hosting:**
   * *Issue:* Cloudflare Pages functions run statelessly; without KV configured, client devices only stored data locally.
   * *Resolution:* Implemented a dual-tiered sync engine in `app.js` and `functions/api/surveys.js` with fallback cloud storage, Service Worker cache bypass, and 4s background polling.
2. **Native Android SDK & AGP Compatibility:**
   * *Issue:* Dependency `androidx.activity:1.11.0` required compileSdk 36, while environment had Java path and SDK hash mismatches.
   * *Resolution:* Linked Java JDK 21, configured `local.properties`, set `compileSdkVersion = 36` in `variables.gradle`, and successfully compiled `vku-field-survey.apk` (3.94 MB).
