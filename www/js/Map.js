const Map = {
    walls : [],
    renderedPlatforms : [],
    wallsToCheck : [],
    endZonesToCheck : [],
    name : null,
    upperShadowClip : new Path2D(),
    endZoneShadowClip : new Path2D(),
    playerClip : new Path2D(), // calculated every frame

    initMap : function (name) { // initializing a normal map (not custom)
        this.platforms = [];
        this.playerStart = null;
        this.style = null;
        this.checkpoints = [];
        this.upperShadowClip = new Path2D()
        this.endZoneShadowClip = new Path2D()
        this.name = name;

        
        // GET MAP DIRECTLY THROUGH CORDOVA LOCAL STORAGE  (NORMAL MAP)          
        const mapURL = cordova.file.applicationDirectory + "www/assets/maps/"
        
        window.resolveLocalFileSystemURL(mapURL, (dirEntry) => {

            dirEntry.getFile(name + ".json", {create: false, exclusive: false}, (fileEntry) => {
                console.log("fileEntry:")
                console.log(fileEntry)

                fileEntry.file( (file) => {

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        this.parseMapData(JSON.parse(e.target.result))
                    };
                    reader.onerror = (e) => alert(e.target.error.name);
        
                    reader.readAsText(file)
                })
            })
        })  

    },

    initCustomMap : async function (name) { // initializing a custom map
        this.platforms = [];
        this.playerStart = null;
        this.style = null;
        this.checkpoints = [];
        this.upperShadowClip = new Path2D()
        this.endZoneShadowClip = new Path2D()
        this.name = name;

        
        const mapDataRaw = await UserInterface.readFile(name + ".json", "maps");
        this.parseMapData(JSON.parse(mapDataRaw))
        
    },



    // Big function that parses the map data, sets up lighting, shadows, shadow clips, etc
    parseMapData : function (jsonData) {
        
        this.playerStart = jsonData.playerStart;
        this.style = jsonData.style;
        this.checkpoints = jsonData.checkpoints; // returns an object

        jsonData.platforms.forEach(platform => { // LOOP THROUGH PLATFORMS TO POPULATE platforms AND walls ARRAYS
            this.platforms.push(platform);
            if (platform.wall) {this.walls.push(platform)}
        });


        // SET ALL LIGHTING
        this.setMapLighting()
        
        
        // SETTING CLIPS 
        // for area behind each wall AND for drawing the player shadow ontop of platforms or endzones
        this.platforms.forEach(platform => {

            // add a .clipPoints property to each wall for occluding Player and drawing players xray
            if (platform.wall) {
            
                // corners + wall height points need to be "concated" as serperate variable otherwise they dont stay as points
                const upperCorners = [
                    [
                        platform.corners[0][0],
                        platform.corners[0][1] - this.style.wallHeight
                    ],
                    [
                        platform.corners[1][0],
                        platform.corners[1][1] - this.style.wallHeight
                    ],
                    [
                        platform.corners[2][0],
                        platform.corners[2][1] - this.style.wallHeight
                    ],
                    [
                        platform.corners[3][0],
                        platform.corners[3][1] - this.style.wallHeight
                    ],
                ] 

                let behindWallClipPoints = platform.corners.concat(upperCorners)
        
                platform.clipPoints = CanvasArea.convexHull(behindWallClipPoints)


                // USED FOR TESTING WETHER A WALL IS INFRONT OF PLAYER
                platform.getSplitLineY = function(x) {
                    // y = mx + b
                    // m = rise over run
                    const slope = (platform.rightMostCornerY - platform.leftMostCornerY) / (platform.rightMostCornerX - platform.leftMostCornerX)
                    // b = y - mx
                    const b = platform.rightMostCornerY - (slope * platform.rightMostCornerX) 
                    const y = slope * x + b
                    return y
                }
            
            } else { // platform isnt wall                

                // ADDS EACH AND EVERY PLATFORM INTO COORESPONDING SHADOW CLIP (endZone or platform) To draw correct player shadow color
                const clipToUse = platform.endzone ? this.endZoneShadowClip : this.upperShadowClip

                clipToUse.moveTo( // bot left
                    platform.x + platform.corners[0][0], // x
                    platform.y + platform.corners[0][1] // y
                )
                
                clipToUse.lineTo( // bot right
                    platform.x + platform.corners[1][0],
                    platform.y + platform.corners[1][1]
                )

                clipToUse.lineTo( // top right
                    platform.x + platform.corners[2][0],
                    platform.y + platform.corners[2][1]
                )

                clipToUse.lineTo( // top left
                    platform.x + platform.corners[3][0],
                    platform.y + platform.corners[3][1]
                )

                clipToUse.closePath()
            }
        
        }) // end of looping through platforms to set clips
        


        // FINISH UP AND MOVE ON
        CanvasArea.canvas.style.backgroundColor = this.style.shaded_backgroundColor;
        document.body.style.backgroundColor = this.style.shaded_backgroundColor;
        
        Player.initPlayer(this.playerStart.x, this.playerStart.y, this.playerStart.angle)

        UserInterface.determineButtonColor();
        UserInterface.mapLoaded(); // moves onto gamestate 6
        
    },


    update : function() {  // Figure out which platforms are in view. Updates playerClip, wallsToCheck, and endZonesToCheck

        this.renderedPlatforms = [];
        this.wallsToCheck = [];
        this.endZonesToCheck = [];

        this.platforms.forEach(platform => { // Loop through ALL platforms to get renderedPlatforms

            const adjustedHeight = platform.wall ? this.style.wallHeight : 0 // for adding height to walls

            let wallShadowMultiplier
            if (platform.wall && this.style.platformHeight > 0) {
                wallShadowMultiplier = 1 + (this.style.wallHeight / this.style.platformHeight)
            } else {
                wallShadowMultiplier = 1
            }


            const shadowLength = Math.tan(this.style.lightPitch * Math.PI / 180) * this.style.platformHeight

            if (
                (platform.x - platform.hypotenuse - (shadowLength * wallShadowMultiplier) < Player.x + midX) && // right side
                (platform.x + platform.hypotenuse + (shadowLength * wallShadowMultiplier) > Player.x - midX) && // coming into frame on left side
                (platform.y + platform.hypotenuse + (shadowLength * wallShadowMultiplier) + this.style.platformHeight > Player.y - midY) && // top side
                (platform.y - platform.hypotenuse - (shadowLength * wallShadowMultiplier) - adjustedHeight < Player.y + midY) // bottom side
            ) {
                this.renderedPlatforms.push(platform); // ADD platform to renderedPlatforms
            }
        }); // end of looping through ALL platforms


        this.playerClip = new Path2D() // resets the clip every frame. when it is used there must be an counter clockwise rectangle drawn first to invert clip

        //this.endZoneIsRendered = false; // resets every frame. if one of renderedPlatforms is an endzone then its made true

        this.renderedPlatforms.forEach(platform => { // Loop through RENDERED platforms (will loop through in order of index)
                                    
            if (platform.wall) {
                
                if ( // if wall is close enough to Player that it needs to be checked with Player rotation
                    (platform.x + platform.hypotenuse > Player.x - 25) && // colliding with Player from left
                    (platform.x - platform.hypotenuse < Player.x + 25) && // right side
                    (platform.y + platform.hypotenuse > Player.y - 73) && // top side
                    (platform.y - platform.hypotenuse - this.style.wallHeight < Player.y + 25) // bottom side
                ) { // test for Player overlap and rendering z-order tests
                    
                    this.wallsToCheck.push(platform) // for checking if Player is colliding with walls in Player.updatePos()

                    // convert Player angle and get radian version
                    const angle = Player.lookAngle.getAngleInDegrees();
                    const angleRad = angle * (Math.PI/180);

                    // GET PLAYERS LEFTMOST AND RIGHT MOST CORNERS
                    Player.leftMostPlayerCornerX = null
                    Player.leftMostPlayerCornerY = null
                    Player.rightMostPlayerCornerX = null
                    Player.rightMostPlayerCornerY = null
                    if (0 <= angle && angle < 90) { // leftMost=bot left        rightMost=top right 
                        Player.leftMostPlayerCornerX = Player.x - (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad)))
                        Player.leftMostPlayerCornerY = Player.y - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad)))
                        Player.rightMostPlayerCornerX = Player.x + (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad)))
                        Player.rightMostPlayerCornerY = Player.y + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad)))
                    }
                    if (90 <= angle && angle < 180) { // leftMost=bot right     rightMost=top left
                        Player.leftMostPlayerCornerX = Player.x + (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad)))
                        Player.leftMostPlayerCornerY = Player.y + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad)))
                        Player.rightMostPlayerCornerX = Player.x - (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad)))
                        Player.rightMostPlayerCornerY = Player.y - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad)))
                    }
                    if (180 <= angle && angle < 270) { // leftMost=top right    rightMost=bot left 
                        Player.leftMostPlayerCornerX = Player.x + (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad)))
                        Player.leftMostPlayerCornerY = Player.y + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad)))
                        Player.rightMostPlayerCornerX = Player.x - (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad)))
                        Player.rightMostPlayerCornerY = Player.y - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad)))
                    }
                    if (270 <= angle && angle < 360) { // leftMost=top left     rightMost=bot right
                        Player.leftMostPlayerCornerX = Player.x - (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad)))
                        Player.leftMostPlayerCornerY = Player.y - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad)))
                        Player.rightMostPlayerCornerX = Player.x + (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad)))
                        Player.rightMostPlayerCornerY = Player.y + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad)))
                    }

                    

                    // NEW TEST FOR WHETHER OR NOT TO ADD WALL PLATFORM TO CLIP
                    if (
                        (Player.x <= platform.x && Player.rightMostPlayerCornerY < platform.getSplitLineY(Player.rightMostPlayerCornerX)) ||  
                        (Player.x > platform.x && Player.leftMostPlayerCornerY < platform.getSplitLineY(Player.leftMostPlayerCornerX))
                    ) {
                        addToPlayerClip()
                    }


                    // ADD TO CLIP SHAPE FOR AREAS BEHIND WALLS
                    function addToPlayerClip() {
                        // the clipPoints array can have different lengths so it must dynamicly go through the array of points
                        for (let i = 0; i < platform.clipPoints.length; i++) {
                            if (i == 0) { // first point in array so use moveTo

                                // -Player.x + midX, -Player.y + midY

                                Map.playerClip.moveTo(
                                    platform.x + platform.clipPoints[i][0], // x
                                    platform.y + platform.clipPoints[i][1] // y
                                )
                            } else { // its not the first point in the hull so use lineTo
                                Map.playerClip.lineTo(
                                    platform.x + platform.clipPoints[i][0], // x
                                    platform.y + platform.clipPoints[i][1] // y
                                )
                            }
                        }

                        Map.playerClip.closePath()
                    }

                }   
            }

            if (platform.endzone) {
                this.endZonesToCheck.push(platform);
            }
        }); // end of looping through each rendered platform

    },


    setMapLighting : function() { // Calculates all lighting and shadows 

        // determine whether rendering for Map or PreviewWindow
        const MapData = UserInterface.gamestate == 7 ? PreviewWindow : Map    

        // turning lightDirection integer into a Vector
        // MapData.style.lightDirectionVector = new Vector2D3D(Math.cos(MapData.style.lightDirection * (Math.PI/180)), Math.sin(MapData.style.lightDirection * (Math.PI/180)))
        MapData.style.lightDirectionVector = new Vector2D3D(1,0).rotate(MapData.style.lightDirection)

        // lightPitch is actually sun's angle between 0 -> 89
        const sunAngle = MapData.style.lightPitch
        const shadowX = MapData.style.lightDirectionVector.x * Math.tan(sunAngle * Math.PI / 180) * MapData.style.platformHeight
        const shadowY = MapData.style.lightDirectionVector.y * Math.tan(sunAngle * Math.PI / 180) * MapData.style.platformHeight


        // LOOPING THROUGH EACH PLATFORM
        // SETTING : Shaded colors and shadow poligon
        MapData.platforms.forEach(platform => {

            let colorToUse1 = MapData.style.platformTopColor;
            let colorToUse2 = MapData.style.platformSideColor;

            if (platform.endzone) {
                colorToUse1 = MapData.style.endZoneTopColor;
                colorToUse2 = MapData.style.endZoneSideColor;
            }
            if (platform.wall) {
                colorToUse1 = MapData.style.wallTopColor;
                colorToUse2 = MapData.style.wallSideColor;
            }


            // PLATFORM COLORS
            side1Vec = new Vector2D3D(-1,0).rotate(platform.angle)
            side2Vec = new Vector2D3D(0,1).rotate(platform.angle)
            side3Vec = new Vector2D3D(1,0).rotate(platform.angle)

            const litPercent1 = side1Vec.angleDifference(MapData.style.lightDirectionVector) / Math.PI // dividing by PI converts angleDiffernce to between 0->1
            const litPercent2 = side2Vec.angleDifference(MapData.style.lightDirectionVector) / Math.PI            
            const litPercent3 = side3Vec.angleDifference(MapData.style.lightDirectionVector) / Math.PI

            platform.shaded_topColor = CanvasArea.getShadedColor(colorToUse1, 1)
            platform.shaded_sideColor1 = CanvasArea.getShadedColor(colorToUse2, litPercent1)
            platform.shaded_sideColor2 = CanvasArea.getShadedColor(colorToUse2, litPercent2)
            platform.shaded_sideColor3 = CanvasArea.getShadedColor(colorToUse2, litPercent3)



            // SHADOW POLYGON

            // set the additional length that's added to wall shadows
            let wallShadowMultiplier
            if (platform.wall && MapData.style.platformHeight > 0) {
                wallShadowMultiplier = 1 + (MapData.style.wallHeight / MapData.style.platformHeight)
            } else {
                wallShadowMultiplier = 1
            }

            platform.shadowPoints = [ // ALL THE POSSIBLE POINTS TO INPUT IN CONVEX HULL FUNCTION
            
                // bot left corner
                [
                platform.corners[0][0],
                platform.corners[0][1] + MapData.style.platformHeight,
                ],

                // bot right corner
                [
                platform.corners[1][0],
                platform.corners[1][1] + MapData.style.platformHeight,
                ],

                // top right corner
                [
                platform.corners[2][0],
                platform.corners[2][1] + MapData.style.platformHeight,
                ],
            
                // top left corner
                [
                platform.corners[3][0],
                platform.corners[3][1] + MapData.style.platformHeight,
                ],
            
                // bot left SHADOW
                [
                platform.corners[0][0] + shadowX * wallShadowMultiplier,
                platform.corners[0][1] + MapData.style.platformHeight + shadowY * wallShadowMultiplier,
                ],

                // bot right SHADOW
                [
                platform.corners[1][0] + shadowX * wallShadowMultiplier,
                platform.corners[1][1] + MapData.style.platformHeight + shadowY * wallShadowMultiplier,
                ],
                
                // top right SHADOW
                [
                platform.corners[2][0] + shadowX * wallShadowMultiplier,
                platform.corners[2][1] + MapData.style.platformHeight + shadowY * wallShadowMultiplier, 
                ],

                // top left SHADOW
                [
                platform.corners[3][0] + shadowX * wallShadowMultiplier,
                platform.corners[3][1] + MapData.style.platformHeight + shadowY * wallShadowMultiplier,
                ],
            
            ]; // end of shadowPoints array
        
            platform.shadowPoints = CanvasArea.convexHull(platform.shadowPoints)        

        }); // end of looping thrugh each platform


        // calculate all other map colors
        MapData.style.shaded_playerColor = CanvasArea.getShadedColor(MapData.style.playerColor, 1)
        MapData.style.shaded_backgroundColor = CanvasArea.getShadedColor(MapData.style.backgroundColor, 1)

        MapData.style.shadow_platformColor = CanvasArea.getShadedColor(MapData.style.platformTopColor, 0.2) // 0.2 instead of 0 to pretend there's bounce lighting
        MapData.style.shadow_endzoneColor = CanvasArea.getShadedColor(MapData.style.endZoneTopColor, 0.2)
        MapData.style.shadow_backgroundColor = CanvasArea.getShadedColor(MapData.style.backgroundColor, 0.2)
        
    },


    renderPlatformShadow : function(platform) {

        // determine whether rendering for Map or PreviewWindow
        const MapData = UserInterface.gamestate == 7 ? MapEditor.loadedMap : Map    

        const ctx = CanvasArea.ctx;
        ctx.save(); // #21
        ctx.translate(platform.x, platform.y);

        ctx.fillStyle = MapData.style.shadow_backgroundColor;

        ctx.beginPath();
        
        ctx.moveTo(platform.shadowPoints[0][0], platform.shadowPoints[0][1]); // this comes up in debug a lot
        for (let i = platform.shadowPoints.length - 1; i > 0; i --) {
            ctx.lineTo(platform.shadowPoints[i][0], platform.shadowPoints[i][1]);
        }

        ctx.closePath();
        ctx.fill();


        ctx.restore(); // #21
    },


    renderPlatform : function(platform) { // seperate function to render platforms so that it can be called at different times (ex. called after drawing Player inorder to render infront)
        
        const ctx = CanvasArea.ctx;   

        // determine whether rendering for Map or PreviewWindow
        const MapData = UserInterface.gamestate == 7 ? MapEditor.loadedMap : Map    
        

        // DRAW PLATFORM TOP
        ctx.save(); // #17 GO TO PLATFORMs MIDDLE AND ROTATING 
        const adjustedHeight = platform.wall ? MapData.style.wallHeight : 0 // for adding height to walls
        ctx.translate(platform.x, platform.y - adjustedHeight);
        ctx.rotate(platform.angle * Math.PI/180);

        ctx.fillStyle = platform.shaded_topColor;        
        
        ctx.fillRect(-platform.width/2, -platform.height/2, platform.width, platform.height);

        ctx.restore(); // #17 restores platform translation and rotation


        // SIDES OF PLATFORMS
        ctx.save(); // #18
        ctx.translate(platform.x, platform.y);
        
        // platform angles should only be max of 45 and -45 in mapData

        // corners array order: BL BR TR TL

        // ALWAYS RENDER BOTTOM SIDE. side2    
        ctx.fillStyle = platform.shaded_sideColor2;
        ctx.beginPath();
        ctx.moveTo(platform.corners[1][0], platform.corners[1][1] - adjustedHeight); // BR
        ctx.lineTo(platform.corners[0][0], platform.corners[0][1] - adjustedHeight); // BL
        ctx.lineTo(platform.corners[0][0], platform.corners[0][1] + MapData.style.platformHeight); // BL + height
        ctx.lineTo(platform.corners[1][0], platform.corners[1][1] + MapData.style.platformHeight); // BR + height
        ctx.closePath();
        ctx.fill();
    


        if (platform.angle > 0) { // side3 right side

            ctx.fillStyle = platform.shaded_sideColor3; // sideColor3
            ctx.beginPath();
            ctx.moveTo(platform.corners[1][0], platform.corners[1][1] - adjustedHeight); // BR
            ctx.lineTo(platform.corners[2][0], platform.corners[2][1] - adjustedHeight); // TR
            ctx.lineTo(platform.corners[2][0], platform.corners[2][1] + MapData.style.platformHeight); // TR + height
            ctx.lineTo(platform.corners[1][0], platform.corners[1][1] + MapData.style.platformHeight); // BR + height
            ctx.closePath();
            ctx.fill();
        }

        if (platform.angle < 0) { // side1 left side

            ctx.fillStyle = platform.shaded_sideColor1; // sideColor1  
            ctx.beginPath();
            ctx.moveTo(platform.corners[0][0], platform.corners[0][1] - adjustedHeight); // BL
            ctx.lineTo(platform.corners[3][0], platform.corners[3][1] - adjustedHeight); // TL
            ctx.lineTo(platform.corners[3][0], platform.corners[3][1] + MapData.style.platformHeight); // TL + height
            ctx.lineTo(platform.corners[0][0], platform.corners[0][1] + MapData.style.platformHeight); // BL + height
            ctx.closePath();
            ctx.fill();
        }


        // PLATFORM RENDERING DEBUG TEXT
        if (UserInterface.settings.debugText == 1) {
            ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1 :  UserInterface.lightColor_1;
            ctx.font = "12px BAHNSCHRIFT"
            // ctx.fillText("angle: " + platform.angle, 0, 20);
            // ctx.fillText("position: " + platform.x + ", " + platform.y, 0 , 40)
            // ctx.fillText("size: " + platform.width + ", " + platform.height, 0 , 60)
        }

        ctx.restore(); // #18 back to map origin translation        

        // Drawing split line
        // ctx.strokeStyle = "#00FF00"
        // ctx.lineWidth = 1
        // ctx.beginPath()
        // ctx.moveTo(platform.leftMostCornerX, platform.leftMostCornerY)
        // ctx.lineTo(platform.rightMostCornerX, platform.rightMostCornerY)
        // ctx.stroke()

    },


    render : function() { // Renders Player lower shadow, platforms shadows, platforms, and checkpoints


        const ctx = CanvasArea.ctx;

        ctx.save(); // #19
        ctx.translate(-Player.x + midX, -Player.y + midY); // move canvas when drawing platforms then restore. midX is center of canvas width


        // DRAWING LOWER PLAYER SHADOW
        ctx.save(); // #20
        ctx.translate(Player.x , Player.y + this.style.platformHeight)
        ctx.rotate(Player.lookAngle.getAngleInDegrees() * Math.PI/180); // rotating canvas
        ctx.fillStyle = this.style.shadow_backgroundColor;
        ctx.fillRect(-15, -15, 30, 30)
        ctx.restore(); // #20


        // LOOP TO DRAW renderedPlatforms SHADOWS
        this.renderedPlatforms.forEach(platform => { 
            Map.renderPlatformShadow(platform)
        })

        // LOOP TO DRAW renderedPlatforms PLATFORMS
        this.renderedPlatforms.forEach(platform => {
            Map.renderPlatform(platform)
        })


        // Draw checkpoints if Debugging
        if (UserInterface.settings.debugText == 1) {
            this.checkpoints.forEach(checkpoint => { 
                ctx.strokeStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1 
                ctx.lineWidth = 4
                ctx.beginPath(); 
                ctx.moveTo(checkpoint.triggerX1, checkpoint.triggerY1);
                ctx.lineTo(checkpoint.triggerX2, checkpoint.triggerY2);
                ctx.stroke();
            });
        }


        ctx.restore(); // #19
    
    },
}
