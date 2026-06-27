# WC 2026 - Dự Đoán Kèo Châu Á

Web app dự đoán kèo châu Á World Cup 2026, deploy trên Vercel, backend Google Sheets.

## Tính năng

- Đăng nhập bằng số điện thoại (SDT), lưu session 30 ngày
- User dự đoán HOME / AWAY / HÒA cho từng trận
- Kèo lẻ (0.5, 1.5...) tự động ẩn lựa chọn HÒA
- Đóng góp: đúng = 0, sai HOME/AWAY = 30, sai HÒA = 10
- Lịch sử dự đoán và tổng đóng góp
- Admin tạo trận, đóng nhận dự đoán, nhập tỉ số
- Thông báo Telegram group khi user dự đoán và khi hết giờ bình chọn

## Setup Google Sheets

### 1. Tạo Spreadsheet

Tạo Google Spreadsheet mới với 3 sheet đặt tên chính xác:
- `Users`
- `Matches`
- `Predictions`

### 2. Tạo Service Account

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới (hoặc dùng project có sẵn)
3. Bật **Google Sheets API**
4. Tạo **Service Account** → tải file JSON key
5. Copy email Service Account (dạng `xxx@xxx.iam.gserviceaccount.com`)
6. **Share** spreadsheet cho email đó với quyền **Editor**

### 3. Cấu hình biến môi trường

Copy `.env.example` thành `.env.local`:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID=... (lấy từ URL spreadsheet)
SESSION_SECRET=... (chuỗi ngẫu nhiên >= 32 ký tự)
TELEGRAM_BOT_TOKEN=... (từ @BotFather)
TELEGRAM_CHAT_ID=... (ID group, số âm)
CRON_SECRET=... (bảo vệ endpoint cron)
```

### 5. Setup Telegram Bot

1. Mở [@BotFather](https://t.me/BotFather) → `/newbot` → lấy **token**
2. Tạo group Telegram, thêm bot vào group
3. Gửi 1 tin bất kỳ trong group
4. Mở `https://api.telegram.org/bot<TOKEN>/getUpdates` → tìm `"chat":{"id":-100...}`
5. Điền `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID` vào `.env.local` / Vercel

Bot phải có quyền gửi tin trong group. Nếu thiếu biến Telegram, app vẫn chạy bình thường (bỏ qua thông báo).

### 4. Seed dữ liệu user

```bash
npm run seed
```

Script sẽ tạo header và điền 14 user (1 admin: Phan Viet Linh).

## Chạy local

```bash
npm install
npm run dev
```

Mở http://localhost:3000

## Deploy Vercel

1. Push code lên GitHub
2. Import project trên [vercel.com](https://vercel.com)
3. Thêm biến môi trường (giống `.env.local`, gồm Telegram + `CRON_SECRET`)
4. Deploy

### Cron đóng bình chọn (gói Hobby miễn phí)

Vercel Hobby **không** cho cron mỗi phút. Dùng [cron-job.org](https://cron-job.org) (miễn phí):

- URL: `https://<domain-vercel>/api/cron/voting-close`
- Lịch: mỗi phút (`* * * * *`)
- Header: `Authorization: Bearer <CRON_SECRET>`

## Đăng nhập

Đăng nhập bằng **số điện thoại** đã đăng ký (10 số, bắt đầu bằng 0).

| STT | Họ tên | SDT | Vai trò |
|-----|--------|-----|---------|
| 1 | Phan Viet Linh | 0914937339 | admin |
| 2 | Vu Ba Liem | 0933955739 | user |
| 3 | Le Van Khang | 0913616174 | user |
| 4 | Nguyen Huynh Khuong | 0909174080 | user |
| 5 | Tran Dinh Tu | 0908257297 | user |
| 6 | Pham Ngoc Duy | 0934973585 | user |
| 7 | Le Huu Phuc | 0914662097 | user |
| 8 | Truong Hoang Du | 0909477341 | user |
| 9 | Huynh Van Thanh Huyen | 0973313381 | user |
| 10 | Duong Thanh Liem | 0937357286 | user |
| 11 | Nguyen Xuan Son | 0988123978 | user |
| 12 | Mai Hung Cuong | 0797067879 | user |
| 13 | Le Minh Thang | 0919841122 | user |
| 14 | Nguyen Ngoc Tien | 0946428478 | user |

## Quy tắc đóng góp

| Kết quả | Đóng góp |
|---------|----------|
| Dự đoán đúng | 0 |
| Chọn HOME/AWAY sai | 30 |
| Chọn HÒA sai | 10 |
| Chọn HÒA + kèo handicap hòa | 0 |
