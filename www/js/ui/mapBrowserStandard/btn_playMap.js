const btn_playMap = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_playMap">
                <div>Play</div>
            </button>
        `;
    },

    () => {
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
    },
);
