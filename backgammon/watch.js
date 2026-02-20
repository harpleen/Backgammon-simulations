
const fs = require("fs");
const { TDAgent } = require("./td_agent");
const { Backgammon } = require("./backgammon");

const SAVE_FILE = "td-gammon-weights.json";

if (!fs.existsSync(SAVE_FILE)) {
  console.log(`No weights file found (${SAVE_FILE}). Train first with: node train.js`);
  process.exit(1);
}

let agent = new TDAgent(40);
let data = JSON.parse(fs.readFileSync(SAVE_FILE, "utf-8"));
agent.importWeights(data);
console.log(`Loaded agent trained on ${agent.gamesPlayed} games`);

console.log("\nAI (Player 1 / W) vs Random (Player 2 / B)\n");

let game = new Backgammon();
let turnNumber = 0;

game.printBoard();

while (!game.isGameOver() && turnNumber < 500) {
  turnNumber++;
  let dice = game.rollDice();
  let legalTurns = game.getAllLegalTurns(dice);

  let playerName = game.currentPlayer === 1 ? "AI (W)" : "Random (B)";
  console.log(`Turn ${turnNumber}: ${playerName} rolls [${dice[0]}, ${dice[1]}]`);

  if (legalTurns.length === 0 || (legalTurns.length === 1 && legalTurns[0].length === 0)) {
    console.log("  No legal moves — skipped");
    game.currentPlayer *= -1;
    continue;
  }

  // AI chooses the best move, random chooses randomly
  let chosenTurn;
  if (game.currentPlayer === 1) {
    chosenTurn = agent.chooseBestTurn(legalTurns, game, dice);
    let evaluation = agent.evaluate(game);
    console.log(`  AI evaluation: ${(eval * 100).toFixed(1)}% confidence`);
  } else {
    chosenTurn = legalTurns[Math.floor(Math.random() * legalTurns.length)];
  }

  // Show the moves
  for (let move of chosenTurn) {
    let from = move.from === "bar" ? "BAR" : `point ${move.from + 1}`;
    let to = move.to === "off" ? "OFF" : `point ${move.to + 1}`;
    console.log(`  ${from} → ${to}`);
  }

  // Execute
  for (let move of chosenTurn) {
    game.executeMove(move, game.currentPlayer);
  }
  game.currentPlayer *= -1;

  // Show board every 10 turns
  if (turnNumber % 10 === 0) {
    game.printBoard();
  }

  console.log("");
}

game.printBoard();
console.log("═".repeat(50));

let winner = game.getWinner();
if (winner === 1) {
  console.log("🏆 AI (Player 1) wins!");
} else if (winner === -1) {
  console.log(" Random (Player 2) wins!");
} else {
  console.log("Game did not finish in time.");
}

console.log(`  Completed in ${turnNumber} turns`);
console.log(`  P1 borne off: ${game.borneOff[0]}, P2 borne off: ${game.borneOff[1]}`);
console.log("═".repeat(50));

console.log("\n Quick benchmark (100 games vs random)...");
let result = agent.evaluateAgainstRandom(100);
console.log(`  Win rate: ${result.winRate.toFixed(1)}% (${result.wins}/${result.total})\n`);