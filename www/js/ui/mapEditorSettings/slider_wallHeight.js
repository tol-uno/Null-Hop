const slider_wallHeight = new uiElement(
    "slider",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div id="slider_wallHeight" class="slider" data-min="0" data-max="360" data-step="1" data-value="36" data-touchid="">
                <div class="label">Wall Height: <span>000</span></div>
                <div class="track">
                    <div class="handle" style="--pos: 10%"></div>
                </div>
            </div>
        `;
    },

    (sync) => {
        if (sync) {
            UserInterface.setSliderValue(slider_wallHeight, MapEditor.loadedMap.style.wallHeight);
            return;
        }

        MapEditor.loadedMap.style.wallHeight = UserInterface.getSliderValue(slider_wallHeight.domReference);
        PreviewWindow.update();
    },
);
