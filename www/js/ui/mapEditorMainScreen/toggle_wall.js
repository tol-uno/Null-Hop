const toggle_wall = new uiElement(
    "toggle",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div id="toggle_wall" class="toggle-container">
                <span class="label">Wall: NaN</span>
                <div class="toggle"></div>
            </div>
        `;
    },

    (sync) => {
        if (sync) {
            const isWall = MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].wall;
            UserInterface.setToggleState(toggle_wall, isWall);
            toggle_wall.label.textContent = isWall ? "Wall: Yes" : "Wall: No";
            return;
        }

        if (toggle_wall.domReference.classList.contains("toggled")) {
            // make platform NOT wall
            MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].wall = 0;
            toggle_wall.label.textContent = "Wall: No";
        } else {
            // make platform wall
            MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].wall = 1;
            toggle_wall.label.textContent = "Wall: Yes";
            MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].endzone = 0;
            UserInterface.setToggleState(toggle_endzone, false);
            toggle_endzone.label.textContent = "End Zone: No";
        }

        toggle_wall.domReference.classList.toggle("toggled");
    },
);
