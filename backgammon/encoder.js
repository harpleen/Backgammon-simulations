
function encodePointCount(count) {
  return [
    count >= 1 ? 1 : 0,       
    count >= 2 ? 1 : 0,       
    count >= 3 ? 1 : 0,      
    count > 3 ? (count - 3) / 2 : 0,  
  ];
}

function encodeBoard(game) {
  let features = [];
  for (let i = 0; i < 24; i++) {
    let p1Count = game.board[i] > 0 ? game.board[i] : 0;
    features.push(...encodePointCount(p1Count));
  }

  for (let i = 0; i < 24; i++) {
    let p2Count = game.board[i] < 0 ? Math.abs(game.board[i]) : 0;
    features.push(...encodePointCount(p2Count));
  }

  features.push(game.bar[0] / 2); 
  features.push(game.bar[1] / 2); 
  features.push(game.borneOff[0] / 15); 
  features.push(game.borneOff[1] / 15); 
  features.push(game.currentPlayer === 1 ? 1 : 0); 
  features.push(game.currentPlayer === -1 ? 1 : 0); 

  return features;
}

module.exports = { encodeBoard, encodePointCount };