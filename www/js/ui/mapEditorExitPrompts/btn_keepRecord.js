const btn_keepRecord = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_keepRecord"><div>Keep Record</div></button>
        `;
    },

    () => {
        MapEditor.leaveMapEditor();
    },
);
