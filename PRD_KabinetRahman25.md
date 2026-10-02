# Kabinet Rahman 25 — Design brief dan PRD

## Produk

Website publik statis untuk Kabinet Rahman 25, Himpunan Mahasiswa Ilmu Komputer, FMIPA Universitas Lambung Mangkurat. Audiens utama: mahasiswa yang ingin mengenali organisasi, struktur, agenda, dan kanal partisipasi.

## Arah desain

Ruang visual terang, institusional, dan ramah mahasiswa. Mengambil pola umum dari referensi, bukan menyalin tampilan atau asetnya:

- [BEM UAG](https://bem.uag.ac.id/): navigasi publik yang jelas, informasi/kabar dalam blok konten, jalur aspirasi dan kontak.
- [BEM Polmed](https://bem-polmed.com/): identitas kabinet/periode, struktur organisasi yang mudah dipindai, menu bertingkat.
- [BEM FKUB](https://bemfkub.or.id/): hero berbasis foto, identitas kabinet yang kuat, sorotan informasi.

### Design tokens

- Putih `#FFFFFF`: permukaan utama dan header.
- Off-white `#F5F7F5`: permukaan section selang-seling.
- Navy `#15243A`: teks utama.
- Slate `#637181`: teks pendukung.
- Teal `#087C78`: satu aksen untuk tautan, penanda, garis, dan CTA.
- Teal gelap `#075C5A`: section sorotan dengan teks putih.
- Border `#DCE3E2`: pemisah struktur.
- Tipografi: Plus Jakarta Sans untuk heading; DM Sans untuk body.
- Layout: hero editorial asimetris, banyak ruang putih, daftar organisasi tipis ber-divider, card hanya untuk informasi berhierarki.
- Hindari: latar gelap menyeluruh, cyan neon, glow, gradient dekoratif, glassmorphism, layout dashboard, dan deret kartu seragam.

## Arsitektur halaman

1. Header dengan identitas logo dan anchor Tentang, Organisasi, Program, Aspirasi.
2. Hero: identitas HIMAKOM, pesan pengantar, foto lokal ketua, CTA internal.
3. Tentang kabinet: penjelasan organisasi yang singkat.
4. Arah gerak: tiga prinsip pengantar, dengan catatan bahwa ini bukan visi-misi resmi.
5. Organisasi: daftar divisi dari dashboard sumber, dengan catatan susunan final menunggu konfirmasi.
6. Agenda: empty state sampai daftar program resmi tersedia.
7. Aspirasi: status kanal; tidak ada form aktif tanpa endpoint/alamat resmi.
8. Footer: identitas kampus dan kabinet; kontak ditampilkan setelah diverifikasi.

## Fitur dan perilaku

- Navigasi anchor satu halaman, menu mobile dengan `aria-expanded` dan kontrol keyboard.
- Responsive layout; target mobile, tablet, desktop.
- Fokus keyboard terlihat, skip link, HTML semantik, alt text, dan dukungan `prefers-reduced-motion`.
- Konten dikelola melalui HTML statis; admin/CMS tidak termasuk scope fase ini.
- Tidak ada database, login, data personal pengurus, NIM, counter statistik, submission form palsu, maupun tautan kontak placeholder.

## Fakta lokal yang boleh dipakai

- Nama kabinet Rahman 25 dan hubungan dengan HIMAKOM FMIPA ULM tercantum di sumber lokal.
- Aset logo kampus/HIMAKOM/kabinet dan foto Muhammad Nur Rahman tersedia lokal.
- Nama BPH, Humas, PSDM, Riset, Media, Kewirausahaan, dan Acara ditemukan sebagai opsi di dashboard sumber. Daftar perlu verifikasi sebelum dianggap susunan final.

Data anggota lain, visi-misi, periode akhir, program kerja, kontak, dan akun sosial dari repo dashboard belum terverifikasi; jangan dipublikasikan sebagai fakta.

## Kriteria penerimaan

- CSS/JS/aset lokal berhasil dimuat; tidak ada anchor internal rusak.
- Tidak ada statistik rekaan, nama/NIM dummy, form yang berpura-pura mengirim, atau kontak placeholder.
- Menu mobile dapat digunakan keyboard dan state ARIA akurat.
- Tidak ada horizontal overflow pada viewport 360px.
- Kontras teks memenuhi WCAG 2.2 AA.
- Semua informasi yang belum disahkan ditandai jelas atau tidak ditampilkan.

## Yang perlu dikonfirmasi sebelum konten final

1. Periode resmi kabinet.
2. Visi, misi, tagline.
3. Struktur final dan uraian masing-masing divisi.
4. Daftar program kerja, deskripsi, dan jadwal.
5. Nama/jabatan pengurus yang boleh dipublikasikan dan izin foto.
6. Form aspirasi atau kontak resmi, akun sosial, serta alamat sekretariat.
