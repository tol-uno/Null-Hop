document.addEventListener("deviceready", onDeviceReady, false);


const airAcceleration = 6; // the sharpness your allowed to turn at
const maxVelocity = 1.15; // basically the rate at which speed is gained / lost. wishDir is scaled to this magnitude
const gravity = 0.05;
let prevDateNow;
let dt = 1;

let midX = 0;
let midY = 0;

function onDeviceReady() { // Called on page load in HMTL

    
    touchHandler = new InputHandler; // MAKE THIS A VAR NOT A CLASS
    canvasArea.start(); // userInterface.start() called here
    AudioHandler.init();
    player = null; // Needs to be created by map    

}


class Averager {
    
    constructor(maxFramesSampled) {
        this.maxFramesSampled = maxFramesSampled;
        // this.dtAdjusted = dtAdjusted;
        this.frames = [];
    }
        
    pushValue = (value) => {
        if (this.frames.push(value) > this.maxFramesSampled / dt) {this.frames.shift()} // adds new value to frames[] & removes oldest (if theres more then max allowed frames in array)
    }

    getAverage = () => {
        const average = this.frames.reduce((a, b) => a + b) / this.frames.length
        return average
    }

    clear = () => {
        this.frames = []
    }
}


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
                canvasArea.ctx.font = "22px BAHNSCHRIFT"; // for measuring text
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

        canvasArea.ctx.save()

        const shrinkFactor = (this.hasToggleImage) ? 1 : 0.95 // doesnt need to be calculated every frame

        if (this.image == null) { // dynamically draw button (no icon)

            let x, y, w, h

            if (UserInterface.darkMode == false) {
                canvasArea.ctx.fillStyle = (this.toggle == 1 || this.isPressed) ? UserInterface.lightColor_2 : UserInterface.lightColor_1;
            } else {
                canvasArea.ctx.fillStyle = (this.toggle == 1 || this.isPressed) ? UserInterface.darkColor_2 : UserInterface.darkColor_1;
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
            canvasArea.ctx.beginPath()
            canvasArea.ctx.moveTo(x + radius, y) // top line
            canvasArea.ctx.lineTo(x + w - radius, y)
            canvasArea.ctx.arc(x + w - radius, y + radius, radius, 1.5*Math.PI, 0.5*Math.PI) // right arc
            canvasArea.ctx.lineTo(x + radius, y + h)
            canvasArea.ctx.arc(x + radius, y + radius, radius, 0.5*Math.PI, 1.5*Math.PI)

            canvasArea.ctx.fill()

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
            canvasArea.ctx.drawImage(icon, x, y, w, h)

        }

        canvasArea.ctx.restore() // resets to no shadows

        if (this.label != "") {

            canvasArea.ctx.font = "22px BAHNSCHRIFT";
            canvasArea.ctx.fillStyle = (!UserInterface.darkMode) ? UserInterface.darkColor_1: UserInterface.lightColor_1;

            canvasArea.ctx.fillText(this.shortLabel, this.x + (this.width - canvasArea.ctx.measureText(this.shortLabel).width)/2, this.y + (this.height/2) + 7)
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


class SliderUI {

    constructor(x, y, width, min, max, decimalDetail, label, variable, func) {
        this.x = eval(x);
        this.y = eval(y);
        this.width = width;
        this.min = min;
        this.max = max;
        this.decimalDetail = decimalDetail //0.2 or 1/5 = multiples of 5, 1 = whole numbers, 10 = 10ths place, 100 = 100ths place
        this.label = label;
        this.value = variable;
        this.func = func;
        this.sliderX = this.x + width / ((max - min)/this.value);
        this.confirmed = true;
    }

    updateState(value) { // updates the button when its value is changed by external source
        this.value = value;
        // this.sliderX = this.x + this.width / ((this.max - this.min)/this.value);
        this.sliderX = (this.value - this.min) * (this.x + this.width - this.x) / (this.max - this.min) + this.x;

    }


    render() {
        canvasArea.ctx.lineWidth = 8;
        canvasArea.ctx.lineCap = "round"
        canvasArea.ctx.fillStyle = canvasArea.ctx.strokeStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1: UserInterface.lightColor_1;

        
        canvasArea.ctx.beginPath(); // Slider Line
        canvasArea.ctx.moveTo(this.x, this.y)
        canvasArea.ctx.lineTo(this.x + this.width, this.y)
        canvasArea.ctx.stroke();

        canvasArea.ctx.font = "20px BAHNSCHRIFT"; // Label
        canvasArea.ctx.fillText(this.label + ": " + this.value, this.x, this.y - 30)

        canvasArea.ctx.beginPath(); // Slider Handle
        canvasArea.ctx.arc(this.sliderX, this.y, 15, 0, 2 * Math.PI);
        canvasArea.ctx.fill();

        // draw highlight color in slider handle
        canvasArea.ctx.fillStyle = (!UserInterface.darkMode) ? UserInterface.darkColor_1: UserInterface.lightColor_1;
        canvasArea.ctx.beginPath();
        canvasArea.ctx.arc(this.sliderX, this.y, 10, 0, 2 * Math.PI);
        canvasArea.ctx.fill();
    }

    update() {
        if (!this.confirmed) {

            if (touchHandler.dragging) {

                if (touchHandler.touches[0].x < this.x) {
                    // set to lowest
                    this.sliderX = this.x
                } else {
                    if (touchHandler.touches[0].x > this.x + this.width) {
                        // set to highest
                        this.sliderX = this.x + this.width
                    } else {
                        // within slider bounds
                        this.sliderX = touchHandler.touches[0].x
                    }
                }

                // MAP TO RANGE: https://stackoverflow.com/questions/10756313/javascript-jquery-map-a-range-of-numbers-to-another-range-of-numbers
                // (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
                // inmin = this.x
                // inmax = this.x + this.width
                // outmin = this.min
                // outmax = this.max

                this.value = (this.sliderX - this.x) * (this.max - this.min) / (this.width) + this.min;
                this.value = Math.round(this.value * this.decimalDetail) / this.decimalDetail;
                // this.value = Math.round(this.value / 10) * 10; // for snapping to nearest multiple of 10 


            } else { // not dragging -- need to confirm slider
                // map snapped value to pixels along slider. snapping the position of the visual slider
                this.sliderX = (this.value - this.min) * (this.x + this.width - this.x) / (this.max - this.min) + this.x;

                this.func(); // run the functions built into the slider
                this.confirmed = true;
            }
        }
    }
}


class Vector {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }

    set = function(x,y) {
        this.x = x;
        this.y = y;
        // should add angle
    }

    add = function(otherVec) {
        this.x += otherVec.x;
        this.y += otherVec.y;
    }

    divide = function(scalar) {
        return new Vector(this.x / scalar, this.y / scalar);
    }

    multiply = function(scalar) {
        this.x *= scalar;
        this.y *= scalar;
    }

    dotProduct = function(otherVec) { // ONLY FOR 2D Vectors. Projects Parent Vector onto otherVec
        return (this.x * otherVec.x) + (this.y * otherVec.y)
    }

    magnitude = function() {
        return Math.sqrt((this.x ** 2) + (this.y ** 2))
    }

    rotate = function(ang) // angle in degrees. returns new array -- doesnt modify existing one. It seems to incriment by the angle
    {
        ang = ang * (Math.PI/180);
        const cos = Math.cos(ang);
        const sin = Math.sin(ang);
        return new Vector(Math.round(10000*(this.x * cos - this.y * sin))/10000, Math.round(10000*(this.x * sin + this.y * cos))/10000);
    }

    angleDifference = function(otherVec) { // returns radians between 0 and PI

        // Calculate the angle of each vector relative to the positive x-axis
        let angle1 = Math.atan2(this.y, this.x);
        let angle2 = Math.atan2(otherVec.y, otherVec.x);

        let angleDiff = Math.abs(angle1 - angle2);

        // Normalize the angle to be between 0 and π
        if (angleDiff > Math.PI) {
            angleDiff = 2 * Math.PI - angleDiff;
        }

        // Round the angle difference to two decimal points
        return angleDiff
    }

    getAngle = function() { // RETURNS ANGLE IN DEGREES. https://stackoverflow.com/questions/35271222/getting-the-angle-from-a-direction-vector
        const angle = Math.atan2(this.y, this.x);   //radians
        // you need to divide by PI, and MULTIPLY by 180:
        const degrees = 180 * angle/Math.PI;  //degrees
        return (360+Math.round(degrees))%360; //round number, avoid decimal fragments
    }

    normalize = function(multiplier) { // NOTE: requires multiplier
        if (this.length !== 0) {
            const n = this.divide(this.magnitude()); // dont ever want to normalize when vector length is zero
            this.x = n.x * multiplier;
            this.y = n.y * multiplier;
        }
    }
}


const canvasArea = { //Canvas Object
    

    start : function() { // called in deviceReady
        this.canvas = document.createElement("canvas")

        this.scale = 1.3

        this.canvas.width = window.outerWidth * this.scale;
        this.canvas.height = window.outerHeight * this.scale;

        this.canvas.style.width = window.outerWidth + "px";
        this.canvas.style.height = window.outerHeight + "px";

        midX = canvasArea.canvas.width / 2;
        midY = canvasArea.canvas.height / 2;

        this.ctx = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        
        prevDateNow = performance.now()

        this.interval = setInterval(updateGameArea, 10); // Number sets the taget frame rate. 1000/# = FPS

        UserInterface.start(); // need to be ran here after canvas is resized in canvasArea.start()
    },


    clear : function() { // CLEARS WHOLE CANVAS
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    },


    resize : function() { // SHOULDNT REALLY EVER BE CALLED 
        console.log("resized :)");

        this.canvas.width = window.outerWidth;
        this.canvas.height = window.outerHeight;

        midX = this.canvas.width / 2;
        midY = this.canvas.height / 2;

    },


    convexHull: function(points) {

        function cross(a, b, o) {
            return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
         }

        points.sort(function(a, b) {
           return a[0] == b[0] ? a[1] - b[1] : a[0] - b[0];
        });
     
        const lower = [];
        for (let i = 0; i < points.length; i++) {
           while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], points[i]) <= 0) {
              lower.pop();
           }
           lower.push(points[i]);
        }
     
        const upper = [];
        for (let i = points.length - 1; i >= 0; i--) {
           while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0) {
              upper.pop();
           }
           upper.push(points[i]);
        }
     
        upper.pop();
        lower.pop();
        return lower.concat(upper);
    },


    HSLToRGB: function(h, s, l, alpha) {
        s /= 100;
        l /= 100;
        const k = n => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = n =>
          l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        // return [255 * f(0), 255 * f(8), 255 * f(4), alpha];
        return "rgba(" + Math.round(255 * f(0)) + "," + Math.round(255 * f(8)) + "," + Math.round(255 * f(4)) + "," + alpha + ")"
    },


    RGBToHSL: function (r, g, b, a) {
        r /= 255
        g /= 255
        b /= 255
        a /= 255

        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
    
        if(max == min){
            h = s = 0; // achromatic
        }else{
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch(max){
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
    
        return [
            Math.round(h*360),
            Math.round(s*100),
            Math.round(l*100),
            Math.round(a * 100) / 100
        ];
    },


    getShadedColor: function (color, litPercent) { // litPercent is how much sun is hitting the face 0 -> 1 
        
        let directLight;
        let ambientLight;

        if (UserInterface.gamestate == 5 || UserInterface.gamestate == 6) {
            directLight = Map.style.directLight ?? "rba(255,255,255)"
            ambientLight = Map.style.ambientLight ?? "rba(140,184,198)"
        } else {
            directLight = MapEditor.loadedMap.style.directLight ?? "rba(255,255,255)"
            ambientLight = MapEditor.loadedMap.style.ambientLight ?? "rba(140,184,198)"
        }

        // parse main color
        color = color.replace(/[^\d,.]/g, '').split(',')
        let r = color[0]
        let g = color[1]
        let b = color[2]
        
        // parse directLight color
        directLight = directLight.replace(/[^\d,.]/g, '').split(',')
        directLight = {
            r : directLight[0],
            g : directLight[1],
            b : directLight[2]
        }
        
        // parse ambientLight color
        ambientLight = ambientLight.replace(/[^\d,.]/g, '').split(',')
        ambientLight = {
            r : ambientLight[0],
            g : ambientLight[1],
            b : ambientLight[2]
        }
        
        r = (litPercent) * (r * (directLight.r / 255)) + (1 - litPercent) * (r * (ambientLight.r / 255)) // left of + is color fully lit by sunlight
        g = (litPercent) * (g * (directLight.g / 255)) + (1 - litPercent) * (g * (ambientLight.g / 255)) // right of + is color fully lit by ambient light
        b = (litPercent) * (b * (directLight.b / 255)) + (1 - litPercent) * (b * (ambientLight.b / 255))

        r = Math.round(r)
        g = Math.round(g)
        b = Math.round(b)

        return `rgb(${r},${g},${b})`
    },


    roundedRect : function (x, y, width, height, radius) { // not perfect corner arcs. could use .arc() instead
        const ctx = canvasArea.ctx

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    },


    mapToRange : function (number, inMin, inMax, outMin, outMax) {
        
        // MAP TO RANGE: https://stackoverflow.com/questions/10756313/javascript-jquery-map-a-range-of-numbers-to-another-range-of-numbers
        return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    },

}


const UserInterface = {
    
    gamestate : 1,
    // 1: main menu
    // 2: level select map browser
    // 3: settings
    // 4: store
    // 5: loading map page
    // 6: in level
    // 7: in map editor

    settings : {
        sensitivity : null,
        volume : null,
        debugText : null,
        strafeHUD : null,
        playTutorial : null,
    },
    
    showVelocity : true,

    timer : 0,
    timerStart : null, // set by jump button
    levelState : 1, // 1 = pre-start, 2 = playing level, 3 = in endzone

    leaderboards : {},
    records : {},
    previousRecord : 0,

    showVerticalWarning : false,
    showOverstrafeWarning : false,

    darkMode : false,

    // lightColor_1 : "#fff8ea", // lighter
    // lightColor_2 : "#f7f1e4", // darker
    // darkColor_1 : "#503c4b",
    // darkColor_2 : "#412b3a",
    
    lightColor_1 : "#F5F5F5", // lighter
    lightColor_2 : "#E0E0E0", // darker
    darkColor_1 : "#454545",
    darkColor_2 : "#363636",


    start : function() { // where all buttons are created
        

        this.getSettings()
        this.getRecords()
        this.getLeaderboards()
        this.checkCustomMapsDirectoryExists()

        
        // CREATING THE BUTTONS []  []  [] 

        // Main Menu BUTTONS
        btn_play = new Button("midX - 90", 180, 180, "play_button", "", 0, "", function() { 
            UserInterface.gamestate = 2;
            UserInterface.renderedButtons = UserInterface.btnGroup_standardMapBrowser
            MapBrowser.state = 1;
            MapBrowser.init()
        })

        btn_settings = new Button("midX - 116.5", 280, 233, "settings_button", "", 0, "", function() {
            UserInterface.gamestate = 3;
            UserInterface.renderedButtons = UserInterface.btnGroup_settings
        })

        btn_mapEditor = new Button("midX - 143", 380, 286, "map_editor_button", "", 0, "", function() {
            UserInterface.gamestate = 7;
            MapEditor.editorState = 0;
            UserInterface.renderedButtons = UserInterface.btnGroup_mapEditorMenu;
        })



        // SETTINGS Buttons 
        btn_reset_settings = new Button("canvasArea.canvas.width - 300", "canvasArea.canvas.height - 100", 200, "", "", 0, "Erase Data", function() {
            
            const reset = confirm("Reset All Settings and Records?");
            if (reset) {

                UserInterface.records = {
                    "unlocked": UserInterface.records.unlocked
                };
                UserInterface.writeRecords();


                UserInterface.settings = {
                    "sensitivity": 0.5,
                    "volume": 0.5,
                    "debugText": 0,
                    "strafeHUD": 1,
                    "playTutorial": 1
                }
                UserInterface.writeSettings()

                // sync all settings button
                btn_sensitivitySlider.updateState(UserInterface.settings.sensitivity)
                btn_volumeSlider.updateState(UserInterface.settings.volume)
                btn_debugText.func(true)
                btn_strafeHUD.func(true)
                btn_playTutorial.func(true)
                AudioHandler.setVolumes();
                
                console.log("records and settings cleared")
            }

        })

        btn_sensitivitySlider = new SliderUI(180, 100, 300, 0.1, 3, 10, "Sensitivity", UserInterface.settings.sensitivity, function() { 
            UserInterface.settings.sensitivity = this.value
            UserInterface.writeSettings()
        })

        btn_volumeSlider = new SliderUI(180, 200, 300, 0, 1, 10, "Volume", UserInterface.settings.volume, function() { 
            UserInterface.settings.volume = this.value
            UserInterface.writeSettings()
            AudioHandler.setVolumes();
        })

        btn_debugText = new Button(310, 240, 80, "toggle_button", "toggle_button_pressed", 1, "", function(sync) {
            if (sync) {
                    this.toggle = UserInterface.settings.debugText;
            } else {
                if (this.toggle == 1) {
                    this.toggle = 0;
                    UserInterface.settings.debugText = 0
                    UserInterface.writeSettings()
                } else {
                    this.toggle = 1;
                    UserInterface.settings.debugText = 1
                    UserInterface.writeSettings()
                }
            }
        })

        btn_strafeHUD = new Button(310, 300, 80, "toggle_button", "toggle_button_pressed", 1, "", function(sync) {
            if (sync) {
                this.toggle = UserInterface.settings.strafeHUD;
            } else {
                if (this.toggle == 1) {
                    this.toggle = 0;
                    UserInterface.settings.strafeHUD = 0
                    UserInterface.writeSettings()
                } else {
                    this.toggle = 1;
                    UserInterface.settings.strafeHUD = 1
                    UserInterface.writeSettings()
                }
            }
        })



        // MAP EDITOR MENU BUTTONS
        btn_new_map = new Button("200", "40", 400, "", "", 0, "Create New Map", function() {
            
            MapEditor.loadedMap =
                {
                    "playerStart": {
                        "x": 350,
                        "y": 250,
                        "angle": 0
                    },
                    "checkpoints": [],
                    "style": {
                        "backgroundColor": "rgba(163,213,225,1)",
                        "playerColor": "rgba(239,238,236,1)",
                        "platformTopColor": "rgba(209,70,63,1)",
                        "platformSideColor": "rgba(209,70,63,1)",
                        "wallTopColor": "rgba(125, 94, 49, 1)",
                        "wallSideColor": "rgba(125, 94, 49, 1)",
                        "endZoneTopColor": "rgba(255,218,98,1)",
                        "endZoneSideColor": "rgba(255,218,98,1)",
                        "directLight": "rba(255,255,255)",
                        "ambientLight": "rba(140,184,198)",
                        "platformHeight": 25,
                        "wallHeight": 50,
                        "lightDirection": 45,
                        "lightPitch": 45
                    },
                    "platforms": [
                        {
                            "x": 350,
                            "y": 60,
                            "width": 100,
                            "height": 100,
                            "angle": 0,
                            "endzone": 1,
                            "wall": 0
                        },
                        {
                            "x": 350,
                            "y": 250,
                            "width": 100,
                            "height": 100,
                            "angle": 45,
                            "endzone": 0,
                            "wall": 0
                        }
                    ]
                }
        })

        btn_load_map = new Button("200", "140", 400, "", "", 0, "Load A Map", function() {
            MapEditor.editorState = 5;
            
            UserInterface.gamestate = 2;

            UserInterface.renderedButtons = UserInterface.btnGroup_editMapBrowser;


            // ADDING DIV OVERLAY FOR SHARE BUTTON
            btn_shareMap.func(true) // runs the createDiv function of the button


            MapBrowser.state = 2
            MapBrowser.init()
        })

        btn_import_map = new Button("200", "240", 400, "", "", 0, "Import Map From File Browser", function() {
           
            // LOAD FROM LOCAL FILE SYSTEM 
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".text";
            document.body.appendChild(input);
            input.click();
            
            input.addEventListener('change', function () {
                const file = input.files[0]
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    MapEditor.loadedMap = JSON.parse(e.target.result)
                };
                reader.onerror = (e) => alert(e.target.error.name);

                reader.readAsText(file)
            })

            input.remove();
            
        })

        btn_import_map_text = new Button("200", "340", 400, "", "", 0, "Import Map From Copy Paste", function() {
           
            let mapPaste = prompt("Paste Map Data:");
            if (mapPaste) {
                MapEditor.loadedMap = JSON.parse(mapPaste)
            }
            
        })


        // MAP EDITOR BUTTONS
        btn_exit_edit = new Button(50, 50, 100, "back_button", "back_button_pressed", 0, "", function() {
            MapEditor.saveCustomMap()
        })
        
        btn_add_platform = new Button("canvasArea.canvas.width - 240", "25", 204, "platform_button", "", 0, "", function() {
            
            const newPlatform = {
                "x": Math.round(MapEditor.screen.x),
                "y": Math.round(MapEditor.screen.y),
                "width": 100,
                "height": 100,
                "hypotenuse": Math.sqrt(this.width * this.width + this.height * this.height)/2,
                "angle": 0,
                "endzone": 0,
                "wall": 0
            }


            MapEditor.loadedMap.platforms.push(newPlatform);
            MapEditor.selectedElements = MapEditor.multiSelect ? MapEditor.selectedElements.concat(MapEditor.loadedMap.platforms.length - 1) : [MapEditor.loadedMap.platforms.length - 1]
            UserInterface.renderedButtons = UserInterface.btnGroup_editPlatform
            
            // SYNC ALL BUTTONS AND SLIDERS
            btn_angleSlider.updateState(MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].angle)
            btn_wall.func(true) // syncs the wall button's toggle state
        })

        btn_add_checkpoint = new Button("canvasArea.canvas.width - 300", "120", 250, "cp_button", "", 0, "", function() {
            const middleX = Math.round(MapEditor.screen.x)
            const middleY = Math.round(MapEditor.screen.y)
            const newCheckPoint = {
                "triggerX1": middleX - 100,
                "triggerY1": middleY,
                "triggerX2": middleX + 100,
                "triggerY2": middleY,
                "x": middleX,
                "y": middleY + 50,
                "angle": 270
            }

            MapEditor.loadedMap.checkpoints.push(newCheckPoint);
        })

        btn_map_colors = new Button("canvasArea.canvas.width -388", "25", 126, "map_colors_button", "", 0, "", function() {
            MapEditor.editorState = 3 // map colors
            
            PreviewWindow.update()

            UserInterface.renderedButtons = UserInterface.btnGroup_mapColor
        })

        btn_map_settings = new Button("canvasArea.canvas.width - 550", "25", 141, "map_settings_button", "", 0, "", function() {
            MapEditor.editorState = 4 // map settings
            
            PreviewWindow.update()

            btn_platformHeightSlider.updateState(MapEditor.loadedMap.style.platformHeight) // value is set to 0 before we're in MapEditor
            btn_wallHeightSlider.updateState(MapEditor.loadedMap.style.wallHeight)
            btn_lightDirectionSlider.updateState(MapEditor.loadedMap.style.lightDirection)
            btn_lightPitchSlider.updateState(MapEditor.loadedMap.style.lightPitch)

            UserInterface.renderedButtons = UserInterface.btnGroup_mapSettings
        })

        btn_multiSelect = new Button("60", "canvasArea.canvas.height - 200", 60, "toggle_button", "toggle_button_pressed", 1, "", function(sync) { 
            if (MapEditor.loadedMap) { // throws an error otherwise
                if (sync) {
                    // doesnt need to sync
                } else {
                    if (this.toggle) { // turn off multSelect
                        this.toggle = 0;
                        MapEditor.multiSelect = false
                        if (MapEditor.selectedElements.length > 1) {
                            MapEditor.selectedElements = [MapEditor.selectedElements[MapEditor.selectedElements.length - 1]] // make it only select the last element in the array
                            
                            // set correct btnGroup
                            if (MapEditor.selectedElements[0] == "playerStart") {
                                UserInterface.renderedButtons = UserInterface.btnGroup_editPlayerStart

                            } else if (Array.isArray(MapEditor.selectedElements[0])) {
                                UserInterface.renderedButtons = UserInterface.btnGroup_editCheckPoint

                            } else {
                                UserInterface.renderedButtons = UserInterface.btnGroup_editPlatform;
                            }

                        }

                    } else { // turn on
                        this.toggle = 1;
                        MapEditor.multiSelect = true
                    }
                }
            }    
        })

        btn_snappingSlider = new SliderUI("60", "canvasArea.canvas.height - 60", 170, 0, 50, 0.2, "Snapping", MapEditor.loadedMap ? MapEditor.snapAmount : 0, function() {
            MapEditor.snapAmount = this.value
        })

        btn_unselect = new Button("canvasArea.canvas.width - 260", "30", 60, "x_button", "", 0, "", function() {
            UserInterface.renderedButtons = UserInterface.btnGroup_mapEditorInterface
            MapEditor.selectedElements = []; // No selected platforms
        })

        btn_translate = new Button(0, 0, 50, "translate_button", "", 0, "", function() {
            // for multiselect:
            // get center average of all selected elements
            // create an array containing each element with its xKey / yKey
            // do a selectedElements.forEach loop to run logic on each element
            
            let avgMidX = 0
            let avgMidY = 0
            let conditioningArray = []

            // populate conditioningArray
            for (let i = 0; i < MapEditor.selectedElements.length; i++) {
                
                // PRE CONDITIONING FOR THE SELECTED ELEMENTS
                let item = {
                    element : null,
                    xKey : "x", // these are used to distingish wheather to use triggerX1 or just x when dealing with checkpoints
                    yKey : "y", // implemented this system so that the btn_translate logic can be done with one section of code
                    offSet : 0, // amount to offset the bnt_translate from the center of the element
                }
                
                
                if (MapEditor.selectedElements[i] == "playerStart") { // if playerStart is selected
                    item.element = MapEditor.loadedMap.playerStart
                    item.offSet = 32
                    
                //} else if (MapEditor.selectedElements.some((element) => Array.isArray(element))) { // some() checks if any elements within the array match the given condition
                } else if (Array.isArray(MapEditor.selectedElements[i])) {
                    
                    //checkpoint = MapEditor.selectedElements.find((element) => Array.isArray(element)) // multi
                    checkpoint = MapEditor.selectedElements[i]
                    
                    item.element = MapEditor.loadedMap.checkpoints[checkpoint[0]]
                    
                    if (checkpoint[1] == 1) {
                        item.xKey = "triggerX1"
                        item.yKey = "triggerY1"
                    }
                    
                    if (checkpoint[1] == 2) {
                        item.xKey = "triggerX2"
                        item.yKey = "triggerY2"
                    }
                    
                    if (checkpoint[1] == 3) {
                        item.offSet = 32
                    }
                    
                } else { // selected platform
                    item.element = MapEditor.loadedMap.platforms[MapEditor.selectedElements[i]]
                }

                conditioningArray.push(item)
                avgMidX += item.element[item.xKey]
                avgMidY += item.element[item.yKey]
            }
            
            avgMidX = avgMidX / conditioningArray.length
            avgMidY = avgMidY / conditioningArray.length
            
            
            
            // ACTUAL BUTTON LOGIC 
            
            if (!this.isPressed) { // not pressed
                
                // element coords mapped to screen coords
                // mapToRange(number, inMin, inMax, outMin, outMax)
                const xMapped = canvasArea.mapToRange(avgMidX, MapEditor.screen.cornerX, MapEditor.screen.cornerX + MapEditor.screen.width, 0, canvasArea.canvas.width)
                const yMapped = canvasArea.mapToRange(avgMidY, MapEditor.screen.cornerY, MapEditor.screen.cornerY + MapEditor.screen.height, 0, canvasArea.canvas.height)
                
                // position button in the middle of element(s)
                if (MapEditor.selectedElements.length > 1) {
                    this.x =  xMapped - this.width/2
                    this.y =  yMapped - this.height/2
                } else {
                    this.x =  xMapped + (conditioningArray[0].offSet * MapEditor.zoom) - this.width/2
                    this.y =  yMapped + (conditioningArray[0].offSet * MapEditor.zoom) - this.height/2
                }

            } else if (touchHandler.dragging) {

                // move button according to touch dragging
                // adjust and pan screen if button is near the edge
                // move element to rounded and mapped button coords
                // snap element to snapping slider

                this.x += touchHandler.dragAmountX
                this.y += touchHandler.dragAmountY

                // panning if at edges of screen
                if (this.x > canvasArea.canvas.width - 340) {
                    MapEditor.screen.x += 4 / MapEditor.zoom * dt
                }

                if (this.x < 60) {
                    MapEditor.screen.x -= 4 / MapEditor.zoom * dt
                }

                if (this.y > canvasArea.canvas.height - 130) {
                    MapEditor.screen.y += 4 / MapEditor.zoom * dt
                }

                if (this.y < 30) {
                    MapEditor.screen.y -= 4 / MapEditor.zoom * dt
                }
        
                
                // MOVING EACH SELECTED ELEMENT TO FOLLOW BUTTON
                for (let i = 0; i < MapEditor.selectedElements.length; i++) {
                    let offSetFromBtnX = (avgMidX - conditioningArray[i].element[conditioningArray[i].xKey]) * MapEditor.zoom
                    let offSetFromBtnY = (avgMidY - conditioningArray[i].element[conditioningArray[i].yKey]) * MapEditor.zoom

                    let xMapped
                    let yMapped
                    // this.x and this.y mapped to map coords
                    // mapToRange(number, inMin, inMax, outMin, outMax)
                    if (MapEditor.selectedElements.length > 1) { // use offSetFromBtn which is offset from center of all selected items
                        xMapped = canvasArea.mapToRange(this.x - offSetFromBtnX + this.width/2, 0, canvasArea.canvas.width, MapEditor.screen.cornerX, MapEditor.screen.cornerX + MapEditor.screen.width)
                        yMapped = canvasArea.mapToRange(this.y - offSetFromBtnY + this.height/2, 0, canvasArea.canvas.height, MapEditor.screen.cornerY, MapEditor.screen.cornerY + MapEditor.screen.height)
                    } else { // use offset
                        xMapped = canvasArea.mapToRange(this.x - (conditioningArray[i].offSet * MapEditor.zoom) + this.width/2, 0, canvasArea.canvas.width, MapEditor.screen.cornerX, MapEditor.screen.cornerX + MapEditor.screen.width)
                        yMapped = canvasArea.mapToRange(this.y - (conditioningArray[i].offSet * MapEditor.zoom) + this.height/2, 0, canvasArea.canvas.height, MapEditor.screen.cornerY, MapEditor.screen.cornerY + MapEditor.screen.height)
                    }
                    
                    conditioningArray[i].element[conditioningArray[i].xKey] = Math.round(xMapped)
                    conditioningArray[i].element[conditioningArray[i].yKey] = Math.round(yMapped)      
                    
                    if (MapEditor.snapAmount > 0) {
                        conditioningArray[i].element[conditioningArray[i].xKey] = Math.round(conditioningArray[i].element[conditioningArray[i].xKey] / MapEditor.snapAmount) * MapEditor.snapAmount
                        conditioningArray[i].element[conditioningArray[i].yKey] = Math.round(conditioningArray[i].element[conditioningArray[i].yKey] / MapEditor.snapAmount) * MapEditor.snapAmount
                    }

                }
                

            }
        })



        btn_resize = new Button(0, 0, 50, "scale_button", "", 0, "", function() {
            
            let platform = MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]]

            if (!this.isPressed) {

                // position button at corner of element

                // bot right corner (relative to platform center)
                const angleRad = platform.angle * (Math.PI/180);
                const cornerX =  ((platform.width / 2) * Math.cos(angleRad)) - ((platform.height / 2) * Math.sin(angleRad))
                const cornerY = ((platform.width / 2) * Math.sin(angleRad)) + ((platform.height / 2) * Math.cos(angleRad))
                
                // corner coords mapped to screen coords
                // mapToRange(number, inMin, inMax, outMin, outMax)
                const cornerMappedX = canvasArea.mapToRange(platform.x + cornerX, MapEditor.screen.cornerX, MapEditor.screen.cornerX + MapEditor.screen.width, 0, canvasArea.canvas.width)
                const cornerMappedY = canvasArea.mapToRange(platform.y + cornerY, MapEditor.screen.cornerY, MapEditor.screen.cornerY + MapEditor.screen.height, 0, canvasArea.canvas.height)
                
                this.x = cornerMappedX
                this.y = cornerMappedY


            } else if (touchHandler.dragging) {
    
                // move button according to touch dragging
                // adjust and pan screen if button is near the edge
                // resize element to rounded and mapped button coords
                // snap element to snapping slider

                this.x += touchHandler.dragAmountX
                this.y += touchHandler.dragAmountY

                // panning if at edges of screen
                if (this.x > canvasArea.canvas.width - 340) {
                    MapEditor.screen.x += 4 / MapEditor.zoom * dt
                }

                if (this.x < 60) {
                    MapEditor.screen.x -= 4 / MapEditor.zoom * dt
                }

                if (this.y > canvasArea.canvas.height - 130) {
                    MapEditor.screen.y += 4 / MapEditor.zoom * dt
                }

                if (this.y < 30) {
                    MapEditor.screen.y -= 4 / MapEditor.zoom * dt
                }

                
                // map platform center coords to screen coords
                const xMapped = canvasArea.mapToRange(platform.x, MapEditor.screen.cornerX, MapEditor.screen.cornerX + MapEditor.screen.width, 0, canvasArea.canvas.width)
                const yMapped = canvasArea.mapToRange(platform.y, MapEditor.screen.cornerY, MapEditor.screen.cornerY + MapEditor.screen.height, 0, canvasArea.canvas.height)

                // transform drag amount to match with platform angle
                let drag = new Vector((this.x - xMapped) / MapEditor.zoom, (this.y - yMapped) / MapEditor.zoom).rotate(-platform.angle)


                platform.width = Math.round(drag.x) * 2 // multiplied by 2 because platform will be moving oppposite direction from drag direction (to appear stable)
                platform.height = Math.round(drag.y) * 2
    
                if (MapEditor.snapAmount > 0) {
                    platform.width = Math.round(platform.width / MapEditor.snapAmount) * MapEditor.snapAmount
                    platform.height = Math.round(platform.height / MapEditor.snapAmount) * MapEditor.snapAmount
                }

                if (platform.width < 5) {platform.width = 5}
                if (platform.height < 5) {platform.height = 5}
            }
        })

        btn_angleSlider = new SliderUI("canvasArea.canvas.width - 250", "250", 170, -45, 45, 1, "Angle", MapEditor.loadedMap ? MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]] : 0, function() {
            if (MapEditor.snapAmount > 0) {this.updateState(Math.round(this.value / MapEditor.snapAmount) * MapEditor.snapAmount)}
            if (this.value < this.min) {this.updateState(this.min)} // these are incase snapping pushes the value over or under the limits
            if (this.value > this.max) {this.updateState(this.max)}
            MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].angle = this.value
        })

        btn_playerAngleSlider = new SliderUI("canvasArea.canvas.width - 250", "250", 170, 0, 360, 1, "Angle", MapEditor.loadedMap ? MapEditor.loadedMap.playerStart : 0, function() {
            if (MapEditor.snapAmount > 0) {this.updateState(Math.round(this.value / MapEditor.snapAmount) * MapEditor.snapAmount)}
            MapEditor.loadedMap.playerStart.angle = this.value
        })

        btn_checkpointAngleSlider = new SliderUI("canvasArea.canvas.width - 250", "280", 170, 0, 360, 1, "Angle", MapEditor.loadedMap ? MapEditor.loadedMap.checkpoints[MapEditor.selectedElements[0][0]] : 0, function() {
            if (MapEditor.snapAmount > 0) {this.updateState(Math.round(this.value / MapEditor.snapAmount) * MapEditor.snapAmount)}
            MapEditor.loadedMap.checkpoints[MapEditor.selectedElements[0][0]].angle = this.value
        })

        btn_wall = new Button("canvasArea.canvas.width - 170", "280", 60, "toggle_button", "toggle_button_pressed", 1, "", function(sync) { 
            if (MapEditor.loadedMap) { // throws an error otherwise
                if (sync) {
                    this.toggle = MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].wall?1:0; // gets initial value of toggle
                } else {
                    if (this.toggle) {
                        this.toggle = 0;
                        MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].wall = 0
                    } else {
                        this.toggle = 1;
                        MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].wall = 1
                    }
                }
            }    
        })

        btn_delete_platform = new Button("canvasArea.canvas.width - 175", "canvasArea.canvas.height - 100", 120, "delete_button", "", 0, "", function() {
            
            MapEditor.selectedElements.forEach((element) => { // loop through and delete
                if (Array.isArray(element)) { // delete checkpoint
                    
                    MapEditor.loadedMap.checkpoints[element[0]] = "remove"

                } else if (element != "playerStart") { // delete platform but DONT delete playerStart

                    MapEditor.loadedMap.platforms[element] = "remove" // set a placeholder which will be removed by .filter
                }
            })
            
            MapEditor.loadedMap.checkpoints = MapEditor.loadedMap.checkpoints.filter((checkpoint) => checkpoint != "remove");
            MapEditor.loadedMap.platforms = MapEditor.loadedMap.platforms.filter((platform) => platform != "remove");
            
            MapEditor.selectedElements = []; // No selected elements after delete
            UserInterface.renderedButtons = UserInterface.btnGroup_mapEditorInterface
            
        })

        btn_duplicate_platform = new Button("canvasArea.canvas.width - 250", "canvasArea.canvas.height - 185", 200, "", "", 0, "Duplicate", function() {
            let originPlatform = {
                x : null,
                y : null
            }
            
            MapEditor.selectedElements.forEach((element) => {
                
                if (element != "playerStart" && !Array.isArray(element)) { // only run for platforms

                    const newPlatform = {...MapEditor.loadedMap.platforms[element]} // get selected platform. spread syntax creates a shallow copy that doesn not link/reference 
                    
                    if (originPlatform.x == null) { // set origin platform
                        originPlatform.x = MapEditor.loadedMap.platforms[element].x
                        originPlatform.y = MapEditor.loadedMap.platforms[element].y
                    }

                    const offsetFromOriginPlatformX = MapEditor.loadedMap.platforms[element].x - originPlatform.x
                    const offsetFromOriginPlatformY = MapEditor.loadedMap.platforms[element].y - originPlatform.y

                    newPlatform.x = Math.round(MapEditor.screen.x) + offsetFromOriginPlatformX, // center it
                    newPlatform.y = Math.round(MapEditor.screen.y) + offsetFromOriginPlatformY,
        
                    MapEditor.loadedMap.platforms.push(newPlatform); // add it
                    
                    // deal with selections
                    if (MapEditor.multiSelect) {
                        MapEditor.selectedElements[MapEditor.selectedElements.indexOf(element)] = MapEditor.loadedMap.platforms.length - 1
                    } else {
                        MapEditor.selectedElements = [MapEditor.loadedMap.platforms.length - 1]
                    }
                }
            })
            
            if (MapEditor.selectedElements.length == 1) { // only sync in single select
                // SYNC ALL BUTTONS AND SLIDERS
                btn_angleSlider.updateState(MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].angle)
                btn_wall.func(true) // syncs the wall button's toggle state
            }
        })




        // MAP SETTINGS SLIDERS
        btn_platformHeightSlider = new SliderUI("canvasArea.canvas.width - 650", "100", 460, 0, 200, 1, "Platform Height", MapEditor.loadedMap ? MapEditor.loadedMap.style.platformHeight : 0, function() { 
            MapEditor.loadedMap.style.platformHeight = this.value
            PreviewWindow.update()
        })

        btn_wallHeightSlider = new SliderUI("canvasArea.canvas.width - 650", "200", 460, 0, 200, 1, "Wall Height", MapEditor.loadedMap ? MapEditor.loadedMap.style.wallHeight : 0, function() { 
            MapEditor.loadedMap.style.wallHeight = this.value
            PreviewWindow.update()
        })

        btn_lightDirectionSlider = new SliderUI("canvasArea.canvas.width - 650", "300", 460, 0, 360, 1, "Light Direction", MapEditor.loadedMap ? MapEditor.loadedMap.style.lightDirection : 0, function() { 
            MapEditor.loadedMap.style.lightDirection = this.value
            PreviewWindow.update()
        })

        btn_lightPitchSlider = new SliderUI("canvasArea.canvas.width - 660", "400", 460, 0, 85, 1, "Light Pitch", MapEditor.loadedMap ? MapEditor.loadedMap.style.lightPitch : 0, function() { 
            MapEditor.loadedMap.style.lightPitch = this.value
            PreviewWindow.update()
        })



        // COLOR PICKER BUTTONS AND SLIDERS
        btn_setFromHex = new Button("ColorPicker.x + 160", "ColorPicker.y + 25", 130, "", "", 0, "Use Hex #", function() {
            ColorPicker.setFromHex()
        })

        btn_hueSlider = new SliderUI("ColorPicker.x", "ColorPicker.y + 130", 300, 0, 360, 1, "Hue", ColorPicker.h, function() { 
            ColorPicker.h = this.value
            ColorPicker.start()
        })

        btn_saturationSlider = new SliderUI("ColorPicker.x", "ColorPicker.y + 200", 300, 0, 100, 1, "Saturation", ColorPicker.s, function() { 
            ColorPicker.s = this.value
            ColorPicker.start()
        })

        btn_lightnessSlider = new SliderUI("ColorPicker.x", "ColorPicker.y + 270", 300, 0, 100, 1, "Lightness", ColorPicker.l, function() { 
            ColorPicker.l = this.value
            ColorPicker.start()
        })

        btn_alphaSlider = new SliderUI("ColorPicker.x", "ColorPicker.y + 340", 300, 0, 1, 100, "Alpha", ColorPicker.a, function() { 
            ColorPicker.a = this.value
            ColorPicker.start()
        })



        // SET COLOR BUTTONS
        btn_backgroundColor = new Button("canvasArea.canvas.width - 410", "20", 175, "", "", 0, "Background", function() {
            canvasArea.canvas.style.backgroundColor = MapEditor.loadedMap.style.backgroundColor = ColorPicker.getColor()
            UserInterface.determineButtonColor()
            PreviewWindow.update()
        })

        btn_playerColor = new Button("canvasArea.canvas.width - 225", "20", 175, "", "", 0, "Player", function() {
            MapEditor.loadedMap.style.playerColor = ColorPicker.getColor()
            PreviewWindow.update()
        })

        btn_platformTopColor = new Button("canvasArea.canvas.width - 410", "120", 175, "", "", 0, "Platform Top", function() {
            MapEditor.loadedMap.style.platformTopColor = ColorPicker.getColor()
            PreviewWindow.update()
        })

        btn_platformSideColor = new Button("canvasArea.canvas.width - 225", "120", 175, "", "", 0, "Platform Side", function() {
            MapEditor.loadedMap.style.platformSideColor = ColorPicker.getColor()
            PreviewWindow.update()
        })

        btn_wallTopColor = new Button("canvasArea.canvas.width - 410", "220", 175, "", "", 0, "Wall Top", function() {
            MapEditor.loadedMap.style.wallTopColor = ColorPicker.getColor()
            PreviewWindow.update()
        })

        btn_wallSideColor = new Button("canvasArea.canvas.width - 225", "220", 175, "", "", 0, "Wall Side", function() {
            MapEditor.loadedMap.style.wallSideColor = ColorPicker.getColor()
            PreviewWindow.update()
        })

        btn_endZoneTopColor = new Button("canvasArea.canvas.width - 410", "320", 175, "", "", 0, "End Zone Top", function() {
            MapEditor.loadedMap.style.endZoneTopColor = ColorPicker.getColor()
            PreviewWindow.update()
        })

        btn_endZoneSideColor = new Button("canvasArea.canvas.width - 225", "320", 175, "", "", 0, "End Zone Side", function() {
            MapEditor.loadedMap.style.endZoneSideColor = ColorPicker.getColor()
            PreviewWindow.update()
        })

        btn_directLightColor = new Button("canvasArea.canvas.width - 410", "420", 175, "", "", 0, "Direct Light", function() {
            MapEditor.loadedMap.style.directLight = ColorPicker.getColor()
            PreviewWindow.update()
        })

        btn_ambientLightColor = new Button("canvasArea.canvas.width - 225", "420", 175, "", "", 0, "Ambient Light", function() {
            MapEditor.loadedMap.style.ambientLight = ColorPicker.getColor()
            PreviewWindow.update()
        })


        

        // MAP BROWSER BUTTONS
        btn_custom_maps = new Button(50, "canvasArea.canvas.height - 150", 175, "custom_maps_button", "", 0, "", function() { 
            UserInterface.gamestate = 2;
            
            // loop through each button (including non-maps eww) and untoggle it. Could be an issue once I add a "play tutorial" toggle / button idk
            UserInterface.renderedButtons.forEach(button => {
                if (button.toggle == 1 && button != btn_playTutorial) {button.toggle = 0}
            })
            
            UserInterface.renderedButtons = UserInterface.btnGroup_customMapBrowser
            MapBrowser.state = 2
            MapBrowser.init()
        })

        btn_playMap = new Button("canvasArea.canvas.width - 300", "canvasArea.canvas.height - 150", 200, "play_button", "", 0, "", function() {
            
            MapBrowser.toggleAllButtons()
            MapBrowser.scrollY = 0;
            MapBrowser.scrollVel = 0;
            
            UserInterface.gamestate = 5;
            UserInterface.renderedButtons = [btn_mainMenu];

            if (MapBrowser.state == 1) { // in normal maps browser

                Map.initMap(MapBrowser.selectedMapIndex);

            } else { // in custom maps browser

                Map.initCustomMap(MapBrowser.selectedMapIndex);
         
            }
        })

        btn_editMap = new Button("canvasArea.canvas.width - 300", "canvasArea.canvas.height - 110", 200, "", "", 0, "Edit Map", async function() {
                    
            // delete shareDiv when leaving browser page
            document.getElementById("shareDiv").remove()

            MapBrowser.toggleAllButtons()
            MapBrowser.scrollVel = 0;
            MapBrowser.scrollY = 0;

            const mapDataRaw = await UserInterface.readFile(MapBrowser.selectedMapIndex + ".json", "maps")
            
            MapEditor.loadedMap = JSON.parse(mapDataRaw)
            UserInterface.gamestate = 7;

        })
        
        btn_deleteMap = new Button("canvasArea.canvas.width - 300", "canvasArea.canvas.height - 200", 200, "", "", 0, "Delete Map", function() {

            const deleteMap = confirm("Delete Map?");
            if (deleteMap) {

                window.resolveLocalFileSystemURL(cordova.file.dataDirectory + "maps", (fileSystem) => {
                    var reader = fileSystem.createReader();
                    reader.readEntries((entries) => {
                        fileSystem.getFile(MapBrowser.selectedMapIndex + ".json", {create: false}, (fileEntry) => {
                            fileEntry.remove((file) => {
                                alert("Map Deleted");
                                // delete shareDiv (its created again by btn_load_map)
                                document.getElementById("shareDiv").remove()

                                // reload browser by pressing btn_load_map again
                                btn_load_map.released(true)
                            }, function (error) {
                                alert("error occurred: " + error.code);
                            }, function () {
                                alert("file does not exist");
                            });
                        });
                    });
                });                                
            }
        })

        btn_shareMap = new Button("canvasArea.canvas.width - 300", "canvasArea.canvas.height - 290", 200, "", "", 0, "Share Map", function(createDiv) {
            // The shareDiv does all the work for this button.
            // createDiv is called by btn_load_map
            // shareDiv is removed by btn_mainMenu, btn_editMap and btn_deleteMap

            
            if (createDiv) { // called with this tag by btn_load_map
                const shareDiv = document.createElement('div');
                shareDiv.setAttribute("id", "shareDiv");
                shareDiv.style.cssText = `
                    position: absolute; 
                    left: ${btn_shareMap.x / canvasArea.scale}px;
                    top: ${btn_shareMap.y / canvasArea.scale}px;
                    width: ${btn_shareMap.width / canvasArea.scale}px;
                    height: ${btn_shareMap.height / canvasArea.scale}px;
                    // border: solid 2px blue;
                `

                shareDiv.addEventListener("click", async () => {
                    
                    const mapDataRaw = await UserInterface.readFile(MapBrowser.selectedMapIndex + ".json", "maps")
                    
                    const share_data = {
                        title: MapBrowser.selectedMapIndex, // doesnt do anything on IOS
                        text: mapDataRaw,
                    }
                    
                    try {
                        await navigator.share(share_data);
                    } catch (err) {
                        console.log(err)
                    }

                });

                document.body.appendChild(shareDiv);

            }            

        })



        // LEVEL BUTTONS
        btn_level_awakening = new Button(300, 50, 280, "", "", 0, "Awakening", function() {
            if (this.toggle) {
                this.toggle = 0;
                MapBrowser.selectedMapIndex = -1
            } else {
                MapBrowser.toggleAllButtons()
                this.toggle = 1;
                MapBrowser.selectedMapIndex = "Awakening"
                if (UserInterface.settings.playTutorial) {Tutorial.isActive = true}
            }
        })

        btn_level_pitfall = new Button(300, 150, 280, "", "", 0, "Pitfall", function() {
            if (this.toggle) {
                this.toggle = 0;
                MapBrowser.selectedMapIndex = -1
            } else {
                MapBrowser.toggleAllButtons()
                this.toggle = 1;
                MapBrowser.selectedMapIndex = "original"
            }
        })

        btn_level_below = new Button(300, 250, 280, "", "", 0, "Below", function() {
            if (this.toggle) {
                this.toggle = 0;
                MapBrowser.selectedMapIndex = -1
            } else {
                MapBrowser.toggleAllButtons()
                this.toggle = 1;
                MapBrowser.selectedMapIndex = "hellscape"
            }
        })

        btn_level_turmoil = new Button(300, 350, 280, "", "", 0, "Turmoil", function() {
            if (this.toggle) {
                this.toggle = 0;
                MapBrowser.selectedMapIndex = -1
            } else {
                MapBrowser.toggleAllButtons()
                this.toggle = 1;
                MapBrowser.selectedMapIndex = "noob"
            }
        })



        // IN LEVEL Buttons
        btn_mainMenu = new Button(50, 50, 100, "x_button", "", 0, "", function() { 
            
            // UserInterface.gamestate
            // 1: main menu
            // 2: level select (MapBrowser)
            // 3: settings
            // 4: store
            // 5: loading map page
            // 6: in level
            // 7: in map editor

            // UserInterface.levelState
            // 1 = pre-start
            // 2 = playing level
            // 3 = in endzone
    
            // MapEditor.editorState
            // 0 = map new/import/load screen. mapeditor's main menu
            // 1 = main map edit screen
            // 2 = platform edit menu
            // 3 = map color page
            // 4 = map settings page
            // 5 = MapEditor MapBrowser screen

            // MapBrowser.state
            // 0 = disabled
            // 1 = standard map browser
            // 2 = custom map browser

            if (UserInterface.gamestate == 2) { // in MapBrowser
                if (MapEditor.editorState == 5) { // in MapEditor's MapBrowser

                    // goto MapEditor's main menu
                    MapBrowser.state = 0;
                    MapBrowser.scrollY = 0;
                    MapBrowser.selectedMapIndex = -1;

                    UserInterface.gamestate = 7;
                    MapEditor.editorState = 0;
                    UserInterface.renderedButtons = UserInterface.btnGroup_mapEditorMenu
    
                    document.getElementById("shareDiv").remove()
    
                    return
                }

                if (MapBrowser.state == 1) { // in play standard map browser
                    // goto main menu
                    MapBrowser.state = 0;
                    MapBrowser.scrollY = 0;
                    MapBrowser.selectedMapIndex = -1;
                    UserInterface.gamestate = 1
                    // loop through each button (including non-maps eww) and untoggle it
                    UserInterface.renderedButtons.forEach(button => {
                        if (button.toggle == 1 && button != btn_playTutorial) {button.toggle = 0}
                    })    
                    UserInterface.renderedButtons = UserInterface.btnGroup_mainMenu;
                    return
                }

                if (MapBrowser.state == 2) { // in play custom map browser
                    // goto play standard map browser
                    MapBrowser.state = 1;
                    UserInterface.renderedButtons = UserInterface.btnGroup_standardMapBrowser
                    MapBrowser.init();
                    return
                }
            }

            if (UserInterface.gamestate == 3) { // in Settings page
                // goto main menu
                UserInterface.gamestate = 1
                UserInterface.renderedButtons = UserInterface.btnGroup_mainMenu;
                return
            }

            if (UserInterface.gamestate == 5) { // in Loading Map page
                // goto standard map browser
                UserInterface.gamestate = 2;
                MapBrowser.state = 1;
                UserInterface.renderedButtons = UserInterface.btnGroup_standardMapBrowser;
                MapBrowser.init();
                return
            }

            if (UserInterface.gamestate == 6) { // in Map
                // goto standard map browser
                UserInterface.timer = 0;
                UserInterface.levelState = 1;
                player = null; // needed?

                UserInterface.gamestate = 2;
                MapBrowser.state = 1;
                UserInterface.renderedButtons = UserInterface.btnGroup_standardMapBrowser;
                MapBrowser.init();


                if (Tutorial.isActive) { // leaving tutorial level
                    if (Tutorial.state >= 18) {
                        btn_playTutorial.released(true) // toggle tutorial button to be false after completing it
                    }

                    Tutorial.reset()
                }

                return
            }
            
            if (UserInterface.gamestate == 7) { // in MapEditor
                
                if (MapEditor.editorState == 0) { // MapEditor main menu
                    // goto main menu
                    UserInterface.gamestate = 1;
                    UserInterface.renderedButtons = UserInterface.btnGroup_mainMenu;
                    return
                }

                if (MapEditor.editorState == 3 || MapEditor.editorState == 4) { // in map settings or map color pages 
                    // goto MapEditor main edit screen
                    UserInterface.renderedButtons = UserInterface.btnGroup_mapEditorInterface
                    MapEditor.editorState = 1;
                    return
                }
            }
            

        })

        btn_restart = new Button(50, "canvasArea.canvas.height - 280", 100, "restart_button", "", 0, "", function() { 
            
            if (Tutorial.isActive) { // restart pressed in tutorial level
                // DRAW ALERT "Restart Disabled"
            } else {
                UserInterface.timer = 0;
                UserInterface.levelState = 1;
                player.checkpointIndex = -1;
                player.restart();
            }
        })

        btn_jump = new Button(50, "canvasArea.canvas.height - 150", 100, "jump_button", "", 0, "", function() { 
            if (UserInterface.levelState == 1) {
                UserInterface.timerStart = Date.now();
                UserInterface.levelState = 2;
                player.startLevel();
            }
        })


        // TUTORIAL BUTTONS
        btn_next = new Button("canvasArea.canvas.width - 130", 50, 80, "next_button", "", 0, "", function() { 
            
            Tutorial.timerStarted = false; // easier to always set these here even if they arent always needed
            Tutorial.animatePos = 0;
            Tutorial.animateVel = 0;

            // reset the position and scale because the button is being pulse animated
            this.x = "canvasArea.canvas.width - 130"
            this.y = 50
            this.width = 80
            this.height = 80

            if (Tutorial.state == 1) {
                Tutorial.state ++;
                UserInterface.renderedButtons = [btn_mainMenu, btn_next]
                return
            }

            if (Tutorial.state == 2) {
                Tutorial.state ++; // going into STATE 3
                UserInterface.renderedButtons = [btn_mainMenu]

                player.lookAngle.set(0,-1) // so that ur NOT already looking at a target
                //player.lookAngle.set(1,0) // so that player is already looking at a target
                //player.lookAngle = player.lookAngle.rotate(240)
                return
            }

            // state 3 progresses to 5 when all targets are completed

            // state 5 uses jump button to progress

            // state 6 progresses to 7 automatically after 2 secs

            if (Tutorial.state == 7) {
                Tutorial.state ++; // going into STATE 8
                UserInterface.renderedButtons = UserInterface.btnGroup_inLevel
                return
            }

            // 8 to 9 on user swipe

            // 9 to 10 on checkpoint

            // 10 to 11 on user swipe
            
            // 11 to 12 on checkpoint

            // 12 to 13 on user swipe

            // 13 to 14 on checkpoint

            // 14 to 15 on user swipe

            // 15 to 16 on checkpoint

            // 16 to 17 on user swipe

            // 17 to 18 on level end

            if (Tutorial.state == 18) {
                Tutorial.state ++; // going into STATE 19
                UserInterface.renderedButtons = UserInterface.btnGroup_inLevel
                return
            }

        })

        btn_playTutorial = new Button("canvasArea.canvas.width - 450", "canvasArea.canvas.height - 120", 80, "toggle_button", "toggle_button_pressed", 1, "", function(sync) { 
            if (sync) {
                this.toggle = UserInterface.settings.playTutorial;
            } else {
                console.log("PLAY TUT TOGGLED")
                if (this.toggle == 1) {
                    this.toggle = 0;
                    Tutorial.isActive = false
                    UserInterface.settings.playTutorial = 0
                    UserInterface.writeSettings()
                } else {
                    this.toggle = 1;
                    Tutorial.isActive = true
                    UserInterface.settings.playTutorial = 1
                    UserInterface.writeSettings()
                }
            }
        })

        // GROUPS OF BUTTONS TO RENDER ON DIFFERENT PAGES
        this.btnGroup_mainMenu = [btn_play, btn_settings, btn_mapEditor]
        this.btnGroup_settings = [btn_mainMenu, btn_sensitivitySlider, btn_volumeSlider, btn_debugText, btn_strafeHUD, btn_reset_settings]
        this.btnGroup_standardMapBrowser = [
            btn_mainMenu, 
            btn_custom_maps,
            btn_level_awakening,
            btn_level_pitfall,
            btn_level_below,
            btn_level_turmoil,
        ]
        this.btnGroup_customMapBrowser = [btn_mainMenu]
        this.btnGroup_editMapBrowser = [btn_mainMenu]
        this.btnGroup_mapEditorMenu = [btn_mainMenu, btn_new_map, btn_load_map, btn_import_map, btn_import_map_text]
        this.btnGroup_mapEditorInterface = [btn_exit_edit, btn_add_platform, btn_map_colors, btn_map_settings, btn_add_checkpoint, btn_multiSelect, btn_snappingSlider]
        this.btnGroup_inLevel = [btn_mainMenu, btn_restart, btn_jump];
        this.btnGroup_mapColor = [
            btn_mainMenu, 
            btn_setFromHex,
            btn_hueSlider, 
            btn_saturationSlider, 
            btn_lightnessSlider, 
            btn_alphaSlider, 
            
            btn_backgroundColor,
            btn_playerColor,
            btn_platformTopColor,
            btn_platformSideColor,
            btn_wallTopColor,
            btn_wallSideColor,
            btn_endZoneTopColor,
            btn_endZoneSideColor,
            btn_directLightColor,
            btn_ambientLightColor,
        ];
        this.btnGroup_mapSettings = [
            btn_mainMenu, 
            btn_platformHeightSlider,
            btn_wallHeightSlider,
            btn_lightDirectionSlider,
            btn_lightPitchSlider
        ];
        this.btnGroup_editPlatform = [
            btn_exit_edit,
            btn_unselect,
            
            btn_translate,
            btn_resize,
            btn_angleSlider,
            btn_wall,

            btn_delete_platform,
            btn_duplicate_platform,
            btn_multiSelect,
            btn_snappingSlider
        ]
        this.btnGroup_editPlayerStart = [
            btn_exit_edit, 
            btn_unselect, 
            
            btn_translate,
            btn_playerAngleSlider,
            btn_multiSelect,
            btn_snappingSlider
        ]
        this.btnGroup_editCheckPoint = [
            btn_exit_edit,
            btn_unselect,
            
            btn_translate,
            btn_checkpointAngleSlider,

            btn_delete_platform,
            btn_multiSelect,
            btn_snappingSlider
        ]
        this.btnGroup_editMultiSelect = [
            btn_exit_edit, 
            btn_unselect, 

            btn_delete_platform,
            btn_duplicate_platform,
            btn_translate,
            btn_multiSelect,
            btn_snappingSlider
        ]


        this.renderedButtons = this.btnGroup_mainMenu; 
    },

    update : function() {
        
        if (this.gamestate == 3 || MapEditor.loadedMap) { // in settings page or in map editor pages
            this.renderedButtons.forEach(button => { // LOOP RENDERED BUTTONS
                if (button.constructor.name == "SliderUI") { // run .update() for only Sliders
                    button.update();
                }
            });
        }

        if (this.levelState == 2) {
            if (Tutorial.pausePlayer == true) {
                
                // Date.now() - this.timerStart) - this.timer = time to add to this.timerStart
                // Date.now() - this.timer = this.timerStart

                this.timerStart += Date.now() - this.timer - this.timerStart

            } else {
                this.timer = Date.now() - this.timerStart;
            }
        }
    },

    mapLoaded : function() { // called at the end of Map.parseMapData()
        UserInterface.gamestate = 6;
        UserInterface.renderedButtons = this.btnGroup_inLevel;
    },

    readFile: function(fileName, subDirectory = "") { // returns a promise that resolves to raw, unparsed (json usually)
        return new Promise((resolve, reject) => {
            // Resolve dataDirectory URL
            window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function(dataDirectoryEntry) {
                if (subDirectory !== "") {
                    // Access given subDirectory in dataDirectory
                    dataDirectoryEntry.getDirectory(subDirectory, { create: false }, function(subDirectoryEntry) {
                        readFileAsText(subDirectoryEntry);
                    }, function(error) {
                        reject("Failed to get subDirectory: " + error.code);
                    });
                } else {
                    // Read from main dataDirectory
                    readFileAsText(dataDirectoryEntry);
                }
            }, function(error) {
                reject("Failed to resolve dataDirectory: " + error.code);
            });
    
            // Function to read file as text
            function readFileAsText(directoryEntry) {
                directoryEntry.getFile(fileName, { create: false }, function(fileEntry) {
                    fileEntry.file(function(file) {
                        const reader = new FileReader();
                        reader.onloadend = function() {
                            console.log("Successfully read file: " + fileName);
                            resolve(this.result);
                        };
                        reader.onerror = function() {
                            reject("Failed to read file: " + fileName);
                        };
                        reader.readAsText(file);
                    }, function(error) {
                        reject("Failed to get fileEntry.file: " + error.code);
                    });
                }, function(error) {


                    // Its not able to find the custom maps in the /maps directory for some reason



                    console.log(directoryEntry)
                    console.log("fileName " + fileName)
                    reject("Failed to getFile: " + error.code);
                });
            }
        });
    },    

    writeFile : function(fileName, blobData, subDirectory = "") { // returns a promise
        // fileName is a string with file extension EX: settings.json
        // blobData = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
        // subDirectory is a string. no need for first \ EX: maps\bad_maps OR just customMaps

        return new Promise((resolve, reject) => {

            // DEAL WITH OPTIONAL subDirectory
            window.resolveLocalFileSystemURL(cordova.file.dataDirectory, (dataDirectoryEntry) => {
                if (subDirectory !== "") {
                    // Create or access given subDirectory in dataDirectory
                    dataDirectoryEntry.getDirectory(subDirectory, {create : true}, subDirectoryEntry => {
                        saveFile(subDirectoryEntry);
                    }, (error) => { reject("Failed to resolve subDirectory on writeFile. ERROR CODE: " + error.code)}
                    );
                } else {
                    // save to straight to main dataDirectory
                    saveFile(dataDirectoryEntry)
                }
            }, (error) => { reject("Failed to resolve dataDirectory on writeFile. ERROR CODE: " + error.code)}
            );

            // ACTUALLY WRITE blobData TO FILE
            function saveFile(directoryEntry) {
                // Create or acces the file
                directoryEntry.getFile(fileName, {create : true, exclusive : false}, (fileEntry) => {
                    // Write to file
                    fileEntry.createWriter( (fileWriter) => {
                        fileWriter.onwriteend = function() {
                            console.log("successfully wrote file: " + fileName)
                            resolve()
                        };

                        fileWriter.onerror = (error) => {
                            reject("Failed to write file: " + fileName + "Error Code: " + error.code);
                        };

                        fileWriter.write(blobData);
                    }, (error) => { reject("Failed to createWriter: " + error.code) }
                    )
                }, (error) => { reject("Failed to getFile: " + error.code) })
            }      
        });
    },

    getLeaderboards : function() {
            
        // GET leaderboards DIRECTLY THROUGH CORDOVA LOCAL STORAGE (www)       
        const assetsURL = cordova.file.applicationDirectory + "www/assets/"
        
        window.resolveLocalFileSystemURL(assetsURL, (dirEntry) => {

            dirEntry.getFile("leaderboards.json", {create: false, exclusive: false}, (fileEntry) => {

                fileEntry.file( (file) => {

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        console.log("successfully read leaderboards.json")
                        this.leaderboards = JSON.parse(e.target.result)
                    };
                    reader.onerror = (e) => alert(e.target.error.name);
        
                    reader.readAsText(file)
                })
            })
        })
    },

    getSettings: async function() {
        try {
            const settingsData = await this.readFile("settings.json");
            this.settings = JSON.parse(settingsData);

            // readFile completes after initiating buttons so need to sync them
            btn_sensitivitySlider.updateState(UserInterface.settings.sensitivity)
            btn_volumeSlider.updateState(UserInterface.settings.volume)
            btn_debugText.func(true)
            btn_strafeHUD.func(true)
            btn_playTutorial.func(true)

            AudioHandler.setVolumes();
        
        } catch (error) {
            if (error == "Failed to getFile: 1") { // file doesnt exist
                
                // If settings file doesn't exist or is empty, initialize default settings
                this.settings = {
                    "sensitivity": 0.5,
                    "volume": 0.1,
                    "debugText": 0,
                    "strafeHUD": 1,
                    "playTutorial": 1
                };

                this.writeSettings(); // Write the default settings to file

                // readFile completes after initiating buttons so need to sync them
                btn_sensitivitySlider.updateState(UserInterface.settings.sensitivity)
                btn_volumeSlider.updateState(UserInterface.settings.volume)
                btn_debugText.func(true)
                btn_strafeHUD.func(true)
                btn_playTutorial.func(true)
                AudioHandler.setVolumes();

            } else {
                console.error("Error while getting settings:", error);   
            }
        }
    },

    writeSettings : function () {
        const settingsBlob = new Blob([JSON.stringify(this.settings, null, 2)], { type: "application/json" });
        this.writeFile("settings.json", settingsBlob)
    },

    getRecords: async function() {
        try {

            const recordsData = await this.readFile("records.json");    
            this.records = JSON.parse(recordsData);

        } catch (error) { 
            if (error == "Failed to getFile: 1") { // file doesnt exist

                // records.json doesn't exist , initialize empty records file
                this.records = {
                    "unlocked": 1
                };
                this.writeRecords(); // Write the default empty records to file

            } else {
                console.error("Error while getting records:", error);
            }
        }
    },

    writeRecords : function () {
        const recordsBlob = new Blob([JSON.stringify(this.records, null, 2)], { type: "application/json" });
        this.writeFile("records.json", recordsBlob)
    },

    handleRecord: function () {
        const record = this.records[Map.name]

        if (record == null || (record !== null && this.timer < record)) {
            this.previousRecord = (record == null) ? 0 : this.records[Map.name] // save previous record
            this.records[Map.name] = this.timer
            this.writeRecords()
        }

    },

    checkCustomMapsDirectoryExists: function () {

        window.resolveLocalFileSystemURL(cordova.file.dataDirectory + "maps", function (dirEntry) {
            // Directory exists, you can now use dirEntry
            console.log("Custom maps directory exists:", dirEntry);
        }, function (err) {
            // Directory doesn't exist, attempt to create it
            console.error("Custom maps directory does NOT exist:", err);

            // Create the directory
            window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dirEntry) {
                dirEntry.getDirectory("maps", { create: true }, function (newDirEntry) {
                    console.log("Created maps directory:", newDirEntry);
                }, function (err) {
                    console.error("Error creating maps directory:", err);
                });
            }, function (err) {
                console.error("Error resolving data directory for creating /maps:", err);
            });
        });
    },

    determineButtonColor : function() {
        let bgColor = canvasArea.canvas.style.backgroundColor // returns rgba string
        
        bgColor = bgColor.replace(/[^\d,.]/g, '').split(',')
        
        const luminance = (0.299 * bgColor[0] + 0.587 * bgColor[1] + 0.114 * bgColor[2])/255
        // luminance = (0.299 * R + 0.587 * G + 0.114 * B)/255
        // console.log("luminance: " + luminance)

        this.darkMode = (luminance > 0.8) ? true : false;

    },

    secondsToMinutes: function(milliseconds) {
        const seconds = milliseconds / 1000;
        const minutes = Math.floor(seconds / 60);
        let extraSeconds = seconds % 60;
    
        // Format extraSeconds with three decimal points
        extraSeconds = extraSeconds.toFixed(3);
    
        // Pad extraSeconds with zeros if needed
        extraSeconds = extraSeconds.padStart(6, "0");
    
        return minutes + ":" + extraSeconds;
    },

    drawMedal: function(x, y, radius, fillColor, strokeColor, strokeWidth, shadow) {
        canvasArea.ctx.save() // save 3a           
        canvasArea.ctx.fillStyle = fillColor
        canvasArea.ctx.strokeStyle = strokeColor
        canvasArea.ctx.lineWidth = strokeWidth
        
        if (shadow) {
            canvasArea.ctx.save(); // save 3.1
            canvasArea.ctx.shadowColor = "rgba(0, 0, 0, 0.21)"; 
            canvasArea.ctx.shadowOffsetX = 4
            canvasArea.ctx.shadowOffsetY = 4
            canvasArea.ctx.beginPath()
            canvasArea.ctx.arc(x, y, radius + strokeWidth/2, 0, 2 * Math.PI); // (x, y, radius, startAngle, endAngle) strokeWidth/2 bc it pokes out otherwise... not sure why
            canvasArea.ctx.closePath()

            canvasArea.ctx.fill()
            canvasArea.ctx.restore() // save 3.1
        }
        

        canvasArea.ctx.beginPath()
        canvasArea.ctx.arc(x, y, radius, 0, 2 * Math.PI); // (x, y, radius, startAngle, endAngle)
        
        canvasArea.ctx.fill()
        canvasArea.ctx.stroke()
        canvasArea.ctx.restore() // save 3a
    },

    getOrdinalSuffix: function (i) { // turns 1 into 1st, 2 into 2nd
        let j = i % 10,
            k = i % 100;
        if (j === 1 && k !== 11) {
            return i + "st";
        }
        if (j === 2 && k !== 12) {
            return i + "nd";
        }
        if (j === 3 && k !== 13) {
            return i + "rd";
        }
        return i + "th";
    },

    truncateText : function(text, clampToWidth) {
        if (canvasArea.ctx.measureText(text).width > clampToWidth) {
            while (canvasArea.ctx.measureText(text + "...").width > clampToWidth || text.endsWith(" ")) { // also removes end char if its a space
                text = text.slice(0, -1) // slice off last character
            }
            return text + "..."
        } else {
            return text
        }
    },

    arraysAreEqual : function(a, b) {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length !== b.length) return false;
    
        for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
        }
        return true;
    },

    touchStarted : function(x,y) { // TRIGGERED BY InputHandler
        
        this.renderedButtons.forEach(button => {
            if (button.constructor.name == "Button") { // only run on buttons not sliders
                if ( // if x and y touch is within button
                    x >= button.x && x <= button.x + button.width &&
                    y >= button.y && y <= button.y + button.height
                ) {
                    button.pressed();
                }
            }
        });


        this.renderedButtons.forEach(slider => {
            if (slider.constructor.name == "SliderUI") { // only run on sliders
                if ( // if x and y touch is near slider handle
                    Math.abs(x - slider.sliderX) < 30 && 
                    Math.abs(y - slider.y) < 30 
                ) {
                    slider.confirmed = false
                }
            }
        });
    },
    
    touchReleased : function(x,y) { // TRIGGERED BY InputHandler
        
        // run button functions if clicked
        // if in mapEditor
        // was draggin,panning,and zooming the screen -- skip over all this \/
        // touched side panel
        // touched playerStart
        // touched platforms
        // touched the background

        let editorIgnoreRelease = false;

        this.renderedButtons.forEach(button => {
            if (button.constructor.name == "Button") { // only run on buttons not sliders
                if ( // if x and y touch is within button
                    x >= button.x && x <= button.x + button.width &&
                    y >= button.y && y <= button.y + button.height &&
                    (MapBrowser.scrollVel == 0 || MapBrowser.scrollAmount == null) // dont release if scrolling through MapBrowser BROWSER
                ) {
                    editorIgnoreRelease = true;
                    button.released();
                }
                button.isPressed = false
            }
        });


        if (UserInterface.gamestate == 7 && (MapEditor.editorState == 1 || MapEditor.editorState == 2)) { // if in MapEditors main edit screens 

            if (Math.abs(MapEditor.scrollVelX) < 0.5 && Math.abs(MapEditor.scrollVelY) < 0.5) { // if not scrolling/panning
                
                // if released within the edit platform side panel
                // needs to be matched with MapEditor.render() values
                //     x : canvasArea.canvas.width - 280,
                //     y : 20,
                //     width : 225,
                //     height : 320

                if (
                    MapEditor.editorState == 2 &&
                    x >= canvasArea.canvas.width - 280 && 
                    x <= canvasArea.canvas.width - 280 + 225 &&
                    y >= 20 && 
                    y <= 20 + 320
                ) {
                    editorIgnoreRelease = true;
                }

                if (editorIgnoreRelease == false) {

                    // Maps the screens touch to the map's zoomed and panned view
                    // mapToRange(number, inMin, inMax, outMin, outMax)
                    const touchXMapped = canvasArea.mapToRange(x, 0, canvasArea.canvas.width, MapEditor.screen.cornerX, MapEditor.screen.cornerX + MapEditor.screen.width)
                    const touchYMapped = canvasArea.mapToRange(y, 0, canvasArea.canvas.height, MapEditor.screen.cornerY, MapEditor.screen.cornerY + MapEditor.screen.height)

                    function isPointInRect(pointX, pointY, rect) {
                        // Convert angle from degrees to radians
                        const angleRad = rect.angle * Math.PI / 180;
                    
                        // Calculate the sine and cosine of the angle
                        const cosAngle = Math.cos(angleRad);
                        const sinAngle = Math.sin(angleRad);
                    
                        // Translate point to rectangle's coordinate system (centered at origin)
                        const translatedX = pointX - rect.x;
                        const translatedY = pointY - rect.y;
                    
                        // Rotate point to align with the rectangle (reverse rotation)
                        const rotatedX = cosAngle * translatedX + sinAngle * translatedY;
                        const rotatedY = -sinAngle * translatedX + cosAngle * translatedY;
                    
                        // Check if the rotated point is within the axis-aligned rectangle
                        const halfWidth = rect.width / 2;
                        const halfHeight = rect.height / 2;
                    
                        const isInside = (Math.abs(rotatedX) <= halfWidth) && (Math.abs(rotatedY) <= halfHeight);
                    
                        return isInside;
                    }


                    // TEST IF CLICKED ON PLAYERSTART, OR CHECKPOINT, OR PLATFORM
                    let hitPlayerStart = false;
                    let hitCheckPoint = false;
                    let hitPlatform = false;

                    const playerStartRect = {
                        x: MapEditor.loadedMap.playerStart.x,
                        y: MapEditor.loadedMap.playerStart.y,
                        width: 32,
                        height: 32,
                        angle: MapEditor.loadedMap.playerStart.angle,
                    }

                    if ( // RELEASED ON playerStart
                        isPointInRect(touchXMapped, touchYMapped, playerStartRect)
                    ) { 
                        if (MapEditor.selectedElements.includes("playerStart")) {
                            // toggle playerStart off
                            const indexOfPlayerStart = MapEditor.selectedElements.indexOf("playerStart")
                            MapEditor.selectedElements.splice(indexOfPlayerStart, 1)
                        } else {
                            // toggle playerStart on
                            MapEditor.selectedElements = MapEditor.multiSelect ? MapEditor.selectedElements.concat("playerStart") : ["playerStart"]
                        }

                        hitPlayerStart = true
                    }


                    
                    // RELEASED ON CHECKPOINT
                    if (!hitPlayerStart) {
                        MapEditor.loadedMap.checkpoints.forEach(checkpoint => {
                            const checkpointIndex = MapEditor.loadedMap.checkpoints.indexOf(checkpoint)
    
                            if ( // released checkpoint trigger 1
                                Math.abs(checkpoint.triggerX1 - touchXMapped) <= 20 &&
                                Math.abs(checkpoint.triggerY1 - touchYMapped) <= 20
                            ) {
                                if (MapEditor.selectedElements.some((element) => this.arraysAreEqual(element,[checkpointIndex,1]))) {                              
                                    // toggle trigger1 off
                                    const indexOfSelectionItem = MapEditor.selectedElements.findIndex(element => this.arraysAreEqual(element,[checkpointIndex,1]))
                                    MapEditor.selectedElements.splice(indexOfSelectionItem, 1)
                                } else {
                                    // toggle trigger1 on
                                    MapEditor.selectedElements = MapEditor.multiSelect ? MapEditor.selectedElements.concat([new Array(MapEditor.loadedMap.checkpoints.indexOf(checkpoint),1)]) : [new Array(MapEditor.loadedMap.checkpoints.indexOf(checkpoint),1)]
                                }
                                
                                hitCheckPoint = true
                            }
    
                            if ( // released on checkpoint trigger 2
                                Math.abs(checkpoint.triggerX2 - touchXMapped) <= 20 &&
                                Math.abs(checkpoint.triggerY2 - touchYMapped) <= 20
                            ) {
                                if (MapEditor.selectedElements.some((element) => this.arraysAreEqual(element,[checkpointIndex,2]))) {
                                    // toggle trigger2 off
                                    const indexOfSelectionItem = MapEditor.selectedElements.findIndex(element => this.arraysAreEqual(element,[checkpointIndex,2]))
                                    MapEditor.selectedElements.splice(indexOfSelectionItem, 1)
                                } else {
                                    // toggle trigger2 on
                                    MapEditor.selectedElements = MapEditor.multiSelect ? MapEditor.selectedElements.concat([new Array(MapEditor.loadedMap.checkpoints.indexOf(checkpoint),2)]) : [new Array(MapEditor.loadedMap.checkpoints.indexOf(checkpoint),2)]
                                }
    
                                hitCheckPoint = true
                            }
                            
                            if ( // released on playerRestart
                                Math.abs(checkpoint.x - touchXMapped) <= 20 &&
                                Math.abs(checkpoint.y - touchYMapped) <= 20
                            ) {
                                if (MapEditor.selectedElements.some((element) => this.arraysAreEqual(element,[checkpointIndex,3]))) {
                                    // toggle platerRestart off
                                    const indexOfSelectionItem = MapEditor.selectedElements.findIndex(element => this.arraysAreEqual(element,[checkpointIndex,3]))
                                    MapEditor.selectedElements.splice(indexOfSelectionItem, 1)
                                } else {
                                    // toggle playerRestart on
                                    MapEditor.selectedElements = MapEditor.multiSelect ? MapEditor.selectedElements.concat([new Array(MapEditor.loadedMap.checkpoints.indexOf(checkpoint),3)]) : [new Array(MapEditor.loadedMap.checkpoints.indexOf(checkpoint),3)]
                                }
    
                                hitCheckPoint = true
                            }
                        }) // end of looping through each checkpoint
                    }



                    // RELEASED ON PLATFORM
                    if (!hitPlayerStart && !hitCheckPoint) {
                        MapEditor.renderedPlatforms.forEach(platform => {
                            if (isPointInRect(touchXMapped, touchYMapped, platform)) {
    
                                if (MapEditor.selectedElements.includes(MapEditor.loadedMap.platforms.indexOf(platform))) { // if platform is already selected -- deselect it
                                    // toggle platform off
                                    const indexOfPlatform = MapEditor.selectedElements.indexOf(MapEditor.loadedMap.platforms.indexOf(platform))
                                    MapEditor.selectedElements.splice(indexOfPlatform, 1)
    
                                } else { 
                                    // toggle platform on
                                    if (MapEditor.multiSelect) {
                                        MapEditor.selectedElements = MapEditor.selectedElements.concat(MapEditor.loadedMap.platforms.indexOf(platform))
                                    } else {
                                        MapEditor.selectedElements = [MapEditor.loadedMap.platforms.indexOf(platform)]
                                    }
                                }
    
                                hitPlatform = true
                            } // end of clicked on platform
                        }) // end of looping through all renderedPlatforms
                    }



                    // SETTING BTN GROUPS AND UPDATING NESESARY SLIDERS AND BUTTONS
                    if (hitPlayerStart || hitCheckPoint || hitPlatform) {

                        if (MapEditor.selectedElements.length == 0) { // nothing selected
                            this.renderedButtons = this.btnGroup_mapEditorInterface
    
                        } else if (MapEditor.selectedElements.length > 1) { // multiple elements selected
                            this.renderedButtons = this.btnGroup_editMultiSelect
                        
                        } else {
                            if (MapEditor.selectedElements.includes("playerStart")) {
                                this.renderedButtons = this.btnGroup_editPlayerStart
                                btn_playerAngleSlider.updateState(MapEditor.loadedMap.playerStart.angle)
    
                            } else if (Array.isArray(MapEditor.selectedElements[0])) { // checkpoint part is selected
                                this.renderedButtons = this.btnGroup_editCheckPoint;
                                btn_checkpointAngleSlider.updateState(MapEditor.loadedMap.checkpoints[MapEditor.selectedElements[0][0]].angle) // sync
    
                            } else { // platform is selected
                                this.renderedButtons = this.btnGroup_editPlatform;
                                btn_angleSlider.updateState(MapEditor.loadedMap.platforms[MapEditor.selectedElements[0]].angle)
                                btn_wall.func(true) // syncs the wall button's toggle state
                            }
                        }
                    }

                } // end of not ignoring touch
            } // end of user not scrolling/panning        
        } // if in MapEditors main edit screens 
    },

    render : function() {

        this.renderedButtons.forEach(button => { // LOOP RENDERED BUTTONS AND RUN THEIR .render()
            button.render();
        });

        if (this.gamestate == 1) { // In Main Menu
            canvasArea.canvas.style.backgroundColor = "#a3d5e1";
            document.body.style.backgroundColor = "#a3d5e1";
  
            // Draw title text
            canvasArea.ctx.fillStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1;
            canvasArea.ctx.font = "140px BAHNSCHRIFT"
            canvasArea.ctx.fillText("Null Hop", midX - canvasArea.ctx.measureText("Null Hop").width / 2, 130)

            const menu_background = document.getElementById("menu_background")
            canvasArea.ctx.drawImage(menu_background, -30, 15, canvasArea.canvas.width + 60, (menu_background.height / menu_background.width) * canvasArea.canvas.width + 60)

        }

        if (this.gamestate == 3) { // In Settings
            canvasArea.ctx.font = "20px BAHNSCHRIFT";
            canvasArea.ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1: UserInterface.lightColor_1;
            canvasArea.ctx.fillText("Debug Info", 180, 270)
            canvasArea.ctx.fillText("Strafe Helper", 180, 330)

        }

        if (this.gamestate == 6) { // In Level
            canvasArea.ctx.fillStyle = UserInterface.darkMode ? UserInterface.darkColor_1: UserInterface.lightColor_1;


            if (this.levelState !== 3 && Tutorial.isActive == false) {
                canvasArea.roundedRect(canvasArea.canvas.width - 260, 20, 220, 100, 25)
                canvasArea.ctx.fill()

                canvasArea.ctx.font = "26px BAHNSCHRIFT";
                canvasArea.ctx.fillStyle = !UserInterface.darkMode ? UserInterface.darkColor_1: UserInterface.lightColor_1;

                canvasArea.ctx.fillText("Time: " + UserInterface.secondsToMinutes(this.timer), canvasArea.canvas.width - 240, 60)
                canvasArea.ctx.fillText("Record: " + UserInterface.secondsToMinutes((this.records[Map.name] == null ? 0 : this.records[Map.name])), canvasArea.canvas.width - 240, 90);
            }


            if (this.showVelocity && this.levelState == 2) {
                canvasArea.ctx.font = "26px BAHNSCHRIFT";
                canvasArea.ctx.fillStyle = UserInterface.darkMode ? UserInterface.darkColor_1: UserInterface.lightColor_1;
                const offsetY = Tutorial.pausePlayer ? 34 : 60
                canvasArea.ctx.fillText("Speed: " + Math.round(player.velocity.magnitude()), midX - canvasArea.ctx.measureText("Speed: 00").width/2, offsetY)
            }


            if (this.settings.debugText == 1) { // DRAWING DEBUG TEXT
                const textX = 200; 
                canvasArea.ctx.font = "15px BAHNSCHRIFT";
                canvasArea.ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1: UserInterface.lightColor_1;
    
                canvasArea.ctx.fillText("fps: " + Math.round(100/dt), textX, 60);
                canvasArea.ctx.fillText("rounded dt: " + Math.round(dt * 10) / 10 + " milliseconds", textX, 80);
                canvasArea.ctx.fillText("renderedPlatforms Count: " + Map.renderedPlatforms.length, textX, 100);
                canvasArea.ctx.fillText("endZonesToCheck: " + Map.endZonesToCheck, textX, 120);
                canvasArea.ctx.fillText("dragging: " + touchHandler.dragging, textX, 140);
                canvasArea.ctx.fillText("", textX, 160);
                canvasArea.ctx.fillText("", textX, 180);
                if (touchHandler.dragging) {
                    canvasArea.ctx.fillText("touch x: " + touchHandler.touches[0].x, textX, 200);
                    canvasArea.ctx.fillText("touch y: " + touchHandler.touches[0].y, textX, 220);
                }
                canvasArea.ctx.fillText("dragAmountX: " + touchHandler.dragAmountX, textX, 240);
                canvasArea.ctx.fillText("velocity: " + Math.round(player.velocity.magnitude()), textX, 260);
                canvasArea.ctx.fillText("player pos: " + Math.round(player.x) + ", " + Math.round(player.y), textX, 280);
                canvasArea.ctx.fillText("lookAngle: " + player.lookAngle.getAngle(), textX, 300);
                canvasArea.ctx.fillText("Timer: " + UserInterface.secondsToMinutes(this.timer), textX, 320);


                // DRAWING PLAYER MOVEMENT DEBUG VECTORS
                // player wishDir
                canvasArea.ctx.strokeStyle = "#FF00FF";
                canvasArea.ctx.lineWidth = 3
                canvasArea.ctx.beginPath();
                canvasArea.ctx.moveTo(midX, midY);
                canvasArea.ctx.lineTo(midX + player.wishDir.x * 100, midY + player.wishDir.y * 100);
                canvasArea.ctx.stroke();

                // player velocity
                canvasArea.ctx.strokeStyle = "#0000FF";
                canvasArea.ctx.lineWidth = 4
                canvasArea.ctx.beginPath();
                canvasArea.ctx.moveTo(midX, midY);
                canvasArea.ctx.lineTo(midX + player.velocity.x * 10, midY + player.velocity.y * 10);
                canvasArea.ctx.stroke();

                // player lookAngle
                canvasArea.ctx.strokeStyle = "#FF00FF";
                canvasArea.ctx.lineWidth = 2
                canvasArea.ctx.beginPath();
                canvasArea.ctx.moveTo(midX, midY);
                canvasArea.ctx.lineTo(midX + player.lookAngle.x * 100, midY + player.lookAngle.y * 100);
                canvasArea.ctx.stroke();

                canvasArea.ctx.strokeStyle = "#000000"; // resetting
                canvasArea.ctx.lineWidth = 1
            }
    

            if (this.settings.strafeHUD == 1) { // STRAFE OPTIMIZER HUD

                /* DRAW THE OLD LITTLE GRAPHS UNDER PLAYER
                canvasArea.ctx.fillRect(midX - 18, midY + 28, 8, 4 * Math.abs(touchHandler.dragAmountX) * UserInterface.settings.sensitivity); // YOUR STRAFE
                canvasArea.ctx.fillRect(midX - 4, midY + 28, 8, 10 * player.currentSpeedProjected); // THE THRESHOLD
                canvasArea.ctx.fillRect(midX + 12, midY + 28 + 10 * airAcceleration * dt , 8, 2); // ADDSPEED LIMIT
                canvasArea.ctx.fillRect(midX + 10, midY + 28, 8, 10 * player.addSpeed ); // GAIN

                // little text for strafeHelper
                canvasArea.ctx.save()
                canvasArea.ctx.font = "12px BAHNSCHRIFT";
                canvasArea.ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1: UserInterface.lightColor_1;
                canvasArea.ctx.translate(midX - 17, midY + 28)
                canvasArea.ctx.rotate(90 * Math.PI / 180)
                canvasArea.ctx.fillText("dragAmountX", 0, 0)
                canvasArea.ctx.fillText("currentSpeedProjected: " + player.currentSpeedProjected, 0, -14)
                canvasArea.ctx.fillText("addSpeed: " + player.addSpeed, 0, -28)
                canvasArea.ctx.fillText("airAcceleration * dt: " + airAcceleration * dt, 0, -42)
                canvasArea.ctx.restore()
                */


                const ctx = canvasArea.ctx

                if (touchHandler.dragging && this.levelState != 3) { // check if any button is pressed

                    let lineUpOffset = 0
                    if (touchHandler.touches[0].startX > midX - 200 && touchHandler.touches[0].startX < midX + 200) { // if touched withing slider's X => offset the handle to lineup with finger
                        lineUpOffset = touchHandler.touches[0].startX - midX
                    }

                    let strafeDistanceX = touchHandler.touches[0].x - touchHandler.touches[0].startX + lineUpOffset
                    while (strafeDistanceX > 212) { // loop back to negative
                        strafeDistanceX = -212 + (strafeDistanceX - 212)
                    }
                    while (strafeDistanceX < -212) { // loop back to positive
                        strafeDistanceX = 212 + (strafeDistanceX + 212)
                    }
    
    
                    ctx.strokeStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1
                    ctx.fillStyle = UserInterface.darkMode ? UserInterface.darkColor_1: UserInterface.lightColor_1;


                    // DRAW SLIDER
                    if (Tutorial.pausePlayer == false) { // as long as player isnt paused
                        
                        // border
                        ctx.lineWidth = 4
    
                        const radius = 10
                        const x = midX - 200
                        const y = canvasArea.canvas.height - 140
                        const w = 400
                        const h = 20
    
                        ctx.beginPath()
                        ctx.moveTo(x + radius, y) // top line
                        ctx.lineTo(x + w - radius, y)
                        ctx.arc(x + w - radius, y + radius, radius, 1.5*Math.PI, 0.5*Math.PI) // right arc
                        ctx.lineTo(x + radius, y + h)
                        ctx.arc(x + radius, y + radius, radius, 0.5*Math.PI, 1.5*Math.PI) // left arc
                    
                        ctx.stroke()    
                        ctx.save() // #2.2
                        ctx.clip()
    
                        // Handle
                        ctx.beginPath();
                        ctx.arc(midX + strafeDistanceX, canvasArea.canvas.height - 130, 8, 0, 2 * Math.PI);
                        ctx.fill();
    
                        ctx.restore() // #2.2
        
    
                        // DRAW VERTICAL WARNING
                        // calculations
                        const averageX = Math.abs(touchHandler.averageDragX.getAverage())
                        const averageY = Math.abs(touchHandler.averageDragY.getAverage())
                        if (averageY > 5 * dt/1.5 && averageY > averageX*1.25)  { /// no mathematical reason for dt/1.5 just feels better
                            if (this.showVerticalWarning == false) {
                                this.showVerticalWarning = true;
                                setTimeout(() => {UserInterface.showVerticalWarning = false}, 1500); // waits 1 second to hide warning
                            }
                        }
                        // draw warning
                        if (this.showVerticalWarning) {
                            ctx.font = "22px BAHNSCHRIFT";

                            canvasArea.roundedRect(midX - 200, canvasArea.canvas.height - 180, ctx.measureText("DON'T SWIPE VERTICAL").width + 30, 30, 12)                            
                            ctx.fillStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1
                            ctx.fill()

                            ctx.fillStyle = !UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1
                            ctx.fillText("DON'T SWIPE VERTICAL", midX - 185, canvasArea.canvas.height - 157)

                        }


                        // DRAW OVERSTRAFE WARNING
                        if (this.showOverstrafeWarning) {
                            ctx.font = "22px BAHNSCHRIFT";

                            heightOffset = this.showVerticalWarning ? 38 : 0;
                            canvasArea.roundedRect(midX - 200, canvasArea.canvas.height - 180 - heightOffset, ctx.measureText("TURNING TOO FAST!").width + 30, 30, 12)                            
                            ctx.fillStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1
                            ctx.fill()

                            ctx.fillStyle = !UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1
                            ctx.fillText("TURNING TOO FAST!", midX - 185, canvasArea.canvas.height - 157 - heightOffset)
                        }
                    }
                }
            }


            // ENDSCREEN
            if (player.endSlow == 0) { // level name, your time, record, leaderboards
        
                // TIME BOX
                const timeBox = {
                    x : midX - (this.leaderboards[Map.name] !== undefined ? 302: 220),
                    y : midY - (Tutorial.isActive ? 118: 140),
                    width : (this.leaderboards[Map.name] !== undefined ? 652: 418),
                    height : 288,
                }


                // HIGHLIGHT MEDAL BOX
                const highlightBox = {
                    x : timeBox.x + 400,
                    y : null, // set later
                    width : 225,
                    height : 75,
                }

                let medal = null
                
 
                // DRAW BOXES
                canvasArea.ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1 : UserInterface.lightColor_1;
                canvasArea.ctx.strokeStyle = (!UserInterface.darkMode) ? UserInterface.darkColor_1 : UserInterface.lightColor_1;
                
                canvasArea.ctx.save(); // save 3

                canvasArea.ctx.shadowColor = "rgba(0, 0, 0, 0.21)"; 
                canvasArea.ctx.shadowOffsetX = 11
                canvasArea.ctx.shadowOffsetY = 11

                // time box
                canvasArea.roundedRect(timeBox.x, timeBox.y, timeBox.width, timeBox.height, 20)
                canvasArea.ctx.fill();

                // highlight medal box
                if (this.leaderboards[Map.name] !== undefined) {

                    // set hightlight box y and draw it
                    if (UserInterface.timer <= this.leaderboards[Map.name].gold) {
                        medal = 1
                        highlightBox.y = timeBox.y + 65 - highlightBox.height/2
                    } else if (UserInterface.timer <= this.leaderboards[Map.name].silver) {
                        medal = 2
                        highlightBox.y = timeBox.y + timeBox.height/2 - highlightBox.height/2
                    } else if (UserInterface.timer <= this.leaderboards[Map.name].bronze) {
                        medal = 3
                        highlightBox.y = timeBox.y + timeBox.height - 65 - highlightBox.height/2
                    }
                    
                    if (medal !== null) {
                        canvasArea.ctx.shadowOffsetX = 7
                        canvasArea.ctx.shadowOffsetY = 7

                        canvasArea.roundedRect(highlightBox.x, highlightBox.y, highlightBox.width, highlightBox.height, 15)
                        canvasArea.ctx.fill();

                        canvasArea.ctx.shadowColor = "transparent"
                        canvasArea.ctx.lineWidth = 4
                        canvasArea.ctx.stroke();
                    }
                }

                canvasArea.ctx.restore(); // restore 3
                
                
                // DRAW END SCREEN TEXT
                canvasArea.ctx.fillStyle = (!UserInterface.darkMode) ? UserInterface.darkColor_1 : UserInterface.lightColor_1;
                
                // map name
                canvasArea.ctx.font = "38px BAHNSCHRIFT";
                canvasArea.ctx.fillText(Map.name, timeBox.x + 40, timeBox.y + 70);
                
                // time
                canvasArea.ctx.font = "90px BAHNSCHRIFT";
                canvasArea.ctx.fillText(UserInterface.secondsToMinutes(UserInterface.timer), timeBox.x + 40 - 5, timeBox.y + timeBox.height/2 + 32);
                
                // record OR new record
                canvasArea.ctx.font = "30px BAHNSCHRIFT";

                const recordText = (this.timer == this.records[Map.name]) ? "New Record!  -(" + UserInterface.secondsToMinutes(Math.abs(this.previousRecord - this.records[Map.name])) + ")" : "Best Time: " + UserInterface.secondsToMinutes(this.records[Map.name])
                
                canvasArea.ctx.fillText(recordText, timeBox.x + 40, timeBox.y + timeBox.height - 45);

                
                // medals and times
                if (this.leaderboards[Map.name] !== undefined) {
                    let halfFontHeight = 10
                    let xOffset = 0
                    let medalRadius = 16
                    let medalShadow = false

                    function testMedal(number) { // sets specific parameters for drawMedal
                        canvasArea.ctx.font = medal == number ? "38px BAHNSCHRIFT" : "30px BAHNSCHRIFT"
                        halfFontHeight = medal == number ? 13 : 10
                        xOffset = medal == number ? 14 : 0
                        medalRadius = medal == number ? 19 : 16
                        medalShadow = medal == number ? true : false
                        canvasArea.ctx.globalAlpha = (medal == number || medal == null) ? 1 : 0.5
                    }

                    testMedal(1)
                    canvasArea.ctx.fillText(UserInterface.secondsToMinutes(this.leaderboards[Map.name].gold), timeBox.x + 482 - xOffset, timeBox.y + 65 + halfFontHeight);
                    canvasArea.ctx.globalAlpha = 1
                    this.drawMedal(timeBox.x + 452 - xOffset, timeBox.y + 65, medalRadius, "#f1b62c", "#fde320", 4, medalShadow)
                    
                    testMedal(2)
                    canvasArea.ctx.fillText(UserInterface.secondsToMinutes(this.leaderboards[Map.name].silver), timeBox.x + 482 - xOffset, timeBox.y + timeBox.height/2 + halfFontHeight);
                    canvasArea.ctx.globalAlpha = 1
                    this.drawMedal(timeBox.x + 452 - xOffset, timeBox.y + timeBox.height/2, medalRadius, "#8c9a9b", "#d4d4d6", 4, medalShadow)
                    
                    testMedal(3)
                    canvasArea.ctx.fillText(UserInterface.secondsToMinutes(this.leaderboards[Map.name].bronze), timeBox.x + 482 - xOffset, timeBox.y + timeBox.height - 65 + halfFontHeight);            
                    canvasArea.ctx.globalAlpha = 1
                    this.drawMedal(timeBox.x + 452 - xOffset, timeBox.y + timeBox.height - 65, medalRadius, "#e78b4c", "#f4a46f", 4, medalShadow)
                }
            }
        }
    }
}


const MapBrowser = { // should set back to 0 at some points
    state : 0, // 0 = disabled, 1 = standard map browser, 2 = custom map browser
    scrollY: 0,
    scrollVel: 0,
    scrollVelAverager : new Averager(10),
    scrollAmount: null,
    selectedMapIndex: -1, // -1 == no map selected ... string of map name when a map is selected
    maxScroll: -50,

    init : function() {

        function setMaxScroll() {
            MapBrowser.maxScroll = -50
            UserInterface.renderedButtons.forEach((button) => {
                if (button.x == 300) {MapBrowser.maxScroll -= 100}
            })
            MapBrowser.maxScroll += 525 // 5 = buttons to offset
            if (MapBrowser.maxScroll > 0) {MapBrowser.maxScroll = 0} // clipping it incase theres not more than 5 buttons
        }

        if (this.state == 1) { // Normal map browser
            
            this.scrollY = 0
            this.scrollVel = 0
            this.selectedMapIndex = -1
        
            setMaxScroll()
        }

        if (this.state == 2) { // CUSTOM MAP BROWSER

            this.scrollY = 0
            this.scrollVel = 0
            this.selectedMapIndex = -1

            // access file system and set up all nessasary map buttons for the browser type
            // a horrible nested mess but it keeps everything firing in the right sequence
            //function initCustomMapBrowser(path){

            window.resolveLocalFileSystemURL(cordova.file.dataDirectory + "maps", function (fileSystem) {
                var reader = fileSystem.createReader();
                reader.readEntries((entries) => { // entries is an array of all the maps

                    // LOOP THROUGH EACH CUSTOM MAP
                    let mapNumber = 0
                    entries.forEach((mapEntry) => {

                        console.log(mapEntry.name)

                        // create toggle buttons for each map. These can be selected to preview map info. seperate play button will play them 

                        // create these with blank button icons. render() adds text ontop . ALSO CHANGE THE CHECK IN RENDER FUNC
                        let button = new Button(300, 50 + (100 * mapNumber), 280, "", "", 1, String(mapEntry.name.split(".")[0]), function (sync) {

                            if (sync) {
                                // doesnt need to sync toggle state
                                // used to detoggle map buttons when another one is selected
                                this.toggle = 0;
                            } else {
                                if (this.toggle) { // toggle off
                                    this.toggle = 0;
                                    MapBrowser.selectedMapIndex = -1
                                } else { // toggle on

                                    MapBrowser.toggleAllButtons();
                                    this.toggle = 1;
                                    MapBrowser.selectedMapIndex = this.label
                                }
                            }

                        })

                        UserInterface.renderedButtons = UserInterface.renderedButtons.concat([button])
                        mapNumber++
                        setMaxScroll()

                    }) // end of forEach loop                        
                }, (error) => { console.log(error) });
            }, (error) => { console.log(error) });
        }        
    },
    
    toggleAllButtons : function() {
        UserInterface.renderedButtons.forEach(button => {
            // dont toggle playTutorial
            if (button.toggle == 1 && button != btn_playTutorial) {button.toggle = 0}
        })
    },

    update : function() {
        // called every frame when gamestate == 2

        // changes the position of buttons on scroll
        if (touchHandler.dragging == 1 && touchHandler.touches[0].x > 250 && touchHandler.touches[0].x < 650) {
            if (this.scrollAmount == null) { // start of scroll
                this.scrollAmount = this.scrollY
            }

            // is scrolling
            this.scrollAmount += touchHandler.dragAmountY

            // sets scrollVel to average drag amount of past 10 frames
            this.scrollVelAverager.pushValue(touchHandler.dragAmountY)
            this.scrollVel = this.scrollVelAverager.getAverage()

            this.scrollY = this.scrollAmount;

        } else { // not dragging

            if (this.scrollAmount != null) { // just stopped dragging
                this.scrollAmount = null
                this.scrollVelAverager.clear()
            }

            this.scrollY += this.scrollVel
            this.scrollVel = (Math.abs(this.scrollVel) > 0.1) ? this.scrollVel * (1 - 0.05 * dt) : 0        
        }


        // stopping scrolling
        if (this.scrollY > 0) {this.scrollY = 0}
        if (this.scrollY < this.maxScroll) {this.scrollY = this.maxScroll}


        UserInterface.renderedButtons.forEach((button) => {
            if (button.x > 100 && button.x < 600) {
                button.y = button.savedY + this.scrollY
            }
        })



        // ENABLING and DISABLING btn_playMap and btn_playTutorial in browsers BESIDES map editor's

        if (MapEditor.editorState != 5) { // not in map editors browser
            
            // ADDING AND REMOVING btn_playmap
            if (this.selectedMapIndex != -1 && !UserInterface.renderedButtons.includes(btn_playMap)) {
                UserInterface.renderedButtons = UserInterface.renderedButtons.concat(btn_playMap)
            }
            
            if (this.selectedMapIndex == -1 && UserInterface.renderedButtons.includes(btn_playMap)) {
                UserInterface.renderedButtons = UserInterface.renderedButtons.filter(item => item !== btn_playMap);
            }

            // ADDING AND REMOVING btn_playTutorial
            if (this.selectedMapIndex == "Awakening" && !UserInterface.renderedButtons.includes(btn_playTutorial)) {
                UserInterface.renderedButtons = UserInterface.renderedButtons.concat(btn_playTutorial)
            }

            if (this.selectedMapIndex != "Awakening" && UserInterface.renderedButtons.includes(btn_playTutorial)) {
                UserInterface.renderedButtons = UserInterface.renderedButtons.filter(item => item !== btn_playTutorial);
            }

        } else {
            // in MapEditors browser
            // btn_editMap, btn_deleteMap, btn_shareMap
            
            if (
                this.selectedMapIndex != -1 &&
                !UserInterface.renderedButtons.includes(btn_editMap)
            ) {
                UserInterface.renderedButtons = UserInterface.renderedButtons.concat(btn_editMap)
                UserInterface.renderedButtons = UserInterface.renderedButtons.concat(btn_deleteMap)
                UserInterface.renderedButtons = UserInterface.renderedButtons.concat(btn_shareMap)
            }
            
            if (
                this.selectedMapIndex == -1 &&
                UserInterface.renderedButtons.includes(btn_editMap)
            ) {UserInterface.renderedButtons = UserInterface.renderedButtons.slice(0,-3)}

        }

    },

    render : function() {
        // needs to be called every frame when gamestate == 2
        // draw labels for maps
        // desription of maps
        const ctx = canvasArea.ctx;

        // DRAW INFO BOX BG
        ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1: UserInterface.lightColor_1;
        const boxHeight = (MapEditor.editorState == 5) ? 160 : 300 // shorter map editor box to give room for 3 buttons
        canvasArea.roundedRect(canvasArea.canvas.width - 500, 50, 400, boxHeight, 25)
        ctx.fill()
        
        // DRAW TEXT INFO BOX
        ctx.font = "45px BAHNSCHRIFT";
        ctx.fillStyle = (!UserInterface.darkMode) ? UserInterface.darkColor_1: UserInterface.lightColor_1;

        if (this.selectedMapIndex != -1) { // Write map title and info
            const mapTitle = UserInterface.truncateText(this.selectedMapIndex, 340)
            ctx.fillText(mapTitle, canvasArea.canvas.width - 475, 120)

            ctx.font = "25px BAHNSCHRIFT";
            const yourRecord = UserInterface.secondsToMinutes((UserInterface.records[this.selectedMapIndex] == undefined ? 0 : UserInterface.records[this.selectedMapIndex]))
            ctx.fillText("Your Time: " + yourRecord, canvasArea.canvas.width - 475, 170)
            if (MapEditor.editorState !== 5 && UserInterface.leaderboards[this.selectedMapIndex] !== undefined) { // if not in MapEditor & leaderboards exist
                let rank
                if (UserInterface.records[this.selectedMapIndex] == undefined) {
                    rank = "None"
                } else {

                    rank = 1
                    for (const [key, value] of Object.entries(UserInterface.leaderboards[this.selectedMapIndex])) {
                        
                        if (UserInterface.records[this.selectedMapIndex] <= value) { // if your record is less than this leaderboard time
                            break;
                        } else {
                            rank ++
                        }
                    }
                    rank = UserInterface.getOrdinalSuffix(rank)
                }
                
                ctx.fillText("Leaderboard Rank: " + rank, canvasArea.canvas.width - 475, 220)
                
                // GOLD SILVER AND BRONZE ICONS
                if (rank == "1st") {
                    ctx.fillStyle = "#fedc32" // gold
                }

                if (rank == "2nd") {
                    ctx.fillStyle = "#dbdbdd" // silver
                }

                if (rank == "3rd") {
                    ctx.fillStyle = "#f6b386" // bronze
                }

                canvasArea.roundedRect(canvasArea.canvas.width - 200, 186, 34, 34, 10)
                ctx.fill()
            }


        } else { // no map is selected
            if (this.state == 1) {
                ctx.fillText("Select A Map", canvasArea.canvas.width - 475, 110)
            }

            if (this.state == 2) {
                ctx.font = "30px BAHNSCHRIFT";
                ctx.fillText("Import, or Create", canvasArea.canvas.width - 475, 100)
                ctx.fillText("Custom Maps in the", canvasArea.canvas.width - 475, 140)
                ctx.fillText("Map Editor", canvasArea.canvas.width - 475, 180)
            }
        }


        // Map BROWSER DEBUG TEXT
        // ctx.font = "15px BAHNSCHRIFT";
        // ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1: UserInterface.lightColor_1;
        // ctx.fillText("MapIndex: " + this.selectedMapIndex, 80, 200)
        // ctx.fillText("scrollAmount: " + this.scrollAmount, 80, 220)
        // ctx.fillText("scrollY: " + this.scrollY, 80, 240)
        // ctx.fillText("scrollVel: " + this.scrollVel, 80, 260)
        // ctx.fillText("scrollVelAverager: " + this.scrollVelAverager.frames, 80, 280)
        // ctx.fillText("maxScroll: " + this.maxScroll, 80, 300)

    }
}


const Tutorial = {
    isActive : false,
    state : 0, //  20 stages in google doc
    // STATES SKIPPED / REMOVED: 4, 
    targets : [[240,50],[120,50],[180,50],[0,50],[60,50],[300,50]], // 1st number is target angle, 2nd is targets health
    timerStarted : false, // used to prevent multiple timers from being set every frame
    timerCompleted : false,
    liftedFinger : false,
    pausePlayer : false,
    animatePos : 0,
    animateVel : 0,
    decalLoadState : -1, // -1 no, 0 started load, 4 finished load (number of decals loaded)
    decalList : ["horizontal_finger", "vertical_finger", "finger", "arrow"],
    timeoutToCancel : null,

    reset : function() { // called on restart and when leaving level
        this.state = 0;
        this.targets = [[240,50],[120,50],[180,50],[0,50],[60,50],[300,50]];
        this.timerStarted = false;
        this.timerCompleted = false;
        this.liftedFinger = false;
        this.pausePlayer = false;
        this.animatePos = 0;
        this.animateVel = 0;
        clearTimeout(this.timeoutToCancel)
    },



    update : function() {
        if (UserInterface.gamestate == 2) { // in map browser
            if (MapBrowser.selectedMapIndex !== "Awakening") { // tutorial level not selected
                this.isActive = false;
            }
        } 

        // ONLY DO THESE CHECKS IF this.isActive

        if (this.state == 0) {
            if ((UserInterface.gamestate == 5 || UserInterface.gamestate == 6) && this.decalLoadState == -1) { // decals havnt started loading yet
                // INITIATE DECALS
                this.decalLoadState = 0

                window.resolveLocalFileSystemURL(cordova.file.applicationDirectory + "www/assets/images/decals/", (dirEntry) => {
                    // LOOP TO GET EACH DECAL IMAGE
                    for(let i = 0; i < this.decalList.length; i++) {

                        dirEntry.getFile(this.decalList[i] + ".svg", {create: false, exclusive: false}, (fileEntry) => {
                            fileEntry.file( (file) => {
                                const reader = new FileReader();
                                reader.onload = (e) => {
    
                                    const SVG = new DOMParser().parseFromString(e.target.result, "image/svg+xml").documentElement;                                
                                    SVG.getElementById("bg").style.fill = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1
                                    const SVG_string = new XMLSerializer().serializeToString(SVG);
                                    const SVG_blob = new Blob([SVG_string], {type: 'image/svg+xml'});
                                    const SVG_url = URL.createObjectURL(SVG_blob);
                                    this.decalList[i] = new Image()
                                    this.decalList[i].addEventListener("load", () => {
                                        //once image is loaded
                                        this.decalLoadState ++;
                                        URL.revokeObjectURL(SVG_url)
                                    }, {once: true});

                                    this.decalList[i].src = SVG_url
                                };
                                reader.onerror = (e) => alert(e.target.error.name);
                    
                                reader.readAsText(file)
                            })
                        }, () => {console.log(this.decalList[i] + ": no svg found");});
                    

                    } // end of for loop
                })
            }
            
            if (UserInterface.gamestate == 6) { // map is loaded
                // called early incase decals arent loaded yet. Dont want all buttons visible
                UserInterface.renderedButtons = [btn_mainMenu]

                if (this.decalLoadState == 4) {
                    this.state = 1;
                }
            }
        }

        if (this.state == 1) {
            this.timerCompleted = true;

            if (
                !UserInterface.renderedButtons.includes(btn_next) &&  
                Math.abs(player.lookAngle.getAngle() - Map.playerStart.angle) > 45
            ) {
                UserInterface.renderedButtons = UserInterface.renderedButtons.concat(btn_next)
            }
        }

        // state 2 has no wait timer on btn_next

        if (this.state == 3) {

            if (this.targets.length > 0) {

                if (this.targets[0][1] > 0) {

                    if (Math.abs(player.lookAngle.getAngle() - this.targets[0][0]) < 8) {
                        this.targets[0][1] -= (0.8 * dt);
                    } else { this.targets[0][1] = 50 }
    
                } else { this.targets.shift()} // remove first element

            } else { // All targets completed
                this.state = 5; // skip state 4
                UserInterface.renderedButtons = UserInterface.btnGroup_inLevel
            }
        }

        if (this.state == 5) {
            if (UserInterface.levelState == 2) { // if player is jumping
                this.state ++;
                Tutorial.animatePos = 0;
                Tutorial.animateVel = 0;
            }
        }

        if (!this.timerStarted && this.state == 6) { // timer to jump for 2 seconds
            this.timeoutToCancel = setTimeout(() => {
                this.timerStarted = false;
                this.state ++;
                this.pausePlayer = true
                UserInterface.renderedButtons = UserInterface.btnGroup_inLevel.concat(btn_next)
            }, 2000);
            this.timerStarted = true;
        }

        // state 7 has no wait timer on btn_next

        if (this.state == 8 || this.state == 10 || this.state == 12 || this.state == 14 || this.state == 16) { // wait for a bit then allow player to progess by swiping
            if (!this.timerStarted && !this.timerCompleted) {
                this.timeoutToCancel = setTimeout(() => {this.timerStarted = false; this.timerCompleted = true}, 800);
                this.timerStarted = true;
                this.liftedFinger = false;
            }

            if (!touchHandler.dragging) {this.liftedFinger = true}

            if (this.timerCompleted && touchHandler.dragging == true && this.liftedFinger) {
                this.state ++; 
                this.pausePlayer = false
                this.timerCompleted = false
            }
        }

        if (this.state == 9) {
            if (player.checkpointIndex == 4) {this.state ++; this.pausePlayer = true}
        }

        // 10 bundled w 8

        if (this.state == 11) {
            if (player.checkpointIndex == 1) {this.state ++; this.pausePlayer = true}
        }

        // 12 bundled w 8

        if (this.state == 13) {
            if (player.checkpointIndex == 2) {this.state ++; this.pausePlayer = true}
        }

        // 14 bundled w 8

        if (this.state == 15) {
            if (player.checkpointIndex == 0) {this.state ++; this.pausePlayer = true}
        }

        // 16 bundled w 8

        if (this.state == 17) { // check if ended level
            if (UserInterface.levelState == 3 && player.endSlow == 0) {
                this.state ++; 
                UserInterface.renderedButtons = UserInterface.btnGroup_inLevel.concat(btn_next)
            }
        }

        // state 18 has no wait timer on btn_next

    },


    render : function() {
        const ctx = canvasArea.ctx;
        canvasArea.ctx.font = "28px BAHNSCHRIFT";
        const bg_color = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1;
        const icon_color = !UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1;

        // TUTORIAL DEBUG TEXT
        if (UserInterface.settings.debugText) {
            ctx.fillText("state: " + this.state, midX - 200, 34)
            //ctx.fillText(this.targets, 300, midY)
        }


        function drawTextPanel(text) {
            const textWidth = ctx.measureText(text).width

            ctx.fillStyle = bg_color
            canvasArea.roundedRect(midX - 25 - textWidth/2, 50, textWidth + 50, 80, 25)
            ctx.fill()

            ctx.fillStyle = icon_color
            ctx.fillText(text, midX - textWidth/2, 100)
            
            // resets position of btn_next so that it can pulse
            btn_next.x = midX + textWidth/2 + 45
            btn_next.y = 50
        }


        function pulseNextButton() {

            speed = 0.006 // 0.002 makes it oscillate ~every second. smaller = faster, larger = slower.
            const animValue = Math.sin(performance.now() * speed);

            // Pulse btn_next
            btn_next.width = 80 + (-1 * animValue * 8)
            btn_next.height = 80 + (-1 * animValue * 8)
            // this relies on drawTextPanel reseting btn_next's position every frame
            btn_next.x += (80 - btn_next.width) / 2
            btn_next.y += (80 - btn_next.height) / 2
        }


        function drawFingerSwipe() {

            const speed = 0.002 // 0.002 makes it oscillate ~every second. smaller = faster, larger = slower.
            const animValue = Math.sin(performance.now() * speed); // Use a sin wave to occilate between -1 and 1

            if (touchHandler.dragging == false && Tutorial.timerCompleted) {
                const image = Tutorial.decalList[0]
                ctx.drawImage(image, midX - image.width/2 + (animValue * 150), canvasArea.canvas.height - image.height - 60)
            }
        }


        if (this.state == 1) {
            drawTextPanel("Slide horizontally to turn the player");

            drawFingerSwipe()
            pulseNextButton()
        }


        if (this.state == 2) {
            drawTextPanel("Sliding vertically does NOT turn the player")

            // Draw NO VERTICAL swipe decal
            const speed = 0.002 // 0.002 makes it oscillate ~every second. smaller = faster, larger = slower.           
            const animValue = Math.sin(performance.now() * speed); // Use a sin wave to occilate between -1 and 1
            //const animValueFast = Math.sin(performance.now() * speed * 3);

            if (touchHandler.dragging == false) {
                const image = this.decalList[1]
                ctx.drawImage(image, midX - 250, midY - 60 + (animValue * 50))
            }

            pulseNextButton()
        }


        if (this.state == 3 && this.targets.length > 0) { // Targets

            const targetCounter = String(6 - this.targets.length + "/6")
            drawTextPanel("Rotate the player to look at the rings: " + targetCounter)
            
            ctx.save() // #4
            
            ctx.translate(midX, midY)
            ctx.rotate(this.targets[0][0] * Math.PI / 180)

            ctx.strokeStyle = Map.style.shadow_platformColor
            ctx.fillStyle = Map.style.shadow_platformColor
            ctx.lineWidth = 8
            ctx.lineCap = "round"

    
            // DRAW TARGET SHADOW
            if (this.targets[0][1] > 0) { // these two blocks could be a function. theyre called twice. Translate the ctx between the two
                ctx.beginPath()
                ctx.arc(75, 0, 14, 0, (this.targets[0][1] / 50) * (2 * Math.PI));
                ctx.stroke()
            }

            // center dot that appears when looking at target
            if (this.targets[0][1] < 50 ) {
                ctx.beginPath()
                ctx.arc(75, 0, 5, 0, 2 * Math.PI);
                ctx.fill()
            }


            // move up for actual targets
            ctx.rotate(-this.targets[0][0] * Math.PI / 180) // have to unrotate first
            ctx.translate(0, -32)
            ctx.rotate(this.targets[0][0] * Math.PI / 180)

            ctx.strokeStyle = bg_color
            ctx.fillStyle = bg_color

            
            // DRAW ACTUAL TARGET
            if (this.targets[0][1] > 0) {
                ctx.beginPath()
                ctx.arc(75, 0, 14, 0, (this.targets[0][1] / 50) * (2 * Math.PI));
                ctx.stroke()
            }

            // center dot that appears when looking at target
            if (this.targets[0][1] < 50 ) {
                ctx.beginPath()
                ctx.arc(75, 0, 5, 0, 2 * Math.PI);
                ctx.fill()
            }

            ctx.restore() // #4
            
        }



        if (this.state == 5) {
            drawTextPanel("Start jumping by pressing the jump button")

            // DRAW ARROW
            const speed = 0.005 // 0.002 makes it oscillate ~every second. smaller = faster, larger = slower.
            const animValue = Math.sin(performance.now() * speed); // Use a sin wave to occilate between -1 and 1

            const image = this.decalList[3]
            ctx.drawImage(image, btn_jump.x + 150 + (animValue * 20), btn_jump.y + btn_jump.width/2 - image.height/2)
        }


        if (this.state == 7) {
            drawTextPanel("Stay on the red platforms")
            pulseNextButton()
        }

        
        if (this.state == 8) {
            drawTextPanel("Slide horizontally to change the direction of the player")
            drawFingerSwipe()
        }


        if (this.state == 10) {
            drawTextPanel("Slow and steady swipes increase speed")
            drawFingerSwipe()
            // graphic showing smooth turn vs sharp turn?
        }


        if (this.state == 12) {
            drawTextPanel("Turn smoothly to gain speed and clear the gap")
            drawFingerSwipe()
        }


        if (this.state == 14) {
            drawTextPanel("Don't touch the walls!")
            drawFingerSwipe()
        }


        if (this.state == 16) {
            drawTextPanel("Reach the gold endzone to finish the level")
            drawFingerSwipe()
        }


        if (this.state == 18) {
            drawTextPanel("Finish levels faster to earn medals")
            pulseNextButton()
        }


        if (this.state == 19) {
            drawTextPanel("Click here to select a new level")

            // DRAW ARROW
            const speed = 0.005 // 0.002 makes it oscillate ~every second. smaller = faster, larger = slower.
            // Use a sin wave to occilate between -1 and 1
            const animValue = Math.sin(performance.now() * speed);

            const image = this.decalList[3]
            ctx.drawImage(image, btn_mainMenu.x + 150 + (animValue * 20), btn_mainMenu.y + btn_mainMenu.width/2 - image.height/2)
        }

    },

}


const PreviewWindow = {

    // update() is called by buttons
    // render() is called in MapEditor.render()

    x : 40, // kinda weird to use these now that its a full screen window
    y : 160,

    // OBJECTS TO DRAW
    platform : {
        "x": 165,
        "y": 160,
        "width": 70,
        "height": 70,
        "angle": 45,
        "endzone": 0,
        "wall": 0
    },

    wall : {
        "x": 70,
        "y": 110,
        "width": 50,
        "height": 100,
        "angle": 45,
        "endzone": 0,
        "wall": 1
    },

    endzone : {
        "x": 240,
        "y": 85,
        "width": 50,
        "height": 50,
        "angle": 45,
        "endzone": 1,
        "wall": 0
    },

    player : {
        "x" : 165,
        "y" : 148,
        "angle" : 45,
        "jumpValue" : 29
    },


    update : function() { // updates the shading for all colors (and platform shadow points)
        
        function updatePlatform(platform) { // Calculate lighting and shadows for whatever platform is passed as param

            // turning lightDirection integer into a Vector 
            MapEditor.loadedMap.style.lightDirectionVector = new Vector(Math.cos(MapEditor.loadedMap.style.lightDirection * (Math.PI/180)), Math.sin(MapEditor.loadedMap.style.lightDirection * (Math.PI/180)))

            // Setting the colors for platforms, endzones, and walls
            let colorToUse = MapEditor.loadedMap.style.platformSideColor;
            if (platform.endzone) {colorToUse = MapEditor.loadedMap.style.endZoneSideColor;}
            if (platform.wall) {colorToUse = MapEditor.loadedMap.style.wallSideColor;}

            let colorToUse2 = MapEditor.loadedMap.style.platformTopColor;
            if (platform.endzone) {colorToUse2 = MapEditor.loadedMap.style.endZoneTopColor;}
            if (platform.wall) {colorToUse2 = MapEditor.loadedMap.style.wallTopColor;}
            
            // platform COLORS + wall and endzone
            const side1Vec = new Vector(-1,0).rotate(platform.angle)
            const side2Vec = new Vector(0,1).rotate(platform.angle)
            const side3Vec = new Vector(1,0).rotate(platform.angle)

            const litPercent1 = side1Vec.angleDifference(MapEditor.loadedMap.style.lightDirectionVector) / Math.PI
            const litPercent2 = side2Vec.angleDifference(MapEditor.loadedMap.style.lightDirectionVector) / Math.PI
            const litPercent3 = side3Vec.angleDifference(MapEditor.loadedMap.style.lightDirectionVector) / Math.PI


            platform.lit_topColor = canvasArea.getShadedColor(colorToUse2, 1)
            platform.sideColor1 = canvasArea.getShadedColor(colorToUse, litPercent1)
            platform.sideColor2 = canvasArea.getShadedColor(colorToUse, litPercent2)
            platform.sideColor3 = canvasArea.getShadedColor(colorToUse, litPercent3)


            // SHADOW POLYGON
            // lightPitch is actually sun's angle between 0 -> 89
            const sunAngle = MapEditor.loadedMap.style.lightPitch
            const shadowX = MapEditor.loadedMap.style.lightDirectionVector.x * Math.tan(sunAngle * Math.PI / 180) * MapEditor.loadedMap.style.platformHeight
            const shadowY = MapEditor.loadedMap.style.lightDirectionVector.y * Math.tan(sunAngle * Math.PI / 180) * MapEditor.loadedMap.style.platformHeight

            const angleRad = platform.angle * (Math.PI/180);
            
            let wallShadowMultiplier
            if (platform.wall && MapEditor.loadedMap.style.platformHeight > 0) {
                wallShadowMultiplier = 1 + (MapEditor.loadedMap.style.wallHeight / MapEditor.loadedMap.style.platformHeight)
            } else {
                wallShadowMultiplier = 1
            }

            platform.shadowPoints = [ // ALL THE POSSIBLE POINTS TO INPUT IN CONVEX HULL FUNCTION
            
                // bot left corner
                [
                -((platform.width / 2) * Math.cos(angleRad)) - ((platform.height / 2) * Math.sin(angleRad)),
                -((platform.width / 2) * Math.sin(angleRad)) + ((platform.height / 2) * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight
                ],

                // bot right corner
                [
                ((platform.width / 2) * Math.cos(angleRad)) - ((platform.height / 2) * Math.sin(angleRad)),
                ((platform.width / 2) * Math.sin(angleRad)) + ((platform.height / 2) * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight
                ],

                // top right corner
                [
                ((platform.width / 2) * Math.cos(angleRad)) + ((platform.height / 2) * Math.sin(angleRad)),
                ((platform.width / 2) * Math.sin(angleRad)) - ((platform.height / 2) * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight
                ],
            
                // top left corner
                [
                -((platform.width / 2) * Math.cos(angleRad)) + ((platform.height / 2) * Math.sin(angleRad)),
                -((platform.width / 2) * Math.sin(angleRad)) - ((platform.height / 2) * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight
                ],
            
                // bot left SHADOW
                [
                -((platform.width / 2) * Math.cos(angleRad)) - ((platform.height / 2) * Math.sin(angleRad)) + shadowX * wallShadowMultiplier,
                -((platform.width / 2) * Math.sin(angleRad)) + ((platform.height / 2) * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight + shadowY * wallShadowMultiplier
                ],

                // bot right SHADOW
                [
                ((platform.width / 2) * Math.cos(angleRad)) - ((platform.height / 2) * Math.sin(angleRad)) + shadowX * wallShadowMultiplier,
                ((platform.width / 2) * Math.sin(angleRad)) + ((platform.height / 2) * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight + shadowY * wallShadowMultiplier
                ],
                
                // top right SHADOW
                [
                ((platform.width / 2) * Math.cos(angleRad)) + ((platform.height / 2) * Math.sin(angleRad)) + shadowX * wallShadowMultiplier,
                ((platform.width / 2) * Math.sin(angleRad)) - ((platform.height / 2) * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight + shadowY * wallShadowMultiplier
                ],

                // top left SHADOW
                [
                -((platform.width / 2) * Math.cos(angleRad)) + ((platform.height / 2) * Math.sin(angleRad)) + shadowX * wallShadowMultiplier,
                -((platform.width / 2) * Math.sin(angleRad)) - ((platform.height / 2) * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight + shadowY * wallShadowMultiplier
                ],
                
            ]; // end of shadowPoints array

            platform.shadowPoints = canvasArea.convexHull(platform.shadowPoints)
        }

        updatePlatform(PreviewWindow.platform)
        updatePlatform(PreviewWindow.wall)
        updatePlatform(PreviewWindow.endzone)


        // update all other colors
        MapEditor.loadedMap.style.lit_playerTop = canvasArea.getShadedColor(MapEditor.loadedMap.style.playerColor, 1)
        MapEditor.loadedMap.style.lit_background = canvasArea.getShadedColor(MapEditor.loadedMap.style.backgroundColor, 1)

        MapEditor.loadedMap.style.platformShadow = canvasArea.getShadedColor(MapEditor.loadedMap.style.platformTopColor, 0.2) // 0.2 instead of 0 to pretend there's bounce lighting
        MapEditor.loadedMap.style.endzoneShadow = canvasArea.getShadedColor(MapEditor.loadedMap.style.endZoneTopColor, 0.2)
        MapEditor.loadedMap.style.backgroundShadow = canvasArea.getShadedColor(MapEditor.loadedMap.style.backgroundColor, 0.2)
    },


    render : function() {
        const ctx = canvasArea.ctx

        // WINDOW
        ctx.fillStyle = MapEditor.loadedMap.style.lit_background
        ctx.fillRect(0,0,canvasArea.canvas.width, canvasArea.canvas.height)

        
        function renderPreviewItemShadow(platform) { // render lower shadows
            ctx.save();
            ctx.translate(PreviewWindow.x + platform.x, PreviewWindow.y + platform.y);

            ctx.fillStyle = MapEditor.loadedMap.style.backgroundShadow;

            ctx.beginPath();
            
            ctx.moveTo(platform.shadowPoints[0][0], platform.shadowPoints[0][1]);
            for (let i = platform.shadowPoints.length - 1; i > 0; i --) {
                ctx.lineTo(platform.shadowPoints[i][0], platform.shadowPoints[i][1]);
            }

            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }

        function renderPreviewItem(platform) {
                        
            const adjustedHeight = platform.wall ? MapEditor.loadedMap.style.wallHeight : 0 // for adding height to walls

            // DRAW PLATFORM TOP
            ctx.save(); // ROTATING 
            ctx.translate(PreviewWindow.x + platform.x, PreviewWindow.y + platform.y - adjustedHeight);
            ctx.rotate(platform.angle * Math.PI/180);

            
            ctx.fillStyle = platform.lit_topColor

            ctx.fillRect(-platform.width/2, -platform.height/2, platform.width, platform.height);

            ctx.restore(); // restores platform rotation NOT translation


            // SIDES OF PLATFORMS
            ctx.save();
            ctx.translate(PreviewWindow.x + platform.x, PreviewWindow.y + platform.y);

            const angleRad = platform.angle * (Math.PI/180);
            
            // platform angles should only be max of 90 and -90 in mapData
            // calculating shading works with any angle but sides arent draw because drawing "if statements" are hardcoded to 90 degrees

            if (-90 < platform.angle && platform.angle < 90) { // ALMOST ALWAYS RENDER BOTTOM SIDE. side2
                
                ctx.fillStyle = platform.sideColor2; // sideColor2
                ctx.beginPath();
                ctx.moveTo(platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) - adjustedHeight); // bot right
                ctx.lineTo(-platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), -platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) - adjustedHeight); // bot left
                ctx.lineTo(-platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), -platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight);
                ctx.lineTo(platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight);
                ctx.closePath();
                ctx.fill();
            }


            if (0 < platform.angle && platform.angle <= 90) { // side3

                ctx.fillStyle = platform.sideColor3; // sideColor3
                ctx.beginPath();
                ctx.moveTo(platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) - adjustedHeight); // bot right
                ctx.lineTo(platform.width/2 * Math.cos(angleRad) + (platform.height/2 * Math.sin(angleRad)), platform.width/2 * Math.sin(angleRad) - (platform.height/2 * Math.cos(angleRad)) - adjustedHeight); // top right
                ctx.lineTo(platform.width/2 * Math.cos(angleRad) + (platform.height/2 * Math.sin(angleRad)), platform.width/2 * Math.sin(angleRad) - (platform.height/2 * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight);
                ctx.lineTo(platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight);
                ctx.closePath();
                ctx.fill();
            }

            if (-90 <= platform.angle && platform.angle < 0) { // side1

                ctx.fillStyle = platform.sideColor1; // sideColor1
                ctx.beginPath();
                ctx.moveTo(-platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), -platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) - adjustedHeight); // bot left
                ctx.lineTo(-platform.width/2 * Math.cos(angleRad) + (platform.height/2 * Math.sin(angleRad)), -platform.width/2 * Math.sin(angleRad) - (platform.height/2 * Math.cos(angleRad)) - adjustedHeight); // top left
                ctx.lineTo(-platform.width/2 * Math.cos(angleRad) + (platform.height/2 * Math.sin(angleRad)), -platform.width/2 * Math.sin(angleRad) - (platform.height/2 * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight);
                ctx.lineTo(-platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), -platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore(); // resets back from platform local space. player view space??
        
        
        } 

        renderPreviewItemShadow(this.wall)
        renderPreviewItemShadow(this.endzone)
        renderPreviewItemShadow(this.platform)

        renderPreviewItem(this.wall)
        renderPreviewItem(this.endzone)
        renderPreviewItem(this.platform)


        // DRAW PLAYER
        // Shadow
        ctx.save()
        ctx.translate(PreviewWindow.x + this.player.x, PreviewWindow.y + this.player.y)
        
        ctx.rotate(this.player.angle * Math.PI/180)

        ctx.fillStyle = MapEditor.loadedMap.style.platformShadow;
        ctx.fillRect(-15, -15, 30, 30)
        
        ctx.restore() // player translation and rotation

        
        // DRAWING PLAYER TOP
        ctx.save()
        ctx.translate(PreviewWindow.x + this.player.x, PreviewWindow.y + this.player.y - this.player.jumpValue - 32); 
        ctx.rotate(this.player.angle * Math.PI/180) // rotating canvas
        ctx.fillStyle = MapEditor.loadedMap.style.lit_playerTop;
        ctx.fillRect(-16,-16,32,32)
        
        // Draw players top arrow
        ctx.strokeStyle = "#00000030";
        ctx.lineWidth = 2
        
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-5, -7);
        ctx.lineTo(-5, 7);
        ctx.lineTo(8, 0)
        ctx.stroke();
        
        ctx.restore() // player translation and rotation
        

        // SIDES OF PLAYER
        ctx.save();
        
        const angleRad = this.player.angle * (Math.PI/180);
        const loopedAngle = this.player.angle;
        
        const originX = PreviewWindow.x + this.player.x
        const originY = PreviewWindow.y + this.player.y

        // GETTING CORNERS
        if (loopedAngle > 270 || loopedAngle < 90) { // BOT WALL

            const sideVector = new Vector(0,1).rotate(this.player.angle)
            const litPercent = sideVector.angleDifference(MapEditor.loadedMap.style.lightDirectionVector) / Math.PI
            ctx.fillStyle = canvasArea.getShadedColor(MapEditor.loadedMap.style.playerColor, litPercent)

            ctx.beginPath();
            ctx.moveTo(originX - (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), originY - 32 - this.player.jumpValue - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(originX + (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), originY - 32 - this.player.jumpValue + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(originX + (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), originY - this.player.jumpValue + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(originX - (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), originY - this.player.jumpValue - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.closePath();
            ctx.fill();
        }
        
        if (0 < loopedAngle && loopedAngle < 180) { // RIGHT WALL

            const sideVector = new Vector(1,0).rotate(this.player.angle)
            const litPercent = sideVector.angleDifference(MapEditor.loadedMap.style.lightDirectionVector) / Math.PI
            ctx.fillStyle = canvasArea.getShadedColor(MapEditor.loadedMap.style.playerColor, litPercent)

            ctx.beginPath();
            ctx.moveTo(originX + (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), originY - 32 - this.player.jumpValue + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(originX + (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), originY - 32 - this.player.jumpValue + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(originX + (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), originY - this.player.jumpValue + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(originX + (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), originY - this.player.jumpValue + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.closePath();
            ctx.fill();
        }
        
        if (90 < loopedAngle && loopedAngle < 270) { // TOP WALL
            
            const sideVector = new Vector(0,-1).rotate(this.player.angle)
            const litPercent = sideVector.angleDifference(MapEditor.loadedMap.style.lightDirectionVector) / Math.PI
            ctx.fillStyle = canvasArea.getShadedColor(MapEditor.loadedMap.style.playerColor, litPercent)

            ctx.beginPath();
            ctx.moveTo(originX + (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), originY - 32 - this.player.jumpValue + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(originX + (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), originY - this.player.jumpValue + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(originX - (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), originY - this.player.jumpValue - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(originX - (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), originY - 32 - this.player.jumpValue - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.closePath();
            ctx.fill();
        }
        
        if (180 < loopedAngle && loopedAngle < 360) { // LEFT WALL
            
            const sideVector = new Vector(-1,0).rotate(this.player.angle)
            const litPercent = sideVector.angleDifference(MapEditor.loadedMap.style.lightDirectionVector) / Math.PI
            ctx.fillStyle = canvasArea.getShadedColor(MapEditor.loadedMap.style.playerColor, litPercent)

            ctx.beginPath();
            ctx.moveTo(originX - (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), originY - 32 - this.player.jumpValue - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(originX - (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), originY - 32 - this.player.jumpValue - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(originX - (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), originY - this.player.jumpValue - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(originX - (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), originY - this.player.jumpValue - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }
}


const ColorPicker = {
    state : 0,
    x : 400,
    y : 40,
    width : 300,
    height : 15,
    hueGradient : null,
    saturationGradient : null,
    lightnessGradient : null,
    alphaGradient : null,

    rgbaValue : null,

    h : 117,
    s : 34,
    l : 75,
    a : 1,

    start : function() { // should be called sync
        const ctx = canvasArea.ctx;

        this.rgbaValue = canvasArea.HSLToRGB(this.h, this.s, this.l, this.a)


        // new ones of these are created every time a slider is changed...not great
        this.hueGradient = ctx.createLinearGradient(this.x, 0, this.width + this.x, 0)
        this.saturationGradient = ctx.createLinearGradient(this.x, 0, this.width + this.x, 0)
        this.lightnessGradient = ctx.createLinearGradient(this.x, 0, this.width + this.x, 0)
        this.alphaGradient = ctx.createLinearGradient(this.x, 0, this.width + this.x, 0)


        // HUE BAR
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

        // ALPHA BAR
        this.alphaGradient.addColorStop(0, "hsla(" + this.h + ", " + this.s + "%, " + this.l + "%, 0)");
        this.alphaGradient.addColorStop(1, "hsla(" + this.h + ", " + this.s + "%, " + this.l + "%, 1)");

    },

    update : function() {
        if (this.hueGradient == null) {
            this.start();
        }
    },

    render : function() {
        const ctx = canvasArea.ctx;

        ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.lightColor_1 : UserInterface.darkColor_1;

        ctx.strokeStyle = (!UserInterface.darkMode) ? UserInterface.lightColor_1 : UserInterface.darkColor_1
        ctx.lineWidth = 4

        canvasArea.roundedRect(this.x-20, this.y-20, this.width + 40, 385, 25)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = "hsla(" + this.h + ", " + this.s + "%, " + this.l + "%, " + this.a + ")"

        canvasArea.roundedRect(this.x, this.y, this.width/2, 80, 10)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1 : UserInterface.lightColor_1;
        ctx.fillText(this.rgbaValue, this.x + 160, this.y + 10)

        ctx.fillStyle = this.hueGradient
        ctx.fillRect(this.x, this.y + 105, this.width, this.height)

        ctx.fillStyle = this.saturationGradient
        ctx.fillRect(this.x, this.y + 175, this.width, this.height)
        
        ctx.fillStyle = this.lightnessGradient
        ctx.fillRect(this.x, this.y + 245, this.width, this.height)

        ctx.fillStyle = this.alphaGradient
        ctx.fillRect(this.x, this.y + 315, this.width, this.height)

    },

    getColor : function() {
        return canvasArea.HSLToRGB(this.h, this.s, this.l, this.a)
        // return "hsla(" + this.h + ", " + this.s + "%, " + this.l + "%, " + this.a + ")"
    },

    setFromHex : function() {
        const color = prompt("Enter Hex Color. #RRGGBB or #RRGGBBAA");

        // https://stackoverflow.com/questions/8027423/how-to-check-if-a-string-is-a-valid-hex-color-representation
        const regEx = /^#[0-9A-F]{6}[0-9a-f]{0,2}$/i
        if (regEx.test(color)) { // is a valid color. convert to rgb then hsl

            const r = parseInt(color.substring(1,3), 16); // Grab the hex representation of red (chars 1-2) and convert to decimal (base 10).
            const g = parseInt(color.substring(3,5), 16);
            const b = parseInt(color.substring(5,7), 16);
            const a = color.length < 9 ? 255 : parseInt(color.substring(7,9), 16); // if transparency isnt declared then a = 255

            console.log([r,g,b,a])
            console.log(canvasArea.RGBToHSL(r,g,b,a))

            const hslaValue = canvasArea.RGBToHSL(r,g,b,a)

            this.h = hslaValue[0]
            this.s = hslaValue[1]
            this.l = hslaValue[2]
            this.a = hslaValue[3]

            btn_hueSlider.updateState(this.h)
            btn_saturationSlider.updateState(this.s)
            btn_lightnessSlider.updateState(this.l)
            btn_alphaSlider.updateState(this.a)

            this.start()
            
        } else {alert("Not A Hex Color. Use #RRGGBB or #RRGGBBAA")}
    }
}


const MapEditor = {
    
    editorState : 0,
    // 0 = map new/import/load screen
    // 1 = main map edit screen
    // 2 = platform edit menu
    // 3 = map color page
    // 4 = map settings page
    // 5 = custom map browser screen

    loadedMap : null,
    scrollAmountX : null,
    scrollAmountY : null,
    scrollVelX : 0, // for smooth scrolling 
    scrollVelY : 0,
    
    zoom : 1, // 10 = zoomed to 10x the scale. 0.1 zoomed out so everything is 10% of its size
    startingZoom: 1,

    screen : { // where the view is located realative to the map origin
        x : 0, // x and y are the center of the view (the crosshair)
        y : 0, // if 0,0 the view is centered on the map origin. Origin is in the center of the screen
    
        width : 0, //canvasArea.canvas.width / MapEditor.zoom,
        height : 0, //canvasArea.canvas.height / MapEditor.zoom,
    
        cornerX : this.x - this.width/2, // these coords are the top left corner of the view screen
        cornerY : this.y - this.height/2 // if they are 0,0 the origin of the map is in the top left corner

        // screen is updated in MapEditor.update()
    },


    scrollVelAveragerX : new Averager(10),
    scrollVelAveragerY : new Averager(10),

    renderedPlatforms : [],
    selectedElements : [], // platforms are their index, "playerStart" = playerStart, checkpoint items are each an array => 1st item is checkpoint index. 2nd is: 1=trigger1, 2=trigger2, 3=playerRespawn
    snapAmount : 0,
    multiSelect : false,
    debugText : false,

    render : function() {

        if (this.loadedMap !== null) { // IF MAP IS LOADED RENDER IT

            const ctx = canvasArea.ctx;


            ctx.save() // zooming everything
            ctx.scale(this.zoom, this.zoom)

            ctx.translate(-this.screen.cornerX, -this.screen.cornerY); // translate to map orgin

            ctx.fillRect(-2, -2, 4, 4) // (0,0) draw map origin


            // DRAW PLATFORM SIDES BELOW TOPS
            this.renderedPlatforms.forEach(platform => {
                                
                // SIDES OF PLATFORMS
                ctx.save(); // #18a
                ctx.translate(platform.x, platform.y);
                
                const angleRad = platform.angle * (Math.PI/180);

                if (platform.wall) {ctx.fillStyle = canvasArea.getShadedColor(MapEditor.loadedMap.style.wallSideColor, 0.5)} 
                else if (platform.endzone) {ctx.fillStyle = canvasArea.getShadedColor(MapEditor.loadedMap.style.endZoneSideColor, 0.5)}
                else {ctx.fillStyle = canvasArea.getShadedColor(MapEditor.loadedMap.style.platformSideColor, 0.5)}

                if (-90 < platform.angle && platform.angle < 90) { // ALMOST ALWAYS RENDER BOTTOM SIDE. side2
                    
                    ctx.beginPath();
                    ctx.moveTo(platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad))); // bot right
                    ctx.lineTo(-platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), -platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad))); // bot left
                    ctx.lineTo(-platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), -platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight);
                    ctx.lineTo(platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight);
                    ctx.closePath();
                    ctx.fill();
                }
        
        
                if (0 < platform.angle && platform.angle <= 90) { // side3
        
                    ctx.beginPath();
                    ctx.moveTo(platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad))); // bot right
                    ctx.lineTo(platform.width/2 * Math.cos(angleRad) + (platform.height/2 * Math.sin(angleRad)), platform.width/2 * Math.sin(angleRad) - (platform.height/2 * Math.cos(angleRad))); // top right
                    ctx.lineTo(platform.width/2 * Math.cos(angleRad) + (platform.height/2 * Math.sin(angleRad)), platform.width/2 * Math.sin(angleRad) - (platform.height/2 * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight);
                    ctx.lineTo(platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight);
                    ctx.closePath();
                    ctx.fill();
                }
        
                if (-90 <= platform.angle && platform.angle < 0) { // side1
        
                    ctx.beginPath();
                    ctx.moveTo(-platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), -platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad))); // bot left
                    ctx.lineTo(-platform.width/2 * Math.cos(angleRad) + (platform.height/2 * Math.sin(angleRad)), -platform.width/2 * Math.sin(angleRad) - (platform.height/2 * Math.cos(angleRad))); // top left
                    ctx.lineTo(-platform.width/2 * Math.cos(angleRad) + (platform.height/2 * Math.sin(angleRad)), -platform.width/2 * Math.sin(angleRad) - (platform.height/2 * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight);
                    ctx.lineTo(-platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), -platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight);
                    ctx.closePath();
                    ctx.fill();
                }
        
      
                ctx.restore(); // #18 back to map origin translation
                
            })


            // RENDER PLATFORMS TOPS
            this.renderedPlatforms.forEach(platform => {
                
                // DRAW PLATFORM TOP
                ctx.save(); // ROTATING for Platforms
                ctx.translate(platform.x, platform.y);
                ctx.rotate(platform.angle * Math.PI/180);

                // Change to endzone color if needed
                if (platform.wall) {
                    ctx.fillStyle = this.loadedMap.style.wallTopColor;
                } else if (platform.endzone) {
                    ctx.fillStyle = this.loadedMap.style.endZoneTopColor;
                } else {
                    ctx.fillStyle = this.loadedMap.style.platformTopColor;
                }
                
                ctx.fillRect(-platform.width/2, -platform.height/2, platform.width, platform.height);


                if (this.selectedElements.includes(MapEditor.loadedMap.platforms.indexOf(platform))) { // DRAWING THE BORDER AROUND THE SELECTED PLATFORM
                    
                    ctx.strokeStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1
                    ctx.lineWidth = 4
                    ctx.strokeRect(-platform.width/2 + 2, -platform.height/2 + 2, platform.width - 4, platform.height - 4);
                }
                

                ctx.restore(); // restoring platform rotation and translation
                
                // PLAFORM RENDERING DEBUG TEXT
                if (UserInterface.settings.debugText == 1) { // draw platform height indicators
                    ctx.fillStyle = "#FFFFFF";
                    ctx.fillText("position: " + platform.x + ", " + platform.y, platform.x + 5, platform.y - 5);

                    //origin
                    ctx.fillStyle = "#00FF00";
                    ctx.fillRect(platform.x - 3, platform.y - 3, 6, 6)
                }

            })


            // RENDER WALLS ADDITIONAL HEIGHT
            this.renderedPlatforms.forEach(platform => {
                if (platform.wall) {
            
                    // DRAW WALL RAISED TOP
                    ctx.save(); // ROTATING for Platform
                    ctx.translate(platform.x, platform.y - MapEditor.loadedMap.style.wallHeight);
                    ctx.rotate(platform.angle * Math.PI/180);

                    ctx.strokeStyle = canvasArea.getShadedColor(this.loadedMap.style.wallTopColor, 0.25)
                    ctx.lineWidth = 4

                    ctx.strokeRect(-platform.width/2 + 2, -platform.height/2 + 2, platform.width - 4, platform.height - 4);


                    ctx.restore(); // restoring platform rotation and translation
                }

            })


            // RENDER CHECKPOINTS
            MapEditor.loadedMap.checkpoints.forEach(checkpoint => {
                ctx.strokeStyle = ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1 : UserInterface.lightColor_1; 
                ctx.lineWidth = 5
                ctx.beginPath();
                ctx.moveTo(checkpoint.triggerX1, checkpoint.triggerY1);
                ctx.lineTo(checkpoint.triggerX2, checkpoint.triggerY2);
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(checkpoint.triggerX1, checkpoint.triggerY1, 20, 0, 2 * Math.PI);
                ctx.fill();

                ctx.beginPath();
                ctx.arc(checkpoint.triggerX2, checkpoint.triggerY2, 20, 0, 2 * Math.PI);
                ctx.fill();

                // playerRestart pos
                ctx.save()
                ctx.translate(checkpoint.x, checkpoint.y)
                ctx.rotate(checkpoint.angle * Math.PI/180);
                ctx.lineWidth = 3
                ctx.strokeRect(-16,-16,32,32)
    
                // draw player arrow
                ctx.lineWidth = 2
                ctx.beginPath();
                ctx.moveTo(8, 0);
                ctx.lineTo(-5, -7);
                ctx.lineTo(-5, 7);
                ctx.lineTo(8, 0)
                ctx.stroke();
                ctx.restore()

                // draw lines conecting to the playerRestart
                ctx.beginPath();
                ctx.setLineDash([6, 12]);
                // ctx.strokeStyle = "#FFFFFF88"
                ctx.moveTo(checkpoint.triggerX1, checkpoint.triggerY1);
                ctx.lineTo(checkpoint.x, checkpoint.y);
                ctx.lineTo(checkpoint.triggerX2, checkpoint.triggerY2);
                ctx.stroke();
                ctx.setLineDash([]);


                // DRAWING THE BORDER AROUND parts of THE SELECTED Checkpoint parts

                // get array of arrays from within selectedElements that cooresponds to this checkpoint ex: [[2, 1], [2, 3], [2, 2]]
                const selectionArrays = this.selectedElements.filter((element) => Array.isArray(element) && element[0] == MapEditor.loadedMap.checkpoints.indexOf(checkpoint))
                selectionArrays.forEach((checkpointPart) => {
                    // checkpoint part ex: [2,1] or [2,3]
                    if (checkpointPart[1] == 1) { // trigger 1
                        ctx.strokeStyle = UserInterface.darkColor_1
                        ctx.lineWidth = 6
                        ctx.beginPath();
                        ctx.arc(checkpoint.triggerX1, checkpoint.triggerY1, 20, 0, 2 * Math.PI);
                        ctx.stroke();
    
                        ctx.strokeStyle = UserInterface.lightColor_1
                        ctx.lineWidth = 2
                        ctx.beginPath();
                        ctx.arc(checkpoint.triggerX1, checkpoint.triggerY1, 20, 0, 2 * Math.PI);
                        ctx.stroke();
                    }

                    if (checkpointPart[1] == 2) { // trigger 2
                        ctx.strokeStyle = UserInterface.darkColor_1
                        ctx.lineWidth = 6
                        ctx.beginPath();
                        ctx.arc(checkpoint.triggerX2, checkpoint.triggerY2, 20, 0, 2 * Math.PI);
                        ctx.stroke();
    
                        ctx.strokeStyle = UserInterface.lightColor_1
                        ctx.lineWidth = 2
                        ctx.beginPath();
                        ctx.arc(checkpoint.triggerX2, checkpoint.triggerY2, 20, 0, 2 * Math.PI);
                        ctx.stroke();
                    }

                    if (checkpointPart[1] == 3) { // playerRestart
                        ctx.save()
                        ctx.translate(checkpoint.x, checkpoint.y)
                        ctx.rotate(checkpoint.angle * Math.PI/180);
            
                        ctx.strokeStyle = UserInterface.darkColor_1
                        ctx.lineWidth = 6
                        ctx.strokeRect(-16, -16, 32, 32);
                        
                        ctx.strokeStyle = UserInterface.lightColor_1
                        ctx.lineWidth = 2
                        ctx.strokeRect(-16, -16, 32, 32);
                        ctx.restore()
                    }    
                }) // end of selectionArray forEach
            }); // end of loadedMap.checkpoints.forEach


            // RENDER THE PLAYER START
            ctx.save()
            ctx.translate(this.loadedMap.playerStart.x, this.loadedMap.playerStart.y)
            ctx.rotate(this.loadedMap.playerStart.angle * Math.PI/180);
            ctx.fillStyle = this.loadedMap.style.playerColor;
            ctx.fillRect(-16,-16,32,32)

            // draw player arrow
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1
            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.lineTo(-5, -7);
            ctx.lineTo(-5, 7);
            ctx.lineTo(8, 0)
            ctx.stroke();

            if (this.selectedElements.includes("playerStart")) { // DRAWING SELECTION BORDER AROUND PLAYER
                ctx.strokeStyle = UserInterface.darkColor_1
                ctx.lineWidth = 6
                ctx.strokeRect(-13, -13, 26, 26);
                
                ctx.strokeStyle = UserInterface.lightColor_1
                ctx.lineWidth = 2
                ctx.strokeRect(-13, -13, 26, 26);
            }
            ctx.restore() //restoring player rotation and transformation


            ctx.restore() // restoring screen.x and screen.y translation and zoom
            // essentially translating(+screen.x, +screen.y)
            // END OF SCALED ZOOM RENDERING



            // MAP EDITOR UI
            ctx.font = "20px BAHNSCHRIFT";

            if (this.editorState == 1 || this.editorState == 2) {
                ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1 :  UserInterface.lightColor_1;
                ctx.fillText("Group Select", btn_multiSelect.x, btn_multiSelect.y - 15);
            }

            if (this.editorState == 2) { // DRAWING SIDE PANEL
            
                const sidePanel = {// If these change also change the values in UserInterface.touchReleased()
                    x : canvasArea.canvas.width - 280,
                    y : 20,
                    width : 225,
                    height : 320
                }

                // SIDE PANEL
                ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.lightColor_1 : UserInterface.darkColor_1;
                canvasArea.roundedRect(sidePanel.x, sidePanel.y, sidePanel.width, sidePanel.height, 25) 
                ctx.fill()

                ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1 : UserInterface.lightColor_1; // for text

                if (this.multiSelect && this.selectedElements.length > 1) { // MULTISELECTED

                    ctx.fillText("Group Selection", sidePanel.x + 25, sidePanel.y + 100);
                    ctx.fillText(this.selectedElements.length + " Items", sidePanel.x + 25, sidePanel.y + 130);

                } else {

                    if (this.selectedElements[0] == "playerStart") { // playerStart is selected
                        ctx.fillText("Player Start", sidePanel.x + 25, sidePanel.y + 100);
                        ctx.fillText("Position: " + this.loadedMap.playerStart.x + ", " + this.loadedMap.playerStart.y, sidePanel.x + 25, sidePanel.y + 130);
    
                    } else if (Array.isArray(this.selectedElements[0])) { // checkpoint is selected
                        ctx.fillText("Checkpoint", sidePanel.x + 25, sidePanel.y + 100);
                        ctx.fillText("Trigger 1: " + this.loadedMap.checkpoints[this.selectedElements[0][0]].triggerX1 + ", " + this.loadedMap.checkpoints[this.selectedElements[0][0]].triggerY1, sidePanel.x + 25, sidePanel.y + 130);
                        ctx.fillText("Trigger 2: " + this.loadedMap.checkpoints[this.selectedElements[0][0]].triggerX2 + ", " + this.loadedMap.checkpoints[this.selectedElements[0][0]].triggerY2, sidePanel.x + 25, sidePanel.y + 160);
                        ctx.fillText("Respawn: " + this.loadedMap.checkpoints[this.selectedElements[0][0]].x + ", " + this.loadedMap.checkpoints[this.selectedElements[0][0]].y, sidePanel.x + 25, sidePanel.y + 190);
                    
                    } else { // platform is selected
                        ctx.fillText("Platform", sidePanel.x + 25, sidePanel.y + 100);
                        ctx.fillText("Position: " + this.loadedMap.platforms[this.selectedElements[0]].x + ", " + this.loadedMap.platforms[this.selectedElements[0]].y, sidePanel.x + 25, sidePanel.y + 130);
                        ctx.fillText("Size: " + this.loadedMap.platforms[this.selectedElements[0]].width + ", " + this.loadedMap.platforms[this.selectedElements[0]].height, sidePanel.x + 25, sidePanel.y + 160);
                        ctx.fillText("Wall: " + (this.loadedMap.platforms[this.selectedElements[0]].wall?"Yes":"No"), sidePanel.x + 25, sidePanel.y + 280)
                    }

                }
            }

            if (this.editorState == 3) { // IN COLOR SETTINGS 
                PreviewWindow.render()
                ColorPicker.render()
                // PreviewWindow update is called by buttons
            }


            if (this.editorState == 4) { // IN MAP SETTINGS 
                PreviewWindow.render()
                // PreviewWindow update is called by buttons
            }


            if (UserInterface.settings.debugText == 1) {
                
                // GENERAL MAP EDITOR DEBUG TEXT
                const textX = 200;
                ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1 :  UserInterface.lightColor_1;
                ctx.fillText("zoom: " + this.zoom, textX, 40)
                ctx.fillText("screen.x: " + this.screen.x, textX, 60);
                ctx.fillText("screen.y: " + this.screen.y, textX, 80);
                ctx.fillText("screen.width: " + this.screen.width, textX, 100);
                ctx.fillText("screen.height: " + this.screen.height, textX, 120);
                ctx.fillText("screen.cornerX: " + this.screen.cornerX, textX, 140);
                ctx.fillText("screen.cornerY: " + this.screen.cornerY, textX, 160);
                
                ctx.fillText("rendered platforms: " + this.renderedPlatforms.length, textX, 180);
                ctx.fillText("editorState: " + this.editorState, textX, 200);
                ctx.fillText("selectedElements: " + this.selectedElements, textX, 220);
                
                if (touchHandler.dragging) {
                    ctx.fillText("touch: " + Math.round(touchHandler.touches[0].x) + ", " + Math.round(touchHandler.touches[0].y), textX, 240);
                    
                    // mapToRange(number, inMin, inMax, outMin, outMax)
                    const touchXMapped = canvasArea.mapToRange(touchHandler.touches[0].x, 0, canvasArea.canvas.width, this.screen.cornerX, this.screen.cornerX + this.screen.width)
                    const touchYMapped = canvasArea.mapToRange(touchHandler.touches[0].y, 0, canvasArea.canvas.height, this.screen.cornerY, this.screen.cornerY + this.screen.height)
                    
                    ctx.fillText("touch mapped: " + Math.round(touchXMapped) + ", " + Math.round(touchYMapped), textX, 260);
                }

                ctx.fillText("multSelect: "  + MapEditor.multiSelect, textX, 280);

                if (touchHandler.zoom.isZooming) { // draw center point between two fingers of zoom
                    ctx.save()
                    ctx.translate(touchHandler.zoom.x, touchHandler.zoom.y)
                    ctx.fillRect(-3,-3,6,6)
                    ctx.restore()
                }

            }
        }
    },

    update : function() {
        
        // when map is loaded for editing
        if (this.editorState == 0 || this.editorState == 5) { // 0 == new/load map screen OR map browser screen
            if (this.loadedMap !== null) { // if map is loaded then switch to Main Map Edit screen
                
                canvasArea.canvas.style.backgroundColor = this.loadedMap.style.backgroundColor; // set bg color here so it only triggers once not every render frame
                document.body.style.backgroundColor = this.loadedMap.style.backgroundColor;

                UserInterface.renderedButtons = UserInterface.btnGroup_mapEditorInterface;
                UserInterface.determineButtonColor()

                this.screen.x = this.loadedMap.playerStart.x;
                this.screen.y = this.loadedMap.playerStart.y;
                this.screen.width = canvasArea.canvas.width /  this.zoom
                this.screen.height = canvasArea.canvas.height / this.zoom
                this.screen.cornerX = this.screen.x - this.screen.width/2
                this.screen.cornerY = this.screen.y - this.screen.height/2

                this.editorState = 1
            }
        }

        if (this.editorState == 1 || this.editorState == 2) { // main map edit screen OR platform select screen

            // SCROLLING THE SCREEN and SETTING OBJECTS TO ANGLE SLIDERS VALUES and SETTING ZOOM TO SLIDER VALUE EVERY FRAME
            if (touchHandler.dragging == 1 &&
                !btn_translate.isPressed && 
                !btn_resize.isPressed && 
                btn_angleSlider.confirmed && 
                btn_playerAngleSlider.confirmed && 
                btn_checkpointAngleSlider.confirmed && 
                btn_snappingSlider.confirmed 
            ){
                // SCROLLING AROUND SCREEN

                if (this.scrollAmountX == null && this.scrollAmountY == null) { // starting scroll
                    this.scrollAmountX = this.screen.x;
                    this.scrollAmountY = this.screen.y;
                }

                // ZOOMING 
                if (touchHandler.zoom.isZooming) {
                     
                    this.zoom = touchHandler.zoom.ratio * this.startingZoom
                    if (this.zoom > 10) {this.zoom = 10}
                    if (this.zoom < 0.05) {this.zoom = 0.05}
                    if (Math.abs(this.zoom - 1) < 0.1) { // snapping to zoom = 1 if close
                        this.zoom = 1
                    }
                    
                    
                } else {
                    this.startingZoom = this.zoom                
                }
                
                // ACTUALLY SCROLLING THE SCREEN
                this.scrollAmountX -= touchHandler.dragAmountX / this.zoom
                this.scrollAmountY -= touchHandler.dragAmountY / this.zoom

                // sets scrollVel to average drag amount of past 10 frames
                this.scrollVelAveragerX.pushValue(-touchHandler.dragAmountX / this.zoom)
                this.scrollVelAveragerY.pushValue(-touchHandler.dragAmountY / this.zoom)

                this.scrollVelX = this.scrollVelAveragerX.getAverage()
                this.scrollVelY = this.scrollVelAveragerY.getAverage()

                this.screen.x = this.scrollAmountX;
                this.screen.y = this.scrollAmountY;
        

            } else { // not dragging around screen

                if (this.scrollAmountX != null && this.scrollAmountY != null) { // just stopped dragging
                    this.scrollAmountX = null
                    this.scrollAmountY = null

                    this.scrollVelAveragerX.clear()
                    this.scrollVelAveragerY.clear()
                }
    
                this.screen.x += this.scrollVelX
                this.screen.y += this.scrollVelY
                this.scrollVelX = (Math.abs(this.scrollVelX) > 0.1) ? this.scrollVelX * (1 - 0.05 * dt) : 0 // dampening
                this.scrollVelY = (Math.abs(this.scrollVelY) > 0.1) ? this.scrollVelY * (1 - 0.05 * dt) : 0


                // UPDATE THE ANGLE OF OBJECTS WHEN THEIR ANGLE SLIDER IS PRESSED
                if (!btn_angleSlider.confirmed) {btn_angleSlider.func()}
                if (!btn_playerAngleSlider.confirmed) {btn_playerAngleSlider.func()}
                if (!btn_checkpointAngleSlider.confirmed) {btn_checkpointAngleSlider.func()}            
            }


            // UPDATING THE other 2 SCREEN Perameters every frame incase zoom changes
            this.screen.width = canvasArea.canvas.width /  this.zoom
            this.screen.height = canvasArea.canvas.height / this.zoom
            this.screen.cornerX = this.screen.x - this.screen.width/2
            this.screen.cornerY = this.screen.y - this.screen.height/2


            // FIGURING OUT WHICH PLATFORMS TO RENDER IN MAP EDITOR
            this.renderedPlatforms = [];

            this.loadedMap.platforms.forEach(platform => { // Loop through platforms
                platform.hypotenuse = Math.sqrt(platform.width * platform.width + platform.height * platform.height)/2

                if (
                    (platform.x + platform.hypotenuse > this.screen.cornerX) && // coming into frame on left side
                    (platform.x - platform.hypotenuse < this.screen.cornerX + this.screen.width) && // right side
                    (platform.y + platform.hypotenuse + this.loadedMap.style.platformHeight > this.screen.cornerY) && // top side
                    (platform.y - platform.hypotenuse - (platform.wall ? this.loadedMap.style.wallHeight : 0) < this.screen.cornerY + this.screen.height) // bottom side
                ) {
                    this.renderedPlatforms.push(platform); // ADD platform to renderedPlatforms
                }
            });


        } // end of being in editorState 1 or 2


        // changing the editorState 
        if (this.editorState == 1 && this.selectedElements.length > 0) {
            this.editorState = 2; // platform edit state w side panel
        }

        if (this.editorState == 2 && this.selectedElements.length == 0) {
            this.editorState = 1
        }


        // UPDATING DYNAMIC BUTTONS AND SLIDERS EVERY FRAME

        if (this.editorState == 2) { // update translate and resize buttons every frame

            if (UserInterface.renderedButtons.includes(btn_translate)) {
                btn_translate.func(true)
            }
            
            if (UserInterface.renderedButtons.includes(btn_resize)) {
                btn_resize.func(true) // update tag is true -- distinguish between updates and touch releases
            }
        }

        if (this.editorState == 3) { // in map color screen
            ColorPicker.update();
            // ColorPicker.render called in MapEditor.render()
        }

        if (this.editorState == 4) { // in map settings screen
            if (!btn_platformHeightSlider.confirmed) {
                this.loadedMap.style.platformHeight = btn_platformHeightSlider.value
                PreviewWindow.update()
            }

            if (!btn_wallHeightSlider.confirmed) {
                this.loadedMap.style.wallHeight = btn_wallHeightSlider.value
                PreviewWindow.update()
            }

            if (!btn_lightDirectionSlider.confirmed) {
                this.loadedMap.style.lightDirection = btn_lightDirectionSlider.value
                PreviewWindow.update()
            }

            if (!btn_lightPitchSlider.confirmed) {
                this.loadedMap.style.lightPitch = btn_lightPitchSlider.value
                PreviewWindow.update()
            }   
        }    
    },

    saveCustomMap : async function() {

        const savemap = confirm("Save Map?");
        if (savemap) {

            const map = this.loadedMap;

            downloadMap = {};
            downloadMap.playerStart = {
                    "x": map.playerStart.x,
                    "y": map.playerStart.y,
                    "angle": map.playerStart.angle
                },
            downloadMap.checkpoints = map.checkpoints;
            downloadMap.style = {
                    "platformTopColor": map.style.platformTopColor,
                    "platformSideColor": map.style.platformSideColor,
                    "wallTopColor": map.style.wallTopColor,
                    "wallSideColor": map.style.wallSideColor,
                    "endZoneTopColor": map.style.endZoneTopColor,
                    "endZoneSideColor": map.style.endZoneSideColor,
                    "backgroundColor": map.style.backgroundColor,
                    "playerColor": map.style.playerColor,
                    "directLight": map.style.directLight ?? "rba(255,255,255)", 
                    "ambientLight" : map.style.ambientLight ?? "rba(140,184,198)",
                    "platformHeight": map.style.platformHeight,
                    "wallHeight": map.style.wallHeight,
                    "lightDirection": map.style.lightDirection,
                    "lightPitch": map.style.lightPitch 
                }
            downloadMap.platforms = [];
            map.platforms.forEach(platform => {
                downloadMap.platforms.push(
                    {
                        "x": platform.x,
                        "y": platform.y,
                        "width": platform.width,
                        "height": platform.height,
                        "angle": platform.angle,
                        "endzone": platform.endzone,
                        "wall": platform.wall,
                    }
                )
            })

            downloadMap.platforms = sortPlatforms(downloadMap.platforms)

            writeCustomMap(downloadMap, "custom_map")

        
        } else {
            exitEdit()
        }

        
        function exitEdit() {
            MapEditor.editorState = 0;
            MapEditor.loadedMap = null;
            MapEditor.screen.x = 0;
            MapEditor.screen.y = 0;
            MapEditor.screen.width = canvasArea.canvas.width;
            MapEditor.screen.height = canvasArea.canvas.height;
            MapEditor.scrollVelX = 0;
            MapEditor.scrollVelY = 0;
            MapEditor.snapAmount = 0;
            MapEditor.zoom = 1;
            MapEditor.renderedPlatforms = [];
            MapEditor.selectedElements = [];
            btn_snappingSlider.updateState(0);
            
            UserInterface.renderedButtons = UserInterface.btnGroup_mapEditorMenu
        }


        function sortPlatforms(platforms) {  // returns array of sorted platforms
            const millis = Date.now()

            // create all generated properties for each platform
            platforms.forEach( platform => {
                platform.hypotenuse = Math.sqrt(platform.width * platform.width + platform.height * platform.height)/2
                platform.angleRad = platform.angle * (Math.PI/180)
                platform.corners = [ // order: BL BR TR TL
                    // bot left corner        
                    [
                    -((platform.width / 2) * Math.cos(platform.angleRad)) - ((platform.height / 2) * Math.sin(platform.angleRad)),
                    -((platform.width / 2) * Math.sin(platform.angleRad)) + ((platform.height / 2) * Math.cos(platform.angleRad))
                    ],
        
                    // bot right corner
                    [
                    ((platform.width / 2) * Math.cos(platform.angleRad)) - ((platform.height / 2) * Math.sin(platform.angleRad)),
                    ((platform.width / 2) * Math.sin(platform.angleRad)) + ((platform.height / 2) * Math.cos(platform.angleRad))
                    ],
        
                    // top right corner
                    [
                    ((platform.width / 2) * Math.cos(platform.angleRad)) + ((platform.height / 2) * Math.sin(platform.angleRad)),
                    ((platform.width / 2) * Math.sin(platform.angleRad)) - ((platform.height / 2) * Math.cos(platform.angleRad))
                    ],
                
                    // top left corner
                    [
                    -((platform.width / 2) * Math.cos(platform.angleRad)) + ((platform.height / 2) * Math.sin(platform.angleRad)),
                    -((platform.width / 2) * Math.sin(platform.angleRad)) - ((platform.height / 2) * Math.cos(platform.angleRad))
                    ]
                ]

                function sortCornersX(a, b) {
                    // if return is negative ... a comes first 
                    // if return is positive ... b comes first
                    // return is 0... nothing is changed
                    if (a[0] < b[0]) {return -1;}
                    if (a[0] > b[0]) {return 1;}
                    return 0;
                }

                // toSorted() isnt supported by old safari i guess?
                platform.cornersSorted = [...platform.corners]
                platform.cornersSorted.sort(sortCornersX)

                // Global coordinates of left and rightmost corners
                platform.leftMostCornerX = platform.cornersSorted[0][0] + platform.x
                platform.leftMostCornerY = platform.cornersSorted[0][1] + platform.y
                
                platform.rightMostCornerX = platform.cornersSorted[3][0] + platform.x
                platform.rightMostCornerY = platform.cornersSorted[3][1] + platform.y


                // Get global coordinates of top and bot corners
                if (platform.cornersSorted[1][1] < platform.cornersSorted[2][1]) {
                    platform.topCornerX = platform.cornersSorted[1][0] + platform.x 
                    platform.topCornerY = platform.cornersSorted[1][1] + platform.y
                    platform.botCornerX = platform.cornersSorted[2][0] + platform.x
                    platform.botCornerY = platform.cornersSorted[2][1] + platform.y
                } else {
                    platform.topCornerX = platform.cornersSorted[2][0] + platform.x
                    platform.topCornerY = platform.cornersSorted[2][1] + platform.y
                    platform.botCornerX = platform.cornersSorted[1][0] + platform.x
                    platform.botCornerY = platform.cornersSorted[1][1] + platform.y
                }


                platform.getSplitLineY = function(x) {
                    // y = mx + b
                    // m = rise over run
                    const slope = (this.rightMostCornerY - this.leftMostCornerY) / (this.rightMostCornerX - this.leftMostCornerX)
                    // b = y - mx
                    const b = this.rightMostCornerY - (slope * this.rightMostCornerX) 
                    const y = slope * x + b

                    if (x > this.rightMostCornerX) {return this.rightMostCornerY} // keeps y value within the platform's bounds...
                    if (x < this.leftMostCornerX) {return this.leftMostCornerY} // ...doesnt extend the function past the corners
                    return y

                }


            })


            console.log("platforms.length = " + platforms.length)


            function test_A_below_B(a, b) {
                if (
                    (a.x + a.width/2 <= b.x + b.width/2 && a.rightMostCornerY > b.getSplitLineY(a.rightMostCornerX)) ||  // a is to the left && a's rightCorner is below/infront of b
                    (a.x + a.width/2 > b.x + b.width/2 && a.leftMostCornerY > b.getSplitLineY(a.leftMostCornerX)) // a is to the right && a's leftCorner is below/infront of b
                ) {
                    return true // a is below/infront of b
                } else {
                    return false // a is NOT below/infront of b
                }
            }


            // CREATE ADJACENCY (occludes) LIST WITHIN PLATFORM OBJECTS

            platforms.forEach((platform1, i) => {
                platform1.occludes = []
                const platform1_adjustedHeight = platform1.wall ? downloadMap.style.wallHeight : 0

                platforms.forEach((platform2, i) => {

                    const platform2_adjustedHeight = platform2.wall ? downloadMap.style.wallHeight : 0

                    // CLOSE ENOUGH TO TEST FOR OCCLUSION 
                    if ( // also should exclude checking if platform2 is already occluding platform1 -- they cant occlude each other
                        (platform1 !== platform2) &&
                        (platform1.rightMostCornerX >= platform2.leftMostCornerX && platform1.leftMostCornerX <= platform2.rightMostCornerX) && // infront of each other horizontally

                        (platform1.topCornerY - platform1_adjustedHeight <= platform2.botCornerY + downloadMap.style.platformHeight) &&
                        (platform1.botCornerY + downloadMap.style.platformHeight >= platform2.topCornerY - platform2_adjustedHeight)
                    ) {
                        if (test_A_below_B(platform1, platform2)) {
                            platform1.occludes.push(platforms.indexOf(platform2))
                        }

                    }
                })
            })



            function topologicalSort(platforms) {
                const visited = new Set(); // list of all the already visited platforms. Set is quick to search through and prevents duplicates
                const sorted = [];



                function dfs(platform) { // Depth-First Search
                    visited.add(platform);

                    platform.occludes.forEach((occluded_platform_index) => { // loop through each platform that is occluded by this "key" platform
                        if (!visited.has(platforms[occluded_platform_index])) { // if havent visited this constraint_platform
                            dfs(platforms[occluded_platform_index]); // recursive call of dfs to go deeper into the tree
                        }
                    })

                    sorted.push(platform); // if cant go deeper then add this platform to the sorted array
                }


                platforms.forEach((platform, i) => { // loop through each platform in platforms array
                    if (!visited.has(platform)) {
                        dfs(platform);
                    }
                })

                return sorted;
            }


            const sortedPlatforms = topologicalSort(platforms);

            console.log("finished sort in: " + (Date.now() - millis) + "ms")

            // sort the actual platforms based on these sorted indexes
            return sortedPlatforms
        }


        async function writeCustomMap(exportObj, exportName) {
            console.log("WRITING MAP NOW!")
            exportName = prompt("Enter Map Name");

            const mapBlob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
            await UserInterface.writeFile(exportName + ".json", mapBlob, "maps")
            console.log("Successful Map Save");
            exitEdit()
            
        }
    },

    adjustPlatforms : function() { // DEBUG TOOL USED TO SHIFT EVERY PLATFORM OVER BY HALF ITS WIDTH AND HEIGHT kill once all are adjusted
        this.loadedMap.platforms.forEach(platform => {
            platform.x += platform.width/2
            platform.y += platform.height/2
        })
    },

    newLighting : function() { // debug kill
        this.loadedMap.style.lightDirection = this.loadedMap.style.lightAngle ?? 90 
        this.loadedMap.style.lightPitch = this.loadedMap.style.shadowLength ?? 89
    }
}


const AudioHandler = {

    
    init : function() {

        // FROM: https://github.com/apache/cordova-plugin-media/issues/182
        // Need to unescape if path have '%20' component
        var menuMusic_path = decodeURI(cordova.file.applicationDirectory) + "www/assets/audio/menuMusic.wav";
        var successAudio_path = decodeURI(cordova.file.applicationDirectory) + "www/assets/audio/success.mp3";
        var jumpAudio_path = decodeURI(cordova.file.applicationDirectory) + "www/assets/audio/jump.mp3";
        var splashAudio_path = decodeURI(cordova.file.applicationDirectory) + "www/assets/audio/splash.mp3";

        // iOS need to remove file://
        // could use a for loop here. Just throw all the sounds into an array?
        if (device.platform.toLowerCase() == "ios") {
            menuMusic_path = menuMusic_path.replace("file://", "");
            successAudio_path = successAudio_path.replace("file://", "");
            jumpAudio_path = jumpAudio_path.replace("file://", "")
            splashAudio_path = splashAudio_path.replace("file://", "")
        }


        // setRate(1) in onSuccess callbacks to counter caching workaround which sets Rate(9999) to play the audio silently at the start of game.
        this.menuMusic = new Media(menuMusic_path, null, (error) => {console.log(error);});
        this.successAudio = new Media(successAudio_path, function(){AudioHandler.successAudio.setRate(1)}, (error) => {console.log(error);});
        this.jumpAudio = new Media (jumpAudio_path, function(){AudioHandler.jumpAudio.setRate(1)}, (error) => {console.log(error);})
        this.splashAudio = new Media (splashAudio_path, function(){AudioHandler.splashAudio.setRate(1)}, (error) => {console.log(error);})


        // PLAY ALL SOUNDS REALLY QUICKLY TO CACHE THEM
        this.jumpAudio.setRate(999)
        this.jumpAudio.play()

        this.successAudio.setRate(999)
        this.successAudio.play()

        this.splashAudio.setRate(999)
        this.splashAudio.play()
        
        // SET CORRECT VOLUMES
        this.setVolumes();
        this.menuMusic.play()
    },



    setVolumes : function() {

        this.menuMusic.setVolume(UserInterface.settings.volume);
        this.successAudio.setVolume(UserInterface.settings.volume);
        this.jumpAudio.setVolume(UserInterface.settings.volume);
        this.splashAudio.setVolume(UserInterface.settings.volume);
    },
}


const Map = {
    walls : [],
    renderedPlatforms : [],
    wallsToCheck : [],
    endZonesToCheck : [],
    name : null,
    upperShadowClip : new Path2D(),
    endZoneShadowClip : new Path2D(),
    playerClip : new Path2D(), // calculated every frame
    // endZone : null,

    initMap : function (name) { // initializing a normal map (not custom)
        this.platforms = [];
        this.playerStart = null;
        this.style = null;
        this.checkpoints = [];
        this.upperShadowClip = new Path2D()
        this.endZoneShadowClip = new Path2D()
        this.name = name;
        
        // GET MAP DIRECTLY THROUGH CORDOVA LOCAL STORAGE  (NORMAL MAP)          
        const mapURL = cordova.file.applicationDirectory + "www/assets/maps/"
        
        window.resolveLocalFileSystemURL(mapURL, (dirEntry) => {

            dirEntry.getFile(name + ".json", {create: false, exclusive: false}, (fileEntry) => {
                console.log("fileEntry:")
                console.log(fileEntry)

                fileEntry.file( (file) => {

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        this.parseMapData(JSON.parse(e.target.result))
                    };
                    reader.onerror = (e) => alert(e.target.error.name);
        
                    reader.readAsText(file)
                })
            })
        })  

    },

    initCustomMap : async function (name) { // initializing a custom map
        this.platforms = [];
        this.playerStart = null;
        this.style = null;
        this.checkpoints = [];
        this.upperShadowClip = new Path2D()
        this.endZoneShadowClip = new Path2D()
        this.name = name;

        
        const mapDataRaw = await UserInterface.readFile(name + ".json", "maps");
        this.parseMapData(JSON.parse(mapDataRaw))
        
    },



    // Big function that parses the map data, sets up lighting, shadows, shadow clips, etc
    // Called within getJsonData Function to maintain corect order of events
    parseMapData : function (jsonData) {
        
        this.playerStart = jsonData.playerStart;
        this.style = jsonData.style;
        this.checkpoints = jsonData.checkpoints; // returns an object

        jsonData.platforms.forEach(platform => { // LOOP THROUGH DATA AND ADD EACH PLATFORM TO AN ARRAY
            this.platforms.push(platform);
        });



        // Calculate lighting and shadows for each platform and the endzone

        // turning lightDirection integer into a Vector
        this.style.lightDirectionVector = new Vector(Math.cos(this.style.lightDirection * (Math.PI/180)), Math.sin(this.style.lightDirection * (Math.PI/180)))

        // lightPitch is actually sun's angle between 0 -> 89
        const sunAngle = this.style.lightPitch
        const shadowX = this.style.lightDirectionVector.x * Math.tan(sunAngle * Math.PI / 180) * this.style.platformHeight
        const shadowY = this.style.lightDirectionVector.y * Math.tan(sunAngle * Math.PI / 180) * this.style.platformHeight


        let platformIndex = 0 // set this so that it is z-order
        this.platforms.forEach(platform => { // CALCULATE PLATFORMS COLORS and SHADOW POLYGON

            // Setting the colors for platforms, endzones, and walls
            let colorToUse1 = this.style.platformTopColor;
            let colorToUse2 = this.style.platformSideColor;

            if (platform.endzone) {
                colorToUse1 = this.style.endZoneTopColor;
                colorToUse2 = this.style.endZoneSideColor;
                // this.endZone = platform;
            }
            if (platform.wall) {
                colorToUse1 = this.style.wallTopColor;
                colorToUse2 = this.style.wallSideColor;
                this.walls.push(platform);
            }

            platform.index = platformIndex; // asigns an index to each platform for debugging
            platformIndex ++;

            // PLATFORM COLORS
            side1Vec = new Vector(-1,0).rotate(platform.angle)
            side2Vec = new Vector(0,1).rotate(platform.angle)
            side3Vec = new Vector(1,0).rotate(platform.angle)

            const litPercent1 = side1Vec.angleDifference(this.style.lightDirectionVector) / Math.PI // dividing by PI converts angleDiffernce to between 0->1
            const litPercent2 = side2Vec.angleDifference(this.style.lightDirectionVector) / Math.PI            
            const litPercent3 = side3Vec.angleDifference(this.style.lightDirectionVector) / Math.PI

            platform.shaded_topColor = canvasArea.getShadedColor(colorToUse1, 1)
            platform.shaded_sideColor1 = canvasArea.getShadedColor(colorToUse2, litPercent1)
            platform.shaded_sideColor2 = canvasArea.getShadedColor(colorToUse2, litPercent2)
            platform.shaded_sideColor3 = canvasArea.getShadedColor(colorToUse2, litPercent3)

            // SHADOW POLYGON
            const angleRad = platform.angle * (Math.PI/180);

            let wallShadowMultiplier
            if (platform.wall && this.style.platformHeight > 0) {
                wallShadowMultiplier = 1 + (this.style.wallHeight / this.style.platformHeight)
            } else {
                wallShadowMultiplier = 1
            }

            platform.shadowPoints = [ // ALL THE POSSIBLE POINTS TO INPUT IN CONVEX HULL FUNCTION. OPTIMIZE already have come of these points saved to map
            
                // bot left corner
                [
                -((platform.width / 2) * Math.cos(angleRad)) - ((platform.height / 2) * Math.sin(angleRad)),
                -((platform.width / 2) * Math.sin(angleRad)) + ((platform.height / 2) * Math.cos(angleRad)) + this.style.platformHeight
                ],

                // bot right corner
                [
                ((platform.width / 2) * Math.cos(angleRad)) - ((platform.height / 2) * Math.sin(angleRad)),
                ((platform.width / 2) * Math.sin(angleRad)) + ((platform.height / 2) * Math.cos(angleRad)) + this.style.platformHeight
                ],

                // top right corner
                [
                ((platform.width / 2) * Math.cos(angleRad)) + ((platform.height / 2) * Math.sin(angleRad)),
                ((platform.width / 2) * Math.sin(angleRad)) - ((platform.height / 2) * Math.cos(angleRad)) + this.style.platformHeight
                ],
            
                // top left corner
                [
                -((platform.width / 2) * Math.cos(angleRad)) + ((platform.height / 2) * Math.sin(angleRad)),
                -((platform.width / 2) * Math.sin(angleRad)) - ((platform.height / 2) * Math.cos(angleRad)) + this.style.platformHeight
                ],
            
                // bot left SHADOW
                [
                -((platform.width / 2) * Math.cos(angleRad)) - ((platform.height / 2) * Math.sin(angleRad)) + shadowX * wallShadowMultiplier,
                -((platform.width / 2) * Math.sin(angleRad)) + ((platform.height / 2) * Math.cos(angleRad)) + this.style.platformHeight + shadowY * wallShadowMultiplier
                ],

                // bot right SHADOW
                [
                ((platform.width / 2) * Math.cos(angleRad)) - ((platform.height / 2) * Math.sin(angleRad)) + shadowX * wallShadowMultiplier,
                ((platform.width / 2) * Math.sin(angleRad)) + ((platform.height / 2) * Math.cos(angleRad)) + this.style.platformHeight + shadowY * wallShadowMultiplier
                ],
                
                // top right SHADOW
                [
                ((platform.width / 2) * Math.cos(angleRad)) + ((platform.height / 2) * Math.sin(angleRad)) + shadowX * wallShadowMultiplier,
                ((platform.width / 2) * Math.sin(angleRad)) - ((platform.height / 2) * Math.cos(angleRad)) + this.style.platformHeight + shadowY * wallShadowMultiplier
                ],

                // top left SHADOW
                [
                -((platform.width / 2) * Math.cos(angleRad)) + ((platform.height / 2) * Math.sin(angleRad)) + shadowX * wallShadowMultiplier,
                -((platform.width / 2) * Math.sin(angleRad)) - ((platform.height / 2) * Math.cos(angleRad)) + this.style.platformHeight + shadowY * wallShadowMultiplier
                ],
            
            ]; // end of shadowPoints array
        

            // add a .clipPoints property to each wall for occluding player and drawing players xray
            if (platform.wall) {
            
                // corners + wall height points need to be "concated" as serperate variable otherwise they dont stay as points
                const upperCorners = [
                    [
                        platform.corners[0][0],
                        platform.corners[0][1] - this.style.wallHeight
                    ],
                    [
                        platform.corners[1][0],
                        platform.corners[1][1] - this.style.wallHeight
                    ],
                    [
                        platform.corners[2][0],
                        platform.corners[2][1] - this.style.wallHeight
                    ],
                    [
                        platform.corners[3][0],
                        platform.corners[3][1] - this.style.wallHeight
                    ],
                ] 

                let behindWallClipPoints = platform.corners.concat(upperCorners)
        
                platform.clipPoints = canvasArea.convexHull(behindWallClipPoints)
            }
        

            platform.shadowPoints = canvasArea.convexHull(platform.shadowPoints)


            // SETS EITHER OF THE TWO SHADOW CLIPS FOR UPPER PLAYER SHADOW
            const clipToUse = platform.endzone ? this.endZoneShadowClip : this.upperShadowClip // get shadow clip to add this platform to

            clipToUse.moveTo( // bot left
                platform.x + platform.corners[0][0], // x
                platform.y + platform.corners[0][1] // y
            )
            
            clipToUse.lineTo( // bot right
                platform.x + platform.corners[1][0],
                platform.y + platform.corners[1][1]
            )

            clipToUse.lineTo( // top right
                platform.x + platform.corners[2][0],
                platform.y + platform.corners[2][1]
            )

            clipToUse.lineTo( // top left
                platform.x + platform.corners[3][0],
                platform.y + platform.corners[3][1]
            )

            clipToUse.closePath()


            platform.getSplitLineY = function(x) {
                // y = mx + b
                // m = rise over run
                const slope = (platform.rightMostCornerY - platform.leftMostCornerY) / (platform.rightMostCornerX - platform.leftMostCornerX)
                // b = y - mx
                const b = platform.rightMostCornerY - (slope * platform.rightMostCornerX) 
                const y = slope * x + b
                return y
            }
        

        }); // end of looping thrugh each platform

        // calculate all other map colors
        this.style.shaded_playerColor = canvasArea.getShadedColor(this.style.playerColor, 1)
        this.style.shaded_backgroundColor = canvasArea.getShadedColor(this.style.backgroundColor, 1)

        this.style.shadow_platformColor = canvasArea.getShadedColor(this.style.platformTopColor, 0.2) // 0.2 instead of 0 to pretend there's bounce lighting
        this.style.shadow_endzoneColor = canvasArea.getShadedColor(this.style.endZoneTopColor, 0.2)
        this.style.shadow_backgroundColor = canvasArea.getShadedColor(this.style.backgroundColor, 0.2)
        

        canvasArea.canvas.style.backgroundColor = this.style.shaded_backgroundColor;
        document.body.style.backgroundColor = this.style.shaded_backgroundColor;
        player = new Player(this.playerStart.x, this.playerStart.y, this.playerStart.angle);

        UserInterface.determineButtonColor();
        UserInterface.mapLoaded(); // moves onto gamestate 6
        
    },


    update : function() {  // Figure out which platforms are in view. Updates playerClip, wallsToCheck, and endZonesToCheck

        this.renderedPlatforms = [];
        this.wallsToCheck = [];
        this.endZonesToCheck = [];

        this.platforms.forEach(platform => { // Loop through ALL platforms to get renderedPlatforms

            const adjustedHeight = platform.wall ? this.style.wallHeight : 0 // for adding height to walls

            let wallShadowMultiplier
            if (platform.wall && this.style.platformHeight > 0) {
                wallShadowMultiplier = 1 + (this.style.wallHeight / this.style.platformHeight)
            } else {
                wallShadowMultiplier = 1
            }


            const shadowLength = Math.tan(this.style.lightPitch * Math.PI / 180) * this.style.platformHeight

            if (
                (platform.x - platform.hypotenuse - (shadowLength * wallShadowMultiplier) < player.x + midX) && // right side
                (platform.x + platform.hypotenuse + (shadowLength * wallShadowMultiplier) > player.x - midX) && // coming into frame on left side
                (platform.y + platform.hypotenuse + (shadowLength * wallShadowMultiplier) + this.style.platformHeight > player.y - midY) && // top side
                (platform.y - platform.hypotenuse - (shadowLength * wallShadowMultiplier) - adjustedHeight < player.y + midY) // bottom side
            ) {
                this.renderedPlatforms.push(platform); // ADD platform to renderedPlatforms
            }
        }); // end of looping through ALL platforms


        this.playerClip = new Path2D() // resets the clip every frame. when it is used there must be an counter clockwise rectangle drawn first to invert clip

        //this.endZoneIsRendered = false; // resets every frame. if one of renderedPlatforms is an endzone then its made true

        this.renderedPlatforms.forEach(platform => { // Loop through RENDERED platforms (will loop through in order of index)
                                    
            if (platform.wall) {
                
                if ( // if wall is close enough to player that it needs to be checked with player rotation
                    (platform.x + platform.hypotenuse > player.x - 25) && // colliding with player from left
                    (platform.x - platform.hypotenuse < player.x + 25) && // right side
                    (platform.y + platform.hypotenuse > player.y - 73) && // top side
                    (platform.y - platform.hypotenuse - this.style.wallHeight < player.y + 25) // bottom side
                ) { // test for player overlap and rendering z-order tests
                    
                    this.wallsToCheck.push(platform) // for checking if player is colliding with walls in player.updatePos()

                    // convert player angle and get radian version
                    const angle = player.lookAngle.getAngle();
                    const angleRad = angle * (Math.PI/180);

                    // GET PLAYERS LEFTMOST AND RIGHT MOST CORNERS
                    player.leftMostPlayerCornerX = null
                    player.leftMostPlayerCornerY = null
                    player.rightMostPlayerCornerX = null
                    player.rightMostPlayerCornerY = null
                    if (0 <= angle && angle < 90) { // leftMost=bot left        rightMost=top right 
                        player.leftMostPlayerCornerX = player.x - (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad)))
                        player.leftMostPlayerCornerY = player.y - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad)))
                        player.rightMostPlayerCornerX = player.x + (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad)))
                        player.rightMostPlayerCornerY = player.y + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad)))
                    }
                    if (90 <= angle && angle < 180) { // leftMost=bot right     rightMost=top left
                        player.leftMostPlayerCornerX = player.x + (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad)))
                        player.leftMostPlayerCornerY = player.y + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad)))
                        player.rightMostPlayerCornerX = player.x - (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad)))
                        player.rightMostPlayerCornerY = player.y - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad)))
                    }
                    if (180 <= angle && angle < 270) { // leftMost=top right    rightMost=bot left 
                        player.leftMostPlayerCornerX = player.x + (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad)))
                        player.leftMostPlayerCornerY = player.y + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad)))
                        player.rightMostPlayerCornerX = player.x - (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad)))
                        player.rightMostPlayerCornerY = player.y - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad)))
                    }
                    if (270 <= angle && angle < 360) { // leftMost=top left     rightMost=bot right
                        player.leftMostPlayerCornerX = player.x - (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad)))
                        player.leftMostPlayerCornerY = player.y - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad)))
                        player.rightMostPlayerCornerX = player.x + (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad)))
                        player.rightMostPlayerCornerY = player.y + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad)))
                    }

                    

                    // NEW TEST FOR WHETHER OR NOT TO ADD WALL PLATFORM TO CLIP
                    if (
                        (player.x <= platform.x && player.rightMostPlayerCornerY < platform.getSplitLineY(player.rightMostPlayerCornerX)) ||  
                        (player.x > platform.x && player.leftMostPlayerCornerY < platform.getSplitLineY(player.leftMostPlayerCornerX))
                    ) {
                        addToPlayerClip()
                    }


                    // ADD TO CLIP SHAPE FOR AREAS BEHIND WALLS
                    function addToPlayerClip() {
                        // the clipPoints array can have different lengths so it must dynamicly go through the array of points
                        for (let i = 0; i < platform.clipPoints.length; i++) {
                            if (i == 0) { // first point in array so use moveTo

                                // -player.x + midX, -player.y + midY

                                Map.playerClip.moveTo(
                                    platform.x + platform.clipPoints[i][0], // x
                                    platform.y + platform.clipPoints[i][1] // y
                                )
                            } else { // its not the first point in the hull so use lineTo
                                Map.playerClip.lineTo(
                                    platform.x + platform.clipPoints[i][0], // x
                                    platform.y + platform.clipPoints[i][1] // y
                                )
                            }
                        }

                        Map.playerClip.closePath()
                    }

                }   
            }

            if (platform.endzone) {
                this.endZonesToCheck.push(platform);
                //this.endZoneIsRendered = true;
            }
        }); // end of looping through each rendered platform

    },


    renderPlatform : function(platform) { // seperate function to render platforms so that it can be called at different times (ex. called after drawing player inorder to render infront)
        
        const ctx = canvasArea.ctx;        
        
        // DRAW PLATFORM TOP
        ctx.save(); // #17 GO TO PLATFORMs MIDDLE AND ROTATING 
        const adjustedHeight = platform.wall ? this.style.wallHeight : 0 // for adding height to walls
        ctx.translate(platform.x, platform.y - adjustedHeight);
        ctx.rotate(platform.angle * Math.PI/180);

        ctx.fillStyle = platform.shaded_topColor;        
        
        ctx.fillRect(-platform.width/2, -platform.height/2, platform.width, platform.height);

        ctx.restore(); // #17 restores platform translation and rotation


        // SIDES OF PLATFORMS
        ctx.save(); // #18
        ctx.translate(platform.x, platform.y);

        const angleRad = platform.angle * (Math.PI/180);
        
        // platform angles should only be max of 90 and -90 in mapData
        // calculating shading works with any angle but sides arent draw because drawing "if statements" are hardcoded to 90 degrees

        // OPTIMIZE could use the platform.corners array istead of calculating every frame

        if (-90 < platform.angle && platform.angle < 90) { // ALMOST ALWAYS RENDER BOTTOM SIDE. side2
            
            ctx.fillStyle = platform.shaded_sideColor2;
            ctx.beginPath();
            ctx.moveTo(platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) - adjustedHeight); // bot right
            ctx.lineTo(-platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), -platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) - adjustedHeight); // bot left
            ctx.lineTo(-platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), -platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) + this.style.platformHeight);
            ctx.lineTo(platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) + this.style.platformHeight);
            ctx.closePath();
            ctx.fill();
        }


        if (0 < platform.angle && platform.angle <= 90) { // side3

            ctx.fillStyle = platform.shaded_sideColor3; // sideColor3
            ctx.beginPath();
            ctx.moveTo(platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) - adjustedHeight); // bot right
            ctx.lineTo(platform.width/2 * Math.cos(angleRad) + (platform.height/2 * Math.sin(angleRad)), platform.width/2 * Math.sin(angleRad) - (platform.height/2 * Math.cos(angleRad)) - adjustedHeight); // top right
            ctx.lineTo(platform.width/2 * Math.cos(angleRad) + (platform.height/2 * Math.sin(angleRad)), platform.width/2 * Math.sin(angleRad) - (platform.height/2 * Math.cos(angleRad)) + this.style.platformHeight);
            ctx.lineTo(platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) + this.style.platformHeight);
            ctx.closePath();
            ctx.fill();
        }

        if (-90 <= platform.angle && platform.angle < 0) { // side1

            ctx.fillStyle = platform.shaded_sideColor1; // sideColor1  
            ctx.beginPath();
            ctx.moveTo(-platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), -platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) - adjustedHeight); // bot left
            ctx.lineTo(-platform.width/2 * Math.cos(angleRad) + (platform.height/2 * Math.sin(angleRad)), -platform.width/2 * Math.sin(angleRad) - (platform.height/2 * Math.cos(angleRad)) - adjustedHeight); // top left
            ctx.lineTo(-platform.width/2 * Math.cos(angleRad) + (platform.height/2 * Math.sin(angleRad)), -platform.width/2 * Math.sin(angleRad) - (platform.height/2 * Math.cos(angleRad)) + this.style.platformHeight);
            ctx.lineTo(-platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), -platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) + this.style.platformHeight);
            ctx.closePath();
            ctx.fill();
        }


        // PLAFORM RENDERING DEBUG TEXT
        if (UserInterface.settings.debugText == 1) {
            ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1 :  UserInterface.lightColor_1;
            ctx.font = "12px BAHNSCHRIFT"
            ctx.fillText(platform.index, 0 - canvasArea.ctx.measureText(platform.index).width / 2, 0);
            // ctx.fillText("renderIndex: " + this.renderedPlatforms.indexOf(platform), 0, 0)
            // ctx.fillText("angle: " + platform.angle, 0, 20);
            // ctx.fillText("position: " + platform.x + ", " + platform.y, 0 , 20)
            // ctx.fillText("width / height: " + platform.width + ", " + platform.height, 0 , 40)
        }

        
        ctx.restore(); // #18 back to map origin translation
        
        // Drawing wall split line
        // if (platform.wall) {
        //     ctx.fillStyle = "#00FF00"
        //     ctx.fillRect(player.x, platform.getSplitLineY(player.x), 5, 5)
        // }
        

        // Drawing split line
        // ctx.strokeStyle = "#00FF00"
        // ctx.lineWidth = 1
        // ctx.beginPath()
        // ctx.moveTo(platform.leftMostCornerX, platform.leftMostCornerY)
        // ctx.lineTo(platform.rightMostCornerX, platform.rightMostCornerY)
        // ctx.stroke()

    },

    render : function() { // Renders player lower shadow, platforms shadows, platforms, and checkpoints


        const ctx = canvasArea.ctx;

        ctx.save(); // #19
        ctx.translate(-player.x + midX, -player.y + midY); // move canvas when drawing platforms then restore. midX is center of canvas width


        // DRAWING LOWER PLAYER SHADOW
        ctx.save(); // #20
        ctx.translate(player.x , player.y + this.style.platformHeight)
        ctx.rotate(player.lookAngle.getAngle() * Math.PI/180); // rotating canvas
        ctx.fillStyle = this.style.shadow_backgroundColor;
        ctx.fillRect(-15, -15, 30, 30)
        ctx.restore(); // #20



        // LOOP THROUGH TO DRAW PLATFORMS SHADOWS
        this.renderedPlatforms.forEach(platform => { 

            ctx.save(); // #21
            ctx.translate(platform.x, platform.y);

            ctx.fillStyle = this.style.shadow_backgroundColor;

            ctx.beginPath();
            
            ctx.moveTo(platform.shadowPoints[0][0], platform.shadowPoints[0][1]); // this comes up in debug a lot
            for (let i = platform.shadowPoints.length - 1; i > 0; i --) {
                ctx.lineTo(platform.shadowPoints[i][0], platform.shadowPoints[i][1]);
            }

            ctx.closePath();
            ctx.fill();


            ctx.restore(); // #21
        })


        // Draw each rendered platform
        this.renderedPlatforms.forEach(platform => {
            Map.renderPlatform(platform)
        })


        // Draw checkpoints
        if (UserInterface.settings.debugText == 1) {
            this.checkpoints.forEach(checkpoint => { 
                ctx.strokeStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1 
                ctx.lineWidth = 4
                ctx.beginPath(); 
                ctx.moveTo(checkpoint.triggerX1, checkpoint.triggerY1);
                ctx.lineTo(checkpoint.triggerX2, checkpoint.triggerY2);
                ctx.stroke();
            });
        }


        ctx.restore(); // #19
    
    },
}


class InputHandler {
    dragAmountX = 0;
    dragAmountY = 0;
    dragging = false;

    zoom = {
        isZooming : false,
        x : null, // middle point between the two zooming fingers
        y : null,
        startLength : null,
        ratio : null,
    }

    touches = []; 
    averageDragX = new Averager(30)
    averageDragY = new Averager(30)


    constructor() {

        window.addEventListener("touchstart", e => {
            e.preventDefault() // attempt to suppress highlighting magnifing glass (didnt work on old ios)
            
            for (let i = 0; i < e.changedTouches.length; i++){ // for loop needed incase multiple touches are sent in the same frame

                const touch = {
                    identifier : e.changedTouches[i].identifier,
                    x : e.changedTouches[i].pageX * canvasArea.scale,
                    y : e.changedTouches[i].pageY * canvasArea.scale,
                    startX : e.changedTouches[i].pageX * canvasArea.scale, // used by strafe helper hud
                    startY : e.changedTouches[i].pageY * canvasArea.scale,
                    previousX : e.changedTouches[i].pageX * canvasArea.scale,
                    previousY : e.changedTouches[i].pageY * canvasArea.scale,
                }

                if (this.dragging == false) {this.dragging = true}

                UserInterface.touchStarted(touch.x, touch.y); // sends touchStarted for every touchStart
                
                this.touches.push(touch)
            }
            
            if (UserInterface.gamestate == 7 && this.touches.length >= 2) { // If in map editor 
                this.zoom.isZooming = true
                this.zoom.x = (this.touches[0].x + this.touches[1].x) / 2 
                this.zoom.y = (this.touches[0].y + this.touches[1].y) / 2
                this.zoom.startLength = Math.sqrt((this.touches[1].x - this.touches[0].x) ** 2 + (this.touches[1].y - this.touches[0].y) ** 2)
                this.zoom.ratio = 1
            }
        });


        window.addEventListener("touchmove", e => {
            for (let i = 0; i < e.changedTouches.length; i++){ // for loop needed incase multiple touches are sent in the same frame

                const touch = {
                    identifier : e.changedTouches[i].identifier,
                    x : e.changedTouches[i].pageX * canvasArea.scale,
                    y : e.changedTouches[i].pageY * canvasArea.scale,
                }

                // updating this touch within this.touches
                const touchIndex = this.touches.findIndex(t => t.identifier == touch.identifier)
                this.touches[touchIndex].previousX = this.touches[touchIndex].x
                this.touches[touchIndex].previousY = this.touches[touchIndex].y
                this.touches[touchIndex].x = touch.x
                this.touches[touchIndex].y = touch.y
            }

            if (this.zoom.isZooming) {
                this.zoom.x = (this.touches[0].x + this.touches[1].x) / 2 
                this.zoom.y = (this.touches[0].y + this.touches[1].y) / 2
                let currentLength = Math.sqrt((this.touches[1].x - this.touches[0].x) ** 2 + (this.touches[1].y - this.touches[0].y) ** 2)
                this.zoom.ratio = currentLength / this.zoom.startLength 
            }

        });


        window.addEventListener("touchcancel", e => { // Fixes tripple tap bugs by reseting everything
            this.dragging = false;
            this.touches = [] // this could cause issues i think
            this.zoom.isZooming = false
        });

        window.addEventListener("touchend", e => {

            for (let i = 0; i < e.changedTouches.length; i++) { // for loop needed incase multiple touches are sent in the same frame

                const touch = {
                    identifier : e.changedTouches[i].identifier,
                    x : e.changedTouches[i].pageX * canvasArea.scale,
                    y : e.changedTouches[i].pageY * canvasArea.scale,
                }

                const touchIndex = this.touches.findIndex(t => t.identifier == touch.identifier)

                if (this.dragging && touchIndex == 0) { // if this is the primary/first/oldest touch
                    
                    // released current drag
                    this.averageDragX.clear()
                    this.averageDragY.clear()

                    if (e.touches.length == 0) { // if theres no other drags to switch to
                        this.dragAmountX = 0;
                        this.dragAmountY = 0;
                        this.dragging = false;
                    }
                }

                // removing this touch within this.touches
                if (touchIndex > -1) { // only splice array when item is found
                    this.touches.splice(touchIndex, 1); // 2nd parameter means remove one item only
                }

                UserInterface.touchReleased(touch.x, touch.y); // sends touchRealease for every release

            }

            if (this.zoom.isZooming && this.touches.length < 2) { // stop zooming if less than two touches
                this.zoom.isZooming = false
                this.zoom.x = null
                this.zoom.y = null
                this.zoom.startLength = null
                this.zoom.ratio = null
            }

        });
    }

    update() {
        if (!this.zoom.isZooming && this.touches.length >= 1) {
            this.dragAmountX = this.touches[0].x - this.touches[0].previousX;
            this.dragAmountY = this.touches[0].y - this.touches[0].previousY;

            this.touches[0].previousX = this.touches[0].x;
            this.touches[0].previousY = this.touches[0].y;
        } 
        
        if (this.zoom.isZooming && this.touches.length >= 2) { // pan using center of screen in map editor
            
            const zoomMidX = (this.touches[0].x + this.touches[1].x) / 2
            const zoomMidX_prev = (this.touches[0].previousX + this.touches[1].previousX) / 2
            const zoomMidY = (this.touches[0].y + this.touches[1].y) / 2
            const zoomMidY_prev = (this.touches[0].previousY + this.touches[1].previousY) / 2

            this.dragAmountX = zoomMidX - zoomMidX_prev;
            this.dragAmountY = zoomMidY - zoomMidY_prev;

            this.touches[0].previousX = this.touches[0].x;
            this.touches[0].previousY = this.touches[0].y;
            this.touches[1].previousX = this.touches[1].x;
            this.touches[1].previousY = this.touches[1].y;
        } 
        
        this.averageDragX.pushValue(this.dragAmountX)
        this.averageDragY.pushValue(this.dragAmountY)
    }

}


class Player {
    jumpValue = 0;
    jumpVelocity = 2;
    endSlow = 1;
    gain = 0;
    checkpointIndex = -1;

    // debug
    collisionPointDebug = {x: 0, y: 0}
    collisionNormalDebug = {x: 0, y: 0}

    currentSpeedProjected = 0;
    addSpeed = 0; // initialized here so that userInterface can access for debug

    // new movement code that uses real quake / source movement
    // https://adrianb.io/2015/02/14/bunnyhop.html
    // https://www.youtube.com/watch?v=v3zT3Z5apaM
    // https://www.youtube.com/watch?v=rTsXO6Zicls
    // https://www.youtube.com/watch?v=rTsXO6Zicls
    // https://steamcommunity.com/sharedfiles/filedetails/?id=184184420
    // https://github.com/myria666/qMovementDoc/blob/main/Quake_s_Player_Movement.pdf

    wishDir = new Vector(0,0);  // left (-1,0) vector OR right (1,0) vector that is rotated by the change in angle that frame. 
                                // if angle change is postive use Right vec. Negative use left vec
                                // normalized left and right vectors act as if strafe keys were pressed 

    velocity = new Vector(0,0);

    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.restartX = x;
        this.restartY = y;
        this.lookAngle = new Vector(1,0)
        this.lookAngle = this.lookAngle.rotate(angle)
        this.restartAngle = angle;
    }

    render() {
        
        const ctx = canvasArea.ctx;
        
        ctx.save() // #21.5
        
        // create inverted playerClip so not drawn behind walls
        const clipPathCombo = new Path2D()
        clipPathCombo.moveTo(0, 0)
        clipPathCombo.lineTo(0, canvasArea.canvas.height)
        clipPathCombo.lineTo(canvasArea.canvas.width, canvasArea.canvas.height)
        clipPathCombo.lineTo(canvasArea.canvas.width, 0)
        clipPathCombo.closePath()

        clipPathCombo.addPath(Map.playerClip, new DOMMatrix([1, 0, 0, 1, -player.x + midX, -player.y + midY]))
        
        // Draw playerClip DEBUG
        // ctx.lineWidth = 5
        // ctx.strokeStyle = "#00ff00"
        // ctx.stroke(clipPathCombo)
        
        ctx.clip(clipPathCombo)


        ctx.save(); // #22
        ctx.translate(midX, midY);


        // LOWER SHADOW IS DRAWN BY MAP
        // DRAWING UPPER SHADOW HERE \/ (drawn twice while over platform or over endzone)
        ctx.save() // #23
        
        ctx.translate(-player.x, -player.y)
        
        // Draw standard shadowClip DEBUG
        // ctx.lineWidth = 5
        // ctx.strokeStyle = "#00ff00"
        // ctx.stroke(Map.upperShadowClip)
        
        ctx.clip(Map.upperShadowClip);
        ctx.translate(player.x , player.y);
    
        ctx.rotate(this.lookAngle.getAngle() * Math.PI/180)

        ctx.fillStyle = Map.style.shadow_platformColor;
        ctx.fillRect(-15, -15, 30, 30)

        ctx.restore() // #23 clears upperShadowClip

        if (Map.endZonesToCheck.length > 0) { // draw a clipped version of the players shadow over endzone
            ctx.save() // #23.5
            
            ctx.translate(-player.x, -player.y)
            
            // Draw endZoneShadowClip DEBUG
            // ctx.lineWidth = 3
            // ctx.strokeStyle = "#0000ff"
            // ctx.stroke(Map.endZoneShadowClip)
            
            ctx.clip(Map.endZoneShadowClip);
            ctx.translate(player.x , player.y);

            ctx.rotate(this.lookAngle.getAngle() * Math.PI/180)

            ctx.fillStyle = Map.style.shadow_endzoneColor;
            ctx.fillRect(-15, -15, 30, 30)

            ctx.restore() // #23.5 clears endZoneShadowClip
        }




        // DRAWING PLAYER TOP
        ctx.translate(0, -this.jumpValue - 32); 
        ctx.rotate(this.lookAngle.getAngle() * Math.PI/180) // rotating canvas
        ctx.fillStyle = Map.style.shaded_playerColor;
        ctx.fillRect(-16,-16,32,32)

        // Draw players top arrow
        ctx.strokeStyle = "#00000030";
        ctx.lineWidth = 2

        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-5, -7);
        ctx.lineTo(-5, 7);
        ctx.lineTo(8, 0)
        ctx.stroke();


        ctx.restore(); // #22 leaves players space translation AND rotation AND jump value translation


        // SIDES OF PLAYER
        ctx.save(); // #24

        const angleRad = this.lookAngle.getAngle() * (Math.PI/180);
        const loopedAngle = this.lookAngle.getAngle();


        // GETTING CORNERS OF ROTATED RECTANGLE
        // https://stackoverflow.com/questions/41898990/find-corners-of-a-rotated-rectangle-given-its-center-point-and-rotation

        if (loopedAngle > 270 || loopedAngle < 90) { // BOT WALL

            const sideVector = new Vector(0,1).rotate(this.lookAngle.getAngle())
            const litPercent = sideVector.angleDifference(Map.style.lightDirectionVector) / Math.PI
            ctx.fillStyle = canvasArea.getShadedColor(Map.style.playerColor, litPercent)

            ctx.beginPath();
            ctx.moveTo(midX - (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), midY - 32 - this.jumpValue - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(midX + (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), midY - 32 - this.jumpValue + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(midX + (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), midY - this.jumpValue + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(midX - (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), midY - this.jumpValue - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.closePath();
            ctx.fill();
        }

        if (0 < loopedAngle && loopedAngle < 180) { // RIGHT WALL

            const sideVector = new Vector(1,0).rotate(this.lookAngle.getAngle())
            const litPercent = sideVector.angleDifference(Map.style.lightDirectionVector) / Math.PI
            ctx.fillStyle = canvasArea.getShadedColor(Map.style.playerColor, litPercent)

            ctx.beginPath();
            ctx.moveTo(midX + (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), midY - 32 - this.jumpValue + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(midX + (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), midY - 32 - this.jumpValue + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(midX + (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), midY - this.jumpValue + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(midX + (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), midY - this.jumpValue + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.closePath();
            ctx.fill();
        }

        if (90 < loopedAngle && loopedAngle < 270) { // TOP WALL
            
            const sideVector = new Vector(0,-1).rotate(this.lookAngle.getAngle())
            const litPercent = sideVector.angleDifference(Map.style.lightDirectionVector) / Math.PI
            ctx.fillStyle = canvasArea.getShadedColor(Map.style.playerColor, litPercent)

            ctx.beginPath();
            ctx.moveTo(midX + (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), midY - 32 - this.jumpValue + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(midX + (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), midY - this.jumpValue + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(midX - (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), midY - this.jumpValue - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(midX - (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), midY - 32 - this.jumpValue - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.closePath();
            ctx.fill();
        }

        if (180 < loopedAngle && loopedAngle < 360) { // LEFT WALL

            const sideVector = new Vector(-1,0).rotate(this.lookAngle.getAngle())
            const litPercent = sideVector.angleDifference(Map.style.lightDirectionVector) / Math.PI
            ctx.fillStyle = canvasArea.getShadedColor(Map.style.playerColor, litPercent)

            ctx.beginPath();
            ctx.moveTo(midX - (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), midY - 32 - this.jumpValue - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(midX - (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), midY - 32 - this.jumpValue - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(midX - (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), midY - this.jumpValue - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(midX - (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), midY - this.jumpValue - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.closePath();
            ctx.fill();
        }


        ctx.restore(); // #24
        ctx.restore(); // 21.5 Clears Map.playerClip


        ctx.save() // #24.5

        // DRAW PLAYER XRAY IF BEHIND WALL
        if (Map.wallsToCheck.length != 0) { // could use more precice check here ex: looking to see if theres data in Map.playerClip
            
            ctx.translate(-player.x + midX, -player.y + midY)
            ctx.clip(Map.playerClip)

            ctx.translate(player.x , player.y);
            ctx.rotate(player.lookAngle.getAngle() * Math.PI/180)

            ctx.strokeStyle = Map.style.shaded_playerColor
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.strokeRect(-16, -16, 32, 32)
            ctx.stroke()
        }

        ctx.restore() // #24.5

        // draw wall collision debug stuff
        ctx.strokeStyle = "green"
        ctx.lineWidth = 2

        ctx.beginPath();
        ctx.arc(this.collisionPointDebug.x, this.collisionPointDebug.y, 2, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillText(Math.round(this.collisionPointDebug.x) + ", " + Math.round(this.collisionPointDebug.y), this.collisionPointDebug.x + 5, this.collisionPointDebug.y)

        ctx.beginPath()
        ctx.moveTo(this.collisionPointDebug.x, this.collisionPointDebug.y)
        ctx.lineTo(this.collisionPointDebug.x + this.collisionNormalDebug.x * 25, this.collisionPointDebug.y + this.collisionNormalDebug.y * 25)
        ctx.stroke()
    
    }

    startLevel() {
        this.velocity.set(6,0); // 6,0
        this.velocity = this.velocity.rotate(this.lookAngle.getAngle());
    }

    updatePos() {
        
        if (UserInterface.levelState == 1 || UserInterface.levelState == 2) { // if NOT at end screen

            this.lookAngle = this.lookAngle.rotate(touchHandler.dragAmountX * UserInterface.settings.sensitivity)
            
            // Setting wishDir
            if (touchHandler.dragAmountX > 0) {
                this.wishDir = this.lookAngle.rotate(90) // look angle is already a normalized
                this.wishDir.normalize(maxVelocity) // changes the length to be maxVelocity
            }

            if (touchHandler.dragAmountX < 0) {
                this.wishDir = this.lookAngle.rotate(-90) // look angle is already a normalized
                this.wishDir.normalize(maxVelocity) // changes the length to be maxVelocity
            }

            if (touchHandler.dragAmountX == 0) {this.wishDir.set(0,0)}
        
        }

        if (UserInterface.levelState == 2) { // 1 = pre-start, 2 = playing level, 3 = in endzone

            // ALL MOVEMENT CALCULATIONS
            // THIS IS VIDEO VERSION OF QUAKE1 CODE	

            this.currentSpeedProjected = this.velocity.dotProduct(this.wishDir); // Vector projection of Current_velocity onto wishDir

            // addSpeed is clipped between 0 and MAX_ACCEL * dt  --- addSpeed should only be 0 when wishDir is 0
            this.addSpeed = maxVelocity - this.currentSpeedProjected; // sometimes currentSpeedProj is negative
            
            // this is a hack to make gain consistent between fps changes BAD BAD BAD BS
            // https://www.desmos.com/calculator/k1uc1yai14
            this.addSpeed *= (0.25 * (Math.cbrt(dt)+3))
            
            
            
            if (this.addSpeed > airAcceleration * dt) { // addspeed is too big and needs to be limited by airacceleration value
                this.addSpeed = airAcceleration * dt; 
                
                // show overstrafe warning
                if (UserInterface.showOverstrafeWarning == false) {
                    UserInterface.showOverstrafeWarning = true;
                    setTimeout(() => {UserInterface.showOverstrafeWarning = false}, 1500); // wait 1.5 seconds to hide warning
                }
            }
            
            if (this.addSpeed <= 0) {this.addSpeed = 0; console.log("zero addspeed")} // currentSpeedProjected is greater than max_speed. dont add speed
            
            
            // addSpeed is a scaler for wishdir. if addspeed == 0 no wishdir is applied
            this.velocity.x += (this.wishDir.x * this.addSpeed)
            this.velocity.y += (this.wishDir.y * this.addSpeed)
            // addSpeed needs to be adjusted by dt. Bigger dt, less fps, bigger addSpeed

            // velocity applied to player coords after checking wall collisions


            
            // JUMPING
            if (this.jumpValue < 0) { 
                this.jumpValue = 0;
                this.jumpVelocity = 2;
                AudioHandler.jumpAudio.play();
                if (!this.checkCollision(Map.renderedPlatforms.filter(platform => platform.wall == 0))) { // checkCollision on an array of just platforms (no walls)
                    AudioHandler.splashAudio.play();
                    this.teleport();
                }
            } else {
                this.jumpValue += this.jumpVelocity * dt;
                this.jumpVelocity -= gravity * dt;
            }



            // CHECK IF COLLIDING WITH WALLS
            Map.wallsToCheck.forEach(wall => {

                function isColliding(player, wall) {
                    // Calculate relative position of player to the center of the wall
                    const relativeX = player.x - wall.x;
                    const relativeY = player.y - wall.y;

                    // Rotate the relative position of the player around the origin (center of the wall)
                    const rotatedX = relativeX * Math.cos(-wall.angleRad) - relativeY * Math.sin(-wall.angleRad);
                    const rotatedY = relativeX * Math.sin(-wall.angleRad) + relativeY * Math.cos(-wall.angleRad);

                    // Calculate closest point on the rotated rectangle to the player
                    let closestX = Math.max(-wall.width / 2, Math.min(rotatedX, wall.width / 2));
                    let closestY = Math.max(-wall.height / 2, Math.min(rotatedY, wall.height / 2));

                    // Check if the closest point is within the player's circle
                    const distanceX = rotatedX - closestX;
                    const distanceY = rotatedY - closestY;
                    const distanceSquared = distanceX * distanceX + distanceY * distanceY;

                    if (distanceSquared <= (18 * 18)) {  // 16 is the player's collision radius
                        // Collision detected

                        let collisionX, collisionY;
                        let playerInsideWall = false;

                        // Check if the center of player is inside the wall
                        if (rotatedX >= -wall.width / 2 && rotatedX <= wall.width / 2 && rotatedY >= -wall.height / 2 && rotatedY <= wall.height / 2) {
                            playerInsideWall = true;


                            // If inside, find the nearest edge
                            const halfWidth = wall.width / 2;
                            const halfHeight = wall.height / 2;
                            const dxLeft = halfWidth + rotatedX; // Distance to the left edge
                            const dxRight = halfWidth - rotatedX; // Distance to the right edge
                            const dyTop = halfHeight + rotatedY; // Distance to the top edge
                            const dyBottom = halfHeight - rotatedY; // Distance to the bottom edge
                            const minDx = Math.min(dxLeft, dxRight);
                            const minDy = Math.min(dyTop, dyBottom);

                            if (minDx < minDy) {
                                // Nearest edge is left or right
                                if (dxLeft < dxRight) {
                                    // Left edge
                                    closestX = -wall.width / 2;
                                } else {
                                    // Right edge
                                    closestX = wall.width / 2;
                                }
                                collisionY = -closestX * Math.sin(-wall.angleRad) + closestY * Math.cos(-wall.angleRad) + wall.y;
                            } else {
                                // Nearest edge is top or bottom
                                if (dyTop < dyBottom) {
                                    // Top edge
                                    closestY = -wall.height / 2;
                                } else {
                                    // Bottom edge
                                    closestY = wall.height / 2;
                                }
                                collisionX = closestX * Math.cos(-wall.angleRad) + closestY * Math.sin(-wall.angleRad) + wall.x;
                            }
                        }

                        // Calculate global collision point by moving closestX/Y into global coords by rotating and translating it
                        collisionX = closestX * Math.cos(-wall.angleRad) + closestY * Math.sin(-wall.angleRad) + wall.x;
                        collisionY = -closestX * Math.sin(-wall.angleRad) + closestY * Math.cos(-wall.angleRad) + wall.y;

                        // Calculate normal vector of collision
                        const normalVector = new Vector(player.x - collisionX, player.y - collisionY);
                        if (playerInsideWall) { // if inside the wall the vector needs to be flipped to point the right way
                            normalVector.x *= -1;
                            normalVector.y *= -1;
                        }
                        normalVector.normalize(1); // Normalize the vector

                        return {
                            collided: true,
                            normal: normalVector,
                            collisionPoint: {
                                x: collisionX,
                                y: collisionY
                            }
                        };
                    }

                    // No collision detected
                    return {
                        collided: false
                    };
                }
                  

                function adjustVelocity(playerMovementVector, wallNormalVector) {
                    // Calculate the dot product of player movement vector and wall normal vector
                    const dotProduct = playerMovementVector.x * wallNormalVector.x + playerMovementVector.y * wallNormalVector.y;

                    // If the dot product is negative, it means the player is moving towards the wall
                    if (dotProduct < 0) {
                        // Remove the component of player movement vector that's in the direction of the wall
                        playerMovementVector.x -= dotProduct * wallNormalVector.x;
                        playerMovementVector.y -= dotProduct * wallNormalVector.y;
                    }
                }

                

                const collisionData = isColliding(player, wall)
                if (collisionData.collided) {
                    //console.log("collided!")

                    adjustVelocity(this.velocity, collisionData.normal)

                    // bounce player backwards from being inside wall
                    player.x = collisionData.collisionPoint.x + collisionData.normal.x * 20
                    player.y = collisionData.collisionPoint.y + collisionData.normal.y * 20


                }
        
            })

    

            // APPLYING VELOCITY
            this.x += this.velocity.x / 5 * dt;
            this.y += this.velocity.y / 5 * dt;



            // CHECK if colliding with checkpoint triggers
            Map.checkpoints.forEach(checkpoint => {
                
                const distance = pDistance(this.x, this.y, checkpoint.triggerX1, checkpoint.triggerY1, checkpoint.triggerX2, checkpoint.triggerY2)
                // console.log("distance to " + checkpoint + ": " + distance)

                if (distance <= 16) { // COLLIDING WITH CP TRIGGER
                    this.checkpointIndex = Map.checkpoints.indexOf(checkpoint) // could do this with a callback index function?
                    // console.log(this.checkpointIndex);
                }

                // gets minumum distance to line segment from point: https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
                function pDistance(x, y, x1, y1, x2, y2) { 

                    const A = x - x1;
                    const B = y - y1;
                    const C = x2 - x1;
                    const D = y2 - y1;

                    const dot = A * C + B * D;
                    const len_sq = C * C + D * D;
                    let param = -1;
                    if (len_sq != 0) //in case of 0 length line
                        param = dot / len_sq;

                    let xx, yy;

                    if (param < 0) {
                        xx = x1;
                        yy = y1;
                    }
                    else if (param > 1) {
                        xx = x2;
                        yy = y2;
                    }
                    else {
                        xx = x1 + param * C;
                        yy = y1 + param * D;
                    }

                    const dx = x - xx;
                    const dy = y - yy;
                    return Math.sqrt(dx * dx + dy * dy);
                }
            });


            // CHECK IF COLLIDING WITH ANY ENDZONES
            if (Map.endZonesToCheck.length > 0) { 
                if (this.checkCollision(Map.endZonesToCheck)) {
                    AudioHandler.successAudio.play();
                    UserInterface.handleRecord();
                    UserInterface.levelState = 3;
                }
            }
        }


        if (UserInterface.levelState == 3) { // SLOW DOWN MOVEMENT AFTER HITTING END ZONE
            // if (this.endSlow > 0.02) {this.endSlow = (this.endSlow * 0.95);} else {this.endSlow = 0} // THIS NEEDS TO BE FPS INDEPENDENT
            if (this.endSlow > 0.02) {this.endSlow = (this.endSlow - 0.02 * dt);} else {this.endSlow = 0}

            this.x += this.velocity.x/5 * dt * this.endSlow; // MOVE FORWARD AT ANGLE BASED ON VELOCITY
            this.y += this.velocity.y/5 * dt * this.endSlow;
        
            if (this.jumpValue < 0) { // JUMPING
                this.jumpValue = 0;
                this.jumpVelocity = 2;
            } else {
                this.jumpValue += this.jumpVelocity * dt * this.endSlow;
                this.jumpVelocity -= gravity * dt * this.endSlow;
            }
        }
    }



    checkCollision(arrayOfPlatformsToCheck) {

        let collisions = 0;

        // takes a rectangle defined by center coordinates (x, y), width, height, and angle in radians
        // returns an array of corner points in clockwise order, starting from the top-left corner
        function createPoligon(x, y, width, height, angle) {
            // Calculate half width and half height
            var hw = width / 2;
            var hh = height / 2;

            // Calculate the cos and sin of the angle
            var cosAngle = Math.cos(angle);
            var sinAngle = Math.sin(angle);

            // Calculate the corner points relative to the center
            var topLeft = {
                x: x - (hw * cosAngle) - (hh * sinAngle),
                y: y - (hw * sinAngle) + (hh * cosAngle)
            };

            var topRight = {
                x: x + (hw * cosAngle) - (hh * sinAngle),
                y: y + (hw * sinAngle) + (hh * cosAngle)
            };

            var bottomRight = {
                x: x + (hw * cosAngle) + (hh * sinAngle),
                y: y + (hw * sinAngle) - (hh * cosAngle)
            };

            var bottomLeft = {
                x: x - (hw * cosAngle) + (hh * sinAngle),
                y: y - (hw * sinAngle) - (hh * cosAngle)
            };


            // Return the corner points in clockwise order
            return [topLeft, topRight, bottomRight, bottomLeft];
        }

        const playerPoligon = createPoligon(player.x, player.y, 32, 32, player.lookAngle.getAngle() * Math.PI / 180) // player angle converted to rads

        // check player against every platform
        arrayOfPlatformsToCheck.forEach(platform => {
            const platformPoligon = createPoligon(platform.x, platform.y, platform.width, platform.height, platform.angleRad)

            // @param a an array of connected points [{x:, y:}, {x:, y:},...] that form a closed polygon
            // @param b an array of connected points [{x:, y:}, {x:, y:},...] that form a closed polygon
            // @return true if there is any intersection between the 2 polygons, false otherwise
            // https://stackoverflow.com/questions/10962379/how-to-check-intersection-between-2-rotated-rectangles
            function doPolygonsIntersect(a, b) {
                const polygons = [a, b];
                let minA, maxA, projected, i, i1, j, minB, maxB;

                for (i = 0; i < polygons.length; i++) {

                    // for each polygon, look at each edge of the polygon, and determine if it separates
                    // the two shapes
                    const polygon = polygons[i];
                    for (i1 = 0; i1 < polygon.length; i1++) {

                        // grab 2 vertices to create an edge
                        const i2 = (i1 + 1) % polygon.length;
                        const p1 = polygon[i1];
                        const p2 = polygon[i2];

                        // find the line perpendicular to this edge
                        const normal = {
                            x: p2.y - p1.y,
                            y: p1.x - p2.x
                        };

                        minA = maxA = undefined;
                        // for each vertex in the first shape, project it onto the line perpendicular to the edge
                        // and keep track of the min and max of these values
                        for (j = 0; j < a.length; j++) {
                            projected = normal.x * a[j].x + normal.y * a[j].y;
                            if (minA == null || projected < minA) {
                                minA = projected;
                            }
                            if (maxA == null || projected > maxA) {
                                maxA = projected;
                            }
                        }

                        // for each vertex in the second shape, project it onto the line perpendicular to the edge
                        // and keep track of the min and max of these values
                        minB = maxB = undefined;
                        for (j = 0; j < b.length; j++) {
                            projected = normal.x * b[j].x + normal.y * b[j].y;
                            if (minB == null || projected < minB) {
                                minB = projected;
                            }
                            if (maxB == null || projected > maxB) {
                                maxB = projected;
                            }
                        }

                        // if there is no overlap between the projects, the edge we are looking at separates the two
                        // polygons, and we know there is no overlap
                        if (maxA < minB || maxB < minA) {
                            return false;
                        }
                    }
                }
                return true;
            };


            if (doPolygonsIntersect(playerPoligon, platformPoligon)) {
                collisions++
            }
        })

        return (collisions > 0)
    }



    teleport() { // Called when player hits the water
        if (this.checkpointIndex !== -1) {
            this.x = Map.checkpoints[this.checkpointIndex].x;
            this.y = Map.checkpoints[this.checkpointIndex].y;
            this.lookAngle.set(1,0)
            this.lookAngle = this.lookAngle.rotate(Map.checkpoints[this.checkpointIndex].angle)
            this.velocity.set(2,0)
            this.velocity = this.velocity.rotate(this.lookAngle.getAngle())
            this.jumpValue = 0;
            this.jumpVelocity = 2;
        } else {
            btn_restart.released(true);
        }
    }

    restart() { // Called when user hits restart button (not when teleported from water)
        this.x = this.restartX;
        this.y = this.restartY;
        this.lookAngle.set(1,0)
        this.lookAngle = this.lookAngle.rotate(this.restartAngle)
        this.velocity.set(0,0)
        this.jumpValue = 0;
        this.jumpVelocity = 2;
        this.endSlow = 1;
    }
}


function updateGameArea() { // CALLED EVERY FRAME
    
    // UPDATING OBJECTS
    touchHandler.update();
    UserInterface.update();        
    
    dt = (performance.now() - prevDateNow)/10; // Delta Time for FPS independence. dt = amount of milliseconds between frames
    prevDateNow = performance.now();


    if (UserInterface.gamestate == 2) { // In a MapBrowser
        MapBrowser.update()
        if (Tutorial.isActive) {
            Tutorial.update();
        }
    }

    if (UserInterface.gamestate == 6) {
        Map.update();
        if (!Tutorial.pausePlayer) {player.updatePos()}     
        if (Tutorial.isActive) {
            Tutorial.update();
        }
    };
    
    if (UserInterface.gamestate == 7) {
        MapEditor.update();
    }
    
    
    
    
    // RENDERING OBJECTS
    canvasArea.clear();

    if (UserInterface.gamestate == 2) { // In a MapBrowser
        MapBrowser.render()
    }

    if (UserInterface.gamestate == 6) {
        Map.render(); // draws player lower shadow too
        player.render()
        if (Tutorial.isActive) {
            Tutorial.render();
        }        
    }

    if (UserInterface.gamestate == 7) {
        MapEditor.render();
    }

    UserInterface.render();

}


//      :)
