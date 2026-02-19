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
        sensitivity: 1.0,
        volume: 0.5,
        debugText: 0,
        strafeHUD: 1,
        playTutorial: 1,
    },

    levelState: 1, // 1 = pre-start, 2 = playing level, 3 = in endzone
    timer: 0,
    timerStart: null, // set by jump button

    medals: {}, // medal times for each map
    records: {}, // users records (personal bests) for each level theyve completed
    previousRecord: 0,

    speedAverager: new Averager(30), // for adjusting how speedometer looks

    showVerticalWarning: false,
    showOverstrafeWarning: false,

    orientation: null,
    darkMode: false,

    // should kill these eventually and only use ones defined in CSS
    lightColor_1: "#F5F5F5", // lighter
    lightColor_2: "#E0E0E0", // darker
    darkColor_1: "#454545",
    darkColor_2: "#363636",

    start: function () {
        // where all buttons are created

        this.getSettings();
        this.getRecords();
        this.getMedals();
        this.checkCustomMapsDirectoryExists();

        screen.orientation.addEventListener("change", function (event) {
            UserInterface.orientation = event.target.type.startsWith("landscape") ? "landscape" : "portrait";
            CanvasArea.setSize();
            PlayerCanvas.setSize();
            if (UserInterface.gamestate == 2) {
                MapBrowser.setMaxScroll();
                // FIX should multiply the scrollPos by the ratio of the Map Buttons dimensions to stay in the same position
            }
        });

        function getByID(id) {
            return document.getElementById(id);
        }

        // ===========
        //  MAIN MENU
        // ===========

        const btn_play = getByID("btn_play");
        btn_play.func = () => {
            UserInterface.gamestate = 2;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_standardMapBrowser);
            MapBrowser.state = 1;
            MapBrowser.init();
        };

        const btn_settings = getByID("btn_settings");
        btn_settings.func = () => {
            UserInterface.gamestate = 3;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_settings);
        };

        const btn_mapEditor = getByID("btn_mapEditor");
        btn_mapEditor.func = () => {
            UserInterface.gamestate = 2;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_mapEditorMapBrowser);
            MapBrowser.state = 3;
            MapBrowser.init();
        };

        // ==========
        //  SETTINGS
        // ==========
        const btn_sensitivitySlider = getByID("btn_sensitivitySlider");
        btn_sensitivitySlider.labelValue = btn_sensitivitySlider.querySelector(".label > span");
        btn_sensitivitySlider.handle = btn_sensitivitySlider.querySelector(".handle");
        btn_sensitivitySlider.func = function () {
            UserInterface.settings.sensitivity = UserInterface.getSliderValue(this);
            UserInterface.writeSettings();
        };

        const btn_volumeSlider = getByID("btn_volumeSlider");
        btn_volumeSlider.labelValue = btn_volumeSlider.querySelector(".label > span");
        btn_volumeSlider.handle = btn_volumeSlider.querySelector(".handle");
        btn_volumeSlider.func = function () {
            UserInterface.settings.volume = UserInterface.getSliderValue(this);
            AudioHandler.setVolume(UserInterface.settings.volume);
            UserInterface.writeSettings();
        };

        const btn_debugText = getByID("btn_debugText");
        btn_debugText.func = function () {
            // sync with UserInterface.settings.debugText
            this.classList.toggle("toggled"); // .toggle adds or removes class depending on if it's already added
            UserInterface.settings.debugText = UserInterface.getToggleState(this); // adjust settings to match toggle state
            // unhiding or hiding debug text (doesnt add to activeGroup so it never gets switched off)
            if (UserInterface.settings.debugText) {
                ui_debugText.classList.remove("hidden");
            } else {
                ui_debugText.classList.add("hidden");
            }
            UserInterface.writeSettings();
        };

        const btn_strafeHUD = getByID("btn_strafeHUD");
        btn_strafeHUD.func = function () {
            // sync with UserInterface.settings.strafeHUD
            this.classList.toggle("toggled");
            UserInterface.settings.strafeHUD = UserInterface.getToggleState(this);
            UserInterface.writeSettings();
        };

        const btn_resetSettings = getByID("btn_resetSettings");
        btn_resetSettings.func = () => {
            const reset = confirm("Reset All Settings and Records?");
            if (reset) {
                UserInterface.records = {
                    unlocked: UserInterface.records.unlocked,
                };
                UserInterface.writeRecords();

                UserInterface.settings = {
                    sensitivity: 0.5,
                    volume: 0.5,
                    debugText: 0,
                    strafeHUD: 1,
                    playTutorial: 1,
                };
                UserInterface.writeSettings();

                // sync all settings button
                UserInterface.setSliderValue(btn_sensitivitySlider, UserInterface.settings.sensitivity);
                UserInterface.setSliderValue(btn_volumeSlider, UserInterface.settings.volume);
                UserInterface.setToggleState(btn_debugText, UserInterface.settings.debugText);
                ui_debugText.classList.add("hidden"); // hide debug text DOM element
                UserInterface.setToggleState(btn_strafeHUD, UserInterface.settings.strafeHUD);
                UserInterface.setToggleState(btn_playTutorial, UserInterface.settings.playTutorial);
                AudioHandler.setVolume(UserInterface.settings.volume);

                console.log("Records And Settings Cleared");
            }
        };

        // ==========
        //  IN LEVEL
        // ==========

        const ui_speedometer = getByID("ui_speedometer");
        const ui_jumpStats = getByID("ui_jumpStats");

        const ui_timerBox = getByID("ui_timerBox");

        const ui_strafeHelper = getByID("ui_strafeHelper");
        ui_strafeHelper.handle = getByID("strafeHandle");
        ui_strafeHelper.func = function () {
            const touchX = TouchHandler.touches[0].x;

            const parentRect = ui_strafeHelper.getBoundingClientRect();
            const parentLeft = parentRect.left;
            const parentWidth = parentRect.width;

            // relative position of touch inside the parent
            let rel = touchX - parentLeft;

            // wrap-around using modulo so it loops when going past edges
            rel = ((rel % parentWidth) + parentWidth) % parentWidth;

            ui_strafeHelper.handle.style.left = rel + "px";
        };

        const ui_warningContainer = getByID("ui_warningContainer");
        const ui_verticalWarning = getByID("ui_verticalWarning");
        const ui_overstrafeWarning = getByID("ui_overstrafeWarning");

        const btn_mainMenu = getByID("btn_mainMenu");
        btn_mainMenu.func = () => {
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
            // 1 = main map edit screen
            // 2 = platform edit menu
            // 3 = map color page
            // 4 = map settings page

            // MapBrowser.state
            // 1 = standard map browser
            // 2 = custom map browser
            // 3 = editor map browser

            // in one of the three MapBrowsers
            if (UserInterface.gamestate == 2) {
                if (MapBrowser.state == 1 || MapBrowser.state == 3) {
                    // in STANDARD map browser => goto main menu
                    // in EDITOR map browser => goto main menu
                    MapBrowser.scrollPos = 0;
                    MapBrowser.selectedMapIndex = -1;
                    UserInterface.gamestate = 1;
                    UserInterface.switchToUiGroup(UserInterface.uiGroup_mainMenu);
                    return;
                }

                if (MapBrowser.state == 2) {
                    // in CUSTOM map browser => go back to standard map browser
                    MapBrowser.scrollPos = 0;
                    MapBrowser.selectedMapIndex = -1;
                    UserInterface.switchToUiGroup(UserInterface.uiGroup_standardMapBrowser);
                    MapBrowser.state = 1;
                    MapBrowser.init();
                    return;
                }
            }

            if (UserInterface.gamestate == 3) {
                // in Settings page
                // goto main menu
                UserInterface.gamestate = 1;
                UserInterface.switchToUiGroup(UserInterface.uiGroup_mainMenu);
                return;
            }

            if (UserInterface.gamestate == 5) {
                // in Loading Map screen
                // goto one of three map browsers standard, custom, or editor

                if (MapBrowser.state == 1) {
                    UserInterface.switchToUiGroup(UserInterface.uiGroup_standardMapBrowser);
                } else if (MapBrowser.state == 2) {
                    UserInterface.switchToUiGroup(UserInterface.uiGroup_customMapBrowser);
                } else if (MapBrowser.state == 3) {
                    UserInterface.switchToUiGroup(UserInterface.uiGroup_mapEditorMapBrowser);
                    MapEditor.cancelImport?.(); // in case of a failed map import
                }

                MapBrowser.init();
                UserInterface.gamestate = 2;
                return;
            }

            if (UserInterface.gamestate == 6) {
                // in Level
                // goto back to map browser
                // either standard or custom depending on MapBrowser state
                UserInterface.gamestate = 2;

                UserInterface.timer = 0;
                UserInterface.levelState = 1;
                ui_speedometer.textContent = "Speed: 0";
                gravity = 500;

                UserInterface.removeUiElement(ui_verticalWarning);
                UserInterface.removeUiElement(ui_overstrafeWarning);
                UserInterface.ui_verticalWarning = false;
                UserInterface.showOverstrafeWarning = false;

                CanvasArea.canvas.classList.add("hidden");

                if (MapBrowser.state == 1) {
                    UserInterface.switchToUiGroup(UserInterface.uiGroup_standardMapBrowser);
                } else {
                    UserInterface.switchToUiGroup(UserInterface.uiGroup_customMapBrowser);
                }

                MapBrowser.init();

                if (Tutorial.isActive) {
                    // if leaving tutorial level
                    Tutorial.isActive = false;
                    Tutorial.reset();
                }

                return;
            }

            if (UserInterface.gamestate == 7) {
                // in MapEditor

                // btn_mainMenu only appears in map settings or map color pages while in MapEditor
                // goto MapEditor main map editing screen
                UserInterface.switchToUiGroup(UserInterface.uiGroup_mapEditorInterface);
                MapEditor.editorState = 1;
                return;
            }
        };

        const btn_restart = getByID("btn_restart");
        btn_restart.func = () => {
            if (Tutorial.isActive && Tutorial.state < 18) {
                // In Tutorial and HAVE NOT reached the end
                // Show Popup Alert "Restart Disabled During Tutorial"
                if (!UserInterface.activeUiGroup.has(ui_restartWarning)) {
                    UserInterface.addUiElement(ui_restartWarning);
                    setTimeout(() => {
                        UserInterface.removeUiElement(ui_restartWarning);
                    }, 1500); // waits 1.5 seconds to hide warning
                }
                return;
            }

            if (UserInterface.levelState == 3) {
                // if already finished level
                UserInterface.switchToUiGroup(UserInterface.uiGroup_inLevel);
            }

            ui_speedometer.textContent = "Speed: 0";
            ui_jumpStats.textContent = "";
            UserInterface.timer = 0;
            UserInterface.levelState = 1;
            Player.checkpointIndex = -1;
            Player.restart();

            // only reaches this code if tutorial is on last two states (pretty much completed)
            if (Tutorial.isActive) {
                Tutorial.isActive = false;
                Tutorial.reset();
            }
        };

        const btn_jump = getByID("btn_jump");
        btn_jump.func = () => {
            if (UserInterface.levelState == 1) {
                UserInterface.timerStart = Date.now();
                UserInterface.levelState = 2;
                Player.startLevel();
            }
        };

        const ui_endScreen = getByID("ui_endScreen");

        const ui_debugText = getByID("ui_debugText");

        // ======================
        //  STANDARD MAP BROWSER
        // ======================

        const btn_customMaps = getByID("btn_customMaps");
        btn_customMaps.func = () => {
            UserInterface.gamestate = 2;

            UserInterface.switchToUiGroup(UserInterface.uiGroup_customMapBrowser);

            MapBrowser.state = 2;
            MapBrowser.init();
        };

        const btn_playMap = getByID("btn_playMap");
        btn_playMap.func = () => {
            MapBrowser.scrollPos = 0;
            MapBrowser.scrollVel = 0;

            UserInterface.gamestate = 5;
            UserInterface.switchToUiGroup(new Set([btn_mainMenu]));

            if (MapBrowser.state == 1) {
                // in normal maps browser
                Map.initMap(MapBrowser.selectedMapIndex, false);

                // check if Tutorial should be started
                if (MapBrowser.selectedMapIndex == "Awakening" && UserInterface.settings.playTutorial == true) {
                    Tutorial.isActive = true;
                }
            } else {
                // in custom maps browser
                Map.initMap(MapBrowser.selectedMapIndex, true);
            }
        };

        const btn_playTutorial = getByID("btn_playTutorial");
        btn_playTutorial.func = function () {
            // sync with UserInterface.settings.playTutorial
            this.classList.toggle("toggled");
            const toggleState = UserInterface.getToggleState(this);
            UserInterface.settings.playTutorial = toggleState;
            UserInterface.writeSettings();
            console.log("Play Tutorial Toggled: " + toggleState);
        };

        const ui_mapInfoBox = getByID("ui_mapInfoBox");

        const btn_level_awakening = getByID("btn_level_awakening");
        btn_level_awakening.func = () => {
            MapBrowser.selectedMapIndex = "Awakening";
            MapBrowser.updateMapBrowserUI();
        };

        const btn_level_pitfall = getByID("btn_level_pitfall");
        btn_level_pitfall.func = () => {
            MapBrowser.selectedMapIndex = "Pitfall";
            MapBrowser.updateMapBrowserUI();
        };

        const btn_level_cavernAbyss = getByID("btn_level_cavernAbyss");
        btn_level_cavernAbyss.func = () => {
            MapBrowser.selectedMapIndex = "Cavern Abyss";
            MapBrowser.updateMapBrowserUI();
        };

        const btn_level_crystals = getByID("btn_level_crystals");
        btn_level_crystals.func = () => {
            MapBrowser.selectedMapIndex = "Crystals";
            MapBrowser.updateMapBrowserUI();
        };

        const btn_level_surfacing = getByID("btn_level_surfacing");
        btn_level_surfacing.func = () => {
            MapBrowser.selectedMapIndex = "Surfacing";
            MapBrowser.updateMapBrowserUI();
        };

        const btn_level_wheatFields = getByID("btn_level_wheatFields");
        btn_level_wheatFields.func = () => {
            MapBrowser.selectedMapIndex = "Wheat Fields";
            MapBrowser.updateMapBrowserUI();
        };

        const btn_level_trespass = getByID("btn_level_trespass");
        btn_level_trespass.func = () => {
            MapBrowser.selectedMapIndex = "Trespass";
            MapBrowser.updateMapBrowserUI();
        };

        const btn_level_turmoil = getByID("btn_level_turmoil");
        btn_level_turmoil.func = () => {
            MapBrowser.selectedMapIndex = "Turmoil";
            MapBrowser.updateMapBrowserUI();
        };

        const btn_level_tangledForest = getByID("btn_level_tangledForest");
        btn_level_tangledForest.func = () => {
            MapBrowser.selectedMapIndex = "Tangled Forest";
            MapBrowser.updateMapBrowserUI();
        };

        const btn_level_pinnacle = getByID("btn_level_pinnacle");
        btn_level_pinnacle.func = () => {
            MapBrowser.selectedMapIndex = "Pinnacle";
            MapBrowser.updateMapBrowserUI();
        };

        const btn_level_moonlight = getByID("btn_level_moonlight");
        btn_level_moonlight.func = () => {
            MapBrowser.selectedMapIndex = "Moonlight";
            MapBrowser.updateMapBrowserUI();
        };

        const btn_level_rapture = getByID("btn_level_rapture");
        btn_level_rapture.func = () => {
            MapBrowser.selectedMapIndex = "Rapture";
            MapBrowser.updateMapBrowserUI();
        };

        const btn_level_forever = getByID("btn_level_forever");
        btn_level_forever.func = () => {
            MapBrowser.selectedMapIndex = "Forever";
            MapBrowser.updateMapBrowserUI();
        };

        // ==========
        //  TUTORIAL
        // ==========

        const ui_tutorialTextWrapper = getByID("ui_tutorialTextWrapper");
        const ui_tutorialText = getByID("ui_tutorialText");

        const btn_next = getByID("btn_next");
        btn_next.func = function () {
            Tutorial.setState(Tutorial.state + 1);
        };

        const ui_restartWarning = getByID("ui_restartWarning");

        const tutorial_swipe = getByID("tutorial_swipe");
        const tutorial_swipeVertical = getByID("tutorial_swipeVertical");
        const tutorial_arrow = getByID("tutorial_arrow");

        this.tutorial_targetCenter = getByID("target-center");
        this.tutorial_arc = getByID("arc");
        this.tutorial_dot = getByID("dot");

        // ====================
        //  MAP EDITOR BROWSER
        // ====================
        const btn_newMap = getByID("btn_newMap");
        btn_newMap.func = function () {
            MapBrowser.scrollVel = 0;
            MapBrowser.scrollPos = 0;
            UserInterface.gamestate = 5;
            UserInterface.switchToUiGroup(new Set([btn_mainMenu]));
            MapEditor.initMap(-1); // -1 indicates new map
        };

        const btn_importMap = getByID("btn_importMap");
        btn_importMap.func = () => {
            MapBrowser.scrollVel = 0;
            MapBrowser.scrollPos = 0;
            UserInterface.gamestate = 5;
            UserInterface.switchToUiGroup(new Set([btn_mainMenu]));
            MapEditor.initMap(-2); // -2 indicates imported map
        };

        const btn_editMap = getByID("btn_editMap");
        btn_editMap.func = async () => {
            MapBrowser.scrollVel = 0;
            MapBrowser.scrollPos = 0;
            UserInterface.gamestate = 5;
            UserInterface.switchToUiGroup(new Set([btn_mainMenu]));
            MapEditor.initMap(MapBrowser.selectedMapIndex);
        };

        const btn_shareMap = getByID("btn_shareMap");
        btn_shareMap.addEventListener("click", UserInterface.shareMap);
        btn_shareMap.func = () => {
            console.log("btn_shareMap functionality handled by native touch click and UserInterface.shareMap()");
        };

        const btn_deleteMap = getByID("btn_deleteMap");
        btn_deleteMap.func = () => {
            const deleteMap = confirm("Delete Map?");
            if (deleteMap) {
                window.resolveLocalFileSystemURL(cordova.file.dataDirectory + "maps", (fileSystem) => {
                    var reader = fileSystem.createReader();
                    reader.readEntries((entries) => {
                        fileSystem.getFile(MapBrowser.selectedMapIndex + ".json", { create: false }, (fileEntry) => {
                            fileEntry.remove(
                                (file) => {
                                    alert("Map Deleted");

                                    // reload map editor map browser by pressing btn_mapEditor again
                                    btn_mapEditor.func();
                                },
                                function (error) {
                                    alert("error occurred: " + error.code);
                                },
                                function () {
                                    alert("file does not exist");
                                },
                            );
                        });
                    });
                });
            }
        };

        // ==========================
        //  MAP EDITOR (MAIN SCREEN)
        // ==========================

        const btn_exitMapEditor = getByID("btn_exitMapEditor");
        btn_exitMapEditor.func = () => {
            MapEditor.saveCustomMap();
        };

        const btn_addPlatform = getByID("btn_addPlatform");
        btn_addPlatform.func = () => {
            const newPlatform = {
                x: Math.round(MapEditor.screen.x),
                y: Math.round(MapEditor.screen.y),
                width: 100,
                height: 100,
                hypotenuse: Math.sqrt(this.width * this.width + this.height * this.height) / 2,
                angle: 0,
                endzone: 0,
                wall: 0,
            };

            MapEditor.updatePlatformCorners(newPlatform); // update dynamic attributes of platform

            MapEditor.loadedMap.platforms.push(newPlatform);
            MapEditor.selectedElements = MapEditor.multiSelect
                ? MapEditor.selectedElements.concat(MapEditor.loadedMap.platforms.length - 1)
                : [MapEditor.loadedMap.platforms.length - 1];
            UserInterface.switchToUiGroup(UserInterface.uiGroup_editPlatform);

            // SYNC ALL BUTTONS AND SLIDERS
            UserInterface.setSliderValue(btn_platformAngleSlider, MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].angle, true);

            // should abstract this stuff to somewhere else -- it is duplicated in a few places
            const isWall = MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].wall;
            UserInterface.setToggleState(btn_wall, isWall);
            btn_wall.label.textContent = isWall ? "Wall: Yes" : "Wall: No";

            const isEndZone = MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].endzone;
            UserInterface.setToggleState(btn_endzone, isEndZone);
            btn_endzone.label.textContent = isEndZone ? "End Zone: Yes" : "End Zone: No";

            this.updateMapEditorSidePanel();
        };

        const btn_addCheckpoint = getByID("btn_addCheckpoint");
        btn_addCheckpoint.func = () => {
            const middleX = Math.round(MapEditor.screen.x);
            const middleY = Math.round(MapEditor.screen.y);
            const newCheckpoint = {
                triggerX1: middleX - 100,
                triggerY1: middleY,
                triggerX2: middleX + 100,
                triggerY2: middleY,
                x: middleX,
                y: middleY + 50,
                angle: 270,
            };

            MapEditor.loadedMap.checkpoints.push(newCheckpoint);
        };

        const btn_mapColors = getByID("btn_mapColors");
        btn_mapColors.func = () => {
            MapEditor.editorState = 3; // map colors
            ColorPicker.editingElement = 0;
            PreviewWindow.update();
            UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState1);
            ColorPicker.updateButtonColors();
        };

        const btn_mapSettings = getByID("btn_mapSettings");
        btn_mapSettings.func = () => {
            MapEditor.editorState = 4; // map settings

            PreviewWindow.update();

            UserInterface.setSliderValue(btn_platformHeightSlider, MapEditor.loadedMap.style.platformHeight);
            UserInterface.setSliderValue(btn_wallHeightSlider, MapEditor.loadedMap.style.wallHeight);
            UserInterface.setSliderValue(btn_lightDirectionSlider, MapEditor.loadedMap.style.lightDirection);
            UserInterface.setSliderValue(btn_lightPitchSlider, MapEditor.loadedMap.style.lightPitch);

            UserInterface.switchToUiGroup(UserInterface.uiGroup_mapSettings);
        };

        const btn_dragSelect = getByID("btn_dragSelect");
        btn_dragSelect.func = function () {
            if (this.classList.contains("toggled")) {
                // turn off dragSelect
                MapEditor.dragSelect = false;
                MapEditor.setButtonGroup();
            } else {
                // turn on dragSelect and multiSelect
                MapEditor.dragSelect = true;
                MapEditor.multiSelect = true;
                UserInterface.setToggleState(btn_multiSelect, true); // sync other button's toggle
                UserInterface.switchToUiGroup(new Set([btn_dragSelect, ui_dragSelectMarquee]));
                // set ui_dragSelectMarquee size to zero
            }

            this.classList.toggle("toggled");
        };

        const btn_multiSelect = getByID("btn_multiSelect");
        btn_multiSelect.func = function () {
            if (this.classList.contains("toggled")) {
                // turn off multiSelect
                MapEditor.multiSelect = false;
                if (MapEditor.selectedElements.length > 1) {
                    // MapEditor.selectedElements = [MapEditor.selectedElements[MapEditor.selectedElements.length - 1]]; // make it only select the last element in the array
                    MapEditor.selectedElements = []; // no selected items after multiselect turned off
                    MapEditor.setButtonGroup();
                }
            } else {
                // turn on multiSelect
                MapEditor.multiSelect = true;
            }

            this.classList.toggle("toggled");
        };

        const btn_snappingSlider = getByID("btn_snappingSlider");
        btn_snappingSlider.labelValue = btn_snappingSlider.querySelector(".label > span");
        btn_snappingSlider.handle = btn_snappingSlider.querySelector(".handle");
        btn_snappingSlider.func = function () {
            const value = UserInterface.getSliderValue(this);
            MapEditor.snapAmount = value;

            // Update step values for angle sliders
            btn_platformAngleSlider.dataset.step = value;
            btn_playerAngleSlider.dataset.step = value;
            btn_checkpointAngleSlider.dataset.step = value;
        };

        const btn_translate = getByID("btn_translate");
        btn_translate.func = function () {
            // for multiselect:
            // get center average of all selected elements
            // create an array containing each element with its xKey / yKey
            // do a selectedElements.forEach loop to run logic on each element

            let avgMidX = 0;
            let avgMidY = 0;
            let conditioningArray = [];

            // populate conditioningArray
            for (let i = 0; i < MapEditor.selectedElements.length; i++) {
                // PRE CONDITIONING FOR THE SELECTED ELEMENTS
                let item = {
                    element: null,
                    xKey: "x", // these are used to distingish wheather to use triggerX1 or just x when dealing with checkpoints
                    yKey: "y", // implemented this system so that the btn_translate logic can be done with one section of code
                    offSet: 0, // amount to offset the bnt_translate from the center of the element
                };

                if (MapEditor.selectedElements[i] == "playerStart") {
                    // if playerStart is selected
                    item.element = MapEditor.loadedMap.playerStart;
                    item.offSet = 32 / MapEditor.zoom;
                } else if (Array.isArray(MapEditor.selectedElements[i])) {
                    const checkpoint = MapEditor.selectedElements[i];

                    item.element = MapEditor.loadedMap.checkpoints[checkpoint[0]];

                    if (checkpoint[1] == 1) {
                        item.xKey = "triggerX1";
                        item.yKey = "triggerY1";
                    }

                    if (checkpoint[1] == 2) {
                        item.xKey = "triggerX2";
                        item.yKey = "triggerY2";
                    }

                    if (checkpoint[1] == 3) {
                        item.offSet = 32;
                    }
                } else {
                    // selected platform
                    item.element = MapEditor.loadedMap.platforms[MapEditor.selectedElements[i]];
                }

                conditioningArray.push(item);
                avgMidX += item.element[item.xKey];
                avgMidY += item.element[item.yKey];
            }

            avgMidX = avgMidX / conditioningArray.length;
            avgMidY = avgMidY / conditioningArray.length;

            // ACTUAL BUTTON LOGIC

            if (!this.classList.contains("pressed")) {
                // not pressed

                // element(s) map coords mapped to screen coords
                // mapToRange(number, inMin, inMax, outMin, outMax)
                const xMapped = mapToRange(avgMidX, MapEditor.screen.cornerX, MapEditor.screen.cornerX + MapEditor.screen.width, 0, screenWidthUI);
                const yMapped = mapToRange(avgMidY, MapEditor.screen.cornerY, MapEditor.screen.cornerY + MapEditor.screen.height, 0, screenHeightUI);

                // position button in the middle of element(s)
                if (MapEditor.selectedElements.length > 1) {
                    // Multiple element selected -- position button in average middle
                    UserInterface.setGizmoBtnPos(this, xMapped, yMapped);
                } else {
                    // Just one element selected. Use its offSet (accounting for map zoom)
                    UserInterface.setGizmoBtnPos(
                        this,
                        xMapped + conditioningArray[0].offSet * MapEditor.zoom,
                        yMapped + conditioningArray[0].offSet * MapEditor.zoom,
                    );
                }
                return;
            }
            // MOVE BUTTON according to touch dragging
            // adjust and pan screen if button is near the edge
            // move element to rounded and mapped button coords
            // snap element to snapping slider

            let btnPos = UserInterface.getGizmoBtnPos(this);
            btnPos.x += TouchHandler.dragAmountX;
            btnPos.y += TouchHandler.dragAmountY;
            UserInterface.setGizmoBtnPos(this, btnPos.x, btnPos.y);
            // this could be done with transform: translate() which would be GPU accelerated.
            // would have to track full touch drag from when press starts till press ends

            // panning if at edges of screen
            if (btnPos.x > screenWidthUI - 64) {
                MapEditor.screen.x += (400 / MapEditor.zoom) * dt;
            }
            if (btnPos.x < 64) {
                MapEditor.screen.x -= (400 / MapEditor.zoom) * dt;
            }
            if (btnPos.y > screenHeightUI - 64) {
                MapEditor.screen.y += (400 / MapEditor.zoom) * dt;
            }
            if (btnPos.y < 48) {
                MapEditor.screen.y -= (400 / MapEditor.zoom) * dt;
            }

            // MOVING EACH SELECTED ELEMENT TO FOLLOW BUTTON
            for (let i = 0; i < MapEditor.selectedElements.length; i++) {
                let xMapped; // where this button is in global map coords
                let yMapped; // (and sometimes accounting for the offset when multiple platforms are selected)

                if (MapEditor.selectedElements.length > 1) {
                    // Multiple objects selected

                    // offSetFromBtn (offeset from middle of selection) for each platform is in global coords here
                    const offSetFromAvgMidGlobalX = avgMidX - conditioningArray[i].element[conditioningArray[i].xKey];
                    const offSetFromAvgMidGlobalY = avgMidY - conditioningArray[i].element[conditioningArray[i].yKey];

                    // Map btn pos from UI coords to global map coords
                    // mapToRange(number, inMin, inMax, outMin, outMax)
                    const btnGlobalX = mapToRange(
                        btnPos.x,
                        0,
                        screenWidthUI,
                        MapEditor.screen.cornerX,
                        MapEditor.screen.cornerX + MapEditor.screen.width,
                    );
                    const btnGlobalY = mapToRange(
                        btnPos.y,
                        0,
                        screenHeightUI,
                        MapEditor.screen.cornerY,
                        MapEditor.screen.cornerY + MapEditor.screen.height,
                    );

                    xMapped = btnGlobalX - offSetFromAvgMidGlobalX;
                    yMapped = btnGlobalY - offSetFromAvgMidGlobalY;
                } else {
                    // use offset for single item

                    xMapped = mapToRange(
                        btnPos.x - conditioningArray[i].offSet * MapEditor.zoom,
                        0,
                        screenWidthUI,
                        MapEditor.screen.cornerX,
                        MapEditor.screen.cornerX + MapEditor.screen.width,
                    );
                    yMapped = mapToRange(
                        btnPos.y - conditioningArray[i].offSet * MapEditor.zoom,
                        0,
                        screenHeightUI,
                        MapEditor.screen.cornerY,
                        MapEditor.screen.cornerY + MapEditor.screen.height,
                    );
                }

                // set element position to (xMapped, yMapped)
                conditioningArray[i].element[conditioningArray[i].xKey] = Math.round(xMapped);
                conditioningArray[i].element[conditioningArray[i].yKey] = Math.round(yMapped);

                if (MapEditor.snapAmount > 0) {
                    conditioningArray[i].element[conditioningArray[i].xKey] =
                        Math.round(conditioningArray[i].element[conditioningArray[i].xKey] / MapEditor.snapAmount) * MapEditor.snapAmount;
                    conditioningArray[i].element[conditioningArray[i].yKey] =
                        Math.round(conditioningArray[i].element[conditioningArray[i].yKey] / MapEditor.snapAmount) * MapEditor.snapAmount;
                }

                UserInterface.updateMapEditorSidePanel();
            }
        };

        const btn_resize_TL = getByID("btn_resize_TL");
        const btn_resize_TR = getByID("btn_resize_TR");
        const btn_resize_BR = getByID("btn_resize_BR");
        const btn_resize_BL = getByID("btn_resize_BL");

        function resizeBtnFuncLogic(btn, cornerIndex, pinnedIndex, offsetX, offsetY, widthSign, heightSign) {
            // FIX - remove the offsetX and offsetY and just calculate it on the fly: 
            // widthSign * buttonRect.width/2 
            // heightSign * buttonRect.height/2
            // update function calls when params are removed
            
            const platform = MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]];

            if (!btn.classList.contains("pressed")) {
                // position button at corner of element
                const corner = platform.corners[cornerIndex];
                const cornerMappedX = mapToRange(
                    platform.x + corner[0],
                    MapEditor.screen.cornerX,
                    MapEditor.screen.cornerX + MapEditor.screen.width,
                    0,
                    screenWidthUI,
                );
                const cornerMappedY = mapToRange(
                    platform.y + corner[1],
                    MapEditor.screen.cornerY,
                    MapEditor.screen.cornerY + MapEditor.screen.height,
                    0,
                    screenHeightUI,
                );
                UserInterface.setGizmoBtnPos(btn, cornerMappedX + offsetX, cornerMappedY + offsetY);
                return;
            }

            // move button according to drag
            let btnPos = UserInterface.getGizmoBtnPos(btn);
            btnPos.x += TouchHandler.dragAmountX;
            btnPos.y += TouchHandler.dragAmountY;
            UserInterface.setGizmoBtnPos(btn, btnPos.x, btnPos.y);

            // panning when drag near edges of screen
            const panSpeed = (400 / MapEditor.zoom) * dt;
            if (btnPos.x > screenWidthUI - 64) {
                MapEditor.screen.x += panSpeed;
            }
            if (btnPos.x < 64) {
                MapEditor.screen.x -= panSpeed;
            }
            if (btnPos.y > screenHeightUI - 64) {
                MapEditor.screen.y += panSpeed;
            }
            if (btnPos.y < 48) {
                MapEditor.screen.y -= panSpeed;
            }

            // pinned corner map + screen coords
            const pinned = platform.corners[pinnedIndex];
            const pinnedX_map = platform.x + pinned[0];
            const pinnedY_map = platform.y + pinned[1];
            const pinnedX_screen = mapToRange(
                pinnedX_map,
                MapEditor.screen.cornerX,
                MapEditor.screen.cornerX + MapEditor.screen.width,
                0,
                screenWidthUI,
            );
            const pinnedY_screen = mapToRange(
                pinnedY_map,
                MapEditor.screen.cornerY,
                MapEditor.screen.cornerY + MapEditor.screen.height,
                0,
                screenHeightUI,
            );

            // get drag vector (from pinnedCorner -> buttonPos) (unscaled by zoom)
            // dividing by zoom brings it back to real map scale
            const drag = new Vector2D3D(
                (btnPos.x - offsetX - pinnedX_screen) / MapEditor.zoom,
                (btnPos.y - offsetY - pinnedY_screen) / MapEditor.zoom,
            );
            const rotated = drag.clone().rotate(-platform.angle);

            // set width and height using rotatedDragFromPinned
            platform.width = Math.round(widthSign * rotated.x * CanvasArea.scale);
            platform.height = Math.round(heightSign * rotated.y * CanvasArea.scale);

            // snapping and restricting size
            if (MapEditor.snapAmount > 0) {
                platform.width = Math.round(platform.width / MapEditor.snapAmount) * MapEditor.snapAmount;
                platform.height = Math.round(platform.height / MapEditor.snapAmount) * MapEditor.snapAmount;
            }

            platform.width = Math.max(platform.width, 6);
            platform.height = Math.max(platform.height, 6);

            // recompute new dragged corner offset
            const angleRad = platform.angleRad;
            const c = Math.cos(angleRad);
            const s = Math.sin(angleRad);

            // Offsets of all 4 corners relative to center (only one used per button)
            const cornerOffsets = [
                [(-platform.width / 2) * c - (platform.height / 2) * s, (-platform.width / 2) * s + (platform.height / 2) * c], // BL
                [(platform.width / 2) * c - (platform.height / 2) * s, (platform.width / 2) * s + (platform.height / 2) * c], // BR
                [(platform.width / 2) * c + (platform.height / 2) * s, (platform.width / 2) * s - (platform.height / 2) * c], // TR
                [(-platform.width / 2) * c + (platform.height / 2) * s, (-platform.width / 2) * s - (platform.height / 2) * c], // TL
            ];

            // The dragged corner (in map-space offset)
            const draggedCorner = cornerOffsets[cornerIndex];

            // Find the dragged corner’s new map position
            const draggedX_map = pinnedX_map + draggedCorner[0] * 2;
            const draggedY_map = pinnedY_map + draggedCorner[1] * 2;

            // Recenter platform between pinned and dragged corners
            platform.x = (pinnedX_map + draggedX_map) / 2;
            platform.y = (pinnedY_map + draggedY_map) / 2;

            // update platform center
            MapEditor.updatePlatformCorners(platform);

            // update size and position text
            UserInterface.updateMapEditorSidePanel();
        }

        btn_resize_TL.func = () => resizeBtnFuncLogic(btn_resize_TL, 3, 1, -19, -19, -1, -1);
        btn_resize_TR.func = () => resizeBtnFuncLogic(btn_resize_TR, 2, 0, +19, -19, +1, -1);
        btn_resize_BR.func = () => resizeBtnFuncLogic(btn_resize_BR, 1, 3, +19, +19, +1, +1);
        btn_resize_BL.func = () => resizeBtnFuncLogic(btn_resize_BL, 0, 2, -19, +19, -1, +1);

        const ui_editorSidePanel = getByID("ui_editorSidePanel");
        const ui_elementTitle = getByID("ui_elementTitle");
        const ui_elementInfo = getByID("ui_elementInfo");

        const btn_unselect = getByID("btn_unselect");
        btn_unselect.func = () => {
            UserInterface.switchToUiGroup(UserInterface.uiGroup_mapEditorInterface);
            MapEditor.selectedElements = []; // remove all selected elements
        };

        const btn_platformAngleSlider = getByID("btn_platformAngleSlider");
        btn_platformAngleSlider.labelValue = btn_platformAngleSlider.querySelector(".label > span");
        btn_platformAngleSlider.handle = btn_platformAngleSlider.querySelector(".handle");
        btn_platformAngleSlider.func = function () {
            MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].angle = UserInterface.getSliderValue(this);
            MapEditor.updatePlatformCorners(MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]]);
        };

        const btn_playerAngleSlider = getByID("btn_playerAngleSlider");
        btn_playerAngleSlider.labelValue = btn_playerAngleSlider.querySelector(".label > span");
        btn_playerAngleSlider.handle = btn_playerAngleSlider.querySelector(".handle");
        btn_playerAngleSlider.func = function () {
            MapEditor.loadedMap.playerStart.angle = UserInterface.getSliderValue(this);
        };

        const btn_checkpointAngleSlider = getByID("btn_checkpointAngleSlider");
        btn_checkpointAngleSlider.labelValue = btn_checkpointAngleSlider.querySelector(".label > span");
        btn_checkpointAngleSlider.handle = btn_checkpointAngleSlider.querySelector(".handle");
        btn_checkpointAngleSlider.func = function () {
            MapEditor.loadedMap.checkpoints[MapEditor.selectedElements[0][0]].angle = UserInterface.getSliderValue(this);
        };

        const btn_wall = getByID("btn_wall");
        btn_wall.label = btn_wall.querySelector(".label");
        btn_wall.func = function () {
            if (this.classList.contains("toggled")) {
                // make platform NOT wall
                MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].wall = 0;
                this.label.textContent = "Wall: No";
            } else {
                // make platform wall
                MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].wall = 1;
                this.label.textContent = "Wall: Yes";
                MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].endzone = 0;
                UserInterface.setToggleState(btn_endzone, false);
                btn_endzone.label.textContent = "End Zone: No";
            }

            this.classList.toggle("toggled");
        };

        const btn_endzone = getByID("btn_endzone");
        btn_endzone.label = btn_endzone.querySelector(".label");
        btn_endzone.func = function () {
            if (this.classList.contains("toggled")) {
                // make platform NOT endzone
                MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].endzone = 0;
                this.label.textContent = "End Zone: No";
            } else {
                // make platform endzone
                MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].endzone = 1;
                this.label.textContent = "End Zone: Yes";
                MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].wall = 0;
                UserInterface.setToggleState(btn_wall, false);
                btn_wall.label.textContent = "Wall: No";
            }

            this.classList.toggle("toggled");
        };

        const btn_duplicateElements = getByID("btn_duplicateElements");
        btn_duplicateElements.func = () => {
            let originPlatform = {
                x: null,
                y: null,
            };

            for (const element of MapEditor.selectedElements) {
                // only run for platforms
                if (element != "playerStart" && !Array.isArray(element)) {
                    const newPlatform = { ...MapEditor.loadedMap.platforms[element] }; // get selected platform. spread syntax creates a shallow copy that doesn not link/reference

                    if (originPlatform.x == null) {
                        // set origin platform if none set yet
                        originPlatform.x = MapEditor.loadedMap.platforms[element].x;
                        originPlatform.y = MapEditor.loadedMap.platforms[element].y;
                    }

                    const offsetFromOriginPlatformX = MapEditor.loadedMap.platforms[element].x - originPlatform.x;
                    const offsetFromOriginPlatformY = MapEditor.loadedMap.platforms[element].y - originPlatform.y;

                    newPlatform.x = Math.round(MapEditor.screen.x) + offsetFromOriginPlatformX; // center it
                    newPlatform.y = Math.round(MapEditor.screen.y) + offsetFromOriginPlatformY;
                    MapEditor.loadedMap.platforms.push(newPlatform); // add platform

                    // deal with selections
                    if (MapEditor.multiSelect) {
                        MapEditor.selectedElements[MapEditor.selectedElements.indexOf(element)] = MapEditor.loadedMap.platforms.length - 1;
                    } else {
                        MapEditor.selectedElements = [MapEditor.loadedMap.platforms.length - 1];
                    }
                }
            }

            if (MapEditor.selectedElements.length == 1) {
                // only need to sync buttons and sliders in single select
                UserInterface.setSliderValue(btn_platformAngleSlider, MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].angle, true);

                // should abstract this stuff to somewhere else -- it is duplicated in a few places
                const isWall = MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].wall;
                UserInterface.setToggleState(btn_wall, isWall);
                btn_wall.label.textContent = isWall ? "Wall: Yes" : "Wall: No";

                const isEndZone = MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].endzone;
                UserInterface.setToggleState(btn_endzone, isEndZone);
                btn_endzone.label.textContent = isEndZone ? "End Zone: Yes" : "End Zone: No";
            }

            this.updateMapEditorSidePanel();
        };

        const btn_deleteElements = getByID("btn_deleteElements");
        btn_deleteElements.func = () => {
            for (const element of MapEditor.selectedElements) {
                // loop through and delete
                if (Array.isArray(element)) {
                    // delete checkpoint

                    MapEditor.loadedMap.checkpoints[element[0]] = "remove"; // set a placeholder which will be removed by .filter
                } else if (element != "playerStart") {
                    // delete platform but DONT delete playerStart

                    MapEditor.loadedMap.platforms[element] = "remove"; // set a placeholder which will be removed by .filter
                }
            }

            MapEditor.loadedMap.checkpoints = MapEditor.loadedMap.checkpoints.filter((checkpoint) => checkpoint != "remove");
            MapEditor.loadedMap.platforms = MapEditor.loadedMap.platforms.filter((platform) => platform != "remove");

            MapEditor.selectedElements = []; // No selected elements after delete
            UserInterface.switchToUiGroup(UserInterface.uiGroup_mapEditorInterface);
        };

        const ui_dragSelectMarquee = getByID("ui_dragSelectMarquee");

        // ======================
        //  MAP SETTINGS SLIDERS
        // ======================

        const btn_platformHeightSlider = getByID("btn_platformHeightSlider");
        btn_platformHeightSlider.labelValue = btn_platformHeightSlider.querySelector(".label > span");
        btn_platformHeightSlider.handle = btn_platformHeightSlider.querySelector(".handle");
        btn_platformHeightSlider.func = function () {
            MapEditor.loadedMap.style.platformHeight = UserInterface.getSliderValue(this);
            PreviewWindow.update();
        };

        const btn_wallHeightSlider = getByID("btn_wallHeightSlider");
        btn_wallHeightSlider.labelValue = btn_wallHeightSlider.querySelector(".label > span");
        btn_wallHeightSlider.handle = btn_wallHeightSlider.querySelector(".handle");
        btn_wallHeightSlider.func = function () {
            MapEditor.loadedMap.style.wallHeight = UserInterface.getSliderValue(this);
            PreviewWindow.update();
        };

        const btn_lightDirectionSlider = getByID("btn_lightDirectionSlider");
        btn_lightDirectionSlider.labelValue = btn_lightDirectionSlider.querySelector(".label > span");
        btn_lightDirectionSlider.handle = btn_lightDirectionSlider.querySelector(".handle");
        btn_lightDirectionSlider.func = function () {
            MapEditor.loadedMap.style.lightDirection = UserInterface.getSliderValue(this);
            PreviewWindow.update();
        };

        const btn_lightPitchSlider = getByID("btn_lightPitchSlider");
        btn_lightPitchSlider.labelValue = btn_lightPitchSlider.querySelector(".label > span");
        btn_lightPitchSlider.handle = btn_lightPitchSlider.querySelector(".handle");
        btn_lightPitchSlider.func = function () {
            MapEditor.loadedMap.style.lightPitch = UserInterface.getSliderValue(this);
            PreviewWindow.update();
        };

        // ==================
        //  MAP COLOR PICKER
        // ==================

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

        const btn_backgroundColor = getByID("btn_backgroundColor");
        btn_backgroundColor.func = () => {
            ColorPicker.editingElement = 1;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState2);
            ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.backgroundColor);
            ColorPicker.updateSliders();
            ColorPicker.syncGradients();
        };

        const btn_playerColor = getByID("btn_playerColor");
        btn_playerColor.func = () => {
            ColorPicker.editingElement = 2;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState2);
            ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.playerColor);
            ColorPicker.updateSliders();
            ColorPicker.syncGradients();
        };

        const btn_directLightColor = getByID("btn_directLightColor");
        btn_directLightColor.func = () => {
            ColorPicker.editingElement = 9;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState2);
            ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.directLight);
            ColorPicker.updateSliders();
            ColorPicker.syncGradients();
        };

        const btn_ambientLightColor = getByID("btn_ambientLightColor");
        btn_ambientLightColor.func = () => {
            ColorPicker.editingElement = 10;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState2);
            ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.ambientLight);
            ColorPicker.updateSliders();
            ColorPicker.syncGradients();
        };

        const btn_wallTopColor = getByID("btn_wallTopColor");
        btn_wallTopColor.func = () => {
            ColorPicker.editingElement = 5;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState2);
            ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.wallTopColor);
            ColorPicker.updateSliders();
            ColorPicker.syncGradients();
        };

        const btn_wallSideColor = getByID("btn_wallSideColor");
        btn_wallSideColor.func = () => {
            ColorPicker.editingElement = 6;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState2);
            ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.wallSideColor);
            ColorPicker.updateSliders();
            ColorPicker.syncGradients();
        };

        const btn_platformTopColor = getByID("btn_platformTopColor");
        btn_platformTopColor.func = () => {
            ColorPicker.editingElement = 3;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState2);
            ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.platformTopColor);
            ColorPicker.updateSliders();
            ColorPicker.syncGradients();
        };

        const btn_platformSideColor = getByID("btn_platformSideColor");
        btn_platformSideColor.func = () => {
            ColorPicker.editingElement = 4;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState2);
            ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.platformSideColor);
            ColorPicker.updateSliders();
            ColorPicker.syncGradients();
        };

        const btn_endZoneTopColor = getByID("btn_endZoneTopColor");
        btn_endZoneTopColor.func = () => {
            ColorPicker.editingElement = 7;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState2);
            ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.endZoneTopColor);
            ColorPicker.updateSliders();
            ColorPicker.syncGradients();
        };

        const btn_endZoneSideColor = getByID("btn_endZoneSideColor");
        btn_endZoneSideColor.func = () => {
            ColorPicker.editingElement = 8;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState2);
            ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.endZoneSideColor);
            ColorPicker.updateSliders();
            ColorPicker.syncGradients();
        };

        const btn_syncWallColors = getByID("btn_syncWallColors");
        btn_syncWallColors.label = btn_syncWallColors.querySelector(".label");
        btn_syncWallColors.func = function () {
            if (this.classList.contains("toggled")) {
                // make colors NOT synced
                ColorPicker.lockWallColors = false;
            } else {
                // make colors synced
                ColorPicker.lockWallColors = true;
                MapEditor.loadedMap.style.wallSideColor = MapEditor.loadedMap.style.wallTopColor;
                PreviewWindow.update();
                ColorPicker.updateButtonColors();
            }
            this.classList.toggle("toggled");
        };

        const btn_syncPlatformColors = getByID("btn_syncPlatformColors");
        btn_syncPlatformColors.label = btn_syncPlatformColors.querySelector(".label");
        btn_syncPlatformColors.func = function () {
            if (this.classList.contains("toggled")) {
                // make colors NOT synced
                ColorPicker.lockPlatformColors = false;
            } else {
                // make colors synced
                ColorPicker.lockPlatformColors = true;
                MapEditor.loadedMap.style.platformSideColor = MapEditor.loadedMap.style.platformTopColor;
                PreviewWindow.update();
                ColorPicker.updateButtonColors();
            }
            this.classList.toggle("toggled");
        };

        const btn_syncEndZoneColors = getByID("btn_syncEndZoneColors");
        btn_syncEndZoneColors.label = btn_syncEndZoneColors.querySelector(".label");
        btn_syncEndZoneColors.func = function () {
            if (this.classList.contains("toggled")) {
                // make colors NOT synced
                ColorPicker.lockEndzoneColors = false;
            } else {
                // make colors synced
                ColorPicker.lockEndzoneColors = true;
                MapEditor.loadedMap.style.endZoneSideColor = MapEditor.loadedMap.style.endZoneTopColor;
                PreviewWindow.update();
                ColorPicker.updateButtonColors();
            }
            this.classList.toggle("toggled");
        };

        // MAP COLORS 2ND SCREEN
        const ui_colorPicker = getByID("ui_colorPicker");

        const btn_unselectColor = getByID("btn_unselectColor");
        btn_unselectColor.func = () => {
            UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState1);
            ColorPicker.editingElement = 0;
            ColorPicker.updateButtonColors();
        };

        const btn_copyColor = getByID("btn_copyColor");
        btn_copyColor.func = () => {
            ColorPicker.copyColor();
        };

        const btn_pasteColor = getByID("btn_pasteColor");
        btn_pasteColor.func = () => {
            ColorPicker.pasteColor();
        };

        const btn_hueSlider = getByID("btn_hueSlider");
        btn_hueSlider.labelValue = btn_hueSlider.querySelector(".label > span");
        btn_hueSlider.handle = btn_hueSlider.querySelector(".handle");
        btn_hueSlider.func = function () {
            const value = UserInterface.getSliderValue(this);
            ColorPicker.h = value;
            ui_colorPicker.style.setProperty("--h", `${value}`);
            ColorPicker.updateElementColor();
            if (ColorPicker.editingElement == 1 || ColorPicker.editingElement == 9 || ColorPicker.editingElement == 10) {
                UserInterface.determineButtonColor();
            }
        };

        const btn_saturationSlider = getByID("btn_saturationSlider");
        btn_saturationSlider.labelValue = btn_saturationSlider.querySelector(".label > span");
        btn_saturationSlider.handle = btn_saturationSlider.querySelector(".handle");
        btn_saturationSlider.func = function () {
            const value = UserInterface.getSliderValue(this);
            ColorPicker.s = value;
            ui_colorPicker.style.setProperty("--s", `${value}%`);
            ColorPicker.updateElementColor();
            if (ColorPicker.editingElement == 1 || ColorPicker.editingElement == 9 || ColorPicker.editingElement == 10) {
                UserInterface.determineButtonColor();
            }
        };

        const btn_lightnessSlider = getByID("btn_lightnessSlider");
        btn_lightnessSlider.labelValue = btn_lightnessSlider.querySelector(".label > span");
        btn_lightnessSlider.handle = btn_lightnessSlider.querySelector(".handle");
        btn_lightnessSlider.func = function () {
            const value = UserInterface.getSliderValue(this);
            ColorPicker.l = value;
            ui_colorPicker.style.setProperty("--l", `${value}%`);
            ColorPicker.updateElementColor();
            if (ColorPicker.editingElement == 1 || ColorPicker.editingElement == 9 || ColorPicker.editingElement == 10) {
                UserInterface.determineButtonColor();
            }
        };

        const ui_saturationGradient = getByID("ui_saturationGradient");
        const ui_lightnessGradient = getByID("ui_lightnessGradient");

        // ===========
        //  UI GROUPS
        // ===========
        this.uiGroup_mainMenu = new Set([getByID("main-title"), btn_play, btn_settings, btn_mapEditor, getByID("menu-background")]);
        this.uiGroup_settings = new Set([btn_mainMenu, btn_sensitivitySlider, btn_volumeSlider, btn_debugText, btn_strafeHUD, btn_resetSettings]);
        this.uiGroup_standardMapBrowser = new Set([
            btn_mainMenu,
            btn_customMaps,
            ui_mapInfoBox,
            // btn_playMap, // added dynamically
            // btn_playTutorial, // added dynamically
            getByID("map-list-container"),
            btn_level_awakening,
            btn_level_pitfall,
            btn_level_cavernAbyss,
            btn_level_crystals,
            btn_level_surfacing,
            btn_level_wheatFields,
            btn_level_trespass,
            btn_level_turmoil,
            btn_level_tangledForest,
            btn_level_pinnacle,
            btn_level_moonlight,
            btn_level_rapture,
            btn_level_forever,
        ]);
        this.uiGroup_customMapBrowser = new Set([
            btn_mainMenu,
            getByID("custom-map-browser-info"),
            ui_mapInfoBox,
            getByID("custom-map-list-container"),
        ]);
        this.uiGroup_inLevel = new Set([
            ui_speedometer,
            ui_jumpStats,
            ui_timerBox,
            // ui_strafeHelper,
            // ui_restartWarning,
            ui_warningContainer,
            // ui_verticalWarning,
            // ui_overstrafeWarning, // broken
            btn_mainMenu,
            btn_restart,
            btn_jump,
        ]);
        this.uiGroup_endScreen = new Set([ui_speedometer, btn_mainMenu, btn_restart, btn_jump, ui_endScreen]);

        this.uiGroup_mapEditorMapBrowser = new Set([btn_mainMenu, getByID("custom-map-list-container"), ui_mapInfoBox, btn_newMap, btn_importMap]);

        this.uiGroup_mapEditorInterface = new Set([
            btn_exitMapEditor,
            btn_addPlatform,
            btn_addCheckpoint,
            btn_mapSettings,
            btn_mapColors,
            btn_dragSelect,
            btn_multiSelect,
            btn_snappingSlider,
        ]);
        this.uiGroup_editPlatform = new Set([
            btn_exitMapEditor,
            btn_dragSelect,
            btn_multiSelect,
            btn_snappingSlider,
            btn_translate,
            btn_resize_BL,
            btn_resize_BR,
            btn_resize_TR,
            btn_resize_TL,
            ui_editorSidePanel,
            btn_unselect,
            btn_platformAngleSlider,
            btn_wall,
            btn_endzone,
            btn_deleteElements,
            btn_duplicateElements,
        ]);
        this.uiGroup_editPlayerStart = new Set([
            btn_exitMapEditor,
            btn_dragSelect,
            btn_multiSelect,
            btn_translate,
            btn_snappingSlider,
            ui_editorSidePanel,
            btn_unselect,
            btn_playerAngleSlider,
        ]);
        this.uiGroup_editCheckpoint = new Set([
            btn_exitMapEditor,
            btn_dragSelect,
            btn_multiSelect,
            btn_translate,
            btn_snappingSlider,
            ui_editorSidePanel,
            btn_unselect,
            btn_checkpointAngleSlider,
            btn_deleteElements,
        ]);
        this.uiGroup_editMultiSelect = new Set([
            btn_exitMapEditor,
            btn_dragSelect,
            btn_multiSelect,
            btn_translate,
            btn_snappingSlider,
            ui_editorSidePanel,
            btn_unselect,
            btn_deleteElements,
            btn_duplicateElements,
        ]);

        this.uiGroup_colorPickerState1 = new Set([
            btn_mainMenu,
            getByID("ui_colorPicker_walls"),
            getByID("ui_colorPicker_platforms"),
            getByID("ui_colorPicker_endZones"),
            btn_backgroundColor,
            btn_playerColor,
            btn_wallTopColor,
            btn_wallSideColor,
            btn_platformTopColor,
            btn_platformSideColor,
            btn_endZoneTopColor,
            btn_endZoneSideColor,
            btn_directLightColor,
            btn_ambientLightColor,

            btn_syncWallColors,
            btn_syncPlatformColors,
            btn_syncEndZoneColors,
        ]);
        this.uiGroup_colorPickerState2 = new Set([
            ui_colorPicker,
            btn_unselectColor,
            btn_copyColor,
            btn_pasteColor,
            btn_hueSlider,
            btn_saturationSlider,
            btn_lightnessSlider,
        ]);
        this.uiGroup_mapSettings = new Set([
            btn_mainMenu,
            btn_platformHeightSlider,
            btn_wallHeightSlider,
            btn_lightDirectionSlider,
            btn_lightPitchSlider,
        ]);

        this.activeUiGroup = new Set();
        this.switchToUiGroup(UserInterface.uiGroup_mainMenu);
    },

    getMedals: async function () {
        // FIX this can just be an const object instead of a seperate file.

        // Get level's medal times directly through cordova local storage (www)
        const medalData = await readFile("local", "assets/", "medals.json", "text");
        this.medals = JSON.parse(medalData);
    },

    getSettings: async function () {
        let loadedSettings = {};

        try {
            const settingsData = await readFile("device", "", "settings.json", "text");

            if (settingsData) {
                loadedSettings = JSON.parse(settingsData);
            }
        } catch (error) {
            // File missing or parsing error -> fall back to defaults
            console.log("Using default settings", error);
        }

        // properties in settings will be overwritten by any properties in loadedSettings.
        this.settings = {
            ...this.settings, // spread syntax
            ...loadedSettings,
        };

        this.writeSettings();

        // Sync UI
        this.setSliderValue(btn_sensitivitySlider, this.settings.sensitivity);
        this.setSliderValue(btn_volumeSlider, this.settings.volume);
        this.setToggleState(btn_debugText, this.settings.debugText);
        this.setToggleState(btn_strafeHUD, this.settings.strafeHUD);
        this.setToggleState(btn_playTutorial, this.settings.playTutorial);

        AudioHandler.setVolume(this.settings.volume);

        // unhiding or hiding debug text (doesnt get added to activeGroup so it never gets switched off)
        ui_debugText.classList.toggle("hidden", !this.settings.debugText);
    },

    writeSettings: function () {
        const settingsBlob = new Blob([JSON.stringify(this.settings, null, 2)], { type: "application/json" });
        writeFile("settings.json", settingsBlob);
    },

    getRecords: async function () {
        try {
            const recordsData = await readFile("device", "", "records.json", "text");
            this.records = JSON.parse(recordsData);
        } catch (error) {
            if (error == "Failed to getFile: 1") {
                // file doesnt exist

                // records.json doesn't exist , initialize empty records file
                this.records = {
                    unlocked: 1,
                };
                this.writeRecords(); // Write the default empty records to file
            } else {
                console.error("Error while getting records:", error);
            }
        }
    },

    writeRecords: function () {
        const recordsBlob = new Blob([JSON.stringify(this.records, null, 2)], { type: "application/json" });
        writeFile("records.json", recordsBlob);
    },

    handleRecord: function () {
        const record = this.records[Map.name];

        if (record == null || (record !== null && this.timer < record)) {
            this.previousRecord = record == null ? 0 : this.records[Map.name]; // save previous record
            this.records[Map.name] = this.timer;
            this.writeRecords();

            // update record text in timer box
            ui_timerBox.children[1].textContent = `Record: ${this.secondsToMinutes(this.records[Map.name] == null ? 0 : this.records[Map.name])}`;
        }
    },

    checkCustomMapsDirectoryExists: function () {
        window.resolveLocalFileSystemURL(
            cordova.file.dataDirectory + "maps",
            function (dirEntry) {
                // Directory exists, you can now use dirEntry
                console.log("Custom maps directory exists:", dirEntry);
            },
            function (err) {
                // Directory doesn't exist, attempt to create it
                console.error("Custom maps directory does NOT exist:", err);

                // Create the directory
                window.resolveLocalFileSystemURL(
                    cordova.file.dataDirectory,
                    function (dirEntry) {
                        dirEntry.getDirectory(
                            "maps",
                            { create: true },
                            function (newDirEntry) {
                                console.log("Created maps directory:", newDirEntry);
                            },
                            function (err) {
                                console.error("Error creating maps directory:", err);
                            },
                        );
                    },
                    function (err) {
                        console.error("Error resolving data directory for creating /maps:", err);
                    },
                );
            },
        );
    },

    // Slider Get, Set, & updateDraggedSlider Functions

    setSliderValue: function (slider, value, unsnapped = false) {
        const min = parseFloat(slider.dataset.min);
        const max = parseFloat(slider.dataset.max);
        const step = parseFloat(slider.dataset.step) || 1;

        // Clamp input value to [min, max]
        const clamped = Math.min(Math.max(value, min), max);

        // Snap to nearest step unless unsnapped is true or value was clamped by min or max
        let stepSnapped;
        if (unsnapped || clamped != value) {
            // if override-snapping || if value was clamped
            stepSnapped = clamped;
        } else {
            stepSnapped = Math.round(clamped / step) * step;
            // Snap is relative to zero NOT min value
            // This snaps relative to min value: Math.round((clamped - min) / step) * step + min;
        }

        // Determine what decimal precision should be used based on step's precision
        const decimalPointsToUse = slider.dataset.step?.split(".")[1]?.length || 0;

        // Round to correct decimal precision (numeric form)
        let stepSnappedRoundedNum = parseFloat(stepSnapped.toFixed(decimalPointsToUse));

        // 5. Re-clamp after rounding to avoid edge overflow
        stepSnappedRoundedNum = Math.min(Math.max(stepSnappedRoundedNum, min), max);

        // Create string version for display (preserving decimal precision)
        const stepSnappedRoundedStr = stepSnappedRoundedNum.toFixed(decimalPointsToUse);

        // Update dataset and label
        slider.dataset.value = stepSnappedRoundedNum; // numeric for internal logic
        slider.labelValue.textContent = stepSnappedRoundedStr; // formatted for display

        // Convert to % of range for styling
        const percent = ((stepSnappedRoundedNum - min) / (max - min)) * 100;
        slider.handle.style.setProperty("--pos", `${percent}%`);
    },

    getSliderValue: function (slider) {
        return parseFloat(slider.dataset.value);
    },

    // called every frame when sliders are on screen
    updateDraggedSlider: function (slider) {
        const sliderRect = slider.getBoundingClientRect();
        const slidersTouchID = Number(slider.dataset.touchid);
        const touch = TouchHandler.touches.find((touch) => touch.identifier === slidersTouchID);

        const value = mapToRange(touch.x, sliderRect.left, sliderRect.right, Number(slider.dataset.min), Number(slider.dataset.max));

        this.setSliderValue(slider, value);
    },

    // Toggle Button Get and Set Functions

    getToggleState: function (toggleButton) {
        return toggleButton.classList.contains("toggled");
    },

    setToggleState: function (toggleButton, state) {
        if (state) {
            toggleButton.classList.add("toggled");
        } else {
            toggleButton.classList.remove("toggled");
        }
    },

    // For the 2 Map Editor Platform Manipulation Button Position Functions
    setGizmoBtnPos: function (button, xPosForMiddleOfBtn, yPosForMiddleOfBtn) {
        const buttonRect = button.getBoundingClientRect();
        button.style.left = `${xPosForMiddleOfBtn - buttonRect.width / 2}px`;
        button.style.top = `${yPosForMiddleOfBtn - buttonRect.height / 2}px`;
    },

    getGizmoBtnPos: function (button) {
        const buttonRect = button.getBoundingClientRect();
        return {
            x: buttonRect.x + buttonRect.width / 2,
            y: buttonRect.y + buttonRect.height / 2,
        };
    },

    determineButtonColor: function () {
        let bgColor = CanvasArea.canvas.style.backgroundColor; // returns rgba string

        bgColor = bgColor.replace(/[^\d,.]/g, "").split(",");

        const luminance = (0.299 * bgColor[0] + 0.587 * bgColor[1] + 0.114 * bgColor[2]) / 255;
        // luminance = (0.299 * R + 0.587 * G + 0.114 * B)/255
        // console.log("luminance: " + luminance)

        this.darkMode = luminance > 0.77 ? true : false; // can kill once darkMode is not used by any of the old UI system (map editor highlighting etc.)

        const modeString = this.darkMode ? "dark" : "light";
        this.updateUiColorMode(modeString);
    },

    updateUiColorMode: function (mode) {
        // mode = "light" or "dark'

        if (mode == "dark") {
            const root = document.documentElement.style;
            root.setProperty("--uiForegroundColor", "var(--lightColor_1)");
            root.setProperty("--uiForegroundColor_pressed", "var(--lightColor_2)");
            root.setProperty("--uiBackgroundColor", "var(--darkColor_1)");
            root.setProperty("--uiBackgroundColor_pressed", "var(--darkColor_2)");
        } else if (mode == "light") {
            const root = document.documentElement.style;
            root.setProperty("--uiForegroundColor", "var(--darkColor_1)");
            root.setProperty("--uiForegroundColor_pressed", "var(--darkColor_2)");
            root.setProperty("--uiBackgroundColor", "var(--lightColor_1)");
            root.setProperty("--uiBackgroundColor_pressed", "var(--lightColor_2)");
        } else {
            console.log("Invalid updateUiColorMode parameter. Should be 'light' or 'dark'.");
        }
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

    switchToUiGroup: function (newUiGroup) {
        // uiGroups need to be Sets()

        for (const element of this.activeUiGroup) {
            if (!newUiGroup.has(element)) {
                element.classList.add("hidden");
            }
        }

        for (const element of newUiGroup) {
            element.classList.remove("hidden");
        }

        this.activeUiGroup = newUiGroup;
    },

    removeUiElement: function (uiElement) {
        this.activeUiGroup.delete(uiElement);
        uiElement.classList.add("hidden");
    },

    addUiElement: function (uiElement) {
        this.activeUiGroup.add(uiElement);
        uiElement.classList.remove("hidden");
    },

    isPointInsideElement: function (x, y, element) {
        const rect = element.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    },

    touchStarted: function (x, y, id) {
        // Called By TouchHandler
        // items that dont need interaction should have pointerevents:none in css so they dont block touches.

        const hit = document.elementFromPoint(x, y);
        if (!hit) return;

        for (const uiElement of this.activeUiGroup) {
            if (!uiElement.contains(hit)) continue; // skip to next uiElement in loop

            // buttons & toggles
            if (uiElement.nodeName.toLowerCase() === "button" || uiElement.classList.contains("toggle-container")) {
                uiElement.classList.add("pressed");
            }

            // sliders
            if (uiElement.classList.contains("slider")) {
                if (uiElement.handle.contains(hit)) {
                    uiElement.handle.classList.add("pressed");
                    uiElement.dataset.touchid = id;
                }
            }
        }

        if (this.gamestate == 6 && this.levelState !== 3) {
            this.addUiElement(ui_strafeHelper);
        }
    },

    touchReleased: function (x, y, id) {
        // Called By TouchHandler

        // run button's function if clicked
        // run MapEditor.touchRelease if active and no buttons are pressed

        const hit = document.elementFromPoint(x, y);
        let editorIgnoreRelease = false;

        for (const uiElement of this.activeUiGroup) {
            // BUTTONS & TOGGLES
            if (uiElement.nodeName.toLowerCase() === "button" || uiElement.classList.contains("toggle-container")) {
                const isPressed = uiElement.classList.contains("pressed");
                const isUnderFinger = hit && uiElement.contains(hit);

                if (isPressed && isUnderFinger && (MapBrowser.scrollVel == 0 || MapBrowser.scrollAmount == null) && MapEditor.dragSelect == false) {
                    uiElement.func();
                    editorIgnoreRelease = true;
                }

                uiElement.classList.remove("pressed");
            }

            // SLIDERS (capture-based)
            else if (uiElement.classList.contains("slider") && Number(uiElement.dataset.touchid) === id) {
                uiElement.func();
                uiElement.handle.classList.remove("pressed");
                uiElement.dataset.touchid = null;
                editorIgnoreRelease = true;
            }
        }

        // IN-LEVEL hide ui_strafeHelper
        if (this.gamestate == 6) {
            if (TouchHandler.touches.length === 0) {
                UserInterface.removeUiElement(ui_strafeHelper);
            }
        }

        // In MapEditor and no button was pressed -> pass touch onto MapEditor's logic checks
        if (editorIgnoreRelease === false && UserInterface.gamestate == 7 && (MapEditor.editorState == 1 || MapEditor.editorState == 2)) {
            MapEditor.touchReleased(x, y);
        }
    },

    activateEndScreen: function () {
        // called when player.endslow reaches 0 at end of level

        this.switchToUiGroup(this.uiGroup_endScreen); // removes strafeHelper and timerBox

        // Update Endscreen with all necessary information
        ui_endScreen.querySelector(".mapName").textContent = Map.name;

        const yourTimeInSeconds = this.secondsToMinutes(this.timer);
        ui_endScreen.querySelector(".yourTime").textContent = `${yourTimeInSeconds}`;

        // map records is set immediately after completion so if timer == map.record it means it was a new record
        if (this.timer == this.records[Map.name]) {
            // new record text
            ui_endScreen.querySelector(".yourRecord").textContent = `New Record!  -(${this.secondsToMinutes(
                Math.abs(this.previousRecord - this.records[Map.name]),
            )})`;
        } else {
            // display normal record
            ui_endScreen.querySelector(".yourRecord").textContent = `Best Time: ${this.secondsToMinutes(this.records[Map.name])}`;
        }

        // update medal times and activeMedal OR hide medal list
        const mapMedal = this.medals[Map.name];
        if (mapMedal !== undefined) {
            ui_endScreen.querySelector(".medalList").classList.remove("hidden");

            const goldMedal = ui_endScreen.querySelector(".gold");
            const silverMedal = ui_endScreen.querySelector(".silver");
            const bronzeMedal = ui_endScreen.querySelector(".bronze");

            // update times
            goldMedal.textContent = this.secondsToMinutes(mapMedal.gold);
            silverMedal.textContent = this.secondsToMinutes(mapMedal.silver);
            bronzeMedal.textContent = this.secondsToMinutes(mapMedal.bronze);

            // remove activeMedal from all
            goldMedal.classList.remove("activeMedal");
            silverMedal.classList.remove("activeMedal");
            bronzeMedal.classList.remove("activeMedal");

            // set activeMedal
            if (this.timer <= mapMedal.gold) {
                goldMedal.classList.add("activeMedal");
            } else if (this.timer <= mapMedal.silver) {
                silverMedal.classList.add("activeMedal");
            } else if (this.timer <= mapMedal.bronze) {
                bronzeMedal.classList.add("activeMedal");
            }
        } else {
            // No medals -> hide medal list
            ui_endScreen.querySelector(".medalList").classList.add("hidden");
        }
    },

    updateMapEditorSidePanel: function () {
        // called when:
        // translate and resize buttons are dragged
        // platform or checkpoint or playerStart get selected or drag select ends (MapEditor.touchReleased)
        // items are duplicated, or added platform or added checkpoint

        if (MapEditor.multiSelect && MapEditor.selectedElements.length > 1) {
            // Multiple elements selected

            ui_elementTitle.textContent = `Group Selection`;

            const countData = MapEditor.indexSelectedElements();
            let lines = [];
            if (countData.platforms > 0) {
                lines.push(`Platforms: ${countData.platforms}`);
            }
            if (countData.walls > 0) {
                lines.push(`Walls: ${countData.walls}`);
            }
            if (countData.endZones > 0) {
                lines.push(`End Zones: ${countData.endZones}`);
            }
            if (countData.checkpoints > 0) {
                lines.push(`Checkpoints: ${countData.checkpoints}`);
            }
            if (countData.playerStart > 0) {
                lines.push(`Player Start: ${countData.playerStart}`);
            }
            ui_elementInfo.innerHTML = lines.join("<br>");

            return;
        }

        if (MapEditor.selectedElements[0] == "playerStart") {
            // playerStart is selected
            ui_elementTitle.textContent = `Player Start`;
            ui_elementInfo.textContent = `Position: ${MapEditor.loadedMap.playerStart.x}, ${MapEditor.loadedMap.playerStart.y}`;

            return;
        }

        if (Array.isArray(MapEditor.selectedElements[0])) {
            // checkpoint is selected
            ui_elementTitle.textContent = `Checkpoint`;

            ui_elementInfo.innerHTML = `
                Trigger 1: 
                ${MapEditor.loadedMap.checkpoints[MapEditor.selectedElements[0][0]].triggerX1}, 
                ${MapEditor.loadedMap.checkpoints[MapEditor.selectedElements[0][0]].triggerY1}
                <br>
                Trigger 2: ${MapEditor.loadedMap.checkpoints[MapEditor.selectedElements[0][0]].triggerX2}, 
                ${MapEditor.loadedMap.checkpoints[MapEditor.selectedElements[0][0]].triggerY2}
                <br>
                Respawn: ${MapEditor.loadedMap.checkpoints[MapEditor.selectedElements[0][0]].x}, 
                ${MapEditor.loadedMap.checkpoints[MapEditor.selectedElements[0][0]].y}
            `.trim();

            return;
        }

        // platform is selected
        ui_elementTitle.textContent = `Platform`;

        const approxSignX = MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].x % 1 == 0 ? "" : "~";
        const approxSignY = MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].y % 1 == 0 ? "" : "~";

        ui_elementInfo.innerHTML = `
            Position: 
            ${approxSignX}${Math.round(MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].x)}, 
            ${approxSignY}${Math.round(MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].y)}
            <br>
            Size: 
            ${MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].width}, 
            ${MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].height}
        `.trim();
    },

    shareMap: async function () {
        try {
            const mapIndex = MapBrowser.selectedMapIndex;
            const mapDataRaw = await readFile("device", "maps/", mapIndex + ".json", "text");

            const shareData = {
                title: `Map ${mapIndex}`,
                text: mapDataRaw,
            };

            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                    console.log("Map shared successfully.");
                    return;
                } catch (shareErr) {
                    if (shareErr.name === "AbortError" || shareErr.message.includes("cancel")) {
                        console.log("Share canceled by user.");
                        return; // Silently exit on cancel
                    }
                    console.warn("Share failed unexpectedly:", shareErr);
                    // fall through to clipboard
                }
            }

            if (navigator.clipboard) {
                await navigator.clipboard.writeText(mapDataRaw);
                alert("Map data copied to clipboard.");
            }
        } catch (err) {
            console.error("Sharing failed entirely:", err);
            alert("Something went wrong while trying to share your map.");
        }
    },

    update: function () {
        // gamestate:
        // 1: main menu
        // 2: level select map browser
        // 3: settings
        // 4: store
        // 5: loading map page
        // 6: in level
        // 7: in map editor

        // update dragged Sliders every frame
        // sliders are only in Settings Page and MapEditor Pages
        if (this.gamestate == 3 || MapEditor.loadedMap) {
            // Live update position of handle if slider is being dragged
            for (const uiElement of this.activeUiGroup) {
                if (uiElement.classList.contains("slider")) {
                    if (uiElement.handle.classList.contains("pressed")) {
                        this.updateDraggedSlider(uiElement);
                    }
                }
            }
        }

        // In Level
        if (this.gamestate == 6) {
            if (this.levelState == 1 || this.levelState == 2) {
                if (TouchHandler.dragging) {
                    ui_strafeHelper.func();

                    // Calculate whether to DRAW VERTICAL WARNING
                    // Overstrafe Warning is in Player.update() code
                    if (!Tutorial.pausePlayer) {
                        const averageX = Math.abs(TouchHandler.averageDragX.getAverage());
                        const averageY = Math.abs(TouchHandler.averageDragY.getAverage());
                        if (averageY > (5 * 1) / 60 / dt && averageY > averageX * 1.25) {
                            if (this.showVerticalWarning == false) {
                                this.addUiElement(ui_verticalWarning);
                                this.showVerticalWarning = true;
                                setTimeout(() => {
                                    this.removeUiElement(ui_verticalWarning);
                                    this.showVerticalWarning = false;
                                }, 1500); // waits 1.5 seconds to hide warning
                            }
                        }
                    }
                }

                // Update Timer Box's Text
                if (Tutorial.isActive == false) {
                    ui_timerBox.children[0].textContent = `Time: ${UserInterface.secondsToMinutes(this.timer)}`;
                    // record text is set once during Map.initMap()
                }
            }

            if (this.levelState == 2) {
                if (!Tutorial.pausePlayer) {
                    // player is NOT paused
                    this.timer = Date.now() - this.timerStart;

                    // Update Speed Text. ADD COLOR AND SIZE CHANGES TO THIS BASED OFF OF GAIN

                    const currentSpeed = Math.round(Player.velocity.magnitude());
                    this.speedAverager.pushValue(currentSpeed);
                    const averageSpeed = this.speedAverager.getAverage();

                    // Calculate the difference to determine acceleration or deceleration
                    const deltaSpeed = currentSpeed - averageSpeed;

                    let arrow;

                    // FIX or KILL this stuff ^ v
                    // Update style based on speed change
                    // if (deltaSpeed > 0) {
                    //     // Accelerating: scale up text and tint green
                    //     arrow = deltaSpeed > 10 ? "▲" : "";
                    //     //const scale = 1 + Math.min(deltaSpeed / 50, 0.5); // adjust 20 & 0.5 for effect
                    //     const scale = 1 + deltaSpeed / 70;
                    //     const greenIntensity = Math.min(deltaSpeed * 10, 255); // clamp at 255
                    //     ui_speedometer.style.color = `rgb(${255 - greenIntensity},255, ${255 - greenIntensity})`;
                    //     ui_speedometer.style.transform = `translate(-50%, -50%) scale(${scale})`;
                    // } else if (deltaSpeed < 0) {
                    //     // Decelerating: tint red
                    //     arrow = deltaSpeed < 10 ? "▼" : "";
                    //     const redIntensity = Math.min(-deltaSpeed * 10, 255); // clamp at 255
                    //     ui_speedometer.style.color = `rgb(255, ${255 - redIntensity}, ${255 - redIntensity})`;
                    //     ui_speedometer.style.transform = `translate(-50%, -50%) scale(1)`; // default size
                    // } else {
                    //     // No change
                    //     ui_speedometer.style.color = "white";
                    //     ui_speedometer.style.transform = "translate(-50%, -50%) scale(1)";
                    //     arrow = "";
                    // }

                    // ui_speedometer.textContent = `Speed: ${Math.round(Player.velocity.magnitude())} ${arrow}`;
                    ui_speedometer.textContent = `Speed: ${Math.round(Player.velocity.magnitude())}`; // no arrow
                } else {
                    // player IS paused
                    this.timerStart += Date.now() - this.timer - this.timerStart; // dont progress timer when paused
                }
            }
        }

        // UPDATING DEBUG TEXT DEPENDING ON GAMESTATE
        if (this.settings.debugText) {
            if (this.gamestate == 2) {
                // Map Browser debug text
                ui_debugText.textContent = `selectedMapIndex: ${MapBrowser.selectedMapIndex} \r\n`;
                ui_debugText.textContent += `scrollAmount: ${MapBrowser.scrollAmount} \r\n`;
                ui_debugText.textContent += `scrollPos: ${MapBrowser.scrollPos} \r\n`;
                ui_debugText.textContent += `scrollVel: ${MapBrowser.scrollVel} \r\n`;
                ui_debugText.textContent += `maxScroll: ${MapBrowser.maxScroll} \r\n`;
            } else if (this.gamestate == 6) {
                // In Level debug text
                ui_debugText.textContent = `fps: ${Math.round(1 / dt)} \r\n`;
                ui_debugText.textContent += `dt (rounded): ${Math.round(dt * 1000) / 1000} seconds \r\n`;
                ui_debugText.textContent += `renderedPlatforms: ${Map.renderedPlatforms.length} \r\n`;
                ui_debugText.textContent += `endZonesToCheck: ${Map.endZonesToCheck.length} \r\n`;
                ui_debugText.textContent += `cameraZoom: ${Math.round(Player.speedCameraOffset.zoom * 1000) / 1000} \r\n`;
                ui_debugText.textContent += `offsetDir: ${Math.round(Player.speedCameraOffset.direction.x)}, ${Math.round(
                    Player.speedCameraOffset.direction.y,
                )} \r\n`;
                ui_debugText.textContent += `player pos: ${Math.round(Player.x)}, ${Math.round(Player.y)} \r\n`;
                ui_debugText.textContent += `lookAngle: ${Player.lookAngle.getAngleInDegrees()} \r\n`;
                ui_debugText.textContent += `dragAmountX: ${TouchHandler.dragAmountX} \r\n`;

                if (TouchHandler.dragging) {
                    ui_debugText.textContent += `touch pos: ${TouchHandler.touches[0].x}, ${TouchHandler.touches[0].y} \r\n`;
                }
                if (Tutorial.isActive) {
                    ui_debugText.textContent += `tutorial state: ${Tutorial.state} \r\n`;
                }
            } else if (this.gamestate == 7) {
                // Map Editor Debug Text
                ui_debugText.textContent = `zoom: ${Math.round(MapEditor.zoom * 1000) / 1000} \r\n`;
                ui_debugText.textContent += `screen pos: ${Math.round(MapEditor.screen.x * 100) / 100}, ${
                    Math.round(MapEditor.screen.y * 100) / 100
                } \r\n`;
                ui_debugText.textContent += `screen size: ${Math.round(MapEditor.screen.width * 100) / 100}, ${
                    Math.round(MapEditor.screen.height * 100) / 100
                } \r\n`;
                ui_debugText.textContent += `screen corner pos: ${Math.round(MapEditor.screen.cornerX * 100) / 100}, ${
                    Math.round(MapEditor.screen.cornerY * 100) / 100
                } \r\n`;
                ui_debugText.textContent += `rendered platforms: ${MapEditor.renderedPlatforms.length} \r\n`;
                ui_debugText.textContent += `editorState: ${MapEditor.editorState} \r\n`;
                ui_debugText.textContent += `selectedElements: ${MapEditor.selectedElements} \r\n`;
                ui_debugText.textContent += `zoom ratio: ${Math.round(TouchHandler.zoom.ratio * 1000) / 1000} \r\n`;

                if (TouchHandler.dragging) {
                    ui_debugText.textContent += `touch pos (UI): ${TouchHandler.touches[0].x}, ${TouchHandler.touches[0].y} \r\n`;
                    const touchMapped = MapEditor.convertToMapCord(TouchHandler.touches[0].x, TouchHandler.touches[0].y);
                    ui_debugText.textContent += `touch pos (map): ${Math.round(touchMapped.x * 100) / 100}, ${
                        Math.round(touchMapped.y * 100) / 100
                    } \r\n`;

                    if (MapEditor.dragSelect) {
                        const marquee = MapEditor.dragSelectMarquee;
                        const globalMarqueeCornerTL = MapEditor.convertToMapCord(marquee.x, marquee.y);
                        const globalMarqueeCornerBR = MapEditor.convertToMapCord(marquee.x + marquee.width, marquee.y + marquee.height);

                        ui_debugText.textContent += `marquee (map xywh): ${Math.round(globalMarqueeCornerTL.x)}, ${Math.round(
                            globalMarqueeCornerTL.y,
                        )}, ${Math.round(globalMarqueeCornerBR.x - globalMarqueeCornerTL.x)}, ${Math.round(
                            globalMarqueeCornerBR.y - globalMarqueeCornerTL.y,
                        )} \r\n`;
                    }
                }
            } else {
                // generic debug text for all other screens
                ui_debugText.textContent = `fps: ${Math.round(1 / dt)} \r\n`;
            }
        }
    },
};
