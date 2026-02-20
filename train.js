
const fs = require("fs");
const { TDAgent } = require("./td_agent.js");

const HIDDEN_SIZE = 80;         // Neurons in hidden layer
const LEARNING_RATE = 0.05;      // How aggressively to learn
const LAMBDA = 0.7;             // Eligibility trace decay

const TOTAL_GAMES = 5000000;      // Total training games 
const EVAL_EVERY = 2500;        // Evaluate against random every N games
const EVAL_GAMES = 200;         // Games per evaluation round
const SAVE_EVERY = 2500;        // Save weights every N games
const SAVE_FILE = "td-gammon-weights.json";

let agent = new TDAgent(HIDDEN_SIZE, LEARNING_RATE, LAMBDA);

if (fs.existsSync(SAVE_FILE)) {
  console.log(`Found existing weights in ${SAVE_FILE}, loading...`);
  let data = JSON.parse(fs.readFileSync(SAVE_FILE, "utf-8"));
  agent.importWeights(data);
  console.log(`  Resumed from game ${agent.gamesPlayed} (P1: ${agent.p1Wins}, P2: ${agent.p2Wins})`);
} else {
  console.log("No existing weights found, starting fresh.");
}

console.log("\n Pre-training evaluation...");
let preResult = agent.evaluateAgainstRandom(EVAL_GAMES);
console.log(`  Win rate vs random: ${preResult.winRate.toFixed(1)}% (${preResult.wins}/${preResult.total})`);

console.log(`\n Training for ${TOTAL_GAMES} games...`);
console.log(`  Hidden neurons: ${HIDDEN_SIZE}`);
console.log(`  Learning rate: ${LEARNING_RATE}`);
console.log(`  Lambda: ${LAMBDA}`);
console.log("═".repeat(60));

let startTime = Date.now();
let evalResults = [];

for (let i = 0; i < TOTAL_GAMES; i++) {
  agent.trainOneGame();

  // Progress update every 100 games
  if ((i + 1) % 100 === 0) {
    let elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    let gamesPerSec = ((i + 1) / (Date.now() - startTime) * 1000).toFixed(1);
    process.stdout.write(
      `\r  Game ${(i + 1).toString().padStart(6)}/${TOTAL_GAMES} | ` +
      `${elapsed}s elapsed | ${gamesPerSec} games/sec`
    );
  }

  // Evaluate against random player
  if ((i + 1) % EVAL_EVERY === 0) {
    let result = agent.evaluateAgainstRandom(EVAL_GAMES);
    evalResults.push({
      games: agent.gamesPlayed,
      winRate: result.winRate,
    });

    console.log(
      `\n Evaluation at game ${agent.gamesPlayed}: ` +
      `${result.winRate.toFixed(1)}% win rate vs random ` +
      `(${result.wins}/${result.total})`
    );
  }

  // Auto-save weights
  if ((i + 1) % SAVE_EVERY === 0) {
    fs.writeFileSync(SAVE_FILE, JSON.stringify(agent.exportWeights()));
    console.log(` Weights saved to ${SAVE_FILE}`);
  }
}


console.log("\n" + "═".repeat(60));
console.log("Final evaluation...");
let finalResult = agent.evaluateAgainstRandom(EVAL_GAMES);
console.log(`  Win rate vs random: ${finalResult.winRate.toFixed(1)}% (${finalResult.wins}/${finalResult.total})`);


fs.writeFileSync(SAVE_FILE, JSON.stringify(agent.exportWeights()));
console.log(`Final weights saved to ${SAVE_FILE}`);

let totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
console.log("\n" + "═".repeat(60));
console.log(" TRAINING SUMMARY");
console.log("═".repeat(60));
console.log(`  Total games trained: ${agent.gamesPlayed}`);
console.log(`  Total time: ${totalTime} minutes`);
console.log(`  Self-play results: P1 won ${agent.p1Wins}, P2 won ${agent.p2Wins}`);
console.log("");
console.log("  Progress vs random player:");
console.log("  ─────────────────────────────────────────────────");

for (let r of evalResults) {
  let bar = "".repeat(Math.round(r.winRate / 2));
  console.log(`  Game ${r.games.toString().padStart(6)}: ${r.winRate.toFixed(1).padStart(5)}% ${bar}`);
}
let barFinal = "".repeat(Math.round(finalResult.winRate / 2));
console.log(`   Final : ${finalResult.winRate.toFixed(1).padStart(5)}% ${barFinal}`);

console.log("\n  50% = random level | >55% = learning | >65% = solid");
console.log("═".repeat(60));
console.log("\nTo continue training, run this script again.");
console.log(`   It will load weights from ${SAVE_FILE} and resume.\n`);