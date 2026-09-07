export const FEATURE_CREDIT = "Fitur By: Anita Putri Azzahra\nFitur SC Bot Ryo Yamada MD 👑\nTiktok: https://tiktok.com/@anita.putri.azzah1\nSaluran Resmi: ";

import { createCanvas } from '@napi-rs/canvas';

const pluginConfig = {
    name: 'fakeijazah',
    alias: ['ijazahfake', 'fakediploma'],
    category: 'canvas',
    description: 'Membuat sertifikat kelulusan fiktif untuk konten/gagasan',
    usage: '.fakeijazah <nama> | <gelar> | <universitas>',
    example: '.fakeijazah Ryo Yamada | S.Kom | Universitas Zero',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 8,
    energi: 1,
    isEnabled: true
};

function safeText(value, fallback) {
    const text = String(value ?? '').trim();
    return text.slice(0, 60) || fallback;
}

function generateFakeIjazah(nama, gelar, universitas) {
    const width = 1600;
    const height = 1100;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Sengaja dibuat sebagai mock-up yang jelas fiktif, tanpa template eksternal.
    ctx.fillStyle = '#f8f4e8';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#8d6b2d';
    ctx.lineWidth = 18;
    ctx.strokeRect(35, 35, width - 70, height - 70);
    ctx.strokeStyle = '#c7a64b';
    ctx.lineWidth = 5;
    ctx.strokeRect(65, 65, width - 130, height - 130);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#6d5120';
    ctx.font = 'bold 66px "Times New Roman"';
    ctx.fillText('SERTIFIKAT KELULUSAN', width / 2, 180);

    ctx.fillStyle = '#444';
    ctx.font = '26px "Times New Roman"';
    ctx.fillText('DOKUMEN FIKTIF • UNTUK KONTEN / HIBURAN', width / 2, 235);

    ctx.strokeStyle = '#c7a64b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(320, 275);
    ctx.lineTo(1280, 275);
    ctx.stroke();

    ctx.fillStyle = '#333';
    ctx.font = '30px "Times New Roman"';
    ctx.fillText('Diberikan sebagai contoh kelulusan fiktif kepada', width / 2, 350);

    ctx.fillStyle = '#6d5120';
    ctx.font = 'bold 58px "Times New Roman"';
    ctx.fillText(nama.toUpperCase(), width / 2, 455);

    ctx.fillStyle = '#333';
    ctx.font = '32px "Times New Roman"';
    ctx.fillText(`Gelar: ${gelar.toUpperCase()}`, width / 2, 530);
    ctx.fillText(`Institusi: ${universitas.toUpperCase()}`, width / 2, 595);

    const tahun = new Date().getFullYear();
    const nomor = `RMD-FIKTIF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    ctx.font = '27px "Times New Roman"';
    ctx.fillText(`Tahun: ${tahun}   •   No: ${nomor}`, width / 2, 665);

    ctx.save();
    ctx.translate(width / 2, height / 2 + 80);
    ctx.rotate(-0.16);
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#b00020';
    ctx.font = 'bold 92px Arial';
    ctx.fillText('DOKUMEN FIKTIF', 0, 0);
    ctx.restore();

    ctx.fillStyle = '#777';
    ctx.font = '22px "Times New Roman"';
    ctx.fillText('Bukan ijazah resmi • Tidak berlaku untuk keperluan administratif atau hukum', width / 2, 900);
    ctx.fillStyle = '#6d5120';
    ctx.font = 'bold 28px "Times New Roman"';
    ctx.fillText('Ryo Yamada MD', width / 2, 965);

    return canvas.toBuffer('image/png');
}

async function handler(m, { sock }) {
    const text = m.args.join(' ') || m.text?.trim() || '';

    if (!text) {
        return m.reply(
            `💕 *FAKE IJAZAH* 💕\n\n` +
            `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
            `┃ ✦ *Cara Pakai*\n` +
            `┃ ${m.prefix}fakeijazah <nama> | <gelar> | <universitas>\n` +
            `┃\n` +
            `┃ ✦ *Contoh*\n` +
            `┃ ${m.prefix}fakeijazah Ryo Yamada | S.Kom | Universitas Zero\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        );
    }

    const parts = text.split('|').map(v => v.trim());
    const nama = safeText(parts[0], 'Darling');
    const gelar = safeText(parts[1], 'S.Kom');
    const universitas = safeText(parts[2], 'Universitas Zero');

    await m.react('💕');
    await m.reply('⏳ *Processing...*\n\n💗 Ryo Yamada sedang membuat sertifikat fiktif~');

    try {
        const image = generateFakeIjazah(nama, gelar, universitas);
        await sock.sendMessage(m.chat, {
            image,
            caption:
                `💕 *FAKE IJAZAH* 💕\n\n` +
                `╭━━━━━━━━━━━━━━━━━━━━━⬣\n` +
                `┃ 👨‍🎓 *Nama:* ${nama}\n` +
                `┃ 🎓 *Gelar:* ${gelar}\n` +
                `┃ 🏛️ *Institusi:* ${universitas}\n` +
                `┃\n` +
                `┃ ⚠️ *Dokumen ini fiktif dan tidak resmi.*\n` +
                `╰━━━━━━━━━━━━━━━━━━━━━⬣`
        }, { quoted: m });
        await m.react('✅');
    } catch (err) {
        console.error('[FakeIjazah] Error:', err);
        await m.react('💔');
        return m.reply(`💔 *Gagal membuat gambar*\n\n> ${err?.message || err}`);
    }
}

export { pluginConfig as config, handler };
