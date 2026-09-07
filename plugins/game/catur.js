import { createCanvas } from "@napi-rs/canvas";
import { prepareWAMessageMedia } from "anita-baileys";

const pluginConfig = {
  name: "catur",
  alias: ["chess"],
  category: "game",
  description: "Catur user vs bot AI",
  usage: ".catur [e2e4|new|stop]",
  example: ".catur e2e4",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 1,
  energi: 0,
  isEnabled: true,
};

if (!global.chessGames) global.chessGames = new Map();
if (!global.chessBest) global.chessBest = new Map();

const W = 760, H = 920, SQ = 86, BX = 36, BY = 120;
const WHITE = "w", BLACK = "b";
const PIECES = { K:"♔", Q:"♕", R:"♖", B:"♗", N:"♘", P:"♙", k:"♚", q:"♛", r:"♜", b:"♝", n:"♞", p:"♟" };
const VALUES = { p:100, n:320, b:330, r:500, q:900, k:20000 };

function initialBoard() {
  return [
    ["r","n","b","q","k","b","n","r"],
    ["p","p","p","p","p","p","p","p"],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    ["P","P","P","P","P","P","P","P"],
    ["R","N","B","Q","K","B","N","R"],
  ];
}
function color(piece) { return piece && piece === piece.toUpperCase() ? WHITE : BLACK; }
function cloneBoard(b) { return b.map(r => r.slice()); }
function inside(r,c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
function algebraic(r,c) { return String.fromCharCode(97 + c) + (8 - r); }
function parseSquare(s) { if (!/^[a-h][1-8]$/.test(s)) return null; return [8 - Number(s[1]), s.charCodeAt(0)-97]; }
function moveText(mv) { return `${algebraic(mv.r,mv.c)}${algebraic(mv.tr,mv.tc)}` + (mv.promo || ""); }

function pseudoMoves(board, side) {
  const out = [];
  const add = (r,c,tr,tc,promo=null) => {
    if (!inside(tr,tc)) return;
    const target = board[tr][tc];
    if (target && color(target) === side) return;
    out.push({r,c,tr,tc,promo});
  };
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    const p=board[r][c]; if (!p || color(p)!==side) continue;
    const t=p.toLowerCase();
    if (t === "p") {
      const d=side===WHITE?-1:1, start=side===WHITE?6:1, promoRank=side===WHITE?0:7;
      if (inside(r+d,c) && !board[r+d][c]) { add(r,c,r+d,c,r+d===promoRank?"q":null); if(r===start&&!board[r+2*d][c]) add(r,c,r+2*d,c); }
      for (const dc of [-1,1]) if (inside(r+d,c+dc) && board[r+d][c+dc] && color(board[r+d][c+dc])!==side) add(r,c,r+d,c+dc,r+d===promoRank?"q":null);
    } else if (t === "n") {
      for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) add(r,c,r+dr,c+dc);
    } else if (t === "k") {
      for (const [dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) add(r,c,r+dr,c+dc);
    } else {
      const dirs = t === "b" ? [[-1,-1],[-1,1],[1,-1],[1,1]] : t === "r" ? [[-1,0],[1,0],[0,-1],[0,1]] : [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]];
      for (const [dr,dc] of dirs) for (let tr=r+dr,tc=c+dc; inside(tr,tc); tr+=dr,tc+=dc) {
        if (!board[tr][tc]) add(r,c,tr,tc); else { add(r,c,tr,tc); break; }
      }
    }
  }
  return out;
}

function findKing(board, side) { for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c]=== (side===WHITE?"K":"k"))return [r,c]; return null; }
function attacked(board, r,c, bySide) {
  for (const mv of pseudoMoves(board, bySide)) if (mv.tr===r && mv.tc===c) return true;
  return false;
}
function applyMove(board, mv, side) {
  const b=cloneBoard(board), p=b[mv.r][mv.c]; b[mv.r][mv.c]=null; let q=p;
  if (mv.promo) q=side===WHITE?mv.promo.toUpperCase():mv.promo.toLowerCase();
  b[mv.tr][mv.tc]=q; return b;
}
function legalMoves(board, side) {
  return pseudoMoves(board,side).filter(mv => { const b=applyMove(board,mv,side); const k=findKing(b,side); return k && !attacked(b,k[0],k[1],side===WHITE?BLACK:WHITE); });
}
function gameState(board, side) { const moves=legalMoves(board,side); if(moves.length) return {over:false, check:false}; const k=findKing(board,side); return {over:true, check:k ? attacked(board,k[0],k[1],side===WHITE?BLACK:WHITE):true}; }
function score(board) { let s=0; for(const row of board)for(const p of row) if(p) s += (color(p)===BLACK?-1:1)*VALUES[p.toLowerCase()]; return s; }
function minimax(board, side, depth, alpha=-Infinity, beta=Infinity) {
  const moves=legalMoves(board,side); if(!depth||!moves.length) { const st=gameState(board,side); if(st.over&&st.check)return side===BLACK?999999:-999999; return score(board); }
  if(side===WHITE){ let best=-Infinity; for(const m of moves){best=Math.max(best,minimax(applyMove(board,m,side),BLACK,depth-1,alpha,beta));alpha=Math.max(alpha,best);if(beta<=alpha)break;} return best; }
  let best=Infinity; for(const m of moves){best=Math.min(best,minimax(applyMove(board,m,side),WHITE,depth-1,alpha,beta));beta=Math.min(beta,best);if(beta<=alpha)break;} return best;
}
function chooseAi(board) { const moves=legalMoves(board,BLACK); if(!moves.length)return null; let best=Infinity, choice=moves[0]; for(const m of moves){ const v=minimax(applyMove(board,m,BLACK),WHITE,2); if(v<best){best=v;choice=m;} } return choice; }

function render(g) {
  const c=createCanvas(W,H),ctx=c.getContext("2d"); ctx.fillStyle="#101418";ctx.fillRect(0,0,W,H);
  ctx.fillStyle="#fff";ctx.font="bold 34px sans-serif";ctx.fillText("CATUR • USER VS BOT AI",BX,54);
  ctx.font="22px sans-serif";ctx.fillText(`Kamu: Putih   •   Bot: Hitam   •   Menang: ${g.wins}`,BX,88);
  for(let r=0;r<8;r++)for(let col=0;col<8;col++){
    ctx.fillStyle=(r+col)%2===0?"#f0d9b5":"#b58863";ctx.fillRect(BX+col*SQ,BY+r*SQ,SQ,SQ);
    const p=g.board[r][col]; if(p){ctx.fillStyle=color(p)===WHITE?"#fff":"#181818";ctx.strokeStyle=color(p)===WHITE?"#222":"#ddd";ctx.lineWidth=2;ctx.font="62px serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.strokeText(PIECES[p],BX+col*SQ+SQ/2,BY+r*SQ+SQ/2+2);ctx.fillText(PIECES[p],BX+col*SQ+SQ/2,BY+r*SQ+SQ/2+2);}
  }
  ctx.textAlign="left";ctx.textBaseline="alphabetic";ctx.font="21px sans-serif";ctx.fillStyle="#dce6ee";ctx.fillText(g.statusText||"Ketik langkah seperti e2e4",BX,BY+8*SQ+46); return c.toBuffer("image/png");
}

async function sendGame(sock,m,g,note=""){
  g.statusText=note; const media=await prepareWAMessageMedia({image:render(g)},{upload:sock.waUploadToServer});
  const body=["♟️ *CATUR — USER VS BOT AI*","Kamu = *Putih*  •  Bot = *Hitam*",note||"Ketik langkah seperti `.catur e2e4`.","",`Menang kamu: *${g.wins}*  •  Best: *${global.chessBest.get(m.sender)||g.wins}*`].join("\n");
  const buttons=[["MULAI BARU",".catur new"],["STOP",".catur stop"]];
  await sock.relayMessage(m.chat,{viewOnceMessage:{message:{messageContextInfo:{},interactiveMessage:{header:{title:"CATUR",subtitle:"User vs Bot AI",hasMediaAttachment:true,imageMessage:media.imageMessage},body:{text:body},footer:{text:"Masukkan langkah dalam format e2e4"},nativeFlowMessage:{buttons:buttons.map(([display_text,id])=>({name:"quick_reply",buttonParamsJson:JSON.stringify({display_text,id})}))}}}}},{})
}

function reset(chat){global.chessGames.delete(chat);}
async function handler(m,{sock}){
  const arg=String(m.args?.[0]||"new").toLowerCase();
  if(["stop","quit","exit"].includes(arg)){if(!global.chessGames.has(m.chat))return m.reply("Tidak ada game catur yang aktif.");reset(m.chat);return m.reply("Game catur dihentikan.");}
  if(arg==="new"||!global.chessGames.has(m.chat)){const g={board:initialBoard(),turn:WHITE,status:"playing",wins:0,statusText:"Giliran kamu. Contoh: e2e4"};global.chessGames.set(m.chat,g);return sendGame(sock,m,g);}
  const g=global.chessGames.get(m.chat); if(g.status!=="playing")return sendGame(sock,m,g,g.statusText);
  if(!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(arg))return sendGame(sock,m,g,"Format salah. Contoh langkah: e2e4 atau g1f3.");
  const from=parseSquare(arg.slice(0,2)),to=parseSquare(arg.slice(2,4)),promo=arg[4]||null;
  const legal=legalMoves(g.board,WHITE).find(x=>x.r===from[0]&&x.c===from[1]&&x.tr===to[0]&&x.tc===to[1]&&(!promo||x.promo===promo));
  if(!legal)return sendGame(sock,m,g,"Langkah itu tidak legal.");
  g.board=applyMove(g.board,legal,WHITE);let st=gameState(g.board,BLACK); if(st.over){g.status="over";g.wins+=st.check?1:0;global.chessBest.set(m.sender,Math.max(global.chessBest.get(m.sender)||0,g.wins));return sendGame(sock,m,g,st.check?"🏆 Skakmat! Kamu menang.":"🤝 Seri.");}
  const ai=chooseAi(g.board); if(ai)g.board=applyMove(g.board,ai,BLACK);
  st=gameState(g.board,WHITE); if(st.over){g.status="over";return sendGame(sock,m,g,st.check?"🤖 Skakmat! Bot menang.":"🤝 Seri.");}
  return sendGame(sock,m,g,`Bot memainkan *${moveText(ai)}*. Giliran kamu.`);
}

export { pluginConfig as config, handler };
