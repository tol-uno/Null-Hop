const ColorPicker = {
    x : window.outerWidth - 400,
    y : 30,
    width : 360,
    height : 340,
    hueGradient : null,
    saturationGradient : null,
    lightnessGradient : null,

    copiedColor : null,

    editingElement : 0, 
    // 0 nothing
    // 1 bg
    // 2 player
    // 3 platform top
    // 4 platform side
    // 5 wall top
    // 6 wall side
    // 7 end top
    // 8 end side
    // 9 direct light
    // 10 ambient light

    h : 117,
    s : 34,
    l : 75,

    syncGradients : function() { // should be called sync
        const ctx = CanvasArea.ctx;

        // all of these (except hue technically) needs to be created every time a slider is changed
        this.hueGradient = ctx.createLinearGradient(this.x + 20, 0, this.x + this.width - 40, 0)
        this.saturationGradient = ctx.createLinearGradient(this.x + 20, 0, this.x + this.width - 40, 0)
        this.lightnessGradient = ctx.createLinearGradient(this.x + 20, 0, this.x + this.width - 40, 0)


        // HUE BAR (could remove the alpha from all these)
        this.hueGradient.addColorStop(0/360, "hsla(0, 100%, 50%, 1)");
        this.hueGradient.addColorStop(10/360, "hsla(10, 100%, 50%, 1)");
        this.hueGradient.addColorStop(20/360, "hsla(20, 100%, 50%, 1)");
        this.hueGradient.addColorStop(30/360, "hsla(30, 100%, 50%, 1)");
        this.hueGradient.addColorStop(40/360, "hsla(40, 100%, 50%, 1)");
        this.hueGradient.addColorStop(50/360, "hsla(50, 100%, 50%, 1)");
        this.hueGradient.addColorStop(60/360, "hsla(60, 100%, 50%, 1)");
        this.hueGradient.addColorStop(70/360, "hsla(70, 100%, 50%, 1)");
        this.hueGradient.addColorStop(80/360, "hsla(80, 100%, 50%, 1)");
        this.hueGradient.addColorStop(90/360, "hsla(90, 100%, 50%, 1)");
        this.hueGradient.addColorStop(100/360, "hsla(100, 100%, 50%, 1)");
        this.hueGradient.addColorStop(110/360, "hsla(110, 100%, 50%, 1)");
        this.hueGradient.addColorStop(120/360, "hsla(120, 100%, 50%, 1)");
        this.hueGradient.addColorStop(130/360, "hsla(130, 100%, 50%, 1)");
        this.hueGradient.addColorStop(140/360, "hsla(140, 100%, 50%, 1)");
        this.hueGradient.addColorStop(150/360, "hsla(150, 100%, 50%, 1)");
        this.hueGradient.addColorStop(160/360, "hsla(160, 100%, 50%, 1)");
        this.hueGradient.addColorStop(170/360, "hsla(170, 100%, 50%, 1)");
        this.hueGradient.addColorStop(180/360, "hsla(180, 100%, 50%, 1)");
        this.hueGradient.addColorStop(190/360, "hsla(190, 100%, 50%, 1)");
        this.hueGradient.addColorStop(200/360, "hsla(200, 100%, 50%, 1)");
        this.hueGradient.addColorStop(210/360, "hsla(210, 100%, 50%, 1)");
        this.hueGradient.addColorStop(220/360, "hsla(220, 100%, 50%, 1)");
        this.hueGradient.addColorStop(230/360, "hsla(230, 100%, 50%, 1)");
        this.hueGradient.addColorStop(240/360, "hsla(240, 100%, 50%, 1)");
        this.hueGradient.addColorStop(250/360, "hsla(250, 100%, 50%, 1)");
        this.hueGradient.addColorStop(260/360, "hsla(260, 100%, 50%, 1)");
        this.hueGradient.addColorStop(270/360, "hsla(270, 100%, 50%, 1)");
        this.hueGradient.addColorStop(280/360, "hsla(280, 100%, 50%, 1)");
        this.hueGradient.addColorStop(290/360, "hsla(290, 100%, 50%, 1)");
        this.hueGradient.addColorStop(300/360, "hsla(300, 100%, 50%, 1)");
        this.hueGradient.addColorStop(310/360, "hsla(310, 100%, 50%, 1)");
        this.hueGradient.addColorStop(320/360, "hsla(320, 100%, 50%, 1)");
        this.hueGradient.addColorStop(330/360, "hsla(330, 100%, 50%, 1)");
        this.hueGradient.addColorStop(340/360, "hsla(340, 100%, 50%, 1)");
        this.hueGradient.addColorStop(350/360, "hsla(350, 100%, 50%, 1)");
        this.hueGradient.addColorStop(360/360, "hsla(360, 100%, 50%, 1)");

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

    toggleAllButtons : function() {
        UserInterface.renderedButtons.forEach(button => {
            button.toggle = 0
        })
    },

    update : function() {
        if (this.hueGradient == null) { // only create gradients once
            this.syncGradients();
        }

        if (!btn_hueSlider.confirmed || !btn_saturationSlider.confirmed || !btn_lightnessSlider.confirmed) { // update every color every frame
            ColorPicker.h = btn_hueSlider.value
            ColorPicker.s = btn_saturationSlider.value
            ColorPicker.l = btn_lightnessSlider.value
            ColorPicker.updateElementColor()
            ColorPicker.syncGradients()
        }

    },

    render : function() {
        const ctx = CanvasArea.ctx;
        ctx.save()
        ctx.scale(CanvasArea.scale, CanvasArea.scale) // All UI elements are positioned on original CSS cords. this brings them up to device DPI resolution

        ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.lightColor_1 : UserInterface.darkColor_1;

        ctx.strokeStyle = (!UserInterface.darkMode) ? UserInterface.lightColor_1 : UserInterface.darkColor_1
        ctx.lineWidth = 4

        // bounding box
        CanvasArea.roundedRect(this.x, this.y, this.width, this.height, 25)
        ctx.fill()
        ctx.stroke()

        // color showcase box
        ctx.fillStyle = "hsl(" + this.h + ", " + this.s + "%, " + this.l + "%)"
        CanvasArea.roundedRect(this.x + 20, this.y + 20, 120, 80, 10)
        ctx.fill()
        ctx.stroke()

        // rbg text
        ctx.font = "16px BAHNSCHRIFT";
        ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1 : UserInterface.lightColor_1;
        ctx.fillText(CanvasArea.HSLToRGB(this.h, this.s, this.l), this.x + 164, this.y + 36)

        // selected element text
        let selectedColor = null

        if (this.editingElement == 1) {selectedColor = "Background"}
        if (this.editingElement == 2) {selectedColor = "Player"}
        if (this.editingElement == 3) {selectedColor = "Platform Top"}
        if (this.editingElement == 4) {selectedColor = "Platform Side"}
        if (this.editingElement == 5) {selectedColor = "Wall Top"}
        if (this.editingElement == 6) {selectedColor = "Wall Side"}    
        if (this.editingElement == 7) {selectedColor = "End Zone Top"}
        if (this.editingElement == 8) {selectedColor = "End Zone Side"}
        if (this.editingElement == 9) {selectedColor = "Sun Light"}
        if (this.editingElement == 10) {selectedColor = "Ambient Light"}

        if (selectedColor != null) {
            ctx.fillText(selectedColor, this.x + 180, this.y + 85)
        }

        // draw gradients for each slider
        ctx.fillStyle = this.hueGradient
        ctx.fillRect(this.x + 16, this.y + 160, this.width - 32, 14)

        ctx.fillStyle = this.saturationGradient
        ctx.fillRect(this.x + 16, this.y + 234, this.width - 32, 14)
        
        ctx.fillStyle = this.lightnessGradient
        ctx.fillRect(this.x + 16, this.y + 308, this.width - 32, 14)

        ctx.restore()
    },

    getColor : function() {
        return CanvasArea.HSLToRGB(this.h, this.s, this.l) // returns rbg string
    },

    copyColor : function() {
        this.copiedColor = this.getColor()
    },

    pasteColor : function() {
        if (this.copiedColor != null) {

            this.setColorViaRGB(this.copiedColor)
            this.updateSliders()
            this.syncGradients()
            this.updateElementColor()
        }
    },

    setColorViaRGB : function(rgbStringOrArray) { // sets the color pickers color

        let color

        if (typeof rgbStringOrArray == "string") {
            color = rgbStringOrArray.replace(/[^\d,.]/g, '').split(',')
        } else { // is an array
            color = rgbStringOrArray
        }

        let r = color[0]
        let g = color[1]
        let b = color[2]

        const hslValue = CanvasArea.RGBToHSL(r,g,b)

        this.h = hslValue[0]
        this.s = hslValue[1]
        this.l = hslValue[2]
    },

    updateSliders : function() {
        btn_hueSlider.updateState(this.h)
        btn_saturationSlider.updateState(this.s)
        btn_lightnessSlider.updateState(this.l)
    },

    updateElementColor : function() { // updates the elements color
        if (this.editingElement == 0) {return}

        if (this.editingElement == 1) {
            CanvasArea.canvas.style.backgroundColor = MapEditor.loadedMap.style.backgroundColor = ColorPicker.getColor()
        }

        if (this.editingElement == 2) {
            MapEditor.loadedMap.style.playerColor = ColorPicker.getColor()
        }

        if (this.editingElement == 3) {
            MapEditor.loadedMap.style.platformTopColor = ColorPicker.getColor()
        }
        
        if (this.editingElement == 4) {
            MapEditor.loadedMap.style.platformSideColor = ColorPicker.getColor()
        }

        if (this.editingElement == 5) {
            MapEditor.loadedMap.style.wallTopColor = ColorPicker.getColor()
        }
        
        if (this.editingElement == 6) {
            MapEditor.loadedMap.style.wallSideColor = ColorPicker.getColor()
        }
        
        if (this.editingElement == 7) {
            MapEditor.loadedMap.style.endZoneTopColor = ColorPicker.getColor()
        }
        
        if (this.editingElement == 8) {
            MapEditor.loadedMap.style.endZoneSideColor = ColorPicker.getColor()
        }

        if (this.editingElement == 9) { // direct light
            MapEditor.loadedMap.style.directLight = ColorPicker.getColor()
        }

        if (this.editingElement == 10) { // ambient light
            MapEditor.loadedMap.style.ambientLight = ColorPicker.getColor()
        }

        PreviewWindow.update()
    }
}
