"use strict";

// Project base code provided by {amsmith,ikarth}@ucsc.edu

const w1 = (sketch) => {
    let tile_width_step_main; // A width step is half a tile's width
    let tile_height_step_main; // A height step is half a tile's height

    // Global variables. These will mostly be overwritten in setup().
    let tile_rows, tile_columns;
    let camera_offset;
    let camera_velocity;
    let defaultTextSize = 12;

    let width = 800;
    let height = 400;

    let worldSeed;
    let duck;
    let direction = 'north';
    let tilesetImage;
    let num = 0;
    let tileIds = [];

    

    function test() {
        console.log('test');
    }

    sketch.resizeScreen = () => {
        centerHorz = canvasContainer.width() / 2; // Adjusted for drawing logic
        centerVert = canvasContainer.height() / 2; // Adjusted for drawing logic
        console.log("Resizing...");
        sketch.resizeCanvas(canvasContainer.width(), canvasContainer.height());
        // redrawCanvas(); // Redraw everything based on new size
    };

    sketch.setup = () => {
        let canvas = sketch.createCanvas(width, height);
        canvas.parent("canvas-container3");
      
        camera_offset = new p5.Vector(-width / 2, height / 2);
        camera_velocity = new p5.Vector(0, 0);
      
        if (sketch.p3_setup) {
            sketch.p3_setup();
        }
      
        let label = sketch.createP();
        label.html("World key: ");
        label.parent("canvas-container3");
      
        let input = sketch.createInput("quack");
        input.parent(label);
        input.input(() => {
          rebuildWorld(input.value());
        });
      
        sketch.createP("WASD or click adjacent tiles to move.").parent("canvas-container3");
      
        rebuildWorld(input.value());
    }

    sketch.draw = () => {
        // Keyboard controls!
        if (sketch.keyIsDown(65)) {
            handleKeyPressWithCooldown('ArrowLeft', 200, () => {
                p3_tileClicked(duck.i + 1, duck.j - 1);
            });
        }
      
        else if (sketch.keyIsDown(68)) {
            handleKeyPressWithCooldown('ArrowRight', 200, () => {
                p3_tileClicked(duck.i - 1, duck.j + 1);
            });
        }
      
        else if (sketch.keyIsDown(87)) {
            handleKeyPressWithCooldown('ArrowUp', 200, () => {
                p3_tileClicked(duck.i - 1, duck.j - 1);
            });
        }
      
        else if (sketch.keyIsDown(83)) {
            handleKeyPressWithCooldown('ArrowDown', 200, () => {
                p3_tileClicked(duck.i + 1, duck.j + 1);
            });
        }

        let camera_delta = new p5.Vector(0, 0);
        camera_velocity.add(camera_delta);
        camera_offset.add(camera_velocity);
        camera_velocity.mult(0.95); // cheap easing
        if (camera_velocity.mag() < 0.01) {
            camera_velocity.setMag(0);
        }
      
        let world_pos = screenToWorld([0 - sketch.mouseX, sketch.mouseY], [camera_offset.x, camera_offset.y]);
        let world_offset = cameraToWorldOffset([camera_offset.x, camera_offset.y]);
      
        sketch.background("#26B1FF");
      
        p3_drawBefore();
      
        let overdraw = 0.1;
      
        let y0 = sketch.floor((0 - overdraw) * tile_rows);
        let y1 = sketch.floor((1 + overdraw) * tile_rows);
        let x0 = sketch.floor((0 - overdraw) * tile_columns);
        let x1 = sketch.floor((1 + overdraw) * tile_columns);
      
        for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
                drawTile(tileRenderingOrder([x + world_offset.x, y - world_offset.y]), [
                camera_offset.x,
                camera_offset.y
            ]); // odd row
          }
            for (let x = x0; x < x1; x++) {
                drawTile(tileRenderingOrder([x + 0.5 + world_offset.x, y + 0.5 - world_offset.y]), [camera_offset.x, camera_offset.y]); // even rows are offset horizontally
            }
        }
      
        describeMouseTile(world_pos, [camera_offset.x, camera_offset.y]);
      
        p3_drawAfter();
    }

    // Draw a tile, mostly by calling the user's drawing code.
    function drawTile([world_x, world_y], [camera_x, camera_y]) {
        let [screen_x, screen_y] = worldToScreen([world_x, world_y], [camera_x, camera_y]);
        sketch.push();
        sketch.translate(0 - screen_x, screen_y);
        p3_drawTile(world_x, world_y, -screen_x, screen_y);
        sketch.pop();
    }

    // Display a discription of the tile at world_x, world_y.
    function describeMouseTile([world_x, world_y], [camera_x, camera_y]) {
        let [screen_x, screen_y] = worldToScreen([world_x, world_y], [camera_x, camera_y]);
        drawTileDescription([world_x, world_y], [0 - screen_x, screen_y]);
    }
    
    function drawTileDescription([world_x, world_y], [screen_x, screen_y]) {
        sketch.push();
        sketch.translate(screen_x, screen_y);
        p3_drawSelectedTile(world_x, world_y, screen_x, screen_y);
        sketch.pop();
    }
    
    function rebuildWorld(key) {
        p3_worldKeyChanged(key);
        tile_width_step_main = window.p3_tileWidth ? p3_tileWidth() : 32;
        tile_height_step_main = window.p3_tileHeight ? p3_tileHeight() : 14.5;
        tile_columns = sketch.ceil(width / (tile_width_step_main * 2));
        tile_rows = sketch.ceil(height / (tile_height_step_main * 2));
        tileIds = [];
    }

    sketch.mouseClicked = (event) => {
        if (event.target.tagName.toLowerCase() !== 'a') {
            // Only execute custom behavior if not clicking on a link
            let world_pos = screenToWorld([0 - sketch.mouseX, sketch.mouseY], [camera_offset.x, camera_offset.y]);
            p3_tileClicked(world_pos[0], world_pos[1]);
            return false; // Prevent default behavior only if not clicking on a link
        }
    }

    // Define an object to keep track of the last pressed time of each arrow key
    const lastKeyPressTime = {
        ArrowLeft: 0,
        ArrowRight: 0,
        ArrowUp: 0,
        ArrowDown: 0
    };

    function worldToScreen([world_x, world_y], [camera_x, camera_y]) {
        let i = (world_x - world_y) * tile_width_step_main;
        let j = (world_x + world_y) * tile_height_step_main;
        return [i + camera_x, j + camera_y];
    }
      
    function worldToCamera([world_x, world_y], [camera_x, camera_y]) {
        let i = (world_x - world_y) * tile_width_step_main;
        let j = (world_x + world_y) * tile_height_step_main;
        return [i, j];
    }
    
    function tileRenderingOrder(offset) {
        return [offset[1] - offset[0], offset[0] + offset[1]];
    }
    
    function screenToWorld([screen_x, screen_y], [camera_x, camera_y]) {
        screen_x -= camera_x;
        screen_y -= camera_y;
        screen_x /= tile_width_step_main * 2;
        screen_y /= tile_height_step_main * 2;
        screen_y += 0.5;
        return [sketch.floor(screen_y + screen_x), sketch.floor(screen_y - screen_x)];
    }
    
    function cameraToWorldOffset([camera_x, camera_y]) {
        let world_x = camera_x / (tile_width_step_main * 2);
        let world_y = camera_y / (tile_height_step_main * 2);
        return { x: sketch.round(world_x), y: sketch.round(world_y) };
    }
    
    function worldOffsetToCamera([world_x, world_y]) {
        let camera_x = world_x * (tile_width_step_main * 2);
        let camera_y = world_y * (tile_height_step_main * 2);
        return new p5.Vector(camera_x, camera_y);
    }
    
    // Function to handle key press based on cooldown
    function handleKeyPressWithCooldown(key, cooldownMillis, action) {
        const currentTime = Date.now();
        if (currentTime - lastKeyPressTime[key] >= cooldownMillis) {
            // Perform the action associated with the key press
            action();
            // Update the last pressed time for this key
            lastKeyPressTime[key] = currentTime;
        }
    }

    sketch.preload = () => {
        p3_preload();
    }

    function p3_preload() {
        tilesetImage = sketch.loadImage("./assets/exp4_tilesheet.png");  
    }
    
    function p3_setup() {}
    
    function p3_worldKeyChanged(key) {
        worldSeed = XXH.h32(key, 0);
        sketch.noiseSeed(worldSeed);
        sketch.randomSeed(worldSeed);
        
        duck = { i: 0, j: 0, altitude:0 };
        
        camera_offset.set(-width / 2, height / 2); // Set camera offset back to initial position
    }
    
    function p3_tileWidth() {
        return 32;
    }
    function p3_tileHeight() {
        return 16;
    }
    
    let [tw, th] = [p3_tileWidth(), p3_tileHeight()];
    
    let clicks = {};
    
    function p3_tileClicked(i, j) {
        // Calculate the difference in indices between the duck's current position and the clicked tile
        const di = i - duck.i;
        const dj = j - duck.j;
        
        // Check if the clicked tile is a valid moveable tile (not garbage)
        let isGarbageTile = isTileGarbage(i, j);
    
    
        // Check if the clicked tile is within 1 tile distance from the duck's current position
        if ((!isGarbageTile) && sketch.abs(di) <= 1 && sketch.abs(dj) <= 1 && (di !== 0 || dj !== 0)) {
            // Update the duck's position to the clicked tile
            duck.i = i;
            duck.j = j;
        
            // Determine the movement direction based on the difference in indices
            let movementX = 0;
            let movementY = 0;
        
            if (di > 0 && dj === 0) {
                // Move up
                direction = 'south';
                movementX = -tw * .1 / 2;
                movementY = -th * .1 / 2;
            } else if (di < 0 && dj === 0) {
                // Move down
                direction = 'north';
                movementX = tw * .1 / 2;
                movementY = th * .1 / 2;
            } else if (di === 0 && dj > 0) {
                // Move right
                direction = 'east';
                movementX = tw * .1 / 2;
                movementY = -th * .1 / 2;
            } else if (di === 0 && dj < 0) {
                // Move left
                direction = 'west';
                movementX = -tw * .1 / 2;
                movementY = th * .1 / 2;
            } else if (di > 0 && dj < 0) {
                // Move up-left (diagonal)
                direction = 'southwest';
                movementX = -tw * .1;
            } else if (di > 0 && dj > 0) {
                // Move up-right (diagonal)
                // direction = 'southeast';
                movementY = -th * .1;
        
            } else if (di < 0 && dj < 0) {
                // Move down-left (diagonal)
                // direction = 'northwest';
                movementY = th * .1;
            } else if (di < 0 && dj > 0) {
                // Move down-right (diagonal)
                direction = 'northeast';
                movementX = tw * .1;
            }
        
            // Adjust camera velocity based on the movement direction
            camera_velocity.x += movementX;
            camera_velocity.y += movementY;
        }
    }
    
    function p3_drawBefore() {}
    
    function p3_drawTile(i, j) {
        const tileIdentifier = `tile:${i},${j}`;
        const tileHash = XXH.h32(tileIdentifier, worldSeed);
        
        let garbageTile = false;
        let waveTile = false;
        let tileId;
        let tileId2;
        let waveIndex;
        
        sketch.noStroke();
    
        if (tileHash % 50 == 0) { // draw ocean
            tileId = getGarbageTileId(i, j); // Retrieve the tile's unique ID if already assigned
            
            if (!tileId) {
                // Assign a new unique ID to this tile
                tileId = num % 42;
                setGarbageTileId(i, j, tileId); // Store the unique ID for this tile
            }

            garbageTile = true;
            num++;
        }
        
            
        else if (tileHash % 6 == 0) { // draw waves
            tileId2 = getWaveTileId(i, j);

            if (tileId2 === null) {
                // Assign a new unique ID to this tile
                waveIndex = num % 7; // set starid, rgb
                setWaveTileId(i, j, waveIndex); // Store the unique ID for this tile
            }

            waveTile = true;
            num++;
        }
    
        sketch.push();
        
        if (waveTile) {
            drawWave(tileId2);
        }
        
        if (garbageTile) {
            drawGarbage(tileId);
        }
    
        if (duck.i == i && duck.j == j) {
            drawDuck(0, 0, direction);
        }
    
        sketch.pop();
    }
    
    function p3_drawSelectedTile(i, j) {
        const di = i - duck.i;
        const dj = j - duck.j;
    
        // Check if the selected tile is within 1 tile distance from the duck's current position
        const isMoveable = sketch.abs(di) <= 1 && sketch.abs(dj) <= 1 && (di !== 0 || dj !== 0);
    
        // Check if the selected tile is a garbage tile
        const isGarbageTile = isTileGarbage(i, j);
        
        if (!isMoveable || isGarbageTile) {
            // Not a valid moveable tile or a garbage tile
            sketch.stroke(255, 0, 0, 128); // Red stroke
            sketch.fill(255, 0, 0, 64); // Red fill
        } else {
            // Valid moveable tile within 1 tile of the duck
            sketch.stroke(0, 255, 0, 128); // Green stroke
            sketch.fill(0, 255, 0, 64); // Green fill
        }
    
        // Draw the selected tile shape
        sketch.beginShape();
        sketch.vertex(-tw, 0);
        sketch.vertex(0, th);
        sketch.vertex(tw, 0);
        sketch.vertex(0, -th);
        sketch.endShape(sketch.CLOSE);
    
        // Reset stroke and fill settings for subsequent drawing
        sketch.noStroke();
        sketch.fill(0);
        //text("tile " + [i, j], 0, 0);
    }
    
    function p3_drawAfter() {}
    
    
    // Function to draw a duck
    function drawDuck(x, y, direction) {
        let col = 0;
        let row = 2;
        
        sketch.push(); // Save current drawing state
        
        sketch.translate(x, y); // Move the entire duck to the specified position
        
        if (direction === "north" || direction === "northeast" || direction === "northwest" || direction === "east") {
            row = 2;
        }
            
        if (direction === "south" || direction === "southeast" || direction === "southwest" || direction === "west") {
            row = 0;
        }
        
        sketch.image(tilesetImage, -16, -24, 32, 32, 16 * col, 16 * row, 16, 16)
        
        sketch.pop(); // Restore previous drawing state
    }
    
    // Function to draw garbage
    function drawGarbage(index) {
        let tilesheetCoordinate = [
            [2, 0], [2, 2], [2, 4], [2, 6], [2, 8], [2, 10], [2, 12], [2, 14], [2, 16], [2, 18],
            [3, 0], [3, 2], [3, 4], [3, 6], [3, 8], [3, 10], [3, 12], [3, 14], [3, 16], [3, 18],
            [0, 0],
            [4, 0], [4, 2], [4, 4], [4, 6], [4, 8], [4, 10], [4, 12], [4, 14], [4, 16], [4, 18],
            [5, 0], [5, 2], [5, 4], [5, 6], [5, 8], [5, 10], [5, 12], [5, 14], [5, 16], [5, 18],
            [0, 2]
        ];
        let nextTexture = tilesheetCoordinate[index];
        let col = nextTexture[0];
        let row = nextTexture[1];
        
        sketch.push(); // Save current drawing state
        
        sketch.image(tilesetImage, -16, -24, 32, 32, 16 * col, 16 * row, 16, 16);
        
        sketch.pop(); // Restore previous drawing state
    }
    
    // Function to retrieve tile ID from the tileIds map
    function getGarbageTileId(i, j) {
        const key = `${i},${j}`;
        return tileIds[key] || null;
    }
    
    // Function to set tile ID in the tileIds map
    function setGarbageTileId(i, j, tileId) {
        const key = `${i},${j}`;
        tileIds[key] = tileId;
    }
    
    function isTileGarbage(i, j) {
        const tileIdentifier = `tile:${i},${j}`;
        const tileHash = XXH.h32(tileIdentifier, worldSeed);
        return tileHash % 50 === 0;
    }
    
    function drawWave(index) {
        let tilesheetCoordinateY = [0, 1, 2, 3, 4, 5, 6];
        let col = 19;
        let row = tilesheetCoordinateY[index];
        
        sketch.push(); 
        
        sketch.image(tilesetImage, -16, -24, 32, 32, 16 * col, 16 * row, 16, 16);
        
        sketch.pop(); // Restore previous drawing state
    }
    
    // Function to retrieve tile ID from the tileIds map
    function getWaveTileId(i, j) {
        const key = `${i},${j}`;
        return tileIds[key] || null;
    }
    
    // Function to set tile ID in the tileIds map
    function setWaveTileId(i, j, tileId) {
        const key = `${i},${j}`;
        tileIds[key] = tileId;
    }
}

let world1 = new p5(w1, 'w1');

const w2 = (sketch) => {
    let tile_width_step_main; // A width step is half a tile's width
    let tile_height_step_main; // A height step is half a tile's height

    // Global variables. These will mostly be overwritten in setup().
    let tile_rows, tile_columns;
    let camera_offset;
    let camera_velocity;
    let defaultTextSize = 12;

    let width = 800;
    let height = 400;

    let worldSeed;
    let duck;
    let direction = 'north';
    let tilesetImage;
    let num = 0;
    let tileIds = [];

    sketch.resizeScreen = () => {
        centerHorz = canvasContainer.width() / 2; // Adjusted for drawing logic
        centerVert = canvasContainer.height() / 2; // Adjusted for drawing logic
        console.log("Resizing...");
        sketch.resizeCanvas(canvasContainer.width(), canvasContainer.height());
        // redrawCanvas(); // Redraw everything based on new size
    };

    sketch.setup = () => {
        let canvas = sketch.createCanvas(width, height);
        canvas.parent("canvas-container2");
      
        camera_offset = new p5.Vector(-width / 2, height / 2);
        camera_velocity = new p5.Vector(0, 0);
      
        if (sketch.p3_setup) {
            sketch.p3_setup();
        }
      
        let label = sketch.createP();
        label.html("World key: ");
        label.parent("canvas-container2");
      
        let input = sketch.createInput("quack");
        input.parent(label);
        input.input(() => {
          rebuildWorld(input.value());
        });
      
        sketch.createP("WASD or click adjacent tiles to move.").parent("canvas-container2");
      
        rebuildWorld(input.value());
    }

    sketch.draw = () => {
        // Keyboard controls!
        if (sketch.keyIsDown(65)) {
            handleKeyPressWithCooldown('ArrowLeft', 200, () => {
                p3_tileClicked(duck.i + 1, duck.j - 1);
            });
        }
      
        else if (sketch.keyIsDown(68)) {
            handleKeyPressWithCooldown('ArrowRight', 200, () => {
                p3_tileClicked(duck.i - 1, duck.j + 1);
            });
        }
      
        else if (sketch.keyIsDown(87)) {
            handleKeyPressWithCooldown('ArrowUp', 200, () => {
                p3_tileClicked(duck.i - 1, duck.j - 1);
            });
        }
      
        else if (sketch.keyIsDown(83)) {
            handleKeyPressWithCooldown('ArrowDown', 200, () => {
                p3_tileClicked(duck.i + 1, duck.j + 1);
            });
        }

        let camera_delta = new p5.Vector(0, 0);
        camera_velocity.add(camera_delta);
        camera_offset.add(camera_velocity);
        camera_velocity.mult(0.95); // cheap easing
        if (camera_velocity.mag() < 0.01) {
            camera_velocity.setMag(0);
        }
      
        let world_pos = screenToWorld([0 - sketch.mouseX, sketch.mouseY], [camera_offset.x, camera_offset.y]);
        let world_offset = cameraToWorldOffset([camera_offset.x, camera_offset.y]);

        sketch.background(0);
      
        p3_drawBefore();
      
        let overdraw = 0.1;
      
        let y0 = sketch.floor((0 - overdraw) * tile_rows);
        let y1 = sketch.floor((1 + overdraw) * tile_rows);
        let x0 = sketch.floor((0 - overdraw) * tile_columns);
        let x1 = sketch.floor((1 + overdraw) * tile_columns);
      
        for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
                drawTile(tileRenderingOrder([x + world_offset.x, y - world_offset.y]), [
                camera_offset.x,
                camera_offset.y
            ]); // odd row
          }
            for (let x = x0; x < x1; x++) {
                drawTile(tileRenderingOrder([x + 0.5 + world_offset.x, y + 0.5 - world_offset.y]), [camera_offset.x, camera_offset.y]); // even rows are offset horizontally
            }
        }
      
        describeMouseTile(world_pos, [camera_offset.x, camera_offset.y]);
      
        p3_drawAfter();
    }

    // Draw a tile, mostly by calling the user's drawing code.
    function drawTile([world_x, world_y], [camera_x, camera_y]) {
        let [screen_x, screen_y] = worldToScreen([world_x, world_y], [camera_x, camera_y]);
        sketch.push();
        sketch.translate(0 - screen_x, screen_y);
        p3_drawTile(world_x, world_y, -screen_x, screen_y);
        sketch.pop();
    }

    // Display a discription of the tile at world_x, world_y.
    function describeMouseTile([world_x, world_y], [camera_x, camera_y]) {
        let [screen_x, screen_y] = worldToScreen([world_x, world_y], [camera_x, camera_y]);
        drawTileDescription([world_x, world_y], [0 - screen_x, screen_y]);
    }
    
    function drawTileDescription([world_x, world_y], [screen_x, screen_y]) {
        sketch.push();
        sketch.translate(screen_x, screen_y);
        p3_drawSelectedTile(world_x, world_y, screen_x, screen_y);
        sketch.pop();
    }
    
    function rebuildWorld(key) {
        p3_worldKeyChanged(key);
        tile_width_step_main = window.p3_tileWidth ? p3_tileWidth() : 32;
        tile_height_step_main = window.p3_tileHeight ? p3_tileHeight() : 14.5;
        tile_columns = sketch.ceil(width / (tile_width_step_main * 2));
        tile_rows = sketch.ceil(height / (tile_height_step_main * 2));
        tileIds = [];
    }

    sketch.mouseClicked = (event) => {
        if (event.target.tagName.toLowerCase() !== 'a') {
            // Only execute custom behavior if not clicking on a link
            let world_pos = screenToWorld([0 - sketch.mouseX, sketch.mouseY], [camera_offset.x, camera_offset.y]);
            p3_tileClicked(world_pos[0], world_pos[1]);
            return false; // Prevent default behavior only if not clicking on a link
        }
    }

    // Define an object to keep track of the last pressed time of each arrow key
    const lastKeyPressTime = {
        ArrowLeft: 0,
        ArrowRight: 0,
        ArrowUp: 0,
        ArrowDown: 0
    };

    function worldToScreen([world_x, world_y], [camera_x, camera_y]) {
        let i = (world_x - world_y) * tile_width_step_main;
        let j = (world_x + world_y) * tile_height_step_main;
        return [i + camera_x, j + camera_y];
    }
      
    function worldToCamera([world_x, world_y], [camera_x, camera_y]) {
        let i = (world_x - world_y) * tile_width_step_main;
        let j = (world_x + world_y) * tile_height_step_main;
        return [i, j];
    }
    
    function tileRenderingOrder(offset) {
        return [offset[1] - offset[0], offset[0] + offset[1]];
    }
    
    function screenToWorld([screen_x, screen_y], [camera_x, camera_y]) {
        screen_x -= camera_x;
        screen_y -= camera_y;
        screen_x /= tile_width_step_main * 2;
        screen_y /= tile_height_step_main * 2;
        screen_y += 0.5;
        return [sketch.floor(screen_y + screen_x), sketch.floor(screen_y - screen_x)];
    }
    
    function cameraToWorldOffset([camera_x, camera_y]) {
        let world_x = camera_x / (tile_width_step_main * 2);
        let world_y = camera_y / (tile_height_step_main * 2);
        return { x: sketch.round(world_x), y: sketch.round(world_y) };
    }
    
    function worldOffsetToCamera([world_x, world_y]) {
        let camera_x = world_x * (tile_width_step_main * 2);
        let camera_y = world_y * (tile_height_step_main * 2);
        return new p5.Vector(camera_x, camera_y);
    }
    
    // Function to handle key press based on cooldown
    function handleKeyPressWithCooldown(key, cooldownMillis, action) {
        const currentTime = Date.now();
        if (currentTime - lastKeyPressTime[key] >= cooldownMillis) {
            // Perform the action associated with the key press
            action();
            // Update the last pressed time for this key
            lastKeyPressTime[key] = currentTime;
        }
    }

    sketch.preload = () => {
        p3_preload();
    }

    function p3_preload() {
        tilesetImage = sketch.loadImage("./assets/exp4_tilesheet.png");  
    }
    
    function p3_setup() {}
    
    function p3_worldKeyChanged(key) {
        worldSeed = XXH.h32(key, 0);
        sketch.noiseSeed(worldSeed);
        sketch.randomSeed(worldSeed);
        
        duck = { i: 0, j: 0, altitude:0 };
        
        camera_offset.set(-width / 2, height / 2); // Set camera offset back to initial position
    }
    
    function p3_tileWidth() {
        return 32;
    }
    function p3_tileHeight() {
        return 16;
    }
    
    let [tw, th] = [p3_tileWidth(), p3_tileHeight()];
    
    let clicks = {};
    
    function p3_tileClicked(i, j) {
        // Calculate the difference in indices between the duck's current position and the clicked tile
        const di = i - duck.i;
        const dj = j - duck.j;
    
        // Check if the clicked tile is within 1 tile distance from the duck's current position
        if (sketch.abs(di) <= 1 && sketch.abs(dj) <= 1 && (di !== 0 || dj !== 0)) {
            // Update the duck's position to the clicked tile
            duck.i = i;
            duck.j = j;
        
            // Determine the movement direction based on the difference in indices
            let movementX = 0;
            let movementY = 0;
        
            if (di > 0 && dj === 0) {
                // Move up
                direction = 'south';
                movementX = -tw * .1 / 2;
                movementY = -th * .1 / 2;
            } else if (di < 0 && dj === 0) {
                // Move down
                direction = 'north';
                movementX = tw * .1 / 2;
                movementY = th * .1 / 2;
            } else if (di === 0 && dj > 0) {
                // Move right
                direction = 'east';
                movementX = tw * .1 / 2;
                movementY = -th * .1 / 2;
            } else if (di === 0 && dj < 0) {
                // Move left
                direction = 'west';
                movementX = -tw * .1 / 2;
                movementY = th * .1 / 2;
            } else if (di > 0 && dj < 0) {
                // Move up-left (diagonal)
                direction = 'southwest';
                movementX = -tw * .1;
            } else if (di > 0 && dj > 0) {
                // Move up-right (diagonal)
                // direction = 'southeast';
                movementY = -th * .1;
        
            } else if (di < 0 && dj < 0) {
                // Move down-left (diagonal)
                // direction = 'northwest';
                movementY = th * .1;
            } else if (di < 0 && dj > 0) {
                // Move down-right (diagonal)
                direction = 'northeast';
                movementX = tw * .1;
            }
        
            // Adjust camera velocity based on the movement direction
            camera_velocity.x += movementX;
            camera_velocity.y += movementY;
        }
    }
    
    function p3_drawBefore() {}
    
    function p3_drawTile(i, j) {
        const tileIdentifier = `tile:${i},${j}`;
        const tileHash = XXH.h32(tileIdentifier, worldSeed);
        
        let planetTile = false;
        let starTile = false;
        let meteorTile = false;
        let tileId;
        let meteorIndex;
        let planetIndex;
        let colorIndex;
        let ringIndex;
        let scale;
        let starIndex;
        
        sketch.noStroke();
        
        if (tileHash % 100 == 0) { // draw planet
            tileId = getPlanetTileId(i, j); // Retrieve the tile's unique ID if already assigned
            
            if (tileId === null) {
                if (num % 10 === 0) {
                    // Assign a new unique ID to this tile
                    planetIndex = 4;
                    colorIndex = 5;
                    ringIndex = 9;
                    scale = 2;
                    setPlanetTileId(i, j, planetIndex, colorIndex, ringIndex, scale); // Store the unique ID for this tile
                }
                else {
                    // Assign a new unique ID to this tile
                    planetIndex = num % 4;
                    colorIndex = num % 6;
                    ringIndex = num % 10;
                    scale = sketch.random() * (4 - 2) + 2;
                    setPlanetTileId(i, j, planetIndex, colorIndex, ringIndex, scale); // Store the unique ID for this tile
                }
            }

            planetTile = true;
            num++;
        }  
        
        else if (tileHash % 111 == 0) { // draw meteor
            tileId = getMeteorTileId(i, j); // Retrieve the tile's unique ID if already assigned
            
            if (tileId === null) {
                // Assign a new unique ID to this tile
                meteorIndex = num % 2;
                scale = sketch.random() * (2 - 1) + 1;
                setMeteorTileId(i, j, meteorIndex, scale); // Store the unique ID for this tile
            }

            meteorTile = true;
            num++;
        }  
        
        if (tileHash % 2 == 0) { // draw stars
            tileId = getStarTileId(i, j);

            if (tileId === null) {
                // Assign a new unique ID to this tile
                starIndex = num % 7; // set starid, rgb
                setStarTileId(i, j, starIndex); // Store the unique ID for this tile
            }

            starTile = true;
            num++;
        }
    
        sketch.push();
        
        if (starTile) {
            drawStar(tileId);
        }
        
        if (meteorTile) {
            if (tileId !== null && typeof tileId === 'object' &&
                'meteorID' in tileId && 'scale' in tileId) {
                // Check if tileId is not null, is an object, and has all required properties
                drawMeteor(tileId.meteorID, tileId.scale);
        
            } 
        }
        
        if (planetTile) {
            if (tileId !== null && typeof tileId === 'object' &&
                'planetID' in tileId && 'colorID' in tileId &&
                'ringID' in tileId && 'scale' in tileId) {
                // Check if tileId is not null, is an object, and has all required properties
                drawPlanet(tileId.planetID, tileId.colorID, tileId.ringID, tileId.scale);
        
            } 
        }
        
        if (duck.i == i && duck.j == j) {
            drawDuck(0, 0, direction);
        }
    
        sketch.pop();
    }
    
    function p3_drawSelectedTile(i, j) {
        const di = i - duck.i;
        const dj = j - duck.j;
        
        // Check if the selected tile is within 1 tile distance from the duck's current position
        const isMoveable = sketch.abs(di) <= 1 && sketch.abs(dj) <= 1 && (di !== 0 || dj !== 0);
        
        if (!isMoveable) {
            // Not a valid moveable tile or a garbage tile
            sketch.stroke(255, 0, 0, 128); // Red stroke
            sketch.fill(255, 0, 0, 64); // Red fill
        } else {
            // Valid moveable tile within 1 tile of the duck
            sketch.stroke(0, 255, 0, 128); // Green stroke
            sketch.fill(0, 255, 0, 64); // Green fill
        }
    
        // Draw the selected tile shape
        sketch.beginShape();
        sketch.vertex(-tw, 0);
        sketch.vertex(0, th);
        sketch.vertex(tw, 0);
        sketch.vertex(0, -th);
        sketch.endShape(sketch.CLOSE);
    
        // Reset stroke and fill settings for subsequent drawing
        sketch.noStroke();
        sketch.fill(0);
        //text("tile " + [i, j], 0, 0);
    }
    
    function p3_drawAfter() {}
    
    
    // Function to draw a duck
    function drawDuck(x, y, direction) {
        let col = 0;
        let row = 2;
        
        sketch.push(); // Save current drawing state
        
        sketch.translate(x, y); // Move the entire duck to the specified position
        
        if (direction === "north" || direction === "northeast" || direction === "northwest" || direction === "east") {
            row = 6;
        }
            
        if (direction === "south" || direction === "southeast" || direction === "southwest" || direction === "west") {
            row = 4;
        }
        
        sketch.image(tilesetImage, -16, -24, 32, 32, 16 * col, 16 * row, 16, 16)
        
        sketch.pop(); // Restore previous drawing state
    }
    
    // Function to draw a planet
    function drawPlanet(planetIndex, colorIndex, ringIndex, scale) {
        let planet_coordinate = [[5, 0], [5, 1], [5, 2], [5, 3], [4, 0]];
        let color_coordinate = [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]];
        let ring_coordinate = [[6, 0], [6, 3], [6, 3], [6, 1], [6, 3], [6, 3], [6, 3], [6, 2], [6, 3], [6, 3]];
        
        let planet = planet_coordinate[planetIndex];
        let color = color_coordinate[colorIndex];
        let ring = ring_coordinate[ringIndex];
        
        let planet_col = planet[0]; 
        let planet_row = planet[1]; 
        let color_col = color[0]; 
        let color_row = color[1]; 
        let ring_col = ring[0]; 
        let ring_row = ring[1]; 
        let size = 64 * scale;
        
        sketch.push(); // Save current drawing state
        
        // rotate(radians(90));
        
        // Draw the base planet
        sketch.image(tilesetImage, -size / 2, -size / 2, size, size, 32 * planet_col, 32 * planet_row, 32, 32);
        // Draw the color
        sketch.image(tilesetImage, -size / 2, -size / 2, size, size, 32 * color_col, 32 * color_row, 32, 32);
        // Draw the ring
        sketch.image(tilesetImage, -size / 2, -size / 2, size, size, 32 * ring_col, 32 * ring_row, 32, 32);
            
            
        sketch.pop(); // Restore previous drawing state
    }
    
    // Function to retrieve tile data from the tileIds map
    function getPlanetTileId(i, j) {
        const key = `${i},${j}`;
        const tileData = tileIds[key]; // Retrieve the tile data object from tileIds
        
        if (tileData) {
            // If tile data exists, return an object with desired properties
            return {
            planetID: tileData.planetID,
            colorID: tileData.colorID,
            ringID: tileData.ringID,
            scale: tileData.scale
            };
        } else {
            // If tile data does not exist, return null
            return null;
        }
    }
    
    // Function to set tile ID in the tileIds map
    function setPlanetTileId(i, j, planet, color, ring, scale) {
        const key = `${i},${j}`;
        
        // Check if placing a new planet at (i, j) violates proximity constraints
        if (isPlanetPlacementValid(i, j, 7)) {
            tileIds[key] = {
            planetID: planet,
            colorID: color,
            ringID: ring,
            scale: scale,
            };
        } 
    }
    
    // Function to check if a new planet placement is valid based on proximity constraints
    function isPlanetPlacementValid(x, y, minDistance) {
        // Iterate through neighboring tiles within the specified distance
        for (let dx = -minDistance; dx <= minDistance; dx++) {
            for (let dy = -minDistance; dy <= minDistance; dy++) {
            const nx = x + dx;
            const ny = y + dy;
        
            if (nx === x && ny === y) {
                continue; // Skip the current tile (center)
            }
        
            const neighborKey = `${nx},${ny}`;
        
            // Check if a planet is already placed in the neighboring tile
            if (tileIds[neighborKey] && tileIds[neighborKey].planetID !== undefined) {
                const distSq = dx * dx + dy * dy;
        
                // Check if the neighboring planet is within the minimum distance
                if (distSq < minDistance * minDistance) {
                    return false; // Invalid placement due to proximity constraint violation
                }
            }
        }
    }
    
    return true; // Valid placement, no nearby planets within the minimum distance
    }
    
    function drawStar(index) {
        let tilesheetCoordinateY = [0, 1, 2, 3 , 4, 5, 6];
        let col = 17;
        let row = tilesheetCoordinateY[index];
        
        sketch.push(); 
        
        sketch.image(tilesetImage, -16, -24, 32, 32, 16 * col, 16 * row, 16, 16);
        
        sketch.pop(); // Restore previous drawing state
    }
    
    // Function to retrieve tile ID from the tileIds map
    function getStarTileId(i, j) {
        const key = `${i},${j}`;
        return tileIds[key] || null;
    }
    
    // Function to set tile ID in the tileIds map
    function setStarTileId(i, j, tileId) {
        const key = `${i},${j}`;
        tileIds[key] = tileId;
    }
    
    
    // Function to draw a meteor
    function drawMeteor(meteorIndex, scale) {
        let meteor_coordinate = [1, 2];
        
        let meteor_col = 4; 
        let meteor_row = meteor_coordinate[meteorIndex];
        let size = 64 * scale;
        
        sketch.push(); // Save current drawing state
        
        // rotate(radians(90));
        
        // Draw the base meteor
        sketch.image(tilesetImage, -size / 2, -size / 2, size, size, 32 * meteor_col, 32 * meteor_row, 32, 32);
        
            
            
        sketch.pop(); // Restore previous drawing meteor
    }
    
    // Function to retrieve tile data from the tileIds map
    function getMeteorTileId(i, j) {
        const key = `${i},${j}`;
        const tileData = tileIds[key]; // Retrieve the tile data object from tileIds
        
        if (tileData) {
            // If tile data exists, return an object with desired properties
            return {
            meteorID: tileData.meteorID,
            scale: tileData.scale
            };
        } else {
            // If tile data does not exist, return null
            return null;
        }
    }
    
    // Function to set tile ID in the tileIds map
    function setMeteorTileId(i, j, meteor, scale) {
        const key = `${i},${j}`;
        
        // Check if placing a new planet at (i, j) violates proximity constraints
        if (isMeteorPlacementValid(i, j, 7)) {
            tileIds[key] = {
            meteorID: meteor,
            scale: scale,
            };
        } 
    }
    
    // Function to check if a new meteor placement is valid based on proximity constraints
    function isMeteorPlacementValid(x, y, minDistance) {
    // Iterate through neighboring tiles within the specified distance
        for (let dx = -minDistance; dx <= minDistance; dx++) {
            for (let dy = -minDistance; dy <= minDistance; dy++) {
                const nx = x + dx;
                const ny = y + dy;
            
                if (nx === x && ny === y) {
                    continue; // Skip the current tile (center)
                }
            
                const neighborKey = `${nx},${ny}`;
            
                // Check if a planet is already placed in the neighboring tile
                if (tileIds[neighborKey] && tileIds[neighborKey].meteorID !== undefined) {
                    const distSq = dx * dx + dy * dy;
            
                    // Check if the neighboring planet is within the minimum distance
                    if (distSq < minDistance * minDistance) {
                        return false; // Invalid placement due to proximity constraint violation
                    }
                }
            }
        }
    
        return true; // Valid placement, no nearby planets within the minimum distance
    }
}

let world2 = new p5(w2, 'w2');

const w3 = (sketch) => {
    let tile_width_step_main; // A width step is half a tile's width
    let tile_height_step_main; // A height step is half a tile's height

    // Global variables. These will mostly be overwritten in setup().
    let tile_rows, tile_columns;
    let camera_offset;
    let camera_velocity;
    let defaultTextSize = 12;

    let width = 800;
    let height = 400;

    let worldSeed;
    let duck;
    let direction = 'north';
    let tilesetImage;
    let num = 0;
    let tileIds = [];
    let score = 0;

    sketch.resizeScreen = () => {
        centerHorz = canvasContainer.width() / 2; // Adjusted for drawing logic
        centerVert = canvasContainer.height() / 2; // Adjusted for drawing logic
        console.log("Resizing...");
        sketch.resizeCanvas(canvasContainer.width(), canvasContainer.height());
        // redrawCanvas(); // Redraw everything based on new size
    };

    sketch.setup = () => {
        let canvas = sketch.createCanvas(width, height);
        canvas.parent("canvas-container");
      
        camera_offset = new p5.Vector(-width / 2, height / 2);
        camera_velocity = new p5.Vector(0, 0);
      
        if (sketch.p3_setup) {
            sketch.p3_setup();
        }
      
        let label = sketch.createP();
        label.html("World key: ");
        label.parent("canvas-container");
      
        let input = sketch.createInput("quack");
        input.parent(label);
        input.input(() => {
          rebuildWorld(input.value());
        });
      
        sketch.createP("WASD or click adjacent tiles to move.<br>Collect bread to earn points.").parent("canvas-container");
        

        rebuildWorld(input.value());
    }

    sketch.draw = () => {
        // Keyboard controls!
        if (sketch.keyIsDown(65)) {
            handleKeyPressWithCooldown('ArrowLeft', 200, () => {
                p3_tileClicked(duck.i + 1, duck.j - 1);
            });
        }
      
        else if (sketch.keyIsDown(68)) {
            handleKeyPressWithCooldown('ArrowRight', 200, () => {
                p3_tileClicked(duck.i - 1, duck.j + 1);
            });
        }
      
        else if (sketch.keyIsDown(87)) {
            handleKeyPressWithCooldown('ArrowUp', 200, () => {
                p3_tileClicked(duck.i - 1, duck.j - 1);
            });
        }
      
        else if (sketch.keyIsDown(83)) {
            handleKeyPressWithCooldown('ArrowDown', 200, () => {
                p3_tileClicked(duck.i + 1, duck.j + 1);
            });
        }

        let camera_delta = new p5.Vector(0, 0);
        camera_velocity.add(camera_delta);
        camera_offset.add(camera_velocity);
        camera_velocity.mult(0.95); // cheap easing
        if (camera_velocity.mag() < 0.01) {
            camera_velocity.setMag(0);
        }
      
        let world_pos = screenToWorld([0 - sketch.mouseX, sketch.mouseY], [camera_offset.x, camera_offset.y]);
        let world_offset = cameraToWorldOffset([camera_offset.x, camera_offset.y]);

        sketch.background("#74C845");
      
        p3_drawBefore();
      
        let overdraw = 0.1;
      
        let y0 = sketch.floor((0 - overdraw) * tile_rows);
        let y1 = sketch.floor((1 + overdraw) * tile_rows);
        let x0 = sketch.floor((0 - overdraw) * tile_columns);
        let x1 = sketch.floor((1 + overdraw) * tile_columns);
      
        for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
                drawTile(tileRenderingOrder([x + world_offset.x, y - world_offset.y]), [
                camera_offset.x,
                camera_offset.y
            ]); // odd row
          }
            for (let x = x0; x < x1; x++) {
                drawTile(tileRenderingOrder([x + 0.5 + world_offset.x, y + 0.5 - world_offset.y]), [camera_offset.x, camera_offset.y]); // even rows are offset horizontally
            }
        }
      
        describeMouseTile(world_pos, [camera_offset.x, camera_offset.y]);
      
        p3_drawAfter();
        
        //discplay score for world 3
        sketch.textSize(24); // Set text size
        sketch.textAlign(sketch.LEFT, sketch.TOP); // Align text to center horizontally and top vertically
        sketch.text("Score: " + score, 20, 20); // Display the score text at the top
        sketch.textSize(defaultTextSize);
    }

    // Draw a tile, mostly by calling the user's drawing code.
    function drawTile([world_x, world_y], [camera_x, camera_y]) {
        let [screen_x, screen_y] = worldToScreen([world_x, world_y], [camera_x, camera_y]);
        sketch.push();
        sketch.translate(0 - screen_x, screen_y);
        p3_drawTile(world_x, world_y, -screen_x, screen_y);
        sketch.pop();
    }

    // Display a discription of the tile at world_x, world_y.
    function describeMouseTile([world_x, world_y], [camera_x, camera_y]) {
        let [screen_x, screen_y] = worldToScreen([world_x, world_y], [camera_x, camera_y]);
        drawTileDescription([world_x, world_y], [0 - screen_x, screen_y]);
    }
    
    function drawTileDescription([world_x, world_y], [screen_x, screen_y]) {
        sketch.push();
        sketch.translate(screen_x, screen_y);
        p3_drawSelectedTile(world_x, world_y, screen_x, screen_y);
        sketch.pop();
    }
    
    function rebuildWorld(key) {
        p3_worldKeyChanged(key);
        tile_width_step_main = window.p3_tileWidth ? p3_tileWidth() : 32;
        tile_height_step_main = window.p3_tileHeight ? p3_tileHeight() : 14.5;
        tile_columns = sketch.ceil(width / (tile_width_step_main * 2));
        tile_rows = sketch.ceil(height / (tile_height_step_main * 2));
        tileIds = [];
    }

    sketch.mouseClicked = (event) => {
        if (event.target.tagName.toLowerCase() !== 'a') {
            // Only execute custom behavior if not clicking on a link
            let world_pos = screenToWorld([0 - sketch.mouseX, sketch.mouseY], [camera_offset.x, camera_offset.y]);
            p3_tileClicked(world_pos[0], world_pos[1]);
            return false; // Prevent default behavior only if not clicking on a link
        }
    }

    // Define an object to keep track of the last pressed time of each arrow key
    const lastKeyPressTime = {
        ArrowLeft: 0,
        ArrowRight: 0,
        ArrowUp: 0,
        ArrowDown: 0
    };

    function worldToScreen([world_x, world_y], [camera_x, camera_y]) {
        let i = (world_x - world_y) * tile_width_step_main;
        let j = (world_x + world_y) * tile_height_step_main;
        return [i + camera_x, j + camera_y];
    }
      
    function worldToCamera([world_x, world_y], [camera_x, camera_y]) {
        let i = (world_x - world_y) * tile_width_step_main;
        let j = (world_x + world_y) * tile_height_step_main;
        return [i, j];
    }
    
    function tileRenderingOrder(offset) {
        return [offset[1] - offset[0], offset[0] + offset[1]];
    }
    
    function screenToWorld([screen_x, screen_y], [camera_x, camera_y]) {
        screen_x -= camera_x;
        screen_y -= camera_y;
        screen_x /= tile_width_step_main * 2;
        screen_y /= tile_height_step_main * 2;
        screen_y += 0.5;
        return [sketch.floor(screen_y + screen_x), sketch.floor(screen_y - screen_x)];
    }
    
    function cameraToWorldOffset([camera_x, camera_y]) {
        let world_x = camera_x / (tile_width_step_main * 2);
        let world_y = camera_y / (tile_height_step_main * 2);
        return { x: sketch.round(world_x), y: sketch.round(world_y) };
    }
    
    function worldOffsetToCamera([world_x, world_y]) {
        let camera_x = world_x * (tile_width_step_main * 2);
        let camera_y = world_y * (tile_height_step_main * 2);
        return new p5.Vector(camera_x, camera_y);
    }
    
    // Function to handle key press based on cooldown
    function handleKeyPressWithCooldown(key, cooldownMillis, action) {
        const currentTime = Date.now();
        if (currentTime - lastKeyPressTime[key] >= cooldownMillis) {
            // Perform the action associated with the key press
            action();
            // Update the last pressed time for this key
            lastKeyPressTime[key] = currentTime;
        }
    }

    sketch.preload = () => {
        p3_preload();
    }

    function p3_preload() {
        tilesetImage = sketch.loadImage("./assets/exp4_tilesheet.png");  
    }
    
    function p3_setup() {}
    
    function p3_worldKeyChanged(key) {
        worldSeed = XXH.h32(key, 0);
        sketch.noiseSeed(worldSeed);
        sketch.randomSeed(worldSeed);
        
        duck = { i: 0, j: 0, altitude:0 };
        
        score = 0;
        
        camera_offset.set(-width / 2, height / 2); // Set camera offset back to initial position
    }
    
    function p3_tileWidth() {
        return 32;
    }
    function p3_tileHeight() {
        return 16;
    }
    
    let [tw, th] = [p3_tileWidth(), p3_tileHeight()];
    
    let clicks = {};
    
    function p3_tileClicked(i, j) {
        // Calculate the difference in indices between the duck's current position and the clicked tile
        const di = i - duck.i;
        const dj = j - duck.j;
    
        // Check if the clicked tile is within 1 tile distance from the duck's current position
        if (sketch.abs(di) <= 1 && sketch.abs(dj) <= 1 && (di !== 0 || dj !== 0)) {
            // Update the duck's position to the clicked tile
            duck.i = i;
            duck.j = j;
        
            // Determine the movement direction based on the difference in indices
            let movementX = 0;
            let movementY = 0;
        
            if (di > 0 && dj === 0) {
                // Move up
                direction = 'south';
                movementX = -tw * .1 / 2;
                movementY = -th * .1 / 2;
            } else if (di < 0 && dj === 0) {
                // Move down
                direction = 'north';
                movementX = tw * .1 / 2;
                movementY = th * .1 / 2;
            } else if (di === 0 && dj > 0) {
                // Move right
                direction = 'east';
                movementX = tw * .1 / 2;
                movementY = -th * .1 / 2;
            } else if (di === 0 && dj < 0) {
                // Move left
                direction = 'west';
                movementX = -tw * .1 / 2;
                movementY = th * .1 / 2;
            } else if (di > 0 && dj < 0) {
                // Move up-left (diagonal)
                direction = 'southwest';
                movementX = -tw * .1;
            } else if (di > 0 && dj > 0) {
                // Move up-right (diagonal)
                // direction = 'southeast';
                movementY = -th * .1;
        
            } else if (di < 0 && dj < 0) {
                // Move down-left (diagonal)
                // direction = 'northwest';
                movementY = th * .1;
            } else if (di < 0 && dj > 0) {
                // Move down-right (diagonal)
                direction = 'northeast';
                movementX = tw * .1;
            }
        
            // Adjust camera velocity based on the movement direction
            camera_velocity.x += movementX;
            camera_velocity.y += movementY;
        }
    }
    
    function p3_drawBefore() {}
    
    function p3_drawTile(i, j) {
        const tileIdentifier = `tile:${i},${j}`;
        const tileHash = XXH.h32(tileIdentifier, worldSeed);
    
        let breadTile = false;
        let grassTile = false;
        let tileId;
        let tileId2;
        let grassIndex;
    
        if (tileHash % 75 == 0) { // draw ocean
            tileId = getBreadTileId(i, j); // Retrieve the tile's unique ID if already assigned
            
            if (!tileId) {
                // Assign a new unique ID to this tile
                tileId = 0;
                setBreadTileId(i, j, tileId); // Store the unique ID for this tile
            }

            breadTile = true;
            num++;
        }
        
        else if (tileHash % 5 == 0) { // draw stars
            tileId2 = getGrassTileId(i, j);
            if (tileId2 === null) {
                // Assign a new unique ID to this tile
                grassIndex = num % 10; // set starid, rgb
                setGrassTileId(i, j, grassIndex); // Store the unique ID for this tile
            }

            grassTile = true;
            num++;
        }
    
        sketch.push();
        
        if (grassTile) {
            drawGrass(tileId2);
        }
        
        if (breadTile) {
            drawBread(tileId);
        
            if (tileId === 0 && duck.i === i && duck.j === j) {
                setBreadTileId(i, j, 1);
                score++;
            }
        }
    
        if (duck.i == i && duck.j == j) {
            drawDuck(0, 0, direction);
        }
    
        sketch.pop();
    }
    
    function p3_drawSelectedTile(i, j) {
        const di = i - duck.i;
        const dj = j - duck.j;
        
        // Check if the selected tile is within 1 tile distance from the duck's current position
        const isMoveable = sketch.abs(di) <= 1 && sketch.abs(dj) <= 1 && (di !== 0 || dj !== 0);
        
        if (!isMoveable) {
            // Not a valid moveable tile or a garbage tile
            sketch.stroke(255, 0, 0, 128); // Red stroke
            sketch.fill(255, 0, 0, 64); // Red fill
        } else {
            // Valid moveable tile within 1 tile of the duck
            sketch.stroke(0, 255, 0, 128); // Green stroke
            sketch.fill(0, 255, 0, 64); // Green fill
        }
    
        // Draw the selected tile shape
        sketch.beginShape();
        sketch.vertex(-tw, 0);
        sketch.vertex(0, th);
        sketch.vertex(tw, 0);
        sketch.vertex(0, -th);
        sketch.endShape(sketch.CLOSE);
    
        // Reset stroke and fill settings for subsequent drawing
        sketch.noStroke();
        sketch.fill(0);
        //text("tile " + [i, j], 0, 0);
    }
    
    function p3_drawAfter() {}
    
    
    // Function to draw a duck
    function drawDuck(x, y, direction) {
        let col = 0;
        let row = 2;
        
        sketch.push(); // Save current drawing state
        
        sketch.translate(x, y); // Move the entire duck to the specified position
        
        if (direction === "north" || direction === "northeast" || direction === "northwest" || direction === "east") {
            row = 10;

            
        }
            
        if (direction === "south" || direction === "southeast" || direction === "southwest" || direction === "west") {
            row = 8;
        }
        
        sketch.image(tilesetImage, -16, -24, 32, 32, 16 * col, 16 * row, 16, 16)
        
        sketch.pop(); // Restore previous drawing state
    }
    
    // Function to draw garbage
    function drawBread(eaten) {
        let col = 9;
        let row = 4;
        
        if (eaten === 1) {
            row = 5;
        }
        
        sketch.push(); // Save current drawing state
        
        sketch.image(tilesetImage, -16, -16, 32, 32, 32 * col, 32 * row, 32, 32);
        
        sketch.pop(); // Restore previous drawing state
    }
    
    // Function to retrieve tile ID from the tileIds map
    function getBreadTileId(i, j) {
        const key = `${i},${j}`;
        return tileIds[key] || null;
    }
    
    // Function to set tile ID in the tileIds map
    function setBreadTileId(i, j, tileId) {
        const key = `${i},${j}`;
        tileIds[key] = tileId;
    }
    
    function drawGrass(index) {
        let tilesheetCoordinateY = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
        let col = 17;
        let row = tilesheetCoordinateY[index];
        
        sketch.push(); 
        
        sketch.image(tilesetImage, -16, -24, 32, 32, 16 * col, 16 * row, 16, 16);
        
        sketch.pop(); // Restore previous drawing state
    }
    
    // Function to retrieve tile ID from the tileIds map
    function getGrassTileId(i, j) {
        const key = `${i},${j}`;
        return tileIds[key] || null;
    }
    
    // Function to set tile ID in the tileIds map
    function setGrassTileId(i, j, tileId) {
        const key = `${i},${j}`;
        tileIds[key] = tileId;
    }
}

let world3 = new p5(w3, 'w3');