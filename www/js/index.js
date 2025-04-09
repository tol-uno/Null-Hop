document.addEventListener("deviceready", onDeviceReady, false);


// change these 3 to const
let airAcceleration = 100; // the sharpness your allowed to turn at
let maxVelocity = 30; // wish_speed is clipped to this in quake. Here, maxVelocity replaces wish_speed
let gravity = 500;
let prevDateNow;
let dt = 1/60; // delta time always has a 1 frame delay

let midX = 0;
let midY = 0;

function onDeviceReady() { // Called on page load in HMTL
    
    TouchHandler.init()
    CanvasArea.start(); // userInterface.start() called here
    PlayerCanvas.start()
    AudioHandler.init();
}


function updateGameArea() { // CALLED EVERY FRAME
    
    // UPDATING OBJECTS
    TouchHandler.update();
    UserInterface.update();        
    
    dt = (performance.now() - prevDateNow)/1000; // Delta Time for FPS independence. dt = amount of seconds between frames
    prevDateNow = performance.now();


    if (UserInterface.gamestate == 2) { // In a MapBrowser
        MapBrowser.update()
        if (Tutorial.isActive) {
            Tutorial.update();
        }
    }

    if (UserInterface.gamestate == 6) {
        Map.update();
        if (!Tutorial.pausePlayer) {Player.update()}     
        if (Tutorial.isActive) {
            Tutorial.update();
        }
    };
    
    if (UserInterface.gamestate == 7) {
        MapEditor.update();
    }
    
    
    
    
    // RENDERING OBJECTS
    CanvasArea.clear();

    if (UserInterface.gamestate == 2) { // In a MapBrowser
        MapBrowser.render()
    }

    if (UserInterface.gamestate == 6) {
        Map.render(); // draws Player lower shadow too
        Player.render()
        if (Tutorial.isActive) {
            Tutorial.render();
        }        
    }

    if (UserInterface.gamestate == 7) {
        MapEditor.render();
    }

    UserInterface.render();

}


//      :)