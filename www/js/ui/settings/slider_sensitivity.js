const slider_sensitivity = new uiElement(
    "slider",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div id="slider_sensitivity" class="slider" data-min="0.1" data-max="3" data-step="0.1" data-value="0.5" data-touchid="">
                <div class="label">Sensitivity: <span>000</span></div>
                <div class="track">
                    <div class="handle" style="--pos: 16%"></div>
                </div>
            </div>
        `;
    },

    (options) => {
        if (options?.sync) {
            UserInterface.setSliderValue(slider_sensitivity, UserInterface.settings.sensitivity);
            return;
        }

        UserInterface.settings.sensitivity = UserInterface.getSliderValue(slider_sensitivity);
        UserInterface.writeSettings();
    },
);
