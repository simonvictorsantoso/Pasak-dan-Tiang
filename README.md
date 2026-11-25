# Catatan Keuangan

Aplikasi web statis untuk mencatat pemasukan dan pengeluaran bulanan, lengkap dengan grafik (Chart.js). Data disimpan di localStorage browser, jadi tidak butuh server atau database.

## Struktur

```
catatan-keuangan/
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── package.json
├── vercel.json
├── .gitignore
└── README.md
```

## Jalankan lokal

```bash
npm install
npm run dev
```

Buka http://localhost:3000. Atau cukup buka `public/index.html` langsung di browser.

## Deploy ke Vercel

1. Upload folder ini ke repositori GitHub.
2. Di Vercel: Add New, Project, lalu impor repositori tersebut.
3. Framework Preset: **Other**. Kosongkan Build Command, lalu klik Deploy.

Lewat CLI: `npx vercel --prod`.

## Catatan

- Chart.js dimuat dari CDN (cdnjs), jadi butuh koneksi internet.
- Data tersimpan per browser dan perangkat.
