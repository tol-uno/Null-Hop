const slider_lightPitch = new uiElement(
    "slider",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div id="slider_lightPitch" class="slider" data-min="5" data-max="90" data-step="1" data-value="45" data-touchid="">
                <div class="label">Light Angle: <span>00</span></div>
                <div class="track">
                    <div class="handle" style="--pos: 53%"></div>
                </div>
            </div>
        `;
    },

    (sync) => {
        if (sync) {
            UserInterface.setSliderValue(slider_lightPitch, MapEditor.loadedMap.style.lightPitch);
            return;
        }

        MapEditor.loadedMap.style.lightPitch = UserInterface.getSliderValue(slider_lightPitch.domReference);
        PreviewWindow.update();
    },
);
