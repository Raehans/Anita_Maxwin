import { createCanvas } from "@napi-rs/canvas";
import { prepareWAMessageMedia } from "anita-baileys";

const pluginConfig = {
  name: "pou",
  alias: ["pounaikawan", "pougame"],
  category: "game",
  description: "Game Pou Naik Awan",
  usage: ".pou [start|left|right|stop]",
  example: ".pou",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 1,
  energi: 0,
  isEnabled: true,
};

if (!global.pouGames) global.pouGames = new Map();
if (!global.pouBestScores) global.pouBestScores = new Map();

const W = 720;
const H = 980;
const GAME_TIMEOUT = 10 * 60 * 1000;

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function laneY(i) { return H - 150 - i * 125; }

function newGame() {
  const platforms = [];
  for (let i = 0; i < 8; i++) {
    platforms.push({ x: rand(60, 520), y: laneY(i), w: rand(115, 185), h: 18 });
  }
  return {
    x: W / 2 - 28,
    y: H - 215,
    w: 56,
    h: 56,
    vx: 0,
    vy: -15,
    camera: 0,
    score: 0,
    coins: 0,
    platforms,
    status: "playing",
    timer: null,
    updatedAt: Date.now(),
  };
}

function rounded(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawPou(ctx, g) {
  const x = g.x, y = g.y;
  ctx.fillStyle = "#b98a5c";
  ctx.strokeStyle = "#765536";
  ctx.lineWidth = 4;
  rounded(ctx, x, y, g.w, g.h, 22);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(x + 18, y + 21, 10, 0, Math.PI * 2); ctx.arc(x + 38, y + 21, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#111";
  ctx.beginPath(); ctx.arc(x + 19, y + 22, 4, 0, Math.PI * 2); ctx.arc(x + 39, y + 22, 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#6b4630"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x + 28, y + 35, 11, 0.2, Math.PI - 0.2); ctx.stroke();
}

function render(g) {
  const c = createCanvas(W, H);
  const ctx = c.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#ff9a16"); grad.addColorStop(1, "#ff2b77");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

  ctx.globalAlpha = 0.85;
  ctx.fillStyle = "#ffd7d7";
  for (const [cx, cy] of [[80, H - 230], [610, H - 390], [135, H - 610]]) {
    ctx.beginPath(); ctx.arc(cx, cy, 35, 0, Math.PI * 2); ctx.arc(cx + 35, cy - 13, 28, 0, Math.PI * 2); ctx.arc(cx + 70, cy, 34, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const p of g.platforms) {
    const py = p.y - g.camera;
    if (py < -30 || py > H + 30) continue;
    ctx.fillStyle = "#35d36d";
    rounded(ctx, p.x, py, p.w, p.h, 9); ctx.fill();
  }

  drawPou(ctx, g);
  ctx.fillStyle = "rgba(15,22,30,.82)";
  rounded(ctx, 22, 22, W - 44, 88, 20); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = "bold 31px sans-serif";
  ctx.fillText("POU NAIK AWAN", 46, 60);
  ctx.font = "24px sans-serif";
  ctx.fillText(`Skor  ${g.score}`, 46, 95);
  ctx.fillText(`Koin  ${g.coins}`, 250, 95);
  ctx.fillText(`Target  1500`, 455, 95);

  if (g.status === "over" || g.status === "won") {
    ctx.fillStyle = "rgba(5,10,14,.62)"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff"; ctx.textAlign = "center";
    ctx.font = "bold 58px sans-serif";
    ctx.fillText(g.status === "won" ? "TARGET TERCAPAI" : "GAME OVER", W / 2, H / 2 - 40);
    ctx.font = "31px sans-serif";
    ctx.fillText(`Skor akhir: ${g.score}`, W / 2, H / 2 + 20);
    ctx.textAlign = "left";
  }
  return c.toBuffer("image/png");
}

function step(g, direction) {
  if (g.status !== "playing") return;
  g.vx = direction === "left" ? -48 : direction === "right" ? 48 : 0;
  const oldBottom = g.y + g.h;
  g.x = clamp(g.x + g.vx, 24, W - g.w - 24);
  g.vy += 2.2;
  g.y += g.vy;

  if (g.vy > 0) {
    for (const p of g.platforms) {
      const py = p.y - g.camera;
      if (oldBottom <= py + 8 && g.y + g.h >= py && g.x + g.w > p.x && g.x < p.x + p.w) {
        g.y = py - g.h;
        g.vy = -15;
        g.score += 10;
        if (Math.random() < 0.25) g.coins += 1;
        break;
      }
    }
  }

  const targetY = H * 0.38;
  if (g.y < targetY) {
    const delta = targetY - g.y;
    g.y = targetY;
    g.camera += delta;
    for (const p of g.platforms) p.y += delta;
    const minY = Math.min(...g.platforms.map(p => p.y));
    while (minY + 100 > 0) {
      const highest = Math.min(...g.platforms.map(p => p.y));
      g.platforms.push({ x: rand(50, 520), y: highest - rand(95, 145), w: rand(115, 185), h: 18 });
      g.platforms.shift();
      if (g.platforms[0].y > H + 300) g.platforms.shift();
      if (g.score > 2000) break;
    }
  }

  if (g.y > H + 60) g.status = "over";
  if (g.score >= 1500) g.status = "won";
  g.updatedAt = Date.now();
}

function cleanup(chat) {
  const g = global.pouGames.get(chat);
  if (g?.timer) clearTimeout(g.timer);
  global.pouGames.delete(chat);
}

function schedule(chat) {
  const g = global.pouGames.get(chat);
  if (!g) return;
  if (g.timer) clearTimeout(g.timer);
  g.timer = setTimeout(() => cleanup(chat), GAME_TIMEOUT);
}

async function sendGame(sock, m, g, note = "") {
  const media = await prepareWAMessageMedia({ image: render(g) }, { upload: sock.waUploadToServer });
  const best = Math.max(global.pouBestScores.get(m.sender) || 0, g.score);
  const body = [
    "☁️ *POU NAIK AWAN*",
    `Skor: *${g.score}*  •  Koin: *${g.coins}*  •  Best: *${best}*`,
    note,
  ].filter(Boolean).join("\n");
  const buttons = g.status === "playing"
    ? [["← Kiri", ".pou left"], ["Kanan →", ".pou right"], ["STOP", ".pou stop"]]
    : [["MAIN LAGI", ".pou"], ["STOP", ".pou stop"]];
  await sock.relayMessage(m.chat, {
    viewOnceMessage: { message: { messageContextInfo: {}, interactiveMessage: {
      header: { title: "POU NAIK AWAN", subtitle: "Mini Game", hasMediaAttachment: true, imageMessage: media.imageMessage },
      body: { text: body }, footer: { text: "Tekan kiri/kanan untuk melompat antar awan" },
      nativeFlowMessage: { buttons: buttons.map(([display_text, id]) => ({ name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text, id }) })) }
    } } }
  }, {});
}

async function handler(m, { sock }) {
  const action = String(m.args?.[0] || "start").toLowerCase();
  if (["stop", "quit", "exit"].includes(action)) {
    if (!global.pouGames.has(m.chat)) return m.reply("Tidak ada game Pou yang aktif.");
    cleanup(m.chat); return m.reply("Game Pou dihentikan.");
  }
  let g = global.pouGames.get(m.chat);
  if (!g || ["start", "new"].includes(action)) {
    cleanup(m.chat); g = newGame(); global.pouGames.set(m.chat, g); schedule(m.chat);
    return sendGame(sock, m, g, "Pilih arah untuk mulai.");
  }
  if (!['left', 'right'].includes(action)) return sendGame(sock, m, g, "Gunakan tombol kiri/kanan.");
  step(g, action);
  if (g.status !== "playing") global.pouBestScores.set(m.sender, Math.max(global.pouBestScores.get(m.sender) || 0, g.score));
  schedule(m.chat);
  return sendGame(sock, m, g, g.status === "won" ? "🏆 Target 1500 tercapai!" : g.status === "over" ? "💥 Pou jatuh. Coba lagi!" : "");
}

export { pluginConfig as config, handler };
