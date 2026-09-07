#!/usr/bin/env bash
# ==============================================================
# Ryo Yamada MD - Deepnote Environment Init Script
# ==============================================================
# Paste script ini di:
# Deepnote > Project Settings > Environment > Init Script
#
# Script ini akan dijalankan SEKALI saat environment Deepnote
# dibuat atau di-rebuild.
# ==============================================================

set -e

echo "
echo ==============================================================
echo  Ryo Yamada MD - Deepnote Environment Setup
echo ==============================================================
echo 

# ── [1/4] Install Node.js 22 LTS ──────────────────────────────
echo [1/4] Menginstall Node.js 22 LTS...
if command -v node &>/dev/null && [  -ge 22 ]; then
 echo   OK Node.js v22.16.0 sudah terinstall
else
 curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - 2>/dev/null
 sudo apt-get install -y -q nodejs
 echo   OK Node.js v22.16.0 berhasil diinstall
fi

# ── [2/4] Install native system dependencies ─────────────────
echo [2/4] Menginstall native dependencies (ffmpeg, canvas, dll)...
sudo apt-get update -qq
sudo apt-get install -y -q \
 ffmpeg \
 imagemagick \
 webp \
 tesseract-ocr \
 tesseract-ocr-ind \
 pkg-config \
 libcairo2-dev \
 libpango1.0-dev \
 libjpeg-dev \
 libgif-dev \
 librsvg2-dev \
 python3-pip \
 build-essential \
 unzip \
 zip
echo   OK Native dependencies terinstall

# ── [3/4] Install PM2 (optional, untuk restart otomatis) ─────
echo [3/4] Menginstall PM2...
sudo npm install -g pm2 --quiet
echo   OK PM2  terinstall

# ── [4/4] Verifikasi ─────────────────────────────────────────
echo [4/4] Verifikasi instalasi...
echo   Node  : v22.16.0
echo   NPM   : 10.9.2
echo   FFmpeg: 
echo   PM2   : 

echo 
echo ==============================================================
echo  Setup selesai! Selanjutnya:
echo    1. Buka terminal Deepnote
echo    2. Jalankan: npm install
echo    3. Jalankan: node index.js
echo    4. Setelah pairing berhasil, copy ANITA_SESSION_B64 dari log
echo    5. Set ANITA_SESSION_B64 di Deepnote Environment Variables
echo ==============================================================
echo 
