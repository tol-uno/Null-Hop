const ui_colorPicker = new uiElement("display", () => {
    return /* HTML */ parseComponentIntoDomElement`
        <div id="ui_colorPicker">
            <div id="ui_colorPickerHeader">
                ${btn_unselectColor}
                <div id="ui_colorPreview"></div>
                ${btn_copyColor}
                ${btn_pasteColor}
            </div>

            ${slider_hue}
            <div id="ui_hueGradient"></div>

            ${slider_saturation}
            ${ui_saturationGradient}

            ${slider_lightness}
            ${ui_lightnessGradient}
        </div>
    `;
});
