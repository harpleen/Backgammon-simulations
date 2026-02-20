
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

console.log("\n AI (Player 1 / W) vs AI (Player 2 / B)\n");

let game = new Backgammon();
let turnNumber = 0;

game.printBoard();

while (!game.isGameOver() && turnNumber < 500) {
  turnNumber++;
  let dice = game.rollDice();
  let legalTurns = game.getAllLegalTurns(dice);

  let playerName = game.currentPlayer === 1 ? "AI P1 (W)" : "AI P2 (B)";
  console.log(`Turn ${turnNumber}: ${playerName} rolls [${dice[0]}, ${dice[1]}]`);

  if (legalTurns.length === 0 || (legalTurns.length === 1 && legalTurns[0].length === 0)) {
    console.log("  No legal moves — skipped");
    game.currentPlayer *= -1;
    continue;
  }

  let chosenTurn = agent.chooseBestTurn(legalTurns, game, dice);
  let evaluation = agent.evaluate(game);
  console.log(`  Evaluation: ${(evaluation * 100).toFixed(1)}% P1 win chance`);

  for (let move of chosenTurn) {
    let from = move.from === "bar" ? "BAR" : `point ${move.from + 1}`;
    let to = move.to === "off" ? "OFF" : `point ${move.to + 1}`;
    console.log(`  ${from} → ${to}`);
  }

  for (let move of chosenTurn) {
    game.executeMove(move, game.currentPlayer);
  }
  game.currentPlayer *= -1;

  if (turnNumber % 10 === 0) {
    game.printBoard();
  }

  console.log("");
}

game.printBoard();
console.log("═".repeat(50));

let winner = game.getWinner();
if (winner === 1) {
  console.log("🏆 AI Player 1 (W) wins!");
} else if (winner === -1) {
  console.log("🏆 AI Player 2 (B) wins!");
} else {
  console.log("Game did not finish in time.");
}

console.log(`  Completed in ${turnNumber} turns`);
console.log(`  P1 borne off: ${game.borneOff[0]}, P2 borne off: ${game.borneOff[1]}`);
console.log("═".repeat(50));

console.log("\nBenchmark: 500 games AI vs AI...");

let p1Wins = 0;
for (let i = 0; i < 500; i++) {
  let g = new Backgammon();
  let moves = 0;

  while (!g.isGameOver() && moves < 5000) {
    let d = g.rollDice();
    let turns = g.getAllLegalTurns(d);

    if (turns.length === 0 || (turns.length === 1 && turns[0].length === 0)) {
      g.currentPlayer *= -1;
      moves++;
      continue;
    }

    let chosen = agent.chooseBestTurn(turns, g, d);
    for (let move of chosen) {
      g.executeMove(move, g.currentPlayer);
    }
    g.currentPlayer *= -1;
    moves++;
  }

  if (g.getWinner() === 1) p1Wins++;
}

console.log(`  P1 wins: ${p1Wins}/500 (${(p1Wins / 5).toFixed(1)}%)`);
console.log(`  P2 wins: ${500 - p1Wins}/500 (${((500 - p1Wins) / 5).toFixed(1)}%)`);
console.log(`\n  Should be roughly 50/50 since both sides use the same brain.\n`);