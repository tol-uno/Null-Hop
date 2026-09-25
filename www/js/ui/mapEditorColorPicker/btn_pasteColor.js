const btn_pasteColor = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`<button id="btn_pasteColor"><div>Paste</div></button>`;
    },

    () => {
        ColorPicker.pasteColor();
    },
);
