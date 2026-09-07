export const FEATURE_CREDIT = "Fitur By: Anita Putri Azzahra\nFitur SC Bot Ryo Yamada MD 👑\nTiktok: https://tiktok.com/@anita.putri.azzah1\nSaluran Resmi: ";

/**
  ╔══════════════════════
         ⧉  [faketiktok] — [maker]
 ╚══════════════════════

  ✺ Type     : Plugin ESM
  ✺ Source   : 
  ✺ Creator  : SXZnightmare
  ✺ API      : [ https://api.zenzxz.my.id ]
  ✺ Req     : Zenz [ 6283××××××××× ]
*/

let handler = async (m, { conn, text, usedPrefix, command }) => { 
    try {
        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || '';

        if (!text) {
            return m.reply(`*Example:*

➜ ${usedPrefix + command} SXZnightmare SXZ 1 10rb 74rb https://example.com/image.jpg
➜ Reply/kirim gambar dengan:
${usedPrefix + command} SXZnightmare SXZ 1 10rb 74rb

*Format:*
name username following followers likes url

*Parameter:*
• *name* : Nama akun TikTok
• *username* : Username TikTok
• *following* : Jumlah mengikuti
• *followers* : Jumlah pengikut
• *likes* : Total like akun
• *url* : Link gambar foto profil *(opsional)*`);
        }

        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

        let args = text.includes('|')
            ? text.split('|')
            : text.split(/\s+/);

        let [name, username, following, followers, likes, url] = args.map(v => v?.trim());

        if (!name || !username || !following || !followers || !likes) {
            return m.reply(`🍂 *Format tidak valid!*

*Example:*
${usedPrefix + command} SXZnightmare SXZ 1 10rb 74rb https://example.com/image.jpg`);
        }

        if (!url) {
            if (!mime.startsWith('image/')) {
                return m.reply(`🍂 *Kirim atau reply gambar untuk dijadikan foto profil.*`);
            }

            let media = await q.download();

            let form = new FormData();
            form.append('files[]', new Blob([media]), 'image.jpg');

            let upload = await fetch('https://uguu.se/upload.php', {
                method: 'POST',
                body: form
            });

            let json = await upload.json();
            url = json.files?.[0]?.url;

            if (!url) throw '🍂 *Gagal upload gambar ke server.*';
        }

        let api = `https://api.zenzxz.my.id/maker/faketiktok?name=${encodeURIComponent(name)}&username=${encodeURIComponent(username)}&following=${encodeURIComponent(following)}&followers=${encodeURIComponent(followers)}&likes=${encodeURIComponent(likes)}&url=${encodeURIComponent(url)}`;

        let res = await fetch(api);
        if (!res.ok) throw '🍂 *Gagal memproses gambar dari server.*';

        let buffer = Buffer.from(await res.arrayBuffer());

        await conn.sendMessage(m.chat, {
            image: buffer
        }, { quoted: m });

    } catch (e) {
        m.reply(typeof e === 'string' ? e : '🍂 *Terjadi kesalahan saat memproses permintaan.*');
    } finally {
        await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
    }
};

handler.help = ['faketiktok'];
handler.tags = ['maker'];
handler.command = /^(faketiktok|fakett)$/i;
handler.limit = false;
handler.register = false; // true kan jika ada fitur register atau daftar di bot mu.

export default handler;
