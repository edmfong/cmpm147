// sketch.js - purpose and description here
// Author: Your Name
// Date:

// Here is how you might set up an OOP p5.js project
// Note that p5.js looks for a file called sketch.js

// Constants - User-servicable parts
const riverColor = "#3c89b5";
const skyColor = "#e8fcff";
const landColor = "#39b355";
const treeColor = "#0c8a29";
const cloudColors = ["#ffffff", "#f0f0f0", "#fafafa"]; // Array of cloud colors

let treePositions = []; // Array to store tree positions
let treeSizes = []; // Array to store tree sizes
let ducks = []; // Array to store ducks
let clouds = []; // Array to store cloud objects

let duckSizeModifier = 1;
let treeSizeModifier = 1;

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

  $(window).resize(function() {
    resizeScreen();
  });
  resizeScreen();

  // createCanvas(400, 200);
  // createButton("Reimagine").mousePressed(reimagine);

  // listener for reimagine button
  $("#reimagine").click(function() {
    reimagine();
    console.log("click");
  });

  // size modifiers
  duckSizeModifier = canvasContainer.height() / 250;
  treeSizeModifier = canvasContainer.height() / 200;
  cloudSizeModifier = canvasContainer.height() / 250;

  // Initialize tree positions and sizes once during setup
  generateTreeData();
  // Create initial ducks
  createDucks(3); // Create 3 ducks initially
  // Create initial clouds
  createClouds(5); // Create 3 clouds initially
}

// draw() function is called repeatedly, it's the main animation loop
function draw() {

  background(0); // Clear background
  
  noStroke();
  
  // Draw sky
  fill(skyColor);
  rect(0, 0, width, height);
  
  // Update and draw each cloud
  for (let i = 0; i < clouds.length; i++) {
    let cloud = clouds[i];
    moveCloud(cloud); // Move the cloud
    drawCloud(cloud, cloudSizeModifier); // Draw the cloud
  }
  
  // Draw trees using precalculated positions and sizes
  drawTrees();
  
  // Draw land
  drawLand();

  // Draw riverbank
  drawRiverBank();
  
  // Update and draw each duck
  for (let i = 0; i < ducks.length; i++) {
    let duck = ducks[i];
    moveDuck(duck); // Move the duck to the left
    drawDuck(duck, duckSizeModifier); // Draw the duck
  }
  
}

function generateTreeData() {
  treePositions = []; // Clear existing tree positions
  treeSizes = []; // Clear existing tree sizes

  const numTrees = 20; // Number of trees

  // Generate tree positions and sizes above the land area
  for (let i = 0; i < numTrees; i++) {
    // Randomly select an x-coordinate along the width of the canvas
    let x = random(width);

    // Calculate y-coordinate above the land area
    // Use a noise value that results in a higher y-coordinate
    let noiseVal = noise(x * 0.005);
    let y = map(noiseVal, 0, 1, height / 2 - 5, height / 2 - 15);

    // Store tree position as an object
    treePositions.push({ x, y });

    // Generate random size for the tree and store it
    let treeSize = random(20 * treeSizeModifier, 40 * treeSizeModifier); // Random size for tree
    treeSizes.push(treeSize);
  }
}

function drawRiverBank() {
  fill(riverColor);
  beginShape();
  for (let x = 0; x <= width; x += 10) {
    let noiseVal = noise(x * 0.005);
    let y = map(noiseVal, 0, 1, height / 2 + 10, height / 2 + 20);
    vertex(x, y);
  }
  vertex(width, height);
  vertex(0, height);
  endShape(CLOSE);
}

function drawLand() {
  fill(landColor);
  beginShape();
  for (let x = 0; x <= width; x += 10) {
    let noiseVal = noise(x * 0.005);
    let y = map(noiseVal, 0, 1, height / 2 - 10, height / 2 - 20);
    vertex(x, y);
  }
  vertex(width, height);
  vertex(0, height);
  endShape(CLOSE);
}

function drawTrees() {
  fill(treeColor);

  // Draw trees at precalculated positions and sizes along the riverbank
  for (let i = 0; i < treePositions.length; i++) {
    let tree = treePositions[i];
    let x = tree.x;
    let y = tree.y;
    let s = treeSizes[i]; // Get size of the tree from precalculated sizes
    triangle(x, y - s, x - s / 2, y, x + s / 2, y); // Draw tree triangle
  }
}

function reimagine() {
  // Regenerate tree positions and sizes with new noise seed
  noiseSeed(millis());
  generateTreeData();
  
  // Reset y positions of each duck within the lower half of the canvas
  for (let i = 0; i < ducks.length; i++) {
    ducks[i].y = random(height / 2 + 20, height); // Random y position within canvas height (lower half)
  }
  
  // Clear existing clouds array
  clouds = [];
  
  // Create new clouds
  createClouds(5); // Create 5 new clouds with random positions
}

// Function to create a specified number of ducks
function createDucks(num) {
  for (let i = 0; i < num; i++) {
    let duck = {
      x: random(width), // Random x position within canvas width
      y: random(height/2 + 20, height), // Random y position within canvas height
      speed: random(1, 3) // Random speed for each duck
    };
    ducks.push(duck); // Add duck to the array
  }
}

// Function to move a duck to the left
function moveDuck(duck) {
  duck.x -= duck.speed; // Move the duck to the left based on its speed
  // Check if the duck goes beyond the left edge of the canvas
  if (duck.x < 0) {
    duck.x = width; // Reset duck's x position to the right edge of the canvas
  }
}

// Function to draw a duck with scaling
function drawDuck(duck, scale) {
  // Scale all dimensions based on the provided scale factor
  let scaledBodyWidth = 30 * scale;
  let scaledBodyHeight = 20 * scale;
  let scaledHeadWidth = 20 * scale;
  let scaledHeadHeight = 17 * scale;
  let scaledBeakSize = 6 * scale;
  let scaledEyeSize = 3 * scale;
  let scaledTailLength = 10 * scale;
  let scaledWingWidth = 20 * scale;
  let scaledWingHeight = 12 * scale;

  // Draw the duck's body
  fill(255);
  ellipse(duck.x, duck.y, scaledBodyWidth, scaledBodyHeight); // Body ellipse

  // Draw the duck's head
  fill(255);
  ellipse(duck.x - (10 * scale), duck.y - (10 * scale), scaledHeadWidth, scaledHeadHeight); // Head ellipse

  // Draw the duck's beak top
  fill(255, 165, 0);
  triangle(
    duck.x - (26 * scale), duck.y - (7 * scale),
    duck.x - (20 * scale), duck.y - (10 * scale),
    duck.x - (16 * scale), duck.y - (7 * scale)
  ); // Beak triangle

  // Draw the duck's beak bottom
  fill(255, 165, 0);
  triangle(
    duck.x - (25 * scale), duck.y - (7.2 * scale),
    duck.x - (18 * scale), duck.y - (5 * scale),
    duck.x - (16 * scale), duck.y - (7.2 * scale)
  ); // Beak triangle

  // Draw the duck's eye
  fill(0);
  ellipse(duck.x - (16 * scale), duck.y - (12 * scale), scaledEyeSize, scaledEyeSize); // Eye ellipse

  // Draw the duck's tail
  fill(255);
  triangle(
    duck.x + (10 * scale), duck.y - (7 * scale),
    duck.x + (20 * scale), duck.y - (10 * scale),
    duck.x + (14.5 * scale), duck.y + (4 * scale)
  ); // Tail triangle
  
  // Draw the duck's wing
  fill("#ededed");
  ellipse(duck.x + (5 * scale), duck.y + (2 * scale), scaledWingWidth, scaledWingHeight); // Wing ellipse
}

// Function to create a specified number of clouds
function createClouds(num) {
  for (let i = 0; i < num; i++) {
    let cloud = {
      x: random(width), // Random x position within canvas width
      y: random(height/15 , height/4), // Random y position within top half of the canvas
      speed: random(0.2, 0.5), // Random speed for each cloud
      size: random(30, 80), // Random size for each cloud
      color: random(cloudColors) // Random color for each cloud
    };
    clouds.push(cloud); // Add cloud to the array
  }
}

// Function to move a cloud to the left
function moveCloud(cloud) {
  cloud.x -= cloud.speed; // Move the cloud to the left based on its speed
  // Check if the cloud goes beyond the left edge of the canvas
  if (cloud.x < -cloud.size) {
    cloud.x = width; // Reset cloud's x position to the right edge of the canvas
    cloud.y = random(height/15 , height/4); // Reset cloud's y position within top half of the canvas
  }
}

// Function to draw a cloud
function drawCloud(cloud, cloudSizeModifier) {
  fill(cloud.color); // Set fill color for cloud
  noStroke(); // No stroke for cloud
  ellipse(cloud.x, cloud.y, cloud.size * 0.8 * cloudSizeModifier, cloud.size * 0.5 * cloudSizeModifier); // Draw cloud as an ellipse
  ellipse(cloud.x + cloud.size * 0.4 * cloudSizeModifier, cloud.y - cloud.size * 0.2 * cloudSizeModifier, cloud.size * cloudSizeModifier, cloud.size * 0.6 * cloudSizeModifier); // Draw another ellipse for cloud
}