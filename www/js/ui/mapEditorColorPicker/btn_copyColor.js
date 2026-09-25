const btn_copyColor = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`<button id="btn_copyColor"><div>Copy</div></button>`;
    },

    () => {
        ColorPicker.copyColor();
    },
);
