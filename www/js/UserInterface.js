const UserInterface = {
    // The UI, both buttons and custom drawn elements, are positioned in non-scaled coordinated
    // The canvas coords they use are based on the CSS pixels and do not take into account device DPI
    // They are rendered using an increased UserInterfaceCanvas.scale, their logic is all non-scaled

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

    timer: 0,
    timerStart: null, // set by jump button
    levelState: 1, // 1 = pre-start, 2 = playing level, 3 = in endzone

    leaderboards: {}, // medal times for each map
    records: {}, // users records (personal bests) for each level theyve completed
    previousRecord: 0,

    showVerticalWarning: false,
    showOverstrafeWarning: false,

    darkMode: false,

    // lightColor_1 : "#fff8ea", // lighter
    // lightColor_2 : "#f7f1e4", // darker
    // darkColor_1 : "#503c4b",
    // darkColor_2 : "#412b3a",

    // should kill these eventually and only use ones defined in CSS
    lightColor_1: "#F5F5F5", // lighter
    lightColor_2: "#E0E0E0", // darker
    darkColor_1: "#454545",
    darkColor_2: "#363636",

    start: function () {
        // where all buttons are created

        this.getSettings();
        this.getRecords();
        this.getLeaderboards();
        this.checkCustomMapsDirectoryExists();

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
            MapEditor.editorState = 5;
            UserInterface.gamestate = 2;
            UserInterface.renderedButtons = []; // kill once all map editor button are on new system
            UserInterface.switchToUiGroup(UserInterface.uiGroup_mapEditorMapBrowser);

            MapBrowser.state = 2;
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

        const ui_verticalWarning = getByID("ui_verticalWarning");

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
            // 5 = MapEditor MapBrowser screen

            // MapBrowser.state
            // 0 = disabled
            // 1 = standard map browser
            // 2 = custom map browser

            // in one of the 3 MapBrowsers
            if (UserInterface.gamestate == 2) {
                // in STANDARD map browser
                if (MapBrowser.state == 1) {
                    // goto main menu
                    MapBrowser.state = 0;
                    MapBrowser.scrollY = 0;
                    MapBrowser.selectedMapIndex = -1;
                    UserInterface.gamestate = 1;

                    // UserInterface.renderedButtons = UserInterface.btnGroup_mainMenu; //kill
                    UserInterface.renderedButtons = []; // kill
                    UserInterface.switchToUiGroup(UserInterface.uiGroup_mainMenu);

                    return;
                }

                // in CUSTOM map browser -- could be the one you play maps from or the map editor
                if (MapBrowser.state == 2) {
                    // go back to standard map browser OR to main main menu if in Map Editor

                    // in MapEditor's map browser
                    if (MapEditor.editorState == 5) {
                        // goto main menu
                        MapBrowser.state = 0;
                        MapBrowser.scrollY = 0;
                        MapBrowser.selectedMapIndex = -1;

                        UserInterface.gamestate = 1;
                        MapEditor.editorState = 0;

                        UserInterface.renderedButtons = []; // kill
                        UserInterface.switchToUiGroup(UserInterface.uiGroup_mainMenu);

                        return;
                    }

                    // goto play standard map browser
                    MapBrowser.state = 1;
                    UserInterface.switchToUiGroup(UserInterface.uiGroup_standardMapBrowser);
                    MapBrowser.init();
                    return;
                }
            }

            if (UserInterface.gamestate == 3) {
                // in Settings page
                // goto main menu
                UserInterface.gamestate = 1;
                // UserInterface.renderedButtons = UserInterface.btnGroup_mainMenu; // kill
                UserInterface.renderedButtons = []; // kill
                UserInterface.switchToUiGroup(UserInterface.uiGroup_mainMenu);
                return;
            }

            if (UserInterface.gamestate == 5) {
                // in Loading Map page
                // goto standard map browser (OR CUSTOM BROWSER - FIX / ADD THIS)
                UserInterface.gamestate = 2;
                MapBrowser.state = 1;
                UserInterface.switchToUiGroup(UserInterface.uiGroup_standardMapBrowser);
                MapBrowser.init();
                return;
            }

            if (UserInterface.gamestate == 6) {
                // in Map Level
                // goto back to map browser
                // either standard or custom depending on MapBrowser state
                UserInterface.gamestate = 2;

                UserInterface.timer = 0;
                UserInterface.levelState = 1;

                if (MapBrowser.state == 1) {
                    UserInterface.switchToUiGroup(UserInterface.uiGroup_standardMapBrowser);
                } else {
                    UserInterface.switchToUiGroup(UserInterface.uiGroup_customMapBrowser);
                }

                MapBrowser.init();

                if (Tutorial.isActive) {
                    // leaving tutorial level
                    if (Tutorial.state >= 18) {
                        btn_playTutorial.func(); // press toggle tutorial button to turn it off after completing tutorial
                    }

                    Tutorial.reset();
                }

                return;
            }

            if (UserInterface.gamestate == 7) {
                // in MapEditor

                // btn_mainMenu only appears in map settings or map color pages while in MapEditor
                // goto MapEditor main map editing screen
                UserInterface.renderedButtons = UserInterface.btnGroup_mapEditorInterface;
                UserInterface.switchToUiGroup(UserInterface.uiGroup_mapEditorInterface)
                MapEditor.editorState = 1;
                return;
            }
        };

        const btn_restart = getByID("btn_restart");
        btn_restart.func = () => {
            if (Tutorial.isActive) {
                // UNHIDE POPUP ALERT "Restart Disabled During Tutorial"
            } else {
                if (UserInterface.levelState == 3) {
                    UserInterface.switchToUiGroup(UserInterface.uiGroup_inLevel);
                }
                UserInterface.timer = 0;
                UserInterface.levelState = 1;
                Player.checkpointIndex = -1;
                Player.restart();
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
            MapBrowser.scrollY = 0;
            MapBrowser.scrollVel = 0;

            UserInterface.gamestate = 5;
            UserInterface.renderedButtons = []; // kill once ALL map browsers buttons are on NEW systems
            UserInterface.switchToUiGroup([btn_mainMenu]);

            if (MapBrowser.state == 1) {
                // in normal maps browser
                Map.initMap(MapBrowser.selectedMapIndex, false);
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
            Tutorial.isActive = toggleState;
            UserInterface.settings.playTutorial = toggleState;
            UserInterface.writeSettings();
            console.log("Play Tutorial Toggled: " + toggleState);
        };

        const ui_mapInfoBox = getByID("ui_mapInfoBox");

        const btn_level_awakening = getByID("btn_level_awakening");
        btn_level_awakening.func = () => {
            MapBrowser.selectedMapIndex = "Awakening";
            MapBrowser.updateMapBrowserState();
            if (UserInterface.settings.playTutorial) {
                Tutorial.isActive = true; // Doesn't this need to be toggled off at some point too? FIX What is this doing? toggle also turns this on and off
            }
        };

        const btn_level_pitfall = getByID("btn_level_pitfall");
        btn_level_pitfall.func = () => {
            MapBrowser.selectedMapIndex = "Pitfall";
            MapBrowser.updateMapBrowserState();
        };

        const btn_level_cavernAbyss = getByID("btn_level_cavernAbyss");
        btn_level_cavernAbyss.func = () => {
            MapBrowser.selectedMapIndex = "Cavern Abyss";
            MapBrowser.updateMapBrowserState();
        };

        const btn_level_crystals = getByID("btn_level_crystals");
        btn_level_crystals.func = () => {
            MapBrowser.selectedMapIndex = "Crystals";
            MapBrowser.updateMapBrowserState();
        };

        const btn_level_trespass = getByID("btn_level_trespass");
        btn_level_trespass.func = () => {
            MapBrowser.selectedMapIndex = "Trespass";
            MapBrowser.updateMapBrowserState();
        };

        const btn_level_turmoil = getByID("btn_level_turmoil");
        btn_level_turmoil.func = () => {
            MapBrowser.selectedMapIndex = "Turmoil";
            MapBrowser.updateMapBrowserState();
        };

        const btn_level_tangledForest = getByID("btn_level_tangledForest");
        btn_level_tangledForest.func = () => {
            MapBrowser.selectedMapIndex = "Tangled Forest";
            MapBrowser.updateMapBrowserState();
        };

        const btn_level_pinnacle = getByID("btn_level_pinnacle");
        btn_level_pinnacle.func = () => {
            MapBrowser.selectedMapIndex = "Pinnacle";
            MapBrowser.updateMapBrowserState();
        };

        const btn_level_forever = getByID("btn_level_forever");
        btn_level_forever.func = () => {
            MapBrowser.selectedMapIndex = "Forever";
            MapBrowser.updateMapBrowserState();
        };

        // ====================
        //  MAP EDITOR BROWSER
        // ====================
        const btn_newMap = getByID("btn_newMap");
        btn_newMap.func = function () {
            MapEditor.loadedMap = {
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
            MapEditor.loadedMap.platforms.forEach((platform) => MapEditor.updatePlatformCorners(platform));

            UserInterface.gamestate = 7;
        };

        const btn_importMap = getByID("btn_importMap");
        btn_importMap.func = () => {
            // UPDATE THIS BUTTON TO INCLUDE FUNCTIONALITY OF btn_importMap_text BUTTON
            // LOAD FROM LOCAL FILE SYSTEM
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".txt"; // or "application/json"
            document.body.appendChild(input);

            input.addEventListener("change", function () {
                const file = input.files[0];
                if (!file) return;

                const reader = new FileReader();

                reader.onload = (e) => {
                    try {
                        // Attempt to parse the JSON from the file
                        MapEditor.loadedMap = JSON.parse(e.target.result);
                        UserInterface.gamestate = 7;
                    } catch (error) {
                        alert("Failed to load map: " + error.message);
                    }
                };

                reader.onerror = (e) => {
                    alert("Error reading file: " + e.target.error.name);
                };

                reader.readAsText(file);

                // Clean up input after use
                document.body.removeChild(input);
            });

            input.click(); // Trigger the file dialog
        };

        const btn_editMap = getByID("btn_editMap");
        btn_editMap.func = async () => {
            MapBrowser.scrollVel = 0;
            MapBrowser.scrollY = 0;

            const mapDataRaw = await readFile("device", "maps", MapBrowser.selectedMapIndex + ".json", "text");

            MapEditor.loadedMap = JSON.parse(mapDataRaw);
            UserInterface.gamestate = 7;
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
                                }
                            );
                        });
                    });
                });
            }
        };

        // ============
        //  MAP EDITOR
        // ============

        const btn_exitMapEditor = getByID("btn_exitMapEditor")
        btn_exitMapEditor.func = () =>  {
            MapEditor.saveCustomMap();
        };

        // ===========
        //  UI GROUPS
        // ===========
        this.uiGroup_mainMenu = [getByID("main-title"), btn_play, btn_settings, btn_mapEditor, getByID("menu-background")];
        this.uiGroup_settings = [btn_mainMenu, btn_sensitivitySlider, btn_volumeSlider, btn_debugText, btn_strafeHUD, btn_resetSettings];
        this.uiGroup_standardMapBrowser = [
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
            btn_level_trespass,
            btn_level_turmoil,
            btn_level_tangledForest,
            btn_level_pinnacle,
            btn_level_forever,
        ];
        this.uiGroup_customMapBrowser = [btn_mainMenu, getByID("custom-map-browser-info"), ui_mapInfoBox, getByID("custom-map-list-container")];
        this.uiGroup_inLevel = [
            ui_speedometer,
            ui_timerBox,
            // ui_strafeHelper,
            // ui_verticalWarning,
            // ui_restartWarning, // Not done
            // ui_overstrafeWarning, // Not done
            btn_mainMenu,
            btn_restart,
            btn_jump,
        ];
        this.uiGroup_endScreen = [ui_speedometer, btn_mainMenu, btn_restart, btn_jump, ui_endScreen];

        this.uiGroup_mapEditorMapBrowser = [btn_mainMenu, getByID("custom-map-list-container"), ui_mapInfoBox, btn_newMap, btn_importMap];

        this.uiGroup_mapEditorInterface = [btn_exitMapEditor];
        this.uiGroup_editPlatform = [btn_exitMapEditor];
        this.uiGroup_editPlayerStart = [btn_exitMapEditor];
        this.uiGroup_editCheckPoint = [btn_exitMapEditor];
        this.uiGroup_editMultiSelect = [btn_exitMapEditor];

        this.uiGroup_colorPickerState1 = [btn_mainMenu]
        this.uiGroup_colorPickerState2 = []
        this.uiGroup_mapSettings = [btn_mainMenu]


        this.activeUiGroup = [];
        this.switchToUiGroup(UserInterface.uiGroup_mainMenu);

        // [][][][][][][][][][][][][][]
        //   CREATING THE OLD BUTTONS
        // [][][][][][][][][][][][][][]

        // MapEditor browser buttons

        btn_importMap_text = new Button(midX_UI - 150, 250, 300, "", "", 0, "Import Map With Copy & Paste", function () {
            let mapPaste = prompt("Paste Map Data:");
            if (mapPaste) {
                MapEditor.loadedMap = JSON.parse(mapPaste);
            }
        });

        // TUTORIAL BUTTONS
        btn_next = new Button(screenWidthUI - 100, 38, 60, "next_button", "", 0, "", function () {
            Tutorial.timerStarted = false; // easier to always set these here even if they arent always needed
            Tutorial.animatePos = 0;
            Tutorial.animateVel = 0;

            // reset the position and scale because the button is being pulse animated
            this.x = screenWidthUI - 100;
            this.y = 38;
            this.width = 60;
            this.height = 60;

            if (Tutorial.state == 1) {
                Tutorial.state++;
                UserInterface.renderedButtons = [btn_mainMenu, btn_next];
                return;
            }

            if (Tutorial.state == 2) {
                Tutorial.state++; // going into STATE 3
                UserInterface.renderedButtons = [btn_mainMenu];

                Player.lookAngle.set(0, -1); // so that ur NOT already looking at a target
                return;
            }

            // state 3 progresses to 5 when all targets are completed
            // state 5 uses jump button to progress
            // state 6 progresses to 7 automatically after 2 secs

            if (Tutorial.state == 7) {
                Tutorial.state++; // going into STATE 8
                UserInterface.switchToUiGroup(UserInterface.uiGroup_inLevel);
                return;
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
                UserInterface.switchToUiGroup(UserInterface.uiGroup_inLevel);
                return;
            }
        });

        // MAP EDITOR BUTTONS
        btn_add_platform = new Button(screenWidthUI - 196, 25, 156, "platform_button", "", 0, "", function () {
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
            UserInterface.renderedButtons = UserInterface.btnGroup_editPlatform;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_editPlatform);

            // SYNC ALL BUTTONS AND SLIDERS
            btn_angleSlider.updateState(MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].angle);
            btn_wall.func(true); // syncs the wall button's toggle state
            btn_endzone.func(true); // syncs the endzone button's toggle state
        });

        btn_add_checkpoint = new Button(screenWidthUI - 232, 92, 192, "cp_button", "", 0, "", function () {
            const middleX = Math.round(MapEditor.screen.x);
            const middleY = Math.round(MapEditor.screen.y);
            const newCheckPoint = {
                triggerX1: middleX - 100,
                triggerY1: middleY,
                triggerX2: middleX + 100,
                triggerY2: middleY,
                x: middleX,
                y: middleY + 50,
                angle: 270,
            };

            MapEditor.loadedMap.checkpoints.push(newCheckPoint);
        });

        btn_map_colors = new Button(screenWidthUI - 310, 25, 96, "map_colors_button", "", 0, "", function () {
            MapEditor.editorState = 3; // map colors
            ColorPicker.editingElement = 0;
            PreviewWindow.update();
            UserInterface.renderedButtons = UserInterface.btnGroup_colorPickerState1;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState1);
        });

        btn_map_settings = new Button(screenWidthUI - 440, 25, 108, "map_settings_button", "", 0, "", function () {
            MapEditor.editorState = 4; // map settings

            PreviewWindow.update();

            btn_platformHeightSlider.updateState(MapEditor.loadedMap.style.platformHeight); // value is set to 0 before we're in MapEditor
            btn_wallHeightSlider.updateState(MapEditor.loadedMap.style.wallHeight);
            btn_lightDirectionSlider.updateState(MapEditor.loadedMap.style.lightDirection);
            btn_lightPitchSlider.updateState(MapEditor.loadedMap.style.lightPitch);

            UserInterface.renderedButtons = UserInterface.btnGroup_mapSettings;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_mapSettings);
        });

        btn_dragSelect = new Button(45, screenHeightUI - 230, 60, "toggle_button", "toggle_button_pressed", 1, "", function (sync) {
            if (MapEditor.loadedMap) {
                // throws an error otherwise
                if (sync) {
                    this.toggle = MapEditor.dragSelect;
                } else {
                    if (this.toggle) {
                        // turn off dragSelect
                        this.toggle = 0;
                        MapEditor.dragSelect = false;
                        MapEditor.setButtonGroup();
                    } else {
                        // turn on dragSelect and multiSelect (required)
                        this.toggle = 1;
                        MapEditor.dragSelect = true;
                        MapEditor.multiSelect = true;
                        btn_multiSelect.func(true); // sync button's toggle
                        UserInterface.renderedButtons = UserInterface.btnGroup_dragSelect; // hides all other buttons
                    }
                }
            }
        });

        btn_multiSelect = new Button(45, screenHeightUI - 150, 60, "toggle_button", "toggle_button_pressed", 1, "", function (sync) {
            if (MapEditor.loadedMap) {
                // throws an error otherwise
                if (sync) {
                    this.toggle = MapEditor.multiSelect;
                } else {
                    if (this.toggle) {
                        // turn off multiSelect
                        this.toggle = 0;
                        MapEditor.multiSelect = false;

                        // turn off dragSelect bc it needs multiSelect
                        if (MapEditor.dragSelect) {
                            MapEditor.dragSelect = false;
                            btn_dragSelect.func(true); // sync button
                        }

                        if (MapEditor.selectedElements.length > 1) {
                            MapEditor.selectedElements = [MapEditor.selectedElements[MapEditor.selectedElements.length - 1]]; // make it only select the last element in the array
                            MapEditor.setButtonGroup()
                        }
                    } else {
                        // turn on multiSelect
                        this.toggle = 1;
                        MapEditor.multiSelect = true;
                    }
                }
            }
        });

        btn_snappingSlider = new SliderUI(
            50,
            screenHeightUI - 50,
            192,
            0,
            64,
            0.5,
            "Snapping",
            MapEditor.loadedMap ? MapEditor.snapAmount : 0,
            function () {
                MapEditor.snapAmount = this.value;
            }
        );

        btn_unselect = new Button(screenWidthUI - 250, 34, 45, "x_button", "", 0, "", function () {
            UserInterface.renderedButtons = UserInterface.btnGroup_mapEditorInterface;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_mapEditorInterface)
            MapEditor.selectedElements = []; // No selected platforms
        });

        btn_translate = new Button(0, 0, 38, "translate_button", "", 0, "", function () {
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
                    checkpoint = MapEditor.selectedElements[i];

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

            if (!this.isPressed) {
                // not pressed

                // element coords mapped to screen coords
                // mapToRange(number, inMin, inMax, outMin, outMax)
                const xMapped = UserInterfaceCanvas.mapToRange(
                    avgMidX,
                    MapEditor.screen.cornerX,
                    MapEditor.screen.cornerX + MapEditor.screen.width,
                    0,
                    screenWidthUI
                );
                const yMapped = UserInterfaceCanvas.mapToRange(
                    avgMidY,
                    MapEditor.screen.cornerY,
                    MapEditor.screen.cornerY + MapEditor.screen.height,
                    0,
                    screenHeightUI
                );

                // position button in the middle of element(s)
                if (MapEditor.selectedElements.length > 1) {
                    this.x = xMapped - this.width / 2;
                    this.y = yMapped - this.height / 2;
                } else {
                    this.x = xMapped + conditioningArray[0].offSet * MapEditor.zoom - this.width / 2;
                    this.y = yMapped + conditioningArray[0].offSet * MapEditor.zoom - this.height / 2;
                }
            } else if (TouchHandler.dragging) {
                // MOVE BUTTON according to touch dragging
                // adjust and pan screen if button is near the edge
                // move element to rounded and mapped button coords
                // snap element to snapping slider

                this.x += TouchHandler.dragAmountX;
                this.y += TouchHandler.dragAmountY;

                // panning if at edges of screen
                if (this.x > screenWidthUI - 270) {
                    MapEditor.screen.x += (400 / MapEditor.zoom) * dt;
                }
                if (this.x < 60) {
                    MapEditor.screen.x -= (400 / MapEditor.zoom) * dt;
                }
                if (this.y > screenHeightUI - 60) {
                    MapEditor.screen.y += (400 / MapEditor.zoom) * dt;
                }
                if (this.y < 12) {
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
                        const btnGlobalX = UserInterfaceCanvas.mapToRange(
                            this.x + this.width / 2,
                            0,
                            screenWidthUI,
                            MapEditor.screen.cornerX,
                            MapEditor.screen.cornerX + MapEditor.screen.width
                        );
                        const btnGlobalY = UserInterfaceCanvas.mapToRange(
                            this.y + this.height / 2,
                            0,
                            screenHeightUI,
                            MapEditor.screen.cornerY,
                            MapEditor.screen.cornerY + MapEditor.screen.height
                        );

                        xMapped = btnGlobalX - offSetFromAvgMidGlobalX;
                        yMapped = btnGlobalY - offSetFromAvgMidGlobalY;
                    } else {
                        // use offset for single item

                        xMapped = UserInterfaceCanvas.mapToRange(
                            this.x - conditioningArray[i].offSet * MapEditor.zoom + this.width / 2,
                            0,
                            screenWidthUI,
                            MapEditor.screen.cornerX,
                            MapEditor.screen.cornerX + MapEditor.screen.width
                        );
                        yMapped = UserInterfaceCanvas.mapToRange(
                            this.y - conditioningArray[i].offSet * MapEditor.zoom + this.height / 2,
                            0,
                            screenHeightUI,
                            MapEditor.screen.cornerY,
                            MapEditor.screen.cornerY + MapEditor.screen.height
                        );
                    }

                    // set platform position to (xMapped, yMapped)
                    conditioningArray[i].element[conditioningArray[i].xKey] = Math.round(xMapped);
                    conditioningArray[i].element[conditioningArray[i].yKey] = Math.round(yMapped);

                    if (MapEditor.snapAmount > 0) {
                        conditioningArray[i].element[conditioningArray[i].xKey] =
                            Math.round(conditioningArray[i].element[conditioningArray[i].xKey] / MapEditor.snapAmount) * MapEditor.snapAmount;
                        conditioningArray[i].element[conditioningArray[i].yKey] =
                            Math.round(conditioningArray[i].element[conditioningArray[i].yKey] / MapEditor.snapAmount) * MapEditor.snapAmount;
                    }
                }
            }
        });

        btn_resize_BL = new Button(0, 0, 38, "scale_button_2", "", 0, "", function () {
            let platform = MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]];

            if (!this.isPressed) {
                // position button at corner/edge of element

                // BL corner (relative to platform center)
                const cornerX = platform.corners[0][0];
                const cornerY = platform.corners[0][1];

                // corner coords mapped to screen coords
                // mapToRange(number, inMin, inMax, outMin, outMax)
                const cornerMappedX = UserInterfaceCanvas.mapToRange(
                    platform.x + cornerX,
                    MapEditor.screen.cornerX,
                    MapEditor.screen.cornerX + MapEditor.screen.width,
                    0,
                    screenWidthUI
                );
                const cornerMappedY = UserInterfaceCanvas.mapToRange(
                    platform.y + cornerY,
                    MapEditor.screen.cornerY,
                    MapEditor.screen.cornerY + MapEditor.screen.height,
                    0,
                    screenHeightUI
                );

                this.x = cornerMappedX - this.width;
                this.y = cornerMappedY;
            } else if (TouchHandler.dragging) {
                // move button according to touch dragging
                this.x += TouchHandler.dragAmountX;
                this.y += TouchHandler.dragAmountY;

                // panning if at edges of screen
                if (this.x > screenWidthUI - 270) {
                    MapEditor.screen.x += (400 / MapEditor.zoom) * dt;
                }
                if (this.x < 60) {
                    MapEditor.screen.x -= (400 / MapEditor.zoom) * dt;
                }
                if (this.y > screenHeightUI - 60) {
                    MapEditor.screen.y += (400 / MapEditor.zoom) * dt;
                }
                if (this.y < 12) {
                    MapEditor.screen.y -= (400 / MapEditor.zoom) * dt;
                }

                // TR pinned corner MAP COORDS
                const pinnedX_mapCoords = platform.x + platform.corners[2][0];
                const pinnedY_mapCoords = platform.y + platform.corners[2][1];

                // convert pinned coords to SCREEN COORDS
                // mapToRange(number, inMin, inMax, outMin, outMax)
                const pinnedX_screenCoords = UserInterfaceCanvas.mapToRange(
                    pinnedX_mapCoords,
                    MapEditor.screen.cornerX,
                    MapEditor.screen.cornerX + MapEditor.screen.width,
                    0,
                    screenWidthUI
                );
                const pinnedY_screenCoords = UserInterfaceCanvas.mapToRange(
                    pinnedY_mapCoords,
                    MapEditor.screen.cornerY,
                    MapEditor.screen.cornerY + MapEditor.screen.height,
                    0,
                    screenHeightUI
                );

                // get vector dragFromPinned (unscaled by zoom) (origin is at pin) x value will be neg at 0deg, y val will be pos(down) at 0 deg
                // dividing by zoom brings it back to real map scale
                const dragFromPinned = new Vector2D3D(
                    (this.x + this.width - pinnedX_screenCoords) / MapEditor.zoom,
                    (this.y - pinnedY_screenCoords) / MapEditor.zoom
                );

                // get rotatedDragFromPinned. (x will always be -, y will always be +)
                const rotatedDragFromPinned = dragFromPinned.clone().rotate(-platform.angle);

                // set width and height using rotatedDragFromPinned
                platform.width = Math.round(-rotatedDragFromPinned.x * UserInterfaceCanvas.scale);
                platform.height = Math.round(rotatedDragFromPinned.y * UserInterfaceCanvas.scale);

                // snapping and restricting size
                if (MapEditor.snapAmount > 0) {
                    platform.width = Math.round(platform.width / MapEditor.snapAmount) * MapEditor.snapAmount;
                    platform.height = Math.round(platform.height / MapEditor.snapAmount) * MapEditor.snapAmount;
                }

                if (platform.width < 6) {
                    platform.width = 6;
                }
                if (platform.height < 6) {
                    platform.height = 6;
                }

                // get NEW BL dragged corner map coords
                const updatedDragCorner = [
                    -((platform.width / 2) * Math.cos(platform.angleRad)) - (platform.height / 2) * Math.sin(platform.angleRad),
                    -((platform.width / 2) * Math.sin(platform.angleRad)) + (platform.height / 2) * Math.cos(platform.angleRad),
                ];

                const draggedX_mapCoords = pinnedX_mapCoords + updatedDragCorner[0] * 2;
                const draggedY_mapCoords = pinnedY_mapCoords + updatedDragCorner[1] * 2;

                // set platform x and y to inbetween pinnedCorner in MAP COORDS and dragged corner in MAP COORDS
                platform.x = (pinnedX_mapCoords + draggedX_mapCoords) / 2;
                platform.y = (pinnedY_mapCoords + draggedY_mapCoords) / 2;

                MapEditor.updatePlatformCorners(platform);
            }
        });

        btn_resize_BR = new Button(0, 0, 38, "scale_button_1", "", 0, "", function () {
            let platform = MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]];

            if (!this.isPressed) {
                // position button at corner/edge of element

                // BR corner (relative to platform center)
                const cornerX = platform.corners[1][0];
                const cornerY = platform.corners[1][1];

                // corner coords mapped to screen coords
                // mapToRange(number, inMin, inMax, outMin, outMax)
                const cornerMappedX = UserInterfaceCanvas.mapToRange(
                    platform.x + cornerX,
                    MapEditor.screen.cornerX,
                    MapEditor.screen.cornerX + MapEditor.screen.width,
                    0,
                    screenWidthUI
                );
                const cornerMappedY = UserInterfaceCanvas.mapToRange(
                    platform.y + cornerY,
                    MapEditor.screen.cornerY,
                    MapEditor.screen.cornerY + MapEditor.screen.height,
                    0,
                    screenHeightUI
                );

                this.x = cornerMappedX;
                this.y = cornerMappedY;
            } else if (TouchHandler.dragging) {
                // move button according to touch dragging
                this.x += TouchHandler.dragAmountX;
                this.y += TouchHandler.dragAmountY;

                // panning if at edges of screen
                if (this.x > screenWidthUI - 270) {
                    MapEditor.screen.x += (400 / MapEditor.zoom) * dt;
                }
                if (this.x < 60) {
                    MapEditor.screen.x -= (400 / MapEditor.zoom) * dt;
                }
                if (this.y > screenHeightUI - 60) {
                    MapEditor.screen.y += (400 / MapEditor.zoom) * dt;
                }
                if (this.y < 12) {
                    MapEditor.screen.y -= (400 / MapEditor.zoom) * dt;
                }

                // TL pinned corner MAP COORDS
                const pinnedX_mapCoords = platform.x + platform.corners[3][0];
                const pinnedY_mapCoords = platform.y + platform.corners[3][1];

                // convert pinned coords to SCREEN COORDS
                // mapToRange(number, inMin, inMax, outMin, outMax)
                const pinnedX_screenCoords = UserInterfaceCanvas.mapToRange(
                    pinnedX_mapCoords,
                    MapEditor.screen.cornerX,
                    MapEditor.screen.cornerX + MapEditor.screen.width,
                    0,
                    screenWidthUI
                );
                const pinnedY_screenCoords = UserInterfaceCanvas.mapToRange(
                    pinnedY_mapCoords,
                    MapEditor.screen.cornerY,
                    MapEditor.screen.cornerY + MapEditor.screen.height,
                    0,
                    screenHeightUI
                );

                // get vector dragFromPinned (unscaled by zoom) (origin is at pin) x value will be pos at 0deg, y val will be pos(down) at 0 deg
                // dividing by zoom brings it back to real map scale
                const dragFromPinned = new Vector2D3D(
                    (this.x - pinnedX_screenCoords) / MapEditor.zoom,
                    (this.y - pinnedY_screenCoords) / MapEditor.zoom
                );

                // get rotatedDragFromPinned. (x will always be -, y will always be +)
                const rotatedDragFromPinned = dragFromPinned.clone().rotate(-platform.angle);

                // set width and height using rotatedDragFromPinned
                platform.width = Math.round(rotatedDragFromPinned.x * UserInterfaceCanvas.scale);
                platform.height = Math.round(rotatedDragFromPinned.y * UserInterfaceCanvas.scale);

                // snapping and restricting size
                if (MapEditor.snapAmount > 0) {
                    platform.width = Math.round(platform.width / MapEditor.snapAmount) * MapEditor.snapAmount;
                    platform.height = Math.round(platform.height / MapEditor.snapAmount) * MapEditor.snapAmount;
                }

                if (platform.width < 6) {
                    platform.width = 6;
                }
                if (platform.height < 6) {
                    platform.height = 6;
                }

                // get NEW BR dragged corner map coords
                const updatedDragCorner = [
                    (platform.width / 2) * Math.cos(platform.angleRad) - (platform.height / 2) * Math.sin(platform.angleRad),
                    (platform.width / 2) * Math.sin(platform.angleRad) + (platform.height / 2) * Math.cos(platform.angleRad),
                ];

                const draggedX_mapCoords = pinnedX_mapCoords + updatedDragCorner[0] * 2;
                const draggedY_mapCoords = pinnedY_mapCoords + updatedDragCorner[1] * 2;

                // set platform x and y to inbetween pinnedCorner in MAP COORDS and dragged corner in MAP COORDS
                platform.x = (pinnedX_mapCoords + draggedX_mapCoords) / 2;
                platform.y = (pinnedY_mapCoords + draggedY_mapCoords) / 2;

                MapEditor.updatePlatformCorners(platform);
            }
        });

        btn_resize_TR = new Button(0, 0, 38, "scale_button_2", "", 0, "", function () {
            let platform = MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]];

            if (!this.isPressed) {
                // position button at corner/edge of element

                // TR corner (relative to platform center)
                const cornerX = platform.corners[2][0];
                const cornerY = platform.corners[2][1];

                // corner coords mapped to screen coords
                // mapToRange(number, inMin, inMax, outMin, outMax)
                const cornerMappedX = UserInterfaceCanvas.mapToRange(
                    platform.x + cornerX,
                    MapEditor.screen.cornerX,
                    MapEditor.screen.cornerX + MapEditor.screen.width,
                    0,
                    screenWidthUI
                );
                const cornerMappedY = UserInterfaceCanvas.mapToRange(
                    platform.y + cornerY,
                    MapEditor.screen.cornerY,
                    MapEditor.screen.cornerY + MapEditor.screen.height,
                    0,
                    screenHeightUI
                );

                this.x = cornerMappedX;
                this.y = cornerMappedY - this.height;
            } else if (TouchHandler.dragging) {
                // move button according to touch dragging
                this.x += TouchHandler.dragAmountX;
                this.y += TouchHandler.dragAmountY;

                // panning if at edges of screen
                if (this.x > screenWidthUI - 270) {
                    MapEditor.screen.x += (400 / MapEditor.zoom) * dt;
                }
                if (this.x < 60) {
                    MapEditor.screen.x -= (400 / MapEditor.zoom) * dt;
                }
                if (this.y > screenHeightUI - 60) {
                    MapEditor.screen.y += (400 / MapEditor.zoom) * dt;
                }
                if (this.y < 12) {
                    MapEditor.screen.y -= (400 / MapEditor.zoom) * dt;
                }

                // BL pinned corner MAP COORDS
                const pinnedX_mapCoords = platform.x + platform.corners[0][0];
                const pinnedY_mapCoords = platform.y + platform.corners[0][1];

                // convert pinned coords to SCREEN COORDS
                // mapToRange(number, inMin, inMax, outMin, outMax)
                const pinnedX_screenCoords = UserInterfaceCanvas.mapToRange(
                    pinnedX_mapCoords,
                    MapEditor.screen.cornerX,
                    MapEditor.screen.cornerX + MapEditor.screen.width,
                    0,
                    screenWidthUI
                );
                const pinnedY_screenCoords = UserInterfaceCanvas.mapToRange(
                    pinnedY_mapCoords,
                    MapEditor.screen.cornerY,
                    MapEditor.screen.cornerY + MapEditor.screen.height,
                    0,
                    screenHeightUI
                );

                // get vector dragFromPinned (unscaled by zoom) (origin is at pin) x value will be pos at 0deg, y val will be neg(up) at 0 deg
                // dividing by zoom brings it back to real map scale
                const dragFromPinned = new Vector2D3D(
                    (this.x - pinnedX_screenCoords) / MapEditor.zoom,
                    (this.y + this.height - pinnedY_screenCoords) / MapEditor.zoom
                );

                // get rotatedDragFromPinned. (x will always be -, y will always be +)
                const rotatedDragFromPinned = dragFromPinned.clone().rotate(-platform.angle);

                // set width and height using rotatedDragFromPinned
                platform.width = Math.round(rotatedDragFromPinned.x * UserInterfaceCanvas.scale);
                platform.height = Math.round(-rotatedDragFromPinned.y * UserInterfaceCanvas.scale);

                // snapping and restricting size
                if (MapEditor.snapAmount > 0) {
                    platform.width = Math.round(platform.width / MapEditor.snapAmount) * MapEditor.snapAmount;
                    platform.height = Math.round(platform.height / MapEditor.snapAmount) * MapEditor.snapAmount;
                }

                if (platform.width < 6) {
                    platform.width = 6;
                }
                if (platform.height < 6) {
                    platform.height = 6;
                }

                // get NEW TR dragged corner map coords
                const updatedDragCorner = [
                    (platform.width / 2) * Math.cos(platform.angleRad) + (platform.height / 2) * Math.sin(platform.angleRad),
                    (platform.width / 2) * Math.sin(platform.angleRad) - (platform.height / 2) * Math.cos(platform.angleRad),
                ];

                const draggedX_mapCoords = pinnedX_mapCoords + updatedDragCorner[0] * 2;
                const draggedY_mapCoords = pinnedY_mapCoords + updatedDragCorner[1] * 2;

                // set platform x and y to inbetween pinnedCorner in MAP COORDS and dragged corner in MAP COORDS
                platform.x = (pinnedX_mapCoords + draggedX_mapCoords) / 2;
                platform.y = (pinnedY_mapCoords + draggedY_mapCoords) / 2;

                MapEditor.updatePlatformCorners(platform);
            }
        });

        btn_resize_TL = new Button(0, 0, 38, "scale_button_1", "", 0, "", function () {
            let platform = MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]];

            if (!this.isPressed) {
                // position button at corner/edge of element

                // TL corner (relative to platform center)
                const cornerX = platform.corners[3][0];
                const cornerY = platform.corners[3][1];

                // corner coords mapped to screen coords
                // mapToRange(number, inMin, inMax, outMin, outMax)
                const cornerMappedX = UserInterfaceCanvas.mapToRange(
                    platform.x + cornerX,
                    MapEditor.screen.cornerX,
                    MapEditor.screen.cornerX + MapEditor.screen.width,
                    0,
                    screenWidthUI
                );
                const cornerMappedY = UserInterfaceCanvas.mapToRange(
                    platform.y + cornerY,
                    MapEditor.screen.cornerY,
                    MapEditor.screen.cornerY + MapEditor.screen.height,
                    0,
                    screenHeightUI
                );

                this.x = cornerMappedX - this.width;
                this.y = cornerMappedY - this.height;
            } else if (TouchHandler.dragging) {
                // move button according to touch dragging
                this.x += TouchHandler.dragAmountX;
                this.y += TouchHandler.dragAmountY;

                // panning if at edges of screen
                if (this.x > screenWidthUI - 270) {
                    MapEditor.screen.x += (400 / MapEditor.zoom) * dt;
                }
                if (this.x < 60) {
                    MapEditor.screen.x -= (400 / MapEditor.zoom) * dt;
                }
                if (this.y > screenHeightUI - 60) {
                    MapEditor.screen.y += (400 / MapEditor.zoom) * dt;
                }
                if (this.y < 12) {
                    MapEditor.screen.y -= (400 / MapEditor.zoom) * dt;
                }

                // BR pinned corner MAP COORDS
                const pinnedX_mapCoords = platform.x + platform.corners[1][0];
                const pinnedY_mapCoords = platform.y + platform.corners[1][1];

                // convert pinned coords to SCREEN COORDS
                // mapToRange(number, inMin, inMax, outMin, outMax)
                const pinnedX_screenCoords = UserInterfaceCanvas.mapToRange(
                    pinnedX_mapCoords,
                    MapEditor.screen.cornerX,
                    MapEditor.screen.cornerX + MapEditor.screen.width,
                    0,
                    screenWidthUI
                );
                const pinnedY_screenCoords = UserInterfaceCanvas.mapToRange(
                    pinnedY_mapCoords,
                    MapEditor.screen.cornerY,
                    MapEditor.screen.cornerY + MapEditor.screen.height,
                    0,
                    screenHeightUI
                );

                // get vector dragFromPinned (unscaled by zoom) (origin is at pin) x value will be neg at 0deg, y val will be neg(up) at 0 deg
                // dividing by zoom brings it back to real map scale
                const dragFromPinned = new Vector2D3D(
                    (this.x + this.width - pinnedX_screenCoords) / MapEditor.zoom,
                    (this.y + this.height - pinnedY_screenCoords) / MapEditor.zoom
                );

                // get rotatedDragFromPinned. (x will always be +, y will always be +)
                const rotatedDragFromPinned = dragFromPinned.clone().rotate(-platform.angle);

                // set width and height using rotatedDragFromPinned
                platform.width = Math.round(-rotatedDragFromPinned.x * UserInterfaceCanvas.scale);
                platform.height = Math.round(-rotatedDragFromPinned.y * UserInterfaceCanvas.scale);

                // snapping and restricting size
                if (MapEditor.snapAmount > 0) {
                    platform.width = Math.round(platform.width / MapEditor.snapAmount) * MapEditor.snapAmount;
                    platform.height = Math.round(platform.height / MapEditor.snapAmount) * MapEditor.snapAmount;
                }

                if (platform.width < 6) {
                    platform.width = 6;
                }
                if (platform.height < 6) {
                    platform.height = 6;
                }

                // get NEW TL dragged corner map coords
                const updatedDragCorner = [
                    -((platform.width / 2) * Math.cos(platform.angleRad)) + (platform.height / 2) * Math.sin(platform.angleRad),
                    -((platform.width / 2) * Math.sin(platform.angleRad)) - (platform.height / 2) * Math.cos(platform.angleRad),
                ];

                const draggedX_mapCoords = pinnedX_mapCoords + updatedDragCorner[0] * 2;
                const draggedY_mapCoords = pinnedY_mapCoords + updatedDragCorner[1] * 2;

                // set platform x and y to inbetween pinnedCorner in MAP COORDS and dragged corner in MAP COORDS
                platform.x = (pinnedX_mapCoords + draggedX_mapCoords) / 2;
                platform.y = (pinnedY_mapCoords + draggedY_mapCoords) / 2;

                MapEditor.updatePlatformCorners(platform);
            }
        });

        btn_angleSlider = new SliderUI(
            screenWidthUI - 246,
            204,
            186,
            -45,
            45,
            1,
            "Angle",
            MapEditor.loadedMap ? MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]] : 0,
            function () {
                if (MapEditor.snapAmount > 0) {
                    this.updateState(Math.round(this.value / MapEditor.snapAmount) * MapEditor.snapAmount);
                }
                if (this.value < this.min) {
                    this.updateState(this.min);
                } // these are incase snapping pushes the value over or under the limits
                if (this.value > this.max) {
                    this.updateState(this.max);
                }
                MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].angle = this.value;
                MapEditor.updatePlatformCorners(MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]]);
            }
        );

        btn_playerAngleSlider = new SliderUI(
            screenWidthUI - 246,
            204,
            186,
            0,
            360,
            1,
            "Angle",
            MapEditor.loadedMap ? MapEditor.loadedMap.playerStart : 0,
            function () {
                if (MapEditor.snapAmount > 0) {
                    this.updateState(Math.round(this.value / MapEditor.snapAmount) * MapEditor.snapAmount);
                }
                MapEditor.loadedMap.playerStart.angle = this.value;
            }
        );

        btn_checkpointAngleSlider = new SliderUI(
            screenWidthUI - 246,
            204,
            186,
            0,
            360,
            1,
            "Angle",
            MapEditor.loadedMap ? MapEditor.loadedMap.checkpoints[MapEditor.selectedElements[0][0]] : 0,
            function () {
                if (MapEditor.snapAmount > 0) {
                    this.updateState(Math.round(this.value / MapEditor.snapAmount) * MapEditor.snapAmount);
                }
                MapEditor.loadedMap.checkpoints[MapEditor.selectedElements[0][0]].angle = this.value;
            }
        );

        btn_wall = new Button(screenWidthUI - 120, 224, 60, "toggle_button", "toggle_button_pressed", 1, "", function (sync) {
            if (MapEditor.loadedMap) {
                // throws an error otherwise
                if (sync) {
                    this.toggle = MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].wall ? 1 : 0; // gets initial value of toggle
                } else {
                    if (this.toggle) {
                        this.toggle = 0;
                        MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].wall = 0;
                    } else {
                        this.toggle = 1;
                        MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].wall = 1;
                    }
                }
            }
        });

        btn_endzone = new Button(screenWidthUI - 120, 264, 60, "toggle_button", "toggle_button_pressed", 1, "", function (sync) {
            if (MapEditor.loadedMap) {
                // throws an error otherwise
                if (sync) {
                    this.toggle = MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].endzone ? 1 : 0; // gets initial value of toggle
                } else {
                    if (this.toggle) {
                        this.toggle = 0;
                        MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].endzone = 0;
                    } else {
                        this.toggle = 1;
                        MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].endzone = 1;
                    }
                }
            }
        });

        btn_duplicate_platform = new Button(screenWidthUI - 262, screenHeightUI - 90, 150, "", "", 0, "Duplicate", function () {
            let originPlatform = {
                x: null,
                y: null,
            };

            MapEditor.selectedElements.forEach((element) => {
                if (element != "playerStart" && !Array.isArray(element)) {
                    // only run for platforms

                    const newPlatform = { ...MapEditor.loadedMap.platforms[element] }; // get selected platform. spread syntax creates a shallow copy that doesn not link/reference

                    if (originPlatform.x == null) {
                        // set origin platform
                        originPlatform.x = MapEditor.loadedMap.platforms[element].x;
                        originPlatform.y = MapEditor.loadedMap.platforms[element].y;
                    }

                    const offsetFromOriginPlatformX = MapEditor.loadedMap.platforms[element].x - originPlatform.x;
                    const offsetFromOriginPlatformY = MapEditor.loadedMap.platforms[element].y - originPlatform.y;

                    (newPlatform.x = Math.round(MapEditor.screen.x) + offsetFromOriginPlatformX), // center it
                        (newPlatform.y = Math.round(MapEditor.screen.y) + offsetFromOriginPlatformY),
                        MapEditor.loadedMap.platforms.push(newPlatform); // add it

                    // deal with selections
                    if (MapEditor.multiSelect) {
                        MapEditor.selectedElements[MapEditor.selectedElements.indexOf(element)] = MapEditor.loadedMap.platforms.length - 1;
                    } else {
                        MapEditor.selectedElements = [MapEditor.loadedMap.platforms.length - 1];
                    }
                }
            });

            if (MapEditor.selectedElements.length == 1) {
                // only sync in single select
                // SYNC ALL BUTTONS AND SLIDERS
                btn_angleSlider.updateState(MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].angle);
                btn_wall.func(true); // syncs the wall button's toggle state
                btn_endzone.func(true); // syncs the enzone button's toggle state
            }
        });

        btn_delete_element = new Button(screenWidthUI - 99, screenHeightUI - 90, 56, "trash_button", "", 0, "", function () {
            MapEditor.selectedElements.forEach((element) => {
                // loop through and delete
                if (Array.isArray(element)) {
                    // delete checkpoint

                    MapEditor.loadedMap.checkpoints[element[0]] = "remove";
                } else if (element != "playerStart") {
                    // delete platform but DONT delete playerStart

                    MapEditor.loadedMap.platforms[element] = "remove"; // set a placeholder which will be removed by .filter
                }
            });

            MapEditor.loadedMap.checkpoints = MapEditor.loadedMap.checkpoints.filter((checkpoint) => checkpoint != "remove");
            MapEditor.loadedMap.platforms = MapEditor.loadedMap.platforms.filter((platform) => platform != "remove");

            MapEditor.selectedElements = []; // No selected elements after delete
            UserInterface.renderedButtons = UserInterface.btnGroup_mapEditorInterface;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_mapEditorInterface)
            UserInterface.switchToUiGroup(U)
        });

        // MAP SETTINGS SLIDERS
        btn_platformHeightSlider = new SliderUI(
            midX_UI,
            80,
            360,
            0,
            360,
            1,
            "Platform Height",
            MapEditor.loadedMap ? MapEditor.loadedMap.style.platformHeight : 0,
            function () {
                MapEditor.loadedMap.style.platformHeight = this.value;
                PreviewWindow.update();
            }
        );

        btn_wallHeightSlider = new SliderUI(
            midX_UI,
            140,
            360,
            0,
            360,
            1,
            "Wall Height",
            MapEditor.loadedMap ? MapEditor.loadedMap.style.wallHeight : 0,
            function () {
                MapEditor.loadedMap.style.wallHeight = this.value;
                PreviewWindow.update();
            }
        );

        btn_lightDirectionSlider = new SliderUI(
            midX_UI,
            200,
            360,
            0,
            360,
            1,
            "Light Direction",
            MapEditor.loadedMap ? MapEditor.loadedMap.style.lightDirection : 0,
            function () {
                MapEditor.loadedMap.style.lightDirection = this.value;
                PreviewWindow.update();
            }
        );

        btn_lightPitchSlider = new SliderUI(
            midX_UI,
            260,
            360,
            5,
            90,
            1,
            "Light Angle",
            MapEditor.loadedMap ? MapEditor.loadedMap.style.lightPitch : 0,
            function () {
                MapEditor.loadedMap.style.lightPitch = this.value;
                PreviewWindow.update();
            }
        );

        // COLOR PICKER BUTTONS AND SLIDERS
        btn_copyColor = new Button(ColorPicker.x + 154, ColorPicker.y + 46, 90, "", "", 0, "Copy", function () {
            ColorPicker.copyColor();
        });

        btn_pasteColor = new Button(ColorPicker.x + 254, ColorPicker.y + 46, 90, "", "", 0, "Paste", function () {
            ColorPicker.pasteColor();
        });

        btn_hueSlider = new SliderUI(ColorPicker.x + 16, ColorPicker.y + 148, ColorPicker.width - 32, 0, 360, 1, "Hue", ColorPicker.h, function () {
            ColorPicker.h = this.value;
            ColorPicker.updateElementColor();
            ColorPicker.syncGradients();
            if (ColorPicker.editingElement == 1 || ColorPicker.editingElement == 9 || ColorPicker.editingElement == 10) {
                UserInterface.determineButtonColor();
            }
        });

        btn_saturationSlider = new SliderUI(
            ColorPicker.x + 16,
            ColorPicker.y + 220,
            ColorPicker.width - 32,
            0,
            100,
            1,
            "Saturation",
            ColorPicker.s,
            function () {
                ColorPicker.s = this.value;
                ColorPicker.updateElementColor();
                ColorPicker.syncGradients();
                if (ColorPicker.editingElement == 1 || ColorPicker.editingElement == 9 || ColorPicker.editingElement == 10) {
                    UserInterface.determineButtonColor();
                }
            }
        );

        btn_lightnessSlider = new SliderUI(
            ColorPicker.x + 16,
            ColorPicker.y + 292,
            ColorPicker.width - 32,
            0,
            100,
            1,
            "Lightness",
            ColorPicker.l,
            function () {
                ColorPicker.l = this.value;
                ColorPicker.updateElementColor();
                ColorPicker.syncGradients();
                if (ColorPicker.editingElement == 1 || ColorPicker.editingElement == 9 || ColorPicker.editingElement == 10) {
                    UserInterface.determineButtonColor();
                }
            }
        );

        btn_unselectColor = new Button(screenWidthUI - 480, 32, 44, "x_button", "", 0, "", function () {
            UserInterface.renderedButtons = UserInterface.btnGroup_colorPickerState1;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState1);
            ColorPicker.editingElement = 0;
        });

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

        btn_backgroundColor = new Button(screenWidthUI - 498, 32, 208, "background_button", "", 0, "", function () {
            ColorPicker.editingElement = 1;
            UserInterface.renderedButtons = UserInterface.btnGroup_colorPickerState2; // kill
            UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState2);
            ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.backgroundColor);
            ColorPicker.updateSliders();
            ColorPicker.syncGradients();
        });

        btn_playerColor = new Button(screenWidthUI - 498, 116, 208, "player_button", "", 0, "", function () {
            ColorPicker.editingElement = 2;
            UserInterface.renderedButtons = UserInterface.btnGroup_colorPickerState2;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState2);
            ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.playerColor);
            ColorPicker.updateSliders();
            ColorPicker.syncGradients();
        });

        btn_directLightColor = new Button(screenWidthUI - 270, 32, 226, "direct_light_button", "", 0, "", function () {
            ColorPicker.editingElement = 9;
            UserInterface.renderedButtons = UserInterface.btnGroup_colorPickerState2;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState2);
            ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.directLight);
            ColorPicker.updateSliders();
            ColorPicker.syncGradients();
        });

        btn_ambientLightColor = new Button(screenWidthUI - 270, 116, 226, "ambient_light_button", "", 0, "", function () {
            ColorPicker.editingElement = 10;
            UserInterface.renderedButtons = UserInterface.btnGroup_colorPickerState2;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState2);
            ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.ambientLight);
            ColorPicker.updateSliders();
            ColorPicker.syncGradients();
        });

        btn_wallTopColor = new Button(screenWidthUI - 726, screenHeightUI - 172, 152, "top_button", "", 0, "", function () {
            ColorPicker.editingElement = 5;
            UserInterface.renderedButtons = UserInterface.btnGroup_colorPickerState2;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState2);
            ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.wallTopColor);
            ColorPicker.updateSliders();
            ColorPicker.syncGradients();
        });

        btn_wallSideColor = new Button(screenWidthUI - 726, screenHeightUI - 96, 152, "side_button", "", 0, "", function () {
            ColorPicker.editingElement = 6;
            UserInterface.renderedButtons = UserInterface.btnGroup_colorPickerState2;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState2);
            ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.wallSideColor);
            ColorPicker.updateSliders();
            ColorPicker.syncGradients();
        });

        btn_platformTopColor = new Button(screenWidthUI - 498, screenHeightUI - 172, 152, "top_button", "", 0, "", function () {
            ColorPicker.editingElement = 3;
            UserInterface.renderedButtons = UserInterface.btnGroup_colorPickerState2;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState2);
            ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.platformTopColor);
            ColorPicker.updateSliders();
            ColorPicker.syncGradients();
        });

        btn_platformSideColor = new Button(screenWidthUI - 498, screenHeightUI - 96, 152, "side_button", "", 0, "", function () {
            ColorPicker.editingElement = 4;
            UserInterface.renderedButtons = UserInterface.btnGroup_colorPickerState2;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState2);
            ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.platformSideColor);
            ColorPicker.updateSliders();
            ColorPicker.syncGradients();
        });

        btn_endZoneTopColor = new Button(screenWidthUI - 270, screenHeightUI - 172, 152, "top_button", "", 0, "", function () {
            ColorPicker.editingElement = 7;
            UserInterface.renderedButtons = UserInterface.btnGroup_colorPickerState2;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState2);
            ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.endZoneTopColor);
            ColorPicker.updateSliders();
            ColorPicker.syncGradients();
        });

        btn_endZoneSideColor = new Button(screenWidthUI - 270, screenHeightUI - 96, 152, "side_button", "", 0, "", function () {
            ColorPicker.editingElement = 8;
            UserInterface.renderedButtons = UserInterface.btnGroup_colorPickerState2;
            UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState2);
            ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.endZoneSideColor);
            ColorPicker.updateSliders();
            ColorPicker.syncGradients();
        });

        btn_lockWallColors = new Button(screenWidthUI - 570, screenHeightUI - 130, 56, "lock_button", "lock_button_pressed", 0, "", function () {
            if (this.toggle) {
                this.toggle = 0;
                ColorPicker.lockWallColors = true;
                MapEditor.loadedMap.style.wallSideColor = MapEditor.loadedMap.style.wallTopColor;
                PreviewWindow.update();
            } else {
                this.toggle = 1;
                ColorPicker.lockWallColors = false;
            }
        });

        btn_lockPlatformColors = new Button(screenWidthUI - 342, screenHeightUI - 130, 56, "lock_button", "lock_button_pressed", 0, "", function () {
            if (this.toggle) {
                this.toggle = 0;
                ColorPicker.lockPlatformColors = true;
                MapEditor.loadedMap.style.platformSideColor = MapEditor.loadedMap.style.platformTopColor;
                PreviewWindow.update();
            } else {
                this.toggle = 1;
                ColorPicker.lockPlatformColors = false;
            }
        });

        btn_lockEndzoneColors = new Button(screenWidthUI - 114, screenHeightUI - 130, 56, "lock_button", "lock_button_pressed", 0, "", function () {
            if (this.toggle) {
                this.toggle = 0;
                ColorPicker.lockEndzoneColors = true;
                MapEditor.loadedMap.style.endZoneSideColor = MapEditor.loadedMap.style.endZoneTopColor;
                PreviewWindow.update();
            } else {
                this.toggle = 1;
                ColorPicker.lockEndzoneColors = false;
            }
        });

        // GROUPS OF BUTTONS TO RENDER ON DIFFERENT PAGES

        this.btnGroup_mapEditorInterface = [
            btn_add_platform,
            btn_map_colors,
            btn_map_settings,
            btn_add_checkpoint,
            btn_dragSelect,
            btn_multiSelect,
            btn_snappingSlider,
        ];
        this.btnGroup_colorPickerState1 = [
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
            btn_lockWallColors,
            btn_lockPlatformColors,
            btn_lockEndzoneColors,
        ];
        this.btnGroup_colorPickerState2 = [
            btn_unselectColor,
            btn_copyColor,
            btn_pasteColor,
            btn_hueSlider,
            btn_saturationSlider,
            btn_lightnessSlider,
        ];
        this.btnGroup_mapSettings = [btn_platformHeightSlider, btn_wallHeightSlider, btn_lightDirectionSlider, btn_lightPitchSlider];
        this.btnGroup_editPlatform = [
            btn_unselect,

            btn_translate,
            btn_resize_BL,
            btn_resize_BR,
            btn_resize_TR,
            btn_resize_TL,
            btn_angleSlider,
            btn_wall,
            btn_endzone,

            btn_delete_element,
            btn_duplicate_platform,
            btn_dragSelect,
            btn_multiSelect,
            btn_snappingSlider,
        ];
        this.btnGroup_editPlayerStart = [
            btn_unselect,

            btn_translate,
            btn_playerAngleSlider,
            btn_dragSelect,
            btn_multiSelect,
            btn_snappingSlider,
        ];
        this.btnGroup_editCheckPoint = [
            btn_unselect,

            btn_translate,
            btn_checkpointAngleSlider,

            btn_delete_element,
            btn_dragSelect,
            btn_multiSelect,
            btn_snappingSlider,
        ];
        this.btnGroup_editMultiSelect = [
            btn_unselect,

            btn_delete_element,
            btn_duplicate_platform,
            btn_translate,
            btn_dragSelect,
            btn_multiSelect,
            btn_snappingSlider,
        ];

        this.btnGroup_dragSelect = [btn_dragSelect]; // dont even need

        // this.renderedButtons = this.btnGroup_mainMenu;
        this.renderedButtons = []; // kill eventually
    },

    mapLoaded: function () {
        // called at the end of Map.parseMapData()
        UserInterface.gamestate = 6;
        UserInterface.switchToUiGroup(this.uiGroup_inLevel);
    },

    getLeaderboards: async function () {
        // Get leaderboards (level medal times) directly through cordova local storage (www)

        const leaderboardData = await readFile("local", "assets/", "leaderboards.json", "text");
        this.leaderboards = JSON.parse(leaderboardData);
    },

    getSettings: async function () {
        try {
            const settingsData = await readFile("device", "", "settings.json", "text");
            this.settings = JSON.parse(settingsData);
        } catch (error) {
            if (error === "Failed to getFile: 1") {
                // File doesn't exist: initialize default settings
                this.settings = {
                    sensitivity: 0.5,
                    volume: 0.1,
                    debugText: 0,
                    strafeHUD: 1,
                    playTutorial: 1,
                };
                this.writeSettings();
            } else {
                console.error("Error while getting settings:", error);
                return;
            }
        }

        // Sync UI after settings are ready
        UserInterface.setSliderValue(btn_sensitivitySlider, UserInterface.settings.sensitivity);
        UserInterface.setSliderValue(btn_volumeSlider, UserInterface.settings.volume);
        UserInterface.setToggleState(btn_debugText, UserInterface.settings.debugText);
        UserInterface.setToggleState(btn_strafeHUD, UserInterface.settings.strafeHUD);
        UserInterface.setToggleState(btn_playTutorial, UserInterface.settings.playTutorial);
        AudioHandler.setVolume(UserInterface.settings.volume);
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
                            }
                        );
                    },
                    function (err) {
                        console.error("Error resolving data directory for creating /maps:", err);
                    }
                );
            }
        );
    },

    // Slider Get, Set, & updateDraggedSlider Functions

    setSliderValue: function (slider, value) {
        const min = parseFloat(slider.dataset.min);
        const max = parseFloat(slider.dataset.max);

        // Clamp the value to [min, max]
        const clamped = Math.min(Math.max(value, min), max);

        const step = parseFloat(slider.dataset.step) || 1;
        const stepSnapped = Math.round((clamped - min) / step) * step + min;

        const decimalPointsToUse = slider.dataset.step?.split(".")[1]?.length || 0;
        const stepSnappedRounded = stepSnapped.toFixed(decimalPointsToUse);

        // update data-value in HTML dataSet
        slider.dataset.value = stepSnappedRounded;

        // update the label to reflect new value
        slider.labelValue.textContent = stepSnappedRounded;

        // Convert value to percentage of the range for styling
        const percent = ((stepSnappedRounded - min) / (max - min)) * 100;
        slider.handle.style.setProperty("--pos", `${percent}%`);
    },

    getSliderValue: function (slider) {
        return parseFloat(slider.dataset.value);
    },

    updateDraggedSlider: function (slider) {
        const sliderRect = slider.getBoundingClientRect();
        const slidersTouchID = Number(slider.dataset.touchid);
        const touch = TouchHandler.touches.find((touch) => touch.identifier === slidersTouchID);

        const value = UserInterfaceCanvas.mapToRange(
            touch.x,
            sliderRect.left,
            sliderRect.right,
            Number(slider.dataset.min),
            Number(slider.dataset.max)
        );

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

    determineButtonColor: function () {
        let bgColor = CanvasArea.canvas.style.backgroundColor; // returns rgba string

        bgColor = bgColor.replace(/[^\d,.]/g, "").split(",");

        const luminance = (0.299 * bgColor[0] + 0.587 * bgColor[1] + 0.114 * bgColor[2]) / 255;
        // luminance = (0.299 * R + 0.587 * G + 0.114 * B)/255
        // console.log("luminance: " + luminance)

        this.darkMode = luminance > 0.77 ? true : false;
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

    drawMedal: function (x, y, radius, fillColor, strokeColor, strokeWidth, shadow) {
        // radius is accounts for stroke -- stroke is drawn inside of shape
        const oldFill = UserInterfaceCanvas.ctx.fillStyle;

        if (shadow) {
            UserInterfaceCanvas.ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
            UserInterfaceCanvas.ctx.beginPath();
            UserInterfaceCanvas.ctx.arc(x + 3, y + 3, radius, 0, 2 * Math.PI); // (x, y, radius, startAngle, endAngle)
            UserInterfaceCanvas.ctx.fill();
        }

        UserInterfaceCanvas.ctx.fillStyle = fillColor;
        UserInterfaceCanvas.ctx.strokeStyle = strokeColor;
        UserInterfaceCanvas.ctx.lineWidth = strokeWidth;

        UserInterfaceCanvas.ctx.beginPath();
        UserInterfaceCanvas.ctx.arc(x, y, radius - strokeWidth / 2, 0, 2 * Math.PI); // (x, y, radius, startAngle, endAngle)

        UserInterfaceCanvas.ctx.fill();
        UserInterfaceCanvas.ctx.stroke();

        UserInterfaceCanvas.ctx.fillStyle = oldFill;
    },

    getOrdinalSuffix: function (i) {
        // turns 1 into 1st, 2 into 2nd UNUSED KILL
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
        if (UserInterfaceCanvas.ctx.measureText(text).width > clampToWidth) {
            while (UserInterfaceCanvas.ctx.measureText(text + "...").width > clampToWidth || text.endsWith(" ")) {
                // also removes end char if its a space
                text = text.slice(0, -1); // slice off last character
            }
            return text + "...";
        } else {
            return text;
        }
    },

    switchToUiGroup: function (uiGroup) {
        // alternative way that removes the need to track current active uiGroup
        // const visibleElements = document.querySelectorAll('#ui-container :not(.hidden)');

        // there is also this .toggle function if it is applicable to use here
        // element.classList.toggle("hidden");

        // Hide all ui elements currently showing
        for (element of this.activeUiGroup) {
            element.classList.add("hidden");
        }

        // Unhide all ui elements in uiGroup
        for (element of uiGroup) {
            element.classList.remove("hidden");
        }

        this.activeUiGroup = uiGroup;
    },

    removeUiElement: function (uiElement) {
        this.switchToUiGroup(this.activeUiGroup.filter((item) => item !== uiElement));
    },

    addUiElement: function (uiElement, allowDuplicates = false) {
        if (!this.activeUiGroup.includes(uiElement) || allowDuplicates) {
            this.switchToUiGroup(this.activeUiGroup.concat(uiElement));
        }
    },

    isPointInsideElement: function (x, y, element) {
        const rect = element.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    },

    touchStarted: function (x, y, id) {
        // Called By TouchHandler
        this.renderedButtons.forEach((button) => {
            // kill eventually
            if (button.constructor.name == "Button") {
                // only run on buttons not sliders
                if (
                    // if x and y touch is within button
                    x >= button.x &&
                    x <= button.x + button.width &&
                    y >= button.y &&
                    y <= button.y + button.height
                ) {
                    button.pressed();
                }
            }
        });

        this.renderedButtons.forEach((slider) => {
            // kill eventually
            if (slider.constructor.name == "SliderUI") {
                // only run on sliders
                if (
                    // if x and y touch is near slider handle
                    Math.abs(x - slider.sliderX) < 30 &&
                    Math.abs(y - slider.y) < 30
                ) {
                    slider.confirmed = false;
                }
            }
        });

        // NEW DOM BASED UI

        for (uiElement of this.activeUiGroup) {
            // butons and toggles
            if (uiElement.nodeName.toLowerCase() === "button" || uiElement.classList.contains("toggle-container")) {
                // only run buttons and toggles (and sliders eventually)

                if (this.isPointInsideElement(x, y, uiElement)) {
                    uiElement.classList.add("pressed");
                }
            }
            // sliders
            if (uiElement.classList.contains("slider")) {
                if (this.isPointInsideElement(x, y, uiElement.handle)) {
                    uiElement.handle.classList.add("pressed");
                    uiElement.dataset.touchid = id;
                }
            }
        }

        if (this.gamestate == 6 && this.levelState !== 3) {
            // In Level and not at endscreen
            this.addUiElement(ui_strafeHelper);
        }
    },

    touchReleased: function (x, y, id) {
        // Called By TouchHandler

        // run button's function if clicked
        // run MapEditor.touchRelease if active and no buttons are pressed

        let editorIgnoreRelease = false;

        this.renderedButtons.forEach((button) => {
            if (button.constructor.name == "Button") {
                // only run on buttons not sliders
                if (
                    // if x and y touch is within button
                    x >= button.x &&
                    x <= button.x + button.width &&
                    y >= button.y &&
                    y <= button.y + button.height &&
                    (MapBrowser.scrollVel == 0 || MapBrowser.scrollAmount == null) && // dont release if scrolling through Map Browser
                    MapEditor.dragSelect == false // dont release if dragSelecting in Map Editor
                ) {
                    editorIgnoreRelease = true;
                    button.released();
                }
                button.isPressed = false;
            }
        });

        // NEW BUTTONS
        for (uiElement of this.activeUiGroup) {
            if (uiElement.nodeName.toLowerCase() === "button" || uiElement.classList.contains("toggle-container")) {
                if (
                    this.isPointInsideElement(x, y, uiElement) &&
                    uiElement.classList.contains("pressed") &&
                    (MapBrowser.scrollVel == 0 || MapBrowser.scrollAmount == null) && // dont release if scrolling through Map Browser
                    MapEditor.dragSelect == false // dont release if dragSelecting in Map Editor
                ) {
                    uiElement.func();
                    editorIgnoreRelease = true;
                }
                uiElement.classList.remove("pressed");

                // SLIDERS
            } else if (uiElement.classList.contains("slider") && Number(uiElement.dataset.touchid) == id) {
                uiElement.func();
                uiElement.handle.classList.remove("pressed");
                editorIgnoreRelease = true;
            }
        }

        if (this.gamestate == 6) {
            // In Level
            if (TouchHandler.touches.length == 0) {
                // no more touches on screen
                UserInterface.removeUiElement(ui_strafeHelper);
            }
        }

        if (
            // In MapEditor and no button was pressed -> pass touch onto MapEditor's logic checks
            editorIgnoreRelease == false &&
            UserInterface.gamestate == 7 &&
            (MapEditor.editorState == 1 || MapEditor.editorState == 2)
        ) {
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
                Math.abs(this.previousRecord - this.records[Map.name])
            )})`;
        } else {
            // display normal record
            ui_endScreen.querySelector(".yourRecord").textContent = `Best Time: ${this.secondsToMinutes(this.records[Map.name])}`;
        }

        // update medal times and activeMedal OR hide medal list
        const mapLeaderboard = this.leaderboards[Map.name];
        if (mapLeaderboard !== undefined) {
            ui_endScreen.querySelector(".medalList").classList.remove("hidden");

            const goldMedal = ui_endScreen.querySelector(".gold");
            const silverMedal = ui_endScreen.querySelector(".silver");
            const bronzeMedal = ui_endScreen.querySelector(".bronze");

            // update times
            goldMedal.textContent = this.secondsToMinutes(mapLeaderboard.gold);
            silverMedal.textContent = this.secondsToMinutes(mapLeaderboard.silver);
            bronzeMedal.textContent = this.secondsToMinutes(mapLeaderboard.bronze);

            // remove activeMedal from all
            goldMedal.classList.remove("activeMedal");
            silverMedal.classList.remove("activeMedal");
            bronzeMedal.classList.remove("activeMedal");

            // set activeMedal
            if (this.timer <= mapLeaderboard.gold) {
                goldMedal.classList.add("activeMedal");
            } else if (this.timer <= mapLeaderboard.silver) {
                silverMedal.classList.add("activeMedal");
            } else if (this.timer <= mapLeaderboard.bronze) {
                bronzeMedal.classList.add("activeMedal");
            }
        } else {
            // No leaderboards -> hide medal list
            ui_endScreen.querySelector(".medalList").classList.add("hidden");
        }
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
        // update dragged Sliders every frame
        // sliders are only in Settings Page and MapEditor Pages
        if (this.gamestate == 3 || MapEditor.loadedMap) {
            this.renderedButtons.forEach((button) => {
                // kill eventually
                // LOOP RENDERED BUTTONS
                if (button.constructor.name == "SliderUI") {
                    // run .update() for only Sliders
                    button.update();
                }
            });

            // NEW DOM WAY
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
                    // FIX DONT CALCULATE THE RECORD EVERY TIME -- CACHE IT
                    ui_timerBox.children[1].textContent = `Record: ${UserInterface.secondsToMinutes(
                        this.records[Map.name] == null ? 0 : this.records[Map.name]
                    )}`;
                }
            }

            if (this.levelState == 2) {
                // FIX do this below \/ CSS change only when player is first paused or unpaused not by checking every frame
                const speedometerTopValue = parseFloat(window.getComputedStyle(ui_speedometer).top);

                if (!Tutorial.pausePlayer) {
                    // player is NOT paused
                    this.timer = Date.now() - this.timerStart;

                    // Update Speed Text. ADD COLOR AND SIZE CHANGES TO THIS BASED OFF OF GAIN
                    ui_speedometer.textContent = `Speed: ${Math.round(Player.velocity.magnitude())}`;

                    // move Speed Text down to normal spot (dont do this check every frame only when first unpausing FIX )
                    if (speedometerTopValue === 8) {
                        ui_speedometer.style.top = "32px";
                    }
                } else {
                    // player IS paused
                    this.timerStart += Date.now() - this.timer - this.timerStart; // dont progress timer when paused

                    // move Speed Text up (dont do this check every frame only when first pausing FIX )
                    if (speedometerTopValue === 32) {
                        ui_speedometer.style.top = "8px";
                    }
                }
            }
        }
    },

    render: function () {
        const ctx = UserInterfaceCanvas.ctx;
        ctx.save(); // UI SCALING SAVE
        ctx.scale(UserInterfaceCanvas.scale, UserInterfaceCanvas.scale); // All UI elements are positioned on original CSS cords. this brings them up to device DPI resolution

        if (this.gamestate == 1) {
            // In Main Menu
            // FIX dont set this here every frame
            // also dont use canvas as BG
            // CanvasArea.canvas.style.backgroundColor = "#a3d5e1";
        }

        if (this.gamestate == 6) {
            // In Level
            ctx.fillStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1;

            if (this.settings.debugText == 1) {
                // DRAWING DEBUG TEXT
                const textX = 150;
                ctx.font = "8px BAHNSCHRIFT";
                ctx.fillStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1;

                ctx.fillText("fps: " + Math.round(1 / dt), textX, 50);
                ctx.fillText("rounded dt: " + Math.round(dt * 1000) / 1000 + " seconds", textX, 60);
                ctx.fillText("renderedPlatforms Count: " + Map.renderedPlatforms.length, textX, 70);
                ctx.fillText("endZonesToCheck: " + Map.endZonesToCheck, textX, 80);
                ctx.fillText("dragging: " + TouchHandler.dragging, textX, 90);
                ctx.fillText("cameraZoom: " + Player.speedCameraOffset.zoom, textX, 100);
                ctx.fillText(
                    "offsetDir: " + Math.round(Player.speedCameraOffset.direction.x) + ", " + Math.round(Player.speedCameraOffset.direction.y),
                    textX,
                    110
                );
                if (TouchHandler.dragging) {
                    ctx.fillText("touch x: " + TouchHandler.touches[0].x, textX, 120);
                    ctx.fillText("touch y: " + TouchHandler.touches[0].y, textX, 130);
                }
                ctx.fillText("dragAmountX: " + TouchHandler.dragAmountX, textX, 140);
                ctx.fillText("velocity: " + Math.round(Player.velocity.magnitude()), textX, 150);
                ctx.fillText("Player pos: " + Math.round(Player.x) + ", " + Math.round(Player.y), textX, 160);
                ctx.fillText("lookAngle: " + Player.lookAngle.getAngleInDegrees(), textX, 170);
                ctx.fillText("Timer: " + UserInterface.secondsToMinutes(this.timer), textX, 180);

                /*
                // DRAWING PLAYER MOVEMENT DEBUG VECTORS
                // Player wish_velocity
                ctx.strokeStyle = "#FF00FF";
                ctx.lineWidth = 2
                ctx.beginPath();
                ctx.moveTo(midX_UI, midY_UI);
                ctx.lineTo(midX_UI + Player.wish_velocity.x * 75, midY_UI + Player.wish_velocity.y * 75);
                ctx.stroke();

                // Player velocity
                ctx.strokeStyle = "#0000FF";
                ctx.lineWidth = 4
                ctx.beginPath();
                ctx.moveTo(midX_UI, midY_UI);
                ctx.lineTo(midX_UI + Player.velocity.x, midY_UI + Player.velocity.y);
                ctx.stroke();

                // Player lookAngle
                ctx.strokeStyle = "#FF00FF";
                ctx.lineWidth = 2
                ctx.beginPath();
                ctx.moveTo(midX_UI, midY_UI);
                ctx.lineTo(midX_UI + Player.lookAngle.x * 100, midY_UI + Player.lookAngle.y * 100);
                ctx.stroke();

                ctx.strokeStyle = "#000000"; // resetting
                ctx.lineWidth = 1
                */
            }

            if (this.settings.strafeHUD == 1) {
                // STRAFE OPTIMIZER HUD
                if (this.settings.debugText == 1) {
                    // disabled
                    /*
                    // DRAW THE LITTLE GRAPHS UNDER PLAYER
                    ctx.save()
                    ctx.fillStyle = "blue"
                    ctx.fillRect(midX_UI - 32, midY_UI + 32, 10 * Math.abs(TouchHandler.dragAmountX) * this.settings.sensitivity, 6); // YOUR STRAFE
                    ctx.fillRect(midX_UI - 32, midY_UI + 42, Player.addSpeed, 6); // ADDSPEED
                    ctx.fillRect(midX_UI - 32, midY_UI + 52, 320 * airAcceleration * dt, 6); // Top End clip LIMIT

                    // little text for strafeHelper
                    ctx.font = "12px BAHNSCHRIFT";
                    ctx.fillStyle = "white"
                    ctx.fillText(TouchHandler.dragAmountX * this.settings.sensitivity, midX_UI - 100, midY_UI + 38)
                    ctx.fillText("addSpeed: " + Player.addSpeed, midX_UI - 100, midY_UI + 48)
                    ctx.fillText("addSpeed Clip: " + 320 * airAcceleration * dt, midX_UI - 100, midY_UI + 58)
                    ctx.restore()
                    */
                }

                if (TouchHandler.dragging && this.levelState != 3) {
                    if (Tutorial.pausePlayer == false) {
                        ctx.font = "16px BAHNSCHRIFT";

                        if (this.showOverstrafeWarning) {
                            heightOffset = this.showVerticalWarning ? 36 : 0;
                            UserInterfaceCanvas.roundedRect(
                                midX_UI - 150,
                                screenHeightUI - 130 - heightOffset,
                                ctx.measureText("TURNING TOO FAST!").width + 24,
                                24,
                                8
                            );
                            ctx.fillStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1;
                            ctx.fill();

                            ctx.fillStyle = !UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1;
                            ctx.fillText("TURNING TOO FAST!", midX_UI - 138, screenHeightUI - 120 - heightOffset);
                        }
                    }
                }
            }
        }

        if (this.gamestate == 7) {
            // In Map Editor

            if (MapEditor.editorState == 3) {
                // IN COLOR SETTINGS
                ColorPicker.render();
            }

            if (MapEditor.loadedMap !== null && MapEditor.editorState != 3 && MapEditor.editorState != 4) {
                // MAP EDITOR UI
                ctx.save(); // to revert map editor canvas state changes

                ctx.font = "15px BAHNSCHRIFT";

                if (MapEditor.editorState == 1 || MapEditor.editorState == 2) {
                    // Draw UI (not Side Panel yet) for Main edit screen or platform edit screen
                    ctx.fillStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1;
                    ctx.fillText("Drag Select", btn_dragSelect.x, btn_dragSelect.y - 14);
                    if (!MapEditor.dragSelect) {
                        ctx.fillText("Group Select", btn_multiSelect.x, btn_multiSelect.y - 14);
                    }

                    // Draw dragSelect rectangle marquee
                    if (MapEditor.dragSelect && TouchHandler.dragging) {
                        ctx.lineWidth = 4;
                        ctx.strokeStyle = ctx.fillStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1;
                        ctx.setLineDash([6, 10]);
                        ctx.strokeRect(
                            MapEditor.dragSelectMarquee.x,
                            MapEditor.dragSelectMarquee.y,
                            MapEditor.dragSelectMarquee.width,
                            MapEditor.dragSelectMarquee.height
                        );
                        ctx.setLineDash([]);
                    }
                }

                if (MapEditor.editorState == 2 && !MapEditor.dragSelect) {
                    // DRAWING SIDE PANEL

                    const sidePanel = {
                        // If these change also change the values in MapEditor.touchReleased()
                        x: screenWidthUI - 262,
                        y: 22,
                        width: 218,
                        height: 292,
                    };

                    // SIDE PANEL BG BOX
                    ctx.fillStyle = UserInterface.darkMode ? UserInterface.lightColor_1 : UserInterface.darkColor_1;
                    UserInterfaceCanvas.roundedRect(sidePanel.x, sidePanel.y, sidePanel.width, sidePanel.height, 27.5);
                    ctx.fill();

                    ctx.fillStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1; // for text

                    if (MapEditor.multiSelect && MapEditor.selectedElements.length > 1) {
                        // MULTISELECTED

                        ctx.fillText("Group Selection", sidePanel.x + 16, sidePanel.y + 84);
                        ctx.fillText(MapEditor.selectedElements.length + " Items", sidePanel.x + 16, sidePanel.y + 108);
                    } else {
                        if (MapEditor.selectedElements[0] == "playerStart") {
                            // playerStart is selected
                            ctx.fillText("Player Start", sidePanel.x + 84, sidePanel.y + 38);
                            ctx.fillText(
                                "Position: " + MapEditor.loadedMap.playerStart.x + ", " + MapEditor.loadedMap.playerStart.y,
                                sidePanel.x + 16,
                                sidePanel.y + 84
                            );
                        } else if (Array.isArray(MapEditor.selectedElements[0])) {
                            // checkpoint is selected
                            ctx.fillText("Checkpoint", sidePanel.x + 84, sidePanel.y + 38);
                            ctx.fillText(
                                "Trigger 1: " +
                                    MapEditor.loadedMap.checkpoints[MapEditor.selectedElements[0][0]].triggerX1 +
                                    ", " +
                                    MapEditor.loadedMap.checkpoints[MapEditor.selectedElements[0][0]].triggerY1,
                                sidePanel.x + 16,
                                sidePanel.y + 84
                            );
                            ctx.fillText(
                                "Trigger 2: " +
                                    MapEditor.loadedMap.checkpoints[MapEditor.selectedElements[0][0]].triggerX2 +
                                    ", " +
                                    MapEditor.loadedMap.checkpoints[MapEditor.selectedElements[0][0]].triggerY2,
                                sidePanel.x + 16,
                                sidePanel.y + 108
                            );
                            ctx.fillText(
                                "Respawn: " +
                                    MapEditor.loadedMap.checkpoints[MapEditor.selectedElements[0][0]].x +
                                    ", " +
                                    MapEditor.loadedMap.checkpoints[MapEditor.selectedElements[0][0]].y,
                                sidePanel.x + 16,
                                sidePanel.y + 132
                            );
                        } else {
                            // platform is selected
                            ctx.fillText("Platform", sidePanel.x + 84, sidePanel.y + 38);
                            const approxSignX = MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].x % 1 == 0 ? "" : "~";
                            const approxSignY = MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].y % 1 == 0 ? "" : "~";
                            ctx.fillText(
                                "Position: " +
                                    approxSignX +
                                    Math.round(MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].x) +
                                    ", " +
                                    approxSignY +
                                    Math.round(MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].y),
                                sidePanel.x + 16,
                                sidePanel.y + 84
                            );
                            ctx.fillText(
                                "Size: " +
                                    MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].width +
                                    ", " +
                                    MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].height,
                                sidePanel.x + 16,
                                sidePanel.y + 108
                            );
                            ctx.fillText(
                                "Wall: " + (MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].wall ? "Yes" : "No"),
                                sidePanel.x + 16,
                                sidePanel.y + 224
                            );
                            ctx.fillText(
                                "End Zone: " + (MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].endzone ? "Yes" : "No"),
                                sidePanel.x + 16,
                                sidePanel.y + 264
                            );
                        }
                    }
                }

                if (UserInterface.settings.debugText == 1) {
                    // GENERAL MAP EDITOR DEBUG TEXT
                    const textX = 150;
                    ctx.font = "8px BAHNSCHRIFT";
                    ctx.fillStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1;

                    ctx.fillText("zoom: " + MapEditor.zoom, textX, 50);
                    ctx.fillText("screen.x: " + MapEditor.screen.x, textX, 60);
                    ctx.fillText("screen.y: " + MapEditor.screen.y, textX, 70);
                    ctx.fillText("screen.width: " + MapEditor.screen.width, textX, 80);
                    ctx.fillText("screen.height: " + MapEditor.screen.height, textX, 90);
                    ctx.fillText("screen.cornerX: " + MapEditor.screen.cornerX, textX, 100);
                    ctx.fillText("screen.cornerY: " + MapEditor.screen.cornerY, textX, 110);

                    ctx.fillText("rendered platforms: " + MapEditor.renderedPlatforms.length, textX, 120);
                    ctx.fillText("editorState: " + MapEditor.editorState, textX, 130);
                    ctx.fillText("selectedElements: " + MapEditor.selectedElements, textX, 140);

                    if (TouchHandler.dragging) {
                        ctx.fillText(
                            "touch (UI cords): " + Math.round(TouchHandler.touches[0].x) + ", " + Math.round(TouchHandler.touches[0].y),
                            textX,
                            150
                        );
                        const touchMapped = MapEditor.convertToMapCord(TouchHandler.touches[0].x, TouchHandler.touches[0].y);
                        ctx.fillText("touch global map coords: " + Math.round(touchMapped.x) + ", " + Math.round(touchMapped.y), textX, 160);

                        if (MapEditor.dragSelect) {
                            const globalMarqueeCornerTL = MapEditor.convertToMapCord(MapEditor.dragSelectMarquee.x, MapEditor.dragSelectMarquee.y);
                            const globalMarqueeCornerBR = MapEditor.convertToMapCord(
                                MapEditor.dragSelectMarquee.x + MapEditor.dragSelectMarquee.width,
                                MapEditor.dragSelectMarquee.y + MapEditor.dragSelectMarquee.height
                            );

                            ctx.fillText(
                                "global marquee: " +
                                    Math.round(globalMarqueeCornerTL.x) +
                                    "," +
                                    Math.round(globalMarqueeCornerTL.y) +
                                    "," +
                                    Math.round(globalMarqueeCornerBR.x - globalMarqueeCornerTL.x) +
                                    "," +
                                    Math.round(globalMarqueeCornerBR.y - globalMarqueeCornerTL.y),
                                textX,
                                170
                            );
                        }
                    }

                    ctx.fillText("zoom ratio: " + TouchHandler.zoom.ratio, textX, 180);

                    if (TouchHandler.zoom.isZooming) {
                        // draw center point between two fingers of zoom
                        ctx.save();
                        ctx.translate(TouchHandler.zoom.x, TouchHandler.zoom.y);
                        ctx.fillRect(-3, -3, 6, 6);
                        ctx.restore();
                    }
                }
                ctx.restore(); //revert back map editor canvas state changes
            }
        }

        this.renderedButtons.forEach((button) => {
            // LOOP RENDERED BUTTONS AND RUN THEIR .render()
            button.render();
        });

        ctx.restore(); // UI SCALING RESTORE
    },
};
