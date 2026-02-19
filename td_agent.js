
const { NeuralNetwork } = require("./neural_network");
const { Backgammon } = require("./backgammon");
const { encodeBoard } = require("./encoder");

class TDAgent {
  constructor(hiddenSize = 40, learningRate = 0.1, lambda = 0.7) {
    this.learningRate = learningRate;
    this.lambda = lambda;

    // 198 inputs → hidden layer → 1 output (P1 win probability)
    this.network = new NeuralNetwork([198, hiddenSize, 1]);

    this.traces = null;
    this.gamesPlayed = 0;
    this.p1Wins = 0;
    this.p2Wins = 0;
  }

  // Evaluate a game state: returns P(Player 1 wins)
  evaluate(game) {
    let features = encodeBoard(game);
    let output = this.network.forward(features);
    return output[0];
  }

  // Choose the best turn from legal options
  chooseBestTurn(legalTurns, game, dice) {
    let bestTurn = null;
    let bestValue = null;

    for (let turn of legalTurns) {
      // Simulate the turn on a clone
      let simulated = game.clone();
      for (let move of turn) {
        simulated.executeMove(move, game.currentPlayer);
      }
      simulated.currentPlayer *= -1;

      let value = this.evaluate(simulated);

      // Player 1 maximises, Player 2 minimises
      if (bestTurn === null) {
        bestTurn = turn;
        bestValue = value;
      } else if (game.currentPlayer === 1 && value > bestValue) {
        bestTurn = turn;
        bestValue = value;
      } else if (game.currentPlayer === -1 && value < bestValue) {
        bestTurn = turn;
        bestValue = value;
      }
    }

    return bestTurn;
  }

  // Initialise eligibility traces to zero
  initTraces() {
    this.traces = [];
    for (let layer of this.network.layers) {
      let layerTraces = [];
      for (let neuron of layer) {
        layerTraces.push({
          weights: new Array(neuron.weights.length).fill(0),
          bias: 0,
        });
      }
      this.traces.push(layerTraces);
    }
  }

  // Compute gradient of the output with respect to each weight
  computeGradients(inputs) {
    this.network.forward(inputs);

    let numLayers = this.network.layers.length;

    // Output layer delta
    let outputNeuron = this.network.layers[numLayers - 1][0];
    outputNeuron.delta = outputNeuron.output * (1 - outputNeuron.output);

    // Hidden layer deltas (backpropagate)
    for (let i = numLayers - 2; i >= 0; i--) {
      let layer = this.network.layers[i];
      let nextLayer = this.network.layers[i + 1];

      for (let j = 0; j < layer.length; j++) {
        let neuron = layer[j];
        let sum = 0;
        for (let nextNeuron of nextLayer) {
          sum += nextNeuron.delta * nextNeuron.weights[j];
        }
        neuron.delta = sum * neuron.output * (1 - neuron.output);
      }
    }

    // Compute gradient for each weight
    let gradients = [];
    for (let i = 0; i < numLayers; i++) {
      let layerGrads = [];
      let layerInputs;

      if (i === 0) {
        layerInputs = inputs;
      } else {
        layerInputs = this.network.layers[i - 1].map((n) => n.output);
      }

      for (let neuron of this.network.layers[i]) {
        let weightGrads = [];
        for (let j = 0; j < neuron.weights.length; j++) {
          weightGrads.push(neuron.delta * layerInputs[j]);
        }
        layerGrads.push({ weights: weightGrads, bias: neuron.delta });
      }

      gradients.push(layerGrads);
    }

    return gradients;
  }

  // Update eligibility traces and weights using TD error
  updateWeights(tdError, gradients) {
    for (let i = 0; i < this.network.layers.length; i++) {
      for (let j = 0; j < this.network.layers[i].length; j++) {
        let neuron = this.network.layers[i][j];
        let trace = this.traces[i][j];
        let grad = gradients[i][j];

        for (let k = 0; k < neuron.weights.length; k++) {
          // Decay trace, add current gradient
          trace.weights[k] = this.lambda * trace.weights[k] + grad.weights[k];
          // Update weight using trace and TD error
          neuron.weights[k] += this.learningRate * tdError * trace.weights[k];
        }

        trace.bias = this.lambda * trace.bias + grad.bias;
        neuron.bias += this.learningRate * tdError * trace.bias;
      }
    }
  }

  // Train by playing one complete self-play game
  trainOneGame() {
    let game = new Backgammon();
    this.initTraces();

    let currentFeatures = encodeBoard(game);
    let currentValue = this.network.forward(currentFeatures)[0];

    let moveCount = 0;
    let maxMoves = 5000;

    while (!game.isGameOver() && moveCount < maxMoves) {
      // Roll dice and get legal turns
      let dice = game.rollDice();
      let legalTurns = game.getAllLegalTurns(dice);

      // Choose the best turn
      let chosenTurn;
      if (legalTurns.length === 0 || (legalTurns.length === 1 && legalTurns[0].length === 0)) {
        chosenTurn = [];
      } else {
        chosenTurn = this.chooseBestTurn(legalTurns, game, dice);
      }

      // Execute the chosen turn
      for (let move of chosenTurn) {
        game.executeMove(move, game.currentPlayer);
      }
      game.currentPlayer *= -1;

      // Evaluate the new position
      let nextFeatures = encodeBoard(game);
      let nextValue;

      if (game.isGameOver()) {
        nextValue = game.getWinner() === 1 ? 1.0 : 0.0;
      } else {
        nextValue = this.network.forward(nextFeatures)[0];
      }

      // TD update
      let tdError = nextValue - currentValue;
      let gradients = this.computeGradients(currentFeatures);
      this.updateWeights(tdError, gradients);

      currentFeatures = nextFeatures;
      currentValue = nextValue;
      moveCount++;
    }

    this.gamesPlayed++;
    let winner = game.getWinner();
    if (winner === 1) this.p1Wins++;
    else if (winner === -1) this.p2Wins++;

    return { winner, moves: moveCount };
  }

  // Train for multiple games with progress logging
  train(numGames, printEvery = 100) {
    console.log(`\nStarting training: ${numGames} games`);
    console.log(`  Network: [198, ${this.network.layerSizes[1]}, 1]`);
    console.log(`  Learning rate: ${this.learningRate}`);
    console.log(`  Lambda: ${this.lambda}`);
    console.log("─".repeat(50));

    let recentP1Wins = 0;
    let recentGames = 0;

    for (let i = 0; i < numGames; i++) {
      let result = this.trainOneGame();
      if (result.winner === 1) recentP1Wins++;
      recentGames++;

      if ((i + 1) % printEvery === 0) {
        let p1WinRate = ((recentP1Wins / recentGames) * 100).toFixed(1);
        console.log(`  Game ${(i + 1).toString().padStart(6)}: P1 win rate = ${p1WinRate}% (last ${printEvery} games)`);
        recentP1Wins = 0;
        recentGames = 0;
      }
    }

    console.log("─".repeat(50));
    console.log(`Training complete: ${this.gamesPlayed} games, P1 won ${this.p1Wins}, P2 won ${this.p2Wins}`);
    console.log(`  Overall P1 win rate: ${((this.p1Wins / this.gamesPlayed) * 100).toFixed(1)}%`);
  }

  // Play games against a random player to measure strength
  evaluateAgainstRandom(numGames = 100) {
    let wins = 0;

    for (let i = 0; i < numGames; i++) {
      let game = new Backgammon();
      let moveCount = 0;

      while (!game.isGameOver() && moveCount < 5000) {
        let dice = game.rollDice();
        let legalTurns = game.getAllLegalTurns(dice);

        if (legalTurns.length === 0 || (legalTurns.length === 1 && legalTurns[0].length === 0)) {
          game.currentPlayer *= -1;
          moveCount++;
          continue;
        }

        let chosenTurn;
        if (game.currentPlayer === 1) {
          chosenTurn = this.chooseBestTurn(legalTurns, game, dice);
        } else {
          chosenTurn = legalTurns[Math.floor(Math.random() * legalTurns.length)];
        }

        for (let move of chosenTurn) {
          game.executeMove(move, game.currentPlayer);
        }
        game.currentPlayer *= -1;
        moveCount++;
      }

      if (game.getWinner() === 1) wins++;
    }

    return { wins, total: numGames, winRate: (wins / numGames) * 100 };
  }

  // Export weights for saving
  exportWeights() {
    let weights = [];
    for (let layer of this.network.layers) {
      let layerWeights = [];
      for (let neuron of layer) {
        layerWeights.push({ weights: [...neuron.weights], bias: neuron.bias });
      }
      weights.push(layerWeights);
    }
    return {
      layerSizes: this.network.layerSizes,
      weights,
      gamesPlayed: this.gamesPlayed,
      p1Wins: this.p1Wins,
      p2Wins: this.p2Wins,
    };
  }

  // Import weights from a saved object
  importWeights(data) {
    this.network = new NeuralNetwork(data.layerSizes);
    for (let i = 0; i < data.weights.length; i++) {
      for (let j = 0; j < data.weights[i].length; j++) {
        this.network.layers[i][j].weights = [...data.weights[i][j].weights];
        this.network.layers[i][j].bias = data.weights[i][j].bias;
      }
    }
    this.gamesPlayed = data.gamesPlayed || 0;
    this.p1Wins = data.p1Wins || 0;
    this.p2Wins = data.p2Wins || 0;
  }
}

module.exports = { TDAgent };