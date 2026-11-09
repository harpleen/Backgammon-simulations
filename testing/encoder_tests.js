const { encodeBoard, encodePointCount } = require("../backgammon/encoder");
const { Backgammon } = require("../backgammon/backgammon");


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
    console.log(` ${name}`);
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

function assertClose(actual, expected, tolerance = 0.0001, message = "") {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(
      `Expected ~${expected}, got ${actual} (tolerance: ${tolerance})${
        message ? " — " + message : ""
      }`
    );
  }
}

function assertTrue(condition, message = "") {
  if (!condition) {
    throw new Error(`Expected true, got false${message ? " — " + message : ""}`);
  }
}

function assertArrayEqual(actual, expected, message = "") {
  if (actual.length !== expected.length) {
    throw new Error(
      `Array length mismatch: expected ${expected.length}, got ${actual.length}${
        message ? " — " + message : ""
      }`
    );
  }
  for (let i = 0; i < actual.length; i++) {
    if (Math.abs(actual[i] - expected[i]) > 0.0001) {
      throw new Error(
        `Array mismatch at index ${i}: expected ${expected[i]}, got ${actual[i]}${
          message ? " — " + message : ""
        }`
      );
    }
  }
}

describe("Point Count Encoding", () => {
  it("should encode 0 checkers as [0, 0, 0, 0]", () => {
    assertArrayEqual(encodePointCount(0), [0, 0, 0, 0]);
  });

  it("should encode 1 checker as [1, 0, 0, 0]", () => {
    assertArrayEqual(encodePointCount(1), [1, 0, 0, 0]);
  });

  it("should encode 2 checkers as [1, 1, 0, 0]", () => {
    assertArrayEqual(encodePointCount(2), [1, 1, 0, 0]);
  });

  it("should encode 3 checkers as [1, 1, 1, 0]", () => {
    assertArrayEqual(encodePointCount(3), [1, 1, 1, 0]);
  });

  it("should encode 4 checkers as [1, 1, 1, 0.5]", () => {
    assertArrayEqual(encodePointCount(4), [1, 1, 1, 0.5]);
  });

  it("should encode 5 checkers as [1, 1, 1, 1.0]", () => {
    assertArrayEqual(encodePointCount(5), [1, 1, 1, 1.0]);
  });

  it("should encode 7 checkers as [1, 1, 1, 2.0]", () => {
    assertArrayEqual(encodePointCount(7), [1, 1, 1, 2.0]);
  });

  it("should always return exactly 4 features", () => {
    for (let count = 0; count <= 15; count++) {
      let encoded = encodePointCount(count);
      assertEqual(
        encoded.length,
        4,
        `count ${count} should produce 4 features`
      );
    }
  });
});


describe("Full Board Encoding", () => {
  it("should produce exactly 198 features", () => {
    let game = new Backgammon();
    let features = encodeBoard(game);
    assertEqual(features.length, 198, "encoding should have 198 features");
  });

  it("should encode the starting position correctly for Player 1", () => {
    let game = new Backgammon();
    let features = encodeBoard(game);

    assertArrayEqual(
      features.slice(0, 4),
      [1, 1, 0, 0],
      "Point 1: 2 P1 checkers → [1,1,0,0]"
    );

    assertArrayEqual(
      features.slice(4, 8),
      [0, 0, 0, 0],
      "Point 2: empty for P1 → [0,0,0,0]"
    );

    assertArrayEqual(
      features.slice(44, 48),
      [1, 1, 1, 1.0],
      "Point 12: 5 P1 checkers → [1,1,1,1.0]"
    );

    assertArrayEqual(
      features.slice(64, 68),
      [1, 1, 1, 0],
      "Point 17: 3 P1 checkers → [1,1,1,0]"
    );

    assertArrayEqual(
      features.slice(72, 76),
      [1, 1, 1, 1.0],
      "Point 19: 5 P1 checkers → [1,1,1,1.0]"
    );
  });

  it("should encode the starting position correctly for Player 2", () => {
    let game = new Backgammon();
    let features = encodeBoard(game);

    assertArrayEqual(
      features.slice(116, 120),
      [1, 1, 1, 1.0],
      "Point 6: 5 P2 checkers → [1,1,1,1.0]"
    );

    assertArrayEqual(
      features.slice(124, 128),
      [1, 1, 1, 0],
      "Point 8: 3 P2 checkers → [1,1,1,0]"
    );

    assertArrayEqual(
      features.slice(144, 148),
      [1, 1, 1, 1.0],
      "Point 13: 5 P2 checkers → [1,1,1,1.0]"
    );

    assertArrayEqual(
      features.slice(188, 192),
      [1, 1, 0, 0],
      "Point 24: 2 P2 checkers → [1,1,0,0]"
    );
  });

  it("should not cross-contaminate player features", () => {
    let game = new Backgammon();
    let features = encodeBoard(game);

    assertTrue(features[0] > 0, "P1 should have checkers on point 1");

    assertArrayEqual(
      features.slice(96, 100),
      [0, 0, 0, 0],
      "P2 should have NO checkers on point 1"
    );

    assertArrayEqual(
      features.slice(20, 24),
      [0, 0, 0, 0],
      "P1 should have NO checkers on point 6"
    );

    assertTrue(features[116] > 0, "P2 should have checkers on point 6");
  });
});

describe("Bar and Borne Off Features", () => {
  it("should encode bar counts at indices 192-193", () => {
    let game = new Backgammon();
    let features = encodeBoard(game);
    assertClose(features[192], 0, 0.0001, "P1 bar should be 0");
    assertClose(features[193], 0, 0.0001, "P2 bar should be 0");
  });

  it("should scale bar counts by dividing by 2", () => {
    let game = new Backgammon();
    game.bar[0] = 2; 
    game.bar[1] = 4; 

    let features = encodeBoard(game);
    assertClose(features[192], 1.0, 0.0001, "P1 bar: 2/2 = 1.0");
    assertClose(features[193], 2.0, 0.0001, "P2 bar: 4/2 = 2.0");
  });

  it("should encode borne off counts at indices 194-195", () => {
    let game = new Backgammon();
    let features = encodeBoard(game);
    assertClose(features[194], 0, 0.0001, "P1 borne off should be 0 at start");
    assertClose(features[195], 0, 0.0001, "P2 borne off should be 0 at start");
  });

  it("should scale borne off counts by dividing by 15", () => {
    let game = new Backgammon();
    game.borneOff[0] = 5;  
    game.borneOff[1] = 10;

    let features = encodeBoard(game);
    assertClose(features[194], 5 / 15, 0.0001, "P1 borne off: 5/15");
    assertClose(features[195], 10 / 15, 0.0001, "P2 borne off: 10/15");
  });

  it("should encode max borne off as 1.0", () => {
    let game = new Backgammon();
    game.borneOff[0] = 15; 

    let features = encodeBoard(game);
    assertClose(features[194], 1.0, 0.0001, "15/15 = 1.0 (game won)");
  });
});


describe("Turn Indicator", () => {
  it("should encode Player 1's turn as [1, 0]", () => {
    let game = new Backgammon();
    game.currentPlayer = 1;

    let features = encodeBoard(game);
    assertEqual(features[196], 1, "P1 turn indicator should be 1");
    assertEqual(features[197], 0, "P2 turn indicator should be 0");
  });

  it("should encode Player 2's turn as [0, 1]", () => {
    let game = new Backgammon();
    game.currentPlayer = -1;

    let features = encodeBoard(game);
    assertEqual(features[196], 0, "P1 turn indicator should be 0");
    assertEqual(features[197], 1, "P2 turn indicator should be 1");
  });
});

describe("Normalisation", () => {
  it("should produce mostly values between 0 and 1 for the starting position", () => {
    let game = new Backgammon();
    let features = encodeBoard(game);

    let outOfRange = 0;
    for (let i = 0; i < features.length; i++) {
      if (features[i] < 0 || features[i] > 1) {
        outOfRange++;
      }
    }

    assertEqual(outOfRange, 0, "starting position should have all values in [0, 1]");
  });

  it("should produce non-negative values for any game state", () => {
    let game = new Backgammon();

    function randomSelector(legalTurns) {
      return legalTurns[Math.floor(Math.random() * legalTurns.length)];
    }

    for (let i = 0; i < 20 && !game.isGameOver(); i++) {
      game.playTurn(randomSelector);
    }

    let features = encodeBoard(game);
    for (let i = 0; i < features.length; i++) {
      assertTrue(
        features[i] >= 0,
        `feature ${i} should be non-negative, got ${features[i]}`
      );
    }
  });
});


describe("Encoding Consistency", () => {
  it("should produce identical encoding for the same game state", () => {
    let game = new Backgammon();
    let encoding1 = encodeBoard(game);
    let encoding2 = encodeBoard(game);

    assertArrayEqual(
      encoding1,
      encoding2,
      "same state should always produce same encoding"
    );
  });

  it("should produce different encodings for different game states", () => {
    let game1 = new Backgammon();
    let game2 = new Backgammon();

    game2.board[0] = 1; 
    game2.board[3] = 1;  

    let encoding1 = encodeBoard(game1);
    let encoding2 = encodeBoard(game2);
    let allSame = true;
    for (let i = 0; i < encoding1.length; i++) {
      if (Math.abs(encoding1[i] - encoding2[i]) > 0.0001) {
        allSame = false;
        break;
      }
    }

    assertTrue(!allSame, "different game states should produce different encodings");
  });
});

describe("Strategic Encoding", () => {
  it("should clearly distinguish a blot from a made point", () => {
    // A blot is vulnerable, and a made point is safe

    let blot = encodePointCount(1);     
    let madePoint = encodePointCount(2); 

    // Feature 2 should be the distinguishing factor
    assertEqual(blot[1], 0, "blot: feature 2 should be 0 (not a made point)");
    assertEqual(madePoint[1], 1, "made point: feature 2 should be 1 (safe!)");
  });

  it("should distinguish an empty point from an occupied one", () => {
    let empty = encodePointCount(0);    
    let occupied = encodePointCount(1);

    // Feature 1 should be the distinguishing factor
    assertEqual(empty[0], 0, "empty: feature 1 should be 0");
    assertEqual(occupied[0], 1, "occupied: feature 1 should be 1");
  });

  it("should reflect bearing off progress", () => {
    // A player with more checkers borne off should have a higher borne off feature, indicating they're closer to winning
    let game = new Backgammon();

    game.borneOff[0] = 3;
    let early = encodeBoard(game);

    game.borneOff[0] = 12;
    let late = encodeBoard(game);

    assertTrue(
      late[194] > early[194],
      "more borne off should produce higher feature value"
    );
  });

  it("should make bar status visible", () => {
    // Having checkers on the bar is bad — the encoding should clearly show the difference between bar=0 and bar>0
    let game = new Backgammon();
    let noBar = encodeBoard(game);

    game.bar[0] = 2;
    let onBar = encodeBoard(game);

    assertTrue(
      onBar[192] > noBar[192],
      "checkers on bar should increase the bar feature"
    );
  });

  it("should encode a near-winning position distinctly", () => {
    // Set up a position where P1 is about to win
    let game = new Backgammon();
    game.board = new Array(24).fill(0);
    game.board[0] = 1;    
    game.borneOff[0] = 14; 

    let features = encodeBoard(game);

    // Borne off feature should be very high
    assertClose(features[194], 14 / 15, 0.001, "should show P1 nearly won");
    // Only 1 checker on the board
    assertArrayEqual(
      features.slice(0, 4),
      [1, 0, 0, 0],
      "should show just 1 checker on point 1"
    );
  });
});

console.log("\n" + "═".repeat(50));
console.log(`Results: ${passedTests}/${totalTests} passed, ${failedTests} failed`);
console.log("═".repeat(50));

if (failedTests === 0) {
  console.log("All tests passed! Board encoder is working correctly.");
  console.log("   Ready to move on to Step 4: TD-Learning (connecting the NN to the game).\n");
} else {
  console.log(`${failedTests} test(s) failed. Review the errors above.\n`);
}