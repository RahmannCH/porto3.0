<div align="center">

# ⚡ MUHAMMAD NUR RAHMAN · PORTO 3.0

> **Mahasiswa S1 Ilmu Komputer ULM & Full-stack Developer**  
> Eksperimen web interaktif performa tinggi dengan *Vanilla Physics Engine*, *3D Hardware-Accelerated Interactions*, dan *Zero Framework Overhead*.

[![Live Demo](https://img.shields.io/badge/Demo-Live%20Web-blue?style=for-the-badge&logo=vercel&logoColor=white)](https://rahmannch.github.io/porto3.0/)
[![Tests](https://img.shields.io/badge/Tests-34%2F34%20Passing-brightgreen?style=for-the-badge&logo=playwright&logoColor=white)](scripts/smoke.spec.js)
[![A11y](https://img.shields.io/badge/WCAG-2.2%20AA%20Compliant-purple?style=for-the-badge&logo=w3c&logoColor=white)](#aksesibilitas)
[![License](https://img.shields.io/badge/License-MIT-lightgrey?style=for-the-badge)](LICENSE)

---

### 🕹️ Jalan Pintas Kontrol Cepat

| Aksi | Masukan / Shortcut | Hasil Interaksi |
| :--- | :--- | :--- |
| **Buka Terminal CLI** | Tekan <kbd>`</kbd> (Backtick) | Mengangkat laci terminal pengembang *RahmanOS v1.0* |
| **Reset Posisi Stiker** | Tekan <kbd>Home</kbd> | Membekukan fisika & menyusun rapi stiker di atas teks nama |
| **Ayunan Kartu ID** | Tekan <kbd>←</kbd> / <kbd>→</kbd> | Mengayunkan tali kartu identitas dengan momentum polar 3D |
| **Tarik Kartu ID** | Tekan <kbd>↑</kbd> / <kbd>↓</kbd> | Menarik & meregangkan tali webbing elastis |
| **Navigasi Galeri** | Tekan <kbd>←</kbd> / <kbd>→</kbd> di galeri | Membalik tumpukan kartu dokumentasi kegiatan |

---

</div>

## 📑 Daftar Isi
- [Sorotan Fitur Utama](#-sorotan-fitur-utama)
  - [1. Letter-Terrain Gravity Physics](#1-letter-terrain-gravity-physics-stiker-hero)
  - [2. 3D Polar Pendulum Lanyard & Shark Pin](#2-3d-polar-pendulum-lanyard--shark-pin)
  - [3. Dual Organic Mascot Ecosystem](#3-dual-organic-mascot-ecosystem)
  - [4. RahmanOS Developer CLI Drawer](#4-rahmanos-developer-cli-drawer)
  - [5. Stacked Activity Deck Gallery](#5-stacked-activity-deck-gallery)
  - [6. SnapDOM Instant Summary Export](#6-snapdom-instant-summary-export)
  - [7. Zero-PDF Print Stylesheet (CV Engine)](#7-zero-pdf-print-stylesheet-cv-engine)
- [Proyek Pilihan & Studi Kasus](#-proyek-pilihan--studi-kasus)
- [Arsitektur Teknis](#-arsitektur-teknis)
- [Instalasi & Pengujian](#-instalasi--pengujian)

---

## 🌟 Sorotan Fitur Utama

<details open>
<summary><h3>1. Letter-Terrain Gravity Physics (Stiker Hero)</h3></summary>

Mesin simulasi fisika benda tegar 2D (*Rigid-Body Solver*) kustom tanpa library luar. Menggunakan batas atas teks raksasa **"MUHAMMAD"** sebagai kontur medan pijakan fisik (*topographical terrain*).

* **Karakter Pantulan Padat:** Restitusi balok kayu/plastik padat ($e = 0.24$), bukan bola karet liar.
* **Tumbukan Antar-Objek:** Deteksi tabrakan elips AABB dengan transfer impuls elastis murni ($e = 0.30$) sehingga stiker berhamburan alami di udara.
* **Lempar Bebas (Inertia Toss):** Melacak vektor pergeseran $\Delta x / \Delta t$ kursor saat ditarik. Melepaskan kursor akan melempar stiker mengikuti momentum lemparan.
* **Auto-Sleep Engine:** Begitu semua kecepatan $|v| < 0.6\text{ px/s}$, loop animasi berhenti (*0% CPU usage*).
* **Responsive Guard:** Menyetel ulang posisi ke nol otomatis saat jendela browser mengecil ke mode mobile ($\le 720\text{px}$).

```bash
# Model Kontur Medan Huruf:
# M     U     H     A     M     M     A     D
# /\/\  |__|  |__|   /\   /\/\  /\/\   /\   |--\  (Puncak & Lembah Huruf)
```
</details>

<details>
<summary><h3>2. 3D Polar Pendulum Lanyard & Shark Pin</h3></summary>

Simulasi kartu ID gantung dengan dinamika fisika polar teredam dan proyeksi rotasi 3D.

* **Fisika Tali Elastis:** Menyelesaikan persamaan gerak pendulum teredam dua derajat kebebasan ($r, \theta$):
  $$\ddot{r} = r\dot{\theta}^2 + g\cos\theta - k(r - r_0) - c_r\dot{r}$$
  $$\ddot{\theta} = -\frac{g}{r}\sin\theta - c_t\dot{\theta} - 2\frac{\dot{r}}{r}\dot{\theta}$$
* **Orientasi Aerodinamis 3D:** Sudut ayunan diproyeksikan langsung ke sumbu `--rot-y` dan `--rot-x` menggunakan CSS 3D Transforms (`transform-style: preserve-3d; perspective: 1200px`).
* **Aksen Enamel Pin Hiu:** Lencana hiu metalik premium terpasang di atas klip lanyard dengan kilau enamel dan drop-shadow tebal.
* **Mobile Guard:** Tali lanyard otomatis disembunyikan pada layar sempit ($\le 720\text{px}$) agar tidak menutupi teks headline.
</details>

<details>
<summary><h3>3. Dual Organic Mascot Ecosystem</h3></summary>

Dua karakter maskot cerdas yang berkeliaran di lantai bawah layar dengan perilaku otonom.

* **Adaptasi Tema Murni:** Tubuh maskot otomatis berwarna putih di *Dark Mode* dan hitam di *Light Mode* menggunakan token warna `--ink`.
* **Gaya Sepatu Kartun:** Kaki dilengkapi garis tepi tegas dengan sol aksen biru, serta berhenti melangkah otomatis saat maskot sedang diam atau berbicara.
* **Separasi Visual Spasial:**
  * **Atas:** Balon kata dialog bersih tanpa emoji.
  * **Sisi Kiri:** Aura identitas ambien (`</>` / `{ }`) dan partikel mengambang permanen.
  * **Sisi Kanan:** Lencana reaksi emosional dinamis (`👋` melambai saat menyapa, `💦` memantul saat kaget, `💤` saat mengantuk).
* **Interaksi Tatapan Halus:** Pupil melacak kursor pengguna secara real-time dengan interpolasi koordinat tanpa terbalik saat tubuh berputar arah (`scaleX`).
* **Anti-Deadlock Click:** Pengguna dapat mengeklik kedua maskot bergantian dan keduanya langsung bersuara secara independen.
</details>

<details>
<summary><h3>4. RahmanOS Developer CLI Drawer</h3></summary>

Terminal konsol pengembang terintegrasi yang dapat dibuka kapan saja melalui footer atau menekan tombol <kbd>`</kbd>.

```
~ $ help
Perintah: whoami, projects, skills, theme [dark|light|toggle], contact, print, pet, clear, exit
```

- [x] **Kontrol Tema Instan:** `theme light` / `theme dark` mengganti tema website secara mulus.
- [x] **Riwayat Perintah (History):** Tekan <kbd>↑</kbd> dan <kbd>↓</kbd> untuk menelusuri perintah sebelumnya.
- [x] **Aksi Terintegrasi:** Mengetik `print` langsung memicu dialog cetak CV, mengetik `pet` langsung menyapa maskot.
</details>

<details>
<summary><h3>5. Stacked Activity Deck Gallery</h3></summary>

Galeri dokumentasi kegiatan berbentuk tumpukan kartu interaktif (*flashcard deck*):
* **Swipe Gesture & Keyboard:** Geser kartu ke kanan/kiri via pointer drag atau tombol panah keyboard.
* **Backlog Queue Limiter:** Membatasi tumpukan antrean aksi agar transisi kartu tidak melompat liar saat tombol ditekan berulang kali.
* **Safe Missing Photo Handler:** Kartu tanpa berkas gambar menampilkan pola striping elegan *"Foto Menyusul"* tanpa memicu galat request 404 di browser.
</details>

<details>
<summary><h3>6. SnapDOM Instant Summary Export</h3></summary>

Tombol **Snap** di navigasi atas menghasilkan ekspor gambar ringkasan portofolio berkualitas tinggi secara instan:
* Mengisolasi konten utama `#main` dan mengabaikan elemen mengambang/chrome website.
* Secara cerdas menstabilkan stiker yang sedang melayang sebelum proses rasterisasi berjalan.
</details>

<details>
<summary><h3>7. Zero-PDF Print Stylesheet (CV Engine)</h3></summary>

Tidak perlu menyimpan file PDF statis yang cepat usang. Seluruh halaman web ini adalah CV itu sendiri:
* Memuat `css/print.css` dengan `media="print"` tanpa membebani memori layar.
* Menghilangkan seluruh chrome interaktif (maskot, CLI drawer, lanyard) dan menata ulang profil menjadi format dokumen resmi di kertas putih standar.
</details>

---

## 💻 Proyek Pilihan & Studi Kasus

| Proyek | Kategori / Arsitektur | Fitur Utama | Tautan |
| :--- | :--- | :--- | :--- |
| **Zadify** | Web App · Next.js & TS | Ruang belajar Al-Qur'an, asisten AI Gemini, kompas kiblat, Web Audio API | [Demo](https://zadify.vercel.app) · [Repo](https://github.com/RahmannCH/Zadify) |
| **CodeChrome** | Browser Dashboard · React | Dashboard browser keyboard-first, feedback suara sintetis mechanical | [Repo](https://github.com/RahmannCH/CodeChrome) |
| **Game Farm 2.0** | Simulation · HTML5 Canvas 2D | Game simulasi pertanian murni tanpa engine luar, custom game loop | [Demo](https://game-farm-2-0.vercel.app) · [Repo](https://github.com/RahmannCH/Game-Farm-2.0) |
| **VirtualPet TeKom** | Academic · Formal Automata | Simulator interaktif 5-Tuple Deterministic Finite Automaton (DFA) | [Demo](https://virtual-pet-tekom.vercel.app) · [Repo](https://github.com/RahmannCH/VirtualPet_TeKom) |

---

## 🛠️ Arsitektur Teknis

```
porto3.0/
├── index.html            # Struktur markup semantik & aksesibilitas WCAG 2.2
├── css/
│   ├── style.css         # Desain sistem editorial token, tipografi fluid, & CLI
│   ├── portfolio.css     # Komponen interaktif: Lanyard, Maskot, Galeri, Stiker
│   ├── scrollcraft.css   # ScrollCraft progress bar & engine style
│   └── print.css         # Lembar gaya pencetakan CV resmi (media="print")
├── js/
│   ├── main.js           # Engine fisika, state machine maskot, CLI, & interaksi
│   └── scrollcraft.js    # Engine scroll interaktif
├── assets/               # Gambar pratinjau proyek asli & pin hiu enamel SVG
└── scripts/
    ├── serve.mjs         # Server pengembangan lokal statis
    └── smoke.spec.js     # 34 pengujian otomatis Playwright menyeluruh
```

---

## 🧪 Instalasi & Pengujian

### Prasyarat
* [Node.js](https://nodejs.org/) v18 atau yang lebih baru.

### 1. Kloning Repositori
```bash
git clone https://github.com/RahmannCH/porto3.0.git
cd porto3.0
```

### 2. Jalankan Server Lokal
```bash
npm install
npm run dev
# Buka peramban pada http://127.0.0.1:48123
```

### 3. Eksekusi Pengujian Otomatis (E2E Playwright)
```bash
# Menjalankan 34 skenario uji ketahanan responsif, aksesibilitas, & fisika
npm run test:e2e

# Menjalankan pengujian dengan antarmuka visual
npm run test:e2e:ui
```

---

<div align="center">

Dirancang dan dibangun dengan rasa ingin tahu oleh **[Muhammad Nur Rahman](https://github.com/RahmannCH)**  
© 2026 Hak Cipta Dilindungi.

</div>
