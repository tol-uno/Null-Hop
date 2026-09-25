const slider_checkpointAngle = new uiElement(
    "slider",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div
                id="slider_checkpointAngle"
                class="slider"
                data-min="0"
                data-max="360"
                data-step="2"
                data-value="0"
                data-touchid=""
            >
                <div class="label">Respawn Angle: <span>000</span></div>
                <div class="track">
                    <div class="handle" style="--pos: 0%"></div>
                </div>
            </div>
        `;
    },

    (sync) => {
        if (sync) {
            UserInterface.setSliderValue(slider_checkpointAngle, MapEditor.loadedMap.checkpoints[MapEditor.selectedElements[0][0]].angle, true);
            slider_checkpointAngle.domReference.dataset.step = MapEditor.snapAmount;
            return;
        }

        MapEditor.loadedMap.checkpoints[MapEditor.selectedElements[0][0]].angle = UserInterface.getSliderValue(slider_checkpointAngle.domReference);
    },
);
