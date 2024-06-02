"use strict";

/* global p5 */
/* exported preload, setup, draw, mouseClicked */

// Project base code provided by {amsmith,ikarth}@ucsc.edu

let tile_width_step_main; // A width step is half a tile's width
let tile_height_step_main; // A height step is half a tile's height

// Global variables. These will mostly be overwritten in setup().
let tile_rows, tile_columns;
let camera_offset;
let camera_velocity;

let currentKeyPressed = null; // Variable to track the currently pressed key

let farmer;
let walk_up;
let walk_down;
let walk_left;
let walk_right;
let idle_up;
let idle_down;
let idle_left;
let idle_right;
let lastPressedKey = 83;
// Define a cooldown period in milliseconds
const cooldownDuration = 100; // .1 second

// Define variables to track cooldown
let cooldownActive = false;
let cooldownStartTime = 0;

let obstacles = {};

let startScreen = true;

let currentDay = 0; // Initialize day counter
let lastPhase = false;  // Initialize to track the last phase of the cycle

/////////////////////////////
// Transforms between coordinate systems
// These are actually slightly weirder than in full 3d...
/////////////////////////////
function worldToScreen([world_x, world_y], [camera_x, camera_y]) {
  let x = world_x * tile_width_step_main - camera_x;
  let y = world_y * tile_height_step_main - camera_y;
  return [x, y];
}

function worldToCamera([world_x, world_y], [camera_x, camera_y]) {
  let i = world_x * tile_width_step_main;
  let j = world_y * tile_height_step_main;
  return [i, j];
}

function tileRenderingOrder(offset) {
  return [offset[1] - offset[0], offset[0] + offset[1]];
}

function screenToWorld([screen_x, screen_y], [camera_x, camera_y]) {
  let x = Math.floor((screen_x + camera_x) / tile_width_step_main);
  let y = Math.floor((screen_y + camera_y) / tile_height_step_main);
  return [x, y];
}

function cameraToWorldOffset([camera_x, camera_y]) {
  let world_x = camera_x / tile_width_step_main;
  let world_y = camera_y / tile_height_step_main;
  return { x: Math.round(world_x), y: Math.round(world_y) };
}

function worldOffsetToCamera([world_x, world_y]) {
  let camera_x = world_x * tile_width_step_main;
  let camera_y = world_y * tile_height_step_main;
  return new p5.Vector(camera_x, camera_y);
}

function preload() {
  if (window.p3_preload) {
    window.p3_preload();
  }
  
  walk_up = loadImage("https://cdn.glitch.global/89835fff-f6de-48e0-bb2e-674d0cfb96b8/farmer_movement.png?v=1717005564987");
  walk_down = loadImage("https://cdn.glitch.global/89835fff-f6de-48e0-bb2e-674d0cfb96b8/farmer_movement.png?v=1717005564987");
  walk_left = loadImage("https://cdn.glitch.global/89835fff-f6de-48e0-bb2e-674d0cfb96b8/farmer_movement.png?v=1717005564987");
  walk_right = loadImage("https://cdn.glitch.global/89835fff-f6de-48e0-bb2e-674d0cfb96b8/farmer_movement.png?v=1717005564987");
  idle_up = loadImage("https://cdn.glitch.global/89835fff-f6de-48e0-bb2e-674d0cfb96b8/farmer_movement.png?v=1717005564987");
  idle_down = loadImage("https://cdn.glitch.global/89835fff-f6de-48e0-bb2e-674d0cfb96b8/farmer_movement.png?v=1717005564987");
  idle_left = loadImage("https://cdn.glitch.global/89835fff-f6de-48e0-bb2e-674d0cfb96b8/farmer_movement.png?v=1717005564987");
  idle_right = loadImage("https://cdn.glitch.global/89835fff-f6de-48e0-bb2e-674d0cfb96b8/farmer_movement.png?v=1717005564987");
}

function setup() {
  let canvas = createCanvas(800, 400);
  canvas.parent("container");
  canvas.elt.getContext("2d").imageSmoothingEnabled = false;

  // Center the camera offset
  camera_offset = new p5.Vector(width / 2, height / 2);
  camera_velocity = new p5.Vector(0, 0);

  // Initialize player position
  player = createVector(width / 2, height / 2);
  playerPosition = screenToWorld([player.x, player.y], [camera_offset.x, camera_offset.y]);

  if (window.p3_setup) {
    window.p3_setup();
  }
  
    // Create a container div for the select element
  let selectContainer = createDiv();
  selectContainer.parent("container"); // Append it to the same parent as the canvas

  // Create a select element
  let select = createSelect();
  select.parent(selectContainer);

  // Add options for each variable
  select.option('', '');
  select.option('House', 'placingHouse');
  select.option('Upgrade House', 'upgradeHouse');
  select.option('Path Tiles', 'placingPathTiles');
  select.option('Farm Tiles', 'placingFarmTiles');
  select.option('Fence', 'placingFence');
  select.option('Stone Path', 'placingStonePaths');
  select.option('Plant Seeds', 'planting');

  // Function to be called when selection changes
  function selectionChanged() {
    let selectedVariable = select.value();
    // Call your function based on the selected variable
    console.log(selectedVariable);
    action(selectedVariable); // Call test function with the selected value
  }

  // Add an event listener for selection change
  select.changed(selectionChanged);


  let label = createP();
  label.html("World key: ");
  label.parent("container");
  
  

  let input = createInput("xyzzy");
  input.parent(label);
  input.input(() => {
    rebuildWorld(input.value());
  });

  createP("Arrow keys scroll. Clicking changes tiles.").parent("container");

  rebuildWorld(input.value());
  
  farmer = new Sprite(walk_down, width / 2, height / 2, 0)
}


function rebuildWorld(key) {
  if (window.p3_worldKeyChanged) {
    window.p3_worldKeyChanged(key);
  }
  tile_width_step_main = window.p3_tileWidth ? window.p3_tileWidth() : 32;
  tile_height_step_main = window.p3_tileHeight ? window.p3_tileHeight() : 32;
  tile_columns = Math.ceil(width / tile_width_step_main);
  tile_rows = Math.ceil(height / tile_height_step_main);
}

function mouseClicked() {
  if (startScreen) {
    startScreen = false;
  }
  let world_pos = screenToWorld(
    [mouseX, mouseY],
    [camera_offset.x, camera_offset.y]
  );

  if (window.p3_tileClicked) {
    window.p3_tileClicked(world_pos[0], world_pos[1]);
  }
  return false;
}

function draw() {
  if (startScreen) {
    background(0);
    fill(255);
    textSize(48);
    textAlign(CENTER, CENTER);
    text("Build", width / 2, height / 3);
    textSize(24);
    text("Click to Start", width / 2, height / 2);
  }else{
    updateGathering();
  
  // Calculate the center of the screen
  let screen_center_x = width / 2;
  let screen_center_y = height / 2;

  // Keyboard controls!
  let gatheringState = getResourceInfo();
  if (gatheringState[3] === false) {
    let unwalkableTiles = getResourceInfo();
    rocks = unwalkableTiles[4];
    trees = unwalkableTiles[5];
    deadtrees = unwalkableTiles[6];
    houses = unwalkableTiles[7];
    water = unwalkableTiles[8];
    fences = unwalkableTiles[9];

    if (!cooldownActive) {
      if (keyIsDown(65) && !keyIsDown(68) && !keyIsDown(83) && !keyIsDown(87)) { // A key (move left)
        let collisionDetected = false;
  
          for (let key in obstacles) {
              // Collision detection logic
              if (
                  player.x - 32 < obstacles[key].x + 32/2 &&
                  player.x + 0  + (-8) > obstacles[key].x -32/2 &&
                  player.y - 32 + (8) < obstacles[key].y + 32/2 &&
                  player.y + 0 + (-8) > obstacles[key].y - 32/2
              ) {
                  // fill(255, 0, 0);
                  // rect(obstacles[key].x, obstacles[key].y, tile_width_step_main, tile_height_step_main);
                  // noFill();
                  console.log("Collision detected!");
                  camera_velocity.x = 0;
                  collisionDetected = true;
                  // Activate cooldown
                  cooldownActive = true;
                  cooldownStartTime = millis();
                  break;
              }
          }
  
          if (!collisionDetected) {
              // Movement logic for the A key
              farmer.sheet = walk_left;
              farmer.row = 2;
              lastPressedKey = 65;
              camera_velocity.x = -3;
              camera_velocity.y = 0;
          }
      }
  
      else if (keyIsDown(68) && !keyIsDown(65) && !keyIsDown(83) && !keyIsDown(87)) { // D key (move right)
          let collisionDetected = false;
  
          for (let key in obstacles) {
              // Collision detection logic
              if (
                  player.x - 32 + (8) < obstacles[key].x + 32/2 &&
                  player.x + 0 > obstacles[key].x -32/2 &&
                  player.y - 32 + (8) < obstacles[key].y + 32/2 &&
                  player.y + 0 + (-8) > obstacles[key].y - 32/2
              ) {
                  // fill(255, 0, 0);
                  // rect(obstacles[key].x, obstacles[key].y, tile_width_step_main, tile_height_step_main);
                  // noFill();
                  console.log("Collision detected!");
                  camera_velocity.x = 0;
                  collisionDetected = true;
                  break;
              }
          }
  
          if (!collisionDetected) {
              // Movement logic for the D key
              farmer.sheet = walk_right;
              farmer.row = 3;
              lastPressedKey = 68;
              camera_velocity.x = 3;
              camera_velocity.y = 0;
          }
      }
  
      else if (keyIsDown(83) && !keyIsDown(65) && !keyIsDown(68) && !keyIsDown(87)) { // S key (move down)
        let collisionDetected = false;
  
        for (let key in obstacles) {
            // Collision detection logic
            if (
                player.x - 32 + (8) < obstacles[key].x + 32/2 &&
                player.x + 0 + (-8) > obstacles[key].x -32/2 &&
                player.y - 32  + (8) < obstacles[key].y + 32/2 &&
                player.y + 0 > obstacles[key].y - 32/2
            ) {
                // fill(255, 0, 0);
                // rect(obstacles[key].x, obstacles[key].y, tile_width_step_main, tile_height_step_main);
                // noFill();
                console.log("Collision detected!");
                camera_velocity.y = 0;
                collisionDetected = true;
                break;
            }
        }
  
        if (!collisionDetected) {
            // Movement logic for the D key
            farmer.sheet = walk_down;
            farmer.row = 0;
            lastPressedKey = 83;
            camera_velocity.y = 3;
            camera_velocity.x = 0;
        }
      }
      else if (keyIsDown(87) && !keyIsDown(65) && !keyIsDown(68) && !keyIsDown(83)) { // W key (move up)
        let collisionDetected = false;
  
        for (let key in obstacles) {
            // Collision detection logic
            if (
                player.x - 32 + (8) < obstacles[key].x + 32/2 &&
                player.x + 0 + (-8) > obstacles[key].x -32/2 &&
                player.y - 32 < obstacles[key].y + 32/2 &&
                player.y + 0 + (-8) > obstacles[key].y - 32/2
            ) {
                // fill(255, 0, 0);
                // rect(obstacles[key].x, obstacles[key].y, tile_width_step_main, tile_height_step_main);
                // noFill();
                console.log("Collision detected!");
                camera_velocity.y = 0;
                collisionDetected = true;
                break;
            }
        }
  
        if (!collisionDetected) {
            // Movement logic for the D key
            farmer.sheet = walk_up;
            farmer.row = 1;
            lastPressedKey = 87;
            camera_velocity.y = -3;
            camera_velocity.x = 0;
        }
      }
      
      else {
      camera_velocity.x = 0;
      camera_velocity.y = 0;
      if (lastPressedKey === 65) {
        farmer.sheet = idle_left;
        farmer.row = 6;
      }
      if (lastPressedKey === 68) {
        farmer.sheet = idle_right;
        farmer.row = 7;
      }
      if (lastPressedKey === 83) {
        farmer.sheet = idle_down;
        farmer.row = 4;
      }
      if (lastPressedKey === 87) {
        farmer.sheet = idle_up;
        farmer.row = 5;
      }
      } 
    }
    
    else {
      camera_velocity.x = 0;
      camera_velocity.y = 0;
      if (lastPressedKey === 65) {
          farmer.sheet = idle_left;
          farmer.row = 6;
        }
        if (lastPressedKey === 68) {
          farmer.sheet = idle_right;
          farmer.row = 7;
        }
        if (lastPressedKey === 83) {
          farmer.sheet = idle_down;
          farmer.row = 4;
        }
        if (lastPressedKey === 87) {
          farmer.sheet = idle_up;
          farmer.row = 5;
        }
    }
    
    // Check and update cooldown status
    if (cooldownActive) {
      const elapsedTime = millis() - cooldownStartTime;
      if (elapsedTime >= cooldownDuration) {
          // Cooldown period has elapsed, reset cooldown status
          cooldownActive = false;
      }
    }
  }

  // Update player's tile coordinates
  playerPosition = screenToWorld([player.x, player.y], [camera_offset.x, camera_offset.y]);

  let camera_delta = new p5.Vector(0, 0);
  camera_velocity.add(camera_delta);
  camera_offset.add(camera_velocity);
  camera_velocity.mult(0.9); // cheap easing
  if (camera_velocity.mag() < 0.01) {
    camera_velocity.setMag(0);
  }

  let world_pos = screenToWorld(
    [mouseX, mouseY], // Use screen center instead of mouse position
    [camera_offset.x, camera_offset.y]
  );
  let world_offset = cameraToWorldOffset([camera_offset.x, camera_offset.y]);

  background(100);

  if (window.p3_drawBefore) {
    window.p3_drawBefore();
  }

  // Adjust the drawing boundaries to center the loaded area
  let y0 = Math.floor((screen_center_y - height * 0.6) / tile_height_step_main); // Adjust the factor to control the loaded area size
  let y1 = Math.ceil((screen_center_y + height * 0.6) / tile_height_step_main);
  let x0 = Math.floor((screen_center_x - width * 0.6) / tile_width_step_main);
  let x1 = Math.ceil((screen_center_x + width * 0.6) / tile_width_step_main);

  // draw biome tiles
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      drawTile([x + world_offset.x, y + world_offset.y], [
        camera_offset.x,
        camera_offset.y
      ]);
    }
  }

   // Display the player's position at the top-left corner of the screen
   fill(0);
   textAlign(LEFT, TOP);
   textSize(16);
   text(`(${playerPosition[0]}, ${playerPosition[1]})`, 10, 10);
    
  // gathering text
  if (gathering) {
    fill(0);
    textAlign(CENTER, TOP);
    text('Gathering...', width / 2, 20);
  }

  // Display resources UI
  textAlign(LEFT, TOP);
  textSize(24);
  let inventory = getResourceInfo();
  text(`x${inventory[0]}`, width - 50, 15)
  let wood = image(resourceTilesheet, width - 90, 10, 32, 32, 0 , 0, 32, 32);
  text(`x${inventory[1]}`, width - 50, 55)
  let stone = image(resourceTilesheet, width - 90, 50, 32, 32, 32 , 0, 32, 32);
  text(`x${inventory[2]}`, width - 50, 95)
  let seed = image(resourceTilesheet, width - 90, 90, 32, 32, 0 , 32, 32, 32);
  
  textSize(16);

  // draw trees and stone (top)
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      drawTileAfter([x + world_offset.x, y + world_offset.y], [
        camera_offset.x,
        camera_offset.y
      ]);
    }
  }

  // Draw the player at the center of the screen
  farmer.draw();
  
  // Draw the player's rectangle
  // noFill()
  // stroke(255, 0, 0)
  // strokeWeight(3)
  // rect(player.x - tile_width_step_main / 2, player.y - tile_height_step_main / 2, tile_width_step_main, tile_height_step_main);  // hitbox

  noStroke();
  noFill();

  // draw trees and stone (bot)
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      drawTileAfter2([x + world_offset.x, y + world_offset.y], [
        camera_offset.x,
        camera_offset.y
      ]);
    }
  }
    
  // Draw rectangles around rocks
  for (let key in rocks) {
    if (rocks[key]) { // Check if there is a rock at this position
      let position = key.split(',').map(Number); // Convert key to [x, y] array
      let x = position[0] * tile_width_step_main - camera_offset.x; // Calculate world x-coordinate adjusted by camera offset
      let y = position[1] * tile_height_step_main - camera_offset.y; // Calculate world y-coordinate adjusted by camera offset
      // noFill();
      // stroke(255, 0, 0);
      // strokeWeight(3);
      // rect(x, y, tile_width_step_main, tile_height_step_main); // Draw rectangle around rock
      obstacles[key] = { x, y }
    }
  }

  // Draw rectangles around trees
  for (let key in trees) {
    if (trees[key]) { // Check if there is a rock at this position
      let position = key.split(',').map(Number); // Convert key to [x, y] array
      let x = position[0] * tile_width_step_main - camera_offset.x; // Calculate world x-coordinate adjusted by camera offset
      let y = position[1] * tile_height_step_main - camera_offset.y; // Calculate world y-coordinate adjusted by camera offset
      // noFill();
      // stroke(255, 0, 0);
      // strokeWeight(3);
      // rect(x, y, tile_width_step_main, tile_height_step_main); // Draw rectangle around trees
      obstacles[key] = { x, y }
    }
  }

  // Draw rectangles around deadtrees
  for (let key in deadtrees) {
    if (deadtrees[key]) { // Check if there is a rock at this position
      let position = key.split(',').map(Number); // Convert key to [x, y] array
      let x = position[0] * tile_width_step_main - camera_offset.x; // Calculate world x-coordinate adjusted by camera offset
      let y = position[1] * tile_height_step_main - camera_offset.y; // Calculate world y-coordinate adjusted by camera offset
      // noFill();
      // stroke(255, 0, 0);
      // strokeWeight(3);
      // rect(x, y, tile_width_step_main, tile_height_step_main); // Draw rectangle around deadtrees
      obstacles[key] = { x, y }
    }
  }

  // Draw rectangles around houses
  for (let key in houses) {
    if (houses[key]) { // Check if there is a rock at this position
      let position = key.split(',').map(Number); // Convert key to [x, y] array
      let x = position[0] * tile_width_step_main - camera_offset.x; // Calculate world x-coordinate adjusted by camera offset
      let y = position[1] * tile_height_step_main - camera_offset.y; // Calculate world y-coordinate adjusted by camera offset
      // noFill();
      // stroke(255, 0, 0);
      // strokeWeight(3);
      // rect(x, y, tile_width_step_main, tile_height_step_main); // Draw rectangle around houses
      obstacles[key] = { x, y }
    }
  }

  
  // Draw rectangles around water
  for (let key in water) {
    if (water[key]) { // Check if there is a rock at this position
      let position = key.split(',').map(Number); // Convert key to [x, y] array
      let x = position[0] * tile_width_step_main - camera_offset.x; // Calculate world x-coordinate adjusted by camera offset
      let y = position[1] * tile_height_step_main - camera_offset.y; // Calculate world y-coordinate adjusted by camera offset
      // noFill();
      // stroke(255, 0, 0);
      // strokeWeight(3);
      // rect(x, y, tile_width_step_main, tile_height_step_main); // Draw rectangle around water
      obstacles[key] = { x, y }
    }
  }

  // Draw rectangles around fences
  for (let key in fences) {
    if (fences[key]) { // Check if there is a rock at this position
      let position = key.split(',').map(Number); // Convert key to [x, y] array
      let x = position[0] * tile_width_step_main - camera_offset.x; // Calculate world x-coordinate adjusted by camera offset
      let y = position[1] * tile_height_step_main - camera_offset.y; // Calculate world y-coordinate adjusted by camera offset
      // noFill();
      // stroke(255, 0, 0);
      // strokeWeight(3);
      // rect(x, y, tile_width_step_main, tile_height_step_main); // Draw rectangle around fences
      obstacles[key] = { x, y }
    }
  }
    
  noStroke();
  
  //day/night cycle
  let dayColor = color(255, 255, 255, 0);
  let nightColor = color(0, 0, 0, 168);
  let currentColor;

  let timeInMinutes = 5;
  let cycleTime = timeInMinutes * 60 * 1000

  // parts of the day/night are split into quarters
  if (millis() % cycleTime < cycleTime/4) { //9am - 3pm
    currentColor = lerpColor(dayColor, dayColor, 1);
    if (lastPhase) {
      lastPhase = false;
      currentDay++;
      console.log("Day: " + currentDay);
      growCrops();
    }
  } else if (millis() % cycleTime < cycleTime/2) { //3pm - 9pm
    dayColor = color(0, 0, 20, 0); // shade of blue before night
    currentColor = lerpColor(dayColor, nightColor, (millis()%(cycleTime/4))/(cycleTime/4));
  } else if (millis() % cycleTime < cycleTime*3/4) { //9pm - 3am
    currentColor = lerpColor(nightColor, nightColor, 1);
  } else {//3am - 9am
    dayColor = color(20, 20, 0, 0); // shade of yellow before morning
    currentColor = lerpColor(nightColor, dayColor, (millis()%(cycleTime/4))/(cycleTime/4));
    lastPhase = true;
  }

  background(currentColor)


  describeMouseTile(world_pos, [camera_offset.x, camera_offset.y]); // Draw cursor on top

  // if (window.p3_drawAfter) {
  //   window.p3_drawAfter();
  // }
  }
}

function removeObstacle(key) {
  delete obstacles[key];
}

// Display a description of the tile at world_x, world_y.
function describeMouseTile([world_x, world_y], [camera_x, camera_y]) {
  let [screen_x, screen_y] = worldToScreen(
    [world_x, world_y],
    [camera_x, camera_y]
  );
  drawTileDescription([world_x, world_y], [screen_x, screen_y]);
}

function drawTileDescription([world_x, world_y], [screen_x, screen_y]) {
  push();
  translate(screen_x, screen_y);
  if (window.p3_drawSelectedTile) {
    window.p3_drawSelectedTile(world_x, world_y, screen_x, screen_y);
  }
  pop();
}

// Draw a tile, mostly by calling the user's drawing code.
function drawTile([world_x, world_y], [camera_x, camera_y]) {
  let [screen_x, screen_y] = worldToScreen(
    [world_x, world_y],
    [camera_x, camera_y]
  );
  push();
  translate(screen_x, screen_y);
  if (window.p3_drawTile) {
    window.p3_drawTile(world_x, world_y, screen_x, screen_y);
  }
  pop();
}

// Draw a trees and stone
function drawTileAfter([world_x, world_y], [camera_x, camera_y]) {
  let [screen_x, screen_y] = worldToScreen(
    [world_x, world_y],
    [camera_x, camera_y]
  );
  push();
  translate(screen_x, screen_y);
  if (window.p3_drawTile) {
    window.p3_drawAfter(world_x, world_y, screen_x, screen_y);
  }
  pop();
}

function drawTileAfter2([world_x, world_y], [camera_x, camera_y]) {
  let [screen_x, screen_y] = worldToScreen(
    [world_x, world_y],
    [camera_x, camera_y]
  );
  push();
  translate(screen_x, screen_y);
  if (window.p3_drawTile) {
    window.p3_drawAfter2(world_x, world_y, screen_x, screen_y);
  }
  pop();
}

// Credits: https://www.youtube.com/watch?v=eE65ody9MdI 
function Sprite(sheet, x, y, row) {
  this.sheet = sheet;
  this.scale = 1;
  this.x = x - 16;
  this.y = y - 16;
  this.h = sheet.height / 8;  // Assuming totalRows is the number of rows in the spritesheet
  this.w = sheet.width / 4; // Assuming totalColumns is the number of columns in the spritesheet
  this.frame = 0;
  this.frames = 4;  // Number of frames in a row
  this.row = row;

  this.draw = function() {
    // Calculate the x position on the spritesheet based on the current frame
    let sx = this.w * floor(this.frame);
    // Calculate the y position on the spritesheet based on the specified row
    let sy = this.h * this.row;
    image(this.sheet, this.x, this.y, this.w * this.scale, this.h * this.scale, sx, sy, this.w, this.h);
    this.frame += 0.1;
    if (this.frame >= this.frames) {
      this.frame = 0;
    }
  }
}