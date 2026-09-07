import { createCanvas } from "@napi-rs/canvas";
import { prepareWAMessageMedia } from "anita-baileys";

const pluginConfig = {
  name: "tetri",
  alias: ["tetris"],
  category: "game",
  description: "Game blok ala Tetris dengan kontrol interaktif",
  usage: ".tetri [left|right|rotate|down|drop|pause|stop]",
  example: ".tetri",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 1,
  energi: 0,
  isEnabled: true,
};

const W = 10, H = 20, CELL = 25, PAD = 18;
const WIDTH = W * CELL + PAD * 2;
const HEIGHT = H * CELL + PAD * 2;
const COLORS = ["#5ce8c1", "#5ca8ff", "#ffb454", "#ff626d", "#c98cff", "#4edbb5", "#ffe06a"];
const SHAPES = [
  [[1,1,1,1]],
  [[1,0,0],[1,1,1]],
  [[0,0,1],[1,1,1]],
  [[1,1],[1,1]],
  [[0,1,1],[1,1,0]],
  [[0,1,0],[1,1,1]],
  [[1,1,0],[0,1,1]],
];

if (!global.tetriGames) global.tetriGames = new Map();
if (!global.tetriBestScores) global.tetriBestScores = new Map();

const clone = (x) => x.map((row) => [...row]);
const emptyBoard = () => Array.from({ length: H }, () => Array(W).fill(0));
function randomPiece() {
  const id = Math.floor(Math.random() * SHAPES.length);
  return { id, shape: clone(SHAPES[id]), x: Math.floor(W / 2) - 1, y: 0 };
}
function rotate(shape) {
  const out = Array.from({ length: shape[0].length }, () => Array(shape.length).fill(0));
  for (let y = 0; y < shape.length; y++) for (let x = 0; x < shape[y].length; x++) out[x][shape.length - 1 - y] = shape[y][x];
  return out;
}
function collides(game, shape = game.piece.shape, x = game.piece.x, y = game.piece.y) {
  for (let py = 0; py < shape.length; py++) for (let px = 0; px < shape[py].length; px++) if (shape[py][px]) {
    const bx = x + px, by = y + py;
    if (bx < 0 || bx >= W || by >= H || (by >= 0 && game.board[by][bx])) return true;
  }
  return false;
}
function merge(game) {
  const { shape, x, y, id } = game.piece;
  for (let py = 0; py < shape.length; py++) for (let px = 0; px < shape[py].length; px++) if (shape[py][px] && y + py >= 0) game.board[y + py][x + px] = id + 1;
}
function clearLines(game) {
  let lines = 0;
  game.board = game.board.filter((row) => {
    const full = row.every(Boolean);
    if (full) lines++;
    return !full;
  });
  while (game.board.length < H) game.board.unshift(Array(W).fill(0));
  const points = [0, 100, 300, 500, 800][lines] || 0;
  game.lines += lines;
  game.score += points * Math.max(1, game.level);
}
function spawn(game) {
  game.piece = game.next;
  game.next = randomPiece();
  game.piece.x = Math.floor(W / 2) - Math.ceil(game.piece.shape[0].length / 2);
  game.piece.y = 0;
  if (collides(game)) game.status = "over";
}
function lock(game) { merge(game); clearLines(game); game.level = 1 + Math.floor(game.lines / 10); spawn(game); }
function stepDown(game) { if (!collides(game, game.piece.shape, game.piece.x, game.piece.y + 1)) { game.piece.y++; return true; } lock(game); return false; }
function hardDrop(game) { let d = 0; while (!collides(game, game.piece.shape, game.piece.x, game.piece.y + 1)) { game.piece.y++; d++; } game.score += d * 2; lock(game); }
function newGame() { return { board: emptyBoard(), piece: randomPiece(), next: randomPiece(), score: 0, lines: 0, level: 1, status: "playing", paused: false, startedAt: Date.now() }; }

function rounded(ctx, x, y, w, h, r = 4) { const a = Math.min(r, w/2, h/2); ctx.beginPath(); ctx.moveTo(x+a,y); ctx.arcTo(x+w,y,x+w,y+h,a); ctx.arcTo(x+w,y+h,x,y+h,a); ctx.arcTo(x,y+h,x,y,a); ctx.arcTo(x,y,x+w,y,a); ctx.closePath(); }
function drawCell(ctx, x, y, value, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = value ? COLORS[value - 1] : "#172027";
  rounded(ctx, PAD + x * CELL + 2, PAD + y * CELL + 2, CELL - 4, CELL - 4, 4); ctx.fill();
  ctx.globalAlpha = 1;
}
function render(game) {
  const canvas = createCanvas(WIDTH, HEIGHT), ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0b0f12"; ctx.fillRect(0,0,WIDTH,HEIGHT);
  ctx.fillStyle = "#10161b"; ctx.fillRect(PAD,PAD,W*CELL,H*CELL);
  ctx.strokeStyle = "#202a31"; ctx.lineWidth = 1;
  for(let x=0;x<=W;x++){ctx.beginPath();ctx.moveTo(PAD+x*CELL+.5,PAD);ctx.lineTo(PAD+x*CELL+.5,PAD+H*CELL);ctx.stroke();}
  for(let y=0;y<=H;y++){ctx.beginPath();ctx.moveTo(PAD,PAD+y*CELL+.5);ctx.lineTo(PAD+W*CELL,PAD+y*CELL+.5);ctx.stroke();}
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(game.board[y][x]) drawCell(ctx,x,y,game.board[y][x]);
  if(game.status === "playing") for(let y=0;y<game.piece.shape.length;y++) for(let x=0;x<game.piece.shape[y].length;x++) if(game.piece.shape[y][x]) drawCell(ctx,game.piece.x+x,game.piece.y+y,game.piece.id+1);
  return canvas.toBuffer("image/png");
}
async function sendBoard(sock,m,game,status="") {
  const media = await prepareWAMessageMedia({ image: render(game) }, { upload: sock.waUploadToServer });
  const best = Math.max(global.tetriBestScores.get(m.sender) || 0, game.score);
  const body = [
    "🧱 *TETRI*", `Skor: *${game.score}*`, `Best: *${best}*`, `Level: *${game.level}*  •  Garis: *${game.lines}*`,
    status || (game.paused ? "Game dijeda." : "Gunakan tombol untuk menggerakkan blok."),
  ].join("\n");
  const buttons = game.status === "over"
    ? [["MAIN LAGI", ".tetri"], ["STOP", ".tetri stop"]]
    : [["←", ".tetri left"], ["↻", ".tetri rotate"], ["→", ".tetri right"], ["↓", ".tetri down"], ["JATUHKAN", ".tetri drop"], [game.paused ? "LANJUT" : "JEDA", ".tetri pause"]];
  await sock.relayMessage(m.chat,{viewOnceMessage:{message:{messageContextInfo:{},interactiveMessage:{header:{title:"TETRI",subtitle:"Block Puzzle",hasMediaAttachment:true,imageMessage:media.imageMessage},body:{text:body},footer:{text:"Tombol tersedia di bawah"},nativeFlowMessage:{buttons:buttons.map(([display_text,id])=>({name:"quick_reply",buttonParamsJson:JSON.stringify({display_text,id})}))}}}}},{ });
}
async function handler(m,{sock}) {
  const action=String((m.args||[])[0]||"start").toLowerCase();
  if(action === "stop" || action === "quit") { global.tetriGames.delete(m.chat); return m.reply("Game Tetri dihentikan."); }
  let game=global.tetriGames.get(m.chat);
  if(!game || action === "start" || action === "new") { game=newGame(); global.tetriGames.set(m.chat,game); return sendBoard(sock,m,game,"Pilih tombol untuk mulai."); }
  if(game.status === "over") { global.tetriBestScores.set(m.sender,Math.max(global.tetriBestScores.get(m.sender)||0,game.score)); return sendBoard(sock,m,game,"Game selesai. Tekan MAIN LAGI untuk bermain lagi."); }
  if(action === "pause") { game.paused=!game.paused; return sendBoard(sock,m,game); }
  if(game.paused) return sendBoard(sock,m,game,"Game sedang dijeda. Tekan LANJUT.");
  if(action === "left" && !collides(game,game.piece.shape,game.piece.x-1,game.piece.y)) game.piece.x--;
  else if(action === "right" && !collides(game,game.piece.shape,game.piece.x+1,game.piece.y)) game.piece.x++;
  else if(action === "down") stepDown(game);
  else if(action === "drop") hardDrop(game);
  else if(action === "rotate") { const r=rotate(game.piece.shape); if(!collides(game,r,game.piece.x,game.piece.y)) game.piece.shape=r; else if(!collides(game,r,game.piece.x-1,game.piece.y)){game.piece.x--;game.piece.shape=r;} else if(!collides(game,r,game.piece.x+1,game.piece.y)){game.piece.x++;game.piece.shape=r;} }
  else return sendBoard(sock,m,game,"Pilih kontrol yang tersedia.");
  if(game.status === "over") global.tetriBestScores.set(m.sender,Math.max(global.tetriBestScores.get(m.sender)||0,game.score));
  return sendBoard(sock,m,game);
}
export { pluginConfig as config, handler };
