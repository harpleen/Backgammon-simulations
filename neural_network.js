
// Sigmoid function squishes any number into a range between 1 and 0
function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

// Calculating how sensitive is the sigmoid at this point
function sigmoidDerivative(sigmoidOutput) {
  return sigmoidOutput * (1 - sigmoidOutput);
}


class Neuron {
  constructor(inputCount) {
    // One weight per input, randomly initialised between -1 and +1
    this.weights = [];
    for (let i = 0; i < inputCount; i++) {
      this.weights.push(Math.random() * 2 - 1);
    }

    // Bias is an extra learnable value that shifts the activation, to see how easy it is for a neuron to fire
    this.bias = Math.random() * 2 - 1;
    this.output = 0; 
    this.delta = 0;  
  }

  // Forward pass computes the neuron's output given inputs
  forward(inputs) {
    let sum = this.bias;
    for (let i = 0; i < inputs.length; i++) {
      sum += inputs[i] * this.weights[i];
    }
    this.output = sigmoid(sum);
    return this.output;
  }
}

class NeuralNetwork {
  // layerSizes is an array that describes the network shape
  constructor(layerSizes) {
    this.layers = [];
    for (let i = 1; i < layerSizes.length; i++) {
      let layer = [];
      let inputsPerNeuron = layerSizes[i - 1]; 

      for (let j = 0; j < layerSizes[i]; j++) {
        layer.push(new Neuron(inputsPerNeuron));
      }
      this.layers.push(layer);
    }
    this.layerSizes = layerSizes;
  }

  // Forward pass will feed the data through the entire network
  forward(inputs) {
    let currentInputs = inputs;

    for (let layer of this.layers) {
      let layerOutputs = [];
      for (let neuron of layer) {
        layerOutputs.push(neuron.forward(currentInputs));
      }
      currentInputs = layerOutputs;
    }

    return currentInputs;
  }

  // Train wil be set up as -> one round of forward pass + backpropagation + weight update

  train(inputs, targets, learningRate) {
    // Run the inputs through the network to get predictions
    let outputs = this.forward(inputs);
    // For the output layer, we can directly compare to the target
    let outputLayer = this.layers[this.layers.length - 1];
    for (let i = 0; i < outputLayer.length; i++) {
      let neuron = outputLayer[i];

      // Error = what I wanted - what I got
      let error = targets[i] - neuron.output;
      // The derivative helps tell us how much the sigmoid was sloping at this point
      neuron.delta = error * sigmoidDerivative(neuron.output);
    }
    // Working backwards through the hidden layers
    for (let i = this.layers.length - 2; i >= 0; i--) {
      let layer = this.layers[i];
      let nextLayer = this.layers[i + 1];

      for (let j = 0; j < layer.length; j++) {
        let neuron = layer[j];

        // Summing up the blame from every neuron in the next layer
        let error = 0;
        for (let nextNeuron of nextLayer) {
          error += nextNeuron.delta * nextNeuron.weights[j];
        }

        neuron.delta = error * sigmoidDerivative(neuron.output);
      }
    }


    // Now that every neuron has a delta we can adjust the weights to reduce error
    for (let i = 0; i < this.layers.length; i++) {
      let layerInputs;
      if (i === 0) {
        layerInputs = inputs;
      } else {
        layerInputs = this.layers[i - 1].map((n) => n.output);
      }

      for (let neuron of this.layers[i]) {
        for (let j = 0; j < neuron.weights.length; j++) {
          neuron.weights[j] += learningRate * neuron.delta * layerInputs[j];
        }

        neuron.bias += learningRate * neuron.delta;
      }
    }

    return outputs;
  }
}

module.exports = { NeuralNetwork, sigmoid, sigmoidDerivative };
