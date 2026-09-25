const btn_mainMenu = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_mainMenu">
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 62 62">
                        <path stroke="var(--myForegroundColor)" stroke-linecap="round" stroke-width="8" d="m19 43 24-24m-24 0 24 24" />
                    </svg>
                </div>
            </button>
        `;
    },

    () => {
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
            if (ui_speedometer.domReference) {
                ui_speedometer.domReference.textContent = "Speed: 0";
            }
            gravity = 500;

            UserInterface.ui_verticalWarning = false;
            UserInterface.showOverstrafeWarning = false;

            CanvasArea.canvas.classList.add("hidden");

            UserInterface.updateUiColorMode("light");

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
    },
);
