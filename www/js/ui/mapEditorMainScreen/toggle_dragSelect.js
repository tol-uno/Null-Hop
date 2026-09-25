const toggle_dragSelect = new uiElement(
    "toggle",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div id="toggle_dragSelect" class="toggle-container">
                <span class="label">Drag Select</span>
                <div class="toggle"></div>
            </div>
        `;
    },

    (sync) => {
        if (sync) {
            // No need to sync this. Should always enter untoggled
            // gets toggled off in MapEditor touchReleased()
            return;
        }

        if (toggle_dragSelect.domReference.classList.contains("toggled")) {
            // turn off dragSelect
            MapEditor.dragSelect = false;
            MapEditor.setButtonGroup();
        } else {
            // turn on dragSelect and multiSelect
            MapEditor.dragSelect = true;
            MapEditor.multiSelect = true;
            UserInterface.setToggleState(toggle_multiSelect, true); // set multiSelect button toggle true
            UserInterface.switchToUiGroup(new Set([toggle_dragSelect, ui_dragSelectMarquee]));
            // set ui_dragSelectMarquee size to zero
        }

        toggle_dragSelect.domReference.classList.toggle("toggled");
    },
);
