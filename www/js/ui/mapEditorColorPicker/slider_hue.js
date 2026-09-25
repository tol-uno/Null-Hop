const slider_hue = new uiElement(
    "slider",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div id="slider_hue" class="slider" data-min="0" data-max="360" data-step="1" data-value="0" data-touchid="">
                <div class="label">Hue: <span>000</span></div>
                <div class="track">
                    <div class="handle" style="--pos: 0%"></div>
                </div>
            </div>
        `;
    },

    (sync) => {
        if (sync) {
            UserInterface.setSliderValue(slider_hue, ColorPicker.h);
            return;
        }
        
        const value = UserInterface.getSliderValue(slider_hue);
        ColorPicker.h = value;
        ui_colorPicker.domReference.style.setProperty("--h", `${value}`);
        ColorPicker.updateElementColor();
        if (ColorPicker.editingElement == 1 || ColorPicker.editingElement == 9 || ColorPicker.editingElement == 10) {
            UserInterface.determineButtonColor();
        }
    },
);
