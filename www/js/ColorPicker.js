const ColorPicker = {
    x: window.outerWidth - 400,
    y: 30,
    width: 360,
    height: 340,
    hueGradient: null,
    saturationGradient: null,
    lightnessGradient: null,

    copiedColor: null,

    editingElement: 0,
    // 0 nothing (in selection screen)
    // 1 bg
    // 2 player
    // 3 platform top
    // 4 platform side
    // 5 wall top
    // 6 wall side
    // 7 end top
    // 8 end side
    // 9 direct light
    // 10 ambiennt light

    lockWallColors: true,
    lockPlatformColors: true,
    lockEndzoneColors: true,

    h: 117,
    s: 34,
    l: 75,

    syncGradients: function () {
        // change name to updateColorsCSS
        ui_colorPicker.style.setProperty("--h", `${this.h}`);
        ui_colorPicker.style.setProperty("--s", `${this.s}%`);
        ui_colorPicker.style.setProperty("--l", `${this.l}%`);
    },

    update: function () {
        if (
            // a slider is being pressed
            !btn_hueSlider.handle.classList.contains("pressed") ||
            !btn_saturationSlider.handle.classList.contains("pressed") ||
            !btn_lightnessSlider.handle.classList.contains("pressed")
        ) {
            // update every color every frame
            ColorPicker.h = UserInterface.getSliderValue(btn_hueSlider);
            ColorPicker.s = UserInterface.getSliderValue(btn_saturationSlider);
            ColorPicker.l = UserInterface.getSliderValue(btn_lightnessSlider);
            ColorPicker.updateElementColor();
            ColorPicker.syncGradients();
        }
    },

    updateButtonColors: function () {
        btn_backgroundColor.style.setProperty("--myMapColor", `${MapEditor.loadedMap.style.backgroundColor}`);
        btn_playerColor.style.setProperty("--myMapColor", `${MapEditor.loadedMap.style.playerColor}`);
        btn_wallTopColor.style.setProperty("--myMapColor", `${MapEditor.loadedMap.style.wallTopColor}`);
        btn_wallSideColor.style.setProperty("--myMapColor", `${MapEditor.loadedMap.style.wallSideColor}`);
        btn_platformTopColor.style.setProperty("--myMapColor", `${MapEditor.loadedMap.style.platformTopColor}`);
        btn_platformSideColor.style.setProperty("--myMapColor", `${MapEditor.loadedMap.style.platformSideColor}`);
        btn_endZoneTopColor.style.setProperty("--myMapColor", `${MapEditor.loadedMap.style.endZoneTopColor}`);
        btn_endZoneSideColor.style.setProperty("--myMapColor", `${MapEditor.loadedMap.style.endZoneSideColor}`);
        btn_directLightColor.style.setProperty("--myMapColor", `${MapEditor.loadedMap.style.directLight}`);
        btn_ambientLightColor.style.setProperty("--myMapColor", `${MapEditor.loadedMap.style.ambientLight}`);
    },

    getColor: function () {
        return CanvasArea.HSLToRGB(this.h, this.s, this.l); // returns rgb string
    },

    copyColor: function () {
        this.copiedColor = this.getColor();
    },

    pasteColor: function () {
        if (this.copiedColor != null) {
            this.setColorViaRGB(this.copiedColor);
            this.updateSliders();
            this.syncGradients();
            this.updateElementColor();
        }
    },

    setColorViaRGB: function (rgbStringOrArray) {
        // sets the color pickers color
        let color;

        if (typeof rgbStringOrArray == "string") {
            color = rgbStringOrArray.replace(/[^\d,.]/g, "").split(",");
        } else {
            // is an array
            color = rgbStringOrArray;
        }

        let r = color[0];
        let g = color[1];
        let b = color[2];

        const hslValue = CanvasArea.RGBToHSL(r, g, b);

        this.h = hslValue[0];
        this.s = hslValue[1];
        this.l = hslValue[2];
    },

    updateSliders: function () {
        UserInterface.setSliderValue(btn_hueSlider, this.h);
        UserInterface.setSliderValue(btn_saturationSlider, this.s);
        UserInterface.setSliderValue(btn_lightnessSlider, this.l);
    },

    updateElementColor: function () {
        // updates the elements color
        if (this.editingElement == 0) {
            return;
        }

        if (this.editingElement == 1) {
            MapEditor.loadedMap.style.backgroundColor = ColorPicker.getColor();
        }

        if (this.editingElement == 2) {
            MapEditor.loadedMap.style.playerColor = ColorPicker.getColor();
        }

        if (this.editingElement == 3 || (this.editingElement == 4 && this.lockPlatformColors)) {
            MapEditor.loadedMap.style.platformTopColor = ColorPicker.getColor();
        }

        if (this.editingElement == 4 || (this.editingElement == 3 && this.lockPlatformColors)) {
            MapEditor.loadedMap.style.platformSideColor = ColorPicker.getColor();
        }

        if (this.editingElement == 5 || (this.editingElement == 6 && this.lockWallColors)) {
            MapEditor.loadedMap.style.wallTopColor = ColorPicker.getColor();
        }

        if (this.editingElement == 6 || (this.editingElement == 5 && this.lockWallColors)) {
            MapEditor.loadedMap.style.wallSideColor = ColorPicker.getColor();
        }

        if (this.editingElement == 7 || (this.editingElement == 8 && this.lockEndzoneColors)) {
            MapEditor.loadedMap.style.endZoneTopColor = ColorPicker.getColor();
        }

        if (this.editingElement == 8 || (this.editingElement == 7 && this.lockEndzoneColors)) {
            MapEditor.loadedMap.style.endZoneSideColor = ColorPicker.getColor();
        }

        if (this.editingElement == 9) {
            // direct light
            MapEditor.loadedMap.style.directLight = ColorPicker.getColor();
        }

        if (this.editingElement == 10) {
            // ambient light
            MapEditor.loadedMap.style.ambientLight = ColorPicker.getColor();
        }

        PreviewWindow.update();
    },
};
