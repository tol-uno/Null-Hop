const btn_newMap = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_newMap"><div>New Map</div></button>
        `;
    },

    () => {
        MapBrowser.scrollVel = 0;
        MapBrowser.scrollPos = 0;
        UserInterface.gamestate = 5;
        UserInterface.switchToUiGroup(new Set([btn_mainMenu]));
        MapEditor.initMap(-1); // -1 indicates new map
    },
);
