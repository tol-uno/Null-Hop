const btn_mapSettings = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_mapSettings"><div>Map Settings</div></button>
        `;
    },

    () => {
        MapEditor.editorState = 4; // map settings

        PreviewWindow.update();
        UserInterface.switchToUiGroup(UserInterface.uiGroup_mapSettings);    
    },
);
