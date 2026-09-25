const btn_cancel = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_cancel">
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 62 62">
                        <path stroke="var(--myForegroundColor)" stroke-linecap="round" stroke-width="8" d="m19 43 24-24m-24 0 24 24" />
                    </svg>
                </div>
            </button>
        `;
    },

    () => {
        if (UserInterface.activeUiGroup.has(btn_save)) {
            MapEditor.selectedElements = [];
            MapEditor.editorState = 1; // unpause map editor
            UserInterface.switchToUiGroup(UserInterface.uiGroup_mapEditorInterface);
        } else if (UserInterface.activeUiGroup.has(ui_inputMapName) || UserInterface.activeUiGroup.has(btn_confirmDeleteEdits)) {
            if (MapEditor.mapNameBeingEdited !== null) {
                // if inputing name for a copy - go back to saveExistingMap
                UserInterface.switchToUiGroup(UserInterface.uiGroup_saveExistingMap);
                ui_mapEditorSaveText.domReference.textContent = `Save changes to map: ${MapEditor.mapNameBeingEdited}?`;
            } else {
                // if inputing name for a new map - go back to saveNewMap
                UserInterface.switchToUiGroup(UserInterface.uiGroup_saveNewMap);
                ui_mapEditorSaveText.domReference.textContent = "Save Map?";
            }
        }
    },
);
