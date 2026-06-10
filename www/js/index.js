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
    renderer.init(screenWidth, screenHeight);

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

    if (UserInterface.gamestate == 6) {
        const camera = Player.speedCameraOffset;

        const PlayerProxy = {
            // Update actual player to produce this
            x: Player.x,
            y: Player.jumpValue,
            z: Player.y,
            angleRad: Player.angleRad,
        };

        // add camera offset to these
        renderer.setCameraPos(PlayerProxy.x, 10, PlayerProxy.z, 500 / camera.zoom);
        renderer.drawFrame(PlayerProxy);
    }

    if (UserInterface.gamestate == 7 && MapEditor.editorState !== 5) {
        
        const PlayerProxy = { 
            x: MapEditor.loadedMap.playerStart.x,
            y: 0,
            z: MapEditor.loadedMap.playerStart.y,
            angleRad: (MapEditor.loadedMap.playerStart.angle * Math.PI) / 180,
        };

        // this has to read screen.y as the z dimension -- should fix
        renderer.setCameraPos(MapEditor.screen.x, 10, MapEditor.screen.y, 250 / MapEditor.zoom);

        renderer.drawFrame(PlayerProxy)
        // MapEditor.render();
    }

    requestAnimationFrame(updateGameArea);
}

//      :)