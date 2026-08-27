# MymusicalExplore 🎧

Website satu halaman (full page) untuk galeri video musik barat lintas nada,
dibangun murni dengan **HTML, CSS, JavaScript**, dan satu file **JSON** sebagai
sumber data video. Tidak ada framework, tidak ada build step — tinggal unggah.

## Struktur folder

```
mymusicalexplore/
├── index.html          → halaman utama
├── css/style.css        → semua styling (tema ungu & biru)
├── js/app.js             → carousel, filter mood, modal player, fetch oEmbed
├── data/videos.json     → daftar video (edit di sini untuk ganti/menambah video)
└── README.md
```

## Fitur

- **Carousel galeri video** yang fluid & responsif (1 slide di HP, beberapa
  slide "mengintip" di tablet/desktop), bisa digeser dengan jari/mouse,
  panah, titik navigasi, atau tombol panah kiri/kanan keyboard.
- **Filter suasana/nada** (chips) — klik untuk menyaring video berdasarkan
  mood (`mood` di `videos.json`).
- **Judul & nama channel otomatis** diambil langsung dari YouTube lewat
  endpoint oEmbed publik saat halaman dibuka (fallback ke teks di JSON kalau
  offline/gagal).
- **Modal pemutar video** — klik thumbnail untuk membuka iframe YouTube resmi
  tanpa meninggalkan halaman.
- **Autoplay carousel** yang berhenti otomatis saat kursor di atasnya atau
  saat video sedang diputar.
- Desain modern-minimalis, brand color ungu (`#8b5cf6`) & biru (`#4f7cff`),
  aksen "equalizer" bergaya musik, hormat pada `prefers-reduced-motion`.
- Form "Ikuti" di bagian bawah murni tampilan (front-end only) — siap
  disambungkan ke layanan email pilihanmu sendiri.

## Mengganti / menambah video

Edit `data/videos.json`, tambahkan objek baru di array `videos`:

```json
{
  "id": "v5",
  "youtubeId": "KODE_VIDEO_YOUTUBE",
  "mood": "Nama suasana bebas",
  "genre": "Genre bebas",
  "accent": "purple",
  "fallbackTitle": "Judul sementara",
  "fallbackChannel": "Nama channel sementara"
}
```

`fallbackTitle`/`fallbackChannel` hanya tampil sekilas sebelum data asli dari
YouTube (judul & channel sebenarnya) selesai dimuat oleh `app.js` — jadi tidak
perlu diisi persis, tapi enak diisi dengan tebakan yang masuk akal.

## Menjalankan secara lokal

Karena `fetch()` dipakai untuk membaca `videos.json`, buka lewat server lokal
kecil (bukan `file://`), misalnya:

```bash
python3 -m http.server 8080
# lalu buka http://localhost:8080
```

## Deploy ke GitHub Pages

1. Buat repository baru di GitHub, misalnya `mymusicalexplore`.
2. Unggah seluruh isi folder ini (bukan foldernya sendiri) ke root
   repository tersebut — pastikan `index.html` ada persis di root.
3. Masuk ke **Settings → Pages**.
4. Di **Source**, pilih branch `main` dan folder `/ (root)`, lalu **Save**.
5. Tunggu 1–2 menit, GitHub akan memberi URL seperti:
   `https://<username-kamu>.github.io/mymusicalexplore/`

Situs ini statis sepenuhnya, jadi tidak perlu konfigurasi tambahan apa pun.

## Catatan hak cipta

Video diputar melalui iframe resmi YouTube dan thumbnail diambil dari CDN
resmi YouTube (`img.youtube.com`) — keduanya adalah cara pengambilan yang sah
dan tidak menyalin video/gambar ke server sendiri. Semua hak video tetap milik
pembuat/channel aslinya.
