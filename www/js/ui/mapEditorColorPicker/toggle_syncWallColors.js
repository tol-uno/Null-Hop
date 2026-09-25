const toggle_syncWallColors = new uiElement(
    "toggle",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div id="toggle_syncWallColors" class="toggle-container toggled">
                <span class="label">Match<br />Colors</span>
                <div class="toggle"></div>
            </div>
        `;
    },

    (sync) => {
        if (sync) {
            const wallColorsMatch = MapEditor.loadedMap.style.wallSideColor == MapEditor.loadedMap.style.wallTopColor;
            UserInterface.setToggleState(toggle_syncWallColors, wallColorsMatch);
            ColorPicker.lockWallColors = wallColorsMatch;
            return;
        }

        if (toggle_syncWallColors.domReference.classList.contains("toggled")) {
            // make colors NOT synced
            ColorPicker.lockWallColors = false;
        } else {
            // make colors synced
            ColorPicker.lockWallColors = true;
            MapEditor.loadedMap.style.wallSideColor = MapEditor.loadedMap.style.wallTopColor;
            PreviewWindow.update();
            ColorPicker.updateButtonColors();
        }
        toggle_syncWallColors.domReference.classList.toggle("toggled");
    },
);
