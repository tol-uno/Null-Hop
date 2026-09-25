const toggle_syncPlatformColors = new uiElement(
    "toggle",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div id="toggle_syncPlatformColors" class="toggle-container toggled">
                <span class="label">Match<br />Colors</span>
                <div class="toggle"></div>
            </div>
        `;
    },

    (sync) => {
        if (sync) {
            const platformColorsMatch = MapEditor.loadedMap.style.platformSideColor == MapEditor.loadedMap.style.platformTopColor;
            UserInterface.setToggleState(toggle_syncPlatformColors, platformColorsMatch);
            ColorPicker.lockPlatformColors = platformColorsMatch;
            return;
        }

        if (toggle_syncPlatformColors.domReference.classList.contains("toggled")) {
            // make colors NOT synced
            ColorPicker.lockPlatformColors = false;
        } else {
            // make colors synced
            ColorPicker.lockPlatformColors = true;
            MapEditor.loadedMap.style.platformSideColor = MapEditor.loadedMap.style.platformTopColor;
            PreviewWindow.update();
            ColorPicker.updateButtonColors();
        }
        toggle_syncPlatformColors.domReference.classList.toggle("toggled");
    },
);
