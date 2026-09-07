export const FEATURE_CREDIT = "Fitur By: Anita Putri Azzahra\nFitur SC Bot Ryo Yamada MD 👑\nTiktok: https://tiktok.com/@anita.putri.azzah1\nSaluran Resmi: ";

import fetch from 'node-fetch';

const pluginConfig = {
  name: "iqc4",
  alias: ["canvasiqc4", "iqcv2"],
  category: "maker",
  description: "Generate gambar IQC v2 (WA Reaction) dengan teks otomatis",
  usage: ".iqc4 <teks>",
  example: ".iqc4 Tes",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock, text }) {
  if (!text) {
    return m.reply(`⚠️ *Format Salah*\n\nPenggunaan:\n\`.iqc4 <teks>\`\n\nContoh:\n\`.iqc4 Halo Dunia\``);
  }

  const queryText = text.trim();
  const apiKey = "4ZtwE"; // API Key sesuai dokumen
  // Endpoint menggunakan parameter 'text' sesuai dokumentasi di screenshot
  const apiUrl = `https://api.theresav.biz.id/canvas/iqc/v2?text=${encodeURIComponent(queryText)}&apikey=${apiKey}`;

  await m.react('⏳');

  try {
    const response = await fetch(apiUrl);
    const contentType = response.headers.get('content-type') || '';

    // Jika API langsung mengembalikan gambar (Buffer)
    if (contentType.includes('image')) {
      const imageBuffer = await response.buffer();
      await sock.sendMessage(m.chat, {
        image: imageBuffer,
        caption: `✨ *Canvas IQC v2 Generated!*`
      }, { quoted: m });
      await m.react('✅');
      return;
    }

    // Jika API mengembalikan JSON
    const resJson = await response.json();
    if (resJson.status && resJson.result) {
      const imageUrl = typeof resJson.result === 'string' ? resJson.result : resJson.result.url;
      await sock.sendMessage(m.chat, {
        image: { url: imageUrl },
        caption: `✨ *Canvas IQC v2 Generated!*`
      }, { quoted: m });
      await m.react('✅');
    } else {
      await m.react('❌');
      m.reply(`❌ *Gagal generate:* ${resJson.message || 'Terjadi kesalahan pada server API.'}`);
    }

  } catch (err) {
    console.error('[IQC4 ERROR]', err);
    await m.react('❌');
    await m.reply(`❌ *Terjadi Kesalahan:* ${err.message}`);
  }
}

export { pluginConfig as config, handler };
