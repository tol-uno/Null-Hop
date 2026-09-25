const btn_customMaps = new uiElement(
    "button",
    
    () => {
        return /* HTML */ parseComponentIntoDomElement`<button id="btn_customMaps"><div>Custom Maps</div></button>`;
    },

    () => {
        UserInterface.gamestate = 2;
        UserInterface.switchToUiGroup(UserInterface.uiGroup_customMapBrowser);
        MapBrowser.state = 2;
        MapBrowser.init();
    },
);
