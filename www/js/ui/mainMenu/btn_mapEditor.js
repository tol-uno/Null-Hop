const btn_mapEditor = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_mapEditor">
                <div>Map Editor</div>
            </button>
        `;
    },

    () => {
        UserInterface.gamestate = 2;
        UserInterface.switchToUiGroup(UserInterface.uiGroup_mapEditorMapBrowser);
        MapBrowser.state = 3;
        MapBrowser.init();
    },
);
