class Button {
    constructor(x, y, width, image, image_pressed, togglable, label, func) {
        this.x = eval(x);
        this.y = eval(y);
        this.savedX = x;
        this.savedY = y;


        // GET ICON DIRECTLY THROUGH CORDOVA LOCAL STORAGE   
        const buttonURL = cordova.file.applicationDirectory + "www/assets/images/buttons/"
        
        window.resolveLocalFileSystemURL(buttonURL, (dirEntry) => {

            // GETTING ICONS FOR IMAGE PARAMETER
            dirEntry.getFile(image + ".svg", {create: false, exclusive: false}, (fileEntry) => {

                fileEntry.file( (file) => {

                    const reader = new FileReader();
                    
                    reader.onload = (e) => {

                        // create SVG elements documents
                        // CAN COMBINE ALL INITs HERE
                        const lightSVG = new DOMParser().parseFromString(e.target.result, "image/svg+xml").documentElement;
                        const lightSVG_p = new DOMParser().parseFromString(e.target.result, "image/svg+xml").documentElement;
                        
                        const darkSVG = new DOMParser().parseFromString(e.target.result, "image/svg+xml").documentElement;
                        const darkSVG_p = new DOMParser().parseFromString(e.target.result, "image/svg+xml").documentElement;
                        

                        // edit fills to to be light/dark modes
                        lightSVG.getElementById("bg").style.fill = UserInterface.lightColor_1
                        lightSVG.getElementById("icon").style.fill = UserInterface.darkColor_1
                        lightSVG_p.getElementById("bg").style.fill = UserInterface.lightColor_2
                        lightSVG_p.getElementById("icon").style.fill = UserInterface.darkColor_2

                        darkSVG.getElementById("bg").style.fill = UserInterface.darkColor_1
                        darkSVG.getElementById("icon").style.fill= UserInterface.lightColor_1
                        darkSVG_p.getElementById("bg").style.fill = UserInterface.darkColor_2
                        darkSVG_p.getElementById("icon").style.fill= UserInterface.lightColor_2

                        
                        // converts svg element to string
                        const lightSVG_string = new XMLSerializer().serializeToString(lightSVG);
                        const lightSVG_p_string = new XMLSerializer().serializeToString(lightSVG_p);

                        const darkSVG_string = new XMLSerializer().serializeToString(darkSVG);
                        const darkSVG_p_string = new XMLSerializer().serializeToString(darkSVG_p);


                        // Converting SVG text string to blob for image source
                        // https://medium.com/@benjamin.black/using-blob-from-svg-text-as-image-source-2a8947af7a8e
                        const lightSVG_blob = new Blob([lightSVG_string], {type: 'image/svg+xml'});
                        const lightSVG_p_blob = new Blob([lightSVG_p_string], {type: 'image/svg+xml'});

                        const darkSVG_blob = new Blob([darkSVG_string], {type: 'image/svg+xml'});
                        const darkSVG_p_blob = new Blob([darkSVG_p_string], {type: 'image/svg+xml'});


                        // create links for adding to source of img
                        const lightSVG_url = URL.createObjectURL(lightSVG_blob);
                        const lightSVG_p_url = URL.createObjectURL(lightSVG_p_blob);

                        const darkSVG_url = URL.createObjectURL(darkSVG_blob);
                        const darkSVG_p_url = URL.createObjectURL(darkSVG_p_blob);


                        // add these svg links as src to two images
                        this.lightIcon = new Image()
                        this.lightIcon_p = new Image()

                        this.darkIcon = new Image()
                        this.darkIcon_p = new Image()

                        this.lightIcon.addEventListener("load", () => {URL.revokeObjectURL(lightSVG_url)}, {once: true});
                        this.lightIcon_p.addEventListener("load", () => {URL.revokeObjectURL(lightSVG_p_url)}, {once: true});

                        this.darkIcon.addEventListener("load", () => {URL.revokeObjectURL(darkSVG_url)}, {once: true});
                        this.darkIcon_p.addEventListener("load", () => {URL.revokeObjectURL(darkSVG_p_url)}, {once: true});

                        // Waits till after the images are loaded to get their aspect ratios
                        // COULD MOVE TO A FUNCTION ELSEWERE THAT IS JUST CALLED
                        this.lightIcon.addEventListener("load", () => { // just uses another random event listener... yuck
                            this.image = this.lightIcon
                            this.width = width
                            this.height = this.width * (this.image.height / this.image.width)
                        }, {once: true});

                        this.lightIcon.src = lightSVG_url
                        this.lightIcon_p.src = lightSVG_p_url

                        this.darkIcon.src = darkSVG_url
                        this.darkIcon_p.src = darkSVG_p_url


                    };
                    reader.onerror = (e) => alert(e.target.error.name);
        
                    reader.readAsText(file)
                })
            }, () => {
                this.width = width;
                this.height = this.width > 75 ? 75 : this.width

                // TRUNCATE LABEL
                CanvasArea.ctx.font = "22px BAHNSCHRIFT"; // for measuring text
                this.shortLabel = UserInterface.truncateText(label, this.width - 50) 
                
                
            });


            // GETTING IMAGE_PRESSED. messy to do most of this code twice but... 
            if (image_pressed !== "") {
                dirEntry.getFile(image_pressed + ".svg", {create: false, exclusive: false}, (fileEntry) => {

                    fileEntry.file( (file) => {
    
                        const reader = new FileReader();
                        
                        reader.onload = (e) => {
    
                            // create SVG elements documents
                            // CAN COMBINE ALL INITs HERE
                            const lightSVG = new DOMParser().parseFromString(e.target.result, "image/svg+xml").documentElement;
                            const darkSVG = new DOMParser().parseFromString(e.target.result, "image/svg+xml").documentElement;
                            
    
                            // edit fills to to be light/dark modes
                            lightSVG.getElementById("bg").style.fill = UserInterface.lightColor_1
                            lightSVG.getElementById("icon").style.fill = UserInterface.darkColor_1
    
                            darkSVG.getElementById("bg").style.fill = UserInterface.darkColor_1
                            darkSVG.getElementById("icon").style.fill= UserInterface.lightColor_1

                            
                            // converts svg element to string
                            const lightSVG_string = new XMLSerializer().serializeToString(lightSVG);    
                            const darkSVG_string = new XMLSerializer().serializeToString(darkSVG);
    
    
                            // Converting SVG text string to blob for image source
                            // https://medium.com/@benjamin.black/using-blob-from-svg-text-as-image-source-2a8947af7a8e
                            const lightSVG_blob = new Blob([lightSVG_string], {type: 'image/svg+xml'});    
                            const darkSVG_blob = new Blob([darkSVG_string], {type: 'image/svg+xml'});
    
    
                            // create links for adding to source of img
                            const lightSVG_url = URL.createObjectURL(lightSVG_blob);
                            const darkSVG_url = URL.createObjectURL(darkSVG_blob);
    
    
                            // add these svg links as src to two images
                            this.lightIcon_toggled = new Image()    
                            this.darkIcon_toggled = new Image()
    
                            this.lightIcon_toggled.addEventListener("load", () => {URL.revokeObjectURL(lightSVG_url)}, {once: true});    
                            this.darkIcon_toggled.addEventListener("load", () => {URL.revokeObjectURL(darkSVG_url)}, {once: true});
    

                            this.lightIcon_toggled.src = lightSVG_url    
                            this.darkIcon_toggled.src = darkSVG_url

                            this.hasToggleImage = true
    
                        };
                        reader.onerror = (e) => alert(e.target.error.name);
            
                        reader.readAsText(file)
                    })
                });
            }


        })
        

        this.isPressed = false
        this.func = func;

        this.toggle = 0
        if (togglable) {
            this.func(true) // runs the released function with the "sync" tag to sync button's toggle state
        }


        // shortLabel set in asych function above ^
        this.label = label

    }

    render() {

        CanvasArea.ctx.save()

        const shrinkFactor = (this.hasToggleImage) ? 1 : 0.95 // doesnt need to be calculated every frame

        if (this.image == null) { // dynamically draw button (no icon)

            let x, y, w, h

            if (UserInterface.darkMode == false) {
                CanvasArea.ctx.fillStyle = (this.toggle == 1 || this.isPressed) ? UserInterface.lightColor_2 : UserInterface.lightColor_1;
            } else {
                CanvasArea.ctx.fillStyle = (this.toggle == 1 || this.isPressed) ? UserInterface.darkColor_2 : UserInterface.darkColor_1;
            }

            if (this.toggle == 1 || this.isPressed) {
                w = this.width * shrinkFactor
                h = this.height * shrinkFactor
                x = this.x + ((this.width - w) / 2)
                y = this.y + ((this.height - h) / 2)
            } else {
                w = this.width;
                h = this.height;
                x = this.x;
                y = this.y;
            }

            const radius = h/2
            CanvasArea.ctx.beginPath()
            CanvasArea.ctx.moveTo(x + radius, y) // top line
            CanvasArea.ctx.lineTo(x + w - radius, y)
            CanvasArea.ctx.arc(x + w - radius, y + radius, radius, 1.5*Math.PI, 0.5*Math.PI) // right arc
            CanvasArea.ctx.lineTo(x + radius, y + h)
            CanvasArea.ctx.arc(x + radius, y + radius, radius, 0.5*Math.PI, 1.5*Math.PI)

            CanvasArea.ctx.fill()

        } else { // draw image normally

            let icon, x, y, w, h

            if (UserInterface.darkMode == false) { // light mode
                if (this.hasToggleImage) {
                    icon = (this.toggle == 1 || this.isPressed) ? this.lightIcon_toggled : this.lightIcon;
                } else {
                    icon = (this.toggle == 1 || this.isPressed) ? this.lightIcon_p : this.lightIcon;
                }
            } else { // dark mode
                if (this.hasToggleImage) {
                    icon = (this.toggle == 1 || this.isPressed) ? this.darkIcon_toggled : this.darkIcon;
                } else {
                    icon = (this.toggle == 1 || this.isPressed) ? this.darkIcon_p : this.darkIcon;
                }
            }

            if (this.toggle == 1 || this.isPressed) {
                w = this.width * shrinkFactor
                h = this.height * shrinkFactor
                x = this.x + ((this.width - w) / 2)
                y = this.y + ((this.height - h) / 2)
            } else {
                w = this.width;
                h = this.height;
                x = this.x;
                y = this.y;
            }

            // draws whatever icon with whatever pressed state were set above
            CanvasArea.ctx.drawImage(icon, x, y, w, h)

        }

        CanvasArea.ctx.restore() // resets to no shadows

        if (this.label != "") {

            CanvasArea.ctx.font = "22px BAHNSCHRIFT";
            CanvasArea.ctx.fillStyle = (!UserInterface.darkMode) ? UserInterface.darkColor_1: UserInterface.lightColor_1;

            CanvasArea.ctx.fillText(this.shortLabel, this.x + (this.width - CanvasArea.ctx.measureText(this.shortLabel).width)/2, this.y + (this.height/2) + 7)
        }
     
    }

    pressed() {
        this.isPressed = true;
        // any release event calls released() on applicable buttons then sets isPressed = false on every rendered button
    }

    released(override) { // overide ignores the requirement to be pressed before released
        if (override) {this.func()}
        if (this.isPressed) {this.func()}
    }

}