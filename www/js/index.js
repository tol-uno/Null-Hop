document.addEventListener("deviceready", onDeviceReady, false);

// change these 3 to const
let airAcceleration = 100; // the sharpness your allowed to turn at
let maxVelocity = 30; // wish_speed is clipped to this in quake. Here, maxVelocity replaces wish_speed
let gravity = 500;
let prevDateNow;
let dt = 1 / 60; // delta time always has a 1 frame delay

let midX = 0; // Middle of Device DPI Scaled canvas
let midY = 0;
let midX_UI = 0; // Middle of standard CSS canvas since UI is position on unscaled canvas
let midY_UI = 0;

function onDeviceReady() {
    // Called on page load in HMTL

    TouchHandler.init();
    AudioHandler.init();
    CanvasArea.start();
    PlayerCanvas.start();
    UserInterfaceCanvas.start();

    UserInterface.start();
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
        if (Tutorial.isActive) {
            Tutorial.update();
        }
    }

    if (UserInterface.gamestate == 6) {
        Map.update();
        if (!Tutorial.pausePlayer) {
            Player.update();
        }
        if (Tutorial.isActive) {
            Tutorial.update();
        }
    }

    if (UserInterface.gamestate == 7) {
        MapEditor.update();
    }

    // RENDERING OBJECTS
    // Rendering Pipeline
    // Objects that should have their own rendering functions:
    // Map - for rendering that active map
    // Player - for rendering the player
    // MapEditor - for rendering the editing map screen

    // UserInterface - For rendering all user interface - only updated when user interacts with screen.
    // Other UI objects have .render() functions but they should be called by UserInterface during it's render()
    // - renders called from within UserInterface: Buttons, SliderUI, ColorPicker
    // - external renders that arent called by UserInterface: PreviewWindow (called by MapEditor), Tutorial (called by updateGameArea)
    // - not updated every frame, only when UI updates

    // Not sure how Tutorial should fall into all this..
    // Its animated elements need to be updated every frame not only on UI interaction

    CanvasArea.clear();
    UserInterfaceCanvas.clear();

    if (UserInterface.gamestate == 2) {
        // In a MapBrowser
        MapBrowser.render();
    }

    if (UserInterface.gamestate == 6) {
        Map.render(); // draws Player lower shadow too
        Player.render();
        if (Tutorial.isActive) {
            Tutorial.render();
        }
    }

    if (UserInterface.gamestate == 7) {
        MapEditor.render();
    }

    UserInterface.render();

    requestAnimationFrame(updateGameArea);
}

//      :)