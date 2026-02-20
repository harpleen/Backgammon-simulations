
class Backgammon {
  constructor() {
    // The board is an array of 24 elements, one for each point.
    // Positive numbers wil be Player 1's checkers
    // Negative numbers will be Player 2's checkers
    // 0 will be an empty point
    this.board = new Array(24).fill(0);
    // Player 1's starting checker's position 
    this.board[0] = 2;    
    this.board[11] = 5;   
    this.board[16] = 3;  
    this.board[18] = 5;   

    // Player 2's starting checkers positions
    this.board[23] = -2; 
    this.board[12] = -5;  
    this.board[7] = -3;  
    this.board[5] = -5;  

    // bar[0] will be Player 1's bar count, bar[1] will be Player 2's bar count
    this.bar = [0, 0];

    // borneOff[0] will be Player 1's count, borneOff[1] will be Player 2's count
    this.borneOff = [0, 0];
    this.currentPlayer = 1;
  }

  // Roll two dices, each returning a value between 1-6 
  rollDice() {
    let die1 = Math.floor(Math.random() * 6) + 1;
    let die2 = Math.floor(Math.random() * 6) + 1;
    return [die1, die2];
  }

  getDiceValues(dice) {
    if (dice[0] === dice[1]) {
      // Doubles: you get four moves instead of two
      return [dice[0], dice[0], dice[0], dice[0]];
    }
    return [dice[0], dice[1]];
  }

  getDestination(fromIndex, dieValue, player) {
    let toIndex;

    if (player === 1) {
      toIndex = fromIndex - dieValue;
      // If toIndex < 0, then the checker would move past point 1 meaning they have borne off
      if (toIndex < 0) return -1; 
    } else {
      toIndex = fromIndex + dieValue;
      // If toIndex > 23, then the checker would move past point 24 meaning they have borne off
      if (toIndex > 23) return -1; 
    }

    return toIndex;
  }

  // Geting the entry point for a checker that is coming off the bar
  getBarEntryPoint(dieValue, player) {
    if (player === 1) {
      // Player 1 enters from the top, die value 1 equals point 24 (index 23)
      return 24 - dieValue;
    } else {
      // Player 2 enters from the bottom, die value 1 equals point 1 (index 0)
      return dieValue - 1;
    }
  }

  // Checking wether a player can land on a specific point
  canLandOn(pointIndex, player) {
    let pointValue = this.board[pointIndex];

    if (pointValue === 0) return true;
    if (pointValue > 0 && player === 1) return true;
    if (pointValue < 0 && player === -1) return true;
    if (pointValue < 0 && player === 1 && pointValue === -1) return true;
    if (pointValue > 0 && player === -1 && pointValue === 1) return true;
    return false;
  }

  // Checking if all of a player's checkers are in their home board
  // This is needed before bearing off is allowed
  allCheckersInHomeBoard(player) {
    let barIndex = player === 1 ? 0 : 1;
    if (this.bar[barIndex] > 0) return false;
    if (player === 1) {
      for (let i = 6; i < 24; i++) {
        if (this.board[i] > 0) return false; 
      }
    } else {
      for (let i = 0; i < 18; i++) {
        if (this.board[i] < 0) return false; 
      }
    }
    return true;
  }

  // Checking if bearing off with a specific die value is valid
  canBearOff(fromIndex, dieValue, player) {
    // Must have all checkers in the home board first
    if (!this.allCheckersInHomeBoard(player)) return false;
    if (player === 1) {
      let exactDie = fromIndex + 1; 
      if (dieValue === exactDie) {
        return true;
      }

      if (dieValue > exactDie) {
        for (let i = fromIndex + 1; i <= 5; i++) {
          if (this.board[i] > 0) return false; 
        }
        return true;
      }

      return false;
    } else {
      let exactDie = 24 - fromIndex;

      if (dieValue === exactDie) {
        return true;
      }

      if (dieValue > exactDie) {
        for (let i = fromIndex - 1; i >= 18; i--) {
          if (this.board[i] < 0) return false;
        }
        return true;
      }

      return false;
    }
  }

  // Generating all valid moves for a single die value
  getMovesForDie(dieValue, player) {
    let moves = [];
    let barIndex = player === 1 ? 0 : 1;

    // A rule is that if you have checkers on the bar, you must move them first
    if (this.bar[barIndex] > 0) {
      let entryPoint = this.getBarEntryPoint(dieValue, player);
      if (this.canLandOn(entryPoint, player)) {
        moves.push({ from: "bar", to: entryPoint });
      }
      // If you can't enter from the bar, you can't make any move with this die
      return moves;
    }

    // Check every point on the board for the current player's checkers
    for (let i = 0; i < 24; i++) {
      let isOurs =
        (player === 1 && this.board[i] > 0) ||
        (player === -1 && this.board[i] < 0);

      if (!isOurs) continue;

      let destination = this.getDestination(i, dieValue, player);

      if (destination === -1) {
        // This move would bear off
        if (this.canBearOff(i, dieValue, player)) {
          moves.push({ from: i, to: "off" });
        }
      } else if (destination >= 0 && destination <= 23) {
        // Normal move to another point
        if (this.canLandOn(destination, player)) {
          moves.push({ from: i, to: destination });
        }
      }
    }

    return moves;
  }

  // Making a single move on the board 
  executeMove(move, player) {
    let barIndex = player === 1 ? 0 : 1;
    let opponentBarIndex = player === 1 ? 1 : 0;

    if (move.from === "bar") {
      // Coming off the bar
      this.bar[barIndex]--;
    } else {
      // Coming off a board point
      // Subtracting 1 for Player 1 (positive), adding 1 for Player 2 (negative)
      this.board[move.from] -= player;
    }

    // Placing the checker at its destination 
    if (move.to === "off") {
      // Bearing off and adding to the borne off count
      let offIndex = player === 1 ? 0 : 1;
      this.borneOff[offIndex]++;
    } else {
      // Checking if we're hitting an opponent's blot 
      let pointValue = this.board[move.to];
      let isOpponentBlot =
        (player === 1 && pointValue === -1) ||
        (player === -1 && pointValue === 1);

      if (isOpponentBlot) {
        // Remove opponent's checker and put it on the bar
        this.board[move.to] = 0; 
        this.bar[opponentBarIndex]++; 
      }

      this.board[move.to] += player;
    }
  }

  // Undoing a move 
  undoMove(move, player, wasHit) {
    let barIndex = player === 1 ? 0 : 1;
    let opponentBarIndex = player === 1 ? 1 : 0;

    if (move.to === "off") {
      let offIndex = player === 1 ? 0 : 1;
      this.borneOff[offIndex]--;
    } else {
      this.board[move.to] -= player;

      if (wasHit) {
        this.bar[opponentBarIndex]--;
        this.board[move.to] += player === 1 ? -1 : 1;
      }
    }

    if (move.from === "bar") {
      this.bar[barIndex]++;
    } else {
      this.board[move.from] += player;
    }
  }

  getAllLegalTurns(dice) {
    let diceValues = this.getDiceValues(dice);
    let player = this.currentPlayer;
    let permutations = this.getDicePermutations(diceValues);
    let allTurns = [];

    for (let perm of permutations) {
      this.findTurnsRecursive(perm, 0, [], player, allTurns);
    }

    allTurns = this.removeDuplicateTurns(allTurns);
    allTurns = this.filterMaxDice(allTurns, diceValues);
    return allTurns;
  }

  // Recursively find all possible move sequences
  findTurnsRecursive(diceValues, diceIndex, currentMoves, player, allTurns) {
    if (diceIndex >= diceValues.length) {
      allTurns.push([...currentMoves]);
      return;
    }

    let dieValue = diceValues[diceIndex];
    let possibleMoves = this.getMovesForDie(dieValue, player);

    if (possibleMoves.length === 0) {
      allTurns.push([...currentMoves]);
      return;
    }

    // Trying each possible move for this die
    for (let move of possibleMoves) {
      let wasHit = false;
      if (move.to !== "off") {
        let pointValue = this.board[move.to];
        wasHit =
          (player === 1 && pointValue === -1) ||
          (player === -1 && pointValue === 1);
      }

      // Make the move
      this.executeMove(move, player);
      currentMoves.push(move);
      this.findTurnsRecursive(diceValues, diceIndex + 1, currentMoves, player, allTurns);
      currentMoves.pop();
      this.undoMove(move, player, wasHit);
    }
  }

  // Get all permutations of dice values
  getDicePermutations(diceValues) {
    // For doubles, there's only one permutation 
    if (diceValues.length === 4) {
      return [diceValues];
    }

    // For two different dice, try both orders
    if (diceValues[0] !== diceValues[1]) {
      return [
        [diceValues[0], diceValues[1]],
        [diceValues[1], diceValues[0]],
      ];
    }

    return [diceValues];
  }

  // Removing duplicate turns from the list
  removeDuplicateTurns(turns) {
    let seen = new Set();
    let unique = [];

    for (let turn of turns) {
      // Create a string key by sorting the moves
      let sorted = [...turn].sort((a, b) => {
        let aFrom = a.from === "bar" ? -1 : a.from;
        let bFrom = b.from === "bar" ? -1 : b.from;
        let aTo = a.to === "off" ? 99 : a.to;
        let bTo = b.to === "off" ? 99 : b.to;
        if (aFrom !== bFrom) return aFrom - bFrom;
        return aTo - bTo;
      });

      let key = JSON.stringify(sorted);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(turn);
      }
    }

    return unique;
  }

  // Filter turns to only keep those that use the maximum number of dice
  filterMaxDice(turns, diceValues) {
    if (turns.length === 0) return [[]]; // No moves possible leads to an empty turn
    let maxMoves = 0;
    for (let turn of turns) {
      if (turn.length > maxMoves) maxMoves = turn.length;
    }

    let filtered = turns.filter((turn) => turn.length === maxMoves);

    // we must use the higher die if possible
    if (maxMoves === 1 && diceValues.length === 2 && diceValues[0] !== diceValues[1]) {
      let higherDie = Math.max(diceValues[0], diceValues[1]);
      let lowerDie = Math.min(diceValues[0], diceValues[1]);
      let turnsUsingHigher = filtered.filter((turn) => {
        let move = turn[0];
        let distance = this.getMoveDistance(move, this.currentPlayer);
        return distance === higherDie;
      });

      if (turnsUsingHigher.length > 0) {
        return turnsUsingHigher;
      }
    }

    return filtered;
  }

  // Calculate the distance of a move 
  getMoveDistance(move, player) {
    if (move.from === "bar") {
      if (player === 1) {
        return 24 - move.to;
      } else {
        return move.to + 1;
      }
    }

    if (move.to === "off") {
      if (player === 1) {
        return move.from + 1;
      } else {
        return 24 - move.from;
      }
    }

    return Math.abs(move.from - move.to);
  }


  playTurn(moveSelector) {
    let dice = this.rollDice();
    let legalTurns = this.getAllLegalTurns(dice);

    // If there are no legal moves then skip the turn
    if (legalTurns.length === 0 || (legalTurns.length === 1 && legalTurns[0].length === 0)) {
      this.currentPlayer *= -1; // Switch player
      return { dice, moves: [], skipped: true };
    }

    // Use the moveSelector to pick which turn to play
    let chosenTurn = moveSelector(legalTurns, this, dice);

    // Execute all the moves in the chosen turn
    for (let move of chosenTurn) {
      this.executeMove(move, this.currentPlayer);
    }

    let result = {
      dice,
      moves: chosenTurn,
      player: this.currentPlayer,
      skipped: false,
    };

    // Switch to the other player
    this.currentPlayer *= -1;

    return result;
  }

  // Check if the game is over (someone has borne off all 15 checkers)
  isGameOver() {
    return this.borneOff[0] === 15 || this.borneOff[1] === 15;
  }

  getWinner() {
    if (this.borneOff[0] === 15) return 1;
    if (this.borneOff[1] === 15) return -1;
    return null;
  }

  // Creating a copy of the game state
  clone() {
    let copy = new Backgammon();
    copy.board = [...this.board];
    copy.bar = [...this.bar];
    copy.borneOff = [...this.borneOff];
    copy.currentPlayer = this.currentPlayer;
    return copy;
  }
}

module.exports = { Backgammon };