# 🚀 Panduan Deploy: Ryo Yamada MD di Deepnote

> **Bot WhatsApp gratis 24/7 di Deepnote** — panduan lengkap dari awal sampai jalan.

---

## 📋 Daftar Isi

1. [Buat Akun & Project Deepnote](#1-buat-akun--project-deepnote)
2. [Setup Environment (Init Script)](#2-setup-environment-init-script)
3. [Upload Project ke Deepnote (via GitHub atau Zip)](#3-upload-project-ke-deepnote)
4. [Set Environment Variables](#4-set-environment-variables)
5. [Install Dependencies](#5-install-dependencies)
6. [Jalankan Bot (Pairing Pertama Kali)](#6-jalankan-bot-pairing-pertama-kali)
7. [Simpan Session (PENTING!)](#7-simpan-session-penting)
8. [Setup Keep-Alive (UptimeRobot)](#8-setup-keep-alive-uptimerobot)
9. [Restart Bot Otomatis](#9-restart-bot-otomatis)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Buat Akun & Project Deepnote

1. Daftar di **https://deepnote.com** (gratis)
2. Klik **+ New Project**
3. Nama project: `Ryo Yamada MD` (bebas)
4. Pilih environment: **Default Python** (nanti kita tambah Node.js via init script)

---

## 2. Setup Environment (Init Script)

> ⚠️ Ini langkah PALING PENTING. Harus dilakukan sebelum menjalankan bot.

1. Di project Deepnote, klik ikon **Settings (⚙️)** di kiri bawah (atau tab **Environment**)
2. Scroll ke bagian **Init Script**
3. Copy-paste seluruh isi file [`deepnote_init.sh`](deepnote_init.sh) ke kotak tersebut
4. Klik **Save & Rebuild** — tunggu 2-4 menit sampai selesai
5. Saat rebuild selesai, buka terminal di Deepnote dan cek:
   ```bash
   node -v    # harus: v22.x.x
   ffmpeg -version | head -1
   ```

---

## 3. Upload Project ke Deepnote

Ada 2 cara:

### Cara A: Clone dari GitHub (Paling Direkomendasikan ⭐)
1. Di Deepnote, buka terminal (`Ctrl + ~` atau tombol Terminal di bawah)
2. Jalankan perintah git clone repo kamu:
   ```bash
   git clone https://github.com/USERNAME/REPO_NAME.git .
   ```
   *(Atau gunakan tombol **Integrations** → **GitHub** di menu Deepnote)*

### Cara B: Upload Manual via ZIP
1. Kompres semua file project ke dalam file ZIP (KECUALI folder `node_modules`, `session`, `storage`, `tmp`)
2. Drag & drop file ZIP ke sidebar Deepnote
3. Di terminal Deepnote, jalankan:
   ```bash
   unzip nama_file.zip
   ```

---

## 4. Set Environment Variables

1. Di Deepnote, klik **Settings (⚙️)** → **Environment**
2. Scroll ke bagian **Environment Variables**
3. Tambahkan variable berikut:

| Nama | Nilai | Keterangan |
|------|-------|-----------|
| `DEEPNOTE` | `true` | **Wajib!** Aktifkan mode Deepnote (keepalive & persistence) |
| `ANITA_SESSION_B64` | *(kosongkan dulu)* | Diisi setelah pairing sukses di langkah 7 |
| `KEEPALIVE_PORT` | `8080` | Port HTTP keep-alive server |

---

## 5. Install Dependencies

Buka terminal di Deepnote dan jalankan:

```bash
npm install
```

Proses memerlukan 2-3 menit karena ada native dependencies (`sharp`, `skia-canvas`, dll).
Jika ada error native build:
```bash
sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev
npm install --build-from-source
```

---

## 6. Jalankan Bot (Pairing Pertama Kali)

### Edit `config.js` jika belum disesuaikan:
Pastikan nomor WA bot dan nomor owner sudah benar di `config.js`:
```javascript
session: {
  pairingNumber: "6285764575407", // nomor bot WA kamu
  usePairingCode: true,
},
owner: {
  name: "Anita Maxwin",
  number: ["6285764575407"],
},
```

### Jalankan bot di terminal Deepnote:
```bash
node index.js
```

**Output yang akan muncul:**
```
------------------------------------------------------------
SESSION PERSISTENCE MODE (Deepnote)
------------------------------------------------------------
ANITA_SESSION_B64 belum diset - perlu pairing pertama kali.
------------------------------------------------------------

╔══════════════════════════════════╗
║        PAIRING CODE              ║
║                                  ║
║   ABCD-1234   ← kode ini!        ║
║                                  ║
║  Masukkan kode ini di WhatsApp   ║
╚══════════════════════════════════╝
```

### Di WhatsApp HP:
1. Buka WhatsApp di HP nomor bot
2. Ketuk **⋮ (titik tiga)** → **Perangkat Tertaut (Linked Devices)**
3. Ketuk **Tautkan Perangkat (Link a Device)**
4. Pilih **Tautkan dengan nomor telepon saja (Link with phone number instead)**
5. Masukkan 8 karakter kode pairing yang muncul di terminal Deepnote

---

## 7. Simpan Session (PENTING AGAR TIDAK HILANG!)

Setelah bot tersambung, di terminal akan otomatis muncul kotak seperti ini:

```
======================================================================
ANITA_SESSION_B64 - COPY KE DEEPNOTE ENV VARS:
======================================================================
eyJub2lzZUtleSI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIj...
======================================================================
```

**Langkah Menyimpan:**
1. **Copy** seluruh teks Base64 tersebut dari terminal
2. Di Deepnote → **Settings (⚙️)** → **Environment** → **Environment Variables**
3. Buka variable `ANITA_SESSION_B64` yang tadi dibuat, paste kode tersebut ke nilainya
4. Klik **Save**

> 🎉 **Selesai!** Sekarang setiap kali Deepnote restart atau mesin ganti, sesi WhatsApp kamu akan otomatis dipulihkan. Kamu tidak perlu scan/pairing ulang lagi!

---

## 8. Setup Keep-Alive 24/7 (UptimeRobot)

Deepnote tier gratis akan sleep jika tidak ada traffic sekitar 1 jam. Agar bot on terus 24/7:

### A. Dapatkan URL Deepnote
Saat bot running:
1. Klik tab **Ports** atau cek preview URL Deepnote (biasanya format `https://xxxxxx.deepnoteapp.com`)
2. Port yang digunakan adalah `8080`
3. Endpoint pengecekan:
   - `https://xxxxxx.deepnoteapp.com/ping` (untuk UptimeRobot)
   - `https://xxxxxx.deepnoteapp.com/` (Dashboard status visual web)

### B. Setup UptimeRobot (100% Gratis)
1. Buka dan daftar di **https://uptimerobot.com**
2. Klik tombol **+ Add New Monitor**
3. Masukkan konfigurasi:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `Ryo Yamada Bot`
   - **URL (or IP)**: `https://xxxxxx.deepnoteapp.com/ping`
   - **Monitoring Interval**: `Every 5 minutes`
4. Klik **Create Monitor**

UptimeRobot akan melakukan ping setiap 5 menit sehingga instance Deepnote tetap terjaga (tidak idle/sleep).

---

## 9. Jalankan di Background (PM2)

Agar bot tetap berjalan di terminal tanpa harus membuka tab terminal terus:

```bash
# Install pm2
npm install -g pm2

# Jalankan bot
pm2 start index.js --name ryo-bot

# Simpan proses agar otomatis berjalan jika restart
pm2 save

# Perintah berguna lainnya:
pm2 logs ryo-bot     # Membaca log real-time
pm2 status           # Memeriksa apakah bot online
pm2 restart ryo-bot  # Restart bot jika ada perubahan
```

---

## 10. Troubleshooting

| Gejala | Solusi |
|--------|--------|
| `Cannot find module 'adm-zip'` | Jalankan `npm install adm-zip` di terminal Deepnote. |
| Pairing code tidak muncul | Pastikan `usePairingCode: true` dan format nomor `628xxxxxxxx` tanpa simbol `+`. |
| Session minta pairing ulang lagi setelah restart | Periksa apakah `ANITA_SESSION_B64` di Environment Variables sudah terisi dengan benar tanpa terpotong. |
| Error build node-gyp / canvas | Jalankan `sudo apt-get update && sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev` lalu `npm rebuild`. |
| Port 8080 tidak bisa diakses | Pastikan env `DEEPNOTE=true` sudah diset agar HTTP keep-alive server aktif. |

---

*Ryo Yamada MD v3.3 Deepnote Edition*
