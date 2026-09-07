#!/usr/bin/env bash
# ==========================================================
# Ryo Yamada MD - VPS Ubuntu Auto Setup Script
# ==========================================================

set -e

echo "🚀 [1/5] Memperbarui sistem dan menginstall dependensi native Linux..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential ffmpeg imagemagick webp \
  tesseract-ocr tesseract-ocr-ind pkg-config libcairo2-dev libpango1.0-dev \
  libjpeg-dev libgif-dev librsvg2-dev unzip zip

echo "📦 [2/5] Menginstall Node.js v22.x LTS..."
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'.' -f1 | tr -d 'v')" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt install -y nodejs
else
  echo "✅ Node.js $(node -v) sudah terpasang dan memenuhi syarat."
fi

echo "⚙️ [3/5] Menginstall PM2 Process Manager secara global..."
sudo npm install -g pm2

echo "📥 [4/5] Menginstall dependensi proyek (npm install)..."
npm install

echo "✨ [5/5] Setup selesai!"
echo ""
echo "=========================================================="
echo " Selanjutnya silakan lakukan:"
echo " 1. Edit config.js (atur nomor bot & nomor owner):"
echo "    nano config.js"
echo ""
echo " 2. Jalankan bot untuk pertama kali (Pairing Code WA):"
echo "    node index.js"
echo ""
echo " 3. Setelah sukses terhubung, jalankan via PM2 (24/7):"
echo "    pm2 start index.js --name ryo-bot"
echo "    pm2 save"
echo "    pm2 startup"
echo "=========================================================="
