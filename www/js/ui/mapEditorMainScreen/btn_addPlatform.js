const btn_addPlatform = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_addPlatform"><div>Add Platform</div></button>
        `;
    },

    () => {
        const newPlatform = {
            x: Math.round(MapEditor.screen.x),
            y: Math.round(MapEditor.screen.y),
            width: 100,
            height: 100,
            hypotenuse: Math.sqrt(this.width * this.width + this.height * this.height) / 2,
            angle: 0,
            endzone: 0,
            wall: 0,
        };

        MapEditor.updatePlatformCorners(newPlatform); // update dynamic attributes of platform

        MapEditor.loadedMap.platforms.push(newPlatform);
        MapEditor.selectedElements = MapEditor.multiSelect
            ? MapEditor.selectedElements.concat(MapEditor.loadedMap.platforms.length - 1)
            : [MapEditor.loadedMap.platforms.length - 1];
        UserInterface.switchToUiGroup(UserInterface.uiGroup_editPlatform);

        // SYNC ALL BUTTONS AND SLIDERS
        slider_platformAngle.func(true);
        toggle_wall.func(true);
        toggle_endzone.func(true);

        UserInterface.updateMapEditorSidePanel();
    },
);
