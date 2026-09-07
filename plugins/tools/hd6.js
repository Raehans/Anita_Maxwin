import axios from 'axios';

const pluginConfig = {
  name: "hd6",
  alias: ["remini6", "hd", "enhance6"],
  category: "tools",
  description: "Meningkatkan kualitas/resolusi gambar (HD)",
  usage: ".hd6 (balas/kirim gambar)",
  example: ".hd6",
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
  const command = m?.command || 'hd6';

  // Deteksi gambar dari pesan yang dikirim atau di-reply
  const quoted = m.quoted ? m.quoted : m;
  const mime = (quoted.msg || quoted).mimetype || '';

  if (!/image\/(png|jpe?g|webp)/.test(mime)) {
    if (m.react) await m.react("❌");
    return m.reply(`📌 *Cara Penggunaan:*\nKirim atau balas/reply gambar dengan caption *${prefix + command}*`);
  }

  if (m.react) await m.react("⏳");

  try {
    // Download gambar yang dikirim user
    const mediaBuffer = await quoted.download();

    // 1. Upload media sementara ke catbox/tmpfiles untuk mendapatkan URL gambar
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

    // 2. Panggil API Nexadev HD dengan URL gambar tersebut
    const apiUrl = `https://api.nexadev.my.id/tools/hd/?image=${encodeURIComponent(imageUrl)}`;

    // Ambil hasil gambar HD berupa Buffer
    const response = await axios.get(apiUrl, {
      responseType: 'arraybuffer',
      timeout: 45000
    });

    const imageBuffer = Buffer.from(response.data, 'binary');

    // Kirim gambar HD ke WhatsApp
    await sock.sendMessage(m.chat, {
      image: imageBuffer,
      caption: `✨ *IMAGE ENHANCER HD*\n\nGambar berhasil ditingkatkan kualitasnya!`
    }, { quoted: m });

    if (m.react) await m.react("✅");

  } catch (e) {
    console.error('[HD6 ERROR]', e);
    if (m.react) await m.react("❌");
    
    const errMsg = e.response?.data?.message || e.message;
    return m.reply(`❌ *Gagal memproses gambar HD:* ${errMsg}`);
  }
}

export { pluginConfig as config, handler };