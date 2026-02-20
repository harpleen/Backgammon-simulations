const { TDAgent } = require("./td_agent.js");
const { Backgammon } = require("./backgammon");
const { encodeBoard } = require("./encoder");

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function describe(suiteName, fn) {
  console.log(`\n${suiteName}`);
  console.log("─".repeat(50));
  fn();
}

function it(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`${name}`);
  } catch (error) {
    failedTests++;
    console.log(`${name}`);
    console.log(`     → ${error.message}`);
  }
}

function assertEqual(actual, expected, message = "") {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, got ${actual}${message ? " — " + message : ""}`);
  }
}

function assertTrue(condition, message = "") {
  if (!condition) {
    throw new Error(`Expected true, got false${message ? " — " + message : ""}`);
  }
}

function assertInRange(actual, min, max, message = "") {
  if (actual < min || actual > max) {
    throw new Error(`Expected value between ${min} and ${max}, got ${actual}${message ? " — " + message : ""}`);
  }
}

// Board Evaluation
describe("Board Evaluation", () => {
  it("should return a value between 0 and 1", () => {
    let agent = new TDAgent();
    let game = new Backgammon();
    assertInRange(agent.evaluate(game), 0, 1);
  });

  it("should return different values for different board states", () => {
    let agent = new TDAgent();
    let game1 = new Backgammon();
    let game2 = new Backgammon();
    game2.board = new Array(24).fill(0);
    game2.board[0] = 15;
    assertTrue(Math.abs(agent.evaluate(game1) - agent.evaluate(game2)) > 0.0001);
  });

  it("should be deterministic for the same board state", () => {
    let agent = new TDAgent();
    let game = new Backgammon();
    assertTrue(Math.abs(agent.evaluate(game) - agent.evaluate(game)) < 0.0000001);
  });
});

// Move Selection
describe("Move Selection", () => {
  it("should choose a legal turn from the available options", () => {
    let agent = new TDAgent();
    let game = new Backgammon();
    let legalTurns = game.getAllLegalTurns([3, 1]);
    let chosen = agent.chooseBestTurn(legalTurns, game, [3, 1]);
    let chosenStr = JSON.stringify(chosen);
    let isLegal = legalTurns.some((turn) => JSON.stringify(turn) === chosenStr);
    assertTrue(isLegal);
  });

  it("should handle single-move turns", () => {
    let agent = new TDAgent();
    let game = new Backgammon();
    game.board = new Array(24).fill(0);
    game.board[5] = 1;
    game.bar = [0, 0];
    let legalTurns = game.getAllLegalTurns([1, 2]);
    if (legalTurns.length > 0 && legalTurns[0].length > 0) {
      let chosen = agent.chooseBestTurn(legalTurns, game, [1, 2]);
      assertTrue(chosen !== null);
    }
  });

  it("should prefer winning moves when game is nearly over", () => {
    let agent = new TDAgent();
    let game = new Backgammon();
    game.board = new Array(24).fill(0);
    game.board[0] = 1;
    game.borneOff[0] = 14;
    game.currentPlayer = 1;
    let legalTurns = game.getAllLegalTurns([1, 2]);
    let bearOffTurn = legalTurns.find((turn) => turn.some((move) => move.to === "off"));
    if (bearOffTurn) {
      let chosen = agent.chooseBestTurn(legalTurns, game, [1, 2]);
      assertTrue(chosen.some((move) => move.to === "off"));
    }
  });
});

// Eligibility Traces
describe("Eligibility Traces", () => {
  it("should initialise traces to all zeros", () => {
    let agent = new TDAgent(10);
    agent.initTraces();
    for (let i = 0; i < agent.traces.length; i++) {
      for (let j = 0; j < agent.traces[i].length; j++) {
        for (let k = 0; k < agent.traces[i][j].weights.length; k++) {
          assertEqual(agent.traces[i][j].weights[k], 0);
        }
        assertEqual(agent.traces[i][j].bias, 0);
      }
    }
  });

  it("should have the same structure as the network", () => {
    let agent = new TDAgent(10);
    agent.initTraces();
    assertEqual(agent.traces.length, agent.network.layers.length);
    for (let i = 0; i < agent.traces.length; i++) {
      assertEqual(agent.traces[i].length, agent.network.layers[i].length);
      for (let j = 0; j < agent.traces[i].length; j++) {
        assertEqual(agent.traces[i][j].weights.length, agent.network.layers[i][j].weights.length);
      }
    }
  });
});

// Gradient Computation
describe("Gradient Computation", () => {
  it("should produce gradients with the same shape as the network", () => {
    let agent = new TDAgent(10);
    let game = new Backgammon();
    let gradients = agent.computeGradients(encodeBoard(game));
    assertEqual(gradients.length, agent.network.layers.length);
    for (let i = 0; i < gradients.length; i++) {
      assertEqual(gradients[i].length, agent.network.layers[i].length);
      for (let j = 0; j < gradients[i].length; j++) {
        assertEqual(gradients[i][j].weights.length, agent.network.layers[i][j].weights.length);
      }
    }
  });

  it("should produce finite gradient values", () => {
    let agent = new TDAgent(10);
    let gradients = agent.computeGradients(encodeBoard(new Backgammon()));
    for (let i = 0; i < gradients.length; i++) {
      for (let j = 0; j < gradients[i].length; j++) {
        for (let k = 0; k < gradients[i][j].weights.length; k++) {
          assertTrue(isFinite(gradients[i][j].weights[k]));
        }
        assertTrue(isFinite(gradients[i][j].bias));
      }
    }
  });
});

// Weight Updates
describe("Weight Updates", () => {
  it("should change weights when TD error is non-zero", () => {
    let agent = new TDAgent(10);
    agent.initTraces();
    let features = encodeBoard(new Backgammon());
    let weightBefore = agent.network.layers[0][0].weights[0];
    agent.updateWeights(0.5, agent.computeGradients(features));
    assertTrue(Math.abs(agent.network.layers[0][0].weights[0] - weightBefore) > 0.0000001);
  });

  it("should not change weights when TD error is zero", () => {
    let agent = new TDAgent(10);
    agent.initTraces();
    let features = encodeBoard(new Backgammon());
    let weightBefore = agent.network.layers[0][0].weights[0];
    agent.updateWeights(0, agent.computeGradients(features));
    assertTrue(Math.abs(agent.network.layers[0][0].weights[0] - weightBefore) < 0.0000001);
  });

  it("should accumulate eligibility traces over multiple updates", () => {
    let agent = new TDAgent(10);
    agent.initTraces();
    let features = encodeBoard(new Backgammon());
    agent.updateWeights(0.1, agent.computeGradients(features));
    agent.updateWeights(0.1, agent.computeGradients(features));
    assertTrue(Math.abs(agent.traces[0][0].weights[0]) > 0);
  });
});

// Single Game Training
describe("Single Game Training", () => {
  it("should complete a training game and return a result", () => {
    let agent = new TDAgent(10);
    let result = agent.trainOneGame();
    assertTrue(result.winner === 1 || result.winner === -1);
    assertTrue(result.moves > 0);
  });

  it("should update game statistics after training", () => {
    let agent = new TDAgent(10);
    assertEqual(agent.gamesPlayed, 0);
    agent.trainOneGame();
    assertEqual(agent.gamesPlayed, 1);
    assertTrue(agent.p1Wins + agent.p2Wins === 1);
  });

  it("should change network weights during training", () => {
    let agent = new TDAgent(10);
    let weightsBefore = agent.network.layers[0][0].weights.slice();
    agent.trainOneGame();
    let anyChanged = false;
    for (let i = 0; i < weightsBefore.length; i++) {
      if (Math.abs(agent.network.layers[0][0].weights[i] - weightsBefore[i]) > 0.0000001) {
        anyChanged = true;
        break;
      }
    }
    assertTrue(anyChanged);
  });
});

// Multi-Game Training
describe("Multi-Game Training", () => {
  it("should train for the specified number of games", () => {
    let agent = new TDAgent(10);
    agent.train(10, 5);
    assertEqual(agent.gamesPlayed, 10);
  });

  it("should track wins for both players", () => {
    let agent = new TDAgent(10);
    agent.train(20, 20);
    assertTrue(agent.p1Wins >= 0);
    assertTrue(agent.p2Wins >= 0);
    assertEqual(agent.p1Wins + agent.p2Wins, 20);
  });

  it("should produce valid evaluations after some training", () => {
    let agent = new TDAgent(10);
    agent.train(20, 20);
    assertInRange(agent.evaluate(new Backgammon()), 0, 1);
  });
});

// Evaluation Against Random
describe("Evaluation Against Random", () => {
  it("should return valid evaluation results", () => {
    let agent = new TDAgent(10);
    let result = agent.evaluateAgainstRandom(10);
    assertTrue(result.wins >= 0);
    assertEqual(result.total, 10);
    assertInRange(result.winRate, 0, 100);
  });

  it("should have a roughly 50% win rate when untrained", () => {
    let agent = new TDAgent(10);
    let result = agent.evaluateAgainstRandom(50);
    assertInRange(result.winRate, 10, 90);
  });
});

// Save and Load Weights
describe("Save and Load Weights", () => {
  it("should export weights as a serialisable object", () => {
    let agent = new TDAgent(10);
    let data = agent.exportWeights();
    assertTrue(Array.isArray(data.layerSizes));
    assertTrue(Array.isArray(data.weights));
    assertEqual(data.gamesPlayed, 0);
  });

  it("should produce identical evaluations after import", () => {
    let agent = new TDAgent(10);
    agent.trainOneGame();
    let game = new Backgammon();
    let originalValue = agent.evaluate(game);
    let newAgent = new TDAgent(10);
    newAgent.importWeights(agent.exportWeights());
    assertTrue(Math.abs(originalValue - newAgent.evaluate(game)) < 0.0000001);
  });

  it("should preserve training statistics", () => {
    let agent = new TDAgent(10);
    agent.train(5, 5);
    let newAgent = new TDAgent(10);
    newAgent.importWeights(agent.exportWeights());
    assertEqual(newAgent.gamesPlayed, agent.gamesPlayed);
  });

  it("should survive JSON serialisation", () => {
    let agent = new TDAgent(10);
    agent.trainOneGame();
    let game = new Backgammon();
    let originalValue = agent.evaluate(game);
    let json = JSON.stringify(agent.exportWeights());
    let newAgent = new TDAgent(10);
    newAgent.importWeights(JSON.parse(json));
    assertTrue(Math.abs(originalValue - newAgent.evaluate(game)) < 0.0000001);
  });
});

// Results
console.log("\n" + "═".repeat(50));
console.log(`Results: ${passedTests}/${totalTests} passed, ${failedTests} failed`);
console.log("═".repeat(50));
if (failedTests === 0) {
  console.log("All tests passed!\n");
} else {
  console.log(`${failedTests} test(s) failed.\n`);
}