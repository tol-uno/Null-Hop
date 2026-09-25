const btn_importMap = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_importMap"><div>Import Map</div></button>
        `;
    },

    () => {
        MapBrowser.scrollVel = 0;
        MapBrowser.scrollPos = 0;
        UserInterface.gamestate = 5;
        UserInterface.switchToUiGroup(new Set([btn_mainMenu]));
        MapEditor.initMap(-2); // -2 indicates imported map
    },
);
