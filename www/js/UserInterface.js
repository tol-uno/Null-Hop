const UserInterface = {
    gamestate: 1,
    // 1: main menu
    // 2: level select map browser
    // 3: settings
    // 4: store
    // 5: loading map page
    // 6: in level
    // 7: in map editor

    activeUiGroup: new Set(),
    DomParser: new DOMParser(),
    uiContainer: document.getElementById("ui-container"),

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

    records: {}, // users records (personal bests) for each level theyve completed
    previousRecord: 0,

    speedAverager: new Averager(30), // for adjusting how speedometer looks. Not Used

    showVerticalWarning: false,
    showOverstrafeWarning: false,

    orientation: null,
    darkMode: false,

    // should kill these eventually and only use ones defined in CSS
    lightColor_1: "#F5F5F5", // lighter
    lightColor_2: "#E0E0E0", // darker
    darkColor_1: "#454545",
    darkColor_2: "#363636",

    medals: {
        Awakening: {
            gold: 18000,
            silver: 25000,
            bronze: 40000,
        },
        Pitfall: {
            gold: 35000,
            silver: 45000,
            bronze: 60000,
        },
        "Cavern Abyss": {
            gold: 40000,
            silver: 50000,
            bronze: 65000,
        },
        Crystals: {
            gold: 25000,
            silver: 35000,
            bronze: 55000,
        },
        Surfacing: {
            gold: 75000,
            silver: 100000,
            bronze: 140000,
        },
        "Wheat Fields": {
            gold: 6000,
            silver: 9000,
            bronze: 18000,
        },
        Trespass: {
            gold: 50000,
            silver: 65000,
            bronze: 90000,
        },
        Turmoil: {
            gold: 30000,
            silver: 40000,
            bronze: 55000,
        },
        "Tangled Forest": {
            gold: 8500,
            silver: 10000,
            bronze: 15000,
        },
        Pinnacle: {
            gold: 70000,
            silver: 90000,
            bronze: 120000,
        },
        Moonlight: {
            gold: 40000,
            silver: 50000,
            bronze: 60000,
        },
        Rapture: {
            gold: 18000,
            silver: 25000,
            bronze: 35000,
        },
        Forever: {
            gold: 60000,
            silver: 75000,
            bronze: 90000,
        },
    },

    start: function () {
        // where all buttons are created

        this.getSettings();
        this.getRecords();
        this.checkCustomMapsDirectoryExists();

        screen.orientation.addEventListener("change", function (event) {
            UserInterface.orientation = event.target.type.startsWith("landscape") ? "landscape" : "portrait";

            CanvasArea.setSize();
            PlayerCanvas.setSize();

            if (UserInterface.gamestate == 2) {
                MapBrowser.setMaxScroll();
                // FIX should multiply the scrollPos by the ratio of the Map Buttons dimensions to stay in the same position
                return;
            }

            // rotating the screen while the keyboard is up resets the visualViewport.offsetTop
            // offsetTop is what makes sure the text field is in view. It is set by browser when the keyboard is opened
            // when offsetTop gets reset it can cause the text field to go out of frame behind the keyboard. This is a solution to that:
            if (MapEditor.editorState == 5 && UserInterface.activeUiGroup.has(ui_inputMapName) && document.activeElement == ui_inputMapName.domReference) {
                // scroll the screen up to center the input within the remaining visualViewport (area left over after keyboard covers screen)

                window.scrollTo(0, 0); // reset so that positioning readings are accurate
                // wait intil visualViewport is ready to be measured
                visualViewport.addEventListener(
                    "resize",
                    function () {
                        const textBox = ui_inputMapName.domReference.getBoundingClientRect();
                        window.scrollTo(0, textBox.top + textBox.height / 2 - window.visualViewport.height / 2);
                        // vertical distance between the center of the textbox and the middle point of available screen height
                    },
                    { once: true },
                );
            }
        });


        // ===========
        //  UI GROUPS
        // ===========
        this.uiGroup_mainMenu = new Set([ui_menuBackground, ui_mainTitle, btn_play, btn_settings, btn_mapEditor]);
        this.uiGroup_settings = new Set([btn_mainMenu, slider_sensitivity, slider_volume, toggle_debugText, toggle_strafeHUD, btn_resetSettings]);
        this.uiGroup_standardMapBrowser = new Set([
            btn_mainMenu,
            btn_customMaps,
            ui_mapInfoBox,
            // btn_playMap, // added dynamically
            // toggle_playTutorial, // added dynamically
            ui_mapListContainer,
            // all levels are added as children of ui_mapListContainer
        ]);
        this.uiGroup_customMapBrowser = new Set([btn_mainMenu, ui_createCustomMapInfo, ui_mapInfoBox, ui_customMapListContainer]);
        this.uiGroup_inLevel = new Set([
            ui_speedometer,
            ui_jumpStats,
            ui_timerBox,
            ui_strafeHelper,
            ui_warningContainer,
            // ui_verticalWarning,
            // ui_overstrafeWarning, // broken
            btn_mainMenu,
            btn_restart,
            btn_jump,
        ]);
        this.uiGroup_endScreen = new Set([ui_speedometer, btn_mainMenu, btn_restart, ui_endScreen]);

        this.uiGroup_mapEditorMapBrowser = new Set([btn_mainMenu, ui_customMapListContainer, ui_mapInfoBox, btn_newMap, btn_importMap]);

        this.uiGroup_mapEditorInterface = new Set([
            btn_exitMapEditor,
            btn_addPlatform,
            btn_addCheckpoint,
            btn_mapSettings,
            btn_mapColors,
            toggle_dragSelect,
            toggle_multiSelect,
            slider_snapping,
        ]);
        this.uiGroup_editPlatform = new Set([
            btn_exitMapEditor,
            toggle_dragSelect,
            toggle_multiSelect,
            slider_snapping,
            btn_translate,
            btn_resize_BL,
            btn_resize_BR,
            btn_resize_TR,
            btn_resize_TL,
            ui_editorSidePanel_platform,
            // btn_unselect,
            // slider_platformAngle,
            // toggle_wall,
            // toggle_endzone,
            btn_deleteElements,
            btn_duplicateElements,
        ]);
        this.uiGroup_editPlayerStart = new Set([
            btn_exitMapEditor,
            toggle_dragSelect,
            toggle_multiSelect,
            btn_translate,
            slider_snapping,
            ui_editorSidePanel_player,
            // btn_unselect,
            // slider_playerAngle,
        ]);
        this.uiGroup_editCheckpoint = new Set([
            btn_exitMapEditor,
            toggle_dragSelect,
            toggle_multiSelect,
            btn_translate,
            slider_snapping,
            ui_editorSidePanel_checkpoint,
            // btn_unselect,
            // slider_checkpointAngle,
            btn_deleteElements,
        ]);
        this.uiGroup_editMultiSelect = new Set([
            btn_exitMapEditor,
            toggle_dragSelect,
            toggle_multiSelect,
            btn_translate,
            slider_snapping,
            ui_editorSidePanel_multi,
            // btn_unselect,
            btn_deleteElements,
            btn_duplicateElements,
        ]);

        this.uiGroup_colorPickerState1 = new Set([
            btn_mainMenu,
            ui_colorPicker_walls,
            ui_colorPicker_platforms,
            ui_colorPicker_endZones,
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

            toggle_syncWallColors,
            toggle_syncPlatformColors,
            toggle_syncEndZoneColors,
        ]);
        this.uiGroup_colorPickerState2 = new Set([
            ui_colorPicker,
            btn_unselectColor,
            btn_copyColor,
            btn_pasteColor,
            slider_hue,
            slider_saturation,
            slider_lightness,
        ]);
        this.uiGroup_mapSettings = new Set([btn_mainMenu, slider_platformHeight, slider_wallHeight, slider_lightDirection, slider_lightPitch]);

        this.uiGroup_saveExistingMap = new Set([btn_cancel, ui_mapEditorSaveText, ui_saveExistingMapBtnContainer]);
        this.uiGroup_saveNewMap = new Set([btn_cancel, ui_mapEditorSaveText, ui_saveNewMapBtnContainer]); //btn_save btn_saveAsCopy btn_discard
        this.uiGroup_deleteRecord = new Set([btn_resetRecord, ui_mapEditorSaveText, btn_keepRecord]); //btn_save btn_discard
        this.uiGroup_inputMapName = new Set([btn_cancel, ui_mapEditorSaveText, ui_inputMapName, btn_submitMapName]); // ui_mapNameErrorText
        this.uiGroup_confirmDiscard = new Set([btn_cancel, ui_mapEditorSaveText, btn_confirmDeleteEdits]);

        this.switchToUiGroup(UserInterface.uiGroup_mainMenu);
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

        // Sync
        AudioHandler.setVolume(this.settings.volume);

        if (this.settings.debugText) {
            // ui_debugText shouldn't ever get added to activeGroup because it would get removed on a ui group switches
            UserInterface.addUiElement(ui_debugText);
        }
    },

    writeSettings: function () {
        const settingsBlob = new Blob([JSON.stringify(this.settings, null, 2)], { type: "application/json" });
        writeFile("settings.json", settingsBlob);
    },

    getRecords: async function () {
        try {
            const recordsData = await readFile("device", "", "records.json", "text");
            if (recordsData) {
                this.records = JSON.parse(recordsData);
            }
        } catch (error) {
            // records.json doesn't exist -- initialize empty records file
            this.records = {
                unlocked: 1,
            };
            this.writeRecords(); // Write the default empty records to file
        }
    },

    removeRecord: async function (mapName) {
        delete this.records[mapName];
        this.writeRecords();
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
            if (ui_timerBox.domReference) {
                // timerbox doesnt exist in tutorial
                ui_timerBox.domReference.children[1].textContent = `Record: ${this.secondsToMinutes(this.records[Map.name] == null ? 0 : this.records[Map.name])}`;
            }
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

    setSliderValue: function (rawSlider, value, unsnapped = false) {
        // slider param ^ was changed to rawSlider to avoid needing to change all mentions of it in the function

        // kill and revert param eventually
        let slider = rawSlider;
        if (rawSlider.domReference) {
            slider = rawSlider.domReference;
        }

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

        // Re-clamp after rounding to avoid edge overflow
        stepSnappedRoundedNum = Math.min(Math.max(stepSnappedRoundedNum, min), max);

        // Create string version for display (preserving decimal precision)
        const stepSnappedRoundedStr = stepSnappedRoundedNum.toFixed(decimalPointsToUse);

        // Update dataset and label
        slider.dataset.value = stepSnappedRoundedNum; // numeric for internal logic

        // ===== UPDATE THIS ===== once all sliders are on new system
        rawSlider.labelValue.textContent = stepSnappedRoundedStr; // formatted for display

        // Convert to % of range for styling
        const percent = ((stepSnappedRoundedNum - min) / (max - min)) * 100;
        // ===== ALSO UPDATE HERE ======
        rawSlider.handle.style.setProperty("--pos", `${percent}%`);
    },

    getSliderValue: function (rawSlider) {
        // slider param ^ was changed to rawSlider to avoid needing to change all mentions of it in the function

        // kill and revert param eventually
        let slider = rawSlider;
        if (rawSlider.domReference) {
            slider = rawSlider.domReference;
        }

        return parseFloat(slider.dataset.value);
    },

    // called every frame on sliders that are pressed (settings screen and in map editor)
    updateDraggedSlider: function (rawSlider) {
        // slider param ^ was changed to rawSlider to avoid needing to change all mentions of it in the function

        // kill and revert param eventually
        let slider = rawSlider;
        if (rawSlider.domReference) {
            slider = rawSlider.domReference;
        }

        const sliderRect = slider.getBoundingClientRect();
        const slidersTouchID = Number(slider.dataset.touchid);
        const touch = TouchHandler.touches.find((touch) => touch.identifier === slidersTouchID);

        const value = mapToRange(touch.x, sliderRect.left, sliderRect.right, Number(slider.dataset.min), Number(slider.dataset.max));

        this.setSliderValue(rawSlider, value);
    },

    // Toggle Button Get and Set Functions

    getToggleState: function (toggleButton) {
        // kill this check once all ui is on new system
        if (toggleButton.domReference) {
            return toggleButton.domReference.classList.contains("toggled");
        } else {
            return toggleButton.classList.contains("toggled");
        }
    },

    setToggleState: function (toggleButton, state) {
        toggleButtonProxy = toggleButton.domReference ? toggleButton.domReference : toggleButton;

        if (state) {
            toggleButtonProxy.classList.add("toggled");
        } else {
            toggleButtonProxy.classList.remove("toggled");
        }
    },

    // For the 2 Map Editor Platform Manipulation Button Position Functions
    setGizmoBtnPos: function (buttonDom, xPosForMiddleOfBtn, yPosForMiddleOfBtn) {
        const buttonRect = buttonDom.getBoundingClientRect();
        buttonDom.style.left = `${xPosForMiddleOfBtn - buttonRect.width / 2}px`;
        buttonDom.style.top = `${yPosForMiddleOfBtn - buttonRect.height / 2}px`;
    },

    getGizmoBtnPos: function (buttonDom) {
        const buttonRect = buttonDom.getBoundingClientRect();
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
        // estimates the "brightness" of the color based on human eye perception

        this.darkMode = luminance < 0.4 ? true : false; // can KILL once darkMode is not used by any of the old UI system (map editor highlighting etc.)

        const modeString = this.darkMode ? "dark" : "light";
        this.updateUiColorMode(modeString);
    },

    updateUiColorMode: function (mode) {
        // mode = "light" or "dark'
        // use dark mode on dark backgrounds
        // use light mode on light backgrounds
        // dark: button-bg-dark, button-border-light text-light(forground)
        // light: button-bg-light, button-border-dark text-dark(forground)

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

    parseStringToDomElement: function (templateString) {
        try {
            const parsedDocument = this.DomParser.parseFromString(templateString, "text/html");
            return parsedDocument.body.firstElementChild;
        } catch (error) {
            throw new Error(`Failed to parse DOM element: ${error.message}`);
        }
    },

    switchToUiGroup: function (newUiGroup) {
        const newUiGroupIncludingSubElements = new Set(newUiGroup);

        // Populate newUiGroupIncludingSubElements with all missing subElements before switching to it
        for (const element of newUiGroup) {
            // kill this HTMLElement check once on new ui system
            if (!(element instanceof HTMLElement)) {
                for (const subElement of element.subElements) {
                    newUiGroupIncludingSubElements.add(subElement);
                }
            }
        }

        // Remove current active elements that're not in newUiGroupIncludingSubElements (not including ui_debugText -- it stays)
        for (const element of this.activeUiGroup) {
            if (!newUiGroupIncludingSubElements.has(element) && element !== ui_debugText) {
                this.removeUiElement(element);
            }
        }

        // Only add parent elements -- subElements are added by their parents
        for (const element of newUiGroup) {
            this.addUiElement(element);
        }
    },

    removeUiElement: function (uiElement) {
        if (uiElement instanceof HTMLElement) {
            // kill once all ui elements are new system
            uiElement.classList.add("hidden");
        }

        const wasRemoved = this.activeUiGroup.delete(uiElement);

        if (wasRemoved && uiElement.domReference) {
            uiElement.domReference.remove();
            uiElement.domReference = null;

            // Remove subElements from activeUiGroup and set domReferences to null
            for (const subElement of uiElement.subElements) {
                this.activeUiGroup.delete(subElement);
                subElement.domReference = null;
            }
        }
    },

    addUiElement: function (uiElement) {
        if (uiElement instanceof HTMLElement) {
            // Old UI system
            // kill this HTMLElement check and else block setup once all ui elements are new version
            uiElement.classList.remove("hidden");
            this.activeUiGroup.add(uiElement);
        } else {
            // New UI system

            if (this.activeUiGroup.has(uiElement)) {
                return;
            }

            uiElement.addDomElement(UserInterface.uiContainer);

            this.activeUiGroup.add(uiElement);
            for (const subElement of uiElement.subElements) {
                this.activeUiGroup.add(subElement);
            }
        }
    },

    isPointInsideElement: function (x, y, element) {
        if (!element) {
            console.error("invalid element isPointInsideElement");
            return;
        }
        const rect = element.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    },

    touchStarted: function (x, y, id) {
        // Called By TouchHandler
        // items that dont need interaction should have pointerevents:none in css so they dont block touches.

        const hit = document.elementFromPoint(x, y);
        if (!hit) return;

        // FIX OPTIMIZE this using a Map()
        // const domReferenceMap = new Map(); // Maps DOM node → element
        // avoids needing to loop through every active element to find if its dom element matches
        // when adding ui element:
        // domReferenceMap.set(child.domReference, child); // ← Add this
        // when removing ui element:
        // domReferenceMap.delete(element.domReference);

        for (const uiElement of this.activeUiGroup) {
            // kill proxy and update structure once all ui is migrated
            let proxyUiElement = uiElement;
            if (uiElement.domReference) {
                proxyUiElement = uiElement.domReference;
            }

            if (!proxyUiElement.contains(hit)) continue; // skip to next uiElement in loop

            // buttons & toggles
            if (proxyUiElement.nodeName.toLowerCase() === "button" || proxyUiElement.classList.contains("toggle-container")) {
                proxyUiElement.classList.add("pressed");
            }

            // sliders
            if (proxyUiElement.classList.contains("slider")) {
                // these need to use uiElement instead of proxy because .handle isnt attached to the domReference
                if (uiElement.handle.contains(hit)) {
                    uiElement.handle.classList.add("pressed");
                    proxyUiElement.dataset.touchid = id;
                }
            }
        }

        // Add strafehelper when any touch starts while in level and not in endzone
        if (this.gamestate == 6 && this.levelState !== 3) {
            // this.addUiElement(ui_strafeHelper);
            ui_strafeHelper.domReference.classList.remove("hidden");
        }
    },

    touchReleased: function (x, y, id) {
        // Called By TouchHandler

        // run button's function if clicked
        // run MapEditor.touchRelease if active and no buttons are pressed

        const hit = document.elementFromPoint(x, y);
        let editorIgnoreRelease = false;

        for (const uiElement of this.activeUiGroup) {
            // kill once proxy is no longer needed
            let proxyUiElement = uiElement;
            if (uiElement.domReference) {
                proxyUiElement = uiElement.domReference;
            }

            // BUTTONS & TOGGLES
            if (proxyUiElement.nodeName.toLowerCase() === "button" || proxyUiElement.classList.contains("toggle-container")) {
                const isPressed = proxyUiElement.classList.contains("pressed");
                const isUnderFinger = hit && proxyUiElement.contains(hit);

                if (isPressed && isUnderFinger && (MapBrowser.scrollVel == 0 || MapBrowser.scrollAmount == null) && MapEditor.dragSelect == false) {
                    // Kill once new ui is done
                    if (proxyUiElement != uiElement) {
                        // new ui system
                        uiElement.func();
                    } else {
                        // old ui system
                        proxyUiElement.func();
                    }
                    editorIgnoreRelease = true;
                }
                proxyUiElement.classList.remove("pressed");
            }

            // SLIDERS (capture-based)
            else if (proxyUiElement.classList.contains("slider") && proxyUiElement.dataset.touchid && Number(proxyUiElement.dataset.touchid) === id) {
                // Kill once new ui is done
                if (proxyUiElement != uiElement) {
                    // new ui system
                    uiElement.func();
                } else {
                    // old ui system
                    proxyUiElement.func();
                }
                // need to use uiElement instead of proxy because .handle isnt attached to domReference
                uiElement.handle.classList.remove("pressed");
                proxyUiElement.dataset.touchid = null;
                editorIgnoreRelease = true;
            }
        }

        // IN-LEVEL hide ui_strafeHelper
        if (this.gamestate == 6 && TouchHandler.touches.length === 0 && this.levelState !== 3) {
            // UserInterface.removeUiElement(ui_strafeHelper);
            ui_strafeHelper.domReference.classList.add("hidden");
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
        ui_endScreen.domReference.querySelector(".mapName").textContent = Map.name;

        const yourTimeInSeconds = this.secondsToMinutes(this.timer);
        ui_endScreen.domReference.querySelector(".yourTime").textContent = `${yourTimeInSeconds}`;

        // map records is set immediately after completion so if timer == map.record it means it was a new record
        if (this.timer == this.records[Map.name]) {
            // new record text
            ui_endScreen.domReference.querySelector(".yourRecord").textContent = `New Record!  -(${this.secondsToMinutes(
                Math.abs(this.previousRecord - this.records[Map.name]),
            )})`;
        } else {
            // display normal record
            ui_endScreen.domReference.querySelector(".yourRecord").textContent = `Best Time: ${this.secondsToMinutes(this.records[Map.name])}`;
        }

        // update medal times and activeMedal OR hide medal list
        const mapMedal = this.medals[Map.name];
        if (mapMedal !== undefined) {
            ui_endScreen.domReference.querySelector(".medalList").classList.remove("hidden");

            const goldMedal = ui_endScreen.domReference.querySelector(".gold");
            const silverMedal = ui_endScreen.domReference.querySelector(".silver");
            const bronzeMedal = ui_endScreen.domReference.querySelector(".bronze");

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
            ui_endScreen.domReference.querySelector(".medalList").classList.add("hidden");
        }
    },

    // FIX this should be in MapEditor not here
    updateMapEditorSidePanel: function () {
        // called when:
        // translate and resize buttons are dragged
        // platform or checkpoint or playerStart get selected or drag select ends (MapEditor.touchReleased)
        // items are duplicated, or added platform or added checkpoint
        // item is unselected

        if (MapEditor.multiSelect && MapEditor.selectedElements.length > 1) {
            // Multiple elements selected

            ui_elementTitle.domReference.textContent = `Group Selection`;

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
            ui_elementInfo.domReference.innerHTML = lines.join("<br>");

            return;
        }

        if (MapEditor.selectedElements[0] == "playerStart") {
            // playerStart is selected
            ui_elementTitle.domReference.textContent = `Player Start`;
            ui_elementInfo.domReference.textContent = `Position: ${MapEditor.loadedMap.playerStart.x}, ${MapEditor.loadedMap.playerStart.y}`;

            return;
        }

        if (Array.isArray(MapEditor.selectedElements[0])) {
            // checkpoint is selected
            ui_elementTitle.domReference.textContent = `Checkpoint`;

            ui_elementInfo.domReference.innerHTML = `
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

        if (MapEditor.selectedElements.length > 0) {
            // platform is selected
            ui_elementTitle.domReference.textContent = `Platform`;

            const approxSignX = MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].x % 1 == 0 ? "" : "~";
            const approxSignY = MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].y % 1 == 0 ? "" : "~";

            ui_elementInfo.domReference.innerHTML = `
            Position: 
            ${approxSignX}${Math.round(MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].x)}, 
            ${approxSignY}${Math.round(MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].y)}
            <br>
            Size: 
            ${MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].width}, 
            ${MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].height}
        `.trim();
        }

        // else: last item was unselected - no need to update side panel, it's gone
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
                // kill once proxy is no longer needed
                let proxyUiElement = uiElement;
                if (uiElement.domReference) {
                    proxyUiElement = uiElement.domReference;
                }

                if (proxyUiElement.classList.contains("slider")) {
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
                                ui_verticalWarning.domReference.classList.remove("hidden");
                                this.showVerticalWarning = true;
                                setTimeout(() => {
                                    ui_verticalWarning.domReference?.classList.add("hidden");
                                    this.showVerticalWarning = false;
                                }, 1500); // waits 1.5 seconds to hide warning
                            }
                        }
                    }
                }

                // Update Timer Box's Text
                if (Tutorial.isActive == false) {
                    ui_timerBox.domReference.children[0].textContent = `Time: ${UserInterface.secondsToMinutes(this.timer)}`;
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
                    //     ui_speedometer.domReference.style.color = `rgb(${255 - greenIntensity},255, ${255 - greenIntensity})`;
                    //     ui_speedometer.domReference.style.transform = `translate(-50%, -50%) scale(${scale})`;
                    // } else if (deltaSpeed < 0) {
                    //     // Decelerating: tint red
                    //     arrow = deltaSpeed < 10 ? "▼" : "";
                    //     const redIntensity = Math.min(-deltaSpeed * 10, 255); // clamp at 255
                    //     ui_speedometer.domReference.style.color = `rgb(255, ${255 - redIntensity}, ${255 - redIntensity})`;
                    //     ui_speedometer.domReference.style.transform = `translate(-50%, -50%) scale(1)`; // default size
                    // } else {
                    //     // No change
                    //     ui_speedometer.domReference.style.color = "white";
                    //     ui_speedometer.domReference.style.transform = "translate(-50%, -50%) scale(1)";
                    //     arrow = "";
                    // }

                    // .domReference.textContent = `Speed: ${Math.round(Player.velocity.magnitude())} ${arrow}`;
                    if (ui_speedometer.domReference) {
                        ui_speedometer.domReference.textContent = `Speed: ${Math.round(Player.velocity.magnitude())}`; // no arrow
                    }
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
                ui_debugText.domReference.textContent = `selectedMapIndex: ${MapBrowser.selectedMapIndex} \r\n`;
                ui_debugText.domReference.textContent += `scrollAmount: ${MapBrowser.scrollAmount} \r\n`;
                ui_debugText.domReference.textContent += `scrollPos: ${MapBrowser.scrollPos} \r\n`;
                ui_debugText.domReference.textContent += `scrollVel: ${MapBrowser.scrollVel} \r\n`;
                ui_debugText.domReference.textContent += `maxScroll: ${MapBrowser.maxScroll} \r\n`;
            } else if (this.gamestate == 6) {
                // In Level debug text
                ui_debugText.domReference.textContent = `fps: ${Math.round(1 / dt)} \r\n`;
                ui_debugText.domReference.textContent += `dt (rounded): ${Math.round(dt * 1000) / 1000} seconds \r\n`;
                ui_debugText.domReference.textContent += `renderedPlatforms: ${Map.renderedPlatforms.length} \r\n`;
                ui_debugText.domReference.textContent += `endZonesToCheck: ${Map.endZonesToCheck.length} \r\n`;
                ui_debugText.domReference.textContent += `cameraZoom: ${Math.round(Player.speedCameraOffset.zoom * 1000) / 1000} \r\n`;
                ui_debugText.domReference.textContent += `offsetDir: ${Math.round(Player.speedCameraOffset.direction.x)}, ${Math.round(
                    Player.speedCameraOffset.direction.y,
                )} \r\n`;
                ui_debugText.domReference.textContent += `player pos: ${Math.round(Player.x)}, ${Math.round(Player.y)} \r\n`;
                ui_debugText.domReference.textContent += `lookAngle: ${Player.lookAngle.getAngleInDegrees()} \r\n`;
                ui_debugText.domReference.textContent += `dragAmountX: ${TouchHandler.dragAmountX} \r\n`;

                if (TouchHandler.dragging) {
                    ui_debugText.domReference.textContent += `touch pos: ${TouchHandler.touches[0].x}, ${TouchHandler.touches[0].y} \r\n`;
                }
                if (Tutorial.isActive) {
                    ui_debugText.domReference.textContent += `tutorial state: ${Tutorial.state} \r\n`;
                }
            } else if (this.gamestate == 7) {
                // Map Editor Debug Text
                ui_debugText.domReference.textContent = `zoom: ${Math.round(MapEditor.zoom * 1000) / 1000} \r\n`;
                ui_debugText.domReference.textContent += `screen pos: ${Math.round(MapEditor.screen.x * 100) / 100}, ${
                    Math.round(MapEditor.screen.y * 100) / 100
                } \r\n`;
                ui_debugText.domReference.textContent += `screen size: ${Math.round(MapEditor.screen.width * 100) / 100}, ${
                    Math.round(MapEditor.screen.height * 100) / 100
                } \r\n`;
                ui_debugText.domReference.textContent += `screen corner pos: ${Math.round(MapEditor.screen.cornerX * 100) / 100}, ${
                    Math.round(MapEditor.screen.cornerY * 100) / 100
                } \r\n`;
                ui_debugText.domReference.textContent += `rendered platforms: ${MapEditor.renderedPlatforms.length} \r\n`;
                ui_debugText.domReference.textContent += `editorState: ${MapEditor.editorState} \r\n`;
                ui_debugText.domReference.textContent += `selectedElements: ${MapEditor.selectedElements} \r\n`;
                ui_debugText.domReference.textContent += `zoom ratio: ${Math.round(TouchHandler.zoom.ratio * 1000) / 1000} \r\n`;

                if (TouchHandler.dragging) {
                    ui_debugText.domReference.textContent += `touch pos (UI): ${TouchHandler.touches[0].x}, ${TouchHandler.touches[0].y} \r\n`;
                    const touchMapped = MapEditor.convertToMapCord(TouchHandler.touches[0].x, TouchHandler.touches[0].y);
                    ui_debugText.domReference.textContent += `touch pos (map): ${Math.round(touchMapped.x * 100) / 100}, ${
                        Math.round(touchMapped.y * 100) / 100
                    } \r\n`;

                    if (MapEditor.dragSelect) {
                        const marquee = MapEditor.dragSelectMarquee;
                        const globalMarqueeCornerTL = MapEditor.convertToMapCord(marquee.x, marquee.y);
                        const globalMarqueeCornerBR = MapEditor.convertToMapCord(marquee.x + marquee.width, marquee.y + marquee.height);

                        ui_debugText.domReference.textContent += `marquee (map xywh): ${Math.round(globalMarqueeCornerTL.x)}, ${Math.round(
                            globalMarqueeCornerTL.y,
                        )}, ${Math.round(globalMarqueeCornerBR.x - globalMarqueeCornerTL.x)}, ${Math.round(
                            globalMarqueeCornerBR.y - globalMarqueeCornerTL.y,
                        )} \r\n`;
                    }
                }
            } else {
                // generic debug text for all other screens
                ui_debugText.domReference.textContent = `fps: ${Math.round(1 / dt)} \r\n`;
            }
        }
    },
};
