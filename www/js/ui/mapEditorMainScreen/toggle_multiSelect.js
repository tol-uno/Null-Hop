const toggle_multiSelect = new uiElement(
    "toggle",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div id="toggle_multiSelect" class="toggle-container">
                <span class="label">Select Multiple</span>
                <div class="toggle"></div>
            </div>
        `;
    },

    (sync) => {
        if (sync) {
            UserInterface.setToggleState(toggle_multiSelect, MapEditor.multiSelect);
            return;
        }

        if (toggle_multiSelect.domReference.classList.contains("toggled")) {
            // turn off multiSelect
            MapEditor.multiSelect = false;
            if (MapEditor.selectedElements.length > 1) {
                // MapEditor.selectedElements = [MapEditor.selectedElements[MapEditor.selectedElements.length - 1]]; // make it only select the last element in the array
                MapEditor.selectedElements = []; // no selected items after multiselect turned off
                MapEditor.setButtonGroup();
            }
        } else {
            // turn on multiSelect
            MapEditor.multiSelect = true;
        }

        toggle_multiSelect.domReference.classList.toggle("toggled");
    },
);
