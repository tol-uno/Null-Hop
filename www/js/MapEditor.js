const MapEditor = {
    
    editorState : 0,
    // 0 = map new/import/load screen
    // 1 = main map edit screen
    // 2 = platform edit menu
    // 3 = map color page
    // 4 = map settings page
    // 5 = custom map browser screen

    loadedMap : null,
    scrollAmountX : null,
    scrollAmountY : null,
    scrollVelX : 0, // for smooth scrolling 
    scrollVelY : 0,
    
    zoom : 1, // 10 = zoomed to 10x the scale. 0.1 zoomed out so everything is 10% of its size
    startingZoom: 1,

    screen : { // where the view is located realative to the map origin
        x : 0, // x and y are the center of the view (the crosshair)
        y : 0, // if 0,0 the view is centered on the map origin. Origin is in the center of the screen
    
        width : 0, //CanvasArea.canvas.width / MapEditor.zoom,
        height : 0, //CanvasArea.canvas.height / MapEditor.zoom,
    
        cornerX : this.x - this.width/2, // these coords are the top left corner of the view screen
        cornerY : this.y - this.height/2 // if they are 0,0 the origin of the map is in the top left corner

        // screen is updated in MapEditor.update()
    },


    scrollVelAveragerX : new Averager(10),
    scrollVelAveragerY : new Averager(10),

    renderedPlatforms : [],
    selectedElements : [], // platforms are their index, "playerStart" = playerStart, checkpoint items are each an array => 1st item is checkpoint index. 2nd is: 1=trigger1, 2=trigger2, 3=playerRespawn
    snapAmount : 0,
    multiSelect : false,
    debugText : false,

    render : function() {

        if (this.loadedMap !== null) { // IF MAP IS LOADED RENDER IT

            if (this.editorState == 3) { // IN COLOR SETTINGS

                PreviewWindow.render()
                ColorPicker.render()

            } else if (this.editorState == 4) { // IN MAP SETTINGS 

                PreviewWindow.render()

            }  else { // not in map color or settings screen SO RENDER MAP 

                const ctx = CanvasArea.ctx;    
    
                ctx.save() // zooming everything
                ctx.scale(this.zoom, this.zoom)
    
                ctx.translate(-this.screen.cornerX, -this.screen.cornerY); // translate to map orgin
    
                ctx.fillRect(-2, -2, 4, 4) // (0,0) draw map origin
    
    
                // DRAW PLATFORM SIDES BELOW TOPS
                this.renderedPlatforms.forEach(platform => {
                                    
                    // SIDES OF PLATFORMS
                    ctx.save(); // #18a
                    ctx.translate(platform.x, platform.y);
                    
                    if (platform.wall) {ctx.fillStyle = CanvasArea.getShadedColor(MapEditor.loadedMap.style.wallSideColor, 0.5)} 
                    else if (platform.endzone) {ctx.fillStyle = CanvasArea.getShadedColor(MapEditor.loadedMap.style.endZoneSideColor, 0.5)}
                    else {ctx.fillStyle = CanvasArea.getShadedColor(MapEditor.loadedMap.style.platformSideColor, 0.5)}
    
                    // corners array order: BL BR TR TL
    
                    // ALWAYS RENDER BOTTOM SIDE. side2    
                    ctx.fillStyle = platform.shaded_sideColor2;
                    ctx.beginPath();
                    ctx.moveTo(platform.corners[1][0], platform.corners[1][1]); // BR
                    ctx.lineTo(platform.corners[0][0], platform.corners[0][1]); // BL
                    ctx.lineTo(platform.corners[0][0], platform.corners[0][1] + this.loadedMap.style.platformHeight); // BL + height
                    ctx.lineTo(platform.corners[1][0], platform.corners[1][1] + this.loadedMap.style.platformHeight); // BR + height
                    ctx.closePath();
                    ctx.fill();
                
                    if (platform.angle > 0) { // side3 right side
    
                        ctx.fillStyle = platform.shaded_sideColor3; // sideColor3
                        ctx.beginPath();
                        ctx.moveTo(platform.corners[1][0], platform.corners[1][1]); // BR
                        ctx.lineTo(platform.corners[2][0], platform.corners[2][1]); // TR
                        ctx.lineTo(platform.corners[2][0], platform.corners[2][1] + this.loadedMap.style.platformHeight); // TR + height
                        ctx.lineTo(platform.corners[1][0], platform.corners[1][1] + this.loadedMap.style.platformHeight); // BR + height
                        ctx.closePath();
                        ctx.fill();
                    }
    
                    if (platform.angle < 0) { // side1 left side
    
                        ctx.fillStyle = platform.shaded_sideColor1; // sideColor1  
                        ctx.beginPath();
                        ctx.moveTo(platform.corners[0][0], platform.corners[0][1]); // BL
                        ctx.lineTo(platform.corners[3][0], platform.corners[3][1]); // TL
                        ctx.lineTo(platform.corners[3][0], platform.corners[3][1] + this.loadedMap.style.platformHeight); // TL + height
                        ctx.lineTo(platform.corners[0][0], platform.corners[0][1] + this.loadedMap.style.platformHeight); // BL + height
                        ctx.closePath();
                        ctx.fill();
                    }
                  
                    ctx.restore(); // #18 back to map origin translation
                    
                })
    
    
                // RENDER PLATFORMS TOPS
                this.renderedPlatforms.forEach(platform => {
                    
                    // DRAW PLATFORM TOP
                    ctx.save(); // ROTATING for Platforms
                    ctx.translate(platform.x, platform.y);
                    ctx.rotate(platform.angle * Math.PI/180);
    
                    // Change to endzone color if needed
                    if (platform.wall) {
                        ctx.fillStyle = this.loadedMap.style.wallTopColor;
                    } else if (platform.endzone) {
                        ctx.fillStyle = this.loadedMap.style.endZoneTopColor;
                    } else {
                        ctx.fillStyle = this.loadedMap.style.platformTopColor;
                    }
                    
                    ctx.fillRect(-platform.width/2, -platform.height/2, platform.width, platform.height);
    
    
                    if (this.selectedElements.includes(MapEditor.loadedMap.platforms.indexOf(platform))) { // DRAWING THE BORDER AROUND THE SELECTED PLATFORM
                        
                        ctx.strokeStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1
                        ctx.lineWidth = 4
                        ctx.strokeRect(-platform.width/2 + 2, -platform.height/2 + 2, platform.width - 4, platform.height - 4);
                    }
                    
    
                    ctx.restore(); // restoring platform rotation and translation
                    
                    // PLAFORM RENDERING DEBUG TEXT
                    // if (UserInterface.settings.debugText == 1) { // draw platform height indicators
                    //     ctx.fillStyle = "#FFFFFF";
                    //     ctx.fillText("position: " + platform.x + ", " + platform.y, platform.x + 5, platform.y - 5);
    
                    //     //origin
                    //     ctx.fillStyle = "#00FF00";
                    //     ctx.fillRect(platform.x - 3, platform.y - 3, 6, 6)
                    // }
    
                })
    
    
                // RENDER WALLS ADDITIONAL HEIGHT
                this.renderedPlatforms.forEach(platform => {
                    if (platform.wall) {
                
                        // DRAW WALL RAISED TOP
                        ctx.save(); // ROTATING for Platform
                        ctx.translate(platform.x, platform.y - MapEditor.loadedMap.style.wallHeight);
                        ctx.rotate(platform.angle * Math.PI/180);
    
                        ctx.strokeStyle = CanvasArea.getShadedColor(this.loadedMap.style.wallTopColor, 0.25)
                        ctx.lineWidth = 4
    
                        ctx.strokeRect(-platform.width/2 + 2, -platform.height/2 + 2, platform.width - 4, platform.height - 4);
    
    
                        ctx.restore(); // restoring platform rotation and translation
                    }
    
                })
    
    
                // RENDER CHECKPOINTS
                MapEditor.loadedMap.checkpoints.forEach(checkpoint => {
                    ctx.strokeStyle = ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1 : UserInterface.lightColor_1; 
                    ctx.lineWidth = 5
                    ctx.beginPath();
                    ctx.moveTo(checkpoint.triggerX1, checkpoint.triggerY1);
                    ctx.lineTo(checkpoint.triggerX2, checkpoint.triggerY2);
                    ctx.stroke();
    
                    ctx.beginPath();
                    ctx.arc(checkpoint.triggerX1, checkpoint.triggerY1, 20, 0, 2 * Math.PI);
                    ctx.fill();
    
                    ctx.beginPath();
                    ctx.arc(checkpoint.triggerX2, checkpoint.triggerY2, 20, 0, 2 * Math.PI);
                    ctx.fill();
    
                    // playerRestart pos
                    ctx.save()
                    ctx.translate(checkpoint.x, checkpoint.y)
                    ctx.rotate(checkpoint.angle * Math.PI/180);
                    ctx.lineWidth = 3
                    ctx.strokeRect(-16,-16,32,32)
        
                    // draw player arrow
                    ctx.lineWidth = 2
                    ctx.beginPath();
                    ctx.moveTo(8, 0);
                    ctx.lineTo(-5, -7);
                    ctx.lineTo(-5, 7);
                    ctx.lineTo(8, 0)
                    ctx.stroke();
                    ctx.restore()
    
                    // draw lines conecting to the playerRestart
                    ctx.beginPath();
                    ctx.setLineDash([6, 12]);
                    // ctx.strokeStyle = "#FFFFFF88"
                    ctx.moveTo(checkpoint.triggerX1, checkpoint.triggerY1);
                    ctx.lineTo(checkpoint.x, checkpoint.y);
                    ctx.lineTo(checkpoint.triggerX2, checkpoint.triggerY2);
                    ctx.stroke();
                    ctx.setLineDash([]);
    
    
                    // DRAWING THE BORDER AROUND parts of THE SELECTED Checkpoint parts
    
                    // get array of arrays from within selectedElements that cooresponds to this checkpoint ex: [[2, 1], [2, 3], [2, 2]]
                    const selectionArrays = this.selectedElements.filter((element) => Array.isArray(element) && element[0] == MapEditor.loadedMap.checkpoints.indexOf(checkpoint))
                    selectionArrays.forEach((checkpointPart) => {
                        // checkpoint part ex: [2,1] or [2,3]
                        if (checkpointPart[1] == 1) { // trigger 1
                            ctx.strokeStyle = UserInterface.darkColor_1
                            ctx.lineWidth = 6
                            ctx.beginPath();
                            ctx.arc(checkpoint.triggerX1, checkpoint.triggerY1, 20, 0, 2 * Math.PI);
                            ctx.stroke();
        
                            ctx.strokeStyle = UserInterface.lightColor_1
                            ctx.lineWidth = 2
                            ctx.beginPath();
                            ctx.arc(checkpoint.triggerX1, checkpoint.triggerY1, 20, 0, 2 * Math.PI);
                            ctx.stroke();
                        }
    
                        if (checkpointPart[1] == 2) { // trigger 2
                            ctx.strokeStyle = UserInterface.darkColor_1
                            ctx.lineWidth = 6
                            ctx.beginPath();
                            ctx.arc(checkpoint.triggerX2, checkpoint.triggerY2, 20, 0, 2 * Math.PI);
                            ctx.stroke();
        
                            ctx.strokeStyle = UserInterface.lightColor_1
                            ctx.lineWidth = 2
                            ctx.beginPath();
                            ctx.arc(checkpoint.triggerX2, checkpoint.triggerY2, 20, 0, 2 * Math.PI);
                            ctx.stroke();
                        }
    
                        if (checkpointPart[1] == 3) { // playerRestart
                            ctx.save()
                            ctx.translate(checkpoint.x, checkpoint.y)
                            ctx.rotate(checkpoint.angle * Math.PI/180);
                
                            ctx.strokeStyle = UserInterface.darkColor_1
                            ctx.lineWidth = 6
                            ctx.strokeRect(-16, -16, 32, 32);
                            
                            ctx.strokeStyle = UserInterface.lightColor_1
                            ctx.lineWidth = 2
                            ctx.strokeRect(-16, -16, 32, 32);
                            ctx.restore()
                        }    
                    }) // end of selectionArray forEach
                }); // end of loadedMap.checkpoints.forEach
    
    
                // RENDER THE PLAYER START
                ctx.save()
                ctx.translate(this.loadedMap.playerStart.x, this.loadedMap.playerStart.y)
                ctx.rotate(this.loadedMap.playerStart.angle * Math.PI/180);
                ctx.fillStyle = this.loadedMap.style.playerColor;
                ctx.fillRect(-16,-16,32,32)
    
                // draw player arrow
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 1
                ctx.beginPath();
                ctx.moveTo(8, 0);
                ctx.lineTo(-5, -7);
                ctx.lineTo(-5, 7);
                ctx.lineTo(8, 0)
                ctx.stroke();
    
                if (this.selectedElements.includes("playerStart")) { // DRAWING SELECTION BORDER AROUND PLAYER
                    ctx.strokeStyle = UserInterface.darkColor_1
                    ctx.lineWidth = 6
                    ctx.strokeRect(-13, -13, 26, 26);
                    
                    ctx.strokeStyle = UserInterface.lightColor_1
                    ctx.lineWidth = 2
                    ctx.strokeRect(-13, -13, 26, 26);
                }
                ctx.restore() //restoring Player rotation and transformation
    
    
                ctx.restore() // restoring screen.x and screen.y translation and zoom
                // essentially translating(+screen.x, +screen.y)
                // END OF SCALED ZOOM RENDERING
    
    
    
                // MAP EDITOR UI
                ctx.font = "20px BAHNSCHRIFT";
    
                if (this.editorState == 1 || this.editorState == 2) {
                    ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1 :  UserInterface.lightColor_1;
                    ctx.fillText("Group Select", btn_multiSelect.x, btn_multiSelect.y - 15);
                }
    
                if (this.editorState == 2) { // DRAWING SIDE PANEL
                
                    const sidePanel = {// If these change also change the values in UserInterface.touchReleased()
                        x : CanvasArea.canvas.width - 280,
                        y : 20,
                        width : 225,
                        height : 320
                    }
    
                    // SIDE PANEL
                    ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.lightColor_1 : UserInterface.darkColor_1;
                    CanvasArea.roundedRect(sidePanel.x, sidePanel.y, sidePanel.width, sidePanel.height, 25) 
                    ctx.fill()
    
                    ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1 : UserInterface.lightColor_1; // for text
    
                    if (this.multiSelect && this.selectedElements.length > 1) { // MULTISELECTED
    
                        ctx.fillText("Group Selection", sidePanel.x + 25, sidePanel.y + 100);
                        ctx.fillText(this.selectedElements.length + " Items", sidePanel.x + 25, sidePanel.y + 130);
    
                    } else {
    
                        if (this.selectedElements[0] == "playerStart") { // playerStart is selected
                            ctx.fillText("Player Start", sidePanel.x + 25, sidePanel.y + 100);
                            ctx.fillText("Position: " + this.loadedMap.playerStart.x + ", " + this.loadedMap.playerStart.y, sidePanel.x + 25, sidePanel.y + 130);
        
                        } else if (Array.isArray(this.selectedElements[0])) { // checkpoint is selected
                            ctx.fillText("Checkpoint", sidePanel.x + 25, sidePanel.y + 100);
                            ctx.fillText("Trigger 1: " + this.loadedMap.checkpoints[this.selectedElements[0][0]].triggerX1 + ", " + this.loadedMap.checkpoints[this.selectedElements[0][0]].triggerY1, sidePanel.x + 25, sidePanel.y + 130);
                            ctx.fillText("Trigger 2: " + this.loadedMap.checkpoints[this.selectedElements[0][0]].triggerX2 + ", " + this.loadedMap.checkpoints[this.selectedElements[0][0]].triggerY2, sidePanel.x + 25, sidePanel.y + 160);
                            ctx.fillText("Respawn: " + this.loadedMap.checkpoints[this.selectedElements[0][0]].x + ", " + this.loadedMap.checkpoints[this.selectedElements[0][0]].y, sidePanel.x + 25, sidePanel.y + 190);
                        
                        } else { // platform is selected
                            ctx.fillText("Platform", sidePanel.x + 25, sidePanel.y + 100);
                            const approxSignX = (this.loadedMap.platforms[this.selectedElements[0]].x % 1 == 0) ? "" : "~" 
                            const approxSignY = (this.loadedMap.platforms[this.selectedElements[0]].y % 1 == 0) ? "" : "~" 
                            ctx.fillText("Position: " + approxSignX + Math.round(this.loadedMap.platforms[this.selectedElements[0]].x) + ", " + approxSignY + Math.round(this.loadedMap.platforms[this.selectedElements[0]].y), sidePanel.x + 25, sidePanel.y + 130);
                            ctx.fillText("Size: " + this.loadedMap.platforms[this.selectedElements[0]].width + ", " + this.loadedMap.platforms[this.selectedElements[0]].height, sidePanel.x + 25, sidePanel.y + 160);
                            ctx.fillText("Wall: " + (this.loadedMap.platforms[this.selectedElements[0]].wall?"Yes":"No"), sidePanel.x + 25, sidePanel.y + 280)
                        }
    
                    }
                }
    
    
                if (UserInterface.settings.debugText == 1) {
                    
                    // GENERAL MAP EDITOR DEBUG TEXT
                    const textX = 200;
                    ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1 :  UserInterface.lightColor_1;
                    ctx.fillText("zoom: " + this.zoom, textX, 40)
                    ctx.fillText("screen.x: " + this.screen.x, textX, 60);
                    ctx.fillText("screen.y: " + this.screen.y, textX, 80);
                    ctx.fillText("screen.width: " + this.screen.width, textX, 100);
                    ctx.fillText("screen.height: " + this.screen.height, textX, 120);
                    ctx.fillText("screen.cornerX: " + this.screen.cornerX, textX, 140);
                    ctx.fillText("screen.cornerY: " + this.screen.cornerY, textX, 160);
                    
                    ctx.fillText("rendered platforms: " + this.renderedPlatforms.length, textX, 180);
                    ctx.fillText("editorState: " + this.editorState, textX, 200);
                    ctx.fillText("selectedElements: " + this.selectedElements, textX, 220);
                    
                    if (TouchHandler.dragging) {
                        ctx.fillText("touch: " + Math.round(TouchHandler.touches[0].x) + ", " + Math.round(TouchHandler.touches[0].y), textX, 240);
                        
                        // mapToRange(number, inMin, inMax, outMin, outMax)
                        const touchXMapped = CanvasArea.mapToRange(TouchHandler.touches[0].x, 0, CanvasArea.canvas.width, this.screen.cornerX, this.screen.cornerX + this.screen.width)
                        const touchYMapped = CanvasArea.mapToRange(TouchHandler.touches[0].y, 0, CanvasArea.canvas.height, this.screen.cornerY, this.screen.cornerY + this.screen.height)
                        
                        ctx.fillText("touch mapped: " + Math.round(touchXMapped) + ", " + Math.round(touchYMapped), textX, 260);
                    }
    
                    ctx.fillText("debug info: ", textX, 280);
    
    
                    if (TouchHandler.zoom.isZooming) { // draw center point between two fingers of zoom
                        ctx.save()
                        ctx.translate(TouchHandler.zoom.x, TouchHandler.zoom.y)
                        ctx.fillRect(-3,-3,6,6)
                        ctx.restore()
                    }
    
                }

            }

        }
    },

    update : function() {
        
        // when map is loaded for editing
        if (this.editorState == 0 || this.editorState == 5) { // 0 == new/load map screen OR map browser screen
            if (this.loadedMap !== null) { // if map is loaded then switch to Main Map Edit screen
                
                CanvasArea.canvas.style.backgroundColor = this.loadedMap.style.backgroundColor; // set bg color here so it only triggers once not every render frame
                document.body.style.backgroundColor = this.loadedMap.style.backgroundColor;

                UserInterface.renderedButtons = UserInterface.btnGroup_mapEditorInterface;
                UserInterface.determineButtonColor()

                this.screen.x = this.loadedMap.playerStart.x;
                this.screen.y = this.loadedMap.playerStart.y;
                this.screen.width = CanvasArea.canvas.width /  this.zoom
                this.screen.height = CanvasArea.canvas.height / this.zoom
                this.screen.cornerX = this.screen.x - this.screen.width/2
                this.screen.cornerY = this.screen.y - this.screen.height/2

                this.editorState = 1
            }
        }

        if (this.editorState == 1 || this.editorState == 2) { // main map edit screen OR platform select screen

            // SCROLLING THE SCREEN and SETTING OBJECTS TO ANGLE SLIDERS VALUES and SETTING ZOOM TO SLIDER VALUE EVERY FRAME
            if (TouchHandler.dragging == 1 &&
                !btn_translate.isPressed && 
                !btn_resize_BL.isPressed &&
                !btn_resize_BR.isPressed && 
                !btn_resize_TR.isPressed && 
                !btn_resize_TL.isPressed && 
                btn_angleSlider.confirmed && 
                btn_playerAngleSlider.confirmed && 
                btn_checkpointAngleSlider.confirmed && 
                btn_snappingSlider.confirmed 
            ){
                // SCROLLING AROUND SCREEN

                if (this.scrollAmountX == null && this.scrollAmountY == null) { // starting scroll
                    this.scrollAmountX = this.screen.x;
                    this.scrollAmountY = this.screen.y;
                }

                // ZOOMING 
                if (TouchHandler.zoom.isZooming) {
                     
                    this.zoom = TouchHandler.zoom.ratio * this.startingZoom
                    if (this.zoom > 10) {this.zoom = 10}
                    if (this.zoom < 0.05) {this.zoom = 0.05}
                    if (Math.abs(this.zoom - 1) < 0.1) { // snapping to zoom = 1 if close
                        this.zoom = 1
                    }
                    
                    
                } else {
                    this.startingZoom = this.zoom                
                }
                
                // ACTUALLY SCROLLING THE SCREEN
                this.scrollAmountX -= TouchHandler.dragAmountX / this.zoom
                this.scrollAmountY -= TouchHandler.dragAmountY / this.zoom

                // sets scrollVel to average drag amount of past 10 frames
                this.scrollVelAveragerX.pushValue(-TouchHandler.dragAmountX / this.zoom)
                this.scrollVelAveragerY.pushValue(-TouchHandler.dragAmountY / this.zoom)

                this.scrollVelX = this.scrollVelAveragerX.getAverage()
                this.scrollVelY = this.scrollVelAveragerY.getAverage()

                this.screen.x = this.scrollAmountX;
                this.screen.y = this.scrollAmountY;
        

            } else { // not dragging around screen

                if (this.scrollAmountX != null && this.scrollAmountY != null) { // just stopped dragging
                    this.scrollAmountX = null
                    this.scrollAmountY = null

                    this.scrollVelAveragerX.clear()
                    this.scrollVelAveragerY.clear()
                }
    
                this.screen.x += this.scrollVelX
                this.screen.y += this.scrollVelY
                this.scrollVelX = (Math.abs(this.scrollVelX) > 0.1) ? this.scrollVelX * (1 - 0.05 * dt) : 0 // dampening
                this.scrollVelY = (Math.abs(this.scrollVelY) > 0.1) ? this.scrollVelY * (1 - 0.05 * dt) : 0


                // UPDATE THE ANGLE OF OBJECTS WHEN THEIR ANGLE SLIDER IS PRESSED
                if (!btn_angleSlider.confirmed) {btn_angleSlider.func()}
                if (!btn_playerAngleSlider.confirmed) {btn_playerAngleSlider.func()}
                if (!btn_checkpointAngleSlider.confirmed) {btn_checkpointAngleSlider.func()}            
            }


            // UPDATING THE other 2 SCREEN Perameters every frame incase zoom changes
            this.screen.width = CanvasArea.canvas.width /  this.zoom
            this.screen.height = CanvasArea.canvas.height / this.zoom
            this.screen.cornerX = this.screen.x - this.screen.width/2
            this.screen.cornerY = this.screen.y - this.screen.height/2


            // FIGURING OUT WHICH PLATFORMS TO RENDER IN MAP EDITOR
            this.renderedPlatforms = [];

            this.loadedMap.platforms.forEach(platform => { // Loop through platforms
                platform.hypotenuse = Math.sqrt(platform.width * platform.width + platform.height * platform.height)/2

                if (
                    (platform.x + platform.hypotenuse > this.screen.cornerX) && // coming into frame on left side
                    (platform.x - platform.hypotenuse < this.screen.cornerX + this.screen.width) && // right side
                    (platform.y + platform.hypotenuse + this.loadedMap.style.platformHeight > this.screen.cornerY) && // top side
                    (platform.y - platform.hypotenuse - (platform.wall ? this.loadedMap.style.wallHeight : 0) < this.screen.cornerY + this.screen.height) // bottom side
                ) {
                    this.renderedPlatforms.push(platform); // ADD platform to renderedPlatforms
                }
            });


        } // end of being in editorState 1 or 2


        // changing the editorState 
        if (this.editorState == 1 && this.selectedElements.length > 0) {
            this.editorState = 2; // platform edit state w side panel
        }

        if (this.editorState == 2 && this.selectedElements.length == 0) {
            this.editorState = 1
        }


        // UPDATING DYNAMIC BUTTONS AND SLIDERS EVERY FRAME

        if (this.editorState == 2) { // update translate and resize buttons every frame

            if (UserInterface.renderedButtons.includes(btn_translate)) {
                btn_translate.func(true)
            }
            
            if (UserInterface.renderedButtons.includes(btn_resize_BL)) {
                btn_resize_BL.func()
                btn_resize_BR.func()
                btn_resize_TR.func()
                btn_resize_TL.func()

            }
        }

        if (this.editorState == 3) { // in map color screen
            ColorPicker.update();
            // ColorPicker.render called in MapEditor.render()
        }

        if (this.editorState == 4) { // in map settings screen
            if (!btn_platformHeightSlider.confirmed) {
                this.loadedMap.style.platformHeight = btn_platformHeightSlider.value
                PreviewWindow.update()
            }

            if (!btn_wallHeightSlider.confirmed) {
                this.loadedMap.style.wallHeight = btn_wallHeightSlider.value
                PreviewWindow.update()
            }

            if (!btn_lightDirectionSlider.confirmed) {
                this.loadedMap.style.lightDirection = btn_lightDirectionSlider.value
                PreviewWindow.update()
            }

            if (!btn_lightPitchSlider.confirmed) {
                this.loadedMap.style.lightPitch = btn_lightPitchSlider.value
                PreviewWindow.update()
            }   
        }    
    },

    updatePlatformCorners : function(platform) { // needs to be called when platform is edited
        platform.hypotenuse = Math.sqrt(platform.width * platform.width + platform.height * platform.height)/2
        platform.angleRad = platform.angle * (Math.PI/180)
        platform.corners = [ // order: BL BR TR TL (relative coords to platform origin)
            // bot left corner
            [
            -((platform.width / 2) * Math.cos(platform.angleRad)) - ((platform.height / 2) * Math.sin(platform.angleRad)),
            -((platform.width / 2) * Math.sin(platform.angleRad)) + ((platform.height / 2) * Math.cos(platform.angleRad))
            ],

            // bot right corner
            [
            ((platform.width / 2) * Math.cos(platform.angleRad)) - ((platform.height / 2) * Math.sin(platform.angleRad)),
            ((platform.width / 2) * Math.sin(platform.angleRad)) + ((platform.height / 2) * Math.cos(platform.angleRad))
            ],

            // top right corner
            [
            ((platform.width / 2) * Math.cos(platform.angleRad)) + ((platform.height / 2) * Math.sin(platform.angleRad)),
            ((platform.width / 2) * Math.sin(platform.angleRad)) - ((platform.height / 2) * Math.cos(platform.angleRad))
            ],
        
            // top left corner
            [
            -((platform.width / 2) * Math.cos(platform.angleRad)) + ((platform.height / 2) * Math.sin(platform.angleRad)),
            -((platform.width / 2) * Math.sin(platform.angleRad)) - ((platform.height / 2) * Math.cos(platform.angleRad))
            ]
        ]
    },

    saveCustomMap : async function() {

        const savemap = confirm("Save Map?");
        if (savemap) {

            const map = this.loadedMap;

            downloadMap = {};
            downloadMap.playerStart = {
                    "x": map.playerStart.x,
                    "y": map.playerStart.y,
                    "angle": map.playerStart.angle
                },
            downloadMap.checkpoints = map.checkpoints;
            downloadMap.style = {
                    "platformTopColor": map.style.platformTopColor,
                    "platformSideColor": map.style.platformSideColor,
                    "wallTopColor": map.style.wallTopColor,
                    "wallSideColor": map.style.wallSideColor,
                    "endZoneTopColor": map.style.endZoneTopColor,
                    "endZoneSideColor": map.style.endZoneSideColor,
                    "backgroundColor": map.style.backgroundColor,
                    "playerColor": map.style.playerColor,
                    "directLight": map.style.directLight ?? "rba(255,255,255)", 
                    "ambientLight" : map.style.ambientLight ?? "rba(140,184,198)",
                    "platformHeight": map.style.platformHeight,
                    "wallHeight": map.style.wallHeight,
                    "lightDirection": map.style.lightDirection,
                    "lightPitch": map.style.lightPitch 
                }
            downloadMap.platforms = [];
            map.platforms.forEach(platform => {
                downloadMap.platforms.push(
                    {
                        "x": platform.x,
                        "y": platform.y,
                        "width": platform.width,
                        "height": platform.height,
                        "angle": platform.angle,
                        "angleRad": platform.angleRad,
                        "endzone": platform.endzone,
                        "wall": platform.wall,
                        "hypotenuse": platform.hypotenuse,
                        "corners": platform.corners, // relative to platform origin. ordered BL BR TR TL. Blubber Turtle 
                    }
                )
            })

            downloadMap.platforms = sortPlatforms(downloadMap.platforms)

            writeCustomMap(downloadMap, "custom_map")

        
        } else {
            exitEdit()
        }

        
        function exitEdit() { // reset everything
            MapEditor.editorState = 0;
            MapEditor.loadedMap = null;
            MapEditor.screen.x = 0;
            MapEditor.screen.y = 0;
            MapEditor.screen.width = CanvasArea.canvas.width;
            MapEditor.screen.height = CanvasArea.canvas.height;
            MapEditor.scrollVelX = 0;
            MapEditor.scrollVelY = 0;
            MapEditor.snapAmount = 0;
            MapEditor.zoom = 1;
            MapEditor.renderedPlatforms = [];
            MapEditor.selectedElements = [];
            btn_snappingSlider.updateState(0);
            
            UserInterface.renderedButtons = UserInterface.btnGroup_mapEditorMenu
        }


        function sortPlatforms(platforms) {  // returns array of sorted platforms
            const millis = Date.now()

            // create all generated properties for each platform
            platforms.forEach( platform => {
                
                function sortCornersX(a, b) {
                    // if return is negative ... a comes first 
                    // if return is positive ... b comes first
                    // return is 0... nothing is changed
                    if (a[0] < b[0]) {return -1;}
                    if (a[0] > b[0]) {return 1;}
                    return 0;
                }

                // toSorted() isnt supported by old safari i guess?
                platform.cornersSorted = [...platform.corners]
                platform.cornersSorted.sort(sortCornersX)

                // Global coordinates of left and rightmost corners
                platform.leftMostCornerX = platform.cornersSorted[0][0] + platform.x
                platform.leftMostCornerY = platform.cornersSorted[0][1] + platform.y
                
                platform.rightMostCornerX = platform.cornersSorted[3][0] + platform.x
                platform.rightMostCornerY = platform.cornersSorted[3][1] + platform.y


                // Get global coordinates of top and bot corners
                if (platform.cornersSorted[1][1] < platform.cornersSorted[2][1]) {
                    platform.topCornerX = platform.cornersSorted[1][0] + platform.x 
                    platform.topCornerY = platform.cornersSorted[1][1] + platform.y
                    platform.botCornerX = platform.cornersSorted[2][0] + platform.x
                    platform.botCornerY = platform.cornersSorted[2][1] + platform.y
                } else {
                    platform.topCornerX = platform.cornersSorted[2][0] + platform.x
                    platform.topCornerY = platform.cornersSorted[2][1] + platform.y
                    platform.botCornerX = platform.cornersSorted[1][0] + platform.x
                    platform.botCornerY = platform.cornersSorted[1][1] + platform.y
                }


                platform.getSplitLineY = function(x) {
                    // y = mx + b
                    // m = rise over run
                    const slope = (this.rightMostCornerY - this.leftMostCornerY) / (this.rightMostCornerX - this.leftMostCornerX)
                    // b = y - mx
                    const b = this.rightMostCornerY - (slope * this.rightMostCornerX) 
                    const y = slope * x + b

                    if (x > this.rightMostCornerX) {return this.rightMostCornerY} // keeps y value within the platform's bounds...
                    if (x < this.leftMostCornerX) {return this.leftMostCornerY} // ...doesnt extend the function past the corners
                    return y

                }


            })


            console.log("platforms.length = " + platforms.length)


            function test_A_below_B(a, b) {
                if (
                    (a.x + a.width/2 <= b.x + b.width/2 && a.rightMostCornerY > b.getSplitLineY(a.rightMostCornerX)) ||  // a is to the left && a's rightCorner is below/infront of b
                    (a.x + a.width/2 > b.x + b.width/2 && a.leftMostCornerY > b.getSplitLineY(a.leftMostCornerX)) // a is to the right && a's leftCorner is below/infront of b
                ) {
                    return true // a is below/infront of b
                } else {
                    return false // a is NOT below/infront of b
                }
            }


            // CREATE ADJACENCY (occludes) LIST WITHIN PLATFORM OBJECTS

            platforms.forEach((platform1, i) => {
                platform1.occludes = []
                const platform1_adjustedHeight = platform1.wall ? downloadMap.style.wallHeight : 0

                platforms.forEach((platform2, i) => {

                    const platform2_adjustedHeight = platform2.wall ? downloadMap.style.wallHeight : 0

                    // CLOSE ENOUGH TO TEST FOR OCCLUSION 
                    if ( // also should exclude checking if platform2 is already occluding platform1 -- they cant occlude each other
                        (platform1 !== platform2) &&
                        (platform1.rightMostCornerX >= platform2.leftMostCornerX && platform1.leftMostCornerX <= platform2.rightMostCornerX) && // infront of each other horizontally

                        (platform1.topCornerY - platform1_adjustedHeight <= platform2.botCornerY + downloadMap.style.platformHeight) &&
                        (platform1.botCornerY + downloadMap.style.platformHeight >= platform2.topCornerY - platform2_adjustedHeight)
                    ) {
                        if (test_A_below_B(platform1, platform2)) {
                            platform1.occludes.push(platforms.indexOf(platform2))
                        }

                    }
                })
            })



            function topologicalSort(platforms) {
                const visited = new Set(); // list of all the already visited platforms. Set is quick to search through and prevents duplicates
                const sorted = [];


                function dfs(platform) { // Depth-First Search
                    visited.add(platform);

                    platform.occludes.forEach((occluded_platform_index) => { // loop through each platform that is occluded by this "key" platform
                        if (!visited.has(platforms[occluded_platform_index])) { // if havent visited this constraint_platform
                            dfs(platforms[occluded_platform_index]); // recursive call of dfs to go deeper into the tree
                        }
                    })

                    sorted.push(platform); // if cant go deeper then add this platform to the sorted array
                }


                platforms.forEach((platform, i) => { // loop through each platform in platforms array
                    if (!visited.has(platform)) {
                        dfs(platform);
                    }
                })

                return sorted;
            }


            const sortedPlatforms = topologicalSort(platforms);

            console.log("finished sort in: " + (Date.now() - millis) + "ms")

            // sort the actual platforms based on these sorted indexes
            return sortedPlatforms
        }


        async function writeCustomMap(exportObj, exportName) {
            console.log("WRITING MAP NOW!")
            exportName = prompt("Enter Map Name");

            const mapBlob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
            await UserInterface.writeFile(exportName + ".json", mapBlob, "maps")
            console.log("Successful Map Save");
            exitEdit()
            
        }
    },
}
