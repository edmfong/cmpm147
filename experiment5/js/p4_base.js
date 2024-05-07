/* exported preload, setup, draw */
/* global memory, dropper, shapeDropper, restart, rate, slider, activeScore, bestScore, fpsCounter, inspirations */
/* global p4_inspirations, p4_initialize, p4_render, p4_mutate */

let bestDesign;
let currentDesign;
let currentScore;
let currentInspiration;
let currentCanvas;
let currentInspirationPixels;
let currentShape = "duck"; // Default shape type

let width = 400;
let height = 400;

function preload() {
  let allInspirations = p4_inspirations();

  // Load images for each inspiration
  allInspirations.forEach((insp, index) => {
    insp.image = loadImage(insp.assetUrl, () => {
      // Image loaded callback (optional)
      // console.log(`Loaded image for ${insp.name}`);
    });
    
    // Create and append options for dropdown menu
    let option = document.createElement("option");
    option.value = index;
    option.innerHTML = insp.name;
    dropper.appendChild(option);
  });

  // Handle dropdown change event
  dropper.onchange = e => inspirationChanged(allInspirations[e.target.value]);

  // Initialize currentInspiration (after all images are loaded)
  currentInspiration = allInspirations[0];

  // Handle shape dropdown change event
  shapeDropper.onchange = e => {
    currentShape = e.target.value;
    inspirationChanged(currentInspiration);
  };

  // Handle restart button click event
  restart.onclick = () => inspirationChanged(allInspirations[dropper.value]);

  // Handle file upload button click event
  document.getElementById('uploadButton').addEventListener('click', function() {
    document.getElementById('uploadInput').click();
  });

  // Handle file input change event
  document.getElementById('uploadInput').addEventListener('change', handleImageUpload);

  // Function to handle image upload
  function handleImageUpload(event) {
    const file = event.target.files[0];

    // Check if a file was selected
    if (!file) {
      return;
    }

    // Get the file extension from the file name
    const fileNameParts = file.name.split('.');
    const fileExtension = fileNameParts[fileNameParts.length - 1].toLowerCase();

    // Allowed image file extensions (add/remove extensions as needed)
    const allowedExtensions = ['png', 'jpg', 'jpeg', 'webp'];

    // Check if the file extension is among the allowed image formats
    if (!allowedExtensions.includes(fileExtension)) {
      alert('Please upload a PNG, JPG, or WebP image file.');
      return;
    }

    // Proceed with uploading the image
    addUserUploadedImage(file);
  }
}

function addUserUploadedImage(file) {
  const reader = new FileReader();

  reader.onload = function(e) {
    const imageUrl = e.target.result;
    const fileName = file.name;

    // Create a new Image object to load the uploaded image
    const img = loadImage(imageUrl, () => {
      // Image loaded callback function
      // console.log(`Uploaded image (${fileName}) loaded successfully!`);
      
      // Create a new inspiration object using the uploaded image
      const userUploadInspiration = {
        name: fileName,
        assetUrl: imageUrl,
        credit: "User Uploaded",
        image: img  // Store the loaded image in the inspiration object
      };

      // Add the new inspiration to the inspirations array
      inspirations.push(userUploadInspiration);

      // Update UI or trigger other actions
      updateInspirationDropdown(); // Update dropdown menu after adding the image
      inspirationChanged(userUploadInspiration);
      dropper.value = inspirations.length - 1;
    });
  };

  // Read the uploaded file as a data URL
  reader.readAsDataURL(file);
}

function updateInspirationDropdown() {
  const dropper = document.getElementById('dropper');

  // Clear existing options
  dropper.innerHTML = '';

  // Re-populate options based on updated inspirations array
  inspirations.forEach((inspiration, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = inspiration.name;
    dropper.appendChild(option);
  });

  // Optionally, trigger the inspirationChanged function if needed
  // inspirationChanged(inspirations[0]); // Select the first inspiration by default
}

function inspirationChanged(nextInspiration) {
  currentInspiration = nextInspiration;
  currentDesign = undefined;
  // Introduce a delay of 1000 milliseconds (1 second) before executing the next action
  setTimeout(() => {
    memory.innerHTML = "";
  }, 100); // Delay duration in milliseconds
  setup();
}


function setup() {
  currentCanvas = createCanvas(width, height);
  currentCanvas.parent(document.getElementById("active"));
  currentScore = Number.NEGATIVE_INFINITY;
  currentDesign = p4_initialize(currentInspiration);
  bestDesign = currentDesign;
  // Set currentInspiration after image is loaded
  // console.log(currentInspiration.image)
  image(currentInspiration.image, 0, 0, width, height); // Display image on canvas
  loadPixels();
  currentInspirationPixels = pixels;
  
  // // Get the originalImage element by its ID
  // let originalImage = document.getElementById('originalImage');

  // // Set the 'src' attribute of the originalImage element to the assetUrl of currentInspiration
  // originalImage.src = currentInspiration.assetUrl;

  // // Set the width and height of the originalImage element to match the canvas dimensions
  // originalImage.width = width;
  // originalImage.height = height;
  $('#original').empty();
  $('#original').append('<img src="' + currentInspiration.assetUrl + '" style="width: ' + width + 'px; height: ' + height + 'px;">');
  $(".caption").text(currentInspiration.credit);
  
}


function evaluate() {
  loadPixels();

  let error = 0;
  let n = pixels.length;
  
  for (let i = 0; i < n; i++) {
    error += sq(pixels[i] - currentInspirationPixels[i]);
  }
  return 1/(1+error/n);
}



function memorialize() {
  let url = currentCanvas.canvas.toDataURL();

  let img = document.createElement("img");
  img.classList.add("memory");
  img.src = url;
  img.width = width;
  img.heigh = height;
  img.title = currentScore;

  document.getElementById("best").innerHTML = "";
  document.getElementById("best").appendChild(img.cloneNode());

  img.width = width / 4;
  img.height = height / 4;

  memory.insertBefore(img, memory.firstChild);

  if (memory.childNodes.length > memory.dataset.maxItems) {
    memory.removeChild(memory.lastChild);
  }
}

let mutationCount = 0;

function draw() {
  
  if(!currentDesign) {
    return;
  }
  randomSeed(mutationCount++);
  currentDesign = JSON.parse(JSON.stringify(bestDesign));
  // console.log(currentDesign);
  rate.innerHTML = slider.value;
  p4_mutate(currentDesign, currentInspiration, slider.value/100.0);
  
  randomSeed(0);
  p4_render(currentDesign, currentInspiration);
  let nextScore = evaluate();
  activeScore.innerHTML = nextScore;
  if (nextScore > currentScore) {
    currentScore = nextScore;
    bestDesign = currentDesign;
    memorialize();
    bestScore.innerHTML = currentScore;
  }
  
  fpsCounter.innerHTML = Math.round(frameRate());
}
