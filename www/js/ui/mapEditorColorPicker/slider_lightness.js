const slider_lightness = new uiElement(
    "slider",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div id="slider_lightness" class="slider" data-min="0" data-max="100" data-step="1" data-value="0" data-touchid="">
                <div class="label">Lightness: <span>000</span></div>
                <div class="track">
                    <div class="handle" style="--pos: 0%"></div>
                </div>
            </div>
        `;
    },

    (sync) => {
        if (sync) {
            UserInterface.setSliderValue(slider_lightness, ColorPicker.l);
            return;
        }

            const value = UserInterface.getSliderValue(slider_lightness);
            ColorPicker.l = value;
            ui_colorPicker.domReference.style.setProperty("--l", `${value}%`);
            ColorPicker.updateElementColor();
            if (ColorPicker.editingElement == 1 || ColorPicker.editingElement == 9 || ColorPicker.editingElement == 10) {
                UserInterface.determineButtonColor();
            }
    },
);
