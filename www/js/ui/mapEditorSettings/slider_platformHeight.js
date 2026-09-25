const slider_platformHeight = new uiElement(
    "slider",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div id="slider_platformHeight" class="slider" data-min="0" data-max="360" data-step="1" data-value="36" data-touchid="">
                <div class="label">Platform Height: <span>000</span></div>
                <div class="track">
                    <div class="handle" style="--pos: 10%"></div>
                </div>
            </div>
        `;
    },

    (sync) => {
        if (sync) {
            UserInterface.setSliderValue(slider_platformHeight, MapEditor.loadedMap.style.platformHeight);
            return;
        }

        MapEditor.loadedMap.style.platformHeight = UserInterface.getSliderValue(slider_platformHeight.domReference);
        PreviewWindow.update();
    },
);
