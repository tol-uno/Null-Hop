const btn_discard = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_discard"><div>Discard</div></button>
        `;
    },

    () => {
        UserInterface.switchToUiGroup(UserInterface.uiGroup_confirmDiscard);
        ui_mapEditorSaveText.domReference.textContent = "Are you sure you don't want to save your changes?";
    },
);
