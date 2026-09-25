const slider_saturation = new uiElement(
    "slider",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div id="slider_saturation" class="slider" data-min="0" data-max="100" data-step="1" data-value="0" data-touchid="">
                <div class="label">Saturation: <span>000</span></div>
                <div class="track">
                    <div class="handle" style="--pos: 0%"></div>
                </div>
            </div>
        `;
    },

    (sync) => {
        if (sync) {
            UserInterface.setSliderValue(slider_saturation, ColorPicker.s);
            return;
        }

            const value = UserInterface.getSliderValue(slider_saturation);
            ColorPicker.s = value;
            ui_colorPicker.domReference.style.setProperty("--s", `${value}%`);
            ColorPicker.updateElementColor();
            if (ColorPicker.editingElement == 1 || ColorPicker.editingElement == 9 || ColorPicker.editingElement == 10) {
                UserInterface.determineButtonColor();
            }
    },
);
