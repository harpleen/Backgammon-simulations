const { NeuralNetwork, sigmoid, sigmoidDerivative } = require("../backgammon/neural_network");

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let currentSuite = "";

function describe(suiteName, fn) {
  currentSuite = suiteName;
  console.log(`\n📦 ${suiteName}`);
  console.log("─".repeat(50));
  fn();
}

function it(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ${name}`);
  } catch (error) {
    failedTests++;
    console.log(`  ${name}`);
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

function assertInRange(actual, min, max, message = "") {
  if (actual < min || actual > max) {
    throw new Error(
      `Expected value between ${min} and ${max}, got ${actual}${
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

describe("Sigmoid Function", () => {
  it("should return 0.5 when input is 0", () => {
    assertClose(sigmoid(0), 0.5);
  });

  it("should return close to 1 for large positive input", () => {
    let result = sigmoid(10);
    assertTrue(result > 0.999, `sigmoid(10) = ${result}, expected > 0.999`);
  });

  it("should return close to 0 for large negative input", () => {
    let result = sigmoid(-10);
    assertTrue(result < 0.001, `sigmoid(-10) = ${result}, expected < 0.001`);
  });

  it("should always return a value between 0 and 1", () => {
    let testValues = [-100, -10, -1, -0.5, 0, 0.5, 1, 10, 100];
    for (let val of testValues) {
      let result = sigmoid(val);
      assertInRange(result, 0, 1, `sigmoid(${val}) out of range`);
    }
  });

  it("should be symmetric: sigmoid(x) + sigmoid(-x) = 1", () => {
    let testValues = [0.5, 1, 2, 5, 10];
    for (let val of testValues) {
      let sum = sigmoid(val) + sigmoid(-val);
      assertClose(sum, 1.0, 0.0001, `sigmoid(${val}) + sigmoid(${-val}) should = 1`);
    }
  });
});

describe("Sigmoid Derivative", () => {
  it("should return 0.25 when sigmoid output is 0.5", () => {
    assertClose(sigmoidDerivative(0.5), 0.25);
  });

  it("should return close to 0 when sigmoid output is near 1", () => {
    let result = sigmoidDerivative(0.99);
    assertTrue(result < 0.01, `derivative at 0.99 = ${result}, expected < 0.01`);
  });

  it("should return close to 0 when sigmoid output is near 0", () => {
    let result = sigmoidDerivative(0.01);
    assertTrue(result < 0.01, `derivative at 0.01 = ${result}, expected < 0.01`);
  });

  it("should be symmetric: derivative(x) = derivative(1-x)", () => {
    let testValues = [0.1, 0.2, 0.3, 0.4];
    for (let val of testValues) {
      assertClose(
        sigmoidDerivative(val),
        sigmoidDerivative(1 - val),
        0.0001,
        `derivative(${val}) should equal derivative(${1 - val})`
      );
    }
  });

  it("should peak at 0.5 (maximum learning when uncertain)", () => {
    let peakValue = sigmoidDerivative(0.5);
    let testValues = [0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9];
    for (let val of testValues) {
      assertTrue(
        sigmoidDerivative(val) < peakValue,
        `derivative(${val}) should be less than derivative(0.5)`
      );
    }
  });
});


describe("Network Construction", () => {
  it("should create the correct number of layers", () => {
    let nn = new NeuralNetwork([2, 4, 1]);
    assertEqual(nn.layers.length, 2, "should have 2 layers (hidden + output)");
  });

  it("should create the correct number of neurons per layer", () => {
    let nn = new NeuralNetwork([2, 4, 1]);
    assertEqual(nn.layers[0].length, 4, "hidden layer should have 4 neurons");
    assertEqual(nn.layers[1].length, 1, "output layer should have 1 neuron");
  });

  it("should give each neuron the correct number of weights", () => {
    let nn = new NeuralNetwork([2, 4, 1]);
    for (let neuron of nn.layers[0]) {
      assertEqual(neuron.weights.length, 2, "hidden neuron should have 2 weights");
    }
    assertEqual(
      nn.layers[1][0].weights.length,
      4,
      "output neuron should have 4 weights"
    );
  });

  it("should initialise weights randomly between -1 and 1", () => {
    let nn = new NeuralNetwork([2, 4, 1]);
    for (let layer of nn.layers) {
      for (let neuron of layer) {
        for (let weight of neuron.weights) {
          assertInRange(weight, -1, 1, "weight should be between -1 and 1");
        }
        assertInRange(neuron.bias, -1, 1, "bias should be between -1 and 1");
      }
    }
  });

  it("should not initialise all weights to the same value", () => {
    let nn = new NeuralNetwork([2, 4, 1]);
    let allWeights = [];
    for (let layer of nn.layers) {
      for (let neuron of layer) {
        allWeights.push(...neuron.weights, neuron.bias);
      }
    }

    let allSame = allWeights.every((w) => w === allWeights[0]);
    assertTrue(!allSame, "weights should not all be identical");
  });

  it("should support deeper architectures", () => {
    let nn = new NeuralNetwork([3, 5, 4, 2]);
    assertEqual(nn.layers.length, 3, "should have 3 layers");
    assertEqual(nn.layers[0].length, 5, "first hidden layer: 5 neurons");
    assertEqual(nn.layers[1].length, 4, "second hidden layer: 4 neurons");
    assertEqual(nn.layers[2].length, 2, "output layer: 2 neurons");
    assertEqual(nn.layers[0][0].weights.length, 3, "first hidden neuron: 3 weights");
    assertEqual(nn.layers[1][0].weights.length, 5, "second hidden neuron: 5 weights");
    assertEqual(nn.layers[2][0].weights.length, 4, "output neuron: 4 weights");
  });
});


describe("Forward Pass", () => {
  it("should return output between 0 and 1", () => {
    let nn = new NeuralNetwork([2, 4, 1]);
    let output = nn.forward([0.5, 0.5]);
    assertInRange(output[0], 0, 1, "output should be between 0 and 1");
  });

  it("should return the correct number of outputs", () => {
    let nn1 = new NeuralNetwork([2, 4, 1]);
    let output1 = nn1.forward([0.5, 0.5]);
    assertEqual(output1.length, 1, "should return 1 output");
    let nn3 = new NeuralNetwork([2, 4, 3]);
    let output3 = nn3.forward([0.5, 0.5]);
    assertEqual(output3.length, 3, "should return 3 outputs");
  });

  it("should be deterministic (same input → same output)", () => {
    let nn = new NeuralNetwork([2, 4, 1]);
    let output1 = nn.forward([0.5, 0.5]);
    let output2 = nn.forward([0.5, 0.5]);
    assertClose(output1[0], output2[0], 0.0000001, "same input should give same output");
  });

  it("should produce different outputs for different inputs", () => {
    let nn = new NeuralNetwork([2, 4, 1]);
    let output1 = nn.forward([0, 0]);
    let output2 = nn.forward([1, 1]);

    let different = Math.abs(output1[0] - output2[0]) > 0.0001;
    assertTrue(different, "different inputs should produce different outputs");
  });

  it("should work with various input sizes", () => {
    let nn = new NeuralNetwork([5, 3, 1]);
    let output = nn.forward([0.1, 0.2, 0.3, 0.4, 0.5]);
    assertInRange(output[0], 0, 1, "should handle 5 inputs");
  });
});


describe("Training (Backpropagation)", () => {
  it("should reduce error after training", () => {
    let nn = new NeuralNetwork([2, 4, 1]);
    let inputs = [1, 0];
    let targets = [1];

    let outputBefore = nn.forward(inputs);
    let errorBefore = Math.abs(targets[0] - outputBefore[0]);

    for (let i = 0; i < 100; i++) {
      nn.train(inputs, targets, 0.5);
    }

    let outputAfter = nn.forward(inputs);
    let errorAfter = Math.abs(targets[0] - outputAfter[0]);

    assertTrue(
      errorAfter < errorBefore,
      `error should decrease: before=${errorBefore.toFixed(4)}, after=${errorAfter.toFixed(4)}`
    );
  });

  it("should move output toward the target value", () => {
    let nn = new NeuralNetwork([2, 4, 1]);

    for (let i = 0; i < 500; i++) {
      nn.train([1, 0], [0.9], 0.5);
    }

    let output = nn.forward([1, 0]);
    assertClose(output[0], 0.9, 0.1, "output should be close to target 0.9");
  });

  it("should learn faster with a higher learning rate", () => {

    let nnSlow = new NeuralNetwork([2, 4, 1]);
    let nnFast = new NeuralNetwork([2, 4, 1]);

    for (let i = 0; i < nnFast.layers.length; i++) {
      for (let j = 0; j < nnFast.layers[i].length; j++) {
        nnFast.layers[i][j].weights = [...nnSlow.layers[i][j].weights];
        nnFast.layers[i][j].bias = nnSlow.layers[i][j].bias;
      }
    }

    let inputs = [1, 0];
    let targets = [1];

    for (let i = 0; i < 50; i++) {
      nnSlow.train(inputs, targets, 0.1); 
      nnFast.train(inputs, targets, 0.5); 
    }

 
    let slowError = Math.abs(targets[0] - nnSlow.forward(inputs)[0]);
    let fastError = Math.abs(targets[0] - nnFast.forward(inputs)[0]);

    assertTrue(
      fastError < slowError,
      `fast learner should have less error: slow=${slowError.toFixed(4)}, fast=${fastError.toFixed(4)}`
    );
  });

  it("should handle training toward 0", () => {
    let nn = new NeuralNetwork([2, 4, 1]);

    for (let i = 0; i < 500; i++) {
      nn.train([1, 1], [0], 0.5);
    }

    let output = nn.forward([1, 1]);
    assertClose(output[0], 0, 0.1, "output should be close to target 0");
  });

  it("should handle multiple output neurons", () => {

    let nn = new NeuralNetwork([2, 4, 2]);

    for (let i = 0; i < 1000; i++) {
      nn.train([1, 0], [1, 0], 0.5);
    }

    let output = nn.forward([1, 0]);
    assertClose(output[0], 1, 0.15, "first output should be close to 1");
    assertClose(output[1], 0, 0.15, "second output should be close to 0");
  });
});



describe("Learning XOR (Integration Test)", () => {
  it("should learn all four XOR patterns", () => {
    let nn = new NeuralNetwork([2, 4, 1]);

    let trainingData = [
      { inputs: [0, 0], targets: [0] },
      { inputs: [0, 1], targets: [1] },
      { inputs: [1, 0], targets: [1] },
      { inputs: [1, 1], targets: [0] },
    ];


    for (let epoch = 0; epoch < 10000; epoch++) {
      for (let data of trainingData) {
        nn.train(data.inputs, data.targets, 0.5);
      }
    }


    for (let data of trainingData) {
      let output = nn.forward(data.inputs);
      let rounded = Math.round(output[0]);
      assertEqual(
        rounded,
        data.targets[0],
        `XOR(${data.inputs}) = ${output[0].toFixed(4)}, rounded to ${rounded}, expected ${data.targets[0]}`
      );
    }
  });

  it("should achieve low error on XOR after training", () => {
    let nn = new NeuralNetwork([2, 4, 1]);

    let trainingData = [
      { inputs: [0, 0], targets: [0] },
      { inputs: [0, 1], targets: [1] },
      { inputs: [1, 0], targets: [1] },
      { inputs: [1, 1], targets: [0] },
    ];

    for (let epoch = 0; epoch < 10000; epoch++) {
      for (let data of trainingData) {
        nn.train(data.inputs, data.targets, 0.5);
      }
    }

    let totalError = 0;
    for (let data of trainingData) {
      let output = nn.forward(data.inputs);
      totalError += Math.pow(data.targets[0] - output[0], 2);
    }
    let avgError = totalError / trainingData.length;

    assertTrue(
      avgError < 0.01,
      `average error should be < 0.01, got ${avgError.toFixed(6)}`
    );
  });

  it("should show error decreasing over training epochs", () => {
    let nn = new NeuralNetwork([2, 4, 1]);

    let trainingData = [
      { inputs: [0, 0], targets: [0] },
      { inputs: [0, 1], targets: [1] },
      { inputs: [1, 0], targets: [1] },
      { inputs: [1, 1], targets: [0] },
    ];

    let earlyError = 0;
    for (let epoch = 0; epoch < 100; epoch++) {
      for (let data of trainingData) {
        nn.train(data.inputs, data.targets, 0.5);
      }
    }
    for (let data of trainingData) {
      let output = nn.forward(data.inputs);
      earlyError += Math.pow(data.targets[0] - output[0], 2);
    }


    for (let epoch = 0; epoch < 9900; epoch++) {
      for (let data of trainingData) {
        nn.train(data.inputs, data.targets, 0.5);
      }
    }

    let lateError = 0;
    for (let data of trainingData) {
      let output = nn.forward(data.inputs);
      lateError += Math.pow(data.targets[0] - output[0], 2);
    }

    assertTrue(
      lateError < earlyError,
      `error should decrease: early=${earlyError.toFixed(4)}, late=${lateError.toFixed(6)}`
    );
  });
});



console.log("\n" + "═".repeat(50));
console.log(`RESULTS: ${passedTests}/${totalTests} passed, ${failedTests} failed`);
console.log("═".repeat(50));

if (failedTests === 0) {
  console.log(" All tests passed! Neural network is working correctly.");
  console.log("   Ready to move on to Step 2: Backgammon Game Engine.\n");
} else {
  console.log(` ${failedTests} test(s) failed. Review the errors above.\n`);
}