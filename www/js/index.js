document.addEventListener("deviceready", onDeviceReady, false);


const airAcceleration = 6; // the sharpness your allowed to turn at
const maxVelocity = 1.15; // basically the rate at which speed is gained / lost. wishDir is scaled to this magnitude
const gravity = 0.05;
let prevDateNow;
let dt = 1;

let midX = 0;
let midY = 0;

function onDeviceReady() { // Called on page load in HMTL
    
    TouchHandler.init()
    CanvasArea.start(); // userInterface.start() called here
    AudioHandler.init();
    // Player.initPlayer is called by Map

}


function updateGameArea() { // CALLED EVERY FRAME
    
    // UPDATING OBJECTS
    TouchHandler.update();
    UserInterface.update();        
    
    dt = (performance.now() - prevDateNow)/10; // Delta Time for FPS independence. dt = amount of milliseconds between frames
    prevDateNow = performance.now();


    if (UserInterface.gamestate == 2) { // In a MapBrowser
        MapBrowser.update()
        if (Tutorial.isActive) {
            Tutorial.update();
        }
    }

    if (UserInterface.gamestate == 6) {
        Map.update();
        if (!Tutorial.pausePlayer) {Player.updatePos()}     
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