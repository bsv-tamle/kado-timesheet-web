# Kado Timesheet Web

Frontend MVP cho hệ thống timesheet:
- Vue 3
- TypeScript
- Vuetify (UI framework)
- Vue I18n (vi/en/ja)
- Vite

## Yêu cầu
- Node.js 20+ (khuyến nghị 22)

## Chạy local
```bash
cd /Users/tamle/Project/kado/kado-timesheet-web
cp .env.example .env
npm install
npm run dev
```

Ứng dụng chạy tại:
- [http://localhost:5173](http://localhost:5173)

API backend mặc định:
- `VITE_API_BASE_URL=http://localhost:8080/api/v1`

Lưu ý:
- Sau khi đổi `.env`, cần restart lại lệnh `npm run dev`.

## Build production
```bash
npm run build
npm run preview
```

## Cấu trúc chính
```text
src/
  locales/
    vi.ts
    en.ts
    ja.ts
  plugins/i18n.ts
  plugins/vuetify.ts
  App.vue
  main.ts
```

## Ghi chú
- Vuetify đã được cấu hình sẵn với Material Design Icons.
- Đa ngôn ngữ đã cấu hình sẵn: Tiếng Việt, English, 日本語.
- Layout hiện tại là màn hình khởi tạo để team bắt đầu dựng login/admin/employee screens.
