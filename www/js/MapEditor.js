const MapEditor = {
    editorState: 0,
    // 0 = disabled
    // 1 = main map edit screen
    // 2 = platform edit menu
    // 3 = map color page
    // 4 = map settings page

    loadedMap: null,
    scrollAmountX: null,
    scrollAmountY: null,
    scrollVelX: 0, // for smooth scrolling
    scrollVelY: 0,

    zoom: 1, // 10 = zoomed to 10x the scale. 0.1 zoomed out so everything is 10% of its size
    startingZoom: 1,

    screen: {
        // where the view is located realative to the map origin
        x: 0, // x and y are the center of the view (the crosshair)
        y: 0, // if 0,0 the view is centered on the map origin. Origin is in the center of the screen

        width: 0, //screenWidth / MapEditor.zoom,
        height: 0, //screenHeight / MapEditor.zoom,

        cornerX: this.x - this.width / 2, // these coords are the top left corner of the view screen
        cornerY: this.y - this.height / 2, // if they are 0,0 the origin of the map is in the top left corner

        // screen is updated in MapEditor.update()
    },

    scrollVelAveragerX: new Averager(10),
    scrollVelAveragerY: new Averager(10),

    renderedPlatforms: [],
    selectedElements: [], // platforms are their index, "playerStart" = playerStart, checkpoint items are each an array => 1st item is checkpoint index. 2nd is: 1=trigger1, 2=trigger2, 3=playerRespawn
    snapAmount: 2,
    multiSelect: false,
    dragSelect: false,
    dragSelectMarquee: {
        x: null, // Math.min(touch.startX, touch.x)
        y: null, // Math.min(touch.startY, touch.y)
        width: null, // Math.max(touch.startX, touch.x) - x
        height: null, // Math.max(touch.startY, touch.y) - y
    },
    // allows for showing selection border around platforms without adding them to selectedElements
    // keeps platforms seperate from ones already selected before dragSelect
    // Prevents moving the marqee off of an already selected platform and removing it from selectedElements
    // this array gets added to selectedElements on touchRelease
    marqueeSelectedElements: [],

    editQueue: [], // gets filled with QueueItems
    recordingEdit: false,

    initMap: async function (name) {
        if (name == -1) {
            // generate new map
            this.loadedMap = {
                playerStart: {
                    x: 350,
                    y: 250,
                    angle: 0,
                },
                checkpoints: [],
                style: {
                    backgroundColor: "rgb(139,202,218)",
                    playerColor: "rgb(240,240,240)",
                    platformTopColor: "rgb(209,70,63)",
                    platformSideColor: "rgb(209,70,63)",
                    wallTopColor: "rgb(125,94,49)",
                    wallSideColor: "rgb(125,94,49)",
                    endZoneTopColor: "rgb(255,218,98)",
                    endZoneSideColor: "rgb(255,218,98)",
                    directLight: "rgb(89,89,89)",
                    ambientLight: "rgb(191,191,191)",
                    platformHeight: 25,
                    wallHeight: 50,
                    lightDirection: 180,
                    lightPitch: 45,
                },
                platforms: [
                    {
                        x: 350,
                        y: 60,
                        width: 100,
                        height: 100,
                        angle: 0,
                        endzone: 1,
                        wall: 0,
                    },
                    {
                        x: 350,
                        y: 250,
                        width: 100,
                        height: 100,
                        angle: 45,
                        endzone: 0,
                        wall: 0,
                    },
                ],
            };

            // calculates the initial hypotenuse angleRad and corners for each platform
            this.loadedMap.platforms.forEach((platform) => this.updatePlatformCorners(platform));
        } else if (name == -2) {
            // import map from users file system

            // UPDATE THIS BUTTON TO INCLUDE FUNCTIONALITY OF OLD btn_importMap_text BUTTON:
            // let mapPaste = prompt("Paste Map Data:");
            // if (mapPaste) {
            //     MapEditor.loadedMap = JSON.parse(mapPaste);
            // }
            try {
                this.loadedMap = await new Promise((resolve, reject) => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".txt,.json";
                    document.body.appendChild(input);

                    input.addEventListener("change", () => {
                        const file = input.files[0];

                        // Clean up input after use
                        document.body.removeChild(input);

                        if (!file) {
                            reject("No file selected");
                            return;
                        }

                        const reader = new FileReader();

                        reader.onload = (e) => {
                            try {
                                resolve(JSON.parse(e.target.result));
                            } catch (err) {
                                reject(err);
                            }
                        };

                        reader.onerror = () => reject(reader.error);

                        reader.readAsText(file);
                    });

                    input.click(); // Trigger the file dialog
                });
            } catch (err) {
                alert("Failed to load map: " + err);
                btn_mapEditor.func();
                return;
            }
        } else {
            // load existing map
            const mapDataRaw = await readFile("device", "maps", name + ".json", "text");
            this.loadedMap = JSON.parse(mapDataRaw);
        }

        // switch to main MapEditor screen

        CanvasArea.canvas.style.backgroundColor = this.loadedMap.style.backgroundColor;
        CanvasArea.canvas.classList.remove("hidden");

        UserInterface.switchToUiGroup(UserInterface.uiGroup_mapEditorInterface);
        UserInterface.determineButtonColor(); 

        this.screen.x = this.loadedMap.playerStart.x;
        this.screen.y = this.loadedMap.playerStart.y;
        this.screen.width = screenWidth / this.zoom;
        this.screen.height = screenHeight / this.zoom;
        this.screen.cornerX = this.screen.x - this.screen.width / 2;
        this.screen.cornerY = this.screen.y - this.screen.height / 2;

        this.editorState = 1;

        UserInterface.gamestate = 7; // start updating MapEditor
    },

    update: function () {
        // called whenever gamestate == 7

        if (this.editorState == 1 || this.editorState == 2) {
            // main map edit screen OR platform select screen

            // SCROLLING THE SCREEN and SETTING OBJECTS TO ANGLE SLIDERS VALUES and SETTING ZOOM TO SLIDER VALUE EVERY FRAME
            if (
                TouchHandler.dragging == 1 &&
                !this.dragSelect &&
                !btn_translate.classList.contains("pressed") &&
                !btn_resize_BL.classList.contains("pressed") &&
                !btn_resize_BR.classList.contains("pressed") &&
                !btn_resize_TR.classList.contains("pressed") &&
                !btn_resize_TL.classList.contains("pressed") &&
                !btn_platformAngleSlider.handle.classList.contains("pressed") &&
                !btn_playerAngleSlider.handle.classList.contains("pressed") &&
                !btn_checkpointAngleSlider.handle.classList.contains("pressed") &&
                !btn_snappingSlider.handle.classList.contains("pressed")
            ) {
                // SCROLLING AROUND SCREEN

                if (this.scrollAmountX == null && this.scrollAmountY == null) {
                    // starting scroll
                    this.scrollAmountX = this.screen.x;
                    this.scrollAmountY = this.screen.y;
                }

                // ZOOMING
                if (TouchHandler.zoom.isZooming) {
                    this.zoom = TouchHandler.zoom.ratio * this.startingZoom;
                    if (this.zoom > 10) {
                        this.zoom = 10;
                    }
                    if (this.zoom < 0.05) {
                        this.zoom = 0.05;
                    }
                    if (Math.abs(this.zoom - 1) < 0.1) {
                        // snapping to zoom = 1 if close
                        this.zoom = 1;
                    }
                } else {
                    this.startingZoom = this.zoom;
                    // also set outside of if(dragging) loop so that if both touches
                    // are released on the same frame (and this zooming code isnt run)
                    // startZoom is still set to be the current zoom
                }

                // ACTUALLY SCROLLING THE SCREEN
                this.scrollAmountX -= (TouchHandler.dragAmountX / this.zoom) * CanvasArea.scale;
                this.scrollAmountY -= (TouchHandler.dragAmountY / this.zoom) * CanvasArea.scale;

                // sets scrollVel to average drag amount of past 10 frames
                this.scrollVelAveragerX.pushValue((-TouchHandler.dragAmountX / this.zoom) * CanvasArea.scale);
                this.scrollVelAveragerY.pushValue((-TouchHandler.dragAmountY / this.zoom) * CanvasArea.scale);

                this.scrollVelX = this.scrollVelAveragerX.getAverage();
                this.scrollVelY = this.scrollVelAveragerY.getAverage();

                this.screen.x = this.scrollAmountX;
                this.screen.y = this.scrollAmountY;
            } else {
                // not dragging around screen

                if (this.scrollAmountX != null && this.scrollAmountY != null) {
                    // just stopped dragging
                    this.scrollAmountX = null;
                    this.scrollAmountY = null;

                    this.scrollVelAveragerX.clear();
                    this.scrollVelAveragerY.clear();

                    this.startingZoom = this.zoom; // needs to be set here to avoid double touch zoom reset bug
                }

                this.screen.x += this.scrollVelX;
                this.screen.y += this.scrollVelY;

                if (Math.abs(this.scrollVelX) > 0.1) {
                    // apply X friction
                    this.scrollVelX -= this.scrollVelX * 3 * dt;
                } else {
                    this.scrollVelX = 0;
                }

                if (Math.abs(this.scrollVelY) > 0.1) {
                    // apply Y friction
                    this.scrollVelY -= this.scrollVelY * 3 * dt;
                } else {
                    this.scrollVelY = 0;
                }

                // UPDATE THE ANGLE OF OBJECTS WHEN THEIR ANGLE SLIDER IS PRESSED
                if (btn_platformAngleSlider.handle.classList.contains("pressed")) {
                    btn_platformAngleSlider.func();
                }
                if (btn_playerAngleSlider.handle.classList.contains("pressed")) {
                    btn_playerAngleSlider.func();
                }
                if (btn_checkpointAngleSlider.handle.classList.contains("pressed")) {
                    btn_checkpointAngleSlider.func();
                }
            }

            // UPDATING THE other 2 SCREEN Perameters every frame incase zoom changes
            this.screen.width = screenWidth / this.zoom;
            this.screen.height = screenHeight / this.zoom;
            this.screen.cornerX = this.screen.x - this.screen.width / 2;
            this.screen.cornerY = this.screen.y - this.screen.height / 2;

            // FIGURING OUT WHICH PLATFORMS TO RENDER IN MAP EDITOR
            this.renderedPlatforms = [];

            this.loadedMap.platforms.forEach((platform) => {
                // Loop through platforms
                platform.hypotenuse = Math.sqrt(platform.width * platform.width + platform.height * platform.height) / 2;

                if (
                    platform.x + platform.hypotenuse > this.screen.cornerX && // coming into frame on left side
                    platform.x - platform.hypotenuse < this.screen.cornerX + this.screen.width && // right side
                    platform.y + platform.hypotenuse + this.loadedMap.style.platformHeight > this.screen.cornerY && // top side
                    platform.y - platform.hypotenuse - (platform.wall ? this.loadedMap.style.wallHeight : 0) <
                        this.screen.cornerY + this.screen.height // bottom side
                ) {
                    this.renderedPlatforms.push(platform); // ADD platform to renderedPlatforms
                }
            });

            // Calculate which renderedPlatforms, checkpoints, and playerStart are in marquee select
            if (this.dragSelect && TouchHandler.dragging) {
                const touch = TouchHandler.touches[0];
                this.dragSelectMarquee.x = Math.min(touch.startX, touch.x);
                this.dragSelectMarquee.y = Math.min(touch.startY, touch.y);
                this.dragSelectMarquee.width = Math.max(touch.startX, touch.x) - this.dragSelectMarquee.x;
                this.dragSelectMarquee.height = Math.max(touch.startY, touch.y) - this.dragSelectMarquee.y;

                // updating the DOM element pos and size
                ui_dragSelectMarquee.style.left = `${this.dragSelectMarquee.x}px`;
                ui_dragSelectMarquee.style.top = `${this.dragSelectMarquee.y}px`;
                ui_dragSelectMarquee.style.width = `${this.dragSelectMarquee.width}px`;
                ui_dragSelectMarquee.style.height = `${this.dragSelectMarquee.height}px`;

                // marquee rectangle (screen coords) will need to be translated to global map cordinates to compare with platform positions
                const globalMarqueeCornerTL = this.convertToMapCord(this.dragSelectMarquee.x, this.dragSelectMarquee.y);
                const globalMarqueeCornerBR = this.convertToMapCord(
                    this.dragSelectMarquee.x + this.dragSelectMarquee.width,
                    this.dragSelectMarquee.y + this.dragSelectMarquee.height,
                );

                // takes a rectangle defined by center coordinates (x, y), width, height, and angle in radians
                const marqueePolygon = CanvasArea.createPoligon(
                    (globalMarqueeCornerTL.x + globalMarqueeCornerBR.x) / 2,
                    (globalMarqueeCornerTL.y + globalMarqueeCornerBR.y) / 2,
                    globalMarqueeCornerBR.x - globalMarqueeCornerTL.x,
                    globalMarqueeCornerBR.y - globalMarqueeCornerTL.y,
                    0,
                );

                this.marqueeSelectedElements = [];

                // Looping PLAFORMS to check if in marquee
                this.renderedPlatforms.forEach((platform) => {
                    const platformPoligon = CanvasArea.createPoligon(platform.x, platform.y, platform.width, platform.height, platform.angleRad);

                    if (CanvasArea.doPolygonsIntersect(marqueePolygon, platformPoligon)) {
                        // add platform to marqueeSelectedElements. concat is used for selectedElements array -- i dont remember why
                        this.marqueeSelectedElements = this.marqueeSelectedElements.concat(MapEditor.loadedMap.platforms.indexOf(platform));
                    }
                });

                // Looping CHECKPOINTS to check if in marquee
                this.loadedMap.checkpoints.forEach((checkpoint) => {
                    const checkpointIndex = this.loadedMap.checkpoints.indexOf(checkpoint);

                    // CREATE A 3 POINT POLIGON FROM CHECKPOINT
                    const trigger1 = {
                        x: checkpoint.triggerX1,
                        y: checkpoint.triggerY1,
                    };

                    const trigger2 = {
                        x: checkpoint.triggerX2,
                        y: checkpoint.triggerY2,
                    };

                    const respawn = {
                        x: checkpoint.x,
                        y: checkpoint.y,
                    };

                    const checkpointPoligon = [trigger1, trigger2, respawn];

                    if (CanvasArea.doPolygonsIntersect(marqueePolygon, checkpointPoligon)) {
                        // add each part of checkpoint to marqueeSelectedElements
                        this.marqueeSelectedElements = this.marqueeSelectedElements.concat([new Array(checkpointIndex, 1)]);
                        this.marqueeSelectedElements = this.marqueeSelectedElements.concat([new Array(checkpointIndex, 2)]);
                        this.marqueeSelectedElements = this.marqueeSelectedElements.concat([new Array(checkpointIndex, 3)]);
                    }
                });

                // Check if playerStart is in marquee
                const playerStart = this.loadedMap.playerStart;
                const playerStartPoligon = CanvasArea.createPoligon(playerStart.x, playerStart.y, 32, 32, (playerStart.angle * Math.PI) / 180);

                if (CanvasArea.doPolygonsIntersect(marqueePolygon, playerStartPoligon)) {
                    // add playerStart to marqueeSelectedElements
                    this.marqueeSelectedElements = this.marqueeSelectedElements.concat("playerStart");
                }
            }
        } // end of being in editorState 1 or 2

        // changing the editorState
        if (this.editorState == 1 && this.selectedElements.length > 0) {
            this.editorState = 2; // platform edit state w side panel
        }

        if (this.editorState == 2 && this.selectedElements.length == 0) {
            this.editorState = 1;
        }

        // UPDATING DYNAMIC BUTTONS AND SLIDERS EVERY FRAME

        if (this.editorState == 2) {
            // update translate and resize buttons every frame

            if (UserInterface.activeUiGroup.has(btn_translate)) {
                btn_translate.func();
            }

            if (UserInterface.activeUiGroup.has(btn_resize_TL)) {
                btn_resize_BL.func();
                btn_resize_BR.func();
                btn_resize_TR.func();
                btn_resize_TL.func();
            }
        }

        if (this.editorState == 3) {
            // in map color screen
            ColorPicker.update();
            // ColorPicker.render called in MapEditor.render()
        }

        if (this.editorState == 4) {
            // in map settings screen
            if (btn_platformHeightSlider.handle.classList.contains("pressed")) {
                this.loadedMap.style.platformHeight = UserInterface.getSliderValue(btn_platformHeightSlider);
                PreviewWindow.update();
            }

            if (btn_wallHeightSlider.handle.classList.contains("pressed")) {
                this.loadedMap.style.wallHeight = UserInterface.getSliderValue(btn_wallHeightSlider);
                PreviewWindow.update();
            }

            if (btn_lightDirectionSlider.handle.classList.contains("pressed")) {
                this.loadedMap.style.lightDirection = UserInterface.getSliderValue(btn_lightDirectionSlider);
                PreviewWindow.update();
            }

            if (btn_lightPitchSlider.handle.classList.contains("pressed")) {
                this.loadedMap.style.lightPitch = UserInterface.getSliderValue(btn_lightPitchSlider);
                PreviewWindow.update();
            }
        }
    },

    render: function () {
        if (this.loadedMap !== null) {
            // IF MAP IS LOADED RENDER IT

            if (this.editorState == 3 || this.editorState == 4) {
                // IN COLOR SETTINGS OR IN MAP SETTINGS

                PreviewWindow.render();
            } else {
                // not in map color or settings screen so RENDER MAP

                const ctx = CanvasArea.ctx;

                ctx.save(); // zooming everything to render MAP first
                ctx.scale(this.zoom, this.zoom);

                ctx.translate(-this.screen.cornerX, -this.screen.cornerY); // translate to map orgin

                ctx.fillRect(-2, -2, 4, 4); // (0,0) draw map origin

                // DRAW PLATFORM SIDES BELOW TOPS
                this.renderedPlatforms.forEach((platform) => {
                    // SIDES OF PLATFORMS
                    ctx.save(); // #18a
                    ctx.translate(platform.x, platform.y);

                    if (platform.wall) {
                        ctx.fillStyle = CanvasArea.getShadedColor(this.loadedMap.style.wallSideColor, 0.3, this.loadedMap.style);
                    } else if (platform.endzone) {
                        ctx.fillStyle = CanvasArea.getShadedColor(this.loadedMap.style.endZoneSideColor, 0.3, this.loadedMap.style);
                    } else {
                        ctx.fillStyle = CanvasArea.getShadedColor(this.loadedMap.style.platformSideColor, 0.3, this.loadedMap.style);
                    }

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

                    if (platform.angle > 0) {
                        // side3 right side

                        ctx.fillStyle = platform.shaded_sideColor3; // sideColor3
                        ctx.beginPath();
                        ctx.moveTo(platform.corners[1][0], platform.corners[1][1]); // BR
                        ctx.lineTo(platform.corners[2][0], platform.corners[2][1]); // TR
                        ctx.lineTo(platform.corners[2][0], platform.corners[2][1] + this.loadedMap.style.platformHeight); // TR + height
                        ctx.lineTo(platform.corners[1][0], platform.corners[1][1] + this.loadedMap.style.platformHeight); // BR + height
                        ctx.closePath();
                        ctx.fill();
                    }

                    if (platform.angle < 0) {
                        // side1 left side

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
                });

                // RENDER PLATFORMS TOPS
                this.renderedPlatforms.forEach((platform) => {
                    // DRAW PLATFORM TOP
                    ctx.save(); // ROTATING for Platforms
                    ctx.translate(platform.x, platform.y);
                    ctx.rotate((platform.angle * Math.PI) / 180);

                    // Change to endzone color if needed
                    if (platform.wall) {
                        ctx.fillStyle = this.loadedMap.style.wallTopColor;
                    } else if (platform.endzone) {
                        ctx.fillStyle = this.loadedMap.style.endZoneTopColor;
                    } else {
                        ctx.fillStyle = this.loadedMap.style.platformTopColor;
                    }

                    ctx.fillRect(-platform.width / 2, -platform.height / 2, platform.width, platform.height);

                    // DRAWING THE BORDER AROUND THE SELECTED PLATFORM
                    if (
                        this.selectedElements.includes(MapEditor.loadedMap.platforms.indexOf(platform)) ||
                        this.marqueeSelectedElements.includes(MapEditor.loadedMap.platforms.indexOf(platform))
                    ) {
                        ctx.strokeStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1;
                        ctx.lineWidth = 4;
                        ctx.strokeRect(-platform.width / 2 + 2, -platform.height / 2 + 2, platform.width - 4, platform.height - 4);
                    }

                    ctx.restore(); // restoring platform rotation and translation

                    // PLAFORM RENDERING DEBUG TEXT
                    // if (UserInterface.settings.debugText == 1) {
                    //     ctx.fillStyle = "#FFFFFF";
                    //     ctx.fillText("position: " + platform.x + ", " + platform.y, platform.x + 5, platform.y - 5);

                    //     //origin
                    //     ctx.fillStyle = "#00FF00";
                    //     ctx.fillRect(platform.x - 3, platform.y - 3, 6, 6)
                    // }
                });

                // RENDER WALLS ADDITIONAL HEIGHT
                this.renderedPlatforms.forEach((platform) => {
                    if (platform.wall) {
                        // DRAW WALL RAISED TOP
                        ctx.save(); // ROTATING for Platform
                        ctx.translate(platform.x, platform.y - MapEditor.loadedMap.style.wallHeight);
                        ctx.rotate((platform.angle * Math.PI) / 180);

                        ctx.strokeStyle = CanvasArea.getShadedColor(this.loadedMap.style.wallTopColor, 0.25, this.loadedMap.style);
                        ctx.lineWidth = 4;

                        ctx.strokeRect(-platform.width / 2 + 2, -platform.height / 2 + 2, platform.width - 4, platform.height - 4);

                        ctx.restore(); // restoring platform rotation and translation
                    }
                });

                // RENDER CHECKPOINTS
                this.loadedMap.checkpoints.forEach((checkpoint) => {
                    const checkpointIndex = this.loadedMap.checkpoints.indexOf(checkpoint);

                    ctx.strokeStyle = ctx.fillStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1;
                    ctx.lineWidth = 5;
                    ctx.beginPath();
                    ctx.moveTo(checkpoint.triggerX1, checkpoint.triggerY1);
                    ctx.lineTo(checkpoint.triggerX2, checkpoint.triggerY2);
                    ctx.stroke();

                    // trigger 1
                    ctx.beginPath();
                    ctx.arc(checkpoint.triggerX1, checkpoint.triggerY1, 20, 0, 2 * Math.PI);
                    ctx.fill();

                    // if trigger 1 selected highlight
                    if (
                        this.selectedElements.some((element) => Array.isArray(element) && this.arraysAreEqual(element, [checkpointIndex, 1])) ||
                        this.marqueeSelectedElements.some((element) => Array.isArray(element) && this.arraysAreEqual(element, [checkpointIndex, 1]))
                    ) {
                        ctx.strokeStyle = UserInterface.darkColor_1;
                        ctx.lineWidth = 6;
                        ctx.beginPath();
                        ctx.arc(checkpoint.triggerX1, checkpoint.triggerY1, 20, 0, 2 * Math.PI);
                        ctx.stroke();

                        ctx.strokeStyle = UserInterface.lightColor_1;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(checkpoint.triggerX1, checkpoint.triggerY1, 20, 0, 2 * Math.PI);
                        ctx.stroke();
                    }

                    // trigger 2
                    ctx.beginPath();
                    ctx.arc(checkpoint.triggerX2, checkpoint.triggerY2, 20, 0, 2 * Math.PI);
                    ctx.fill();

                    // if trigger 2 selected highlight
                    if (
                        this.selectedElements.some((element) => Array.isArray(element) && this.arraysAreEqual(element, [checkpointIndex, 2])) ||
                        this.marqueeSelectedElements.some((element) => Array.isArray(element) && this.arraysAreEqual(element, [checkpointIndex, 2]))
                    ) {
                        ctx.strokeStyle = UserInterface.darkColor_1;
                        ctx.lineWidth = 6;
                        ctx.beginPath();
                        ctx.arc(checkpoint.triggerX2, checkpoint.triggerY2, 20, 0, 2 * Math.PI);
                        ctx.stroke();

                        ctx.strokeStyle = UserInterface.lightColor_1;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(checkpoint.triggerX2, checkpoint.triggerY2, 20, 0, 2 * Math.PI);
                        ctx.stroke();
                    }

                    // playerRestart pos
                    ctx.save();
                    ctx.translate(checkpoint.x, checkpoint.y);
                    ctx.rotate((checkpoint.angle * Math.PI) / 180);
                    ctx.lineWidth = 3;
                    ctx.strokeRect(-16, -16, 32, 32);

                    // draw player arrow
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(8, 0);
                    ctx.lineTo(-5, -7);
                    ctx.lineTo(-5, 7);
                    ctx.lineTo(8, 0);
                    ctx.stroke();
                    ctx.restore();

                    // if playerRestart selected highlight
                    if (
                        this.selectedElements.some((element) => Array.isArray(element) && this.arraysAreEqual(element, [checkpointIndex, 3])) ||
                        this.marqueeSelectedElements.some((element) => Array.isArray(element) && this.arraysAreEqual(element, [checkpointIndex, 3]))
                    ) {
                        ctx.save();
                        ctx.translate(checkpoint.x, checkpoint.y);
                        ctx.rotate((checkpoint.angle * Math.PI) / 180);

                        ctx.strokeStyle = UserInterface.darkColor_1;
                        ctx.lineWidth = 6;
                        ctx.strokeRect(-16, -16, 32, 32);

                        ctx.strokeStyle = UserInterface.lightColor_1;
                        ctx.lineWidth = 2;
                        ctx.strokeRect(-16, -16, 32, 32);
                        ctx.restore();
                    }

                    // draw lines conecting to the playerRestart
                    ctx.beginPath();
                    ctx.setLineDash([6, 12]);
                    // ctx.strokeStyle = "#FFFFFF88"
                    ctx.moveTo(checkpoint.triggerX1, checkpoint.triggerY1);
                    ctx.lineTo(checkpoint.x, checkpoint.y);
                    ctx.lineTo(checkpoint.triggerX2, checkpoint.triggerY2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }); // end of loadedMap.checkpoints.forEach

                // RENDER THE PLAYER START
                ctx.save(); // player rotation translate save
                ctx.translate(this.loadedMap.playerStart.x, this.loadedMap.playerStart.y);
                ctx.rotate((this.loadedMap.playerStart.angle * Math.PI) / 180);
                ctx.fillStyle = this.loadedMap.style.playerColor;
                ctx.fillRect(-16, -16, 32, 32);

                // draw player arrow
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(8, 0);
                ctx.lineTo(-5, -7);
                ctx.lineTo(-5, 7);
                ctx.lineTo(8, 0);
                ctx.stroke();

                // DRAWING SELECTION BORDER AROUND PLAYER
                if (this.selectedElements.includes("playerStart") || this.marqueeSelectedElements.includes("playerStart")) {
                    ctx.strokeStyle = UserInterface.darkColor_1;
                    ctx.lineWidth = 6;
                    ctx.strokeRect(-13, -13, 26, 26);

                    ctx.strokeStyle = UserInterface.lightColor_1;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(-13, -13, 26, 26);
                }

                ctx.restore(); // player rotation and translate restoring

                ctx.restore(); // restoring screen.x and screen.y translation and zoom
                // essentially translating(+screen.x, +screen.y)
                // END OF ZOOM SCALED MAP RENDERING
            }
        }
    },

    touchReleased: function (x, y) {
        // only ever called if editorState == 1 or 2
        // x and y are already canvas scaled

        if (Math.abs(this.scrollVelX) > 0.5 || Math.abs(this.scrollVelY) > 0.5) {
            // if scrolling/panning
            return;
        }

        // if released within the edit platform side panel and panel is visible
        if (
            this.editorState == 2 && // something is selected
            !this.dragSelect && // dragSelect hides side panel
            UserInterface.isPointInsideElement(x, y, ui_editorSidePanel)
        ) {
            return;
        }

        // Maps the screens touch to the map's zoomed and panned view
        const touchMapped = this.convertToMapCord(x, y);

        if (this.dragSelect) {
            // release from dragSelect
            this.dragSelect = false;
            UserInterface.setToggleState(btn_dragSelect, false); // sync toggle button
            // Move marquee offscreen (reset it)
            ui_dragSelectMarquee.style.left = "-10px";
            ui_dragSelectMarquee.style.top = "-10px";
            ui_dragSelectMarquee.style.width = "0px";
            ui_dragSelectMarquee.style.height = "0px";

            // add marqueeSelectedElements to selectedElements
            // need to make sure each platform, checkpoint, and playerStart isnt already selected before adding
            this.marqueeSelectedElements.forEach((elementIndex) => {
                if (Array.isArray(elementIndex)) {
                    // if element is checkpoint
                    if (!this.selectedElements.some((element) => this.arraysAreEqual(element, elementIndex))) {
                        // checkpoint is NOT already selected
                        this.selectedElements = this.selectedElements.concat([elementIndex]);
                    }
                } else {
                    // elementIndex is platform or playerStart

                    if (!this.selectedElements.includes(elementIndex)) {
                        this.selectedElements = this.selectedElements.concat(elementIndex);
                    }
                }
            });

            this.marqueeSelectedElements = [];

            this.setButtonGroup();
            UserInterface.updateMapEditorSidePanel();

            return;
        }

        // used to check if clicked on platforms
        function isPointInRect(pointX, pointY, rect) {
            // Convert angle from degrees to radians
            const angleRad = (rect.angle * Math.PI) / 180;

            // Calculate the sine and cosine of the angle
            const cosAngle = Math.cos(angleRad);
            const sinAngle = Math.sin(angleRad);

            // Translate point to rectangle's coordinate system (centered at origin)
            const translatedX = pointX - rect.x;
            const translatedY = pointY - rect.y;

            // Rotate point to align with the rectangle (reverse rotation)
            const rotatedX = cosAngle * translatedX + sinAngle * translatedY;
            const rotatedY = -sinAngle * translatedX + cosAngle * translatedY;

            // Check if the rotated point is within the axis-aligned rectangle
            const halfWidth = rect.width / 2;
            const halfHeight = rect.height / 2;

            const isInside = Math.abs(rotatedX) <= halfWidth && Math.abs(rotatedY) <= halfHeight;

            return isInside;
        }

        const playerStartRect = {
            x: this.loadedMap.playerStart.x,
            y: this.loadedMap.playerStart.y,
            width: 32,
            height: 32,
            angle: this.loadedMap.playerStart.angle,
        };

        // RELEASED ON playerStart
        if (isPointInRect(touchMapped.x, touchMapped.y, playerStartRect)) {
            if (this.selectedElements.includes("playerStart")) {
                // toggle playerStart off
                const indexOfPlayerStart = this.selectedElements.indexOf("playerStart");
                this.selectedElements.splice(indexOfPlayerStart, 1);
            } else {
                // toggle playerStart on
                this.selectedElements = this.multiSelect ? this.selectedElements.concat("playerStart") : ["playerStart"];
            }

            this.setButtonGroup();
            UserInterface.updateMapEditorSidePanel();

            return;
        }

        // RELEASED ON checkpoint
        let clickedCheckpoint = false;
        this.loadedMap.checkpoints.forEach((checkpoint) => {
            const checkpointIndex = this.loadedMap.checkpoints.indexOf(checkpoint);

            if (
                // released checkpoint trigger 1
                Math.abs(checkpoint.triggerX1 - touchMapped.x) <= 20 &&
                Math.abs(checkpoint.triggerY1 - touchMapped.y) <= 20
            ) {
                if (this.selectedElements.some((element) => this.arraysAreEqual(element, [checkpointIndex, 1]))) {
                    // toggle trigger1 off
                    const indexOfSelectionItem = this.selectedElements.findIndex((element) => this.arraysAreEqual(element, [checkpointIndex, 1]));
                    this.selectedElements.splice(indexOfSelectionItem, 1);
                } else {
                    // toggle trigger1 on
                    this.selectedElements = this.multiSelect
                        ? this.selectedElements.concat([new Array(this.loadedMap.checkpoints.indexOf(checkpoint), 1)])
                        : [new Array(this.loadedMap.checkpoints.indexOf(checkpoint), 1)];
                }

                this.setButtonGroup();
                UserInterface.updateMapEditorSidePanel();

                clickedCheckpoint = true;
                return;
            }

            if (
                // released on checkpoint trigger 2
                Math.abs(checkpoint.triggerX2 - touchMapped.x) <= 20 &&
                Math.abs(checkpoint.triggerY2 - touchMapped.y) <= 20
            ) {
                if (this.selectedElements.some((element) => this.arraysAreEqual(element, [checkpointIndex, 2]))) {
                    // toggle trigger2 off
                    const indexOfSelectionItem = this.selectedElements.findIndex((element) => this.arraysAreEqual(element, [checkpointIndex, 2]));
                    this.selectedElements.splice(indexOfSelectionItem, 1);
                } else {
                    // toggle trigger2 on
                    this.selectedElements = this.multiSelect
                        ? this.selectedElements.concat([new Array(this.loadedMap.checkpoints.indexOf(checkpoint), 2)])
                        : [new Array(this.loadedMap.checkpoints.indexOf(checkpoint), 2)];
                }

                this.setButtonGroup();
                UserInterface.updateMapEditorSidePanel();

                clickedCheckpoint = true;
                return;
            }

            if (
                // released on playerRestart
                Math.abs(checkpoint.x - touchMapped.x) <= 20 &&
                Math.abs(checkpoint.y - touchMapped.y) <= 20
            ) {
                if (this.selectedElements.some((element) => this.arraysAreEqual(element, [checkpointIndex, 3]))) {
                    // toggle platerRestart off
                    const indexOfSelectionItem = this.selectedElements.findIndex((element) => this.arraysAreEqual(element, [checkpointIndex, 3]));
                    this.selectedElements.splice(indexOfSelectionItem, 1);
                } else {
                    // toggle playerRestart on
                    this.selectedElements = this.multiSelect
                        ? this.selectedElements.concat([new Array(this.loadedMap.checkpoints.indexOf(checkpoint), 3)])
                        : [new Array(this.loadedMap.checkpoints.indexOf(checkpoint), 3)];
                }

                this.setButtonGroup();
                UserInterface.updateMapEditorSidePanel();

                clickedCheckpoint = true;
                return;
            }
        }); // end of looping through each checkpoint
        if (clickedCheckpoint) {
            return;
        } // avoids clicking platform below

        // RELEASED ON platform
        this.renderedPlatforms.forEach((platform) => {
            if (isPointInRect(touchMapped.x, touchMapped.y, platform)) {
                if (this.selectedElements.includes(this.loadedMap.platforms.indexOf(platform))) {
                    // if platform is already selected -- deselect it
                    // toggle platform off
                    const indexOfPlatform = this.selectedElements.indexOf(this.loadedMap.platforms.indexOf(platform));
                    this.selectedElements.splice(indexOfPlatform, 1);
                } else {
                    // toggle platform on
                    if (this.multiSelect) {
                        this.selectedElements = this.selectedElements.concat(this.loadedMap.platforms.indexOf(platform));
                    } else {
                        this.selectedElements = [this.loadedMap.platforms.indexOf(platform)];
                    }
                }

                this.setButtonGroup();
                UserInterface.updateMapEditorSidePanel();

                return;
            }
        }); // end of looping through all renderedPlatforms
    },

    updatePlatformCorners: function (platform) {
        // needs to be called when platform is edited
        platform.hypotenuse = Math.sqrt(platform.width * platform.width + platform.height * platform.height) / 2;
        platform.angleRad = platform.angle * (Math.PI / 180);
        platform.corners = [
            // order: BL BR TR TL (relative coords to platform origin)
            // bot left corner
            [
                -((platform.width / 2) * Math.cos(platform.angleRad)) - (platform.height / 2) * Math.sin(platform.angleRad),
                -((platform.width / 2) * Math.sin(platform.angleRad)) + (platform.height / 2) * Math.cos(platform.angleRad),
            ],

            // bot right corner
            [
                (platform.width / 2) * Math.cos(platform.angleRad) - (platform.height / 2) * Math.sin(platform.angleRad),
                (platform.width / 2) * Math.sin(platform.angleRad) + (platform.height / 2) * Math.cos(platform.angleRad),
            ],

            // top right corner
            [
                (platform.width / 2) * Math.cos(platform.angleRad) + (platform.height / 2) * Math.sin(platform.angleRad),
                (platform.width / 2) * Math.sin(platform.angleRad) - (platform.height / 2) * Math.cos(platform.angleRad),
            ],

            // top left corner
            [
                -((platform.width / 2) * Math.cos(platform.angleRad)) + (platform.height / 2) * Math.sin(platform.angleRad),
                -((platform.width / 2) * Math.sin(platform.angleRad)) - (platform.height / 2) * Math.cos(platform.angleRad),
            ],
        ];
    },

    saveCustomMap: async function () {
        const savemap = confirm("Save Map?");
        if (savemap) {
            const map = this.loadedMap;

            downloadMap = {};
            ((downloadMap.playerStart = {
                x: map.playerStart.x,
                y: map.playerStart.y,
                angle: map.playerStart.angle,
            }),
                (downloadMap.checkpoints = map.checkpoints));
            downloadMap.style = {
                platformTopColor: map.style.platformTopColor,
                platformSideColor: map.style.platformSideColor,
                wallTopColor: map.style.wallTopColor,
                wallSideColor: map.style.wallSideColor,
                endZoneTopColor: map.style.endZoneTopColor,
                endZoneSideColor: map.style.endZoneSideColor,
                backgroundColor: map.style.backgroundColor,
                playerColor: map.style.playerColor,
                directLight: map.style.directLight ?? "rba(255,255,255)",
                ambientLight: map.style.ambientLight ?? "rba(140,184,198)",
                platformHeight: map.style.platformHeight,
                wallHeight: map.style.wallHeight,
                lightDirection: map.style.lightDirection,
                lightPitch: map.style.lightPitch,
            };
            downloadMap.platforms = [];
            map.platforms.forEach((platform) => {
                downloadMap.platforms.push({
                    x: platform.x,
                    y: platform.y,
                    width: platform.width,
                    height: platform.height,
                    angle: platform.angle,
                    angleRad: platform.angleRad,
                    endzone: platform.endzone,
                    wall: platform.wall,
                    hypotenuse: platform.hypotenuse,
                    corners: platform.corners, // relative to platform origin. ordered BL BR TR TL. Blubber Turtle
                });
            });

            downloadMap.platforms = sortPlatforms(downloadMap.platforms);

            writeCustomMap(downloadMap, "custom_map");
        } else {
            exitEdit();
        }

        function sortPlatforms(platforms) {
            // returns array of sorted platforms
            const millis = Date.now();

            // create all generated properties for each platform
            platforms.forEach((platform) => {
                function sortCornersX(a, b) {
                    // if return is negative ... a comes first
                    // if return is positive ... b comes first
                    // return is 0... nothing is changed
                    if (a[0] < b[0]) {
                        return -1;
                    }
                    if (a[0] > b[0]) {
                        return 1;
                    }
                    return 0;
                }

                // toSorted() isnt supported by old safari
                platform.cornersSorted = [...platform.corners];
                platform.cornersSorted.sort(sortCornersX);

                // Global coordinates of left and rightmost corners
                platform.leftMostCornerX = platform.cornersSorted[0][0] + platform.x;
                platform.leftMostCornerY = platform.cornersSorted[0][1] + platform.y;

                platform.rightMostCornerX = platform.cornersSorted[3][0] + platform.x;
                platform.rightMostCornerY = platform.cornersSorted[3][1] + platform.y;

                // Get global coordinates of top and bot corners
                if (platform.cornersSorted[1][1] < platform.cornersSorted[2][1]) {
                    platform.topCornerX = platform.cornersSorted[1][0] + platform.x;
                    platform.topCornerY = platform.cornersSorted[1][1] + platform.y;
                    platform.botCornerX = platform.cornersSorted[2][0] + platform.x;
                    platform.botCornerY = platform.cornersSorted[2][1] + platform.y;
                } else {
                    platform.topCornerX = platform.cornersSorted[2][0] + platform.x;
                    platform.topCornerY = platform.cornersSorted[2][1] + platform.y;
                    platform.botCornerX = platform.cornersSorted[1][0] + platform.x;
                    platform.botCornerY = platform.cornersSorted[1][1] + platform.y;
                }

                platform.getSplitLineY = function (x) {
                    // y = mx + b
                    // m = rise over run
                    const slope = (this.rightMostCornerY - this.leftMostCornerY) / (this.rightMostCornerX - this.leftMostCornerX);
                    // b = y - mx
                    const b = this.rightMostCornerY - slope * this.rightMostCornerX;
                    const y = slope * x + b;

                    if (x > this.rightMostCornerX) {
                        return this.rightMostCornerY;
                    } // keeps y value within the platform's bounds...
                    if (x < this.leftMostCornerX) {
                        return this.leftMostCornerY;
                    } // ...doesnt extend the function past the corners
                    return y;
                };
            });

            console.log("platforms.length = " + platforms.length);

            function test_A_below_B(a, b) {
                if (
                    (a.x <= b.x && a.rightMostCornerY > b.getSplitLineY(a.rightMostCornerX)) || // a is to the left && a's rightCorner is below/infront of b split line
                    (a.x > b.x && a.leftMostCornerY > b.getSplitLineY(a.leftMostCornerX)) // a is to the right && a's leftCorner is below/infront of b split line
                ) {
                    return true; // a is below/infront of b
                } else {
                    return false; // a is NOT below/infront of b
                }
            }

            // CREATE ADJACENCY (occludes) LIST WITHIN PLATFORM OBJECTS

            platforms.forEach((platform1, i) => {
                platform1.occludes = [];
                const platform1_adjustedHeight = platform1.wall ? downloadMap.style.wallHeight : 0;

                platforms.forEach((platform2, i) => {
                    const platform2_adjustedHeight = platform2.wall ? downloadMap.style.wallHeight : 0;

                    // CLOSE ENOUGH TO TEST FOR OCCLUSION
                    if (
                        // also should exclude checking if platform2 is already occluding platform1 -- they cant occlude each other
                        platform1 !== platform2 &&
                        platform1.rightMostCornerX >= platform2.leftMostCornerX &&
                        platform1.leftMostCornerX <= platform2.rightMostCornerX && // infront of each other horizontally
                        platform1.topCornerY - platform1_adjustedHeight <= platform2.botCornerY + downloadMap.style.platformHeight &&
                        platform1.botCornerY + downloadMap.style.platformHeight >= platform2.topCornerY - platform2_adjustedHeight
                    ) {
                        if (test_A_below_B(platform1, platform2)) {
                            platform1.occludes.push(platforms.indexOf(platform2));
                        }
                    }
                });
            });

            function topologicalSort(platforms) {
                const visited = new Set(); // list of all the already visited platforms. Set is quick to search through and prevents duplicates
                const sorted = [];

                function dfs(platform) {
                    // Depth-First Search
                    visited.add(platform);

                    platform.occludes.forEach((occluded_platform_index) => {
                        // loop through each platform that is occluded by this "key" platform
                        if (!visited.has(platforms[occluded_platform_index])) {
                            // if havent visited this constraint_platform
                            dfs(platforms[occluded_platform_index]); // recursive call of dfs to go deeper into the tree
                        }
                    });

                    sorted.push(platform); // if cant go deeper then add this platform to the sorted array
                }

                platforms.forEach((platform, i) => {
                    // loop through each platform in platforms array
                    if (!visited.has(platform)) {
                        dfs(platform);
                    }
                });

                return sorted;
            }

            const sortedPlatforms = topologicalSort(platforms);

            console.log("finished sort in: " + (Date.now() - millis) + "ms");

            // sort the actual platforms based on these sorted indexes
            return sortedPlatforms;
        }

        async function writeCustomMap(exportObj, exportName) {
            console.log("WRITING MAP NOW!");
            exportName = prompt("Enter Map Name");

            const mapBlob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
            await writeFile(exportName + ".json", mapBlob, "maps");
            console.log("Successful Map Save");
            exitEdit();
        }

        function exitEdit() {
            // reset everything and go back to MapBrowser

            MapEditor.loadedMap = null;
            MapEditor.zoom = 1;
            MapEditor.screen.x = 0;
            MapEditor.screen.y = 0;
            MapEditor.screen.width = screenWidth;
            MapEditor.screen.height = screenHeight;
            MapEditor.scrollVelX = 0;
            MapEditor.scrollVelY = 0;

            MapEditor.renderedPlatforms = [];
            MapEditor.selectedElements = [];

            MapEditor.dragSelect = false;
            UserInterface.setToggleState(btn_dragSelect, false);
            MapEditor.multiSelect = false;
            UserInterface.setToggleState(btn_multiSelect, false);

            MapEditor.snapAmount = 2;
            UserInterface.setSliderValue(btn_snappingSlider, 2);

            btn_platformAngleSlider.dataset.step = 2;
            btn_playerAngleSlider.dataset.step = 2;
            btn_checkpointAngleSlider.dataset.step = 2;

            CanvasArea.canvas.classList.add("hidden");

            btn_mapEditor.func(); // press the main menu's Map Editor button to set up Map Editor Browser
        }
    },

    convertToMapCord: function (screenX, screenY) {
        const mapX = mapToRange(screenX, 0, screenWidthUI, this.screen.cornerX, this.screen.cornerX + this.screen.width);
        const mapY = mapToRange(screenY, 0, screenHeightUI, this.screen.cornerY, this.screen.cornerY + this.screen.height);

        return {
            x: mapX,
            y: mapY,
        };
    },

    setButtonGroup: function () {
        // setting UiGroups and syncing nesesary sliders and buttons

        if (MapEditor.selectedElements.length == 0) {
            // nothing selected
            UserInterface.switchToUiGroup(UserInterface.uiGroup_mapEditorInterface);
        } else if (MapEditor.selectedElements.length > 1) {
            // multiple elements selected
            UserInterface.switchToUiGroup(UserInterface.uiGroup_editMultiSelect);
        } else {
            // one element is selected
            if (MapEditor.selectedElements.includes("playerStart")) {
                UserInterface.switchToUiGroup(UserInterface.uiGroup_editPlayerStart);
                UserInterface.setSliderValue(btn_playerAngleSlider, MapEditor.loadedMap.playerStart.angle, true); // sync
            } else if (Array.isArray(MapEditor.selectedElements[0])) {
                // checkpoint part is selected
                UserInterface.switchToUiGroup(UserInterface.uiGroup_editCheckpoint);
                UserInterface.setSliderValue(
                    btn_checkpointAngleSlider,
                    MapEditor.loadedMap.checkpoints[MapEditor.selectedElements[0][0]].angle,
                    true,
                ); // sync
            } else {
                // platform is selected
                UserInterface.switchToUiGroup(UserInterface.uiGroup_editPlatform);
                UserInterface.setSliderValue(btn_platformAngleSlider, MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].angle, true); // sync

                const isWall = this.loadedMap.platforms[this.selectedElements[0]].wall;
                UserInterface.setToggleState(btn_wall, isWall);
                btn_wall.label.textContent = isWall ? "Wall: Yes" : "Wall: No";

                const isEndZone = this.loadedMap.platforms[this.selectedElements[0]].endzone;
                UserInterface.setToggleState(btn_endzone, isEndZone);
                btn_endzone.label.textContent = isEndZone ? "End Zone: Yes" : "End Zone: No";
            }
        }
    },

    arraysAreEqual: function (a, b) {
        // used to test if two arrays == each other
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length !== b.length) return false;

        for (var i = 0; i < a.length; ++i) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    },

    indexSelectedElements: function () {
        // counts how many of each object are within MapEditor.selectedElements
        const info = {
            platforms: 0,
            walls: 0,
            endZones: 0,
            checkpoints: 0,
            playerStart: 0,
        };

        const checkpointIds = new Set();

        for (const item of this.selectedElements) {
            if (typeof item === "number") {
                const platform = MapEditor.loadedMap.platforms[item];
                if (platform.wall) {
                    info.walls++;
                } else if (platform.endzone) {
                    info.endZones++;
                } else {
                    info.platforms++;
                }
            } else if (Array.isArray(item)) {
                checkpointIds.add(item[0]);
            } else if (item === "playerStart") {
                info.playerStart++;
            }
        }

        info.checkpoints = checkpointIds.size;
        return info;
    },
};
