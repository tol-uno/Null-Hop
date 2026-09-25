const slider_snapping = new uiElement(
    "slider",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div id="slider_snapping" class="slider" data-min="0" data-max="64" data-step="2" data-value="2" data-touchid="">
                <div class="label">Snapping Grid: <span>2</span></div>
                <div class="track">
                    <div class="handle" style="--pos: 3%"></div>
                </div>
            </div>
        `;
    },

    (sync) => {
        if (sync) {
            UserInterface.setSliderValue(slider_snapping, MapEditor.snapAmount)
            return;
        }

        const value = UserInterface.getSliderValue(slider_snapping);
        MapEditor.snapAmount = value;

        // Update step values for angle sliders (needed if changing snapping while one of sliders is already on the screen)
        if (slider_platformAngle.domReference) {
            slider_platformAngle.domReference.dataset.step = value;
            return;
        }
        if (slider_playerAngle.domReference) {
            slider_playerAngle.domReference.dataset.step = value;
            return;
        }
        if (slider_checkpointAngle.domReference) {
            slider_checkpointAngle.domReference.dataset.step = value;
            return;
        }
    },
);
