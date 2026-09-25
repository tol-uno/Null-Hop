const btn_saveAsCopy = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_saveAsCopy"><div>Save As Copy</div></button>
        `;
    },

    () => {
        UserInterface.switchToUiGroup(UserInterface.uiGroup_inputMapName);
        ui_mapEditorSaveText.domReference.textContent = "Name your map";
    },
);
