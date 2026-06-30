# EvidFoto

🌐 **Live Demo:** [evid-foto.vercel.app](https://evid-foto.vercel.app)

Aplikasi manajemen foto pekerjaan berbasis web. Dibangun dengan Next.js 14, Tailwind CSS, shadcn/ui, dan Supabase.

## Fitur

- 🔐 **Autentikasi** — Login dengan 2 role: Admin (akses penuh) & User (lihat & download)
- 📸 **Upload Foto** — Drag & drop multi-file dengan metadata lengkap
- 🗂️ **Folder Management** — Folder nested dengan ikon & warna kustom
- 🖼️ **Galeri Foto** — Grid/list view, filter, sort, dan lightbox preview
- 📅 **Kalender** — Lihat foto berdasarkan tanggal pekerjaan
- 🔍 **Pencarian** — Full-text search real-time
- ⬇️ **Download** — Download satuan & bulk ZIP
- 📊 **Dashboard Admin** — Statistik dan grafik upload per bulan
- 🗑️ **Sampah** — Restore foto & folder yang dihapus
- 👥 **Manajemen User** — Tambah, aktifkan/nonaktifkan, ganti role
- 🌙 **Dark/Light Mode** — Toggle tema
- 📱 **Responsif** — Mobile & desktop

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Konfigurasi Supabase

Buat project di [supabase.com](https://supabase.com) lalu isi `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Setup Database

Jalankan SQL schema di Supabase SQL Editor:

```
supabase/schema.sql
```

### 4. Setup Storage Buckets

Di Supabase Dashboard → Storage, buat 2 bucket:
- `photos` (public)
- `avatars` (public)

Tambahkan policies storage (lihat komentar di schema.sql).

### 5. Jalankan Dev Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

### 6. Buat Admin Pertama

1. Register/login dengan email
2. Di Supabase SQL Editor jalankan:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'email-anda@domain.com';
```

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| State | Zustand |
| Charts | Recharts |
| ZIP | JSZip + file-saver |
| Calendar | Custom (date-fns) |
| Upload | react-dropzone |
| Icons | lucide-react |
| Font | Poppins (Google Fonts) |

## Struktur Halaman

| Route | Deskripsi | Role |
|---|---|---|
| `/login` | Halaman login | Public |
| `/dashboard` | Dashboard statistik | Admin/User |
| `/photos` | Galeri semua foto | Admin/User |
| `/folders` | Manajemen folder | Admin/User |
| `/calendar` | Kalender evident | Admin/User |
| `/search` | Pencarian foto | Admin/User |
| `/downloads` | Riwayat unduhan | Admin/User |
| `/users` | Manajemen user | Admin only |
| `/trash` | Sampah (restore) | Admin only |
| `/profile` | Profil pengguna | Admin/User |
| `/settings` | Pengaturan | Admin/User |

## Deploy ke Vercel

```bash
npm run build
vercel --prod
```

Tambahkan environment variables di Vercel Dashboard.
