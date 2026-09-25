const slider_platformAngle = new uiElement(
    "slider",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div id="slider_platformAngle" class="slider" data-min="-45" data-max="45" data-step="2" data-value="0" data-touchid="">
                <div class="label">Angle: <span>000</span></div>
                <div class="track">
                    <div class="handle" style="--pos: 50%"></div>
                </div>
            </div>
        `;
    },

    (sync) => {
        if (sync) {
            UserInterface.setSliderValue(slider_platformAngle, MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].angle, true);
            slider_platformAngle.domReference.dataset.step = MapEditor.snapAmount;
            return;
        }

        MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].angle = UserInterface.getSliderValue(slider_platformAngle.domReference);
        MapEditor.updatePlatformCorners(MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]]);
    },
);
