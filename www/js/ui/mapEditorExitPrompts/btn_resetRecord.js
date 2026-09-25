const btn_resetRecord = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_resetRecord"><div>Reset Record</div></button>
        `;
    },

    () => {
        UserInterface.removeRecord(MapEditor.mapNameBeingEdited);
        MapEditor.leaveMapEditor();
    },
);
