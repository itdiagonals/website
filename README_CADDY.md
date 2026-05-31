# Reverse Proxy untuk Testing (Caddy + ngrok)

Ketika frontend dan backend masing-masing di-expose via ngrok dengan subdomain berbeda, browser menolak cookie (termasuk `access_token`, `refresh_token`, dan `csrf_token`) karena `ngrok-free.app` masuk Public Suffix List.

Solusinya: jalankan **Caddy reverse proxy** di localhost agar FE & BE berbagi 1 domain, lalu expose port Caddy saja ke ngrok.

---

## Prerequisites

- Caddy (akan di-download otomatis ke `C:\Users\user\AppData\Local\Temp\caddy\`)
- Frontend & backend sudah bisa jalan di `localhost:3000` dan `localhost:8080`
- ngrok CLI terinstall

---

## Step-by-Step

### 1. Jalankan Backend

**Via Docker:**
```bash
cd backend
cp .env.example .env.docker  # kalau belum
# Edit .env.docker, lalu:
make backend-up
```

**Via Host:**
```bash
cd backend
go run .
```

Pastikan BE reachble:
```bash
curl http://localhost:8080/ping
# expected: {"message":"pong"}
```

### 2. Jalankan Frontend

```bash
pnpm dev
```

Pastikan FE reachble:
```bash
curl http://localhost:3000
# expected: HTML page
```

### 3. Jalankan Caddy Reverse Proxy

Caddy sudah di-download ke:
```
C:\Users\user\AppData\Local\Temp\caddy\caddy.exe
```

Jalankan dari root repo:
```powershell
c:\Users\user\AppData\Local\Temp\caddy\caddy.exe run --config Caddyfile
```

Atau tanpa config file (langsung dari root repo):
```powershell
c:\Users\user\AppData\Local\Temp\caddy\caddy.exe run --config Caddyfile
```

**Caddyfile** (sudah ada di root repo):
```caddyfile
:8081
reverse_proxy /api/* localhost:8080
reverse_proxy /* localhost:3000
```

Routing:
- `http://localhost:8081/api/*` → `localhost:8080` (backend)
- `http://localhost:8081/*`     → `localhost:3000` (frontend)

### 4. Update Environment Frontend

File `.env` di root repo sudah diset:
```env
NEXT_PUBLIC_API_URL=/api/v1
```

Kalau belum, pastikan pakai path relatif agar FE hit API via domain yang sama.

### 5. Update Environment Backend (CORS & Midtrans)

**File:** `backend/.env` (host) atau `backend/.env.docker` (Docker)

Setelah dapat URL ngrok (langkah 6), update:
```bash
BACKEND_CSRF_TRUSTED_ORIGINS=https://xxxx.ngrok-free.app
BACKEND_CORS_ALLOWED_ORIGINS=https://xxxx.ngrok-free.app
MIDTRANS_FINISH_URL=https://xxxx.ngrok-free.app/checkout/result
MIDTRANS_APPEND_NOTIFICATION_URL=https://xxxx.ngrok-free.app/api/v1/payments/midtrans/notification
```

### 6. Expose ke Internet (ngrok)

Buka terminal baru:
```bash
ngrok http 8081
```

Salin URL publik, misalnya:
```
https://abcd-123-45-67-89.ngrok-free.app
```

### 7. Restart Backend (kalau ubah env)

Kalau backend sudah jalan, restart supaya env baru ke-load.

---

## Akses Aplikasi

| Service | URL Lokal | URL Publik (ngrok) |
|---------|-----------|-------------------|
| Frontend | http://localhost:3000 | https://xxxx.ngrok-free.app/ |
| Backend API | http://localhost:8080 | https://xxxx.ngrok-free.app/api/v1 |
| Swagger | http://localhost:8080/swagger | https://xxxx.ngrok-free.app/api/swagger |

**Semua akses dari HP/desktop cukup pakai URL ngrok.**

---

## Troubleshooting

### Cookie masih gak ke-set?

- Pastikan `NEXT_PUBLIC_API_URL=/api/v1` (bukan URL ngrok BE yang terpisah)
- Pastikan `BACKEND_CSRF_TRUSTED_ORIGINS` & `BACKEND_CORS_ALLOWED_ORIGINS` di backend sudah mengandung URL ngrok
- Restart backend setelah ubah env

### CORS error?

- `BACKEND_CORS_ALLOWED_ORIGINS` harus cocok dengan origin ngrok
- Kalau ngrok URL berubah (random tiap restart), update env & restart backend

### 403 Forbidden di login/refresh?

Kalau tetap 403, kemungkinan CSRF cookie ditolak browser. Quick fix (testing only): tambahkan endpoint auth ke `csrfExemptPaths` di `backend/middleware/csrf_middleware.go`:

```go
var csrfExemptPaths = map[string]struct{}{
    "/api/v1/payments/midtrans/notification": {},
    "/api/v1/payments/biteship/notification": {},
    "/api/v1/auth/login":    {},
    "/api/v1/auth/register": {},
    "/api/v1/auth/refresh":  {},
    "/api/v1/auth/logout":   {},
}
```

---

## Ringkasan Arsitektur

```
User/HP
   |
   v
https://xxxx.ngrok-free.app  (ngrok)
   |
   v
localhost:8081  (Caddy)
   |-- /api/*  --> localhost:8080 (Go Backend)
   |-- /*      --> localhost:3000 (Next.js Frontend)
```

Semua request masuk 1 domain → cookie aman → CSRF/CORS gak masalah.
