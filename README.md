# Null Hop
Null Hop is a skill-based movement game based around airstrafing and bunnyhopping. 

## Project Structure
Null Hop is built for mobile devices. It uses a custom game engine written in JavaScript and wrapped by Apache Cordova. 

### Game Logic
All game logic is split into different files which contain classes and objects. They are all loaded at once which should change in the future.

### User Interface 
All UI buttons and labels are HTML DOM elements and have their own accomidating CSS files. Their functionality is set up in UserInterface.start()

### Rendering
The rendering pipeline currently uses a standard 2d HTML canvas but will be moving to webGL in the future. The regl webGL library will be used.
