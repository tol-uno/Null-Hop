const slider_playerAngle = new uiElement(
    "slider",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div id="slider_playerAngle" class="slider" data-min="0" data-max="360" data-step="2" data-value="0" data-touchid="">
                <div class="label">Angle: <span>000</span></div>
                <div class="track">
                    <div class="handle" style="--pos: 0%"></div>
                </div>
            </div>
        `;
    },

    (sync) => {
        if (sync) {
            UserInterface.setSliderValue(slider_playerAngle, MapEditor.loadedMap.playerStart.angle, true);
            slider_playerAngle.domReference.dataset.step = MapEditor.snapAmount;
            return;
        }

        MapEditor.loadedMap.playerStart.angle = UserInterface.getSliderValue(slider_playerAngle.domReference);
    },
);
