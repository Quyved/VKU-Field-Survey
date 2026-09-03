# VKU Field Survey

PWA khảo sát cơ sở vật chất, chạy offline-first. Dữ liệu, bản nháp và ảnh minh chứng được lưu trong IndexedDB; các phiếu chờ đồng bộ sẽ được đánh dấu đã đồng bộ khi thiết bị trực tuyến.

## Chạy ứng dụng

Vì Service Worker yêu cầu HTTP/HTTPS, hãy mở thư mục này bằng một web server cục bộ, ví dụ:

```powershell
cd "C:\Users\ASUS\Documents\Codex\2026-09-03\files-mentioned-by-the-user-codex\outputs\vku-field-survey"
python -m http.server 8080
```

Sau đó truy cập `http://localhost:8080`. Trong Chrome/Edge, chọn **Install app** để cài như ứng dụng độc lập.

## Đóng gói Android với Capacitor

Tệp `capacitor.config.ts` đã sẵn sàng. Trong thư mục ứng dụng, cài Capacitor rồi thêm nền tảng Android:

```powershell
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap add android
npx cap sync android
npx cap open android
```

Mở Android Studio để tạo APK. Quyền camera sẽ được trình duyệt/Android hỏi khi người dùng chọn thêm ảnh.

## Có sẵn

- Manifest PWA, giao diện responsive và Service Worker cache-first.
- Form nhiều trường, đánh giá 1–5 sao và ảnh minh chứng từ camera.
- Tự động lưu nháp bằng IndexedDB; phiếu khảo sát được lưu cục bộ khi offline.
- Hàng đợi `PENDING_SYNC`, theo dõi trạng thái mạng và đồng bộ mô phỏng tuần tự.
- Danh sách phiếu đã tạo và xuất dữ liệu JSON.

> Phiên bản demo lưu dữ liệu trên thiết bị và mô phỏng server. Để triển khai thật, thay hàm `sync()` trong `app.js` bằng API backend; ứng dụng đã có mô hình hàng đợi sẵn sàng để thay thế.
