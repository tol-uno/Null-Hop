const btn_confirmDeleteEdits = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_confirmDeleteEdits"><div>Yes, Delete Edits</div></button>
        `;
    },

    () => {
        MapEditor.leaveMapEditor();
    },
);
