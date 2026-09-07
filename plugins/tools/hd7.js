import axios from 'axios';

const pluginConfig = {
  name: "hd7",
  alias: ["remini7", "upscale", "enhance7"],
  category: "tools",
  description: "Meningkatkan resolusi dan kualitas gambar (Upscale/HD)",
  usage: ".hd7 (balas/kirim gambar)",
  example: ".hd7",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 2,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const prefix = m.prefix || '.';
  const command = m?.command || 'hd7';

  // Deteksi gambar dari pesan yang dikirim atau di-reply
  const quoted = m.quoted ? m.quoted : m;
  const mime = (quoted.msg || quoted).mimetype || '';

  if (!/image\/(png|jpe?g|webp)/.test(mime)) {
    if (m.react) await m.react("❌");
    return m.reply(`📌 *Cara Penggunaan:*\nKirim atau balas/reply gambar dengan caption *${prefix + command}*`);
  }

  if (m.react) await m.react("⏳");

  try {
    // 1. Download gambar dari WhatsApp
    const mediaBuffer = await quoted.download();

    // 2. Upload media sementara ke catbox untuk mendapatkan URL publik
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', mediaBuffer, { filename: 'image.jpg' });

    const uploadRes = await axios.post('https://catbox.moe/user/api.php', form, {
      headers: form.getHeaders(),
      timeout: 30000
    });

    const imageUrl = uploadRes.data.trim();

    if (!imageUrl.startsWith('http')) {
      throw new Error("Gagal mengunggah gambar ke server media.");
    }

    // 3. Panggil API Nexadev Upscale
    const apiUrl = `https://api.nexadev.my.id/api/upscale?url=${encodeURIComponent(imageUrl)}`;

    // Ambil hasil gambar HD berupa Buffer
    const response = await axios.get(apiUrl, {
      responseType: 'arraybuffer',
      timeout: 45000
    });

    const imageBuffer = Buffer.from(response.data, 'binary');

    // Kirim gambar hasil upscale ke WhatsApp
    await sock.sendMessage(m.chat, {
      image: imageBuffer,
      caption: `✨ *IMAGE UPSCALE HD*\n\nGambar berhasil ditingkatkan kualitasnya!`
    }, { quoted: m });

    if (m.react) await m.react("✅");

  } catch (e) {
    console.error('[HD7 UPSCALE ERROR]', e);
    if (m.react) await m.react("❌");
    
    const errMsg = e.response?.data?.message || e.message;
    return m.reply(`❌ *Gagal meng-upscale gambar:* ${errMsg}`);
  }
}

export { pluginConfig as config, handler };