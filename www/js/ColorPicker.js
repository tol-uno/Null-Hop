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
        // should be called sync
        const ctx = UserInterfaceCanvas.ctx;

        // all of these (except hue technically) needs to be created every time a slider is changed
        this.hueGradient = ctx.createLinearGradient(this.x + 20, 0, this.x + this.width - 40, 0);
        this.saturationGradient = ctx.createLinearGradient(this.x + 20, 0, this.x + this.width - 40, 0);
        this.lightnessGradient = ctx.createLinearGradient(this.x + 20, 0, this.x + this.width - 40, 0);

        // HUE BAR (could remove the alpha from all these)
        this.hueGradient.addColorStop(0 / 360, "hsla(0, 100%, 50%, 1)");
        this.hueGradient.addColorStop(10 / 360, "hsla(10, 100%, 50%, 1)");
        this.hueGradient.addColorStop(20 / 360, "hsla(20, 100%, 50%, 1)");
        this.hueGradient.addColorStop(30 / 360, "hsla(30, 100%, 50%, 1)");
        this.hueGradient.addColorStop(40 / 360, "hsla(40, 100%, 50%, 1)");
        this.hueGradient.addColorStop(50 / 360, "hsla(50, 100%, 50%, 1)");
        this.hueGradient.addColorStop(60 / 360, "hsla(60, 100%, 50%, 1)");
        this.hueGradient.addColorStop(70 / 360, "hsla(70, 100%, 50%, 1)");
        this.hueGradient.addColorStop(80 / 360, "hsla(80, 100%, 50%, 1)");
        this.hueGradient.addColorStop(90 / 360, "hsla(90, 100%, 50%, 1)");
        this.hueGradient.addColorStop(100 / 360, "hsla(100, 100%, 50%, 1)");
        this.hueGradient.addColorStop(110 / 360, "hsla(110, 100%, 50%, 1)");
        this.hueGradient.addColorStop(120 / 360, "hsla(120, 100%, 50%, 1)");
        this.hueGradient.addColorStop(130 / 360, "hsla(130, 100%, 50%, 1)");
        this.hueGradient.addColorStop(140 / 360, "hsla(140, 100%, 50%, 1)");
        this.hueGradient.addColorStop(150 / 360, "hsla(150, 100%, 50%, 1)");
        this.hueGradient.addColorStop(160 / 360, "hsla(160, 100%, 50%, 1)");
        this.hueGradient.addColorStop(170 / 360, "hsla(170, 100%, 50%, 1)");
        this.hueGradient.addColorStop(180 / 360, "hsla(180, 100%, 50%, 1)");
        this.hueGradient.addColorStop(190 / 360, "hsla(190, 100%, 50%, 1)");
        this.hueGradient.addColorStop(200 / 360, "hsla(200, 100%, 50%, 1)");
        this.hueGradient.addColorStop(210 / 360, "hsla(210, 100%, 50%, 1)");
        this.hueGradient.addColorStop(220 / 360, "hsla(220, 100%, 50%, 1)");
        this.hueGradient.addColorStop(230 / 360, "hsla(230, 100%, 50%, 1)");
        this.hueGradient.addColorStop(240 / 360, "hsla(240, 100%, 50%, 1)");
        this.hueGradient.addColorStop(250 / 360, "hsla(250, 100%, 50%, 1)");
        this.hueGradient.addColorStop(260 / 360, "hsla(260, 100%, 50%, 1)");
        this.hueGradient.addColorStop(270 / 360, "hsla(270, 100%, 50%, 1)");
        this.hueGradient.addColorStop(280 / 360, "hsla(280, 100%, 50%, 1)");
        this.hueGradient.addColorStop(290 / 360, "hsla(290, 100%, 50%, 1)");
        this.hueGradient.addColorStop(300 / 360, "hsla(300, 100%, 50%, 1)");
        this.hueGradient.addColorStop(310 / 360, "hsla(310, 100%, 50%, 1)");
        this.hueGradient.addColorStop(320 / 360, "hsla(320, 100%, 50%, 1)");
        this.hueGradient.addColorStop(330 / 360, "hsla(330, 100%, 50%, 1)");
        this.hueGradient.addColorStop(340 / 360, "hsla(340, 100%, 50%, 1)");
        this.hueGradient.addColorStop(350 / 360, "hsla(350, 100%, 50%, 1)");
        this.hueGradient.addColorStop(360 / 360, "hsla(360, 100%, 50%, 1)");

        // SATURATION BAR
        this.saturationGradient.addColorStop(0, "hsla(" + this.h + ", 0%, 50%, 1)");
        this.saturationGradient.addColorStop(0.25, "hsla(" + this.h + ", 25%, 50%, 1)");
        this.saturationGradient.addColorStop(0.5, "hsla(" + this.h + ", 50%, 50%, 1)");
        this.saturationGradient.addColorStop(0.75, "hsla(" + this.h + ", 75%, 50%, 1)");
        this.saturationGradient.addColorStop(1, "hsla(" + this.h + ", 100%, 50%, 1)");

        // LIGHTNESS BAR
        this.lightnessGradient.addColorStop(0, "hsla(" + this.h + ", 100%, 0%, 1)");
        this.lightnessGradient.addColorStop(0.25, "hsla(" + this.h + ", 100%, 25%, 1)");
        this.lightnessGradient.addColorStop(0.5, "hsla(" + this.h + ", 100%, 50%, 1)");
        this.lightnessGradient.addColorStop(0.75, "hsla(" + this.h + ", 100%, 75%, 1)");
        this.lightnessGradient.addColorStop(1, "hsla(" + this.h + ", 100%, 100%, 1)");
    },

    update: function () {
        if (this.hueGradient == null) {
            // only create gradients once
            this.syncGradients();
        }

        if (!btn_hueSlider.confirmed || !btn_saturationSlider.confirmed || !btn_lightnessSlider.confirmed) {
            // update every color every frame
            ColorPicker.h = btn_hueSlider.value;
            ColorPicker.s = btn_saturationSlider.value;
            ColorPicker.l = btn_lightnessSlider.value;
            ColorPicker.updateElementColor();
            ColorPicker.syncGradients();
        }
    },

    render: function () {
        const ctx = UserInterfaceCanvas.ctx;
        // Scaling is done in UserInterface where this ColorPicker.render() is called

        if (this.editingElement == 0) {
            // showing all color/element selection buttons
            // DRAW COLORS BEHIND BUTTONS

            // Background
            ctx.fillStyle = MapEditor.loadedMap.style.backgroundColor;
            UserInterfaceCanvas.roundedRect(
                btn_backgroundColor.x + 8,
                btn_backgroundColor.y + 8,
                btn_backgroundColor.width - 16,
                btn_backgroundColor.height - 16,
                btn_backgroundColor.height / 2
            );
            ctx.fill();

            // Player
            ctx.fillStyle = MapEditor.loadedMap.style.playerColor;
            UserInterfaceCanvas.roundedRect(
                btn_playerColor.x + 8,
                btn_playerColor.y + 8,
                btn_playerColor.width - 16,
                btn_playerColor.height - 16,
                btn_playerColor.height / 2
            );
            ctx.fill();

            // Direct Light
            ctx.fillStyle = MapEditor.loadedMap.style.directLight;
            UserInterfaceCanvas.roundedRect(
                btn_directLightColor.x + 8,
                btn_directLightColor.y + 8,
                btn_directLightColor.width - 16,
                btn_directLightColor.height - 16,
                btn_directLightColor.height / 2
            );
            ctx.fill();

            // Ambient Light
            ctx.fillStyle = MapEditor.loadedMap.style.ambientLight;
            UserInterfaceCanvas.roundedRect(
                btn_ambientLightColor.x + 8,
                btn_ambientLightColor.y + 8,
                btn_ambientLightColor.width - 16,
                btn_ambientLightColor.height - 16,
                btn_ambientLightColor.height / 2
            );
            ctx.fill();

            // Walls
            ctx.fillStyle = MapEditor.loadedMap.style.wallTopColor;
            UserInterfaceCanvas.roundedRect(
                btn_wallTopColor.x + 8,
                btn_wallTopColor.y + 8,
                btn_wallTopColor.width - 16,
                btn_wallTopColor.height - 16,
                btn_wallTopColor.height / 2
            );
            ctx.fill();
            ctx.fillStyle = MapEditor.loadedMap.style.wallSideColor;
            UserInterfaceCanvas.roundedRect(
                btn_wallSideColor.x + 8,
                btn_wallSideColor.y + 8,
                btn_wallSideColor.width - 16,
                btn_wallSideColor.height - 16,
                btn_wallSideColor.height / 2
            );
            ctx.fill();

            // Platforms
            ctx.fillStyle = MapEditor.loadedMap.style.platformTopColor;
            UserInterfaceCanvas.roundedRect(
                btn_platformTopColor.x + 8,
                btn_platformTopColor.y + 8,
                btn_platformTopColor.width - 16,
                btn_platformTopColor.height - 16,
                btn_platformTopColor.height / 2
            );
            ctx.fill();
            ctx.fillStyle = MapEditor.loadedMap.style.platformSideColor;
            UserInterfaceCanvas.roundedRect(
                btn_platformSideColor.x + 8,
                btn_platformSideColor.y + 8,
                btn_platformSideColor.width - 16,
                btn_platformSideColor.height - 16,
                btn_platformSideColor.height / 2
            );
            ctx.fill();

            // Endzones
            ctx.fillStyle = MapEditor.loadedMap.style.endZoneTopColor;
            UserInterfaceCanvas.roundedRect(
                btn_endZoneTopColor.x + 8,
                btn_endZoneTopColor.y + 8,
                btn_endZoneTopColor.width - 16,
                btn_endZoneTopColor.height - 16,
                btn_endZoneTopColor.height / 2
            );
            ctx.fill();
            ctx.fillStyle = MapEditor.loadedMap.style.endZoneSideColor;
            UserInterfaceCanvas.roundedRect(
                btn_endZoneSideColor.x + 8,
                btn_endZoneSideColor.y + 8,
                btn_endZoneSideColor.width - 16,
                btn_endZoneSideColor.height - 16,
                btn_endZoneSideColor.height / 2
            );
            ctx.fill();

            // DRAW ELEMENT TEXT ABOVE BOTTONS
            ctx.fillStyle = !UserInterface.darkMode ? UserInterface.lightColor_1 : UserInterface.darkColor_1;
            ctx.font = "28px BAHNSCHRIFT";
            ctx.fillText("Walls", btn_wallTopColor.x + 41, btn_wallTopColor.y - 12);
            ctx.fillText("Platforms", btn_platformTopColor.x + 14, btn_platformTopColor.y - 12);
            ctx.fillText("Endzones", btn_endZoneTopColor.x + 15, btn_endZoneTopColor.y - 12);

            // DRAW LINE BETWEEN TOP AND SIDE BUTTONS IF LOCKED
            ctx.strokeStyle = !UserInterface.darkMode ? UserInterface.lightColor_1 : UserInterface.darkColor_1;
            ctx.lineWidth = 8;
            ctx.lineCap = "round";

            drawLockLine(this.lockWallColors, btn_lockWallColors);
            drawLockLine(this.lockPlatformColors, btn_lockPlatformColors);
            drawLockLine(this.lockEndzoneColors, btn_lockEndzoneColors);
            ctx.setLineDash([]);

            function drawLockLine(lockToCheck, button) {
                if (lockToCheck) {
                    ctx.setLineDash([]);
                } else {
                    ctx.setLineDash([0, 14]);
                }

                const x = button.x;
                const y = button.y;

                ctx.beginPath();
                ctx.moveTo(x + 4, y - 12);
                ctx.lineTo(x + 12, y - 12);
                ctx.arcTo(x + 28, y - 12, x + 28, y + 4, 16);
                ctx.lineTo(x + 28, y + 52);
                ctx.arcTo(x + 28, y + 68, x + 12, y + 68, 16);
                ctx.lineTo(x + 4, y + 68);
                ctx.stroke();
            }
        } else {
            ctx.fillStyle = UserInterface.darkMode ? UserInterface.lightColor_1 : UserInterface.darkColor_1;

            ctx.strokeStyle = !UserInterface.darkMode ? UserInterface.lightColor_1 : UserInterface.darkColor_1;
            ctx.lineWidth = 4;

            // bounding box
            UserInterfaceCanvas.roundedRect(this.x, this.y, this.width, this.height, 25);
            ctx.fill();
            ctx.stroke();

            // color showcase box
            ctx.fillStyle = "hsl(" + this.h + ", " + this.s + "%, " + this.l + "%)";
            UserInterfaceCanvas.roundedRect(this.x + 20, this.y + 20, 120, 80, 10);
            ctx.fill();
            ctx.stroke();

            // rgb text
            ctx.font = "16px BAHNSCHRIFT";
            ctx.fillStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1;
            ctx.fillText(CanvasArea.HSLToRGB(this.h, this.s, this.l), this.x + 164, this.y + 122);

            // selected element text
            let selectedColor = null;
            if (this.editingElement == 1) {
                selectedColor = "Background";
            }
            if (this.editingElement == 2) {
                selectedColor = "Player";
            }
            if (this.editingElement == 3) {
                selectedColor = "Platform Tops";
            }
            if (this.editingElement == 4) {
                selectedColor = "Platform Sides";
            }
            if (this.editingElement == 5) {
                selectedColor = this.lockWallColors ? "Walls" : "Wall Tops";
            }
            if (this.editingElement == 6) {
                selectedColor = this.lockWallColors ? "Walls" : "Wall Sides";
            }
            if (this.editingElement == 7) {
                selectedColor = "Endzone Tops";
            }
            if (this.editingElement == 8) {
                selectedColor = "Endzone Sides";
            }
            if (this.editingElement == 9) {
                selectedColor = "Direct Light";
            }
            if (this.editingElement == 10) {
                selectedColor = "Ambient Light";
            }

            if (selectedColor != null) {
                ctx.fillText(selectedColor, this.x + 164, this.y + 36);
            }

            // draw gradients for each slider
            ctx.fillStyle = this.hueGradient;
            ctx.fillRect(this.x + 16, this.y + 162, this.width - 32, 14);

            ctx.fillStyle = this.saturationGradient;
            ctx.fillRect(this.x + 16, this.y + 234, this.width - 32, 14);

            ctx.fillStyle = this.lightnessGradient;
            ctx.fillRect(this.x + 16, this.y + 306, this.width - 32, 14);
        }
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
        btn_hueSlider.updateState(this.h);
        btn_saturationSlider.updateState(this.s);
        btn_lightnessSlider.updateState(this.l);
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
