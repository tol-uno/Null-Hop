const UserInterface = {

    gamestate: 1,
    // 1: main menu
    // 2: level select map browser
    // 3: settings
    // 4: store
    // 5: loading map page
    // 6: in level
    // 7: in map editor

    settings: {
        sensitivity: null,
        volume: null,
        debugText: null,
        strafeHUD: null,
        playTutorial: null,
    },

    showVelocity: true,

    timer: 0,
    timerStart: null, // set by jump button
    levelState: 1, // 1 = pre-start, 2 = playing level, 3 = in endzone

    leaderboards: {},
    records: {},
    previousRecord: 0,

    showVerticalWarning: false,
    showOverstrafeWarning: false,

    darkMode: false,

    // lightColor_1 : "#fff8ea", // lighter
    // lightColor_2 : "#f7f1e4", // darker
    // darkColor_1 : "#503c4b",
    // darkColor_2 : "#412b3a",

    lightColor_1: "#F5F5F5", // lighter
    lightColor_2: "#E0E0E0", // darker
    darkColor_1: "#454545",
    darkColor_2: "#363636",

    start: function () { // where all buttons are created


        this.getSettings()
        this.getRecords()
        this.getLeaderboards()
        this.checkCustomMapsDirectoryExists()


        // CREATING THE BUTTONS []  []  [] 

        // Main Menu BUTTONS
        btn_play = new Button("midX - 90", 180, 180, "play_button", "", 0, "", function () {
            UserInterface.gamestate = 2;
            UserInterface.renderedButtons = UserInterface.btnGroup_standardMapBrowser
            MapBrowser.state = 1;
            MapBrowser.init()
        })

        btn_settings = new Button("midX - 116.5", 280, 233, "settings_button", "", 0, "", function () {
            UserInterface.gamestate = 3;
            UserInterface.renderedButtons = UserInterface.btnGroup_settings
        })

        btn_mapEditor = new Button("midX - 143", 380, 286, "map_editor_button", "", 0, "", function () {
            UserInterface.gamestate = 7;
            MapEditor.editorState = 0;
            UserInterface.renderedButtons = UserInterface.btnGroup_mapEditorMenu;
        })



        // SETTINGS Buttons 
        btn_reset_settings = new Button("CanvasArea.canvas.width - 300", "CanvasArea.canvas.height - 100", 200, "", "", 0, "Erase Data", function () {

            const reset = confirm("Reset All Settings and Records?");
            if (reset) {

                UserInterface.records = {
                    "unlocked": UserInterface.records.unlocked
                };
                UserInterface.writeRecords();


                UserInterface.settings = {
                    "sensitivity": 0.5,
                    "volume": 0.5,
                    "debugText": 0,
                    "strafeHUD": 1,
                    "playTutorial": 1
                }
                UserInterface.writeSettings()

                // sync all settings button
                btn_sensitivitySlider.updateState(UserInterface.settings.sensitivity)
                btn_volumeSlider.updateState(UserInterface.settings.volume)
                btn_debugText.func(true)
                btn_strafeHUD.func(true)
                btn_playTutorial.func(true)
                AudioHandler.setVolumes();

                console.log("records and settings cleared")
            }

        })

        btn_sensitivitySlider = new SliderUI(180, 100, 300, 0.1, 3, 10, "Sensitivity", UserInterface.settings.sensitivity, function () {
            UserInterface.settings.sensitivity = this.value
            UserInterface.writeSettings()
        })

        btn_volumeSlider = new SliderUI(180, 200, 300, 0, 1, 10, "Volume", UserInterface.settings.volume, function () {
            UserInterface.settings.volume = this.value
            UserInterface.writeSettings()
            AudioHandler.setVolumes();
        })

        btn_debugText = new Button(310, 240, 80, "toggle_button", "toggle_button_pressed", 1, "", function (sync) {
            if (sync) {
                this.toggle = UserInterface.settings.debugText;
            } else {
                if (this.toggle == 1) {
                    this.toggle = 0;
                    UserInterface.settings.debugText = 0
                    UserInterface.writeSettings()
                } else {
                    this.toggle = 1;
                    UserInterface.settings.debugText = 1
                    UserInterface.writeSettings()
                }
            }
        })

        btn_strafeHUD = new Button(310, 300, 80, "toggle_button", "toggle_button_pressed", 1, "", function (sync) {
            if (sync) {
                this.toggle = UserInterface.settings.strafeHUD;
            } else {
                if (this.toggle == 1) {
                    this.toggle = 0;
                    UserInterface.settings.strafeHUD = 0
                    UserInterface.writeSettings()
                } else {
                    this.toggle = 1;
                    UserInterface.settings.strafeHUD = 1
                    UserInterface.writeSettings()
                }
            }
        })



        // MAP EDITOR MENU BUTTONS
        btn_new_map = new Button("200", "40", 400, "", "", 0, "Create New Map", function () {

            MapEditor.loadedMap = {
                "playerStart": {
                    "x": 350,
                    "y": 250,
                    "angle": 0
                },
                "checkpoints": [],
                "style": {
                    "backgroundColor": "rgba(163,213,225)",
                    "playerColor": "rgba(239,238,236)",
                    "platformTopColor": "rgba(209,70,63)",
                    "platformSideColor": "rgba(209,70,63)",
                    "wallTopColor": "rgba(125,94,49)",
                    "wallSideColor": "rgba(125,94,49)",
                    "endZoneTopColor": "rgba(255,218,98)",
                    "endZoneSideColor": "rgba(255,218,98)",
                    "directLight": "rba(128,128,128)",
                    "ambientLight": "rba(170,191,197)",
                    "platformHeight": 25,
                    "wallHeight": 50,
                    "lightDirection": 180,
                    "lightPitch": 45
                },
                "platforms": [
                    {
                        "x": 350,
                        "y": 60,
                        "width": 100,
                        "height": 100,
                        "angle": 0,
                        "endzone": 1,
                        "wall": 0
                    },
                    {
                        "x": 350,
                        "y": 250,
                        "width": 100,
                        "height": 100,
                        "angle": 45,
                        "endzone": 0,
                        "wall": 0
                    }
                ]
            }

            // calculates the initial hypotenuse angleRad and corners for each platform
            MapEditor.loadedMap.platforms.forEach((platform) => MapEditor.updatePlatformCorners(platform))
        })

        btn_load_map = new Button("200", "140", 400, "", "", 0, "Load A Map", function () {
            MapEditor.editorState = 5;

            UserInterface.gamestate = 2;

            UserInterface.renderedButtons = UserInterface.btnGroup_editMapBrowser;


            // ADDING DIV OVERLAY FOR SHARE BUTTON
            btn_shareMap.func(true) // runs the createDiv function of the button


            MapBrowser.state = 2
            MapBrowser.init()
        })

        btn_import_map = new Button("200", "240", 400, "", "", 0, "Import Map From File Browser", function () {

            // LOAD FROM LOCAL FILE SYSTEM 
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".text";
            document.body.appendChild(input);
            input.click();

            input.addEventListener('change', function () {
                const file = input.files[0]

                const reader = new FileReader();
                reader.onload = (e) => {
                    MapEditor.loadedMap = JSON.parse(e.target.result)
                };
                reader.onerror = (e) => alert(e.target.error.name);

                reader.readAsText(file)
            })

            input.remove();

        })

        btn_import_map_text = new Button("200", "340", 400, "", "", 0, "Import Map From Copy Paste", function () {

            let mapPaste = prompt("Paste Map Data:");
            if (mapPaste) {
                MapEditor.loadedMap = JSON.parse(mapPaste)
            }

        })


        // MAP EDITOR BUTTONS
        btn_exit_edit = new Button(50, 50, 100, "back_button", "back_button_pressed", 0, "", function () {
            MapEditor.saveCustomMap()
        })

        btn_add_platform = new Button("CanvasArea.canvas.width - 240", "25", 204, "platform_button", "", 0, "", function () {

            const newPlatform = {
                "x": Math.round(MapEditor.screen.x),
                "y": Math.round(MapEditor.screen.y),
                "width": 100,
                "height": 100,
                "hypotenuse": Math.sqrt(this.width * this.width + this.height * this.height) / 2,
                "angle": 0,
                "endzone": 0,
                "wall": 0
            }

            MapEditor.updatePlatformCorners(newPlatform) // update dynamic attributes of platform

            MapEditor.loadedMap.platforms.push(newPlatform);
            MapEditor.selectedElements = MapEditor.multiSelect ? MapEditor.selectedElements.concat(MapEditor.loadedMap.platforms.length - 1) : [MapEditor.loadedMap.platforms.length - 1]
            UserInterface.renderedButtons = UserInterface.btnGroup_editPlatform

            // SYNC ALL BUTTONS AND SLIDERS
            btn_angleSlider.updateState(MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].angle)
            btn_wall.func(true) // syncs the wall button's toggle state
        })

        btn_add_checkpoint = new Button("CanvasArea.canvas.width - 300", "120", 250, "cp_button", "", 0, "", function () {
            const middleX = Math.round(MapEditor.screen.x)
            const middleY = Math.round(MapEditor.screen.y)
            const newCheckPoint = {
                "triggerX1": middleX - 100,
                "triggerY1": middleY,
                "triggerX2": middleX + 100,
                "triggerY2": middleY,
                "x": middleX,
                "y": middleY + 50,
                "angle": 270
            }

            MapEditor.loadedMap.checkpoints.push(newCheckPoint);
        })

        btn_map_colors = new Button("CanvasArea.canvas.width -388", "25", 126, "map_colors_button", "", 0, "", function () {
            MapEditor.editorState = 3 // map colors

            PreviewWindow.update()

            UserInterface.renderedButtons = UserInterface.btnGroup_mapColor
        })

        btn_map_settings = new Button("CanvasArea.canvas.width - 550", "25", 141, "map_settings_button", "", 0, "", function () {
            MapEditor.editorState = 4 // map settings

            PreviewWindow.update()

            btn_platformHeightSlider.updateState(MapEditor.loadedMap.style.platformHeight) // value is set to 0 before we're in MapEditor
            btn_wallHeightSlider.updateState(MapEditor.loadedMap.style.wallHeight)
            btn_lightDirectionSlider.updateState(MapEditor.loadedMap.style.lightDirection)
            btn_lightPitchSlider.updateState(MapEditor.loadedMap.style.lightPitch)

            UserInterface.renderedButtons = UserInterface.btnGroup_mapSettings
        })

        btn_multiSelect = new Button("60", "CanvasArea.canvas.height - 200", 60, "toggle_button", "toggle_button_pressed", 1, "", function (sync) {
            if (MapEditor.loadedMap) { // throws an error otherwise
                if (sync) {
                    this.toggle = MapEditor.multiSelect;
                } else {
                    if (this.toggle) { // turn off multiSelect
                        this.toggle = 0;
                        MapEditor.multiSelect = false

                        // turn off dragSelect bc it needs multiSelect
                        if (MapEditor.dragSelect) {
                            MapEditor.dragSelect = false
                            btn_dragSelect.func(true) // sync button
                        }

                        if (MapEditor.selectedElements.length > 1) {
                            MapEditor.selectedElements = [MapEditor.selectedElements[MapEditor.selectedElements.length - 1]] // make it only select the last element in the array

                            // set correct btnGroup
                            if (MapEditor.selectedElements[0] == "playerStart") {
                                UserInterface.renderedButtons = UserInterface.btnGroup_editPlayerStart

                            } else if (Array.isArray(MapEditor.selectedElements[0])) {
                                UserInterface.renderedButtons = UserInterface.btnGroup_editCheckPoint

                            } else {
                                UserInterface.renderedButtons = UserInterface.btnGroup_editPlatform;
                            }

                        }

                    } else { // turn on multiSelect
                        this.toggle = 1;
                        MapEditor.multiSelect = true
                    }
                }
            }
        })

        btn_dragSelect = new Button("60", "CanvasArea.canvas.height - 300", 60, "toggle_button", "toggle_button_pressed", 1, "", function (sync) {
            if (MapEditor.loadedMap) { // throws an error otherwise
                if (sync) {
                    this.toggle = MapEditor.dragSelect;
                } else {
                    if (this.toggle) { // turn off dragSelect
                        this.toggle = 0;
                        MapEditor.dragSelect = false

                    } else { // turn on dragSelect and multiSelect (required)
                        this.toggle = 1;
                        MapEditor.dragSelect = true
                        MapEditor.multiSelect = true
                        btn_multiSelect.func(true)  // sync button's toggle
                    }
                }
            }
        })

        btn_snappingSlider = new SliderUI("60", "CanvasArea.canvas.height - 60", 170, 0, 50, 0.2, "Snapping", MapEditor.loadedMap ? MapEditor.snapAmount : 0, function () {
            MapEditor.snapAmount = this.value
        })

        btn_unselect = new Button("CanvasArea.canvas.width - 260", "30", 60, "x_button", "", 0, "", function () {
            UserInterface.renderedButtons = UserInterface.btnGroup_mapEditorInterface
            MapEditor.selectedElements = []; // No selected platforms
        })

        btn_translate = new Button(0, 0, 50, "translate_button", "", 0, "", function () {
            // for multiselect:
            // get center average of all selected elements
            // create an array containing each element with its xKey / yKey
            // do a selectedElements.forEach loop to run logic on each element

            let avgMidX = 0
            let avgMidY = 0
            let conditioningArray = []

            // populate conditioningArray
            for (let i = 0; i < MapEditor.selectedElements.length; i++) {

                // PRE CONDITIONING FOR THE SELECTED ELEMENTS
                let item = {
                    element: null,
                    xKey: "x", // these are used to distingish wheather to use triggerX1 or just x when dealing with checkpoints
                    yKey: "y", // implemented this system so that the btn_translate logic can be done with one section of code
                    offSet: 0, // amount to offset the bnt_translate from the center of the element
                }


                if (MapEditor.selectedElements[i] == "playerStart") { // if playerStart is selected
                    item.element = MapEditor.loadedMap.playerStart
                    item.offSet = 32

                    //} else if (MapEditor.selectedElements.some((element) => Array.isArray(element))) { // some() checks if any elements within the array match the given condition
                } else if (Array.isArray(MapEditor.selectedElements[i])) {

                    //checkpoint = MapEditor.selectedElements.find((element) => Array.isArray(element)) // multi
                    checkpoint = MapEditor.selectedElements[i]

                    item.element = MapEditor.loadedMap.checkpoints[checkpoint[0]]

                    if (checkpoint[1] == 1) {
                        item.xKey = "triggerX1"
                        item.yKey = "triggerY1"
                    }

                    if (checkpoint[1] == 2) {
                        item.xKey = "triggerX2"
                        item.yKey = "triggerY2"
                    }

                    if (checkpoint[1] == 3) {
                        item.offSet = 32
                    }

                } else { // selected platform
                    item.element = MapEditor.loadedMap.platforms[MapEditor.selectedElements[i]]
                }

                conditioningArray.push(item)
                avgMidX += item.element[item.xKey]
                avgMidY += item.element[item.yKey]
            }

            avgMidX = avgMidX / conditioningArray.length
            avgMidY = avgMidY / conditioningArray.length



            // ACTUAL BUTTON LOGIC 

            if (!this.isPressed) { // not pressed

                // element coords mapped to screen coords
                // mapToRange(number, inMin, inMax, outMin, outMax)
                const xMapped = CanvasArea.mapToRange(avgMidX, MapEditor.screen.cornerX, MapEditor.screen.cornerX + MapEditor.screen.width, 0, CanvasArea.canvas.width)
                const yMapped = CanvasArea.mapToRange(avgMidY, MapEditor.screen.cornerY, MapEditor.screen.cornerY + MapEditor.screen.height, 0, CanvasArea.canvas.height)

                // position button in the middle of element(s)
                if (MapEditor.selectedElements.length > 1) {
                    this.x = xMapped - this.width / 2
                    this.y = yMapped - this.height / 2
                } else {
                    this.x = xMapped + (conditioningArray[0].offSet * MapEditor.zoom) - this.width / 2
                    this.y = yMapped + (conditioningArray[0].offSet * MapEditor.zoom) - this.height / 2
                }

            } else if (TouchHandler.dragging) {

                // move button according to touch dragging
                // adjust and pan screen if button is near the edge
                // move element to rounded and mapped button coords
                // snap element to snapping slider

                this.x += TouchHandler.dragAmountX * CanvasArea.scale
                this.y += TouchHandler.dragAmountY * CanvasArea.scale

                // panning if at edges of screen
                if (this.x > CanvasArea.canvas.width - 340) { MapEditor.screen.x += 400 / MapEditor.zoom * dt }
                if (this.x < 60) { MapEditor.screen.x -= 400 / MapEditor.zoom * dt }
                if (this.y > CanvasArea.canvas.height - 130) { MapEditor.screen.y += 400 / MapEditor.zoom * dt }
                if (this.y < 30) { MapEditor.screen.y -= 400 / MapEditor.zoom * dt }


                // MOVING EACH SELECTED ELEMENT TO FOLLOW BUTTON
                for (let i = 0; i < MapEditor.selectedElements.length; i++) {
                    let offSetFromBtnX = (avgMidX - conditioningArray[i].element[conditioningArray[i].xKey]) * MapEditor.zoom
                    let offSetFromBtnY = (avgMidY - conditioningArray[i].element[conditioningArray[i].yKey]) * MapEditor.zoom

                    let xMapped
                    let yMapped
                    // this.x and this.y mapped to map coords
                    // mapToRange(number, inMin, inMax, outMin, outMax)
                    if (MapEditor.selectedElements.length > 1) { // use offSetFromBtn which is offset from center of all selected items
                        xMapped = CanvasArea.mapToRange(this.x - offSetFromBtnX + this.width / 2, 0, CanvasArea.canvas.width, MapEditor.screen.cornerX, MapEditor.screen.cornerX + MapEditor.screen.width)
                        yMapped = CanvasArea.mapToRange(this.y - offSetFromBtnY + this.height / 2, 0, CanvasArea.canvas.height, MapEditor.screen.cornerY, MapEditor.screen.cornerY + MapEditor.screen.height)
                    } else { // use offset
                        xMapped = CanvasArea.mapToRange(this.x - (conditioningArray[i].offSet * MapEditor.zoom) + this.width / 2, 0, CanvasArea.canvas.width, MapEditor.screen.cornerX, MapEditor.screen.cornerX + MapEditor.screen.width)
                        yMapped = CanvasArea.mapToRange(this.y - (conditioningArray[i].offSet * MapEditor.zoom) + this.height / 2, 0, CanvasArea.canvas.height, MapEditor.screen.cornerY, MapEditor.screen.cornerY + MapEditor.screen.height)
                    }

                    conditioningArray[i].element[conditioningArray[i].xKey] = Math.round(xMapped)
                    conditioningArray[i].element[conditioningArray[i].yKey] = Math.round(yMapped)

                    if (MapEditor.snapAmount > 0) {
                        conditioningArray[i].element[conditioningArray[i].xKey] = Math.round(conditioningArray[i].element[conditioningArray[i].xKey] / MapEditor.snapAmount) * MapEditor.snapAmount
                        conditioningArray[i].element[conditioningArray[i].yKey] = Math.round(conditioningArray[i].element[conditioningArray[i].yKey] / MapEditor.snapAmount) * MapEditor.snapAmount
                    }
                }
            }
        })

        btn_resize_BL = new Button(0, 0, 50, "scale_button", "", 0, "", function () {

            let platform = MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]]

            if (!this.isPressed) {
                // position button at corner/edge of element

                // BL corner (relative to platform center)
                const cornerX = platform.corners[0][0]
                const cornerY = platform.corners[0][1]

                // corner coords mapped to screen coords
                // mapToRange(number, inMin, inMax, outMin, outMax)
                const cornerMappedX = CanvasArea.mapToRange(platform.x + cornerX, MapEditor.screen.cornerX, MapEditor.screen.cornerX + MapEditor.screen.width, 0, CanvasArea.canvas.width)
                const cornerMappedY = CanvasArea.mapToRange(platform.y + cornerY, MapEditor.screen.cornerY, MapEditor.screen.cornerY + MapEditor.screen.height, 0, CanvasArea.canvas.height)

                this.x = cornerMappedX - this.width
                this.y = cornerMappedY


            } else if (TouchHandler.dragging) {

                // move button according to touch dragging
                this.x += TouchHandler.dragAmountX * CanvasArea.scale
                this.y += TouchHandler.dragAmountY * CanvasArea.scale

                // panning if at edges of screen
                if (this.x > CanvasArea.canvas.width - 340) { MapEditor.screen.x += 400 / MapEditor.zoom * dt }
                if (this.x < 60) { MapEditor.screen.x -= 400 / MapEditor.zoom * dt }
                if (this.y > CanvasArea.canvas.height - 130) { MapEditor.screen.y += 400 / MapEditor.zoom * dt }
                if (this.y < 30) { MapEditor.screen.y -= 400 / MapEditor.zoom * dt }


                // TR pinned corner MAP COORDS
                const pinnedX_mapCoords = platform.x + platform.corners[2][0]
                const pinnedY_mapCoords = platform.y + platform.corners[2][1]

                // convert pinned coords to SCREEN COORDS
                // mapToRange(number, inMin, inMax, outMin, outMax)
                const pinnedX_screenCoords = CanvasArea.mapToRange(pinnedX_mapCoords, MapEditor.screen.cornerX, MapEditor.screen.cornerX + MapEditor.screen.width, 0, CanvasArea.canvas.width)
                const pinnedY_screenCoords = CanvasArea.mapToRange(pinnedY_mapCoords, MapEditor.screen.cornerY, MapEditor.screen.cornerY + MapEditor.screen.height, 0, CanvasArea.canvas.height)


                // get vector dragFromPinned (unscaled by zoom) (origin is at pin) x value will be neg at 0deg, y val will be pos(down) at 0 deg 
                // dividing by zoom brings it back to real map scale 
                const dragFromPinned = new Vector2D3D((this.x + this.width - pinnedX_screenCoords) / MapEditor.zoom, (this.y - pinnedY_screenCoords) / MapEditor.zoom)

                // get rotatedDragFromPinned. (x will always be -, y will always be +)
                const rotatedDragFromPinned = dragFromPinned.rotate(-platform.angle)

                // set width and height using rotatedDragFromPinned
                platform.width = Math.round(-rotatedDragFromPinned.x)
                platform.height = Math.round(rotatedDragFromPinned.y)


                // snapping and restricting size
                if (MapEditor.snapAmount > 0) {
                    platform.width = Math.round(platform.width / MapEditor.snapAmount) * MapEditor.snapAmount
                    platform.height = Math.round(platform.height / MapEditor.snapAmount) * MapEditor.snapAmount
                }

                if (platform.width < 6) { platform.width = 6 }
                if (platform.height < 6) { platform.height = 6 }


                // get NEW BL dragged corner map coords
                const updatedDragCorner = [
                    -((platform.width / 2) * Math.cos(platform.angleRad)) - ((platform.height / 2) * Math.sin(platform.angleRad)),
                    -((platform.width / 2) * Math.sin(platform.angleRad)) + ((platform.height / 2) * Math.cos(platform.angleRad))
                ]

                const draggedX_mapCoords = pinnedX_mapCoords + (updatedDragCorner[0] * 2)
                const draggedY_mapCoords = pinnedY_mapCoords + (updatedDragCorner[1] * 2)

                // set platform x and y to inbetween pinnedCorner in MAP COORDS and dragged corner in MAP COORDS
                platform.x = (pinnedX_mapCoords + draggedX_mapCoords) / 2
                platform.y = (pinnedY_mapCoords + draggedY_mapCoords) / 2


                MapEditor.updatePlatformCorners(platform)
            }
        })

        btn_resize_BR = new Button(0, 0, 50, "scale_button", "", 0, "", function () {

            let platform = MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]]

            if (!this.isPressed) {
                // position button at corner/edge of element

                // BR corner (relative to platform center)
                const cornerX = platform.corners[1][0]
                const cornerY = platform.corners[1][1]

                // corner coords mapped to screen coords
                // mapToRange(number, inMin, inMax, outMin, outMax)
                const cornerMappedX = CanvasArea.mapToRange(platform.x + cornerX, MapEditor.screen.cornerX, MapEditor.screen.cornerX + MapEditor.screen.width, 0, CanvasArea.canvas.width)
                const cornerMappedY = CanvasArea.mapToRange(platform.y + cornerY, MapEditor.screen.cornerY, MapEditor.screen.cornerY + MapEditor.screen.height, 0, CanvasArea.canvas.height)

                this.x = cornerMappedX
                this.y = cornerMappedY


            } else if (TouchHandler.dragging) {

                // move button according to touch dragging
                this.x += TouchHandler.dragAmountX * CanvasArea.scale
                this.y += TouchHandler.dragAmountY * CanvasArea.scale

                // panning if at edges of screen
                if (this.x > CanvasArea.canvas.width - 340) { MapEditor.screen.x += 400 / MapEditor.zoom * dt }
                if (this.x < 60) { MapEditor.screen.x -= 400 / MapEditor.zoom * dt }
                if (this.y > CanvasArea.canvas.height - 130) { MapEditor.screen.y += 400 / MapEditor.zoom * dt }
                if (this.y < 30) { MapEditor.screen.y -= 400 / MapEditor.zoom * dt }


                // TL pinned corner MAP COORDS
                const pinnedX_mapCoords = platform.x + platform.corners[3][0]
                const pinnedY_mapCoords = platform.y + platform.corners[3][1]

                // convert pinned coords to SCREEN COORDS
                // mapToRange(number, inMin, inMax, outMin, outMax)
                const pinnedX_screenCoords = CanvasArea.mapToRange(pinnedX_mapCoords, MapEditor.screen.cornerX, MapEditor.screen.cornerX + MapEditor.screen.width, 0, CanvasArea.canvas.width)
                const pinnedY_screenCoords = CanvasArea.mapToRange(pinnedY_mapCoords, MapEditor.screen.cornerY, MapEditor.screen.cornerY + MapEditor.screen.height, 0, CanvasArea.canvas.height)


                // get vector dragFromPinned (unscaled by zoom) (origin is at pin) x value will be pos at 0deg, y val will be pos(down) at 0 deg 
                // dividing by zoom brings it back to real map scale 
                const dragFromPinned = new Vector2D3D((this.x - pinnedX_screenCoords) / MapEditor.zoom, (this.y - pinnedY_screenCoords) / MapEditor.zoom)

                // get rotatedDragFromPinned. (x will always be -, y will always be +)
                const rotatedDragFromPinned = dragFromPinned.rotate(-platform.angle)

                // set width and height using rotatedDragFromPinned
                platform.width = Math.round(rotatedDragFromPinned.x)
                platform.height = Math.round(rotatedDragFromPinned.y)


                // snapping and restricting size
                if (MapEditor.snapAmount > 0) {
                    platform.width = Math.round(platform.width / MapEditor.snapAmount) * MapEditor.snapAmount
                    platform.height = Math.round(platform.height / MapEditor.snapAmount) * MapEditor.snapAmount
                }

                if (platform.width < 6) { platform.width = 6 }
                if (platform.height < 6) { platform.height = 6 }


                // get NEW BR dragged corner map coords
                const updatedDragCorner = [
                    ((platform.width / 2) * Math.cos(platform.angleRad)) - ((platform.height / 2) * Math.sin(platform.angleRad)),
                    ((platform.width / 2) * Math.sin(platform.angleRad)) + ((platform.height / 2) * Math.cos(platform.angleRad))
                ]

                const draggedX_mapCoords = pinnedX_mapCoords + (updatedDragCorner[0] * 2)
                const draggedY_mapCoords = pinnedY_mapCoords + (updatedDragCorner[1] * 2)

                // set platform x and y to inbetween pinnedCorner in MAP COORDS and dragged corner in MAP COORDS
                platform.x = (pinnedX_mapCoords + draggedX_mapCoords) / 2
                platform.y = (pinnedY_mapCoords + draggedY_mapCoords) / 2


                MapEditor.updatePlatformCorners(platform)
            }
        })

        btn_resize_TR = new Button(0, 0, 50, "scale_button", "", 0, "", function () {

            let platform = MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]]

            if (!this.isPressed) {
                // position button at corner/edge of element

                // TR corner (relative to platform center)
                const cornerX = platform.corners[2][0]
                const cornerY = platform.corners[2][1]

                // corner coords mapped to screen coords
                // mapToRange(number, inMin, inMax, outMin, outMax)
                const cornerMappedX = CanvasArea.mapToRange(platform.x + cornerX, MapEditor.screen.cornerX, MapEditor.screen.cornerX + MapEditor.screen.width, 0, CanvasArea.canvas.width)
                const cornerMappedY = CanvasArea.mapToRange(platform.y + cornerY, MapEditor.screen.cornerY, MapEditor.screen.cornerY + MapEditor.screen.height, 0, CanvasArea.canvas.height)

                this.x = cornerMappedX
                this.y = cornerMappedY - this.height


            } else if (TouchHandler.dragging) {

                // move button according to touch dragging
                this.x += TouchHandler.dragAmountX * CanvasArea.scale
                this.y += TouchHandler.dragAmountY * CanvasArea.scale

                // panning if at edges of screen
                if (this.x > CanvasArea.canvas.width - 340) { MapEditor.screen.x += 400 / MapEditor.zoom * dt }
                if (this.x < 60) { MapEditor.screen.x -= 400 / MapEditor.zoom * dt }
                if (this.y > CanvasArea.canvas.height - 130) { MapEditor.screen.y += 400 / MapEditor.zoom * dt }
                if (this.y < 30) { MapEditor.screen.y -= 400 / MapEditor.zoom * dt }


                // BL pinned corner MAP COORDS
                const pinnedX_mapCoords = platform.x + platform.corners[0][0]
                const pinnedY_mapCoords = platform.y + platform.corners[0][1]

                // convert pinned coords to SCREEN COORDS
                // mapToRange(number, inMin, inMax, outMin, outMax)
                const pinnedX_screenCoords = CanvasArea.mapToRange(pinnedX_mapCoords, MapEditor.screen.cornerX, MapEditor.screen.cornerX + MapEditor.screen.width, 0, CanvasArea.canvas.width)
                const pinnedY_screenCoords = CanvasArea.mapToRange(pinnedY_mapCoords, MapEditor.screen.cornerY, MapEditor.screen.cornerY + MapEditor.screen.height, 0, CanvasArea.canvas.height)


                // get vector dragFromPinned (unscaled by zoom) (origin is at pin) x value will be pos at 0deg, y val will be neg(up) at 0 deg 
                // dividing by zoom brings it back to real map scale 
                const dragFromPinned = new Vector2D3D((this.x - pinnedX_screenCoords) / MapEditor.zoom, (this.y + this.height - pinnedY_screenCoords) / MapEditor.zoom)

                // get rotatedDragFromPinned. (x will always be -, y will always be +)
                const rotatedDragFromPinned = dragFromPinned.rotate(-platform.angle)

                // set width and height using rotatedDragFromPinned
                platform.width = Math.round(rotatedDragFromPinned.x)
                platform.height = Math.round(-rotatedDragFromPinned.y)


                // snapping and restricting size
                if (MapEditor.snapAmount > 0) {
                    platform.width = Math.round(platform.width / MapEditor.snapAmount) * MapEditor.snapAmount
                    platform.height = Math.round(platform.height / MapEditor.snapAmount) * MapEditor.snapAmount
                }

                if (platform.width < 6) { platform.width = 6 }
                if (platform.height < 6) { platform.height = 6 }


                // get NEW TR dragged corner map coords
                const updatedDragCorner = [
                    ((platform.width / 2) * Math.cos(platform.angleRad)) + ((platform.height / 2) * Math.sin(platform.angleRad)),
                    ((platform.width / 2) * Math.sin(platform.angleRad)) - ((platform.height / 2) * Math.cos(platform.angleRad))
                ]

                const draggedX_mapCoords = pinnedX_mapCoords + (updatedDragCorner[0] * 2)
                const draggedY_mapCoords = pinnedY_mapCoords + (updatedDragCorner[1] * 2)

                // set platform x and y to inbetween pinnedCorner in MAP COORDS and dragged corner in MAP COORDS
                platform.x = (pinnedX_mapCoords + draggedX_mapCoords) / 2
                platform.y = (pinnedY_mapCoords + draggedY_mapCoords) / 2


                MapEditor.updatePlatformCorners(platform)
            }
        })

        btn_resize_TL = new Button(0, 0, 50, "scale_button", "", 0, "", function () {

            let platform = MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]]

            if (!this.isPressed) {
                // position button at corner/edge of element

                // TL corner (relative to platform center)
                const cornerX = platform.corners[3][0]
                const cornerY = platform.corners[3][1]

                // corner coords mapped to screen coords
                // mapToRange(number, inMin, inMax, outMin, outMax)
                const cornerMappedX = CanvasArea.mapToRange(platform.x + cornerX, MapEditor.screen.cornerX, MapEditor.screen.cornerX + MapEditor.screen.width, 0, CanvasArea.canvas.width)
                const cornerMappedY = CanvasArea.mapToRange(platform.y + cornerY, MapEditor.screen.cornerY, MapEditor.screen.cornerY + MapEditor.screen.height, 0, CanvasArea.canvas.height)

                this.x = cornerMappedX - this.width
                this.y = cornerMappedY - this.height


            } else if (TouchHandler.dragging) {

                // move button according to touch dragging
                this.x += TouchHandler.dragAmountX * CanvasArea.scale
                this.y += TouchHandler.dragAmountY * CanvasArea.scale

                // panning if at edges of screen
                if (this.x > CanvasArea.canvas.width - 340) { MapEditor.screen.x += 400 / MapEditor.zoom * dt }
                if (this.x < 60) { MapEditor.screen.x -= 400 / MapEditor.zoom * dt }
                if (this.y > CanvasArea.canvas.height - 130) { MapEditor.screen.y += 400 / MapEditor.zoom * dt }
                if (this.y < 30) { MapEditor.screen.y -= 400 / MapEditor.zoom * dt }


                // BR pinned corner MAP COORDS
                const pinnedX_mapCoords = platform.x + platform.corners[1][0]
                const pinnedY_mapCoords = platform.y + platform.corners[1][1]

                // convert pinned coords to SCREEN COORDS
                // mapToRange(number, inMin, inMax, outMin, outMax)
                const pinnedX_screenCoords = CanvasArea.mapToRange(pinnedX_mapCoords, MapEditor.screen.cornerX, MapEditor.screen.cornerX + MapEditor.screen.width, 0, CanvasArea.canvas.width)
                const pinnedY_screenCoords = CanvasArea.mapToRange(pinnedY_mapCoords, MapEditor.screen.cornerY, MapEditor.screen.cornerY + MapEditor.screen.height, 0, CanvasArea.canvas.height)


                // get vector dragFromPinned (unscaled by zoom) (origin is at pin) x value will be neg at 0deg, y val will be neg(up) at 0 deg 
                // dividing by zoom brings it back to real map scale 
                const dragFromPinned = new Vector2D3D((this.x + this.width - pinnedX_screenCoords) / MapEditor.zoom, (this.y + this.height - pinnedY_screenCoords) / MapEditor.zoom)

                // get rotatedDragFromPinned. (x will always be +, y will always be +)
                const rotatedDragFromPinned = dragFromPinned.rotate(-platform.angle)

                // set width and height using rotatedDragFromPinned
                platform.width = Math.round(-rotatedDragFromPinned.x)
                platform.height = Math.round(-rotatedDragFromPinned.y)


                // snapping and restricting size
                if (MapEditor.snapAmount > 0) {
                    platform.width = Math.round(platform.width / MapEditor.snapAmount) * MapEditor.snapAmount
                    platform.height = Math.round(platform.height / MapEditor.snapAmount) * MapEditor.snapAmount
                }

                if (platform.width < 6) { platform.width = 6 }
                if (platform.height < 6) { platform.height = 6 }


                // get NEW TL dragged corner map coords
                const updatedDragCorner = [
                    -((platform.width / 2) * Math.cos(platform.angleRad)) + ((platform.height / 2) * Math.sin(platform.angleRad)),
                    -((platform.width / 2) * Math.sin(platform.angleRad)) - ((platform.height / 2) * Math.cos(platform.angleRad))
                ]

                const draggedX_mapCoords = pinnedX_mapCoords + (updatedDragCorner[0] * 2)
                const draggedY_mapCoords = pinnedY_mapCoords + (updatedDragCorner[1] * 2)

                // set platform x and y to inbetween pinnedCorner in MAP COORDS and dragged corner in MAP COORDS
                platform.x = (pinnedX_mapCoords + draggedX_mapCoords) / 2
                platform.y = (pinnedY_mapCoords + draggedY_mapCoords) / 2


                MapEditor.updatePlatformCorners(platform)
            }
        })

        btn_angleSlider = new SliderUI("CanvasArea.canvas.width - 250", "250", 170, -45, 45, 1, "Angle", MapEditor.loadedMap ? MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]] : 0, function () {
            if (MapEditor.snapAmount > 0) { this.updateState(Math.round(this.value / MapEditor.snapAmount) * MapEditor.snapAmount) }
            if (this.value < this.min) { this.updateState(this.min) } // these are incase snapping pushes the value over or under the limits
            if (this.value > this.max) { this.updateState(this.max) }
            MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].angle = this.value
            MapEditor.updatePlatformCorners(MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]])
        })

        btn_playerAngleSlider = new SliderUI("CanvasArea.canvas.width - 250", "250", 170, 0, 360, 1, "Angle", MapEditor.loadedMap ? MapEditor.loadedMap.playerStart : 0, function () {
            if (MapEditor.snapAmount > 0) { this.updateState(Math.round(this.value / MapEditor.snapAmount) * MapEditor.snapAmount) }
            MapEditor.loadedMap.playerStart.angle = this.value
        })

        btn_checkpointAngleSlider = new SliderUI("CanvasArea.canvas.width - 250", "280", 170, 0, 360, 1, "Angle", MapEditor.loadedMap ? MapEditor.loadedMap.checkpoints[MapEditor.selectedElements[0][0]] : 0, function () {
            if (MapEditor.snapAmount > 0) { this.updateState(Math.round(this.value / MapEditor.snapAmount) * MapEditor.snapAmount) }
            MapEditor.loadedMap.checkpoints[MapEditor.selectedElements[0][0]].angle = this.value
        })

        btn_wall = new Button("CanvasArea.canvas.width - 170", "280", 60, "toggle_button", "toggle_button_pressed", 1, "", function (sync) {
            if (MapEditor.loadedMap) { // throws an error otherwise
                if (sync) {
                    this.toggle = MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].wall ? 1 : 0; // gets initial value of toggle
                } else {
                    if (this.toggle) {
                        this.toggle = 0;
                        MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].wall = 0
                    } else {
                        this.toggle = 1;
                        MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].wall = 1
                    }
                }
            }
        })

        btn_delete_platform = new Button("CanvasArea.canvas.width - 175", "CanvasArea.canvas.height - 100", 120, "delete_button", "", 0, "", function () {

            MapEditor.selectedElements.forEach((element) => { // loop through and delete
                if (Array.isArray(element)) { // delete checkpoint

                    MapEditor.loadedMap.checkpoints[element[0]] = "remove"

                } else if (element != "playerStart") { // delete platform but DONT delete playerStart

                    MapEditor.loadedMap.platforms[element] = "remove" // set a placeholder which will be removed by .filter
                }
            })

            MapEditor.loadedMap.checkpoints = MapEditor.loadedMap.checkpoints.filter((checkpoint) => checkpoint != "remove");
            MapEditor.loadedMap.platforms = MapEditor.loadedMap.platforms.filter((platform) => platform != "remove");

            MapEditor.selectedElements = []; // No selected elements after delete
            UserInterface.renderedButtons = UserInterface.btnGroup_mapEditorInterface

        })

        btn_duplicate_platform = new Button("CanvasArea.canvas.width - 250", "CanvasArea.canvas.height - 185", 200, "", "", 0, "Duplicate", function () {
            let originPlatform = {
                x: null,
                y: null
            }

            MapEditor.selectedElements.forEach((element) => {

                if (element != "playerStart" && !Array.isArray(element)) { // only run for platforms

                    const newPlatform = { ...MapEditor.loadedMap.platforms[element] } // get selected platform. spread syntax creates a shallow copy that doesn not link/reference 

                    if (originPlatform.x == null) { // set origin platform
                        originPlatform.x = MapEditor.loadedMap.platforms[element].x
                        originPlatform.y = MapEditor.loadedMap.platforms[element].y
                    }

                    const offsetFromOriginPlatformX = MapEditor.loadedMap.platforms[element].x - originPlatform.x
                    const offsetFromOriginPlatformY = MapEditor.loadedMap.platforms[element].y - originPlatform.y

                    newPlatform.x = Math.round(MapEditor.screen.x) + offsetFromOriginPlatformX, // center it
                        newPlatform.y = Math.round(MapEditor.screen.y) + offsetFromOriginPlatformY,

                        MapEditor.loadedMap.platforms.push(newPlatform); // add it

                    // deal with selections
                    if (MapEditor.multiSelect) {
                        MapEditor.selectedElements[MapEditor.selectedElements.indexOf(element)] = MapEditor.loadedMap.platforms.length - 1
                    } else {
                        MapEditor.selectedElements = [MapEditor.loadedMap.platforms.length - 1]
                    }
                }
            })

            if (MapEditor.selectedElements.length == 1) { // only sync in single select
                // SYNC ALL BUTTONS AND SLIDERS
                btn_angleSlider.updateState(MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].angle)
                btn_wall.func(true) // syncs the wall button's toggle state
            }
        })




        // MAP SETTINGS SLIDERS
        btn_platformHeightSlider = new SliderUI("CanvasArea.canvas.width - 650", "100", 460, 0, 200, 1, "Platform Height", MapEditor.loadedMap ? MapEditor.loadedMap.style.platformHeight : 0, function () {
            MapEditor.loadedMap.style.platformHeight = this.value
            PreviewWindow.update()
        })

        btn_wallHeightSlider = new SliderUI("CanvasArea.canvas.width - 650", "200", 460, 0, 200, 1, "Wall Height", MapEditor.loadedMap ? MapEditor.loadedMap.style.wallHeight : 0, function () {
            MapEditor.loadedMap.style.wallHeight = this.value
            PreviewWindow.update()
        })

        btn_lightDirectionSlider = new SliderUI("CanvasArea.canvas.width - 650", "300", 460, 0, 360, 1, "Light Direction", MapEditor.loadedMap ? MapEditor.loadedMap.style.lightDirection : 0, function () {
            MapEditor.loadedMap.style.lightDirection = this.value
            PreviewWindow.update()
        })

        btn_lightPitchSlider = new SliderUI("CanvasArea.canvas.width - 660", "400", 460, 5, 90, 1, "Light Angle", MapEditor.loadedMap ? MapEditor.loadedMap.style.lightPitch : 0, function () {
            MapEditor.loadedMap.style.lightPitch = this.value
            PreviewWindow.update()
        })



        // COLOR PICKER BUTTONS AND SLIDERS
        btn_copyColor = new Button("ColorPicker.x + ColorPicker.width/2 - 125", "ColorPicker.y + ColorPicker.height + 20", 116, "", "", 0, "Copy", function () {
            ColorPicker.copyColor()
        })

        btn_pasteColor = new Button("ColorPicker.x + ColorPicker.width/2 + 17", "ColorPicker.y + ColorPicker.height + 20", 116, "", "", 0, "Paste", function () {
            ColorPicker.pasteColor()
        })

        btn_hueSlider = new SliderUI("ColorPicker.x + 20", "ColorPicker.y + 160", ColorPicker.width - 40, 0, 360, 1, "Hue", ColorPicker.h, function () {
            ColorPicker.h = this.value
            ColorPicker.updateElementColor()
            ColorPicker.syncGradients()
            if (ColorPicker.editingElement == 1 || ColorPicker.editingElement == 9 || ColorPicker.editingElement == 10) { UserInterface.determineButtonColor() }
        })

        btn_saturationSlider = new SliderUI("ColorPicker.x + 20", "ColorPicker.y + 240", ColorPicker.width - 40, 0, 100, 1, "Saturation", ColorPicker.s, function () {
            ColorPicker.s = this.value
            ColorPicker.updateElementColor()
            ColorPicker.syncGradients()
            if (ColorPicker.editingElement == 1 || ColorPicker.editingElement == 9 || ColorPicker.editingElement == 10) { UserInterface.determineButtonColor() }
        })

        btn_lightnessSlider = new SliderUI("ColorPicker.x + 20", "ColorPicker.y + 320", ColorPicker.width - 40, 0, 100, 1, "Lightness", ColorPicker.l, function () {
            ColorPicker.l = this.value
            ColorPicker.updateElementColor()
            ColorPicker.syncGradients()
            if (ColorPicker.editingElement == 1 || ColorPicker.editingElement == 9 || ColorPicker.editingElement == 10) { UserInterface.determineButtonColor() }
        })


        // SET COLOR BUTTONS
        // 0 nothing
        // 1 bg
        // 2 player
        // 3 platform top
        // 4 platform side
        // 5 wall top
        // 6 wall side
        // 7 end top
        // 8 end side
        // 9 direct light
        // 10 ambient light

        btn_backgroundColor = new Button("CanvasArea.canvas.width - 410", "20", 175, "", "", 0, "Background", function () {
            if (this.toggle) {
                this.toggle = 0;
                ColorPicker.editingElement = 0
            } else {
                // untoggle all others
                ColorPicker.toggleAllButtons()
                this.toggle = 1;
                ColorPicker.editingElement = 1
                ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.backgroundColor)
                ColorPicker.updateSliders()
                ColorPicker.syncGradients()
            }
        })

        btn_playerColor = new Button("CanvasArea.canvas.width - 225", "20", 175, "", "", 0, "Player", function () {
            if (this.toggle) {
                this.toggle = 0;
                ColorPicker.editingElement = 0
            } else {
                // untoggle all others
                ColorPicker.toggleAllButtons()
                this.toggle = 1;
                ColorPicker.editingElement = 2
                ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.playerColor)
                ColorPicker.updateSliders()
                ColorPicker.syncGradients()
            }
        })

        btn_platformTopColor = new Button("CanvasArea.canvas.width - 410", "120", 175, "", "", 0, "Platform Top", function () {
            if (this.toggle) {
                this.toggle = 0;
                ColorPicker.editingElement = 0
            } else {
                // untoggle all others
                ColorPicker.toggleAllButtons()
                this.toggle = 1;
                ColorPicker.editingElement = 3
                ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.platformTopColor)
                ColorPicker.updateSliders()
                ColorPicker.syncGradients()
            }
        })

        btn_platformSideColor = new Button("CanvasArea.canvas.width - 225", "120", 175, "", "", 0, "Platform Side", function () {
            if (this.toggle) {
                this.toggle = 0;
                ColorPicker.editingElement = 0
            } else {
                // untoggle all others
                ColorPicker.toggleAllButtons()
                this.toggle = 1;
                ColorPicker.editingElement = 4
                ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.platformSideColor)
                ColorPicker.updateSliders()
                ColorPicker.syncGradients()
            }
        })

        btn_wallTopColor = new Button("CanvasArea.canvas.width - 410", "220", 175, "", "", 0, "Wall Top", function () {
            if (this.toggle) {
                this.toggle = 0;
                ColorPicker.editingElement = 0
            } else {
                // untoggle all others
                ColorPicker.toggleAllButtons()
                this.toggle = 1;
                ColorPicker.editingElement = 5
                ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.wallTopColor)
                ColorPicker.updateSliders()
                ColorPicker.syncGradients()
            }
        })

        btn_wallSideColor = new Button("CanvasArea.canvas.width - 225", "220", 175, "", "", 0, "Wall Side", function () {
            if (this.toggle) {
                this.toggle = 0;
                ColorPicker.editingElement = 0
            } else {
                // untoggle all others
                ColorPicker.toggleAllButtons()
                this.toggle = 1;
                ColorPicker.editingElement = 6
                ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.wallSideColor)
                ColorPicker.updateSliders()
                ColorPicker.syncGradients()
            }
        })

        btn_endZoneTopColor = new Button("CanvasArea.canvas.width - 410", "320", 175, "", "", 0, "End Zone Top", function () {
            if (this.toggle) {
                this.toggle = 0;
                ColorPicker.editingElement = 0
            } else {
                // untoggle all others
                ColorPicker.toggleAllButtons()
                this.toggle = 1;
                ColorPicker.editingElement = 7
                ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.endZoneTopColor)
                ColorPicker.updateSliders()
                ColorPicker.syncGradients()
            }
        })

        btn_endZoneSideColor = new Button("CanvasArea.canvas.width - 225", "320", 175, "", "", 0, "End Zone Side", function () {
            if (this.toggle) {
                this.toggle = 0;
                ColorPicker.editingElement = 0
            } else {
                // untoggle all others
                ColorPicker.toggleAllButtons()
                this.toggle = 1;
                ColorPicker.editingElement = 8
                ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.endZoneSideColor)
                ColorPicker.updateSliders()
                ColorPicker.syncGradients()
            }
        })

        btn_directLightColor = new Button("CanvasArea.canvas.width - 410", "420", 175, "", "", 0, "Direct Light", function () {
            if (this.toggle) {
                this.toggle = 0;
                ColorPicker.editingElement = 0
            } else {
                // untoggle all others
                ColorPicker.toggleAllButtons()
                this.toggle = 1;
                ColorPicker.editingElement = 9
                ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.directLight)
                ColorPicker.updateSliders()
                ColorPicker.syncGradients()
            }
        })

        btn_ambientLightColor = new Button("CanvasArea.canvas.width - 225", "420", 175, "", "", 0, "Ambient Light", function () {
            if (this.toggle) {
                this.toggle = 0;
                ColorPicker.editingElement = 0
            } else {
                // untoggle all others
                ColorPicker.toggleAllButtons()
                this.toggle = 1;
                ColorPicker.editingElement = 10
                ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.ambientLight)
                ColorPicker.updateSliders()
                ColorPicker.syncGradients()
            }
        })




        // MAP BROWSER BUTTONS
        btn_custom_maps = new Button(50, "CanvasArea.canvas.height - 150", 175, "custom_maps_button", "", 0, "", function () {
            UserInterface.gamestate = 2;

            // loop through each button (including non-maps eww) and untoggle it. Could be an issue once I add a "play tutorial" toggle / button idk
            UserInterface.renderedButtons.forEach(button => {
                if (button.toggle == 1 && button != btn_playTutorial) { button.toggle = 0 }
            })

            UserInterface.renderedButtons = UserInterface.btnGroup_customMapBrowser
            MapBrowser.state = 2
            MapBrowser.init()
        })

        btn_playMap = new Button("CanvasArea.canvas.width - 300", "CanvasArea.canvas.height - 150", 200, "play_button", "", 0, "", function () {

            MapBrowser.toggleAllButtons()
            MapBrowser.scrollY = 0;
            MapBrowser.scrollVel = 0;

            UserInterface.gamestate = 5;
            UserInterface.renderedButtons = [btn_mainMenu];

            if (MapBrowser.state == 1) { // in normal maps browser

                Map.initMap(MapBrowser.selectedMapIndex);

            } else { // in custom maps browser

                Map.initCustomMap(MapBrowser.selectedMapIndex);

            }
        })

        btn_editMap = new Button("CanvasArea.canvas.width - 300", "CanvasArea.canvas.height - 110", 200, "", "", 0, "Edit Map", async function () {

            // delete shareDiv when leaving browser page
            document.getElementById("shareDiv").remove()

            MapBrowser.toggleAllButtons()
            MapBrowser.scrollVel = 0;
            MapBrowser.scrollY = 0;

            const mapDataRaw = await UserInterface.readFile(MapBrowser.selectedMapIndex + ".json", "maps")

            MapEditor.loadedMap = JSON.parse(mapDataRaw)
            UserInterface.gamestate = 7;

        })

        btn_deleteMap = new Button("CanvasArea.canvas.width - 300", "CanvasArea.canvas.height - 200", 200, "", "", 0, "Delete Map", function () {

            const deleteMap = confirm("Delete Map?");
            if (deleteMap) {

                window.resolveLocalFileSystemURL(cordova.file.dataDirectory + "maps", (fileSystem) => {
                    var reader = fileSystem.createReader();
                    reader.readEntries((entries) => {
                        fileSystem.getFile(MapBrowser.selectedMapIndex + ".json", { create: false }, (fileEntry) => {
                            fileEntry.remove((file) => {
                                alert("Map Deleted");
                                // delete shareDiv (its created again by btn_load_map)
                                document.getElementById("shareDiv").remove()

                                // reload browser by pressing btn_load_map again
                                btn_load_map.released(true)
                            }, function (error) {
                                alert("error occurred: " + error.code);
                            }, function () {
                                alert("file does not exist");
                            });
                        });
                    });
                });
            }
        })

        btn_shareMap = new Button("CanvasArea.canvas.width - 300", "CanvasArea.canvas.height - 290", 200, "", "", 0, "Share Map", function (createDiv) {
            // The shareDiv does all the work for this button.
            // createDiv is called by btn_load_map
            // shareDiv is removed by btn_mainMenu, btn_editMap and btn_deleteMap


            if (createDiv) { // called with this tag by btn_load_map
                const shareDiv = document.createElement('div');
                shareDiv.setAttribute("id", "shareDiv");
                shareDiv.style.cssText = `
                    position: absolute; 
                    left: ${btn_shareMap.x / CanvasArea.scale}px;
                    top: ${btn_shareMap.y / CanvasArea.scale}px;
                    width: ${btn_shareMap.width / CanvasArea.scale}px;
                    height: ${btn_shareMap.height / CanvasArea.scale}px;
                    // border: solid 2px blue;
                `

                shareDiv.addEventListener("click", async () => {

                    const mapDataRaw = await UserInterface.readFile(MapBrowser.selectedMapIndex + ".json", "maps")

                    const share_data = {
                        title: MapBrowser.selectedMapIndex, // doesnt do anything on IOS
                        text: mapDataRaw,
                    }

                    try {
                        await navigator.share(share_data);
                    } catch (err) {
                        console.log(err)
                    }

                });

                document.body.appendChild(shareDiv);

            }

        })



        // ALL LEVEL BUTTONS
        btn_level_awakening = new Button(300, 50, 280, "", "", 0, "Awakening", function () {
            if (this.toggle) {
                this.toggle = 0;
                MapBrowser.selectedMapIndex = -1
            } else {
                MapBrowser.toggleAllButtons()
                this.toggle = 1;
                MapBrowser.selectedMapIndex = "Awakening"
                if (UserInterface.settings.playTutorial) { Tutorial.isActive = true }
            }
        })

        btn_level_pitfall = new Button(300, 150, 280, "", "", 0, "Pitfall", function () {
            if (this.toggle) {
                this.toggle = 0;
                MapBrowser.selectedMapIndex = -1
            } else {
                MapBrowser.toggleAllButtons()
                this.toggle = 1;
                MapBrowser.selectedMapIndex = "Pitfall"
            }
        })

        btn_level_cavernAbyss = new Button(300, 250, 280, "", "", 0, "Cavern Abyss", function () {
            if (this.toggle) {
                this.toggle = 0;
                MapBrowser.selectedMapIndex = -1
            } else {
                MapBrowser.toggleAllButtons()
                this.toggle = 1;
                MapBrowser.selectedMapIndex = "Cavern Abyss"
            }
        })

        btn_level_crystals = new Button(300, 350, 280, "", "", 0, "Crystals", function () {
            if (this.toggle) {
                this.toggle = 0;
                MapBrowser.selectedMapIndex = -1
            } else {
                MapBrowser.toggleAllButtons()
                this.toggle = 1;
                MapBrowser.selectedMapIndex = "Crystals"
            }
        })

        btn_level_trespass = new Button(300, 450, 280, "", "", 0, "Trespass", function () {
            if (this.toggle) {
                this.toggle = 0;
                MapBrowser.selectedMapIndex = -1
            } else {
                MapBrowser.toggleAllButtons()
                this.toggle = 1;
                MapBrowser.selectedMapIndex = "Trespass"
            }
        })

        btn_level_turmoil = new Button(300, 550, 280, "", "", 0, "Turmoil", function () {
            if (this.toggle) {
                this.toggle = 0;
                MapBrowser.selectedMapIndex = -1
            } else {
                MapBrowser.toggleAllButtons()
                this.toggle = 1;
                MapBrowser.selectedMapIndex = "Turmoil"
            }
        })

        btn_level_tangledForest = new Button(300, 650, 280, "", "", 0, "Tangled Forest", function () {
            if (this.toggle) {
                this.toggle = 0;
                MapBrowser.selectedMapIndex = -1
            } else {
                MapBrowser.toggleAllButtons()
                this.toggle = 1;
                MapBrowser.selectedMapIndex = "Tangled Forest"
            }
        })


        btn_level_forever = new Button(300, 750, 280, "", "", 0, "Forever", function () {
            if (this.toggle) {
                this.toggle = 0;
                MapBrowser.selectedMapIndex = -1
            } else {
                MapBrowser.toggleAllButtons()
                this.toggle = 1;
                MapBrowser.selectedMapIndex = "Forever"
            }
        })


        // IN LEVEL Buttons
        btn_mainMenu = new Button(50, 50, 100, "x_button", "", 0, "", function () {

            // UserInterface.gamestate
            // 1: main menu
            // 2: level select (MapBrowser)
            // 3: settings
            // 4: store
            // 5: loading map page
            // 6: in level
            // 7: in map editor

            // UserInterface.levelState
            // 1 = pre-start
            // 2 = playing level
            // 3 = in endzone

            // MapEditor.editorState
            // 0 = map new/import/load screen. mapeditor's main menu
            // 1 = main map edit screen
            // 2 = platform edit menu
            // 3 = map color page
            // 4 = map settings page
            // 5 = MapEditor MapBrowser screen

            // MapBrowser.state
            // 0 = disabled
            // 1 = standard map browser
            // 2 = custom map browser

            if (UserInterface.gamestate == 2) { // in MapBrowser
                if (MapEditor.editorState == 5) { // in MapEditor's MapBrowser

                    // goto MapEditor's main menu
                    MapBrowser.state = 0;
                    MapBrowser.scrollY = 0;
                    MapBrowser.selectedMapIndex = -1;

                    UserInterface.gamestate = 7;
                    MapEditor.editorState = 0;
                    UserInterface.renderedButtons = UserInterface.btnGroup_mapEditorMenu

                    document.getElementById("shareDiv").remove()

                    return
                }

                if (MapBrowser.state == 1) { // in play standard map browser
                    // goto main menu
                    MapBrowser.state = 0;
                    MapBrowser.scrollY = 0;
                    MapBrowser.selectedMapIndex = -1;
                    UserInterface.gamestate = 1
                    // loop through each button (including non-maps eww) and untoggle it
                    UserInterface.renderedButtons.forEach(button => {
                        if (button.toggle == 1 && button != btn_playTutorial) { button.toggle = 0 }
                    })
                    UserInterface.renderedButtons = UserInterface.btnGroup_mainMenu;
                    return
                }

                if (MapBrowser.state == 2) { // in play custom map browser
                    // goto play standard map browser
                    MapBrowser.state = 1;
                    UserInterface.renderedButtons = UserInterface.btnGroup_standardMapBrowser
                    MapBrowser.init();
                    return
                }
            }

            if (UserInterface.gamestate == 3) { // in Settings page
                // goto main menu
                UserInterface.gamestate = 1
                UserInterface.renderedButtons = UserInterface.btnGroup_mainMenu;
                return
            }

            if (UserInterface.gamestate == 5) { // in Loading Map page
                // goto standard map browser
                UserInterface.gamestate = 2;
                MapBrowser.state = 1;
                UserInterface.renderedButtons = UserInterface.btnGroup_standardMapBrowser;
                MapBrowser.init();
                return
            }

            if (UserInterface.gamestate == 6) { // in Map
                // goto standard map browser
                UserInterface.timer = 0;
                UserInterface.levelState = 1;

                UserInterface.gamestate = 2;
                MapBrowser.state = 1;
                UserInterface.renderedButtons = UserInterface.btnGroup_standardMapBrowser;
                MapBrowser.init();


                if (Tutorial.isActive) { // leaving tutorial level
                    if (Tutorial.state >= 18) {
                        btn_playTutorial.released(true) // toggle tutorial button to be false after completing it
                    }

                    Tutorial.reset()
                }

                return
            }

            if (UserInterface.gamestate == 7) { // in MapEditor

                if (MapEditor.editorState == 0) { // MapEditor main menu
                    // goto main menu
                    UserInterface.gamestate = 1;
                    UserInterface.renderedButtons = UserInterface.btnGroup_mainMenu;
                    return
                }

                if (MapEditor.editorState == 3 || MapEditor.editorState == 4) { // in map settings or map color pages 
                    // goto MapEditor main edit screen
                    UserInterface.renderedButtons = UserInterface.btnGroup_mapEditorInterface
                    MapEditor.editorState = 1;
                    return
                }
            }


        })

        btn_restart = new Button(50, "CanvasArea.canvas.height - 280", 100, "restart_button", "", 0, "", function () {

            if (Tutorial.isActive) { // restart pressed in tutorial level
                // DRAW ALERT "Restart Disabled"
            } else {
                UserInterface.timer = 0;
                UserInterface.levelState = 1;
                Player.checkpointIndex = -1;
                Player.restart();
            }
        })

        btn_jump = new Button(50, "CanvasArea.canvas.height - 150", 100, "jump_button", "", 0, "", function () {
            if (UserInterface.levelState == 1) {
                UserInterface.timerStart = Date.now();
                UserInterface.levelState = 2;
                Player.startLevel();
            }
        })


        // TUTORIAL BUTTONS
        btn_next = new Button("CanvasArea.canvas.width - 130", 50, 80, "next_button", "", 0, "", function () {

            Tutorial.timerStarted = false; // easier to always set these here even if they arent always needed
            Tutorial.animatePos = 0;
            Tutorial.animateVel = 0;

            // reset the position and scale because the button is being pulse animated
            this.x = "CanvasArea.canvas.width - 130"
            this.y = 50
            this.width = 80
            this.height = 80

            if (Tutorial.state == 1) {
                Tutorial.state++;
                UserInterface.renderedButtons = [btn_mainMenu, btn_next]
                return
            }

            if (Tutorial.state == 2) {
                Tutorial.state++; // going into STATE 3
                UserInterface.renderedButtons = [btn_mainMenu]

                Player.lookAngle.set(0, -1) // so that ur NOT already looking at a target
                return
            }

            // state 3 progresses to 5 when all targets are completed

            // state 5 uses jump button to progress

            // state 6 progresses to 7 automatically after 2 secs

            if (Tutorial.state == 7) {
                Tutorial.state++; // going into STATE 8
                UserInterface.renderedButtons = UserInterface.btnGroup_inLevel
                return
            }

            // 8 to 9 on user swipe

            // 9 to 10 on checkpoint

            // 10 to 11 on user swipe

            // 11 to 12 on checkpoint

            // 12 to 13 on user swipe

            // 13 to 14 on checkpoint

            // 14 to 15 on user swipe

            // 15 to 16 on checkpoint

            // 16 to 17 on user swipe

            // 17 to 18 on level end

            if (Tutorial.state == 18) {
                Tutorial.state++; // going into STATE 19
                UserInterface.renderedButtons = UserInterface.btnGroup_inLevel
                return
            }

        })

        btn_playTutorial = new Button("CanvasArea.canvas.width - 450", "CanvasArea.canvas.height - 120", 80, "toggle_button", "toggle_button_pressed", 1, "", function (sync) {
            if (sync) {
                this.toggle = UserInterface.settings.playTutorial;
            } else {
                console.log("PLAY TUT TOGGLED")
                if (this.toggle == 1) {
                    this.toggle = 0;
                    Tutorial.isActive = false
                    UserInterface.settings.playTutorial = 0
                    UserInterface.writeSettings()
                } else {
                    this.toggle = 1;
                    Tutorial.isActive = true
                    UserInterface.settings.playTutorial = 1
                    UserInterface.writeSettings()
                }
            }
        })

        // GROUPS OF BUTTONS TO RENDER ON DIFFERENT PAGES
        this.btnGroup_mainMenu = [btn_play, btn_settings, btn_mapEditor]
        this.btnGroup_settings = [btn_mainMenu, btn_sensitivitySlider, btn_volumeSlider, btn_debugText, btn_strafeHUD, btn_reset_settings]
        this.btnGroup_standardMapBrowser = [
            btn_mainMenu,
            btn_custom_maps,
            btn_level_awakening,
            btn_level_pitfall,
            btn_level_cavernAbyss,
            btn_level_crystals,
            btn_level_trespass,
            btn_level_turmoil,
            btn_level_tangledForest,
            btn_level_forever,
        ]
        this.btnGroup_customMapBrowser = [btn_mainMenu]
        this.btnGroup_editMapBrowser = [btn_mainMenu]
        this.btnGroup_mapEditorMenu = [btn_mainMenu, btn_new_map, btn_load_map, btn_import_map, btn_import_map_text]
        this.btnGroup_mapEditorInterface = [btn_exit_edit, btn_add_platform, btn_map_colors, btn_map_settings, btn_add_checkpoint, btn_dragSelect, btn_multiSelect, btn_snappingSlider]
        this.btnGroup_inLevel = [btn_mainMenu, btn_restart, btn_jump];
        this.btnGroup_mapColor = [
            btn_mainMenu,
            btn_copyColor,
            btn_pasteColor,
            btn_hueSlider,
            btn_saturationSlider,
            btn_lightnessSlider,

            btn_backgroundColor,
            btn_playerColor,
            btn_platformTopColor,
            btn_platformSideColor,
            btn_wallTopColor,
            btn_wallSideColor,
            btn_endZoneTopColor,
            btn_endZoneSideColor,
            btn_directLightColor,
            btn_ambientLightColor,
        ];
        this.btnGroup_mapSettings = [
            btn_mainMenu,
            btn_platformHeightSlider,
            btn_wallHeightSlider,
            btn_lightDirectionSlider,
            btn_lightPitchSlider
        ];
        this.btnGroup_editPlatform = [
            btn_exit_edit,
            btn_unselect,

            btn_translate,
            btn_resize_BL,
            btn_resize_BR,
            btn_resize_TR,
            btn_resize_TL,
            btn_angleSlider,
            btn_wall,

            btn_delete_platform,
            btn_duplicate_platform,
            btn_dragSelect,
            btn_multiSelect,
            btn_snappingSlider
        ]
        this.btnGroup_editPlayerStart = [
            btn_exit_edit,
            btn_unselect,

            btn_translate,
            btn_playerAngleSlider,
            btn_dragSelect,
            btn_multiSelect,
            btn_snappingSlider
        ]
        this.btnGroup_editCheckPoint = [
            btn_exit_edit,
            btn_unselect,

            btn_translate,
            btn_checkpointAngleSlider,

            btn_delete_platform,
            btn_dragSelect,
            btn_multiSelect,
            btn_snappingSlider
        ]
        this.btnGroup_editMultiSelect = [
            btn_exit_edit,
            btn_unselect,

            btn_delete_platform,
            btn_duplicate_platform,
            btn_translate,
            btn_dragSelect,
            btn_multiSelect,
            btn_snappingSlider
        ]


        this.renderedButtons = this.btnGroup_mainMenu;
    },

    update: function () {

        if (this.gamestate == 3 || MapEditor.loadedMap) { // in settings page or in map editor pages
            this.renderedButtons.forEach(button => { // LOOP RENDERED BUTTONS
                if (button.constructor.name == "SliderUI") { // run .update() for only Sliders
                    button.update();
                }
            });
        }

        if (this.levelState == 2) {
            if (Tutorial.pausePlayer == true) {

                // Date.now() - this.timerStart) - this.timer = time to add to this.timerStart
                // Date.now() - this.timer = this.timerStart

                this.timerStart += Date.now() - this.timer - this.timerStart

            } else {
                this.timer = Date.now() - this.timerStart;
            }
        }
    },

    mapLoaded: function () { // called at the end of Map.parseMapData()
        UserInterface.gamestate = 6;
        UserInterface.renderedButtons = this.btnGroup_inLevel;
    },

    readFile: function (fileName, subDirectory = "") { // returns a promise that resolves to raw, unparsed (json usually)
        return new Promise((resolve, reject) => {
            // Resolve dataDirectory URL
            window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dataDirectoryEntry) {
                if (subDirectory !== "") {
                    // Access given subDirectory in dataDirectory
                    dataDirectoryEntry.getDirectory(subDirectory, { create: false }, function (subDirectoryEntry) {
                        readFileAsText(subDirectoryEntry);
                    }, function (error) {
                        reject("Failed to get subDirectory: " + error.code);
                    });
                } else {
                    // Read from main dataDirectory
                    readFileAsText(dataDirectoryEntry);
                }
            }, function (error) {
                reject("Failed to resolve dataDirectory: " + error.code);
            });

            // Function to read file as text
            function readFileAsText(directoryEntry) {
                directoryEntry.getFile(fileName, { create: false }, function (fileEntry) {
                    fileEntry.file(function (file) {
                        const reader = new FileReader();
                        reader.onloadend = function () {
                            console.log("Successfully read file: " + fileName);
                            resolve(this.result);
                        };
                        reader.onerror = function () {
                            reject("Failed to read file: " + fileName);
                        };
                        reader.readAsText(file);
                    }, function (error) {
                        reject("Failed to get fileEntry.file: " + error.code);
                    });
                }, function (error) {


                    // Its not able to find the custom maps in the /maps directory for some reason



                    console.log(directoryEntry)
                    console.log("fileName " + fileName)
                    reject("Failed to getFile: " + error.code);
                });
            }
        });
    },

    writeFile: function (fileName, blobData, subDirectory = "") { // returns a promise
        // fileName is a string with file extension EX: settings.json
        // blobData = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
        // subDirectory is a string. no need for first \ EX: maps\bad_maps OR just customMaps

        return new Promise((resolve, reject) => {

            // DEAL WITH OPTIONAL subDirectory
            window.resolveLocalFileSystemURL(cordova.file.dataDirectory, (dataDirectoryEntry) => {
                if (subDirectory !== "") {
                    // Create or access given subDirectory in dataDirectory
                    dataDirectoryEntry.getDirectory(subDirectory, { create: true }, subDirectoryEntry => {
                        saveFile(subDirectoryEntry);
                    }, (error) => { reject("Failed to resolve subDirectory on writeFile. ERROR CODE: " + error.code) }
                    );
                } else {
                    // save to straight to main dataDirectory
                    saveFile(dataDirectoryEntry)
                }
            }, (error) => { reject("Failed to resolve dataDirectory on writeFile. ERROR CODE: " + error.code) }
            );

            // ACTUALLY WRITE blobData TO FILE
            function saveFile(directoryEntry) {
                // Create or acces the file
                directoryEntry.getFile(fileName, { create: true, exclusive: false }, (fileEntry) => {
                    // Write to file
                    fileEntry.createWriter((fileWriter) => {
                        fileWriter.onwriteend = function () {
                            console.log("successfully wrote file: " + fileName)
                            resolve()
                        };

                        fileWriter.onerror = (error) => {
                            reject("Failed to write file: " + fileName + "Error Code: " + error.code);
                        };

                        fileWriter.write(blobData);
                    }, (error) => { reject("Failed to createWriter: " + error.code) }
                    )
                }, (error) => { reject("Failed to getFile: " + error.code) })
            }
        });
    },

    getLeaderboards: function () {

        // GET leaderboards DIRECTLY THROUGH CORDOVA LOCAL STORAGE (www)       
        const assetsURL = cordova.file.applicationDirectory + "www/assets/"

        window.resolveLocalFileSystemURL(assetsURL, (dirEntry) => {

            dirEntry.getFile("leaderboards.json", { create: false, exclusive: false }, (fileEntry) => {

                fileEntry.file((file) => {

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        console.log("successfully read leaderboards.json")
                        this.leaderboards = JSON.parse(e.target.result)
                    };
                    reader.onerror = (e) => alert(e.target.error.name);

                    reader.readAsText(file)
                })
            })
        })
    },

    getSettings: async function () {
        try {
            const settingsData = await this.readFile("settings.json");
            this.settings = JSON.parse(settingsData);

            // readFile completes after initiating buttons so need to sync them
            btn_sensitivitySlider.updateState(UserInterface.settings.sensitivity)
            btn_volumeSlider.updateState(UserInterface.settings.volume)
            btn_debugText.func(true)
            btn_strafeHUD.func(true)
            btn_playTutorial.func(true)

            AudioHandler.setVolumes();

        } catch (error) {
            if (error == "Failed to getFile: 1") { // file doesnt exist

                // If settings file doesn't exist or is empty, initialize default settings
                this.settings = {
                    "sensitivity": 0.5,
                    "volume": 0.1,
                    "debugText": 0,
                    "strafeHUD": 1,
                    "playTutorial": 1
                };

                this.writeSettings(); // Write the default settings to file

                // readFile completes after initiating buttons so need to sync them
                btn_sensitivitySlider.updateState(UserInterface.settings.sensitivity)
                btn_volumeSlider.updateState(UserInterface.settings.volume)
                btn_debugText.func(true)
                btn_strafeHUD.func(true)
                btn_playTutorial.func(true)
                AudioHandler.setVolumes();

            } else {
                console.error("Error while getting settings:", error);
            }
        }
    },

    writeSettings: function () {
        const settingsBlob = new Blob([JSON.stringify(this.settings, null, 2)], { type: "application/json" });
        this.writeFile("settings.json", settingsBlob)
    },

    getRecords: async function () {
        try {

            const recordsData = await this.readFile("records.json");
            this.records = JSON.parse(recordsData);

        } catch (error) {
            if (error == "Failed to getFile: 1") { // file doesnt exist

                // records.json doesn't exist , initialize empty records file
                this.records = {
                    "unlocked": 1
                };
                this.writeRecords(); // Write the default empty records to file

            } else {
                console.error("Error while getting records:", error);
            }
        }
    },

    writeRecords: function () {
        const recordsBlob = new Blob([JSON.stringify(this.records, null, 2)], { type: "application/json" });
        this.writeFile("records.json", recordsBlob)
    },

    handleRecord: function () {
        const record = this.records[Map.name]

        if (record == null || (record !== null && this.timer < record)) {
            this.previousRecord = (record == null) ? 0 : this.records[Map.name] // save previous record
            this.records[Map.name] = this.timer
            this.writeRecords()
        }

    },

    checkCustomMapsDirectoryExists: function () {

        window.resolveLocalFileSystemURL(cordova.file.dataDirectory + "maps", function (dirEntry) {
            // Directory exists, you can now use dirEntry
            console.log("Custom maps directory exists:", dirEntry);
        }, function (err) {
            // Directory doesn't exist, attempt to create it
            console.error("Custom maps directory does NOT exist:", err);

            // Create the directory
            window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dirEntry) {
                dirEntry.getDirectory("maps", { create: true }, function (newDirEntry) {
                    console.log("Created maps directory:", newDirEntry);
                }, function (err) {
                    console.error("Error creating maps directory:", err);
                });
            }, function (err) {
                console.error("Error resolving data directory for creating /maps:", err);
            });
        });
    },

    determineButtonColor: function () {
        let bgColor = CanvasArea.canvas.style.backgroundColor // returns rgba string

        bgColor = bgColor.replace(/[^\d,.]/g, '').split(',')

        const luminance = (0.299 * bgColor[0] + 0.587 * bgColor[1] + 0.114 * bgColor[2]) / 255
        // luminance = (0.299 * R + 0.587 * G + 0.114 * B)/255
        // console.log("luminance: " + luminance)

        this.darkMode = (luminance > 0.8) ? true : false;

    },

    secondsToMinutes: function (milliseconds) {
        const seconds = milliseconds / 1000;
        const minutes = Math.floor(seconds / 60);
        let extraSeconds = seconds % 60;

        // Format extraSeconds with three decimal points
        extraSeconds = extraSeconds.toFixed(3);

        // Pad extraSeconds with zeros if needed
        extraSeconds = extraSeconds.padStart(6, "0");

        return minutes + ":" + extraSeconds;
    },

    drawMedal: function (x, y, radius, fillColor, strokeColor, strokeWidth, shadow) {
        CanvasArea.ctx.save() // save 3a           
        CanvasArea.ctx.fillStyle = fillColor
        CanvasArea.ctx.strokeStyle = strokeColor
        CanvasArea.ctx.lineWidth = strokeWidth

        if (shadow) {
            CanvasArea.ctx.save(); // save 3.1
            CanvasArea.ctx.shadowColor = "rgba(0, 0, 0, 0.21)";
            CanvasArea.ctx.shadowOffsetX = 4
            CanvasArea.ctx.shadowOffsetY = 4
            CanvasArea.ctx.beginPath()
            CanvasArea.ctx.arc(x, y, radius + strokeWidth / 2, 0, 2 * Math.PI); // (x, y, radius, startAngle, endAngle) strokeWidth/2 bc it pokes out otherwise... not sure why
            CanvasArea.ctx.closePath()

            CanvasArea.ctx.fill()
            CanvasArea.ctx.restore() // save 3.1
        }


        CanvasArea.ctx.beginPath()
        CanvasArea.ctx.arc(x, y, radius, 0, 2 * Math.PI); // (x, y, radius, startAngle, endAngle)

        CanvasArea.ctx.fill()
        CanvasArea.ctx.stroke()
        CanvasArea.ctx.restore() // save 3a
    },

    getOrdinalSuffix: function (i) { // turns 1 into 1st, 2 into 2nd
        let j = i % 10,
            k = i % 100;
        if (j === 1 && k !== 11) {
            return i + "st";
        }
        if (j === 2 && k !== 12) {
            return i + "nd";
        }
        if (j === 3 && k !== 13) {
            return i + "rd";
        }
        return i + "th";
    },

    truncateText: function (text, clampToWidth) {
        if (CanvasArea.ctx.measureText(text).width > clampToWidth) {
            while (CanvasArea.ctx.measureText(text + "...").width > clampToWidth || text.endsWith(" ")) { // also removes end char if its a space
                text = text.slice(0, -1) // slice off last character
            }
            return text + "..."
        } else {
            return text
        }
    },

    touchStarted: function (x, y) { // TRIGGERED BY TouchHandler

        this.renderedButtons.forEach(button => {
            if (button.constructor.name == "Button") { // only run on buttons not sliders
                if ( // if x and y touch is within button
                    x >= button.x && x <= button.x + button.width &&
                    y >= button.y && y <= button.y + button.height
                ) {
                    button.pressed();
                }
            }
        });


        this.renderedButtons.forEach(slider => {
            if (slider.constructor.name == "SliderUI") { // only run on sliders
                if ( // if x and y touch is near slider handle
                    Math.abs(x - slider.sliderX) < 30 &&
                    Math.abs(y - slider.y) < 30
                ) {
                    slider.confirmed = false
                }
            }
        });
    },

    touchReleased: function (x, y) { // TRIGGERED BY TouchHandler. x and y are already canvas scaled

        // run button's function if clicked
        // run MapEditor.touchRelease if active and no buttons are pressed

        let editorIgnoreRelease = false;

        this.renderedButtons.forEach(button => {
            if (button.constructor.name == "Button") { // only run on buttons not sliders
                if ( // if x and y touch is within button
                    x >= button.x && x <= button.x + button.width &&
                    y >= button.y && y <= button.y + button.height &&
                    (MapBrowser.scrollVel == 0 || MapBrowser.scrollAmount == null) // dont release if scrolling through Map Browser 
                ) {
                    editorIgnoreRelease = true;
                    button.released();
                }
                button.isPressed = false
            }
        });

        if ( // no button was pressed and MapEditor is active
            editorIgnoreRelease == false &&
            UserInterface.gamestate == 7 &&
            (MapEditor.editorState == 1 || MapEditor.editorState == 2)
        ) {
            MapEditor.touchReleased(x, y)
        }

    },

    render: function () {

        this.renderedButtons.forEach(button => { // LOOP RENDERED BUTTONS AND RUN THEIR .render()
            button.render();
        });

        if (this.gamestate == 1) { // In Main Menu
            CanvasArea.canvas.style.backgroundColor = "#a3d5e1";
            document.body.style.backgroundColor = "#a3d5e1";

            // Draw title text
            CanvasArea.ctx.fillStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1;
            CanvasArea.ctx.font = "140px BAHNSCHRIFT"
            CanvasArea.ctx.fillText("Null Hop", midX - CanvasArea.ctx.measureText("Null Hop").width / 2, 130)

            const menu_background = document.getElementById("menu_background")
            CanvasArea.ctx.drawImage(menu_background, -30, 15, CanvasArea.canvas.width + 60, (menu_background.height / menu_background.width) * CanvasArea.canvas.width + 60)

        }

        if (this.gamestate == 3) { // In Settings
            CanvasArea.ctx.font = "20px BAHNSCHRIFT";
            CanvasArea.ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1 : UserInterface.lightColor_1;
            CanvasArea.ctx.fillText("Debug Info", 180, 270)
            CanvasArea.ctx.fillText("Strafe Helper", 180, 330)

        }

        if (this.gamestate == 6) { // In Level
            CanvasArea.ctx.fillStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1;


            if (this.levelState !== 3 && Tutorial.isActive == false) {
                CanvasArea.roundedRect(CanvasArea.canvas.width - 260, 20, 220, 100, 25)
                CanvasArea.ctx.fill()

                CanvasArea.ctx.font = "26px BAHNSCHRIFT";
                CanvasArea.ctx.fillStyle = !UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1;

                CanvasArea.ctx.fillText("Time: " + UserInterface.secondsToMinutes(this.timer), CanvasArea.canvas.width - 240, 60)
                CanvasArea.ctx.fillText("Record: " + UserInterface.secondsToMinutes((this.records[Map.name] == null ? 0 : this.records[Map.name])), CanvasArea.canvas.width - 240, 90);
            }


            if (this.showVelocity && this.levelState == 2) {
                CanvasArea.ctx.font = "26px BAHNSCHRIFT";
                CanvasArea.ctx.fillStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1;
                const offsetY = Tutorial.pausePlayer ? 34 : 60
                CanvasArea.ctx.fillText("Speed: " + Math.round(Player.velocity.magnitude()), midX - CanvasArea.ctx.measureText("Speed: 00").width / 2, offsetY)
            }


            if (this.settings.debugText == 1) { // DRAWING DEBUG TEXT
                const textX = 200;
                CanvasArea.ctx.font = "15px BAHNSCHRIFT";
                CanvasArea.ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1 : UserInterface.lightColor_1;

                CanvasArea.ctx.fillText("fps: " + Math.round(1 / dt), textX, 60);
                CanvasArea.ctx.fillText("rounded dt: " + Math.round(dt * 10) / 10 + " milliseconds", textX, 80);
                CanvasArea.ctx.fillText("renderedPlatforms Count: " + Map.renderedPlatforms.length, textX, 100);
                CanvasArea.ctx.fillText("endZonesToCheck: " + Map.endZonesToCheck, textX, 120);
                CanvasArea.ctx.fillText("dragging: " + TouchHandler.dragging, textX, 140);
                CanvasArea.ctx.fillText("cameraZoom: " + Player.speedCameraOffset.zoom, textX, 160);
                CanvasArea.ctx.fillText("offsetDir: " + Math.round(Player.speedCameraOffset.direction.x) + ", " + Math.round(Player.speedCameraOffset.direction.y), textX, 180);
                if (TouchHandler.dragging) {
                    CanvasArea.ctx.fillText("touch x: " + TouchHandler.touches[0].x, textX, 200);
                    CanvasArea.ctx.fillText("touch y: " + TouchHandler.touches[0].y, textX, 220);
                }
                CanvasArea.ctx.fillText("dragAmountX: " + TouchHandler.dragAmountX, textX, 240);
                CanvasArea.ctx.fillText("velocity: " + Math.round(Player.velocity.magnitude()), textX, 260);
                CanvasArea.ctx.fillText("Player pos: " + Math.round(Player.x) + ", " + Math.round(Player.y), textX, 280);
                CanvasArea.ctx.fillText("lookAngle: " + Player.lookAngle.getAngleInDegrees(), textX, 300);
                CanvasArea.ctx.fillText("Timer: " + UserInterface.secondsToMinutes(this.timer), textX, 320);


                // DRAWING PLAYER MOVEMENT DEBUG VECTORS
                // Player wish_velocity
                CanvasArea.ctx.strokeStyle = "#FF00FF";
                CanvasArea.ctx.lineWidth = 3
                CanvasArea.ctx.beginPath();
                CanvasArea.ctx.moveTo(midX, midY);
                CanvasArea.ctx.lineTo(midX + Player.wish_velocity.x * 100, midY + Player.wish_velocity.y * 100);
                CanvasArea.ctx.stroke();

                // Player velocity
                CanvasArea.ctx.strokeStyle = "#0000FF";
                CanvasArea.ctx.lineWidth = 4
                CanvasArea.ctx.beginPath();
                CanvasArea.ctx.moveTo(midX, midY);
                CanvasArea.ctx.lineTo(midX + Player.velocity.x, midY + Player.velocity.y);
                CanvasArea.ctx.stroke();

                // Player lookAngle
                CanvasArea.ctx.strokeStyle = "#FF00FF";
                CanvasArea.ctx.lineWidth = 2
                CanvasArea.ctx.beginPath();
                CanvasArea.ctx.moveTo(midX, midY);
                CanvasArea.ctx.lineTo(midX + Player.lookAngle.x * 100, midY + Player.lookAngle.y * 100);
                CanvasArea.ctx.stroke();

                CanvasArea.ctx.strokeStyle = "#000000"; // resetting
                CanvasArea.ctx.lineWidth = 1
            }


            if (this.settings.strafeHUD == 1) { // STRAFE OPTIMIZER HUD

                const ctx = CanvasArea.ctx

                if (this.settings.debugText == 1) {
                    // DRAW THE LITTLE GRAPHS UNDER PLAYER
                    ctx.save()
                    ctx.fillStyle = "blue"
                    ctx.fillRect(midX - 32, midY + 32, 10 * Math.abs(TouchHandler.dragAmountX) * this.settings.sensitivity, 6); // YOUR STRAFE
                    ctx.fillRect(midX - 32, midY + 42, Player.addSpeed, 6); // ADDSPEED
                    ctx.fillRect(midX - 32, midY + 52, 320 * airAcceleration * dt, 6); // Top End clip LIMIT

                    // little text for strafeHelper
                    ctx.font = "12px BAHNSCHRIFT";
                    ctx.fillStyle = "white"
                    ctx.fillText(TouchHandler.dragAmountX * this.settings.sensitivity, midX - 100, midY + 38)
                    ctx.fillText("addSpeed: " + Player.addSpeed, midX - 100, midY + 48)
                    ctx.fillText("addSpeed Clip: " + 320 * airAcceleration * dt, midX - 100, midY + 58)
                    ctx.restore()
                }


                if (TouchHandler.dragging && this.levelState != 3) { // check if any button is pressed

                    let lineUpOffset = 0
                    if (TouchHandler.touches[0].startX * CanvasArea.scale > midX - 200 && TouchHandler.touches[0].startX * CanvasArea.scale < midX + 200) { // if touched withing slider's X => offset the handle to lineup with finger
                        lineUpOffset = TouchHandler.touches[0].startX * CanvasArea.scale - midX
                    }

                    let strafeDistanceX = TouchHandler.touches[0].x * CanvasArea.scale - TouchHandler.touches[0].startX * CanvasArea.scale + lineUpOffset
                    while (strafeDistanceX > 212) { // loop back to negative
                        strafeDistanceX = -212 + (strafeDistanceX - 212)
                    }
                    while (strafeDistanceX < -212) { // loop back to positive
                        strafeDistanceX = 212 + (strafeDistanceX + 212)
                    }


                    ctx.strokeStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1
                    ctx.fillStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1;


                    // DRAW SLIDER
                    if (Tutorial.pausePlayer == false) { // as long as Player isnt paused

                        // border
                        ctx.lineWidth = 4

                        const radius = 10
                        const x = midX - 200
                        const y = CanvasArea.canvas.height - 140
                        const w = 400
                        const h = 20

                        ctx.beginPath()
                        ctx.moveTo(x + radius, y) // top line
                        ctx.lineTo(x + w - radius, y)
                        ctx.arc(x + w - radius, y + radius, radius, 1.5 * Math.PI, 0.5 * Math.PI) // right arc
                        ctx.lineTo(x + radius, y + h)
                        ctx.arc(x + radius, y + radius, radius, 0.5 * Math.PI, 1.5 * Math.PI) // left arc

                        ctx.stroke()
                        ctx.save() // #2.2
                        ctx.clip()

                        // Handle
                        ctx.beginPath();
                        ctx.arc(midX + strafeDistanceX, CanvasArea.canvas.height - 130, 8, 0, 2 * Math.PI);
                        ctx.fill();

                        ctx.restore() // #2.2


                        // DRAW VERTICAL WARNING
                        // calculations
                        const averageX = Math.abs(TouchHandler.averageDragX.getAverage())
                        const averageY = Math.abs(TouchHandler.averageDragY.getAverage())
                        if (averageY > 5 * 1 / 60 / dt && averageY > averageX * 1.25) {
                            if (this.showVerticalWarning == false) {
                                this.showVerticalWarning = true;
                                setTimeout(() => { UserInterface.showVerticalWarning = false }, 1500); // waits 1 second to hide warning
                            }
                        }
                        // draw warning
                        if (this.showVerticalWarning) {
                            ctx.font = "22px BAHNSCHRIFT";

                            CanvasArea.roundedRect(midX - 200, CanvasArea.canvas.height - 180, ctx.measureText("DON'T SWIPE VERTICAL").width + 30, 30, 12)
                            ctx.fillStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1
                            ctx.fill()

                            ctx.fillStyle = !UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1
                            ctx.fillText("DON'T SWIPE VERTICAL", midX - 185, CanvasArea.canvas.height - 157)

                        }


                        // DRAW OVERSTRAFE WARNING
                        if (this.showOverstrafeWarning) {
                            ctx.font = "22px BAHNSCHRIFT";

                            heightOffset = this.showVerticalWarning ? 38 : 0;
                            CanvasArea.roundedRect(midX - 200, CanvasArea.canvas.height - 180 - heightOffset, ctx.measureText("TURNING TOO FAST!").width + 30, 30, 12)
                            ctx.fillStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1
                            ctx.fill()

                            ctx.fillStyle = !UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1
                            ctx.fillText("TURNING TOO FAST!", midX - 185, CanvasArea.canvas.height - 157 - heightOffset)
                        }
                    }
                }
            }


            // ENDSCREEN
            if (Player.endSlow == 0) { // level name, your time, record, leaderboards

                // TIME BOX
                const timeBox = {
                    x: midX - (this.leaderboards[Map.name] !== undefined ? 302 : 220),
                    y: midY - (Tutorial.isActive ? 118 : 140),
                    width: (this.leaderboards[Map.name] !== undefined ? 652 : 418),
                    height: 288,
                }


                // HIGHLIGHT MEDAL BOX
                const highlightBox = {
                    x: timeBox.x + 400,
                    y: null, // set later
                    width: 225,
                    height: 75,
                }

                let medal = null


                // DRAW BOXES
                CanvasArea.ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1 : UserInterface.lightColor_1;
                CanvasArea.ctx.strokeStyle = (!UserInterface.darkMode) ? UserInterface.darkColor_1 : UserInterface.lightColor_1;

                CanvasArea.ctx.save(); // save 3

                CanvasArea.ctx.shadowColor = "rgba(0, 0, 0, 0.21)";
                CanvasArea.ctx.shadowOffsetX = 11
                CanvasArea.ctx.shadowOffsetY = 11

                // time box
                CanvasArea.roundedRect(timeBox.x, timeBox.y, timeBox.width, timeBox.height, 20)
                CanvasArea.ctx.fill();

                // highlight medal box
                if (this.leaderboards[Map.name] !== undefined) {

                    // set hightlight box y and draw it
                    if (UserInterface.timer <= this.leaderboards[Map.name].gold) {
                        medal = 1
                        highlightBox.y = timeBox.y + 65 - highlightBox.height / 2
                    } else if (UserInterface.timer <= this.leaderboards[Map.name].silver) {
                        medal = 2
                        highlightBox.y = timeBox.y + timeBox.height / 2 - highlightBox.height / 2
                    } else if (UserInterface.timer <= this.leaderboards[Map.name].bronze) {
                        medal = 3
                        highlightBox.y = timeBox.y + timeBox.height - 65 - highlightBox.height / 2
                    }

                    if (medal !== null) {
                        CanvasArea.ctx.shadowOffsetX = 7
                        CanvasArea.ctx.shadowOffsetY = 7

                        CanvasArea.roundedRect(highlightBox.x, highlightBox.y, highlightBox.width, highlightBox.height, 15)
                        CanvasArea.ctx.fill();

                        CanvasArea.ctx.shadowColor = "transparent"
                        CanvasArea.ctx.lineWidth = 4
                        CanvasArea.ctx.stroke();
                    }
                }

                CanvasArea.ctx.restore(); // restore 3


                // DRAW END SCREEN TEXT
                CanvasArea.ctx.fillStyle = (!UserInterface.darkMode) ? UserInterface.darkColor_1 : UserInterface.lightColor_1;

                // map name
                CanvasArea.ctx.font = "38px BAHNSCHRIFT";
                CanvasArea.ctx.fillText(Map.name, timeBox.x + 40, timeBox.y + 70);

                // time
                CanvasArea.ctx.font = "90px BAHNSCHRIFT";
                CanvasArea.ctx.fillText(UserInterface.secondsToMinutes(UserInterface.timer), timeBox.x + 40 - 5, timeBox.y + timeBox.height / 2 + 32);

                // record OR new record
                CanvasArea.ctx.font = "30px BAHNSCHRIFT";

                const recordText = (this.timer == this.records[Map.name]) ? "New Record!  -(" + UserInterface.secondsToMinutes(Math.abs(this.previousRecord - this.records[Map.name])) + ")" : "Best Time: " + UserInterface.secondsToMinutes(this.records[Map.name])

                CanvasArea.ctx.fillText(recordText, timeBox.x + 40, timeBox.y + timeBox.height - 45);


                // medals and times
                if (this.leaderboards[Map.name] !== undefined) {
                    let halfFontHeight = 10
                    let xOffset = 0
                    let medalRadius = 16
                    let medalShadow = false

                    function testMedal(number) { // sets specific parameters for drawMedal
                        CanvasArea.ctx.font = medal == number ? "38px BAHNSCHRIFT" : "30px BAHNSCHRIFT"
                        halfFontHeight = medal == number ? 13 : 10
                        xOffset = medal == number ? 14 : 0
                        medalRadius = medal == number ? 19 : 16
                        medalShadow = medal == number ? true : false
                        CanvasArea.ctx.globalAlpha = (medal == number || medal == null) ? 1 : 0.5
                    }

                    testMedal(1)
                    CanvasArea.ctx.fillText(UserInterface.secondsToMinutes(this.leaderboards[Map.name].gold), timeBox.x + 482 - xOffset, timeBox.y + 65 + halfFontHeight);
                    CanvasArea.ctx.globalAlpha = 1
                    this.drawMedal(timeBox.x + 452 - xOffset, timeBox.y + 65, medalRadius, "#f1b62c", "#fde320", 4, medalShadow)

                    testMedal(2)
                    CanvasArea.ctx.fillText(UserInterface.secondsToMinutes(this.leaderboards[Map.name].silver), timeBox.x + 482 - xOffset, timeBox.y + timeBox.height / 2 + halfFontHeight);
                    CanvasArea.ctx.globalAlpha = 1
                    this.drawMedal(timeBox.x + 452 - xOffset, timeBox.y + timeBox.height / 2, medalRadius, "#8c9a9b", "#d4d4d6", 4, medalShadow)

                    testMedal(3)
                    CanvasArea.ctx.fillText(UserInterface.secondsToMinutes(this.leaderboards[Map.name].bronze), timeBox.x + 482 - xOffset, timeBox.y + timeBox.height - 65 + halfFontHeight);
                    CanvasArea.ctx.globalAlpha = 1
                    this.drawMedal(timeBox.x + 452 - xOffset, timeBox.y + timeBox.height - 65, medalRadius, "#e78b4c", "#f4a46f", 4, medalShadow)
                }
            }
        }
    }
}