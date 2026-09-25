# Null Hop
Null Hop is a skill-based movement game centered around air-strafing and bunnyhopping. 

## Project Structure
Null Hop is built for mobile devices. It uses a custom game engine written in JavaScript and wrapped by Apache Cordova. It can be run in browsers, but as of now, controls are only optimized for touchscreens. 

### Game Logic
All game logic is split into different files which contain classes and objects. They are all loaded at once, which should change in the future.

### User Interface 
All UI buttons and labels are HTML DOM elements. Null Hop acts as a single page application (SPA) using its own custom SPA functionality. The UI components' HTML templates and functionality are stored in `www/js/ui/`. The styling for the UI is in `www/css/`. The `uiGroups` of UI components are set up in `www/js/UserInterface.start()`

### Rendering
The rendering pipeline currently uses a standard 2d HTML canvas but will be moving to webGL in the future. The regl webGL library will be used. The WIP branch is `webgl-renderer`

## Launching the game
In the terminal, run git clone https://github.com/tol-uno/Null-Hop.git to download the game's code

### Browsers (all operating systems)
- Run the command: `cordova run browser` and a webpage in your default browser will open
- If mouse input does not register, you need to enable "touch simulation" mode in your browser's dev tools
- Because this game is for mobile devices there are no keyboard controls, all input is done with the mouse

### iOS Devices
Launching to an ios device will require:
- Xcode command line tools to be installed
- Xcode developer certificate to be signed and active
- Your device must be connected physically

Command to build and install to iOS device: `cordova run ios`

### Android Devices
Launching to an android device will require:
- Android Studio
- Android device connected over Android Debug Bridge (adb)

Command to build and install to android device: `cordova run android`