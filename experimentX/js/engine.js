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
  // Calculate the center of the screen
  let screen_center_x = width / 2;
  let screen_center_y = height / 2;

  // Keyboard controls!
  if (keyIsDown(65)) { // A key (move left)
    camera_velocity.x -= .3;
  }
  if (keyIsDown(68)) { // D key (move right)
    camera_velocity.x += .3;
  }
  if (keyIsDown(83)) { // S key (move down)
    camera_velocity.y += .3;
  }
  if (keyIsDown(87)) { // W key (move up)
    camera_velocity.y -= .3;
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

  // Display resources UI
  textAlign(LEFT, TOP);
  textSize(24);
  let inventory = getResourceInfo();
  text(`x${inventory[0]}`, width - 50, 15)
  let wood = image(resourceTilesheet, width - 90, 10, 32, 32, 0 , 0, 32, 32);
  text(`x${inventory[1]}`, width - 50, 55)
  let stone = image(resourceTilesheet, width - 90, 50, 32, 32, 32 , 0, 32, 32);

  textSize(16);

  if (window.p3_drawAfter) {
    window.p3_drawAfter();
  }

  // Draw the player at the center of the screen
  fill(255, 0, 0);
  noStroke();
  rectMode(CENTER);
  rect(player.x, player.y, playerSize, playerSize);
  noFill();

  describeMouseTile(world_pos, [camera_offset.x, camera_offset.y]); // Draw cursor on top

  if (window.p3_drawAfter) {
    window.p3_drawAfter();
  }
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