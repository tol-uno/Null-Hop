const slider_volume = new uiElement(
    "slider",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div id="slider_volume" class="slider" data-min="0" data-max="1" data-step="0.1" data-value="0.5" data-touchid="">
                <div class="label">Volume: <span>000</span></div>
                <div class="track">
                    <div class="handle" style="--pos: 50%"></div>
                </div>
            </div>
        `;
    },

    (sync) => {
        if (sync) {
            UserInterface.setSliderValue(slider_volume, UserInterface.settings.volume);
            return;
        }

        UserInterface.settings.volume = UserInterface.getSliderValue(slider_volume.domReference);
        AudioHandler.setVolume(UserInterface.settings.volume);
        UserInterface.writeSettings();
    },
);
