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
    getResourceInfo
    startGathering
    updateGathering
*/

function p3_preload() {
  biomeTilesheet = loadImage("./assets/biomes.png");
  resourceTilesheet = loadImage("./assets/resources.png");
  overworldResourcesTilesheet = loadImage("./assets/overworld_resources.png")
  // biomeTilesheet = loadImage("https://cdn.glitch.global/89835fff-f6de-48e0-bb2e-674d0cfb96b8/biomes.png?v=1716690336341");
}

function p3_setup() {}

let worldSeed;
let player;
let playerSize = 32; // Size of the player square
let playerPosition; // Tile coordinates of the player

let biomeTilesheet;
let resourceTilesheet;
let overworldResourcesTilesheet;

let startMillis = 0;
let gathering = false;
const gatheringDuration = 1500; // 5 seconds in milliseconds
let wood = 0;
let stone = 0;
let rocks = {}; // Object to track tiles with rocks
let trees = {}; // Object to track tiles with trees


function p3_worldKeyChanged(key) {
  worldSeed = XXH.h32(key, 0);
  noiseSeed(worldSeed);
  randomSeed(worldSeed);
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
      [playerX, playerY], // Player's current tile
      //1
      [playerX + 1, playerY + 1], 
      [playerX + 1, playerY + 2], 
      [playerX + 2, playerY + 1], 
      [playerX + 2, playerY + 2], 
      //2
      [playerX, playerY + 1], 
      [playerX, playerY + 2], 
      [playerX + 1, playerY + 1], 
      [playerX + 1, playerY + 2], 
      //3
      [playerX, playerY + 1], 
      [playerX, playerY + 2], 
      [playerX - 1, playerY + 1], 
      [playerX - 1, playerY + 2], 
      //4
      [playerX - 1, playerY + 1], 
      [playerX - 1, playerY + 2], 
      [playerX - 2, playerY + 1], 
      [playerX - 2, playerY + 2], 
      //5
      [playerX - 1, playerY], 
      [playerX - 1, playerY + 1], 
      [playerX - 2, playerY], 
      [playerX - 2, playerY + 1], 
      //6
      [playerX - 1, playerY], 
      [playerX - 1, playerY - 1], 
      [playerX - 2, playerY], 
      [playerX - 2, playerY - 1], 
      //7
      [playerX - 1, playerY - 1], 
      [playerX - 1, playerY - 2], 
      [playerX - 2, playerY - 1], 
      [playerX - 2, playerY - 2], 
      //8
      [playerX, playerY - 1], 
      [playerX, playerY - 2], 
      [playerX - 1, playerY - 1], 
      [playerX - 1, playerY - 2], 
      //9
      [playerX, playerY - 1], 
      [playerX, playerY - 2], 
      [playerX + 1, playerY - 1], 
      [playerX + 1, playerY - 2], 
      //10
      [playerX + 1, playerY - 1], 
      [playerX + 1, playerY - 2], 
      [playerX + 2, playerY - 1], 
      [playerX + 2, playerY - 2], 
      //11
      [playerX + 1, playerY], 
      [playerX + 1, playerY - 1], 
      [playerX + 2, playerY], 
      [playerX + 2, playerY - 1], 
      //12
      [playerX + 1, playerY], 
      [playerX + 1, playerY + 1], 
      [playerX + 2, playerY], 
      [playerX + 2, playerY + 1], 
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

  // Check if the clicked tile has a rock
  if (playerNextToRock) {
    // Check if the clicked tile or any of its adjacent tiles are rocks
    if (adjacentTiles.some(tile => rocks[tile] && (tile[0] === i || tile[0] === i - 1) && (tile[1] === j || tile[1] === j - 1))) {
      // If it's a rock, perform your action (increment stone count, remove image, etc.)
      stone++;
      // Reset the rock status for the clicked tile and its adjacent tiles
      [key, [i - 1, j], [i - 1, j - 1], [i, j - 1]].forEach(tile => {
        if (rocks[tile]) {
          rocks[tile] = false;
        }
      });
      startGathering();
    }
  }
  
  // Check if the clicked tile has a tree
  else if (playerNextToTree) {
    // Check if the clicked tile or any of its adjacent tiles are trees
    if (adjacentTiles.some(tile => trees[tile] && (tile[0] === i || tile[0] === i - 1) && (tile[1] === j || tile[1] === j - 1))) {
      // If it's a tree, perform your action (increment wood count, remove image, etc.)
      wood++;
      // Reset the tree status for the clicked tile and its adjacent tiles
      [key, [i - 1, j], [i - 1, j - 1], [i, j - 1]].forEach(tile => {
        if (trees[tile]) {
          trees[tile] = false;
        }
      });
      startGathering();
    }
  }

  else {
    // Treat the click as a regular tile click
    clicks[key] = 1 + (clicks[key] || 0);
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
    // fill(240, 200);
  }
  else if (XXH.h32("tile:" + [i, j], worldSeed) % 22 == 0) {
    col = 2;
    // fill(240, 200);
  }
  else if (XXH.h32("tile:" + [i, j], worldSeed) % 23 == 0) {
    col = 3;
    // fill(240, 200);
  }
  else {
    // fill(255, 200);
    
  }

  // Determine row based on biome type
  switch (biomeType) {
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
    beginShape();
    fill(240, 200, 255);
    
    translate(-tw, -th)
    vertex(0, 0); // Top-left corner
    vertex(tw, 0); // Top-right corner
    vertex(tw, th); // Bottom-right corner
    vertex(0, th); // Bottom-left corner
    endShape(CLOSE);
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
  if (XXH.h32("tile:" + [i, j], worldSeed) % 50 == 0 && getBiomeType(i, j) === "grassland") {
    if (trees[[i, j]] !== false){
      orCol = 0;
      orRow = 0;
      trees[[i, j]] = true;
      image(overworldResourcesTilesheet, 0, 0, 64, 64, orCol * 32 , orRow * 32, 32, 32);
    }
    else {
      orCol = 0;
      orRow = 1;
      image(overworldResourcesTilesheet, 0, 0, 64, 64, orCol * 32 , orRow * 32, 32, 32);
    }
  }
  else if (XXH.h32("tile:" + [i, j], worldSeed) % 50 == 0 && getBiomeType(i, j) === "desert") {
    if (trees[[i, j]] !== false){
      orCol = 1;
      orRow = 0;
      trees[[i, j]] = true;
      image(overworldResourcesTilesheet, 0, 0, 64, 64, orCol * 32 , orRow * 32, 32, 32);
    }
    else {
      orCol = 0;
      orRow = 1;
      image(overworldResourcesTilesheet, 0, 0, 64, 64, orCol * 32 , orRow * 32, 32, 32);
    }
  }
  else if (XXH.h32("tile:" + [i, j], worldSeed) % 50 == 0 && getBiomeType(i, j) === "mountain") {
    if (rocks[[i, j]] !== false){
      orCol = 2;
      orRow = 0;
      rocks[[i, j]] = true;
      image(overworldResourcesTilesheet, 0, 0, 64, 64, orCol * 32 , orRow * 32, 32, 32);
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

function getBiomeType(i, j) {
  let noiseVal = noise(i * 0.05, j * 0.05);
  if (noiseVal < 0.2) {
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
    if (neighbors.top === "grassland" && neighbors.left === "grassland") {
      tileNeighbors.push([5, 0]);
    } 
    
    if (neighbors.top === "grassland" && neighbors.right === "grassland") {
      tileNeighbors.push([7, 0]);
    } 
    
    if (neighbors.bottom === "grassland" && neighbors.left === "grassland") {
      tileNeighbors.push([5, 2]);
    } 
    
    if (neighbors.bottom === "grassland" && neighbors.right === "grassland") {
      tileNeighbors.push([7, 2]);
    } 
    
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
    if (neighbors.top === "desert" && neighbors.left === "desert" && getBiomeType(i, j) !== "grassland") {
      tileNeighbors.push([5, 6]);
    } 
    
    if (neighbors.top === "desert" && neighbors.right === "desert" && getBiomeType(i, j) !== "grassland") {
      tileNeighbors.push([7, 6]);
    } 
    
    if (neighbors.bottom === "desert" && neighbors.left === "desert" && getBiomeType(i, j) !== "grassland") {
      tileNeighbors.push([5, 8]);
    } 
    
    if (neighbors.bottom === "desert" && neighbors.right === "desert" && getBiomeType(i, j) !== "grassland") {
      tileNeighbors.push([7, 8]);
    } 
    
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
    if (neighbors.top === "mountain" && neighbors.left === "mountain" && getBiomeType(i, j) !== "grassland" && getBiomeType(i, j) !== "desert") {
      tileNeighbors.push([5, 3]);
    } 
    
    if (neighbors.top === "mountain" && neighbors.right === "mountain" && getBiomeType(i, j) !== "grassland" && getBiomeType(i, j) !== "desert") {
      tileNeighbors.push([7, 3]);
    } 
    
    if (neighbors.bottom === "mountain" && neighbors.left === "mountain" && getBiomeType(i, j) !== "grassland" && getBiomeType(i, j) !== "desert") {
      tileNeighbors.push([5, 5]);
    } 
    
    if (neighbors.bottom === "mountain" && neighbors.right === "mountain" && getBiomeType(i, j) !== "grassland" && getBiomeType(i, j) !== "desert") {
      tileNeighbors.push([7, 5]);
    } 
    
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
  return [wood, stone, gathering, rocks, trees];
}

function startGathering() {
  startMillis = millis();
  gathering = true;
}

function updateGathering() {
  if (gathering) {
    const elapsedTime = millis() - startMillis;
    console.log('Elapsed time:', elapsedTime);
    if (elapsedTime >= gatheringDuration) {
      gathering = false;
      console.log('Done gathering');
    }
  }
}