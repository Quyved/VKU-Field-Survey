# MINI-PROJECT SHORT TECHNICAL REPORT
**Course:** Cross-Platform Mobile App Development (VKU)  
**Mini-Project Title:** Mini-Project 1: Hybrid Mobile with Capacitor — Web-to-Native Bridge & Device APIs  
**Team / Student Name:** Tran Thanh Quy  
**Submission Date:** 10/09/2026  

---

## 1. GENERAL INFORMATION & DELIVERABLE LINKS
* **Team Members:**
  1. Tran Thanh Quy — Student ID: 23IT228 — Role: Team Lead / Full-stack Mobile Architecture — Contribution: 100%
* **🔗 Live Demo URL:** [https://vku-field-survey-2ga.pages.dev](https://vku-field-survey-2ga.pages.dev)
* **💻 GitHub Repository:** [https://github.com/Quyved/VKU-Field-Survey](https://github.com/Quyved/VKU-Field-Survey)
* **📱 Android APK Download:** [vku-field-survey.apk (3.94 MB)](https://github.com/Quyved/VKU-Field-Survey/raw/main/vku-field-survey.apk)
* **🎥 Video Demo / Pairing:** Integrated dynamic QR code modal for instant mobile LAN synchronization.

---

## 2. FEATURE IMPLEMENTATION CHECKLIST
| # | Required Feature | Status | Implementation Details & Acceptance Level |
|:---:|---|:---:|---|
| 1 | Responsive Mobile Viewport & PWA | ✅ Complete | 100% responsive across mobile viewports, manifest.json standalone display, theme color (#0284c7), cache-first Service Worker v2. |
| 2 | Local Offline Persistence | ✅ Complete | IndexedDB state store for draft auto-save, evidence photos (Base64), and PENDING_SYNC survey queue. Zero data loss on reload or network drops. |
| 3 | Field Survey Form & Native Camera | ✅ Complete | Comprehensive inspection form: Building, Floor, Room, Category, 1–5 star rating, detailed notes, and hardware Camera environment capture with instant preview. |
| 4 | Real-time Background Sync | ✅ Complete | Cloudflare Pages Functions (/api/surveys/sync) with UUID timestamp merge and 4s background auto-sync across multiple devices. |
| 5 | Capacitor Android Native Packaging | ✅ Complete | Configured capacitor.config.ts, built 3.94 MB debug APK via Gradle 8.14 & Android SDK 36 (targetSdk 36, minSdk 24). |
| 6 | Manual Data Portability (JSON Import/Export) | ✅ Complete | Standalone JSON export download and import merging for air-gapped field surveys. |

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
└── vku-field-survey.apk        # Executable Android APK binary (3.94 MB)
```

### 3.2. State Management & Synchronization Flow
1. **Draft Auto-Saving:** Every keystroke and photo attachment is instantly serialized to IndexedDB key `vku-draft-v1` with a human-readable timestamp. Form clearing and submission safely purge the draft.
2. **Unconditional Offline Queue:** Upon pressing *"Lưu phiếu khảo sát"*, the payload is assigned a UUID v4, `createdAt`, `updatedAt`, and status `PENDING_SYNC`. It is persisted into local IndexedDB before any network I/O is attempted.
3. **Multi-Tiered Synchronization Engine:**
   * *Primary Tier (Edge Serverless):* Dispatches queued items to Cloudflare Pages Function `/api/surveys/sync`.
   * *Fallback Tier (Global Cloud Store):* If operating on a static host without KV bindings, seamlessly synchronizes against a central cloud repository.
   * *Conflict Resolution:* Incoming and outgoing surveys are indexed in a hash map by `UUID`. On collision, the record with the latest `updatedAt` prevails. Committed records transition to `SYNCED`.
4. **Autonomous Background Polling:** A non-blocking 4-second timer continuously polls for delta updates when `navigator.onLine === true`, guaranteeing phones and PCs reflect changes in near real-time without manual refresh.

### 3.3. Exception Handling & Resilience Strategies
* **Never-Block UX:** Transient network failures during HTTP synchronization gracefully fall back to local storage while notifying the user of safety.
* **Service Worker Dynamic Bypass:** `sw.js` explicitly exempts all `/api/*` and external storage endpoints from caching, eliminating stale cache between different user accounts.
* **Safe Concurrency Guard:** A semaphore flag (`isSyncing`) prevents race conditions from concurrent network triggers.

---

## 4. EMPIRICAL EVIDENCE & SCREENSHOTS
* **Figure 1:** Live PWA running on Cloudflare Pages (`vku-field-survey-2ga.pages.dev`) showing active online status, sync queue badge, phone pairing trigger, JSON import/export, and successfully synchronized survey cards ("Đã đồng bộ").
* **Figure 2:** Cloudflare Pages Production Deployment Dashboard showing successful automated CI/CD builds connected to GitHub repository (`Quyved/VKU-Field-Survey`) with edge function execution.

---

## 5. TECHNICAL CHALLENGES & RESOLUTIONS
1. **Cross-Device State Synchronization on Static Cloud Hosting:**
   * *Issue:* Cloudflare Pages functions execute statelessly across distributed edge datacenters. Without initial KV binding configured in the dashboard, data entered on a PC was saved in the local browser IndexedDB and did not propagate to a secondary smartphone visiting the same URL.
   * *Resolution:* Implemented a dual-tiered synchronization engine in `app.js` and `functions/api/surveys.js`. The client pushes to the Cloudflare API, which attempts Cloudflare KV first, and automatically falls back to an online centralized cloud store. In addition, an autonomous 4-second polling cycle and Service Worker cache bypass were integrated so all mobile and desktop browsers receive updates in near real-time without user intervention.
2. **Native Android SDK & Android Gradle Plugin (AGP) Compatibility:**
   * *Issue:* Compiling the native APK via Gradle failed initially with a `JAVA_HOME` path mismatch and dependency constraints: `androidx.activity:1.11.0` required API 36+, while local environment initially attempted compileSdk 35 and missing SDK hashes.
   * *Resolution:* Resolved `JAVA_HOME` to `jdk-21.0.12.1`, configured `android/local.properties` to the installed SDK root, updated `android/variables.gradle` to `compileSdkVersion = 36` and `targetSdkVersion = 36`, and triggered automated platform license acceptance. The Gradle daemon successfully assembled the 3.94 MB debug APK with 93 completed build tasks.
