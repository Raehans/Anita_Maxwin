export const FEATURE_CREDIT = "Fitur By: Anita Putri Azzahra\nFitur SC Bot Ryo Yamada MD 👑\nTiktok: https://tiktok.com/@anita.putri.azzah1\nSaluran Resmi: ";

import process from "node:process";

export const config = {
  name: "bypass",
  alias: ["linkbypass", "unlocklink", "bypasser"],
  category: "tools",
  description: "Membuka/melewati tautan terpendek atau linkvertise",
  usage: ".bypass <url>",
  example: ".bypass https://linkvertise.com/...",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 1,
  isEnabled: true,
};

const API = "https://trw.lat/api/bypass";
const API_KEY = "TRW_FREE-GAY-15a92945-9b04-4c75-8337-f2a6007281e9";

function parseResult(result) {
  if (typeof result !== "string") return result;

  const tupleMatch = result.match(/^\(['"](.+?)['"],\s*(True|False)\)$/);
  if (tupleMatch) return tupleMatch[1];

  const quoteMatch = result.match(/^["'](.+?)["']$/);
  if (quoteMatch) return quoteMatch[1];

  return result;
}

export async function handler(m, { text, usedPrefix, prefix, command, sock, conn }) {
  const pfx = usedPrefix || prefix || '/';

  // Ambil URL dari argumen teks atau dari pesan yang di-reply
  let targetUrl = text?.trim();

  if (!targetUrl && m.quoted?.text) {
    // Ekstrak URL dari pesan yang di-reply jika ada
    const match = m.quoted.text.match(/https?:\/\/[^\s]+/);
    if (match) targetUrl = match[0];
  }

  if (!targetUrl) {
    return m.reply(
      `*Format salah!*\n\n` +
      `📌 *Cara Penggunaan:*\n` +
      `${pfx}${command} <url_linkvertise_atau_shortener>\n\n` +
      `_Contoh:_ ${pfx}${command} https://linkvertise.com/519136/resource-pack-hd`
    );
  }

  // Cari pola URL menggunakan Regex sederhana
  const urlMatch = targetUrl.match(/https?:\/\/[^\s]+/);
  if (!urlMatch) {
    return m.reply(`❌ URL tidak valid. Pastikan menyertakan http:// atau https://`);
  }

  const cleanUrl = urlMatch[0];

  await m.react('⏳');

  try {
    const apiUrl = new URL(API);
    apiUrl.searchParams.set("apikey", API_KEY);
    apiUrl.searchParams.set("url", cleanUrl);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "accept": "*/*",
        "origin": "https://bypassunlock.com",
        "referer": "https://bypassunlock.com/",
        "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36",
        "sec-ch-ua": "\"Google Chrome\";v=\"147\", \"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"147\"",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "sec-fetch-site": "cross-site",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        "accept-language": "id-ID,id;q=0.9",
        "priority": "u=1, i"
      }
    });

    const rawText = await response.text();
    let data;

    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error(`Server melempar respons non-JSON (${response.status})`);
    }

    if (!response.ok || !data.success || !data.result) {
      throw new Error(data.message || data.error || "Gagal melakukan bypass link.");
    }

    const finalUrl = parseResult(data.result);

    let caption = `🔗 *LINK BYPASS RESULT*\n\n`;
    caption += `📥 *Link Asli:*\n${cleanUrl}\n\n`;
    caption += `📤 *Link Hasil Bypass:*\n${finalUrl}`;

    await m.reply(caption.trim());
    await m.react('✅');

  } catch (err) {
    console.error(err);
    await m.react('❌');
    m.reply(`❌ *Terjadi Kesalahan:*\n${err.message || String(err)}`);
  }
}
