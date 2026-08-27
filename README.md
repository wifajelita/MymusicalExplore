# MymusicalExplore 🎧

Website satu halaman (full-page) untuk menjelajahi lagu-lagu Barat lintas genre — hip-hop, pop, energik, dan balada — lewat galeri video carousel. Dibangun murni dengan **HTML, CSS, JavaScript, dan JSON**, tanpa framework atau build step, sehingga siap langsung di-deploy ke **GitHub Pages**.

## ✨ Fitur

- **Carousel galeri video** — geser, klik panah, atau ketuk kartu untuk memutar video langsung dari YouTube (modal player, autoplay, tombol tutup, tombol Esc, klik di luar untuk menutup).
- **Filter genre & mood** — pill filter (Semua / Hip-Hop / Pop / Energik / Balada) yang menyorot video sesuai kategori.
- **Genre Explorer** — kartu genre yang bisa diklik untuk langsung melompat & memfilter galeri.
- **Judul video otomatis** — judul & nama channel asli diambil secara live dari YouTube oEmbed API (dengan fallback teks kurasi bila offline/API gagal).
- **Favorit lagu** — tandai lagu favorit (ikon hati), tersimpan otomatis di `localStorage` perangkat pengunjung, ada tombol pintas di header untuk melihatnya.
- **Newsletter (demo front-end)** — form berlangganan email dengan validasi & pesan konfirmasi (belum terhubung ke backend/email service — lihat catatan di bawah).
- **Navigasi responsif** — header sticky dengan efek blur, hamburger menu di mobile, highlight menu aktif sesuai scroll.
- **Animasi halus** — reveal-on-scroll, counter statistik, equalizer bar sebagai elemen visual khas brand.
- **Look & feel modern-minimalis** — palet ungu–biru, tipografi Space Grotesk + Inter + JetBrains Mono, sepenuhnya fluid/responsif dari mobile hingga desktop.
- Semua foto latar menggunakan foto **Unsplash asli** (lisensi bebas pakai, kredit tercantum di footer) dan thumbnail video menggunakan thumbnail resmi YouTube.

## 🗂️ Struktur folder

```
mymusicalexplore/
├── index.html          # Struktur halaman (satu halaman penuh)
├── css/
│   └── style.css       # Semua styling & desain responsif
├── js/
│   ├── app.js           # Semua logika: carousel, modal, filter, favorit, dll.
│   └── data.json         # Data lagu, genre, dan info situs (mudah diedit)
└── README.md
```

## ➕ Menambah / mengubah lagu

Cukup edit `js/data.json` — tidak perlu menyentuh HTML/CSS/JS:

```json
{
  "youtubeId": "KODE_VIDEO_YOUTUBE",
  "genreId": "pop",
  "mood": "Deskripsi singkat mood",
  "fallbackTitle": "Judul cadangan jika oEmbed gagal",
  "fallbackAuthor": "Nama artis/channel cadangan",
  "note": "Kalimat singkat tentang lagu ini"
}
```

Genre baru bisa ditambahkan di array `genres` (butuh `id`, `label`, `accent` warna hex, dan `description`) — pill filter & kartu genre akan otomatis muncul.

## 🚀 Deploy ke GitHub Pages

1. Buat repository baru di GitHub, misalnya `mymusicalexplore`.
2. Upload/push seluruh isi folder ini (bukan foldernya, tapi isinya) ke branch `main`.
   ```bash
   git init
   git add .
   git commit -m "Initial commit: MymusicalExplore"
   git branch -M main
   git remote add origin https://github.com/USERNAME/mymusicalexplore.git
   git push -u origin main
   ```
3. Di GitHub: buka **Settings → Pages**.
4. Pada **Source**, pilih branch `main` dan folder `/ (root)`, lalu **Save**.
5. Tunggu 1–2 menit, situs akan aktif di:
   `https://USERNAME.github.io/mymusicalexplore/`

Tidak ada proses build — file statis langsung disajikan apa adanya.

## 🔧 Menjalankan secara lokal

Karena `app.js` memuat `data.json` lewat `fetch()`, buka file `index.html` lewat server lokal sederhana (bukan langsung dobel klik) agar tidak terblokir kebijakan CORS `file://`:

```bash
# Python 3
python3 -m http.server 8000
# lalu buka http://localhost:8000
```

## 📝 Catatan

- Form newsletter di halaman ini murni tampilan (front-end only) — belum terhubung ke layanan email apa pun. Untuk fungsi nyata, hubungkan ke layanan seperti Mailchimp, Buttondown, atau endpoint backend milikmu sendiri.
- Video diputar lewat YouTube `iframe` resmi (`youtube.com/embed/...`), sehingga mengikuti Ketentuan Layanan YouTube.
- Kredit foto latar: insung yoon, Nicolás Flor, dan Erik Mclean via Unsplash (lisensi Unsplash — bebas pakai).
