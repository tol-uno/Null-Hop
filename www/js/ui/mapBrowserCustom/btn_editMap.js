const btn_editMap = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_editMap"><div>Edit Map</div></button>
        `;
    },

    () => {
        MapBrowser.scrollVel = 0;
        MapBrowser.scrollPos = 0;
        UserInterface.gamestate = 5;
        UserInterface.switchToUiGroup(new Set([btn_mainMenu]));
        MapEditor.initMap(MapBrowser.selectedMapIndex);
    },
);
