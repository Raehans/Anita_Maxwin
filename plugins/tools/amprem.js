import axios from "axios";

const API_BASE_URL = process.env.ALIGHT_API_BASE_URL || "https://am.rafaelxd.my.id/api/v1";
const API_KEY = process.env.ALIGHT_API_KEY || "alight_live_3809350d937f869762f6de5d3a9a60d0";

const sessions = new Map();
const SESSION_TTL = 10 * 60 * 1000;

function sessionKey(m) {
  return `${m.chat}:${m.sender}`;
}

function cleanupSessions() {
  const now = Date.now();
  for (const [key, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL) sessions.delete(key);
  }
}

setInterval(cleanupSessions, 60_000).unref?.();

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validLink(link) {
  try {
    const u = new URL(link);
    return /^https?:$/.test(u.protocol);
  } catch {
    return false;
  }
}

async function apiPost(endpoint, body) {
  if (!API_KEY) throw new Error("API key belum dikonfigurasi.");
  const response = await axios.post(`${API_BASE_URL}/${endpoint}`, body, {
    timeout: 45_000,
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    validateStatus: () => true,
  });
  const data = response.data || {};
  if (response.status < 200 || response.status >= 300 || data.success === false) {
    throw new Error(data.message || data.error || `API mengembalikan HTTP ${response.status}`);
  }
  return data;
}

const pluginConfig = {
  name: "amprem",
  alias: ["alightpremium", "am-prem"],
  category: "tools",
  description: "Proses aktivasi Alight Motion melalui API provider",
  usage: ".amprem <email>",
  example: ".amprem user@example.com",
  isOwner: false,
  isPremium: true,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
};

async function handler(m) {
  const email = m.text?.trim();
  if (!email) return m.reply(`✨ *ALIGHT MOTION PREMIUM*\n\nGunakan:\n> ${m.prefix}amprem email@example.com\n\nSetelah link verifikasi dikirim, reply pesan bot ini dengan *full link verifikasi* dari email noreply.`);
  if (!validEmail(email)) return m.reply("❌ Format email tidak valid.");
  if (!API_KEY) return m.reply("❌ Fitur AMPREM belum dikonfigurasi.");

  const key = sessionKey(m);
  if (sessions.has(key)) return m.reply("⏳ Kamu masih punya proses AMPREM yang sedang menunggu link verifikasi. Reply proses tersebut dengan link verifikasinya atau tunggu sampai sesi kedaluwarsa.");

  await m.react("⏳");
  try {
    await apiPost("send-magiclink", { email });
    sessions.set(key, { email, createdAt: Date.now(), stage: "waiting_link" });
    await m.react("✅");
    return m.reply(`✅ *LINK VERIFIKASI TERKIRIM*\n\n📧 Email: *${email}*\n\nSilakan cek email dari *noreply*.\nKalau tidak ada di Inbox, coba cek folder *Spam/Junk*.\n\nJika sudah menerima email, *reply pesan ini* dengan full link verifikasinya.\n\n⏱️ Sesi berlaku selama 10 menit.`);
  } catch (error) {
    await m.react("❌");
    return m.reply(`❌ *GAGAL MENGIRIM LINK*\n\n> ${error.message || "Terjadi kesalahan pada API."}`);
  }
}

async function replyHandler(m) {
  const key = sessionKey(m);
  const session = sessions.get(key);
  if (!session || session.stage !== "waiting_link") return false;

  if (Date.now() - session.createdAt > SESSION_TTL) {
    sessions.delete(key);
    await m.reply(`⌛ Sesi AMPREM sudah kedaluwarsa. Silakan ketik ".amprem email" lagi.`);
    return true;
  }
  if (!m.quoted?.id && !m.quoted?.key?.id) return false;

  const link = m.body?.trim();
  if (!link || !validLink(link)) {
    await m.reply("❌ Link verifikasi tidak valid.\n\nKirim *full URL verifikasi* dari email dengan cara reply pesan AMPREM sebelumnya.");
    return true;
  }

  await m.react("⏳");
  try {
    const verify = await apiPost("verify-account", { email: session.email, rawLink: link });
    const idToken = verify?.idToken || verify?.data?.idToken || verify?.result?.idToken;
    if (!idToken) throw new Error(verify?.message || "Verifikasi tidak mengembalikan idToken. Proses dihentikan.");

    await apiPost("apply-premium", { email: session.email, idToken });
    sessions.delete(key);
    await m.react("✅");
    return m.reply(`✅ *PROSES SELESAI*\n\n📧 Email: *${session.email}*\n✨ Status: *Premium berhasil diproses*\n\nDone ya kak ✅`);
  } catch (error) {
    sessions.delete(key);
    await m.react("❌");
    return m.reply(`❌ *PROSES GAGAL*\n\n> ${error.message || "Terjadi kesalahan pada API."}\n\nKalau link sudah benar tetapi tetap gagal, jalankan kembali *${m.prefix}amprem email* untuk membuat sesi baru.`);
  }
}

export { pluginConfig as config, handler, replyHandler as ampremReplyHandler };
