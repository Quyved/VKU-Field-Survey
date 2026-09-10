# BÁO CÁO KỸ THUẬT MINI-PROJECT
**Học phần:** Phát triển ứng dụng di động đa nền tảng (Cross-Platform Mobile App Development - VKU)  
**Tên Mini-Project:** Mini-Project 1: Hybrid Mobile với Capacitor — Web-to-Native Bridge & Device APIs  
**Nhóm / Sinh viên thực hiện:** Trần Thanh Quý  
**Ngày nộp:** 10/09/2026  

---

## 1. THÔNG TIN CHUNG & LIÊN KẾT BÀN GIAO (DELIVERABLE LINKS)
* **Thành viên nhóm:**
  1. **Trần Thanh Quý** — Mã SV: **23IT228** — Vai trò: Trưởng nhóm / Toàn bộ Kiến trúc & Phát triển — Đóng góp: **100%**
* **🔗 Live Demo URL (HTTPS):** [https://vku-field-survey-2ga.pages.dev](https://vku-field-survey-2ga.pages.dev) (Triển khai trên Cloudflare Pages)
* **💻 GitHub Repository:** [https://github.com/Quyved/VKU-Field-Survey](https://github.com/Quyved/VKU-Field-Survey)
* **📱 Gói cài đặt Android APK:** [vku-field-survey.apk (3.94 MB)](https://github.com/Quyved/VKU-Field-Survey/raw/main/vku-field-survey.apk) (Capacitor Android SDK 36 native build tại gốc repo)
* **🎥 Video Demo / Kết nối nhanh:** Tích hợp tính năng hiển thị mã QR LAN IP quét trực tiếp mở app trên điện thoại cùng mạng Wi-Fi.

---

## 2. BẢNG KIỂM TRA TÍNH NĂNG ĐÃ TRIỂN KHAI (FEATURE IMPLEMENTATION CHECKLIST)
| # | Tính năng yêu cầu | Trạng thái | Chi tiết triển khai & Mức độ nghiệm thu |
|:---:|---|:---:|---|
| 1 | Responsive Mobile Viewport & PWA Standalone | ✅ Hoàn thành | Giao diện tương thích 100% mobile viewports, manifest.json standalone, theme màu VKU #0284c7, Service Worker cache-first v2. |
| 2 | Lưu trữ cục bộ Ngoại tuyến (Offline-First Persistence) | ✅ Hoàn thành | Sử dụng IndexedDB (ObjectStore: state) lưu tự động bản nháp (draft), ảnh minh chứng Base64 và hàng đợi phiếu PENDING_SYNC. |
| 3 | Biểu mẫu khảo sát & Tích hợp Camera thiết bị | ✅ Hoàn thành | Form nhiều trường: Tòa nhà, Tầng, Phòng, Hạng mục, Đánh giá 1–5 sao trực quan, ghi chú lỗi và cầu nối Camera phần cứng (capture=environment). |
| 4 | Tự động đồng bộ nền Thời gian thực (Cloud Sync) | ✅ Hoàn thành | Serverless Functions (/api/surveys/sync) trên Cloudflare Pages kết hợp Cloud Storage; tự động kiểm tra và đồng bộ hai chiều mỗi 4s. |
| 5 | Đóng gói Ứng dụng Android Native với Capacitor | ✅ Hoàn thành | Cấu hình capacitor.config.ts (AppID: dev.tuannguyen.vkufieldsurvey), build thành công APK độc lập 3.94 MB với Gradle 8.14 & Android SDK 36. |
| 6 | Xuất / Nhập dữ liệu di động (JSON Portability) | ✅ Hoàn thành | Hỗ trợ nút "Xuất JSON" và "Nhập JSON" phục vụ sao lưu hoặc chia sẻ dữ liệu khi không có mạng. |

---

## 3. KIẾN TRÚC KỸ THUẬT & CẤU TRÚC DỰ ÁN
### 3.1. Cấu trúc thư mục dự án
```
vku-field-survey/
├── android/                    # Dự án Android Studio gốc (Capacitor Bridge & Gradle)
│   ├── app/build/outputs/apk/  # File APK đã biên dịch (app-debug.apk)
│   └── variables.gradle        # Cấu hình SDK 36, compileSdk/targetSdk
├── functions/api/              # Cloudflare Pages Functions (Serverless Edge API)
│   ├── surveys.js              # GET danh sách phiếu / POST lưu trữ phiếu Cloud
│   ├── surveys/sync.js         # Tiếp nhận đồng bộ hai chiều & giải quyết xung đột
│   └── info.js                 # API cung cấp IP LAN & ghép nối điện thoại
├── www/                        # Tài nguyên web PWA đồng bộ vào Capacitor
├── app.js                      # Logic lõi client, driver IndexedDB & bộ điều phối sync
├── capacitor.config.ts         # Cấu hình cầu nối Capacitor CLI (AppID, AppName, webDir)
├── index.html & styles.css     # Giao diện người dùng responsive, tab chuyển đổi, Dialog QR
├── sw.js & manifest.json       # Service Worker cache-first và khai báo cấu hình PWA
├── server.js                   # Máy chủ HTTP Node.js phục vụ thử nghiệm LAN cục bộ
└── vku-field-survey.apk        # File cài đặt Android APK độc lập (3.94 MB)
```

### 3.2. Luồng Quản lý Trạng thái & Cơ chế Đồng bộ
1. **Tự động lưu bản nháp (Draft Persistence):** Thao tác gõ phím và ảnh được lưu tức thời vào IndexedDB key `vku-draft-v1`.
2. **Hàng đợi Ngoại tuyến (Offline Queue):** Bấm "Lưu phiếu", dữ liệu được cấp UUID v4, timestamps và trạng thái `PENDING_SYNC` vào IndexedDB trước khi gọi mạng.
3. **Cơ chế Đồng bộ Đa kênh (Multi-Channel Sync):** Gửi phiếu lên Cloudflare Function `/api/surveys/sync` và Cloud Storage tập trung; giải quyết xung đột theo UUID và thời gian `updatedAt` mới nhất.
4. **Kiểm tra nền tự động (Autonomous Polling):** Vòng lặp ngầm 4 giây tự động kiểm tra và kéo dữ liệu mới về khi có mạng, giúp các thiết bị khác nhau đồng bộ tức thì.

---

## 4. MINH CHỨNG THỰC NGHIỆM & HÌNH ẢNH ỨNG DỤNG
* **Hình 1:** Giao diện PWA hoạt động live tại địa chỉ `https://vku-field-survey-2ga.pages.dev`: hiển thị trạng thái Trực tuyến, huy hiệu đếm phiếu, nút Kết nối điện thoại QR, nút Nhập/Xuất JSON và danh sách phiếu khảo sát đã đồng bộ thành công ("Đã đồng bộ").
* **Hình 2:** Bảng điều khiển triển khai Cloudflare Pages Production: ghi nhận các phiên build tự động thành công kết nối trực tiếp từ kho lưu trữ GitHub `Quyved/VKU-Field-Survey`.

---

## 5. THÁCH THỨC KỸ THUẬT & GIẢI PHÁP THỰC HIỆN
1. **Đồng bộ dữ liệu đa thiết bị trên nền tảng Cloud Hosting tĩnh:**
   * *Vấn đề:* Cloudflare Pages Functions là serverless phi trạng thái; khi chưa cấu hình KV, dữ liệu chỉ lưu trong IndexedDB máy hiện tại.
   * *Giải pháp:* Xây dựng cơ chế đồng bộ đa tầng trong `app.js` và `functions/api/surveys.js` với fallback cloud store tập trung, vòng lặp ngầm 4 giây và bỏ qua cache Service Worker cho API.
2. **Xung đột tương thích giữa Android Gradle Plugin (AGP) và Android SDK:**
   * *Vấn đề:* Thư viện `androidx.activity:1.11.0` bắt buộc compileSdk 36, trong khi môi trường ban đầu dùng SDK 35 và sai đường dẫn Java.
   * *Giải pháp:* Thiết lập `JAVA_HOME` về JDK 21, cấu hình `local.properties`, đặt `compileSdkVersion = 36` trong `variables.gradle` và biên dịch thành công APK độc lập `vku-field-survey.apk` (3.94 MB).
