class Button {
    constructor(x, y, width, image, image_pressed, togglable, label, func) {
        this.x = x
        this.y = y
        this.savedX = x; // unused
        this.savedY = y; // used by Map Browser
        this.width = width;
        this.image = image;
        this.image_pressed = image_pressed;
        this.label = label;
        this.func = func;

        this.isPressed = false;

        this.toggle = 0; // Some buttons are togglable like MapBrowser's Map buttons and toggle switches
        if (togglable) { 
            this.func(true); // runs the released function with the "sync" tag to sync button's toggle state
        } // dont set "togglable" true unless toggle button has a (sync) flag in its function

        this.ready = false
        this.init();
    }

    async init() {
        if (this.image !== "") {
            const rawImageSvgText = await readFile(
                "local",
                "assets/images/buttons/",
                this.image + ".svg",
                "text"
            );

            // create 4 differnt color versions by replacing fills and strokes in svg string
            const lightSvgText = replaceSvgColors(
                rawImageSvgText,
                UserInterface.lightColor_1,
                UserInterface.darkColor_1
            );
            const lightPressedSvgText = replaceSvgColors(
                rawImageSvgText,
                UserInterface.lightColor_2,
                UserInterface.darkColor_2
            );

            const darkSvgText = replaceSvgColors(
                rawImageSvgText,
                UserInterface.darkColor_1,
                UserInterface.lightColor_1
            );
            const darkPressedSvgText = replaceSvgColors(
                rawImageSvgText,
                UserInterface.darkColor_2,
                UserInterface.lightColor_2
            );

            // creating images from the svg text
            // FIX FIX FIX could use one this.icon and generate the correct image on the fly
            // (depending on how fast createImageFromSvgText is)
            this.lightIcon = await createImageFromSvgText(lightSvgText);
            this.lightIcon_p = await createImageFromSvgText(lightPressedSvgText);
            this.darkIcon = await createImageFromSvgText(darkSvgText);
            this.darkIcon_p = await createImageFromSvgText(darkPressedSvgText);

            // Get the original SVGs aspect ratio and use it to set height
            // this.width isnt always the same as the SVGs width -- that's why ratio is needed
            this.height = this.width * (this.lightIcon.height / this.lightIcon.width);
        } else {
            // NO image given -- set 56px height & use label for dynamic button
            this.height = this.width > 56 ? 56 : this.width;
            // TRUNCATE LABEL
            UserInterfaceCanvas.ctx.font = "20px BAHNSCHRIFT"; // for measuring text
            this.label = UserInterface.truncateText(this.label, this.width - 40);
        }

        // Set up independent image_pressed icon for buttons with a visually different pressed state.
        // Toggle switches are only buttons that use this right now.
        if (this.image_pressed !== "") {
            const rawImagePressedSvgText = await readFile(
                "local",
                "assets/images/buttons/",
                this.image_pressed + ".svg",
                "text"
            );

            // create 2 light and dark versions by replacing fills and strokes in svg string
            const lightSvgText = replaceSvgColors(
                rawImagePressedSvgText,
                UserInterface.lightColor_1,
                UserInterface.darkColor_1
            );

            const darkSvgText = replaceSvgColors(
                rawImagePressedSvgText,
                UserInterface.darkColor_1,
                UserInterface.lightColor_1
            );

            this.lightIcon_toggled = await createImageFromSvgText(lightSvgText);
            this.darkIcon_toggled = await createImageFromSvgText(darkSvgText);

            this.hasToggleImage = true;
        }

        // Tells .render() that its safe to draw the icons
        this.ready = true;

        // Utility functions used in init()
        function replaceSvgColors(svgString, newBackgroundColor, newForegroundColor) {
            let newSvgString = svgString;

            // Replace fills
            newSvgString = newSvgString.replace(
                /fill=(["'])\s*#?(?:fff(?:fff)?|white)\s*\1/gi,
                `fill="${newBackgroundColor}"`
            );
            newSvgString = newSvgString.replace(
                /fill=(["'])\s*#?(?:000(?:000)?|black)\s*\1/gi,
                `fill="${newForegroundColor}"`
            );

            // Replace strokes
            newSvgString = newSvgString.replace(
                /stroke=(["'])\s*#?(?:fff(?:fff)?|white)\s*\1/gi,
                `stroke="${newBackgroundColor}"`
            );
            newSvgString = newSvgString.replace(
                /stroke=(["'])\s*#?(?:000(?:000)?|black)\s*\1/gi,
                `stroke="${newForegroundColor}"`
            );

            return newSvgString;
        }

        async function createImageFromSvgText(svgText) {
            return new Promise((resolve, reject) => {
                // Promise resolves when the image is ready
                const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
                const url = URL.createObjectURL(svgBlob);

                const img = new Image();
                img.onload = () => {
                    URL.revokeObjectURL(url);
                    resolve(img);
                };
                img.onerror = (e) => {
                    console.error("createImageFromSvgText failed: ", e);
                    reject(e);
                };
                img.src = url;
            });
        }
    }

    render() {
        if (!this.ready) {
            return
        }

        const shrinkFactor = this.hasToggleImage ? 1 : 0.94; // doesnt need to be calculated every frame

        // // Draw Shadow
        // if (!this.isPressed) {
        //     UserInterfaceCanvas.roundedRect(this.x + 4, this.y + 4, this.width, this.height, this.height/2)
        //     UserInterfaceCanvas.ctx.fillStyle = "rgba(0,0,0,0.25)"
        //     UserInterfaceCanvas.ctx.fill()
        // }


        if (this.image == "") {
            // dynamically draw button (no icon)

            let x, y, w, h;

            if (UserInterface.darkMode == false) {
                UserInterfaceCanvas.ctx.fillStyle =
                    this.toggle == 1 || this.isPressed
                        ? UserInterface.lightColor_2
                        : UserInterface.lightColor_1;
            } else {
                UserInterfaceCanvas.ctx.fillStyle =
                    this.toggle == 1 || this.isPressed
                        ? UserInterface.darkColor_2
                        : UserInterface.darkColor_1;
            }

            if (this.toggle == 1 || this.isPressed) {
                w = this.width * shrinkFactor;
                h = this.height * shrinkFactor;
                x = this.x + (this.width - w) / 2;
                y = this.y + (this.height - h) / 2;
            } else {
                w = this.width;
                h = this.height;
                x = this.x;
                y = this.y;
            }

            const radius = h / 2;
            UserInterfaceCanvas.ctx.beginPath();
            UserInterfaceCanvas.ctx.moveTo(x + radius, y); // top line
            UserInterfaceCanvas.ctx.lineTo(x + w - radius, y);
            UserInterfaceCanvas.ctx.arc(
                x + w - radius,
                y + radius,
                radius,
                1.5 * Math.PI,
                0.5 * Math.PI
            ); // right arc
            UserInterfaceCanvas.ctx.lineTo(x + radius, y + h);
            UserInterfaceCanvas.ctx.arc(
                x + radius,
                y + radius,
                radius,
                0.5 * Math.PI,
                1.5 * Math.PI
            );

            UserInterfaceCanvas.ctx.fill();

            // ADJUST TEXT SIZE TO SHRINK IF PRESSED
            const fontSize = this.toggle == 1 || this.isPressed ? 20 * shrinkFactor : 20;
            UserInterfaceCanvas.ctx.font = `${fontSize}px BAHNSCHRIFT`;
            UserInterfaceCanvas.ctx.fillStyle = !UserInterface.darkMode
                ? UserInterface.darkColor_1
                : UserInterface.lightColor_1;

            UserInterfaceCanvas.ctx.fillText(
                this.label,
                this.x + (this.width - UserInterfaceCanvas.ctx.measureText(this.label).width) / 2,
                this.y + this.height / 2 + 6
            );
        } else {
            // Draw SVG image icon normally

            let icon, x, y, w, h;

            if (UserInterface.darkMode == false) {
                // light mode
                if (this.hasToggleImage) {
                    icon =
                        this.toggle == 1 || this.isPressed
                            ? this.lightIcon_toggled
                            : this.lightIcon;
                } else {
                    icon = this.toggle == 1 || this.isPressed ? this.lightIcon_p : this.lightIcon;
                }
            } else {
                // dark mode
                if (this.hasToggleImage) {
                    icon =
                        this.toggle == 1 || this.isPressed ? this.darkIcon_toggled : this.darkIcon;
                } else {
                    icon = this.toggle == 1 || this.isPressed ? this.darkIcon_p : this.darkIcon;
                }
            }

            if (this.toggle == 1 || this.isPressed) {
                w = this.width * shrinkFactor;
                h = this.height * shrinkFactor;
                x = this.x + (this.width - w) / 2;
                y = this.y + (this.height - h) / 2;
            } else {
                w = this.width;
                h = this.height;
                x = this.x;
                y = this.y;
            }

            // draws whatever icon with whatever pressed state were set above
            UserInterfaceCanvas.ctx.drawImage(icon, x, y, w, h);
        }
    }

    pressed() {
        this.isPressed = true;
        // any release event calls released() on applicable buttons then sets isPressed = false on every rendered button
    }

    released(override) {
        // overide ignores the requirement to be pressed before released
        if (override || this.isPressed) {
            this.func();
        }
    }
}
