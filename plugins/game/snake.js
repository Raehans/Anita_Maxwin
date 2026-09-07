import { createCanvas } from "@napi-rs/canvas";
import { prepareWAMessageMedia } from "anita-baileys";

const pluginConfig = {
  name: "snake",
  alias: ["ular"],
  category: "game",
  description: "Game Snake klasik dengan kontrol tombol",
  usage: ".snake [start|up|down|left|right|stop]",
  example: ".snake",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 1,
  energi: 0,
  isEnabled: true,
};

const COLS = 15;
const ROWS = 15;
const CELL = 24;
const PAD = 24;
const BOARD = COLS * CELL;
const WIDTH = BOARD + PAD * 2;
const HEIGHT = BOARD + PAD * 2;
const GAME_TIMEOUT = 10 * 60 * 1000;

if (!global.snakeGames) global.snakeGames = new Map();
if (!global.snakeBestScores) global.snakeBestScores = new Map();

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function keyOf(p) {
  return `${p.x},${p.y}`;
}

function randomFood(snake) {
  const occupied = new Set(snake.map(keyOf));
  const free = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  return free.length ? free[Math.floor(Math.random() * free.length)] : null;
}

function newGame() {
  const snake = [
    { x: 5, y: 7 },
    { x: 4, y: 7 },
    { x: 3, y: 7 },
  ];
  return {
    snake,
    direction: { ...DIRECTIONS.right },
    nextDirection: { ...DIRECTIONS.right },
    food: randomFood(snake),
    score: 0,
    startedAt: Date.now(),
    lastMove: Date.now(),
    status: "playing",
  };
}

function drawGrid(ctx) {
  ctx.fillStyle = "#101418";
  ctx.fillRect(PAD, PAD, BOARD, BOARD);

  ctx.strokeStyle = "#1c2329";
  ctx.lineWidth = 1;
  for (let x = 0; x <= COLS; x++) {
    const px = PAD + x * CELL + 0.5;
    ctx.beginPath();
    ctx.moveTo(px, PAD);
    ctx.lineTo(px, PAD + BOARD);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    const py = PAD + y * CELL + 0.5;
    ctx.beginPath();
    ctx.moveTo(PAD, py);
    ctx.lineTo(PAD + BOARD, py);
    ctx.stroke();
  }
}

function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawSnake(ctx, game) {
  game.snake.forEach((part, index) => {
    const x = PAD + part.x * CELL + 2;
    const y = PAD + part.y * CELL + 2;
    const size = CELL - 4;

    ctx.fillStyle = index === 0 ? "#5ce8c1" : "#4edbb5";
    roundedRect(ctx, x, y, size, size, 3);
    ctx.fill();

    if (index === 0) {
      ctx.fillStyle = "#14201e";
      const eyeX = game.direction.x === -1 ? x + 6 : game.direction.x === 1 ? x + size - 6 : x + size / 2;
      const eyeY = game.direction.y === -1 ? y + 6 : game.direction.y === 1 ? y + size - 6 : y + size / 2;
      const side = game.direction.x !== 0 ? 4 : 3;
      ctx.beginPath();
      ctx.arc(eyeX - (game.direction.y !== 0 ? 4 : 0), eyeY - (game.direction.x !== 0 ? 4 : 0), 1.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(eyeX + (game.direction.y !== 0 ? 4 : 0), eyeY + (game.direction.x !== 0 ? 4 : 0), 1.7, 0, Math.PI * 2);
      ctx.fill();
      void side;
    }
  });
}

function drawFood(ctx, food) {
  if (!food) return;
  const cx = PAD + food.x * CELL + CELL / 2;
  const cy = PAD + food.y * CELL + CELL / 2;
  ctx.fillStyle = "#ff626d";
  ctx.beginPath();
  ctx.arc(cx, cy, CELL * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ff8b92";
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 4, 3, 0, Math.PI * 2);
  ctx.fill();
}

function renderGame(game) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0b0f12";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawGrid(ctx);
  drawFood(ctx, game.food);
  drawSnake(ctx, game);

  return canvas.toBuffer("image/png");
}

function nextStep(game) {
  game.direction = { ...game.nextDirection };
  const head = game.snake[0];
  const next = {
    x: head.x + game.direction.x,
    y: head.y + game.direction.y,
  };

  if (next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS) {
    game.status = "over";
    return "wall";
  }

  const ate = game.food && next.x === game.food.x && next.y === game.food.y;
  const bodyToCheck = ate ? game.snake : game.snake.slice(0, -1);
  if (bodyToCheck.some((part) => part.x === next.x && part.y === next.y)) {
    game.status = "over";
    return "body";
  }

  game.snake.unshift(next);
  if (ate) {
    game.score++;
    game.food = randomFood(game.snake);
    if (!game.food) game.status = "won";
  } else {
    game.snake.pop();
  }
  game.lastMove = Date.now();
  return ate ? "food" : "move";
}

function setDirection(game, name) {
  const dir = DIRECTIONS[name];
  if (!dir) return false;
  if (dir.x === -game.direction.x && dir.y === -game.direction.y) return false;
  game.nextDirection = { ...dir };
  return true;
}

function cleanup(chat) {
  const game = global.snakeGames.get(chat);
  if (game?.timer) clearTimeout(game.timer);
  global.snakeGames.delete(chat);
}

function scheduleCleanup(chat) {
  const game = global.snakeGames.get(chat);
  if (!game) return;
  if (game.timer) clearTimeout(game.timer);
  game.timer = setTimeout(() => cleanup(chat), GAME_TIMEOUT);
}

async function sendBoard(sock, m, game, statusText = "") {
  const image = renderGame(game);
  const media = await prepareWAMessageMedia(
    { image },
    { upload: sock.waUploadToServer },
  );

  const best = global.snakeBestScores.get(m.sender) || 0;
  const body = [
    "🐍 *SNAKE*",
    "",
    `Panjang ular: *${game.snake.length}*`,
    `Skor: *${game.score}*`,
    `Best: *${Math.max(best, game.score)}*`,
    statusText,
  ].filter(Boolean).join("\n");

  const buttons = game.status === "playing"
    ? [
        ["↑", ".snake up"],
        ["←", ".snake left"],
        ["↓", ".snake down"],
        ["→", ".snake right"],
      ]
    : [
        ["MAIN LAGI", ".snake"],
        ["STOP", ".snake stop"],
      ];

  const message = {
    viewOnceMessage: {
      message: {
        messageContextInfo: {},
        interactiveMessage: {
          header: {
            title: "SNAKE",
            subtitle: "Game Ular",
            hasMediaAttachment: true,
            imageMessage: media.imageMessage,
          },
          body: { text: body },
          footer: { text: "Gunakan tombol untuk menggerakkan ular" },
          nativeFlowMessage: {
            buttons: buttons.map(([display_text, id]) => ({
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({ display_text, id }),
            })),
          },
        },
      },
    },
  };

  await sock.relayMessage(m.chat, message, {});
}

async function handler(m, { sock }) {
  const args = m.args || [];
  const action = String(args[0] || "start").toLowerCase();
  const games = global.snakeGames;

  if (action === "stop" || action === "quit" || action === "exit") {
    if (!games.has(m.chat)) return m.reply("Tidak ada game Snake yang aktif.");
    cleanup(m.chat);
    return m.reply("Game Snake dihentikan.");
  }

  let game = games.get(m.chat);

  if (action === "start" || action === "new" || !game) {
    if (game && action !== "start" && action !== "new") {
      return sendBoard(sock, m, game);
    }
    cleanup(m.chat);
    game = newGame();
    games.set(m.chat, game);
    scheduleCleanup(m.chat);
    await m.react("🐍");
    return sendBoard(sock, m, game, "Pilih arah untuk mulai bermain.");
  }

  if (game.status !== "playing") {
    return sendBoard(sock, m, game, `Game selesai. Skor akhir: *${game.score}*`);
  }

  if (!(action in DIRECTIONS)) {
    return sendBoard(sock, m, game, "Pilih tombol arah di bawah.");
  }

  setDirection(game, action);
  const result = nextStep(game);

  if (result === "food") await m.react("🍎");

  if (game.status === "over" || game.status === "won") {
    const best = global.snakeBestScores.get(m.sender) || 0;
    if (game.score > best) global.snakeBestScores.set(m.sender, game.score);
    const text = game.status === "won"
      ? "🏆 Semua makanan berhasil dimakan!"
      : "💥 Ular menabrak dan game selesai.";
    return sendBoard(sock, m, game, `${text}\nSkor akhir: *${game.score}*`);
  }

  scheduleCleanup(m.chat);
  return sendBoard(sock, m, game);
}

export { pluginConfig as config, handler };
