document.addEventListener("deviceready", onDeviceReady, false);

// change these 3 to const
let airAcceleration = 150; // the sharpness your allowed to turn at
let maxVelocity = 32; // wish_speed is clipped to this in quake. Here, maxVelocity replaces wish_speed
let gravity = 500;
let prevDateNow;
let dt = 1 / 60; // delta time always has a 1 frame delay

// set by CanvasArea
let screenWidth = null; // actual pixel resolution of screen
let screenHeight = null;
let screenWidthUI = null; // logical CSS pixel resolution of screen
let screenHeightUI = null;
let midX = null; // middle of device DPI scaled canvas
let midY = null;
let midX_UI = null; // middle of standard CSS canvas since UI is position on unscaled canvas
let midY_UI = null;
let renderer = null;

function onDeviceReady() {
    // Called on page load in HMTL

    TouchHandler.init();
    AudioHandler.init();

    CanvasArea.start();
    
    renderer = new Renderer(document.getElementById("webgl-canvas"));
    renderer.init();

    PlayerCanvas.start();

    UserInterface.start();

    prevDateNow = performance.now();
    requestAnimationFrame(updateGameArea);
}

// CALLED EVERY FRAME
function updateGameArea() {

    dt = (performance.now() - prevDateNow) / 1000; // Delta Time for FPS independence. dt = amount of seconds between frames
    prevDateNow = performance.now();

    // UPDATING OBJECTS
    TouchHandler.update();
    UserInterface.update();

    if (UserInterface.gamestate == 2) {
        // In a MapBrowser
        MapBrowser.update();
    }

    if (UserInterface.gamestate == 6) {
        if (!Tutorial.pausePlayer) {
            Player.update();
        }
        Map.update();
        if (Tutorial.isActive) {
            Tutorial.update();
        }
    }

    if (UserInterface.gamestate == 7) {
        MapEditor.update();
    }

    // CanvasArea.clear();

    // if (UserInterface.gamestate == 6) {
    //     Map.render(); // draws Player lower shadow too
    //     Player.render();
    // }

    if (UserInterface.gamestate == 6) {
        
        const cam = Player.speedCameraOffset

        renderer.setCameraPos(Player.x, 10, Player.y, 500 / cam.zoom)
        
        renderer.drawFrame();
    }

    if (UserInterface.gamestate == 7 && MapEditor.editorState !== 5) {
        MapEditor.render();
    }

    requestAnimationFrame(updateGameArea);
}

//      :)