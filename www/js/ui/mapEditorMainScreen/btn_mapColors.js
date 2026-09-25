const btn_mapColors = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_mapColors"><div>Map Colors</div></button>
        `;
    },

    () => {
        MapEditor.editorState = 3; // map colors
        ColorPicker.editingElement = 0;
        PreviewWindow.update();
        UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState1);
        ColorPicker.updateButtonColors();
    },
);
