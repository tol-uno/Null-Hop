const slider_lightDirection = new uiElement(
    "slider",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div id="slider_lightDirection" class="slider" data-min="0" data-max="360" data-step="1" data-value="0" data-touchid="">
                <div class="label">Light Direction: <span>000</span></div>
                <div class="track">
                    <div class="handle" style="--pos: 0%"></div>
                </div>
            </div>
        `;
    },

    (sync) => {
        if (sync) {
            UserInterface.setSliderValue(slider_lightDirection, MapEditor.loadedMap.style.lightDirection);
            return;
        }
        
        MapEditor.loadedMap.style.lightDirection = UserInterface.getSliderValue(slider_lightDirection.domReference);
        PreviewWindow.update();
    },
);
