const btn_save = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_save"><div>Save</div></button>
        `;
    },

    () => {
        if (MapEditor.mapNameBeingEdited) {
            // if saving an existing map (map name is not null), save map using existing name
            MapEditor.saveCustomMap(MapEditor.mapNameBeingEdited);

            if (MapEditor.mapNameBeingEdited in UserInterface.records) {
                // if a record for this map exists already, prompt wether to delete existing record
                UserInterface.switchToUiGroup(UserInterface.uiGroup_deleteRecord);
                ui_mapEditorSaveText.domReference.textContent = `Delete the record for your fastest time on map: ${MapEditor.mapNameBeingEdited}? Your time: ${UserInterface.secondsToMinutes(UserInterface.records[MapEditor.mapNameBeingEdited])}`;
            } else {
                MapEditor.leaveMapEditor();
            }
        } else {
            // new map -- name it
            UserInterface.switchToUiGroup(UserInterface.uiGroup_inputMapName);
            ui_mapEditorSaveText.domReference.textContent = "Name your map";
        }
    },
);
