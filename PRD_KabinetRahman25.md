# PRD: Website Publik Kabinet Rahman 25

## Status dokumen

Draft implementasi berbasis aset lokal dan referensi publik. Detail yang belum terverifikasi ditandai sebagai perlu konfirmasi; jangan dipublikasikan sebagai fakta.

## Ringkasan produk

Website publik untuk memperkenalkan Kabinet Rahman 25 dari HIMAKOM FMIPA Universitas Lambung Mangkurat. Website membantu mahasiswa mengenali kabinet, memahami arah keterlibatan, menjelajahi divisi dan program saat data resmi tersedia, serta menemukan kanal aspirasi yang sah.

Pengelolaan admin, login, CRUD, dan database bukan bagian dari fase ini. Konten dikelola melalui file statis.

## Tujuan dan pengguna

- Mahasiswa HIMAKOM yang mencari informasi kepengurusan dan kegiatan.
- Mahasiswa yang ingin bergabung, berkolaborasi, atau menyampaikan aspirasi.
- Pengunjung kampus yang ingin memahami identitas kabinet.

## Rujukan dan adaptasi

- [BEM UAG](https://bem.uag.ac.id/): pendekatan aspirasi, kontak, dan pilar peran organisasi.
- [BEM Polmed](https://bem-polmed.com/): identitas kabinet, periode, serta penyajian profil dan visi-misi.
- [BEM FKUB](https://bemfkub.or.id/): branding kabinet, foto hero, dan sorotan agenda.
- [Repo Kabinet Rahman](https://github.com/RahmannCH/Kabinet): identitas HIMAKOM ULM, nama kabinet/divisi, dan aset lokal.

Referensi menjadi acuan pola informasi dan arah visual, bukan salinan layout atau aset pihak ketiga. Aset pada website ini bersumber dari repo Kabinet pengguna.

## Fakta konten yang tersedia

- Nama: Kabinet Rahman 25.
- Organisasi: Himpunan Mahasiswa Ilmu Komputer, FMIPA, Universitas Lambung Mangkurat.
- Periode pada draft awal: 2025; tahun/periode akhir perlu dikonfirmasi.
- Repo sumber memuat nama divisi: BPH, Humas, PSDM, Riset, Media, Kewirausahaan, Acara. Daftar perlu konfirmasi sebelum diperlakukan sebagai struktur final.
- Foto ketua dan logo kabinet/HIMAKOM/ULM tersedia pada repo sumber.

Data nama anggota, NIM, foto eksternal, angka statistik, visi-misi, jumlah program, kontak, dan media sosial belum dinyatakan sebagai terverifikasi. Jangan tampilkan data contoh dari `app.js` sebagai fakta.

## Arsitektur informasi

Single-page website responsif:

1. Navigasi dan identitas kabinet.
2. Hero dengan identitas organisasi, pesan singkat, foto lokal, CTA menuju tentang/program.
3. Profil kabinet.
4. Arah gerak/komitmen, diberi label sebagai narasi pengantar sampai visi-misi resmi tersedia.
5. Struktur divisi, hanya setelah daftar final dikonfirmasi.
6. Program kerja dan agenda, hanya dari daftar resmi.
7. Aspirasi dengan tautan form/email resmi. Jangan tampilkan form palsu atau sukses kirim tanpa endpoint.
8. Footer: identitas, kontak, tautan resmi yang sudah diverifikasi.

## Spesifikasi pengalaman

### Navigasi

- Menu anchor: Tentang, Arah gerak, Program, Aspirasi.
- Mobile menu memiliki state buka/tutup yang diumumkan lewat `aria-expanded`.
- Tautan menutup menu setelah dipilih.

### Hero dan profil

- Layout editorial asimetris, logo/foto lokal, headline maksimal dua baris desktop.
- Tampilkan nama organisasi dan kabinet dengan jelas.
- Alt text informatif, gambar dimensi stabil, CTA membawa pengunjung ke bagian relevan.

### Struktur divisi

- Nama dan deskripsi singkat dari sumber resmi.
- Anggota hanya ditampilkan bila nama, peran, persetujuan publikasi, dan aset foto telah dikonfirmasi.
- Jangan tampilkan NIM secara publik tanpa alasan dan izin eksplisit.

### Program kerja

- Setiap entri berisi nama, ringkasan, status/jadwal bila dikonfirmasi, serta CTA detail bila tersedia.
- Jika data belum tersedia, tampilkan empty state yang menjelaskan informasi belum dipublikasikan.

### Aspirasi

- Kanal hanya aktif bila URL form/email resmi disediakan.
- Jika belum ada kanal, tampilkan status transparan; jangan menjanjikan kerahasiaan, respons cepat, atau penerimaan pesan yang belum dijamin.

## Arah visual dan UX

- Karakter: editorial kampus, hangat, tegas, informatif; mengutamakan identitas dan fotografi nyata.
- Layout: ruang putih, komposisi asimetris, pembagian bagian yang jelas, tipografi display sans dipadukan serif sebagai aksen terbatas.
- Palet implementasi: latar netral hangat, tinta hijau gelap, satu aksen hijau dan lime lembut.
- Hindari glassmorphism menyeluruh, statistik tanpa sumber, grid kartu seragam yang berulang, dekorasi tanpa fungsi.
- Gunakan animasi hemat dan hormati `prefers-reduced-motion`.

## Aksesibilitas dan responsif

- HTML semantik, skip link, urutan heading logis, label menu/form yang jelas.
- Semua interaksi dapat diakses keyboard dan fokus terlihat.
- Kontras teks memenuhi WCAG 2.2 AA.
- Layout diuji pada lebar 360px, tablet, laptop, dan desktop.
- `prefers-reduced-motion` menonaktifkan gerak non-esensial.

## Teknologi dan pengelolaan

- HTML, CSS, JavaScript vanilla; tanpa framework/dependensi baru.
- Konten statis dapat diedit langsung di HTML/asset.
- Tidak ada autentikasi, localStorage untuk data publik, atau pengiriman form simulasi.
- Aset visual lokal dari repo sumber. Font eksternal boleh gagal tanpa merusak layout.

## Kriteria penerimaan

- Halaman memuat tanpa kesalahan JS dan semua aset lokal ditemukan.
- Tidak ada tautan `#` tanpa target, konten dummy, statistik rekaan, atau interaksi yang berpura-pura berhasil.
- Menu mobile berfungsi dengan keyboard dan ARIA state yang benar.
- Tidak ada scroll horizontal di mobile.
- Informasi yang belum disahkan jelas ditandai atau ditahan dari publikasi.
- Build dipastikan tampil melalui preview browser sebelum rilis.

## Informasi yang perlu dikonfirmasi

1. Periode resmi kepengurusan.
2. Ejaan nama dan tagline resmi kabinet.
3. Visi-misi kabinet.
4. Daftar divisi final dan deskripsi.
5. Daftar program kerja, status, dan jadwal.
6. Nama/jabatan pengurus yang boleh dipublikasikan.
7. Kanal resmi aspirasi, email, alamat, Instagram, dan kanal sosial lain.
8. Izin penggunaan foto pengurus.

## Di luar cakupan fase ini

- Dashboard/admin, login, CRUD, database, analitik pengunjung, notifikasi, dan backend aspirasi.
- Konten berita dinamis/CMS.
- Klaim statistik dampak yang tidak memiliki sumber.
