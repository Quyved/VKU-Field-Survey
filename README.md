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
- Đồng bộ cloud thật qua Cloudflare Pages Function: phiếu được gộp theo UUID và `updatedAt`, vì vậy tạo trên điện thoại sẽ xuất hiện trên máy tính (và ngược lại) sau tối đa 15 giây hoặc ngay khi bấm **Đồng bộ ngay**.
- Danh sách phiếu đã tạo và xuất dữ liệu JSON.

## Đồng bộ nhiều thiết bị

Khi triển khai bằng Cloudflare Pages, các endpoint trong `functions/api/` tự hoạt động. Ứng dụng ưu tiên Cloudflare KV với binding tên `SURVEYS_KV`; nếu binding này chưa được tạo, Function dùng kho cloud dự phòng để demo vẫn đồng bộ được.

Để dùng KV riêng của bạn (khuyến nghị): tạo một KV Namespace trong Cloudflare, sau đó vào **Pages → VKU Field Survey → Settings → Functions → KV namespace bindings**, thêm binding `SURVEYS_KV`. Sau lần deploy tiếp theo, mọi điện thoại/máy tính cùng truy cập URL Pages sẽ đồng bộ với kho riêng đó.
