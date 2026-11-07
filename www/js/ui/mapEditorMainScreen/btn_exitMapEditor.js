const btn_exitMapEditor = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_exitMapEditor">
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 68 68">
                        <path
                            stroke="var(--myForegroundColor)"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="8"
                            d="M38 20 24 34l14 14"
                        />
                    </svg>
                </div>
            </button>
        `;
    },

    () => {
        if (MapEditor.mapNameBeingEdited !== null) {
            UserInterface.switchToUiGroup(UserInterface.uiGroup_saveExistingMap);
            ui_mapEditorSaveText.domReference.textContent = `Save changes to map: ${MapEditor.mapNameBeingEdited}?`;
        } else {
            UserInterface.switchToUiGroup(UserInterface.uiGroup_saveNewMap);
            ui_mapEditorSaveText.domReference.textContent = "Save Map?";
        }
        MapEditor.editorState = 5; // pause map editor
    },
);
