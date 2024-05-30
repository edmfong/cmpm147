"use strict";

/* global XXH */
/* exported --
    p3_preload
    p3_setup
    p3_worldKeyChanged
    p3_tileWidth
    p3_tileHeight
    p3_tileClicked
    p3_drawBefore
    p3_drawTile
    p3_drawSelectedTile
    p3_drawAfter
    p3_drawAfter2
    getResourceInfo
    startGathering
    updateGathering
*/

function p3_preload() {
  biomeTilesheet = loadImage("./assets/biomes.png");
  resourceTilesheet = loadImage("./assets/resources.png");
  overworldResourcesTilesheet = loadImage("./assets/overworld_resources.png");
  housesTilesheet = loadImage("./assets/houses.png")
  // biomeTilesheet = loadImage("https://cdn.glitch.global/89835fff-f6de-48e0-bb2e-674d0cfb96b8/biomes.png?v=1716690336341");
}

function p3_setup() {
}

let worldSeed;
let player;
let playerSize = 32; // Size of the player square
let playerPosition; // Tile coordinates of the player

let biomeTilesheet;
let resourceTilesheet;
let overworldResourcesTilesheet;
let housesTilesheet;

let startMillis = 0;
let gathering = false;
const gatheringDuration = 1500; // 5 seconds in milliseconds
let wood = 10;
let stone = 10;
let rocks = {}; // Object to track tiles with rocks
let trees = {}; // Object to track tiles with trees
let deadtrees = {}; // Object to track tiles with trees
let houses = {};
let rockPosition = {};
let treePosition = {};
let deadtreePosition = {};
let housesPosition = {};
let housesType = {};
let water = {};
let pathTiles = {};
let farmTiles = {};
let fences = {};
let stonePaths = {};

let placingHouse = false;
let upgradeHouse = false;
let placingPathTiles = false;
let placingFarmTiles = false;
let placingFence = false;
let placingStonePaths = false;


function p3_worldKeyChanged(key) {
  worldSeed = XXH.h32(key, 0);
  noiseSeed(worldSeed);
  randomSeed(worldSeed);

  startMillis = 0;
  gathering = false;
  wood = 10;
  stone = 10;
  rocks = {}; // Object to track tiles with rocks
  trees = {}; // Object to track tiles with trees
  deadtrees = {}; // Object to track tiles with trees
  houses = {};
  rockPosition = {};
  treePosition = {};
  deadtreePosition = {};
  housesPosition = {};
  housesType = {};
  water = {};
  pathTiles = {};
  farmTiles = {};
  fences = {};
  stonePaths = {};
}

function p3_tileWidth() {
  return 32;
}
function p3_tileHeight() {
  return 32;
}

let [tw, th] = [p3_tileWidth(), p3_tileHeight()];

let clicks = {};

function p3_tileClicked(i, j) {
  let key = [i, j];

  // Calculate the player's neighboring tile positions
  let playerX = playerPosition[0];
  let playerY = playerPosition[1];
  let adjacentTiles = [
    [playerX, playerY],           // Player's current tile
    // Radius 1
    [playerX + 1, playerY],       // Right
    [playerX + 1, playerY + 1],   // Bottom-right
    [playerX, playerY + 1],       // Bottom
    [playerX - 1, playerY + 1],   // Bottom-left
    [playerX - 1, playerY],       // Left
    [playerX - 1, playerY - 1],   // Top-left
    [playerX, playerY - 1],       // Top
    [playerX + 1, playerY - 1],   // Top-right
    // Radius 2
    [playerX + 2, playerY],       // Right (2 tiles away)
    [playerX + 2, playerY + 1],
    [playerX + 2, playerY + 2],
    [playerX + 1, playerY + 2],   // Bottom-right (2 tiles away)
    [playerX, playerY + 2],       // Bottom (2 tiles away)
    [playerX - 1, playerY + 2],
    [playerX - 2, playerY + 2],
    [playerX - 2, playerY + 1],   // Bottom-left (2 tiles away)
    [playerX - 2, playerY],       // Left (2 tiles away)
    [playerX - 2, playerY - 1],
    [playerX - 2, playerY - 2],
    [playerX - 1, playerY - 2],   // Top-left (2 tiles away)
    [playerX, playerY - 2],       // Top (2 tiles away)
    [playerX + 1, playerY - 2],
    [playerX + 2, playerY - 2],
    [playerX + 2, playerY - 1]    // Top-right (2 tiles away)
];

  // Check if the player is next to any rock tiles
  let playerNextToRock = null;
  adjacentTiles.some(tile => {
    if (rocks[tile]) {
      playerNextToRock = tile;
      return true; // Stop iteration once a rock is found
    }
  });

  // Check if the player is next to any tree tiles
  let playerNextToTree = null;
  adjacentTiles.some(tile => {
    if (trees[tile]) {
      playerNextToTree = tile;
      return true; // Stop iteration once a tree is found
    }
  });
  let playerNextToDeadTree = null;
  adjacentTiles.some(tile => {
    if (deadtrees[tile]) {
      playerNextToDeadTree = tile;
      return true; // Stop iteration once a tree is found
    }
  });

  let actionTaken = false;
  // Check if the player is next to a rock or tree
  if ((playerNextToRock || playerNextToTree || playerNextToDeadTree) && !actionTaken) {
    // Check if the clicked tile or any of its adjacent tiles are rocks
    if (playerNextToRock && adjacentTiles.some(tile => rockPosition[tile] && tile[0] >= i - 1 && tile[0] <= i && tile[1] >= j - 1 && tile[1] <= j)) {
      // If it's a rock, perform your action (increment stone count, remove image, etc.)
      stone++;
      // Reset the rock status for the clicked tile and its adjacent tiles
      for (let x = i - 1; x <= i + 1; x++) {
          for (let y = j - 1; y <= j + 1; y++) {
              if (rocks[[x, y]]) {
                  rocks[[x, y]] = false;
                  rockPosition[[x, y]] = false;
              }
          }
      }
      startGathering();
      actionTaken = true;
    }

    // Check if the clicked tile or any of its adjacent tiles are trees
    if (playerNextToTree && adjacentTiles.some(tile => treePosition[tile] && tile[0] >= i - 1 && tile[0] <= i && tile[1] >= j - 1 && tile[1] <= j)) {
      // If it's a rock, perform your action (increment stone count, remove image, etc.)
      wood++;
      // Reset the rock status for the clicked tile and its adjacent tiles
      for (let x = i - 1; x <= i + 1; x++) {
          for (let y = j - 1; y <= j + 1; y++) {
              if (trees[[x, y]]) {
                  trees[[x, y]] = false;
                  treePosition[[x, y]] = false
              }
          }
      }
      startGathering();
      actionTaken = true;
    }

    if (playerNextToDeadTree && adjacentTiles.some(tile => deadtreePosition[tile] && tile[0] >= i - 1 && tile[0] <= i && tile[1] >= j - 1 && tile[1] <= j)) {
      // If it's a rock, perform your action (increment stone count, remove image, etc.)
      wood++;
      // Reset the rock status for the clicked tile and its adjacent tiles
      for (let x = i - 1; x <= i + 1; x++) {
          for (let y = j - 1; y <= j + 1; y++) {
              if (deadtrees[[x, y]]) {
                  deadtrees[[x, y]] = false;
                  deadtreePosition[[x, y]] = false;
              }
          }
      }
      startGathering();
      actionTaken = true;
    }

    // If no action was taken, treat the click as a regular tile click
    if (!actionTaken) {
        click(key);
    }
  } else {
    click(key);
  }
}

function click(key) {
  // clicked fence
  if (!fences[key] && wood > 0) {
      if (placingFence) {
        if (!houses[key] && !rocks[key] && !trees[key] && !deadtrees[key] && !water[key] && !stonePaths[key]) {
          fences[key] = true;
          wood--;
        }
      }
    }
  else if (fences[key]){
    if (placingFence) {
      fences[key] = false;
      wood++;
    }
  }   

  // clicked fence
  if (!stonePaths[key] && stone > 0) {
    if (placingStonePaths) {
      if (!houses[key] && !rocks[key] && !trees[key] && !deadtrees[key] && !water[key] && !fences[key]) {
        stonePaths[key] = true;
        stone--;
      }
    }
  }
  else if (stonePaths[key]){
    if (placingStonePaths) {
      stonePaths[key] = false;
      stone++;
    }
  }  

  // clicked farm tile
  if (!farmTiles[key]) {
      if (placingFarmTiles) {
        if (!houses[key] && !rocks[key] && !trees[key] && !deadtrees[key] && !water[key]) {
          farmTiles[key] = true;
        }
      }
  }
  else if (farmTiles[key]){
    if (placingFarmTiles) {
      farmTiles[key] = false;
    }
  } 

  // clicked path tile
  if (!pathTiles[key]) {
    if (placingPathTiles) {
      if (!houses[key] && !rocks[key] && !trees[key] && !deadtrees[key] && !water[key]) {
        pathTiles[key] = true;
      }
    }
  }
  else if (pathTiles[key]){
    if (placingPathTiles) {
      pathTiles[key] = false;
    }
  } 
  
  // clicked house
  if (!housesPosition[key] && !houses[key]) {
    if (placingHouse) {
        let canPlaceHouse = true;
        for (let xOffset = -4; xOffset < 8; xOffset++) {
            for (let yOffset = -4; yOffset < 8; yOffset++) {
                const adjacentKey = [key[0] + xOffset, key[1] - yOffset]; // Assuming y-axis increases downwards
                if (houses[adjacentKey] || rocks[adjacentKey] || trees[adjacentKey] || deadtrees[adjacentKey] || water[adjacentKey]) {   
                    // If any adjacent cell contains one of the objects, we can't place the house
                    canPlaceHouse = false;
                    break; // No need to check further, exit the loop
                }
            }
            if (!canPlaceHouse) {
                break; // No need to check further, exit the loop
            }
        }
        if (canPlaceHouse) {
            console.log('Can place house');
            housesPosition[key] = true;
            housesType[key] = 0;
        } else {
            console.log('Too Close to Another Object');
        }
    }
  }
  if (houses[key]) {
    if (placingHouse) {
      for (let i0 = -3; i0 < 4; i0++) {
        for (let j0 = -3; j0 < 4; j0++) {
          houses[[key[0] + i0, key[1] - j0]] = false;
          housesPosition[[key[0] + i0, key[1] - j0]] = false;
          housesType[[key[0] + i0, key[1] - j0]] = -1;
        }
      }
    }
  }

  // upgrade house
  if (houses[key]) {
    if (upgradeHouse) {
      for (let i0 = -3; i0 < 4; i0++) {
        for (let j0 = -3; j0 < 4; j0++) {
          if(housesPosition[[key[0] + i0, key[1] - j0]]){
            housesType[[key[0] + i0, key[1] - j0]]++;
            housesType[[key[0] + i0, key[1] - j0]] = housesType[[key[0] + i0, key[1] - j0]] % 4;
          }
        }
      }
    }
  }
}

function p3_drawBefore() {}

function p3_drawTile(i, j) {
  noStroke();
  
  let biomeType = getBiomeType(i, j);
  let row = 0;
  let col = 0;

  if (XXH.h32("tile:" + [i, j], worldSeed) % 21 == 0) {
    col = 1;
  }
  else if (XXH.h32("tile:" + [i, j], worldSeed) % 22 == 0) {
    col = 2;
  }
  else if (XXH.h32("tile:" + [i, j], worldSeed) % 23 == 0) {
    col = 3;
  }

  // different noise for path and farm plots
  if ((XXH.h32("tile:" + [i, j], worldSeed) % 4 == 0) && (biomeType == "pathTile" || biomeType == "farmTile")) {
    col = 1;
  }
  else if ((XXH.h32("tile:" + [i, j], worldSeed) % 5 == 0) && (biomeType == "pathTile" || biomeType == "farmTile")) {
    col = 2;
  }
  else if ((XXH.h32("tile:" + [i, j], worldSeed) % 6 == 0) && (biomeType == "pathTile" || biomeType == "farmTile")) {
    col = 3;
  }

  // Determine row based on biome type
  switch (biomeType) {
    case "farmTile":
      row = 10;
      break;
    case "pathTile":
      row = 14;
      break;
    case "water":
      row = 12;
      break;
    case "desert":
      row = 6;
      break;
    case "grassland":
      row = 0;
      break;
    case "mountain":
      row = 3;
      break;
    case "snow":
      row = 9;
      break;
  }

  if (biomeType === "water") {
    water[[i, j]] = true;
  }

  image(biomeTilesheet, 0, 0, 33, 33, 32 * col, 32 * row, 32, 32);

  applyAutotiling(i, j);

  push();

  beginShape();
  vertex(-tw, -th); // Top-left corner
  vertex(tw, -th);  // Top-right corner
  vertex(tw, th);   // Bottom-right corner
  vertex(-tw, th);  // Bottom-left corner
  endShape(CLOSE);

  
  // image(biomeTilesheet, 0, 0, 32.75, 32.75, 32 * col, 32 * row, 32, 32);

  let n = clicks[[i - 1, j - 1]] | 0;
  if (n % 2 == 1) {
    // beginShape();
    // fill(240, 200, 255);
    
    // translate(-tw, -th)
    // vertex(0, 0); // Top-left corner
    // vertex(tw, 0); // Top-right corner
    // vertex(tw, th); // Bottom-right corner
    // vertex(0, th); // Bottom-left corner
    // endShape(CLOSE);
  }

  pop();
}


function p3_drawSelectedTile(i, j) {
  noFill();
  stroke(0, 255, 0, 128);

  beginShape();
  translate(0, 0); // Center the tile around the cursor
  vertex(0, 0); // Top-left corner
  vertex(tw, 0); // Top-right corner
  vertex(tw, th); // Bottom-right corner
  vertex(0, th); // Bottom-left corner
  endShape(CLOSE);

  noStroke();
  fill(0);
  textAlign(CENTER, CENTER);
  text("tile " + [i, j], tw/2, th/2); // Center the text within the tile
}

function p3_drawAfter(i, j) {
  // trees, stone
  let orCol = 0;
  let orRow = 0;
  let hCol = 0;
  let hRow = 0;

  // Check adjacent tiles
  // Check adjacent and diagonal tiles
  const directions = [
    // Radius 1
    [1, 0],   // Right
    [-1, 0],  // Left
    [0, 1],   // Down
    [0, -1],  // Up
    [1, 1],   // Diagonal: Bottom-right
    [-1, 1],  // Diagonal: Bottom-left
    [-1, -1], // Diagonal: Top-left
    [1, -1],  // Diagonal: Top-right
  
    // Radius 2
    [2, 0],   // Right
    [-2, 0],  // Left
    [0, 2],   // Down
    [0, -2],  // Up
    [2, 2],   // Diagonal: Bottom-right
    [-2, 2],  // Diagonal: Bottom-left
    [-2, -2], // Diagonal: Top-left
    [2, -2],  // Diagonal: Top-right
  
    // Additional combinations within radius 2
    [2, 1],   // Right, then Down
    [2, -1],  // Right, then Up
    [-2, 1],  // Left, then Down
    [-2, -1], // Left, then Up
    [1, 2],   // Down, then Right
    [-1, 2],  // Down, then Left
    [1, -2],  // Up, then Right
    [-1, -2], // Up, then Left
  ];
  
  if (XXH.h32("tile:" + [i, j], worldSeed) % 50 == 0 && getBiomeType(i, j) === "grassland") {
    let isValidPosition = true;
    for (let [dx, dy] of directions) {
        const x = i + dx;
        const y = j + dy;
        if (treePosition[[x, y]] || deadtreePosition[[x, y]] || rockPosition[[x, y]] || getBiomeType(x, y) === "water") {
            isValidPosition = false;
            break; // Exit loop early since we found an adjacent or diagonal tile occupied by a tree
        }
    }
    if (isValidPosition) {
        treePosition[[i, j]] = true;
    } else {
        treePosition[[i, j]] = false; // Reset current tile to false if adjacent or diagonal tile is occupied by a tree
    }
  }
  else if (XXH.h32("tile:" + [i, j], worldSeed) % 51 == 0 && getBiomeType(i, j) === "desert") {
    let isValidPosition = true;
    for (let [dx, dy] of directions) {
        const x = i + dx;
        const y = j + dy;
        if (treePosition[[x, y]] || deadtreePosition[[x, y]] || rockPosition[[x, y]] || getBiomeType(x, y) === "water") {
            isValidPosition = false;
            break; // Exit loop early since we found an adjacent or diagonal tile occupied by a deadtree
        }
    }
    if (isValidPosition) {
        deadtreePosition[[i, j]] = true;
    } else {
        deadtreePosition[[i, j]] = false; // Reset current tile to false if adjacent or diagonal tile is occupied by a deadtree
    }
  }
  else if (XXH.h32("tile:" + [i, j], worldSeed) % 52 == 0 && getBiomeType(i, j) === "mountain") {
    let isValidPosition = true;
    for (let [dx, dy] of directions) {
        const x = i + dx;
        const y = j + dy;
        if (treePosition[[x, y]] || deadtreePosition[[x, y]] || rockPosition[[x, y]] || getBiomeType(x, y) === "water") {
            isValidPosition = false;
            break; // Exit loop early since we found an adjacent or diagonal tile occupied by a rock
        }
    }
    if (isValidPosition) {
        rockPosition[[i, j]] = true;
    } else {
        rockPosition[[i, j]] = false; // Reset current tile to false if adjacent or diagonal tile is occupied by a rock
    }
  }

  if (rockPosition[[i, j]] === true) {
    if (rocks[[i, j]] !== false) {
      orCol = 2;
      orRow = 0;
      for (let i0 = 0; i0 < 2; i0++) {  // Loop to cover 2x2 area
          for (let j0 = 0; j0 < 2; j0++) {  // Loop to cover 2x2 area
              rocks[[i + i0, j + j0]] = true;
          }
      }
      image(overworldResourcesTilesheet, 0, 0, 64, 64, orCol * 32 , orRow * 32, 32, 32); // This is fine, assuming it's just a visual representation
    }
    else {
      orCol = 0;
      orRow = 1;
      image(overworldResourcesTilesheet, 0, 0, 64, 64, orCol * 32 , orRow * 32, 32, 32);
    }
  }

  if (treePosition[[i, j]] === true) {
    if (trees[[i, j]] !== false) {
      orCol = 0;
      orRow = 0;
      for (let i0 = 0; i0 < 2; i0++) {  // Loop to cover 2x2 area
          for (let j0 = 0; j0 < 2; j0++) {  // Loop to cover 2x2 area
              trees[[i + i0, j + j0]] = true;
          }
      }
      image(overworldResourcesTilesheet, 0, 0, 64, 64, orCol * 32 , orRow * 32, 32, 32); // This is fine, assuming it's just a visual representation
    }
    else {
      orCol = 0;
      orRow = 1;
      image(overworldResourcesTilesheet, 0, 0, 64, 64, orCol * 32 , orRow * 32, 32, 32);
    }
  }

  if (deadtreePosition[[i, j]] === true) {
    if (deadtrees[[i, j]] !== false) {
      orCol = 1;
      orRow = 0;
      for (let i0 = 0; i0 < 2; i0++) {  // Loop to cover 2x2 area
          for (let j0 = 0; j0 < 2; j0++) {  // Loop to cover 2x2 area
              deadtrees[[i + i0, j + j0]] = true;
          }
      }
      image(overworldResourcesTilesheet, 0, 0, 64, 64, orCol * 32 , orRow * 32, 32, 32); // This is fine, assuming it's just a visual representation
    }
    else {
      orCol = 0;
      orRow = 1;
      image(overworldResourcesTilesheet, 0, 0, 64, 64, orCol * 32 , orRow * 32, 32, 32);
    }
  }

  if (fences[[i, j]] === true) {
    if (fences[[i, j]] !== false) {
      let col = 6;
      let row = 13;
      image(biomeTilesheet, 0, 0, 32.75, 32.75, 32 * col, 32 * row, 32, 32);
    }
    else {
      let col = 0;
      let row = 1;
      image(biomeTilesheet, 0, 0, 32.75, 32.75, 32 * col, 32 * row, 32, 32);
    } 
  }

  if (stonePaths[[i, j]] === true) {
    if (stonePaths[[i, j]] !== false) {
      let col = 10;
      let row = 13;
      image(biomeTilesheet, 0, 0, 32.75, 32.75, 32 * col, 32 * row, 32, 32);
    }
    else {
      let col = 0;
      let row = 1;
      image(biomeTilesheet, 0, 0, 32.75, 32.75, 32 * col, 32 * row, 32, 32);
    }
  }

  if (housesPosition[[i, j]] === true) {
    hCol = 1;
    hRow = 1;
    for (let i0 = 0; i0 < 4; i0++) {
      for (let j0 = 0; j0 < 4; j0++) {
        houses[[i + i0, j - j0]] = true;
        rocks[[i + i0, j - j0]] = false;
        trees[[i + i0, j - j0]] = false;
        deadtrees[[i + i0, j - j0]] = false;
        rockPosition[[i + i0, j - j0]] = false;
        treePosition[[i + i0, j - j0]] = false;
        deadtreePosition[[i + i0, j - j0]] = false;
      }
    }
    
    drawHouse(housesType[[i, j]]);  
  }

  else if (housesPosition[[i, j]] !== true){
    drawHouse(-1)
  }

  applyFenceAutotiling(i, j);

}

// draws the bottom half of the rock and trees again
function p3_drawAfter2(i, j) {
  // trees, stone
  let orCol = 0;
  let orRow = 0;
  let hCol = 0;
  let hRow = 0;

  if (rockPosition[[i, j]] === true) {
    if (rocks[[i, j]] !== false) {
      orCol = 2;
      orRow = 0;
      image(overworldResourcesTilesheet, 0, 0, 64, 32, orCol * 32, orRow * 32, 32, 16);
    }
    else {
      orCol = 0;
      orRow = 1;
      image(overworldResourcesTilesheet, 0, 0, 64, 64, orCol * 32 , orRow * 32, 32, 32);
    }
  }

  if (treePosition[[i, j]] === true) {
    if (trees[[i, j]] !== false) {
      orCol = 0;
      orRow = 0;
      image(overworldResourcesTilesheet, 0, 0, 64, 32, orCol * 32, orRow * 32, 32, 16);
    }
    else {
      orCol = 0;
      orRow = 1;
      image(overworldResourcesTilesheet, 0, 0, 64, 64, orCol * 32 , orRow * 32, 32, 32);
    }
  }

  if (deadtreePosition[[i, j]] === true) {
    if (deadtrees[[i, j]] !== false) {
      orCol = 1;
      orRow = 0;
      image(overworldResourcesTilesheet, 0, 0, 64, 32, orCol * 32, orRow * 32, 32, 16);
    }
    else {
      orCol = 0;
      orRow = 1;
      image(overworldResourcesTilesheet, 0, 0, 64, 64, orCol * 32 , orRow * 32, 32, 32);
    }  
  }
}

function applyAutotiling(i, j) {
  // First pass to apply autotiling
  let autotileCoords = getAutotileCoords(i, j);
  if (autotileCoords) {
    for (let i = 0; i < autotileCoords.length; i++) {
      let [col, row] = autotileCoords[i];
      image(biomeTilesheet, 0, 0, 33, 33, 32 * col, 32 * row, 32, 32);
    }
  }
}

function applyFenceAutotiling(i, j) {
  if (fences[[i, j]]) {
    let top = fences[[i, j - 1]];
    let bottom = fences[[i, j + 1]];
    let left = fences[[i - 1, j]];
    let right = fences[[i + 1, j]];

    let tileNeighbors = [];

    if (left) {
      tileNeighbors.push([7, 12]);
    } 

    if (right) {
      tileNeighbors.push([5, 12]);
    }

    if (bottom) {
      tileNeighbors.push([7, 14]);
    }
    
    if (top) {
      tileNeighbors.push([5, 14]);
    } 

    if (top && bottom) {
      tileNeighbors.push([7, 14]);
    }

    // Draw the appropriate tiles based on the tileNeighbors array
    for (let [col, row] of tileNeighbors) {
      image(biomeTilesheet, 0, 0, 32.75, 32.75, 32 * col, 32 * row, 32, 32);
    }
  }
}

function getBiomeType(i, j) {
  let noiseVal = noise(i * 0.05, j * 0.05);
  if (farmTiles[[i, j]]) {
    return "farmTile";
  } else if (pathTiles[[i, j]]) {
    return "pathTile";
  } else if (noiseVal < 0.2) {
    return "water";
  } else if (noiseVal < 0.4) {
    return "desert";;
  } else if (noiseVal < 0.6) {
    return "grassland";
  } else if (noiseVal < 0.8) {
    return "mountain";
  } else {
    return "grassland";
  }
}

function getAutotileCoords(i, j) {
  let neighbors = {
    topLeft: getBiomeType(i - 1, j - 1),
    top: getBiomeType(i, j - 1),
    topRight: getBiomeType(i + 1, j - 1),
    left: getBiomeType(i - 1, j),
    right: getBiomeType(i + 1, j),
    bottomLeft: getBiomeType(i - 1, j + 1),
    bottom: getBiomeType(i, j + 1),
    bottomRight: getBiomeType(i + 1, j + 1),
  };

  let tileNeighbors = [];

  if (getBiomeType(i, j) !== "grassland") {
    if (neighbors.top === "grassland") {
      tileNeighbors.push([6, 0]);
    } 
    
    if (neighbors.bottom === "grassland") {
      tileNeighbors.push([6, 2]);
    } 
    
    if (neighbors.left === "grassland") {
      tileNeighbors.push([5, 1]);
    } 
    
    if (neighbors.right === "grassland") {
      tileNeighbors.push([7, 1]);
    }
  }

  if (getBiomeType(i, j) !== "desert") {
    if (neighbors.top === "desert" && getBiomeType(i, j) !== "grassland") {
      tileNeighbors.push([6, 6]);
    } 
    
    if (neighbors.bottom === "desert" && getBiomeType(i, j) !== "grassland") {
      tileNeighbors.push([6, 8]);
    } 
    
    if (neighbors.left === "desert" && getBiomeType(i, j) !== "grassland") {
      tileNeighbors.push([5, 7]);
    } 
    
    if (neighbors.right === "desert" && getBiomeType(i, j) !== "grassland") {
      tileNeighbors.push([7, 7]);
    }
  }

  if (getBiomeType(i, j) !== "mountain") {
    if (neighbors.top === "mountain" && getBiomeType(i, j) !== "grassland" && getBiomeType(i, j) !== "desert") {
      tileNeighbors.push([6, 3]);
    } 
    
    if (neighbors.bottom === "mountain" && getBiomeType(i, j) !== "grassland" && getBiomeType(i, j) !== "desert") {
      tileNeighbors.push([6, 5]);
    } 
    
    if (neighbors.left === "mountain" && getBiomeType(i, j) !== "grassland" && getBiomeType(i, j) !== "desert") {
      tileNeighbors.push([5, 4]);
    } 
    
    if (neighbors.right === "mountain" && getBiomeType(i, j) !== "grassland" && getBiomeType(i, j) !== "desert") {
      tileNeighbors.push([7, 4]);
    }
  }
  return tileNeighbors;
}

function getResourceInfo() {
  return [wood, stone, gathering, rocks, trees, deadtrees, houses, water, fences];
}

function startGathering() {
  startMillis = millis();
  gathering = true;
}

function updateGathering() {
  if (gathering) {
    const elapsedTime = millis() - startMillis;
    if (elapsedTime >= gatheringDuration) {
      gathering = false;
    }
  }
}

function drawHouse(houseType) {
  let col = 1;
  let row = 1

  if (houseType === 0) {
    col = 1;
    row = 1;
    image(housesTilesheet, 0, -32 * 3, 128, 128, col * 32 , row * 32, 32, 32);
  }
  else if (houseType === 1) {
    col = 0;
    row = 0;
    image(housesTilesheet, 0, -32 * 3, 128, 128, col * 32 , row * 32, 32, 32);
  }
  else if (houseType === 2) {
    col = 0;
    row = 1;
    image(housesTilesheet, 0, -32 * 3, 128, 128, col * 32 , row * 32, 32, 32);
  }
  else if (houseType === 3) {
    col = 1;
    row = 0;
    image(housesTilesheet, 0, -32 * 3, 128, 128, col * 32 , row * 32, 32, 32);
  }
  else {
    image(housesTilesheet, 0, 0, 1, 1, 0, 0, 1, 1);
  }
}

function action(newState) {
  placingHouse = false;
  upgradeHouse = false;
  placingPathTiles = false;
  placingFarmTiles = false;
  placingFence = false;
  placingStonePaths = false

  if (newState === 'placingHouse') {
    placingHouse = true;
  } else if (newState === 'upgradeHouse') {
    upgradeHouse = true;
  } else if (newState === 'placingPathTiles') {
    placingPathTiles = true;
  } else if (newState === 'placingFarmTiles') {
    placingFarmTiles = true;
  } else if (newState === 'placingFence') {
    placingFence = true;
  } else if (newState === 'placingStonePaths') {
    placingStonePaths = true;
  }
}