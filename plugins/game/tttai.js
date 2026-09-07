const pluginConfig = {
  name: "tttai",
  alias: ["xoai", "tictactoeai"],
  category: "game",
  description: "Tic-Tac-Toe melawan AI dengan 4 tingkat kesulitan",
  usage: ".tttai [pemula|terlatih|taktis|master|reset]",
  example: ".tttai taktis",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 1,
  energi: 0,
  isEnabled: true,
};

if (!global.tttAiGames) global.tttAiGames = new Map();
if (!global.tttAiBest) global.tttAiBest = new Map();
const wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const levels={pemula:"Pemula",terlatih:"Terlatih",taktis:"Taktis",master:"Master"};
const aliases={beginner:"pemula",easy:"pemula",trained:"terlatih",normal:"terlatih",tactical:"taktis",hard:"taktis",expert:"master"};
function winner(b){for(const [a,c,d] of wins)if(b[a]&&b[a]===b[c]&&b[a]===b[d])return b[a];return b.every(Boolean)?"draw":null;}
function moves(b){return b.map((v,i)=>v?null:i).filter(v=>v!==null);}
function rand(a){return a[Math.floor(Math.random()*a.length)];}
function immediate(b,p){for(const i of moves(b)){b[i]=p;if(winner(b)===p){b[i]=null;return i;}b[i]=null;}return null;}
function minimax(b,maximizing){const w=winner(b);if(w==="O")return 10;if(w==="X")return -10;if(w==="draw")return 0;const vals=[];for(const i of moves(b)){b[i]=maximizing?"O":"X";vals.push(minimax(b,!maximizing));b[i]=null;}return maximizing?Math.max(...vals):Math.min(...vals);}
function bestMove(b,level){const free=moves(b);if(!free.length)return null;if(level==="pemula")return rand(free);const win=immediate(b,"O");if(win!==null)return win;const block=immediate(b,"X");if(block!==null)return block;if(level==="terlatih")return rand(free);if(free.includes(4))return 4;if(level==="taktis")return rand(free.filter(i=>[0,2,6,8].includes(i)).length?free.filter(i=>[0,2,6,8].includes(i)):free);let best=-Infinity,choice=free[0];for(const i of free){b[i]="O";const s=minimax(b,false);b[i]=null;if(s>best){best=s;choice=i;}}return choice;}
function boardText(b){return `┌───┬───┬───┐\n│ ${b[0]||" "} │ ${b[1]||" "} │ ${b[2]||" "} │\n├───┼───┼───┤\n│ ${b[3]||" "} │ ${b[4]||" "} │ ${b[5]||" "} │\n├───┼───┼───┤\n│ ${b[6]||" "} │ ${b[7]||" "} │ ${b[8]||" "} │\n└───┴───┴───┘`;}
async function show(m,game,sock){
  const b=game.board.map((v,i)=>v? v : String(i+1));
  const result=winner(game.board);
  const best=global.tttAiBest.get(m.sender)||0;
  const text=["🎮 *TIC-TAC-TOE*",`Mode: *Lawan AI*`,`Tingkat: *${levels[game.level]}*`,`Skor kamu: *${game.score}*  •  Best: *${best}*`,``,boardText(b),``,result==="X"?"🏆 Kamu menang!":result==="O"?"🤖 AI menang!":result==="draw"?"🤝 Seri.":"Giliranmu — pilih kotak 1-9."] .join("\n");
  const buttons = result
    ? [["MAIN LAGI", ".tttai " + game.level], ["MASTER", ".tttai master"]]
    : Array.from({ length: 9 }, (_, i) => [String(i + 1), ".tttai " + (i + 1)]);
  if (sock?.relayMessage) {
    return sock.relayMessage(m.chat, {
      viewOnceMessage: { message: { messageContextInfo: {}, interactiveMessage: {
        body: { text: text + `\n\n*Tingkat:* ${["pemula","terlatih","taktis","master"].map(x=>`${x===game.level?"•":"○"} ${x}`).join(" | ")}` },
        footer: { text: "Pilih kotak 1-9 untuk bermain" },
        nativeFlowMessage: { buttons: buttons.map(([display_text,id]) => ({ name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text, id }) })) }
      } } }
    }, {});
  }
  return m.reply(text);
}
async function handler(m,{sock}){
  const args=m.args||[];let action=String(args[0]||"").toLowerCase();action=aliases[action]||action;
  if(action==="reset"||action==="stop"){global.tttAiGames.delete(m.chat);return m.reply("Game Tic-Tac-Toe AI dihentikan.");}
  let game=global.tttAiGames.get(m.chat);
  if(!game || levels[action]){game={board:Array(9).fill(null),level:levels[action]?action:"taktis",score:0};global.tttAiGames.set(m.chat,game);return show(m,game,sock);}
  const pos=Number(action)-1;if(!Number.isInteger(pos)||pos<0||pos>8||game.board[pos])return show(m,game,sock);
  game.board[pos]="X";let w=winner(game.board);if(w){if(w==="X"){game.score++;global.tttAiBest.set(m.sender,Math.max(global.tttAiBest.get(m.sender)||0,game.score));}return show(m,game,sock);}
  const ai=bestMove(game.board,game.level);if(ai!==null)game.board[ai]="O";w=winner(game.board);if(w==="O")game.score=0;return show(m,game,sock);
}
export { pluginConfig as config, handler };
