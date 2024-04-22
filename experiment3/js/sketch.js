// sketch.js - purpose and description here
// Author: Your Name
// Date:

// Here is how you might set up an OOP p5.js project
// Note that p5.js looks for a file called sketch.js

// Constants - User-servicable parts
let seed = 0;
let tilesetImage;
let currentGrid = [];
let numRows, numCols;

const lookup = [
  [1, 1],
  [1, 0], // bottom
  [0, 1], // right
  [0, 0], // right+bottom
  [2, 1], // left
  [2, 0], // left+bottom
  [1, 1],
  [1, 0], // * 
  [1, 2], // top
  [1, 1],
  [0, 2], // right+top
  [0, 1], // *
  [2, 2], // top+left
  [2, 1], // *
  [1, 2], // *
  [1, 1]
];

let houseColor = 0;
let num = 0; // 0 = spring, 1 = summer, 2 = autumn, 3 = winter
let season = 0;
let currentSecond = 0;
let lastSecond = -1;
let version = 0; // 0 = overworld, 1 = dungeon

function resizeScreen() {
  centerHorz = canvasContainer.width() / 2; // Adjusted for drawing logic
  centerVert = canvasContainer.height() / 2; // Adjusted for drawing logic
  console.log("Resizing...");
  resizeCanvas(canvasContainer.width(), canvasContainer.height());
  // redrawCanvas(); // Redraw everything based on new size
}

// setup() function is called once when the program starts
function setup() {
  // place our canvas, making it fit our container
  canvasContainer = $("#canvas-container");
  let canvas = createCanvas(canvasContainer.width(), canvasContainer.height());
  canvas.parent("canvas-container");
  // resize canvas is the page is resized

  $(window).resize(function() {
    resizeScreen();
  });
  resizeScreen();

  numCols = select("#asciiBox").attribute("rows") | 0;
  numRows = select("#asciiBox").attribute("cols") | 0;

  createCanvas(16 * numCols, 16 * numRows).parent("canvasContainer");
  select("canvas").elt.getContext("2d").imageSmoothingEnabled = false;

  select("#reseedButton").mousePressed(reseed);
  select("#asciiBox").input(reparseGrid);

  reseed();
}

// draw() function is called repeatedly, it's the main animation loop
function draw() {
  randomSeed(seed);
  drawGrid(currentGrid);

  select("#dungeonButton").mousePressed(() => {
    version = 1;
    regenerateGrid();
  });
  select("#overworldButton").mousePressed(() => {
    version = 0
    regenerateGrid();
  });
}

function preload() {
  tilesetImage = loadImage(
    "./assets/tileset.png"
  );
}

function reseed() {
  seed = (seed | 0) + Math.floor(Math.random() * 999) + 1;
  randomSeed(seed);
  noiseSeed(seed);
  select("#seedReport").html("seed " + seed);
  regenerateGrid();
}

function regenerateGrid() {
  select("#asciiBox").value(gridToString(generateGrid(numCols, numRows)));
  reparseGrid();
}

function reparseGrid() {
  currentGrid = stringToGrid(select("#asciiBox").value());
}

function gridToString(grid) {
  let rows = [];
  for (let i = 0; i < grid.length; i++) {
    rows.push(grid[i].join(""));
  }
  return rows.join("\n");
}

function stringToGrid(str) {
  let grid = [];
  let lines = str.split("\n");
  for (let i = 0; i < lines.length; i++) {
    let row = [];
    let chars = lines[i].split("");
    for (let j = 0; j < chars.length; j++) {
      row.push(chars[j]);
    }
    grid.push(row);
  }
  return grid;
}


function placeTile(i, j, ti, tj) {
  image(tilesetImage, 16 * j, 16 * i, 16, 16, 8 * ti, 8 * tj, 8, 8);
  
}


function generateGrid(numCols, numRows) {
  if (version == 0) {
    let grid = [];
    let housePlaced = false; // Flag to track if the house ("h") has been placed
    let duckPlaced = false;

    for (let i = 0; i < numRows; i++) {
      let row = [];
      for (let j = 0; j < numCols; j++) {
        let outerValue = noise(i / 50, j / 50);
        let innerValue = noise(i / 20, j / 20);

        // Determine the tile type based on noise values
        let tileType = ".";
        if (outerValue > 0.5 && innerValue > 0.4) {
          tileType = "w";
        } else if (innerValue > 0.55) {
          tileType = ":";
        }

        // Place trees ("t") with lower density
        if (tileType === "." && Math.random() < 0.1) {
          tileType = "t";
        }

        row.push(tileType);
      }
      grid.push(row);
    }

    // Find a suitable position to place the house ("h")
    let centerRow = Math.floor(numRows / 2);
    let centerCol = Math.floor(numCols / 2);

    if (canPlaceHouse(grid, centerRow, centerCol)) {
      grid[centerRow][centerCol] = "h"; // Place the house in the center
      housePlaced = true;
    } else {
      // If the center is not a valid placement, try finding another suitable position
      for (let i = 1; i < numRows - 1 && !housePlaced; i++) {
        for (let j = 1; j < numCols - 1 && !housePlaced; j++) {
          if (canPlaceHouse(grid, i, j)) {
            grid[i][j] = "h"; // Place the house
            houseColor = Math.floor(Math.random() * 4);
            housePlaced = true;
          }
        }
      }
    }

    if (canPlaceDuck(grid, centerRow, centerCol)) {
      grid[centerRow][centerCol] = "d"; // Place the duck in the center
      duckPlaced = true;
    } else {
      // If the center is not a valid placement, try finding another suitable position
      for (let i = 1; i < numRows - 1 && !duckPlaced; i++) {
        for (let j = 1; j < numCols - 1 && !duckPlaced; j++) {
          if (canPlaceDuck(grid, i, j)) {
            grid[i][j] = "d"; // Place the duck
            duckPlaced = true;
          }
        }
      }
    }

    // Adjust noise parameters for lily pad placement
    const lilyPadNoiseScale = 0.1; // Noise scale for lily pad placement
    const lilyPadThreshold = 0.6; // Noise threshold for lily pad placement

    for (let i = 1; i < numRows - 1; i++) {
      for (let j = 1; j < numCols - 1; j++) {
        // Use noise values with adjusted scale for lily pad placement
        let lilyPadNoise = noise(i * lilyPadNoiseScale, j * lilyPadNoiseScale);

        if (canPlaceLilyPad(grid, i, j) && lilyPadNoise > lilyPadThreshold) {
          grid[i][j] = "l"; // Place the lilyPad
        }
      }
    }

    return grid;
  }
  
  else if (version == 1) {
    let grid = [];

    // Initialize grid with default tiles (corridors)
    for (let i = 0; i < numRows; i++) {
      let row = [];
      for (let j = 0; j < numCols; j++) {
        row.push('.');
      }
      grid.push(row);
    }

    const maxAttempts = 10; // Maximum attempts to place each room
    const numRooms = 4;

    // Attempt to place multiple rooms within the grid
    for (let roomCount = 0; roomCount < numRooms; roomCount++) {
      let roomPlaced = false;
      let attempts = 0;

      while (!roomPlaced && attempts < maxAttempts) {
        // Generate random room parameters
        const roomWidth = Math.floor(random(5, 7)); // Random room width between 5 and 10
        const roomHeight = Math.floor(random(5, 7)); // Random room height between 5 and 10
        const roomX = Math.floor(random(numCols - roomWidth)); // Random room X coordinate
        const roomY = Math.floor(random(numRows - roomHeight)); // Random room Y coordinate

        // Check if the room fits within the grid bounds and does not overlap with existing rooms or their borders
        if (!roomTouchesOtherRooms(grid, roomX, roomY, roomWidth, roomHeight) && !roomTouchesBorders(grid, roomX, roomY, roomWidth, roomHeight)) {
          // Place room and border tiles in the grid
          for (let y = roomY; y < roomY + roomHeight; y++) {
            for (let x = roomX; x < roomX + roomWidth; x++) {
              if (y === roomY || y === roomY + roomHeight - 1 || x === roomX || x === roomX + roomWidth - 1) {
                grid[y][x] = '='; // Place border tiles around the room
              } else {
                grid[y][x] = '+'; // Place room tiles
              }
            }
          }

          // Place doors (d) at the center of each wall of the room
          const doorPositions = [
            { x: roomX + Math.floor(roomWidth / 2), y: roomY }, // Top wall
            { x: roomX + roomWidth - 1, y: roomY + Math.floor(roomHeight / 2) }, // Right wall
            { x: roomX + Math.floor(roomWidth / 2), y: roomY + roomHeight - 1 }, // Bottom wall
            { x: roomX, y: roomY + Math.floor(roomHeight / 2) } // Left wall
          ];

          for (const pos of doorPositions) {
            const { x, y } = pos;
            if (isWithinBounds(grid, y, x)) {
              grid[y][x] = 'd'; // Place door (d) at the center of each wall
              extendCorridor(grid, x, y); // Extend corridors from the door
            }
          }

          // Replace one '+' with either 'c' or 'g' in this room
          let replaced = false;
          while (!replaced) {
            const replaceX = roomX + Math.floor(random(roomWidth));
            const replaceY = roomY + Math.floor(random(roomHeight));
            
            // Check if the chosen '+' tile is valid (not touching any 'd' tile)
            if (grid[replaceY][replaceX] === '+') {
              let touchingDoor = false;

              // Check all adjacent tiles (including diagonals)
              for (let dy = -1; dy <= 1 && !touchingDoor; dy++) {
                for (let dx = -1; dx <= 1 && !touchingDoor; dx++) {
                  const nx = replaceX + dx;
                  const ny = replaceY + dy;

                  // Check if the adjacent tile is a 'd' tile
                  if (isWithinBounds(grid, ny, nx) && grid[ny][nx] === 'd') {
                    touchingDoor = true;
                  }
                }
              }

              // If the chosen '+' tile is valid (not touching any 'd' tile), replace it with 'c' or 'g'
              if (!touchingDoor) {
                const replacementChar = Math.random() < 0.5 ? 'c' : 'g';
                grid[replaceY][replaceX] = replacementChar;
                replaced = true;
              }
            }
          }

          roomPlaced = true; // Room successfully placed
        }

        attempts++;
      }
    }

    // Replace '>' characters touching the border with '.'
    for (let i = 0; i < numRows; i++) {
      for (let j = 0; j < numCols; j++) {
        if (grid[i][j] === '>' && isTouchingBorder(grid, i, j)) {
          grid[i][j] = '.'; // Replace '>' with '.' if touching the border
        }
      }
    }
    
    for (let i = 0; i < numRows; i++) {
      grid = trimExtraCorridors(grid);
    }
    
    grid = replaceDNotTouchingArrow(grid);
    return grid;
  }
}

function drawGrid(grid) {
  if (version == 0) {
    background(128);
    const g = 10;
    const t = millis() / 1000.0;

    noStroke();
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        if (season == 3) {
          placeTile(i, j, 20, 12); // ice
        }
        else {
          placeTile(i, j, (4 * pow(noise(t / 10, i, j / 4 + t), 2)) | 0, 14); // water
        }


        if (gridCheck(grid, i, j, ":")) { // dirt
          if (season == 3) {
            placeTile(i, j, (4 * pow(random(), g)) | 0, 12);
          }
          else {
            placeTile(i, j, (4 * pow(random(), g)) | 0, 3);
          }
        } else {
          // Check if the tile is not near a duck
          if (!isNearDuck(grid, i, j) && !isNearLilyPad(grid, i, j)) {

            if (season == 3) {
              drawContext(grid, i, j, "w", 9, 12, true);
            }
            else {
              drawContext(grid, i, j, "w", 9, 3, true);
            }

          } 
        }


        if (gridCheck(grid, i, j, ".")) { // grass
          if (season == 1) {
            placeTile(i, j, (4 * pow(random(), g)) | 0, 0);
          }
          else if (season == 2) {
            placeTile(i, j, (4 * pow(random(), g)) | 0, 6);
          }
          else if (season == 3) {
            placeTile(i, j, (4 * pow(random(), g)) | 0, 12);
          }
          else {
            placeTile(i, j, (4 * pow(random(), g)) | 0, 1);
          }
        } 

        else {
          // Check if the tile is not near a duck
          if (!isNearDuck(grid, i, j)) {
            if (season == 2) {
              drawContext(grid, i, j, ".", 4, 6);
            }
            else if (season == 3) {
              drawContext(grid, i, j, ".", 4, 12);
            }
            else {
              drawContext(grid, i, j, ".", 4, 0);
            }
          }
        }

        // Check if the current tile is the house ("h")
        if (grid[i][j] === "h") {
          if (season == 1) {
            placeTile(i, j, (4 * pow(random(), g)) | 0, 0);
            placeTile(i, j, 26, houseColor);
          }
          else if (season == 2) {
            placeTile(i, j, (4 * pow(random(), g)) | 0, 6);
            placeTile(i, j, 26, houseColor);
          }
          else if (season == 3) {
            placeTile(i, j, (4 * pow(random(), g)) | 0, 12);
            placeTile(i, j, 27, houseColor);
          }
          else {
            placeTile(i, j, (4 * pow(random(), g)) | 0, 0);
            placeTile(i, j, 26, houseColor);
          }

        }

        // Check if the current tile is the tree ("t")
        if (grid[i][j] === "t") {
          if (season == 1) {
            placeTile(i, j, (4 * pow(random(), g)) | 0, 0);
            placeTile(i, j, 14, 0);
          }
          else if (season == 2) {
            placeTile(i, j, (4 * pow(random(), g)) | 0, 6);
            placeTile(i, j, 14, 3);
          }
          else if (season == 3) {
            placeTile(i, j, (4 * pow(random(), g)) | 0, 12);
            placeTile(i, j, 14, 12);
          }
          else {
            placeTile(i, j, (4 * pow(random(), g)) | 0, 0);
            placeTile(i, j, 14, 9);
          }
        }

        // Check if the current tile is the duck ("d")
        if (grid[i][j] === "d") {
          if (season !== 3) {
            placeTile(i, j, 8, 28);
          }
        } 

        // Check if the current tile is the lilypad ("l")
        if (grid[i][j] === "l") {
          if (season !== 3) {
            placeTile(i, j, 8, 29);
          }
        } 
      }
    }

    // Update house texture variation periodically
    currentSecond = floor(millis() / 5000)
    if (currentSecond !== lastSecond) { // Change texture every 5 seconds (5000 milliseconds)
      lastSecond = currentSecond;
      // season = 1;
      num++; // Increment to change seasons
      season = num % 4;
    }
  }
  
  if (version == 1) {
    background(128);

    noStroke();
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        // Draw tiles based on grid content
        if (grid[i][j] === '=') {
          placeTile(i, j, 1, 21); // Draw wall tiles
        } else if (grid[i][j] === 'd') {
          placeTile(i, j, 5, 27); // Draw door tiles
        } else if (grid[i][j] === '+') {
          placeTile(i, j, 0, 22); // Draw floor tiles
        } else if (grid[i][j] === '.') {
          placeTile(i, j, 20, 23); // Draw corridor tiles
        } else if (grid[i][j] === '>') {
          placeTile(i, j, 8, 24); // Draw '>' for valid corridors
        } else if (grid[i][j] === 'c') {
          placeTile(i, j, 0, 22);
          placeTile(i, j, 5, 28); // Draw chest
        } else if (grid[i][j] === 'g') {
          placeTile(i, j, 0, 22);
          placeTile(i, j, 8, 30); // Draw goblin
        }
      }
    }
  }
}

function drawContext(grid, i, j, target, dti, dtj, invert = false) {
  let code = gridCode(grid, i, j, target);
  if (invert) {
    code = ~code & 0xf;
  }
  let [ti,tj] = lookup[code];
  placeTile(i, j, dti + ti, dtj + tj);
}



function gridCode(grid, i, j, target) {
  return (
    (gridCheck(grid, i - 1, j, target) << 0) +
    (gridCheck(grid, i, j - 1, target) << 1) +
    (gridCheck(grid, i, j + 1, target) << 2) +
    (gridCheck(grid, i + 1, j, target) << 3)
  );
}

function gridCheck(grid, i, j, target) {
  if (i >= 0 && i < grid.length && j >= 0 && j < grid[i].length) {
    return grid[i][j] == target;
  } else {
    return false;
  }
}


// Function to check if the house can be placed at a specific location
function canPlaceHouse(grid, i, j) {
  // Check if (i, j) is within the grid bounds and surrounded by "." tiles
  if (i >= 1 && i < grid.length - 1 && j >= 1 && j < grid[0].length - 1) {
    for (let r = i - 1; r <= i + 1; r++) {
      for (let c = j - 1; c <= j + 1; c++) {
        if (grid[r][c] !== ".") {
          return false; // Surrounding area contains a non-"." tile
        }
      }
    }
    return true; // All surrounding tiles are "."
  }
  return false; // Outside valid placement range
}

// Function to check if a "d" tile can be placed at a specific location surrounded by a 5x5 cluster of "w" tiles
function canPlaceDuck(grid, i, j) {
  // Check if (i, j) is within the grid bounds and surrounded by "w" tiles in a 5x5 area
  if (i >= 2 && i < grid.length - 2 && j >= 2 && j < grid[0].length - 2) {
    for (let r = i - 2; r <= i + 2; r++) {
      for (let c = j - 2; c <= j + 2; c++) {
        if (grid[r][c] !== "w") {
          return false; // Surrounding area contains a non-"w" tile
        }
      }
    }
    return true; // All surrounding tiles are "w"
  }
  return false; // Outside valid placement range
}

// Function to check if a tile is near any duck ("d") in the grid
function isNearDuck(grid, i, j) {
  const distanceThreshold = 1; // Adjust as needed
  for (let r = i - distanceThreshold; r <= i + distanceThreshold; r++) {
    for (let c = j - distanceThreshold; c <= j + distanceThreshold; c++) {
      if (grid[r] && grid[r][c] === "d") {
        return true;
      }
    }
  }
  return false;
}

function canPlaceLilyPad(grid, i, j) {
  // Check if (i, j) is within the grid bounds and surrounded by "w" tiles in a 5x5 area
  if (i >= 2 && i < grid.length - 2 && j >= 2 && j < grid[0].length - 2) {
    for (let r = i - 2; r <= i + 2; r++) {
      for (let c = j - 2; c <= j + 2; c++) {
        if (grid[r][c] !== "w") {
          return false; // Surrounding area contains a non-"w" tile
        }
      }
    }
    return true; // All surrounding tiles are "w"
  }
  return false; // Outside valid placement range
}

// Function to check if a tile is near any lilyPad ("l") in the grid
function isNearLilyPad(grid, i, j) {
  const distanceThreshold = 1; // Adjust as needed
  for (let r = i - distanceThreshold; r <= i + distanceThreshold; r++) {
    for (let c = j - distanceThreshold; c <= j + distanceThreshold; c++) {
      if (grid[r] && grid[r][c] === "l") {
        return true;
      }
    }
  }
  return false;
}

function replaceDNotTouchingArrow(grid) {
  const numRows = grid.length;
  const numCols = grid[0].length;

  // Create a copy of the grid to modify
  let updatedGrid = [];
  for (let i = 0; i < numRows; i++) {
    updatedGrid.push([...grid[i]]);
  }

  // Iterate over each cell in the grid
  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numCols; j++) {
      if (grid[i][j] === 'd') {
        // Check if the 'd' tile is not touching '>'
        let touchingArrow = false;

        // Check surrounding cells for '>'
        if (i > 0 && grid[i - 1][j] === '>') touchingArrow = true; // Up
        if (i < numRows - 1 && grid[i + 1][j] === '>') touchingArrow = true; // Down
        if (j > 0 && grid[i][j - 1] === '>') touchingArrow = true; // Left
        if (j < numCols - 1 && grid[i][j + 1] === '>') touchingArrow = true; // Right

        // If 'd' is not touching '>', replace it
        if (!touchingArrow) {
          updatedGrid[i][j] = '='; // Replace 'd' with '.'
        }
      }
    }
  }

  return updatedGrid;
}


// Check if a given position is within the grid bounds
function isWithinBounds(grid, y, x) {
  return y >= 0 && y < grid.length && x >= 0 && x < grid[0].length;
}

// Check if placing a room at the specified position would overlap with existing rooms or their borders
function roomTouchesOtherRooms(grid, roomX, roomY, roomWidth, roomHeight) {
  for (let y = roomY - 1; y < roomY + roomHeight + 1; y++) {
    for (let x = roomX - 1; x < roomX + roomWidth + 1; x++) {
      if (isWithinBounds(grid, y, x) && grid[y][x] !== '.') {
        return true; // Room would overlap with existing room or border
      }
    }
  }
  return false;
}

// Check if placing a room at the specified position would touch the grid borders
function roomTouchesBorders(grid, roomX, roomY, roomWidth, roomHeight) {
  return (
    roomX <= 0 ||
    roomY <= 0 ||
    roomX + roomWidth >= grid[0].length - 1 ||
    roomY + roomHeight >= grid.length - 1
  );
}

// Extend corridors from a door position
function extendCorridor(grid, doorX, doorY) {
  const directions = [
    { dx: 0, dy: -1 }, // Up
    { dx: 1, dy: 0 },  // Right
    { dx: 0, dy: 1 },  // Down
    { dx: -1, dy: 0 }  // Left
  ];

  for (const dir of directions) {
    let x = doorX + dir.dx;
    let y = doorY + dir.dy;

    while (isWithinBounds(grid, y, x) && grid[y][x] === '.') {
      grid[y][x] = '>'; // Extend corridor with '>'
      x += dir.dx;
      y += dir.dy;
    }
  }
}

function trimExtraCorridors(grid) {
  const numRows = grid.length;
  const numCols = grid[0].length;
  const directions = [
    { dx: 0, dy: -1 }, // Up
    { dx: 1, dy: 0 },  // Right
    { dx: 0, dy: 1 },  // Down
    { dx: -1, dy: 0 }  // Left
  ];

  // Create a copy of the grid to modify
  let updatedGrid = [];
  for (let i = 0; i < numRows; i++) {
    updatedGrid.push([...grid[i]]);
  }

  // Iterate over each cell in the grid
  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numCols; j++) {
      if (grid[i][j] === '>') {
        let adjacentDotCount = 0;

        // Check adjacent cells for '.' tiles
        for (const dir of directions) {
          const nx = j + dir.dx;
          const ny = i + dir.dy;
          if (isWithinBounds(grid, ny, nx) && grid[ny][nx] === '.') {
            adjacentDotCount++;
          }
        }

        // If touching 3 or more '.' tiles, trim the corridor
        if (adjacentDotCount >= 3) {
          updatedGrid[i][j] = '.'; // Replace '>' with '.'
        }
      }
    }
  }
  return updatedGrid;
  
}

// Check if a tile is touching the grid border
function isTouchingBorder(grid, y, x) {
  const numRows = grid.length;
  const numCols = grid[0].length;

  return y === 0 || y === numRows - 1 || x === 0 || x === numCols - 1;
}