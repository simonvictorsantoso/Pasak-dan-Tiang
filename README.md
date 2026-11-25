# Catatan Keuangan

Aplikasi web statis untuk mencatat pemasukan dan pengeluaran bulanan dengan grafik (Chart.js). Data disimpan di Supabase dan tersinkron real-time antarperangkat.

## Struktur

```
catatan-keuangan/
├── public/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── config.js      <- URL dan kunci Supabase
├── supabase.sql       <- skema tabel, RLS, dan Realtime
├── package.json
├── vercel.json
├── .gitignore
└── README.md
```

## Setup Supabase

1. Buka Supabase, pilih proyek, lalu SQL Editor, New query.
2. Tempel isi `supabase.sql`, lalu klik Run.
3. Pastikan `public/config.js` berisi URL dasar proyek (tanpa `/rest/v1/`) dan kunci publishable.

## Cara pakai di dua HP

Buka aplikasi di kedua HP, isi **kode sinkron** yang sama (minimal 6 karakter, makin panjang dan acak makin baik), lalu tekan Sambungkan. Transaksi yang ditambah atau dihapus di satu HP langsung muncul di HP lain.

## Keamanan

Kebijakan RLS di `supabase.sql` membuka akses untuk peran anon, dan kode sinkron hanya memisahkan data antarpengguna (bukan autentikasi). Siapa pun yang tahu URL situs, kunci, dan kode sinkron Anda bisa membaca dan mengubah datanya. Pakai kode yang panjang dan acak, dan jangan bagikan. Untuk keamanan sungguhan, gunakan Supabase Auth dan kebijakan RLS berbasis `auth.uid()`.

## Jalankan lokal

```bash
npm install
npm run dev
```

Buka http://localhost:3000.

## Deploy ke Vercel

1. Upload folder ini ke GitHub.
2. Di Vercel: Add New, Project, impor repositori.
3. Framework Preset: **Other**, kosongkan Build Command, klik Deploy.
