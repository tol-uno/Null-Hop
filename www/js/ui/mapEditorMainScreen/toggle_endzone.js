const toggle_endzone = new uiElement(
    "toggle",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div id="toggle_endzone" class="toggle-container">
                <span class="label">End Zone: NaN</span>
                <div class="toggle"></div>
            </div>
        `;
    },

    (sync) => {
        if (sync) {
            const isEndZone = MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].endzone;
            UserInterface.setToggleState(toggle_endzone, isEndZone);
            toggle_endzone.label.textContent = isEndZone ? "End Zone: Yes" : "End Zone: No";
            return;
        }

        if (toggle_endzone.domReference.classList.contains("toggled")) {
            // make platform NOT endzone
            MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].endzone = 0;
            toggle_endzone.label.textContent = "End Zone: No";
        } else {
            // make platform endzone
            MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].endzone = 1;
            toggle_endzone.label.textContent = "End Zone: Yes";
            MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].wall = 0;
            UserInterface.setToggleState(toggle_wall, false);
            toggle_wall.label.textContent = "Wall: No";
        }

        toggle_endzone.domReference.classList.toggle("toggled");

        // COULD BE THIS. NOT AS OPTIMIZED BUT MORE MAINTAINABLE 
        // if (toggle_endzone.domReference.classList.contains("toggled")) {
        //     MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].endzone = 0;
        // } else {
        //     MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].endzone = 1;
        //     MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].wall = 0;
        //     toggle_wall.func(true);
        // }
        // toggle_endzone.func(true); // sync
    },
);
