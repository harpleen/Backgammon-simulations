I am creating a simulation of the backgammon game, so that I can begin to learn and understand how neural networks work. I have chosen Backgammon as it is a game that I play with my dad and my brother, and that I also enjoy. I shall be putting what I learn in this file. I will also not edit the writing too much as this is a project that will help me learn more about neural netowrks, so it should not and will not be perfect. This project is a build up to the insulin project that I have going on. 

The Plan: 
- Set out the Backgammon game 
- Simulate a game, with the random dice rolls 
- let 2 'cpus' play each other 
- log the moves 
- create a neural network ??????


Managed to create a neural network and analyse how it works on a simulation of backgammon. I found out that a person named 'Gerald Tesauro' had this exact idea back in the 1990s while he was working at IBM. I used his idea of TD-Gammon, where the core priciples lay in the way the raw inputs were given to the neural network. Instead of just telling the neural network how many checkers were on a point, you would have 4 inputs per point, confirming wether there were more than 1, 2, 3 or more checkers. The idea behind this was that the neural network did not know, with the simple input, that stacking checkers on one point was neccessarily a good thing, and so there are massive diminishing returns when stacking more that 2 checkers on a point. Therefore with the altenative method, the neural network can easily spot how vulnurable a point is. There is an example below:

0 checkers [0, 0, 0, 0]    — empty point
1 checker  [1, 0, 0, 0]    — blot (vulnerable)
2 checkers [1, 1, 0, 0]    — made point (safe)
3 checkers [1, 1, 1, 0]    — solid
5 checkers [1, 1, 1, 1.0]  — stacked ((5-3)/2 = 1.0)

I rushed ahead but I also learnt about the fundamentals of what a neural network are, especially the need for an activation function which in this case I used a Simoid function, to keep any input between 0 and 1. I also learnt about the principles behind backpropergation, the learning mechanism behind adjusting the weights of each hidden node so that the network can make better moves. I also learnt about why the Monte Carlo approach to learning was flawed in this game and why it is better to implement a TD approach using lambda to control how fast credit of a neuron decays. 

All in all I would say it was a pretty insightful project, in which I learnt quite a bit about the basics of how a neural network works, and how to program a game that I love. I would love to turn this into an interactive game that allows you to play against the neural network, although I doubt I could ever beat it, even my dad might not be able to :). 