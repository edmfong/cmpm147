/* exported p4_inspirations, p4_initialize, p4_render, p4_mutate */
/* global currentShape */

let inspirations = [];
let scale = 3;

function p4_inspirations() {
  inspirations = [
    {
      name: "Earth",
      assetUrl: "./assets/Earth.webp",
      credit: "NASA - July 6, 2015",
    },
    {
      name: "Sun",
      assetUrl: "./assets/Sun.webp",
      credit: "NASA - February 17, 2001",
    },
    {
      name: "Mercury",
      assetUrl: "./assets/Mercury.webp",
      credit: "NASA",
    },
    {
      name: "Venus",
      assetUrl: "./assets/Venus.webp",
      credit: "NASA/JPL-Caltech",
    },
    {
      name: "Mars",
      assetUrl: "./assets/Mars.jpg",
      credit: "NASA/JPL/MSSS - September 7, 2000",
    },
    {
      name: "Jupiter",
      assetUrl: "./assets/Jupiter.webp",
      credit: "NASA, A. Simon, M.H. Wong - June 27, 2019",
    },
    {
      name: "Saturn",
      assetUrl: "./assets/Saturn.webp",
      credit: "NASA - December 30, 2008",
    },
    {
      name: "Uranus",
      assetUrl: "./assets/Uranus.jpg",
      credit: "NASA - December 17, 1986",
    },
    {
      name: "Neptune",
      assetUrl: "./assets/Neptune.jpg",
      credit: "NASA - October 29, 1998",
    },
    {
      name: "Pluto",
      assetUrl: "./assets/Pluto.webp",
      credit: "NASA/Johns Hopkins - July 13, 2015",
    }, 
  ];
  
  return inspirations;
}

let inspirationImage; // Global variable to store the loaded inspiration image

function p4_initialize(inspiration) {
  let design = {
    bg: 0,
    fg: [],
    shape: currentShape // Set the shape based on the current selection
  };

  // Load the inspiration image and store it in a global variable
  loadImage(inspiration.assetUrl, img => {
    inspirationImage = img;
  });

  // Generate foreground shapes
  for (let i = 0; i < 100; i++) {
    let x = random(width);
    let y = random(height);
    let w, h;

    // Determine the dimensions based on the shape type
    if (design.shape === "circle") {
      w = random(width / 2);
      h = w;
    } else if (design.shape === "square") {
      w = random(width / 2);
      h = random(height / 2);
    }

    // Add the shape to the foreground list
    design.fg.push({ x, y, w, h });
  }

  return design;
}


function p4_render(design, inspiration) {
  background(design.bg);
  noStroke();

  if (inspirationImage) {
    inspirationImage.loadPixels();

    for (let item of design.fg) {
      let imageX = map(item.x, 0, width, 0, inspirationImage.width - 1);
      let imageY = map(item.y, 0, height, 0, inspirationImage.height - 1);
      imageX = Math.round(imageX);
      imageY = Math.round(imageY);
      let index = (imageX + imageY * inspirationImage.width) * 4;
      let r = inspirationImage.pixels[index];
      let g = inspirationImage.pixels[index + 1];
      let b = inspirationImage.pixels[index + 2];

      fill(r, g, b, 200);

      if (design.shape === "circle") {
        ellipse(item.x, item.y, item.w, item.h); // Draw ellipse if shape is circle
      } else if (design.shape === "square") {
        rect(item.x, item.y, item.w, item.h); // Draw rectangle if shape is square
      } else if (design.shape === "duck") {
        // Draw a duck
        drawDuck(item, r, g, b);
      }
    }
  }
}

function p4_mutate(design, inspiration, rate) {
  design.bg = mut(design.bg, 0, 255, rate);
  for (let box of design.fg) {
    box.x = mut(box.x, 0, width, rate);
    box.y = mut(box.y, 0, height, rate);
    if (design.shape == "circle") {
      box.w = mut(box.w, 0, width / 3, rate);
      box.h = box.w;
    }
    else {
      box.w = mut(box.w, 0, width / 3, rate);
      box.h = mut(box.h, 0, height / 3, rate);
    }
  }
}

function mut(num, min, max, rate) {
  return constrain(randomGaussian(num, (rate * (max - min)) / 10), min, max);
}

// Function to draw a duck
// function drawDuck(duck, r, g, b) {
//   // Draw the duck's body
//   fill(r, g, b);
//   ellipse(duck.x, duck.y, 30, 20); // Body ellipse

//   // Draw the duck's head
//   fill(r, g, b);
//   ellipse(duck.x - 10, duck.y - 10, 20, 17); // Head ellipse

//   // Draw the duck's beak top
//   fill(255, 165, 0);
//   triangle(duck.x - 26, duck.y - 7, duck.x - 20, duck.y - 10, duck.x - 16, duck.y - 7); // Beak triangle
//   // Draw the duck's beak bot
//   fill(255, 165, 0);
//   triangle(duck.x - 25, duck.y - 7.2, duck.x - 18, duck.y - 5, duck.x - 16, duck.y - 7.2); // Beak triangle

//   // Draw the duck's eye
//   fill(0);
//   ellipse(duck.x - 16, duck.y - 12, 3, 3); // Eye ellipse

//   // Draw the duck's tail
//   fill(r, g, b);
//   triangle(duck.x + 10, duck.y - 7, duck.x + 20, duck.y - 10, duck.x + 14.5, duck.y + 4); // Tail triangle
  
//   // Draw the duck's wing (darkened color)
//   let darkerR = r * 0.8; // Reduce the red component by 20%
//   let darkerG = g * 0.8; // Reduce the green component by 20%
//   let darkerB = b * 0.8; // Reduce the blue component by 20%
//   fill(darkerR, darkerG, darkerB);
//   ellipse(duck.x + 5, duck.y + 2, 20, 12); // Wing ellipse
// }

// Function to draw a duck with scaling
function drawDuck(duck, r, g, b) {
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
  fill(r, g, b);
  ellipse(duck.x, duck.y, scaledBodyWidth, scaledBodyHeight); // Body ellipse

  // Draw the duck's head
  fill(r, g, b);
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
  fill(r, g, b);
  triangle(
    duck.x + (10 * scale), duck.y - (7 * scale),
    duck.x + (20 * scale), duck.y - (10 * scale),
    duck.x + (14.5 * scale), duck.y + (4 * scale)
  ); // Tail triangle
  
  // Draw the duck's wing (darkened color)
  let darkerR = r * 0.8; // Reduce the red component by 20%
  let darkerG = g * 0.8; // Reduce the green component by 20%
  let darkerB = b * 0.8; // Reduce the blue component by 20%
  fill(darkerR, darkerG, darkerB);
  ellipse(duck.x + (5 * scale), duck.y + (2 * scale), scaledWingWidth, scaledWingHeight); // Wing ellipse
}