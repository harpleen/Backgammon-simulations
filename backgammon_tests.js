const { Backgammon } = require("./backgammon");

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function describe(suiteName, fn) {
  console.log(`\n ${suiteName}`);
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
    throw new Error(
      `Expected ${expected}, got ${actual}${message ? " — " + message : ""}`
    );
  }
}

function assertTrue(condition, message = "") {
  if (!condition) {
    throw new Error(`Expected true, got false${message ? " — " + message : ""}`);
  }
}

function assertFalse(condition, message = "") {
  if (condition) {
    throw new Error(`Expected false, got true${message ? " — " + message : ""}`);
  }
}

function assertInRange(actual, min, max, message = "") {
  if (actual < min || actual > max) {
    throw new Error(
      `Expected value between ${min} and ${max}, got ${actual}${
        message ? " — " + message : ""
      }`
    );
  }
}

describe("Board Setup", () => {
  it("should have 24 points on the board", () => {
    let game = new Backgammon();
    assertEqual(game.board.length, 24);
  });

  it("should place Player 1's checkers correctly", () => {
    // Player 1 has positive values
    // 2 on point 1 (index 0), 5 on point 12 (index 11),
    // 3 on point 17 (index 16), 5 on point 19 (index 18)
    let game = new Backgammon();
    assertEqual(game.board[0], 2, "Point 1 should have 2 P1 checkers");
    assertEqual(game.board[11], 5, "Point 12 should have 5 P1 checkers");
    assertEqual(game.board[16], 3, "Point 17 should have 3 P1 checkers");
    assertEqual(game.board[18], 5, "Point 19 should have 5 P1 checkers");
  });

  it("should place Player 2's checkers correctly", () => {
    // Player 2 has negative values
    // -2 on point 24 (index 23), -5 on point 13 (index 12),
    // -3 on point 8 (index 7), -5 on point 6 (index 5)
    let game = new Backgammon();
    assertEqual(game.board[23], -2, "Point 24 should have 2 P2 checkers");
    assertEqual(game.board[12], -5, "Point 13 should have 5 P2 checkers");
    assertEqual(game.board[7], -3, "Point 8 should have 3 P2 checkers");
    assertEqual(game.board[5], -5, "Point 6 should have 5 P2 checkers");
  });

  it("should have exactly 15 checkers per player", () => {
    let game = new Backgammon();
    let p1Count = 0;
    let p2Count = 0;

    for (let i = 0; i < 24; i++) {
      if (game.board[i] > 0) p1Count += game.board[i];
      if (game.board[i] < 0) p2Count += Math.abs(game.board[i]);
    }

    assertEqual(p1Count, 15, "Player 1 should have 15 checkers");
    assertEqual(p2Count, 15, "Player 2 should have 15 checkers");
  });

  it("should start with an empty bar", () => {
    let game = new Backgammon();
    assertEqual(game.bar[0], 0, "Player 1 bar should be empty");
    assertEqual(game.bar[1], 0, "Player 2 bar should be empty");
  });

  it("should start with no checkers borne off", () => {
    let game = new Backgammon();
    assertEqual(game.borneOff[0], 0, "Player 1 borne off should be 0");
    assertEqual(game.borneOff[1], 0, "Player 2 borne off should be 0");
  });

  it("should start with Player 1's turn", () => {
    let game = new Backgammon();
    assertEqual(game.currentPlayer, 1);
  });
});


describe("Dice", () => {
  it("should roll values between 1 and 6", () => {
    let game = new Backgammon();

    // Roll many times and check all values are in range
    for (let i = 0; i < 100; i++) {
      let dice = game.rollDice();
      assertInRange(dice[0], 1, 6, "die 1 out of range");
      assertInRange(dice[1], 1, 6, "die 2 out of range");
    }
  });

  it("should return 2 dice values for non-doubles", () => {
    let game = new Backgammon();
    let values = game.getDiceValues([3, 5]);
    assertEqual(values.length, 2, "non-doubles should give 2 values");
    assertEqual(values[0], 3);
    assertEqual(values[1], 5);
  });

  it("should return 4 dice values for doubles", () => {
    let game = new Backgammon();
    let values = game.getDiceValues([4, 4]);
    assertEqual(values.length, 4, "doubles should give 4 values");
    // All four should be the same
    for (let v of values) {
      assertEqual(v, 4, "all double values should be 4");
    }
  });
});


describe("Move Validation", () => {
  it("should calculate correct destination for Player 1 (moves toward lower)", () => {
    let game = new Backgammon();
    // Player 1 on index 11, moving 3 should go to index 8 
    let dest = game.getDestination(11, 3, 1);
    assertEqual(dest, 8, "Player 1 from index 11 with die 3");
  });

  it("should calculate correct destination for Player 2 (moves toward higher)", () => {
    let game = new Backgammon();
    // Player 2 on index 5, moving 3 should go to index 8 
    let dest = game.getDestination(5, 3, -1);
    assertEqual(dest, 8, "Player 2 from index 5 with die 3");
  });

  it("should return -1 when Player 1 would bear off", () => {
    let game = new Backgammon();
    // Player 1 on index 2, moving 5 would go to index -3 bear off
    let dest = game.getDestination(2, 5, 1);
    assertEqual(dest, -1, "should signal bear off");
  });

  it("should return -1 when Player 2 would bear off", () => {
    let game = new Backgammon();
    // Player 2 on index 21, moving 5 → would go to index 26 
    let dest = game.getDestination(21, 5, -1);
    assertEqual(dest, -1, "should signal bear off");
  });

  it("should allow landing on empty points", () => {
    let game = new Backgammon();
    // Index 1 is empty in the starting position
    assertTrue(game.canLandOn(1, 1), "Player 1 should land on empty point");
    assertTrue(game.canLandOn(1, -1), "Player 2 should land on empty point");
  });

  it("should allow landing on own checkers", () => {
    let game = new Backgammon();
    // Index 0 has 2 of Player 1's checkers
    assertTrue(game.canLandOn(0, 1), "Player 1 should land on own checkers");
  });

  it("should allow landing on a single opponent checker (blot)", () => {
    let game = new Backgammon();
    // Set up a blot, single Player 2 checker on index 10
    game.board[10] = -1;
    assertTrue(game.canLandOn(10, 1), "Player 1 should be able to hit a blot");
  });

  it("should NOT allow landing on 2+ opponent checkers (blocked)", () => {
    let game = new Backgammon();
    // Index 5 has -5
    assertFalse(game.canLandOn(5, 1), "Player 1 should not land on P2's stack");
  });

  it("should correctly detect all checkers in home board", () => {
    let game = new Backgammon();

    // Starting position
    assertFalse(
      game.allCheckersInHomeBoard(1),
      "P1 should not have all in home at start"
    );
    assertFalse(
      game.allCheckersInHomeBoard(-1),
      "P2 should not have all in home at start"
    );

    // Setting up a position where all P1 checkers are in home board 
    game.board = new Array(24).fill(0);
    game.board[0] = 5;
    game.board[1] = 5;
    game.board[2] = 5;
    assertTrue(
      game.allCheckersInHomeBoard(1),
      "P1 should have all in home when all on points 1-3"
    );
  });

  it("should not count bar checkers as being in home board", () => {
    let game = new Backgammon();
    game.board = new Array(24).fill(0);
    game.board[0] = 5;
    game.board[1] = 5;
    game.board[2] = 4; 
    game.bar[0] = 1;   // 1 on the bar = 15 total, but bar means not all checkers are home

    assertFalse(
      game.allCheckersInHomeBoard(1),
      "bar checkers should prevent 'all in home'"
    );
  });
});



describe("Move Execution", () => {
  it("should move a checker from one point to another", () => {
    let game = new Backgammon();
    // Move a Player 1 checker from index 11 to index 8 
    let before = game.board[11]; // Should be 5
    game.executeMove({ from: 11, to: 8 }, 1);

    assertEqual(game.board[11], before - 1, "source should have one fewer checker");
    assertEqual(game.board[8], 1, "destination should have one checker");
  });

  it("should handle bearing off", () => {
    let game = new Backgammon();
    // Place a checker on index 0 and bear it off
    game.board = new Array(24).fill(0);
    game.board[0] = 1;
    game.executeMove({ from: 0, to: "off" }, 1);

    assertEqual(game.board[0], 0, "source point should be empty");
    assertEqual(game.borneOff[0], 1, "P1 should have 1 checker borne off");
  });

  it("should handle bar entry", () => {
    let game = new Backgammon();
    // Put a P1 checker on the bar, then enter on index 22 
    game.bar[0] = 1;
    game.board[22] = 0; // Make sure destination is empty
    game.executeMove({ from: "bar", to: 22 }, 1);

    assertEqual(game.bar[0], 0, "bar should be empty");
    assertEqual(game.board[22], 1, "entry point should have the checker");
  });
});


describe("Hitting", () => {
  it("should send opponent's blot to the bar when hit", () => {
    let game = new Backgammon();
    // P2 has a single checker (blot) on index 10
    game.board[10] = -1;
    // P1 has a checker on index 13
    game.board[13] = 1;

    // Player 1 moves from index 13 to index 10 (hitting P2's blot)
    game.executeMove({ from: 13, to: 10 }, 1);

    assertEqual(game.board[10], 1, "point should now have P1's checker");
    assertEqual(game.bar[1], 1, "P2 should have 1 checker on the bar");
  });

  it("should not hit when landing on 2+ opponent checkers", () => {
    let game = new Backgammon();
    // Index 5 has -5 (five P2 checkers), this is a block, not a blot
    // The canLandOn check should prevent this, but let's verify
    assertFalse(
      game.canLandOn(5, 1),
      "should not be able to land on a stack of opponent checkers"
    );
  });

  it("should allow hitting from the bar", () => {
    let game = new Backgammon();
    // P1 is on the bar, P2 has a blot on index 23 
    game.bar[0] = 1;
    game.board[23] = -1; // P2 blot

    // P1 enters from bar hitting the blot 
    game.executeMove({ from: "bar", to: 23 }, 1);

    assertEqual(game.bar[0], 0, "P1 should be off the bar");
    assertEqual(game.board[23], 1, "point should now be P1's");
    assertEqual(game.bar[1], 1, "P2's checker should be on the bar");
  });
});

describe("Bar Entry", () => {
  it("should calculate correct bar entry point for Player 1", () => {
    let game = new Backgammon();
    // P1 enters from the top, die 1 → point 24 
    assertEqual(game.getBarEntryPoint(1, 1), 23);
    // Die 3 moves to point 22 
    assertEqual(game.getBarEntryPoint(3, 1), 21);
    // Die 6 moves to point 19 
    assertEqual(game.getBarEntryPoint(6, 1), 18);
  });

  it("should calculate correct bar entry point for Player 2", () => {
    let game = new Backgammon();
    // P2 enters from the bottom, die 1 moves to point 1 
    assertEqual(game.getBarEntryPoint(1, -1), 0);
    // Die 3 moves to point 3 
    assertEqual(game.getBarEntryPoint(3, -1), 2);
    // Die 6 moves to point 6 
    assertEqual(game.getBarEntryPoint(6, -1), 5);
  });

  it("should force bar entry before any other move", () => {
    let game = new Backgammon();
    // Put P1 on the bar
    game.bar[0] = 1;
    game.board[11] -= 1; // Remove one from point 12 to keep count at 15

    // Get moves for die value 3, should only offer bar entry
    let moves = game.getMovesForDie(3, 1);

    // Every move should be from bar
    for (let move of moves) {
      assertEqual(move.from, "bar", "all moves should be from bar when on the bar");
    }
  });

  it("should block bar entry if the entry point is occupied by 2+ opponent", () => {
    let game = new Backgammon();
    game.bar[0] = 1;
    game.board[21] = -2;

    let moves = game.getMovesForDie(3, 1);
    assertEqual(
      moves.length,
      0,
      "should have no moves when bar entry is blocked"
    );
  });
});

describe("Bearing Off", () => {
  it("should not allow bearing off when checkers are outside home board", () => {
    let game = new Backgammon();
    // Starting position, checkers are spread out, can't bear off
    assertFalse(game.canBearOff(0, 1, 1), "should not bear off at game start");
  });

  it("should allow bearing off with exact die match", () => {
    let game = new Backgammon();
    // all P1 checkers in home board
    game.board = new Array(24).fill(0);
    game.board[0] = 3; 
    game.board[2] = 5; 
    game.board[4] = 5; 
    game.board[5] = 2; 
    assertTrue(
      game.canBearOff(2, 3, 1),
      "should bear off with exact die from point 3"
    );
  });

  it("should allow bearing off with higher die when no checkers on higher points", () => {
    let game = new Backgammon();
    game.board = new Array(24).fill(0);
    game.board[0] = 5; 
    game.board[1] = 5; 
    game.board[2] = 5; 
    assertTrue(
      game.canBearOff(2, 6, 1),
      "should bear off with higher die when no checkers behind"
    );
  });

  it("should NOT allow bearing off with higher die when checkers on higher points", () => {
    let game = new Backgammon();
    game.board = new Array(24).fill(0);
    game.board[1] = 5; 
    game.board[3] = 5; 
    game.board[5] = 5; 
    assertFalse(
      game.canBearOff(1, 5, 1),
      "should not bear off with higher die when checkers exist on higher points"
    );
  });

  it("should work for Player 2 bearing off", () => {
    let game = new Backgammon();
    game.board = new Array(24).fill(0);
    game.board[23] = -3; 
    game.board[21] = -5; 
    game.board[19] = -5; 
    game.board[18] = -2; 
    assertTrue(
      game.canBearOff(23, 1, -1),
      "P2 should bear off from point 24 with die 1"
    );
  });
});

describe("Legal Turn Generation", () => {
  it("should generate at least one legal turn from the starting position", () => {
    let game = new Backgammon();
    let turns = game.getAllLegalTurns([3, 1]);

    assertTrue(turns.length > 0, "should have at least one legal turn");
  });

  it("should generate turns where each move uses one die", () => {
    let game = new Backgammon();
    let turns = game.getAllLegalTurns([3, 1]);

    // Each turn should have exactly 2 moves
    // unless a player is forced to use fewer
    for (let turn of turns) {
      assertTrue(
        turn.length <= 2,
        `turn should have at most 2 moves, got ${turn.length}`
      );
    }
  });

  it("should generate 4-move turns for doubles", () => {
    let game = new Backgammon();
    game.board = new Array(24).fill(0);
    game.board[23] = 2; 
    game.board[20] = 3;  
    game.board[18] = 5;
    game.board[11] = 5; 

    let turns = game.getAllLegalTurns([3, 3]);
    let hasFullTurn = turns.some((t) => t.length === 4);
    assertTrue(hasFullTurn, "doubles should allow 4-move turns");
  });

  it("should return empty turn when no moves are possible", () => {
    let game = new Backgammon();
    // P1 on bar, all P2's home board points blocked
    game.board = new Array(24).fill(0);
    game.board[23] = -2;
    game.board[22] = -2;
    game.board[21] = -2;
    game.board[20] = -2;
    game.board[19] = -2;
    game.board[18] = -2;
    game.bar[0] = 15; 

    let turns = game.getAllLegalTurns([3, 5]);
    assertTrue(
      turns.length === 1 && turns[0].length === 0,
      "should return empty turn when completely blocked"
    );
  });

  it("should not modify the board when generating moves", () => {
    let game = new Backgammon();
    let boardBefore = JSON.stringify(game.board);
    let barBefore = JSON.stringify(game.bar);
    let offBefore = JSON.stringify(game.borneOff);

    game.getAllLegalTurns([3, 5]);

    assertEqual(
      JSON.stringify(game.board),
      boardBefore,
      "board should not change during move generation"
    );
    assertEqual(
      JSON.stringify(game.bar),
      barBefore,
      "bar should not change during move generation"
    );
    assertEqual(
      JSON.stringify(game.borneOff),
      offBefore,
      "borne off should not change during move generation"
    );
  });
});

describe("Game Clone", () => {
  it("should create an independent copy of the game", () => {
    let game = new Backgammon();
    let clone = game.clone();

    // Modifying the clone
    clone.board[0] = 99;
    clone.bar[0] = 10;
    clone.borneOff[0] = 5;

    // Original should be unchanged
    assertEqual(game.board[0], 2, "original board should not change");
    assertEqual(game.bar[0], 0, "original bar should not change");
    assertEqual(game.borneOff[0], 0, "original borne off should not change");
  });

  it("should copy the current player", () => {
    let game = new Backgammon();
    game.currentPlayer = -1;
    let clone = game.clone();

    assertEqual(clone.currentPlayer, -1, "clone should have same current player");
  });
});


describe("Full Game Simulation (Integration Test)", () => {
  it("should complete a game with random moves", () => {
    let game = new Backgammon();
    let maxTurns = 5000; 
    let turnCount = 0;

    function randomSelector(legalTurns) {
      return legalTurns[Math.floor(Math.random() * legalTurns.length)];
    }

    while (!game.isGameOver() && turnCount < maxTurns) {
      game.playTurn(randomSelector);
      turnCount++;
    }

    assertTrue(game.isGameOver(), `game should finish within ${maxTurns} turns`);

    let winner = game.getWinner();
    assertTrue(
      winner === 1 || winner === -1,
      `winner should be 1 or -1, got ${winner}`
    );

    // The winner should have 15 checkers borne off
    let winnerIndex = winner === 1 ? 0 : 1;
    assertEqual(
      game.borneOff[winnerIndex],
      15,
      "winner should have 15 checkers borne off"
    );
  });

  it("should maintain correct checker count throughout a game", () => {
    let game = new Backgammon();
    let maxTurns = 5000;
    let turnCount = 0;

    function randomSelector(legalTurns) {
      return legalTurns[Math.floor(Math.random() * legalTurns.length)];
    }

    while (!game.isGameOver() && turnCount < maxTurns) {
      game.playTurn(randomSelector);

      // After every turn, verify checker counts
      let p1Total = game.bar[0] + game.borneOff[0];
      let p2Total = game.bar[1] + game.borneOff[1];

      for (let i = 0; i < 24; i++) {
        if (game.board[i] > 0) p1Total += game.board[i];
        if (game.board[i] < 0) p2Total += Math.abs(game.board[i]);
      }

      assertEqual(p1Total, 15, `P1 should have 15 total checkers on turn ${turnCount}`);
      assertEqual(p2Total, 15, `P2 should have 15 total checkers on turn ${turnCount}`);

      turnCount++;
    }

    assertTrue(game.isGameOver(), "game should complete");
  });

  it("should be able to complete multiple games", () => {
    // Run 5 full games to test consistency
    let gamesCompleted = 0;

    for (let g = 0; g < 5; g++) {
      let game = new Backgammon();
      let turnCount = 0;

      function randomSelector(legalTurns) {
        return legalTurns[Math.floor(Math.random() * legalTurns.length)];
      }

      while (!game.isGameOver() && turnCount < 5000) {
        game.playTurn(randomSelector);
        turnCount++;
      }

      if (game.isGameOver()) gamesCompleted++;
    }

    assertEqual(gamesCompleted, 5, "all 5 games should complete");
  });
});


console.log("\n" + "═".repeat(50));
console.log(`RESULTS: ${passedTests}/${totalTests} passed, ${failedTests} failed`);
console.log("═".repeat(50));

if (failedTests === 0) {
  console.log("All tests have passed! Backgammon engine is working correctly.");
  console.log("   Ready to move on to Step 3: Board Encoding for the Neural Network.\n");
} else {
  console.log(`${failedTests} test(s) failed. Review the errors above.\n`);
}