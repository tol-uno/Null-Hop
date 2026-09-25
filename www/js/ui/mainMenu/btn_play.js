const btn_play = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_play">
                <div>Play</div>
            </button>
        `;
    },
    
    () => {
        UserInterface.gamestate = 2;
        UserInterface.switchToUiGroup(UserInterface.uiGroup_standardMapBrowser);
        MapBrowser.state = 1;
        MapBrowser.init();
    },
);
