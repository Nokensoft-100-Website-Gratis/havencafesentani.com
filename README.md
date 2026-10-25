# Haven Cafe — Official Website
**Haven Cafe | Coffee & Roastery Sentani, Papua**
Website resmi Haven Cafe Sentani yang menampilkan menu, reservasi, galeri, layanan take away & delivery, serta event garden venue.

---

## Program 100 Website Gratis — Nokensoft

Website ini dibuat dalam rangka program **100 Website Gratis** yang diselenggarakan oleh **Nokensoft**.
Haven Cafe telah mendaftarkan diri melalui platform pendaftaran resmi program tersebut:

> **https://100websitegratis.nokensoft.com/**

Program ini bertujuan membantu pelaku usaha lokal di Papua dan sekitarnya untuk hadir secara digital dengan website profesional secara gratis.

---

## Hak Cipta & Lisensi

```
Copyright © 2026 Nokensoft. All Rights Reserved.
```

**Source code** website ini — termasuk seluruh struktur HTML, CSS, JavaScript, dan aset digital yang dikembangkan — adalah **milik dan hak cipta eksklusif Nokensoft** (www.nokensoft.com).

### Ketentuan Lisensi

- Source code **tidak boleh** disalin, didistribusikan, dijual, atau digunakan ulang untuk keperluan komersial maupun non-komersial tanpa izin tertulis dari Nokensoft.
- Konten (teks, foto, logo) adalah milik Haven Cafe Sentani.
- Website ini dikembangkan khusus untuk Haven Cafe sebagai bagian dari program 100 Website Gratis oleh Nokensoft.
- Segala modifikasi pada source code hanya dapat dilakukan oleh atau atas seizin Nokensoft.

---

## Tentang Nokensoft

**Nokensoft** adalah perusahaan teknologi yang bergerak di bidang pengembangan software, website, dan solusi digital untuk pelaku usaha lokal di Papua dan Indonesia.

| Info         | Detail                                           |
|--------------|--------------------------------------------------|
| Website      | [www.nokensoft.com](https://www.nokensoft.com)   |
| Email        | info@nokensoft.com                               |
| WhatsApp     | 0821-9955-8191                                   |
| Program      | [100 Website Gratis](https://100websitegratis.nokensoft.com/) |

---

## Tentang Haven Cafe

- **Nama**       : Haven Cafe Sentani
- **Lokasi**     : Ex-Bosco Fernandez, Jl. Gereja Silo, Hinekombe, Sentani, Papua
- **WhatsApp**   : +62 812-4858-4145
- **Instagram**  : [@official_haven_cafe_sentani](https://www.instagram.com/official_haven_cafe_sentani/)
- **Website**    : [havencafesentani.com](https://havencafesentani.com)

---

## Update Menu

Menu ditampilkan dari file PDF resmi yang dikonversi menjadi gambar WebP (ringan untuk mobile) beserta teks untuk fitur pencarian.

1. Simpan PDF baru di `_REVISI/haven-cafe-sentani-menu-YYYYMMDD.pdf`
2. Jika jumlah/urutan halaman berubah, sesuaikan daftar `PAGES` di `tools/build-menu.mjs`
3. Jalankan:
   ```bash
   cd tools
   npm install
   node build-menu.mjs ../_REVISI/haven-cafe-sentani-menu-YYYYMMDD.pdf
   ```
4. Perbarui label ukuran PDF dan tanggal "Menu updated" di `index.html`

Foto galeri dikelola di `js/gallery.js` (file di `images/gallery/<kategori>/`).

---

## Teknologi

- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS framework
- [Alpine.js](https://alpinejs.dev/) — Lightweight JavaScript framework
- [Font Awesome](https://fontawesome.com/) — Icon library
- [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) — Typography

---

*Developed with ❤️ by [Nokensoft](https://www.nokensoft.com) — Sentani, Papua, Indonesia*
