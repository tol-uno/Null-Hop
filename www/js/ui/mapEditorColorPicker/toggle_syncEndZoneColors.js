const toggle_syncEndZoneColors = new uiElement(
    "toggle",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div id="toggle_syncEndZoneColors" class="toggle-container toggled">
                <span class="label">Match<br />Colors</span>
                <div class="toggle"></div>
            </div>
        `;
    },

    (sync) => {
        if (sync) {
            const endZoneColorsMatch = MapEditor.loadedMap.style.endZoneSideColor == MapEditor.loadedMap.style.endZoneTopColor;
            UserInterface.setToggleState(toggle_syncEndZoneColors, endZoneColorsMatch);
            ColorPicker.lockEndzoneColors = endZoneColorsMatch;
            return;
        }

        if (toggle_syncEndZoneColors.domReference.classList.contains("toggled")) {
            // make colors NOT synced
            ColorPicker.lockEndzoneColors = false;
        } else {
            // make colors synced
            ColorPicker.lockEndzoneColors = true;
            MapEditor.loadedMap.style.endZoneSideColor = MapEditor.loadedMap.style.endZoneTopColor;
            PreviewWindow.update();
            ColorPicker.updateButtonColors();
        }
        toggle_syncEndZoneColors.domReference.classList.toggle("toggled");
    },
);
