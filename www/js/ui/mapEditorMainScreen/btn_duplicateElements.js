const btn_duplicateElements = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_duplicateElements"><div>Duplicate</div></button>
        `;
    },

    () => {
        let originPlatform = {
            x: null,
            y: null,
        };

        for (const element of MapEditor.selectedElements) {
            // only run for platforms
            if (element != "playerStart" && !Array.isArray(element)) {
                const newPlatform = { ...MapEditor.loadedMap.platforms[element] }; // get selected platform. spread syntax creates a shallow copy that doesn not link/reference

                if (originPlatform.x == null) {
                    // set origin platform if none set yet
                    originPlatform.x = MapEditor.loadedMap.platforms[element].x;
                    originPlatform.y = MapEditor.loadedMap.platforms[element].y;
                }

                const offsetFromOriginPlatformX = MapEditor.loadedMap.platforms[element].x - originPlatform.x;
                const offsetFromOriginPlatformY = MapEditor.loadedMap.platforms[element].y - originPlatform.y;

                newPlatform.x = Math.round(MapEditor.screen.x) + offsetFromOriginPlatformX; // center it
                newPlatform.y = Math.round(MapEditor.screen.y) + offsetFromOriginPlatformY;
                MapEditor.loadedMap.platforms.push(newPlatform); // add platform

                // deal with selections
                if (MapEditor.multiSelect) {
                    MapEditor.selectedElements[MapEditor.selectedElements.indexOf(element)] = MapEditor.loadedMap.platforms.length - 1;
                } else {
                    MapEditor.selectedElements = [MapEditor.loadedMap.platforms.length - 1];
                }
            }
        }

        if (MapEditor.selectedElements.length == 1) {
            // only need to sync buttons and sliders in single select
            slider_platformAngle.func(true);
            toggle_wall.func(true);
            toggle_endzone.func(true);
        }

        UserInterface.updateMapEditorSidePanel();
    },
);
