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
                // console.log(image + ": no svg for this button. set height to 75");
                this.width = width;
                this.height = this.width > 75 ? 75 : this.width

                // TRUNCATE AND SET LABEL
                canvasArea.ctx.font = "22px BAHNSCHRIFT"; // for measuring text

                if (canvasArea.ctx.measureText(label).width > this.width - 30) { // if needs to be truncated
                    while (canvasArea.ctx.measureText(label + "...").width > this.width - 30) {
                        label = label.slice(0, -1) // slice off last character
                    }
                    this.shortLabel = label + "..."
                }

                
            });


            // GETTING IMAGE_PRESSED. messy to do most of this code twice but... 
            if (image_pressed != "") {
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

            if (this.shortLabel != null) {
                canvasArea.ctx.fillText(this.shortLabel, this.x + (this.width - canvasArea.ctx.measureText(this.shortLabel).width)/2, this.y + (this.height/2) + 7)
            } else {
                canvasArea.ctx.fillText(this.label, this.x + (this.width - canvasArea.ctx.measureText(this.label).width)/2, this.y + (this.height/2) + 7)
            }
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
        this.decimalDetail = decimalDetail // 1 = whole numbers, 10 = 10ths place, 100 = 100ths place
        this.label = label;
        this.value = variable;
        this.variableToControl = String(variable);
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
        if (touchHandler.dragging) { // User is touching the screen
            
            if (Math.abs(touchHandler.touchX - this.sliderX) < 30 && Math.abs(touchHandler.touchY - this.y) < 30) {
                
                if (touchHandler.touchX > this.x && touchHandler.touchX < this.x + this.width) {

                    this.sliderX = touchHandler.touchX
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


                this.confirmed = false;
            }
        } else { // if not dragging (testing for a touch end on slider)
            if (!this.confirmed) { // and if real values havent been updated

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

    angleDifference = function(otherVec) { // returns radians. not sure why
        return Math.acos((this.dotProduct(otherVec)) / (this.magnitude() * otherVec.magnitude()))
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

        UserInterface.start(); // need to be ran after canvas is resized in canvasArea.start()

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
            //directLight = Map.style.directLight ?? "rba(255,255,255)"
            //ambientLight = Map.style.ambientLight ?? "rba(140,184,198)"
            directLight = Map.style.directLight ?? "rba(155,155,155)"
            ambientLight = Map.style.ambientLight ?? "rba(40,84,98)"
            
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

    sensitivity : null,
    debugText : null,
    strafeHUD : null,
    showVelocity : true,
    volume : null,
    
    playTutorial : true,

    timer : 0,
    timerStart : null, // set by jump button
    levelState : 1, // 1 = pre-start, 2 = playing level, 3 = in endzone

    showVerticalWarning : false,
    showOverstrafeWarning : false,

    darkMode : false,

    lightColor_1 : "#fff8ea", // lighter
    lightColor_2 : "#f7f1e4", // darker
    darkColor_1 : "#503c4b",
    darkColor_2 : "#412b3a",
    
    // lightColor_1 : "rgb(244,243,240)", // lighter
    // lightColor_2 : "rgb(231,230,223)", // darker
    // darkColor_1 : "rgb(39,39,37)",
    // darkColor_2 : "rgb(34,34,32)",

    // lightColor_1 : "#f0f0f1", // lighter
    // lightColor_2 : "#dcd8d6", // darker
    // darkColor_1 : "#36393d",
    // darkColor_2 : "#292d30",
    


    start : function() { // where all buttons are created

        // Retreaving settings from local storage OR setting them
        this.sensitivity = window.localStorage.getItem("sensitivity_storage")
        if (this.sensitivity == null) {
            this.sensitivity = 1
            window.localStorage.setItem("sensitivity_storage", 1)
        }

        this.debugText = window.localStorage.getItem("debugText_storage")
        if (this.debugText == null) {
            this.debugText = 0
            window.localStorage.setItem("debugText_storage", 0)
        }

        this.strafeHUD = window.localStorage.getItem("strafeHUD_storage")
        if (this.strafeHUD == null) {
            this.strafeHUD = 0
            window.localStorage.setItem("strafeHUD_storage", 0)
        }

        this.volume = window.localStorage.getItem("volume_storage")
        console.log("volume " + this.volume)
        if (this.volume == null) {
            this.volume = 0.5
            window.localStorage.setItem("volume_storage", 0.5)
        }



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

                window.localStorage.removeItem("record_original") // loop through all maps here
                window.localStorage.removeItem("record_noob")
                window.localStorage.removeItem("record_hellscape")
                
                UserInterface.sensitivity = 1
                window.localStorage.setItem("sensitivity_storage", 1)
                btn_sensitivitySlider.updateState(1)
            
                UserInterface.debugText = 0
                window.localStorage.setItem("debugText_storage", 0)
                btn_debugText.func(true)
                
                UserInterface.strafeHUD = 0
                window.localStorage.setItem("strafeHUD_storage", 0)
                btn_strafeHUD.func(true)
                
                UserInterface.volume = 0.5
                window.localStorage.setItem("volume_storage", 0.5)
                btn_volumeSlider.updateState(0.5)
                
                console.log("records and settings cleared")
            }

        })

        btn_sensitivitySlider = new SliderUI(180, 100, 300, 0.1, 3, 10, "Sensitivity", UserInterface.sensitivity, function() { 
            UserInterface.sensitivity = this.value
            window.localStorage.setItem("sensitivity_storage", this.value)
        })

        btn_volumeSlider = new SliderUI(180, 200, 300, 0, 1, 10, "Volume", UserInterface.volume, function() { 
            UserInterface.volume = this.value
            window.localStorage.setItem("volume_storage", this.value)
            AudioHandler.setVolumes();
        })

        btn_debugText = new Button(310, 240, 80, "toggle_button", "toggle_button_pressed", 1, "", function(sync) {
            if (sync) {
                    this.toggle = UserInterface.debugText;
            } else {
                if (this.toggle == 1) {
                    this.toggle = 0;
                    UserInterface.debugText = 0
                    window.localStorage.setItem("debugText_storage", 0)
                } else {
                    this.toggle = 1;
                    UserInterface.debugText = 1
                    window.localStorage.setItem("debugText_storage", 1)
                }
            }
        })

        btn_strafeHUD = new Button(310, 300, 80, "toggle_button", "toggle_button_pressed", 1, "", function(sync) {
            if (sync) {
                this.toggle = UserInterface.strafeHUD;
            } else {
                if (this.toggle == 1) {
                    this.toggle = 0;
                    UserInterface.strafeHUD = 0
                    window.localStorage.setItem("strafeHUD_storage", 0)
                } else {
                    this.toggle = 1;
                    UserInterface.strafeHUD = 1
                    window.localStorage.setItem("strafeHUD_storage", 1)
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
                        "directLight" : "rba(255,255,255)",
                        "ambientLight" : "rba(140,184,198)",
                        "platformHeight": 25,
                        "wallHeight": 50,
                        "lightAngle": 45,
                        "shadowLength": 25
                    },
                    "platforms": [
                        {
                            "x": 300,
                            "y": 10,
                            "width": 100,
                            "height": 100,
                            "angle": 0,
                            "endzone": 1,
                            "wall": 0
                        },
                        {
                            "x": 300,
                            "y": 200,
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
                "x": Math.round(-MapEditor.screenX + canvasArea.canvas.width/2),
                "y": Math.round(-MapEditor.screenY + canvasArea.canvas.height/2),
                "width": 100,
                "height": 100,
                "hypotenuse": Math.sqrt(this.width * this.width + this.height * this.height)/2,
                "angle": 0,
                "endzone": 0,
                "wall": 0
            }


            MapEditor.loadedMap.platforms.push(newPlatform);
            MapEditor.selectedPlatformIndex = MapEditor.loadedMap.platforms.length - 1;
            UserInterface.renderedButtons = UserInterface.btnGroup_editPlatform
            
            // SYNC ALL BUTTONS AND SLIDERS
            btn_translate.func(true) // intially syncs the buttons position to the selected platform. Called whenever screen is scrolled too. not really needed here but avoids a 1 frame flash 
            btn_resize.func(true)
            btn_angleSlider.updateState(MapEditor.loadedMap.platforms[MapEditor.selectedPlatformIndex].angle)
            btn_wall.func(true) // syncs the wall button's toggle state
        })

        btn_add_checkpoint = new Button("canvasArea.canvas.width - 300", "120", 250, "cp_button", "", 0, "", function() {
            const middleX = Math.round(-MapEditor.screenX + canvasArea.canvas.width/2)
            const middleY = Math.round(-MapEditor.screenY + canvasArea.canvas.height/2)
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
            btn_lightAngleSlider.updateState(MapEditor.loadedMap.style.lightAngle)
            btn_shadowLengthSlider.updateState(MapEditor.loadedMap.style.shadowLength)

            UserInterface.renderedButtons = UserInterface.btnGroup_mapSettings
        })

        btn_snappingSlider = new SliderUI("60", "canvasArea.canvas.height - 60", 170, 0, 50, 0.2, "Snapping", MapEditor.loadedMap ? MapEditor.snapAmount : 0, function() {
            MapEditor.snapAmount = this.value
        })

        btn_unselect = new Button("canvasArea.canvas.width - 260", "30", 60, "x_button", "", 0, "", function() {
            
            MapEditor.selectedPlatformIndex = -1; // No selected platform
            MapEditor.selectedCheckpointIndex = [-1,1]; // No selected checkpoint
            UserInterface.renderedButtons = UserInterface.btnGroup_mapEditorInterface
        })

        btn_translate = new Button(0, 0, 50, "translate_button", "", 0, "", function(updateFrame) {
            
            if (MapEditor.selectedPlatformIndex != -1) { // platform selected
                let platform;
    
                if (MapEditor.selectedPlatformIndex == -2) { // if selected playerStart
                    platform = MapEditor.loadedMap.playerStart
                } else { // selected platform
                    platform = MapEditor.loadedMap.platforms[MapEditor.selectedPlatformIndex]
                }
                
                if (this.isPressed) {
                    platform.x += Math.round(touchHandler.dragAmountX)
                    platform.y += Math.round(touchHandler.dragAmountY)

                    if (this.x > canvasArea.canvas.width - 340) {
                        MapEditor.screenX -= Math.round(4 * dt)
                        platform.x += Math.round(4 * dt)
                    }
    
                    if (this.x < 30) {
                        MapEditor.screenX += Math.round(4 * dt)
                        platform.x -= Math.round(4 * dt)
                    }
    
                    if (this.y > canvasArea.canvas.height - 60) {
                        MapEditor.screenY -= Math.round(4 * dt)
                        platform.y += Math.round(4 * dt)
                    }
    
                    if (this.y < 30) {
                        MapEditor.screenY += Math.round(4 * dt)
                        platform.y -= Math.round(4 * dt)
                    }

                }
                if (!updateFrame && MapEditor.snapAmount > 0) {
                    platform.x = Math.round(platform.x / MapEditor.snapAmount) * MapEditor.snapAmount
                    platform.y = Math.round(platform.y / MapEditor.snapAmount) * MapEditor.snapAmount
                }


                this.x =  MapEditor.screenX + platform.x + (platform.width ? platform.width/2 : 32) - this.width/2
                this.y =  MapEditor.screenY + platform.y + (platform.height ? platform.height/2 : 32) - this.height/2

            }

            if (MapEditor.selectedCheckpointIndex[0] != -1) { // checkpoint selected
                
                const checkpoint = MapEditor.loadedMap.checkpoints[MapEditor.selectedCheckpointIndex[0]]
                
                if (MapEditor.selectedCheckpointIndex[1] == 1) {
                    if (this.isPressed) {
                        checkpoint.triggerX1 += Math.round(touchHandler.dragAmountX)
                        checkpoint.triggerY1 += Math.round(touchHandler.dragAmountY)
                    }
                    if (!updateFrame && MapEditor.snapAmount > 0) {
                        checkpoint.triggerX1 = Math.round(checkpoint.triggerX1 / MapEditor.snapAmount) * MapEditor.snapAmount
                        checkpoint.triggerY1 = Math.round(checkpoint.triggerY1 / MapEditor.snapAmount) * MapEditor.snapAmount
                    }   

                    this.x =  MapEditor.screenX + checkpoint.triggerX1 - this.width/2
                    this.y =  MapEditor.screenY + checkpoint.triggerY1 - this.height/2
                }

                if (MapEditor.selectedCheckpointIndex[1] == 2) {
                    if (this.isPressed) {
                        checkpoint.triggerX2 += Math.round(touchHandler.dragAmountX)
                        checkpoint.triggerY2 += Math.round(touchHandler.dragAmountY)
                    }
                    if (!updateFrame && MapEditor.snapAmount > 0) {
                        checkpoint.triggerX2 = Math.round(checkpoint.triggerX2 / MapEditor.snapAmount) * MapEditor.snapAmount
                        checkpoint.triggerY2 = Math.round(checkpoint.triggerY2 / MapEditor.snapAmount) * MapEditor.snapAmount
                    }

                    this.x =  MapEditor.screenX + checkpoint.triggerX2 - this.width/2
                    this.y =  MapEditor.screenY + checkpoint.triggerY2 - this.height/2
                }

                if (MapEditor.selectedCheckpointIndex[1] == 3) {
                    if (this.isPressed) {
                        checkpoint.x += Math.round(touchHandler.dragAmountX)
                        checkpoint.y += Math.round(touchHandler.dragAmountY)
                    }
                    if (!updateFrame && MapEditor.snapAmount > 0) {
                        checkpoint.x = Math.round(checkpoint.x / MapEditor.snapAmount) * MapEditor.snapAmount
                        checkpoint.y = Math.round(checkpoint.y / MapEditor.snapAmount) * MapEditor.snapAmount
                    }

                    this.x =  MapEditor.screenX + checkpoint.x + 32 - this.width/2
                    this.y =  MapEditor.screenY + checkpoint.y + 32 - this.height/2
                }

            }
        })

        btn_resize = new Button(0, 0, 50, "scale_button", "", 0, "", function(updateFrame) {

            let platform = MapEditor.loadedMap.platforms[MapEditor.selectedPlatformIndex]

            // bot right corner (relative to platform center)
            const angleRad = platform.angle * (Math.PI/180);
            const cornerX =  ((platform.width / 2) * Math.cos(angleRad)) - ((platform.height / 2) * Math.sin(angleRad))
            const cornerY = ((platform.width / 2) * Math.sin(angleRad)) + ((platform.height / 2) * Math.cos(angleRad))
            
            if (this.isPressed) {
                const oldMidX = platform.x + platform.width/2
                const oldMidY = platform.y + platform.height/2

                // transform drag amount to match with platform angle
                let drag = new Vector(touchHandler.dragAmountX, touchHandler.dragAmountY).rotate(-platform.angle)

                platform.width += Math.round(drag.x) * 2 // multiplied by 2 because platform will be moving oppposite direction from drag direction (to appear stable)
                if (platform.width < 10) {platform.width = 10}

                platform.height += Math.round(drag.y) * 2
                if (platform.height < 10) {platform.height = 10}


                const newMidX = platform.x + platform.width/2
                const newMidY = platform.y + platform.height/2

                platform.x += Math.round(oldMidX - newMidX)
                platform.y += Math.round(oldMidY - newMidY)
            }

            if (!updateFrame && MapEditor.snapAmount > 0) {
                platform.width = Math.round(platform.width / MapEditor.snapAmount) * MapEditor.snapAmount
                platform.height = Math.round(platform.height / MapEditor.snapAmount) * MapEditor.snapAmount
            }

            this.x = platform.x + platform.width/2 + cornerX + MapEditor.screenX
            this.y = platform.y + platform.height/2 + cornerY + MapEditor.screenY
            
        })

        btn_angleSlider = new SliderUI("canvasArea.canvas.width - 250", "250", 170, -50, 50, 1, "Angle", MapEditor.loadedMap ? MapEditor.loadedMap.platforms[MapEditor.selectedPlatformIndex] : 0, function() {
            if (MapEditor.snapAmount > 0) {this.updateState(Math.round(this.value / MapEditor.snapAmount) * MapEditor.snapAmount)}
            MapEditor.loadedMap.platforms[MapEditor.selectedPlatformIndex].angle = this.value
        })

        btn_playerAngleSlider = new SliderUI("canvasArea.canvas.width - 250", "250", 170, 0, 360, 1, "Angle", MapEditor.loadedMap ? MapEditor.loadedMap.playerStart : 0, function() {
            if (MapEditor.snapAmount > 0) {this.updateState(Math.round(this.value / MapEditor.snapAmount) * MapEditor.snapAmount)}
            MapEditor.loadedMap.playerStart.angle = this.value
            
        })

        btn_checkpointAngleSlider = new SliderUI("canvasArea.canvas.width - 250", "280", 170, 0, 360, 1, "Angle", MapEditor.loadedMap ? MapEditor.loadedMap.checkpoints[MapEditor.selectedCheckpointIndex[0]] : 0, function() {
            if (MapEditor.snapAmount > 0) {this.updateState(Math.round(this.value / MapEditor.snapAmount) * MapEditor.snapAmount)}
            MapEditor.loadedMap.checkpoints[MapEditor.selectedCheckpointIndex[0]].angle = this.value
        })

        btn_wall = new Button("canvasArea.canvas.width - 170", "280", 60, "toggle_button", "toggle_button_pressed", 1, "", function(sync) { 
            if (MapEditor.loadedMap) { // throws an error otherwise
                if (sync) {
                    this.toggle = MapEditor.loadedMap.platforms[MapEditor.selectedPlatformIndex].wall?1:0; // gets initial value of toggle
                } else {
                    if (this.toggle) {
                        this.toggle = 0;
                        MapEditor.loadedMap.platforms[MapEditor.selectedPlatformIndex].wall = 0
                    } else {
                        this.toggle = 1;
                        MapEditor.loadedMap.platforms[MapEditor.selectedPlatformIndex].wall = 1
                    }
                }
            }    
        })

        btn_delete_platform = new Button("canvasArea.canvas.width - 175", "canvasArea.canvas.height - 100", 120, "delete_button", "", 0, "", function() {
            if (MapEditor.selectedPlatformIndex != -1) { // platform being deleted
                MapEditor.loadedMap.platforms.splice(MapEditor.selectedPlatformIndex, 1)
                MapEditor.selectedPlatformIndex = -1; // No selected platform
            }

            if (MapEditor.selectedCheckpointIndex[0] != -1) { // checkpoint being deleted    
                MapEditor.loadedMap.checkpoints.splice(MapEditor.selectedCheckpointIndex[0], 1)
                MapEditor.selectedCheckpointIndex = [-1, 1]; // No selected checkpoints
            }
            
            UserInterface.renderedButtons = UserInterface.btnGroup_mapEditorInterface
            
        })

        btn_duplicate_platform = new Button("canvasArea.canvas.width - 250", "canvasArea.canvas.height - 185", 200, "", "", 0, "Duplicate", function() {
            
            const newPlatform = {...MapEditor.loadedMap.platforms[MapEditor.selectedPlatformIndex]} // get selected platform
            newPlatform.x = Math.round(-MapEditor.screenX + canvasArea.canvas.width/2), // center it
            newPlatform.y = Math.round(-MapEditor.screenY + canvasArea.canvas.height/2),

            MapEditor.loadedMap.platforms.push(newPlatform); // add it
            MapEditor.selectedPlatformIndex = MapEditor.loadedMap.platforms.length - 1;
            UserInterface.renderedButtons = UserInterface.btnGroup_editPlatform
            
            // SYNC ALL BUTTONS AND SLIDERS
            btn_translate.func(true) // intially syncs the buttons position to the selected platform. Called whenever screen is scrolled too. not really needed here but avoids a 1 frame flash 
            btn_resize.func(true)
            btn_angleSlider.updateState(MapEditor.loadedMap.platforms[MapEditor.selectedPlatformIndex].angle)
            btn_wall.func(true) // syncs the wall button's toggle state
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

        btn_lightAngleSlider = new SliderUI("canvasArea.canvas.width - 650", "300", 460, 0, 360, 1, "Light Angle", MapEditor.loadedMap ? MapEditor.loadedMap.style.lightAngle : 0, function() { 
            MapEditor.loadedMap.style.lightAngle = this.value
            PreviewWindow.update()
        })

        btn_shadowLengthSlider = new SliderUI("canvasArea.canvas.width - 660", "400", 460, 0, 200, 1, "Shadow Length", MapEditor.loadedMap ? MapEditor.loadedMap.style.shadowLength : 0, function() { 
            MapEditor.loadedMap.style.shadowLength = this.value
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
            
            // loop through each button (including non-maps eww) and untoggle it
            UserInterface.renderedButtons.forEach(button => {
                if (button.toggle == 1) {button.toggle = 0}
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

                let mapData = null;
                // get appropriate mapData
                window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (fileSystem) {
                    var reader = fileSystem.createReader();
                    reader.readEntries((entries) => {
                        fileSystem.getFile(entries[MapBrowser.selectedMapIndex].name, {create: false, exclusive: false}, (fileEntry) => {
                            fileEntry.file( (file) => {
                                console.log(file)
                                const reader = new FileReader();
                                reader.onload = (e) => {
    
                                    
                                    mapData = JSON.parse(e.target.result)
                                    mapData.name = String(fileEntry.name.split(".")[0]) // for getting the name of a custom map
                                    console.log(mapData)
                                    Map.initMap(mapData);
                                    MapBrowser.selectedMapIndex = -1;
    
                                };
                                reader.onerror = (e) => alert(e.target.error.name);
                
                                reader.readAsText(file)
                            })
                        })
                    }, (error) => { console.log(error) });
                }, (error) => { console.log(error) });    
            }
        })

        btn_editMap = new Button("canvasArea.canvas.width - 300", "canvasArea.canvas.height - 110", 200, "", "", 0, "Edit Map", function() {
            
            let mapData = null;
            window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (fileSystem) {
                var reader = fileSystem.createReader();
                reader.readEntries((entries) => {
                    fileSystem.getFile(entries[MapBrowser.selectedMapIndex].name, {create: false, exclusive: false}, (fileEntry) => {
                        fileEntry.file( (file) => {
                            console.log(file)
                            const reader = new FileReader();
                            reader.onload = (e) => {

                                // delete shareDiv when leaving browser page
                                document.getElementById("shareDiv").remove()

                                MapBrowser.toggleAllButtons()
                                MapBrowser.scrollVel = 0;
                                MapBrowser.scrollY = 0;

                                mapData = JSON.parse(e.target.result)
                                mapData.name = String(fileEntry.name.split(".")[0]) // for getting the name of a custom map
                                MapEditor.loadedMap = mapData
                                UserInterface.gamestate = 7;

                            };
                            reader.onerror = (e) => alert(e.target.error.name);
            
                            reader.readAsText(file)
                        })
                    })
                }, (error) => { console.log(error) });
            }, (error) => { console.log(error) });    
        })
        
        btn_deleteMap = new Button("canvasArea.canvas.width - 300", "canvasArea.canvas.height - 200", 200, "", "", 0, "Delete Map", function() {

            const deleteMap = confirm("Delete Map?");
            if (deleteMap) {

                window.resolveLocalFileSystemURL(cordova.file.dataDirectory, (fileSystem) => {
                    var reader = fileSystem.createReader();
                    reader.readEntries((entries) => {
                        fileSystem.getFile(entries[MapBrowser.selectedMapIndex].name, {create: false}, (fileEntry) => {
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
                    
                    let mapData = null;
                    window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (fileSystem) {
                        var reader = fileSystem.createReader();
                        reader.readEntries((entries) => {
                            fileSystem.getFile(entries[MapBrowser.selectedMapIndex].name, {create: false, exclusive: false}, (fileEntry) => {
                                fileEntry.file( (file) => {
                                    console.log(file)
                                    const reader = new FileReader();
                                    reader.onload = async(e) => {
    
                                        mapData = JSON.parse(e.target.result)
                                        mapData.name = String(fileEntry.name.split(".")[0]) // for getting the name of a custom map
                                        console.log(mapData)
                                        mapData = JSON.stringify(mapData)

                                        const share_data = {
                                            title: mapData.name, // doesnt do anything on IOS
                                            text: mapData,
                                        }
                                        
                                        try {
                                            await navigator.share(share_data);
                                        } catch (err) {
                                            console.log(err)
                                        }
        
                                    };
                                    reader.onerror = (e) => alert(e.target.error.name);
                    
                                    reader.readAsText(file)
                                })
                            })
                        }, (error) => { console.log(error) });
                    }, (error) => { console.log(error) });                        
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
                if (UserInterface.playTutorial == true) {Tutorial.isActive = true}
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
        btn_mainMenu = new Button(50, 50, 100, "back_button", "", 0, "", function() { 
            
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
                        if (button.toggle == 1) {button.toggle = 0}
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

            if (Tutorial.state == 1) {
                Tutorial.state ++;
                UserInterface.renderedButtons = [btn_mainMenu]
                return
            }

            if (Tutorial.state == 2) {
                Tutorial.state ++; // going into STATE 3
                UserInterface.renderedButtons = [btn_mainMenu]

                player.lookAngle.set(0,-1) // so that ur not already looking at a target
                return
            }


            // state 3 progresses to 5 when all targets are completed

            // state 5 uses jump button to progress

            // state 6 doesnt have a next button. Progresses automatically


            // CAN COMBINE A LOT OF THESE INTO ONE
            if (Tutorial.state == 7) {
                Tutorial.state ++; // going into STATE 8
                UserInterface.renderedButtons = UserInterface.btnGroup_inLevel
                return
            }

            // 8 progressed to 9 when user starts turning again.

            // 9 progresses to 10 automatically
            
            if (Tutorial.state == 10) {
                Tutorial.state ++; // going into STATE 11
                Tutorial.pausePlayer = false;
                UserInterface.renderedButtons = UserInterface.btnGroup_inLevel
                return
            }

            // 10 progresses to 12 automatically

            // 12 progresses to 13 when user starts turning

            // 13 to 14 is automatic (by checkpoint)

            if (Tutorial.state == 14) {
                Tutorial.state ++; // going into STATE 15
                Tutorial.pausePlayer = false;
                UserInterface.renderedButtons = UserInterface.btnGroup_inLevel
                return
            }

            // 15 to 16 is automatic

            if (Tutorial.state == 16) {
                Tutorial.state ++; // going into STATE 15
                Tutorial.pausePlayer = false;
                UserInterface.renderedButtons = UserInterface.btnGroup_inLevel
                return
            }

            // 17 to 18 automatic

            if (Tutorial.state == 18) {
                Tutorial.state ++; // going into STATE 19
                UserInterface.renderedButtons = UserInterface.btnGroup_inLevel
                return
            }

        })

        // not implemented
        btn_tutorial = new Button("canvasArea.canvas.width - 420", "420", 80, "toggle_button", "toggle_button_pressed", 1, "", function(sync) { 
            if (sync) {
                this.toggle = UserInterface.playTutorial // gets initial value of toggle
            } else {
                if (this.toggle) {
                    this.toggle = 0;
                    UserInterface.playTutorial = false
                } else {
                    this.toggle = 1;
                    UserInterface.playTutorial = true
                }
            }
        })

        // GROUPS OF BUTTONS TO RENDER ON DIFFERENT PAGES
        this.btnGroup_mainMenu = [btn_play, btn_settings, btn_mapEditor]
        this.btnGroup_settings = [btn_mainMenu, btn_sensitivitySlider, btn_volumeSlider, btn_debugText, btn_strafeHUD, btn_reset_settings]
        this.btnGroup_standardMapBrowser = [
            btn_mainMenu, btn_custom_maps,
            btn_level_awakening,
            btn_level_pitfall,
            btn_level_below,

            btn_level_turmoil,
        ]
        this.btnGroup_customMapBrowser = [btn_mainMenu]
        this.btnGroup_editMapBrowser = [btn_mainMenu]
        this.btnGroup_mapEditorMenu = [btn_mainMenu, btn_new_map, btn_load_map, btn_import_map, btn_import_map_text]
        this.btnGroup_mapEditorInterface = [btn_exit_edit, btn_add_platform, btn_map_colors, btn_map_settings, btn_add_checkpoint, btn_snappingSlider]
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
            btn_lightAngleSlider,
            btn_shadowLengthSlider
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
            btn_snappingSlider
        ]
        this.btnGroup_editPlayerStart = [
            btn_exit_edit, 
            btn_unselect, 
            
            btn_translate,
            btn_playerAngleSlider,
            btn_snappingSlider
        ]
        this.btnGroup_editCheckPoint = [
            btn_exit_edit,
            btn_unselect,
            
            btn_translate,

            btn_delete_platform,
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

    handleRecord : function() {
        if (Map.record) {
            if (UserInterface.timer < Map.record) {
                window.localStorage.setItem("record_" + Map.name, UserInterface.timer)
                Map.record = UserInterface.timer
            }
        } else { // IF THERE'S NO RECORD
            window.localStorage.setItem("record_" + Map.name, UserInterface.timer)
            Map.record = UserInterface.timer
        }
    },

    determineButtonColor : function() {
        let bgColor = canvasArea.canvas.style.backgroundColor // returns rgba string
        
        bgColor = bgColor.replace(/[^\d,.]/g, '').split(',')
        
        console.log(bgColor)

        const luminance = (0.299 * bgColor[0] + 0.587 * bgColor[1] + 0.114 * bgColor[2])/255
        // luminance = (0.299 * R + 0.587 * G + 0.114 * B)/255
        // console.log("luminance: " + luminance)

        this.darkMode = (luminance > 0.7) ? true : false;

    },

    secondsToMinutes : function(milliseconds) {
        const seconds = milliseconds / 1000
        // seconds = Math.round(seconds * 1000) / 1000

        const minutes = Math.floor(seconds / 60);
        let extraSeconds = seconds % 60;
        extraSeconds = Math.round((seconds % 60) * 1000) / 1000

        // minutes = minutes < 10 ? "0" + minutes : minutes; // adds a zero before minutes number if less than 10 mins
        extraSeconds = extraSeconds < 10 ? "0" + extraSeconds : extraSeconds;
        return minutes + ":" + extraSeconds;
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
    },
    
    touchReleased : function(x,y) { // TRIGGERED BY InputHandler
        
        let clickedSidePanel = false;

        this.renderedButtons.forEach(button => {
            if (button.constructor.name == "Button") { // only run on buttons not sliders
                if ( // if x and y touch is within button
                    x >= button.x && x <= button.x + button.width &&
                    y >= button.y && y <= button.y + button.height &&
                    (MapBrowser.scrollVel == 0 || MapBrowser.scrollAmount == null) // dont release if scrolling in MapBrowser
                ) {
                    clickedSidePanel = true;
                    button.released();
                }

                button.isPressed = false
            } else { // button is a Slider
                // could add released on slider logic here (for the snapping slider)
            }
            
        });


        // test if released within the edit platform panel
        // needs to be matched with MapEditor.render() values
        //     x : canvasArea.canvas.width - 280,
        //     y : 20,
        //     width : 225,
        //     height : 320
        
        if (
            UserInterface.gamestate == 7 && MapEditor.editorState == 2 &&
            x >= canvasArea.canvas.width - 280 && x <= canvasArea.canvas.width - 280 + 225 &&
            y >= 20 && y <= 20 + 320
        ) {
            clickedSidePanel = true;
        }


        // DEALING WITH MAP EDITOR: Clicking player, clicking platforms
        // IF IN MAP EDITOR but not in map select screen within editor OR in map settings/color screen
        if (clickedSidePanel == false && this.gamestate == 7 && MapEditor.editorState != 0 && MapEditor.editorState != 3 && MapEditor.editorState != 4) { 

            // RELEASED ON PLATFORM
            MapEditor.renderedPlatforms.forEach(platform => {
                if (// if x and y touch is within platform (NOT ROTATED THOUGH)
                    x >= platform.x + MapEditor.screenX && x <= platform.x + platform.width + MapEditor.screenX &&
                    y >= platform.y + MapEditor.screenY && y <= platform.y + platform.height + MapEditor.screenY
                ) {
                    MapEditor.selectedPlatformIndex = MapEditor.loadedMap.platforms.indexOf(platform)
                    MapEditor.selectedCheckpointIndex = [-1,1]

                    this.renderedButtons = this.btnGroup_editPlatform;
                    
                    // SYNC ALL BUTTONS AND SLIDERS
                    btn_translate.func(true) // intially syncs the buttons position to the selected platform. Called whenever screen is scrolled too. not really needed here but avoids a 1 frame flash 
                    btn_resize.func(true)
                    btn_angleSlider.updateState(MapEditor.loadedMap.platforms[MapEditor.selectedPlatformIndex].angle)
                    btn_wall.func(true) // syncs the wall button's toggle state
                }
            })
            
            if ( // RELEASED on playerStart
                x >= MapEditor.loadedMap.playerStart.x + MapEditor.screenX - 16 && x <= MapEditor.loadedMap.playerStart.x + 16 + MapEditor.screenX &&
                y >= MapEditor.loadedMap.playerStart.y + MapEditor.screenY - 16 && y <= MapEditor.loadedMap.playerStart.y + 16 + MapEditor.screenY
            ) {
                MapEditor.selectedPlatformIndex = -2 // -2 means player is selected. Maybe change this to be its own variable
                MapEditor.selectedCheckpointIndex = [-1,1]

                this.renderedButtons = this.btnGroup_editPlayerStart

                // SYNC ALL BUTTONS AND SLIDERS
                btn_translate.func(true) // intially syncs the buttons position to the selected platform. Called whenever screen is scrolled too. not really needed here but avoids a 1 frame flash 
                btn_playerAngleSlider.updateState(MapEditor.loadedMap.playerStart.angle)
            }

            // RELEASED ON CHECKPOINT
            MapEditor.loadedMap.checkpoints.forEach(checkpoint => {
                let pressed = false;
                let clickedPlayerRestart = false;
                if ( // released checkpoint trigger 1
                    Math.abs(checkpoint.triggerX1 + MapEditor.screenX - x) <= 20 &&
                    Math.abs(checkpoint.triggerY1 + MapEditor.screenY - y) <= 20
                ) {
                    pressed = true;
                    MapEditor.selectedCheckpointIndex[1] = 1
                }

                if ( // released on checkpoint trigger 2
                    Math.abs(checkpoint.triggerX2 + MapEditor.screenX - x) <= 20 &&
                    Math.abs(checkpoint.triggerY2 + MapEditor.screenY - y) <= 20
                ) {
                    pressed = true;
                    MapEditor.selectedCheckpointIndex[1] = 2
                }
                
                if ( // released on playerRestart
                    Math.abs(checkpoint.x + MapEditor.screenX - x) <= 20 &&
                    Math.abs(checkpoint.y + MapEditor.screenY - y) <= 20
                ) {
                    pressed = true;
                    clickedPlayerRestart = true
                    MapEditor.selectedCheckpointIndex[1] = 3
                }
                

                if (pressed) { // Did click somewhere on the checkpoint

                    MapEditor.selectedCheckpointIndex[0] = MapEditor.loadedMap.checkpoints.indexOf(checkpoint)
                    MapEditor.selectedPlatformIndex = -1

                    this.renderedButtons =  this.btnGroup_editCheckPoint;

                    if (clickedPlayerRestart) {
                        this.renderedButtons.push(btn_checkpointAngleSlider)
                        btn_checkpointAngleSlider.updateState(MapEditor.loadedMap.checkpoints[MapEditor.selectedCheckpointIndex[0]].angle) // sync
                    }
                    
                    // SYNC ALL BUTTONS AND SLIDERS
                    btn_translate.func(true) // intially syncs the buttons position to the selected checkpoint. Called whenever screen is scrolled too. not really needed here but avoids a 1 frame flash 
                }
            })
        }
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
                canvasArea.ctx.fillText("Record: " + UserInterface.secondsToMinutes(Map.record), canvasArea.canvas.width - 240, 90);
            }


            if (this.showVelocity && this.levelState == 2) {
                canvasArea.ctx.font = "26px BAHNSCHRIFT";
                canvasArea.ctx.fillStyle = UserInterface.darkMode ? UserInterface.darkColor_1: UserInterface.lightColor_1;
                const offsetY = Tutorial.pausePlayer ? 34 : 60
                canvasArea.ctx.fillText("Speed: " + Math.round(player.velocity.magnitude()), midX - canvasArea.ctx.measureText("Speed: 00").width/2, offsetY)
            }


            if (this.debugText == 1) { // DRAWING DEBUG TEXT
                const textX = 200; 
                canvasArea.ctx.font = "15px BAHNSCHRIFT";
                canvasArea.ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1: UserInterface.lightColor_1;
    
                canvasArea.ctx.fillText("fps: " + Math.round(100/dt), textX, 60);
                canvasArea.ctx.fillText("rounded dt: " + Math.round(dt * 10) / 10 + " milliseconds", textX, 80);
                canvasArea.ctx.fillText("renderedPlatforms Count: " + Map.renderedPlatforms.length, textX, 100);
                canvasArea.ctx.fillText("endZoneIsRendered: " + Map.endZoneIsRendered, textX, 120);
                canvasArea.ctx.fillText("dragging: " + touchHandler.dragging, textX, 140);
                canvasArea.ctx.fillText("touchStartX: " + touchHandler.touchStartX, textX, 160);
                canvasArea.ctx.fillText("touchStartY: " + touchHandler.touchStartY, textX, 180);
                canvasArea.ctx.fillText("touch x: " + touchHandler.touchX, textX, 200);
                canvasArea.ctx.fillText("touch y: " + touchHandler.touchY, textX, 220);
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
    
            if (this.strafeHUD == 1) { // STRAFE OPTIMIZER HUD

                /* DRAW THE OLD LITTLE GRAPHS UNDER PLAYER
                canvasArea.ctx.fillRect(midX - 18, midY + 28, 8, 4 * Math.abs(touchHandler.dragAmountX) * UserInterface.sensitivity); // YOUR STRAFE
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
                    if (touchHandler.touchStartX > midX - 200 && touchHandler.touchStartX < midX + 200) { // if touched withing slider's X => offset the handle to lineup with finger
                        lineUpOffset = touchHandler.touchStartX - midX
                    }

                    let strafeDistanceX = touchHandler.touchX - touchHandler.touchStartX + lineUpOffset
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
    
                        if (this.showVerticalWarning) {
                            ctx.font = "22px BAHNSCHRIFT";


                            canvasArea.roundedRect(midX - 200, canvasArea.canvas.height - 180, ctx.measureText("DON'T SWIPE VERTICAL").width + 30, 30, 12)
                            
                            ctx.fillStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1
                            // ctx.strokeStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1
                            ctx.fill()
                            // ctx.stroke()

                            ctx.fillStyle = !UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1
                            // ctx.fillText("DON'T SWIPE VERTICAL", midX - ctx.measureText("DON'T SWIPE VERTICAL").width/2, 160)
                            ctx.fillText("DON'T SWIPE VERTICAL", midX - 185, canvasArea.canvas.height - 157)

                        }
                    }
                }
            }


            if (player.endSlow == 0) { // level name, your time, best time, strafe efficiency

                // END SCREEN BOX
                canvasArea.ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1 : UserInterface.lightColor_1;

                canvasArea.roundedRect(midX - 150, midY - 100, 300, 200, 25)

                canvasArea.ctx.save(); // save 3
                
                canvasArea.ctx.shadowColor = "rgba(0, 0, 0, 0.3)"; 
                canvasArea.ctx.shadowBlur = 20;
                canvasArea.ctx.fill();

                canvasArea.ctx.restore(); // restore 3
                

                // END SCREEN TEXT
                canvasArea.ctx.font = "25px BAHNSCHRIFT";

                canvasArea.ctx.fillStyle = (!UserInterface.darkMode) ? UserInterface.darkColor_1 : UserInterface.lightColor_1; // GRAY

                canvasArea.ctx.fillText("Level: " + Map.name, midX - 120, midY - 50);
                canvasArea.ctx.fillText("Time: " + UserInterface.secondsToMinutes(UserInterface.timer), midX - 120, midY - 0);
                canvasArea.ctx.fillText("Record: " + UserInterface.secondsToMinutes(Map.record), midX - 120, midY + 30);

                if (UserInterface.timer == Map.record) {canvasArea.ctx.fillText("New Record!", midX - 120, midY + 65)}

            }
        }
    }
}


const MapBrowser = { // should set back to 0 at some points?? 
    state : 0, // 0 = disabled, 1 = standard map browser, 2 = custom map browser
    scrollY: 0,
    scrollVel: 0,
    scrollVelAverager : new Averager(10),
    scrollAmount: null,
    selectedMapIndex: -1, // -1 == no map selected
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

        // CUSTOM MAP BROWSER
        if (this.state == 2) {
            
            this.scrollY = 0
            this.scrollVel = 0
            this.selectedMapIndex = -1

            // access file system and set up all nessasary map buttons for the browser type
            // a horrible nested mess but it keeps everything firing in the right sequence
            function initCustomMapBrowser(path){
                
                window.resolveLocalFileSystemURL(path, function (fileSystem) {
                    var reader = fileSystem.createReader();
                    reader.readEntries((entries) => { // entries is an array of all the maps
                        

                        // LOOP THROUGH EACH CUSTOM MAP
                        let mapNumber = 0
                        entries.forEach((mapEntry) => {
                            
                            let mapData = null;

                            // sets mapData by pulling from specific file
                            fileSystem.getFile(mapEntry.name, {create: false, exclusive: false}, (fileEntry) => {
                                fileEntry.file( (file) => {
                                    console.log(file)
                                    const reader = new FileReader();
                                    reader.onload = (e) => {

                                        mapData = JSON.parse(e.target.result)
                                        mapData.name = String(fileEntry.name.split(".")[0]) // for getting the name of a custom map
                                        // console.log(mapData)
                                        
                                    };
                                    reader.onerror = (e) => alert(e.target.error.name);
                                    
                                    reader.readAsText(file)
                                })
                            })
                            
                            // create toggle buttons for each map. These can be selected to preview map info. seperate play button will play them 

                            // create these with blank button icons. render() adds text ontop . ALSO CHANGE THE CHECK IN RENDER FUNC
                            let button = new Button(300, 50 + (100 * mapNumber), 280, "", "", 1, String(mapEntry.name.split(".")[0]), function(sync) {
                                // has access to mapEntry and .name
                                
                                // Use the buttons initial Y value to determine its index within all the maps. Silly but works
                                // I could also add a data paramater to the button class and pass the mapNumber into that.
                                // NEW SOLUTION? Use the label parameter. might just be more complicated

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
                                        MapBrowser.selectedMapIndex = (this.savedY - 50)/100
                                    }
                                }

                            })
                            
                            UserInterface.renderedButtons = UserInterface.renderedButtons.concat([button])
                            mapNumber ++
                            setMaxScroll()

                        }) // end of forEach loop                        
                    }, (error) => { console.log(error) });
                }, (error) => { console.log(error) });
            }
        
            initCustomMapBrowser(cordova.file.dataDirectory);
        }
        
        
    },
    
    toggleAllButtons : function() {
        UserInterface.renderedButtons.forEach(button => {
            if (button.toggle == 1) {button.toggle = 0}
        })
    },

    update : function() {
        // called every frame when gamestate == 2

        // changes the position of buttons on scroll
        if (touchHandler.dragging == 1 && touchHandler.touchX > 250 && touchHandler.touchX < 650) {
            if (this.scrollAmount == null) { // start of scroll
                this.scrollAmount = this.scrollY
            }

            // is scrolling
            // if (touchHandler.touchX > 250 && touchHandler.touchX < 650) { // dont need this check??
                this.scrollAmount += touchHandler.dragAmountY

                // sets scrollVel to average drag amount of past 10 frames
                this.scrollVelAverager.pushValue(touchHandler.dragAmountY)
                this.scrollVel = this.scrollVelAverager.getAverage()

                this.scrollY = this.scrollAmount;
            // }
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



        // ENABLING and DISABLING btn_playMap in browsers BESIDES map editor's

        if (MapEditor.editorState != 5) { // not in map editors browser
            
            // ADDING AND REMOVING btn_playmap
            if (
                this.selectedMapIndex != -1 &&
                !UserInterface.renderedButtons.includes(btn_playMap)
            ) {UserInterface.renderedButtons = UserInterface.renderedButtons.concat(btn_playMap)}
            
            if (
                this.selectedMapIndex == -1 &&
                UserInterface.renderedButtons.includes(btn_playMap)
            ) {UserInterface.renderedButtons = UserInterface.renderedButtons.slice(0,-1)}


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
        const boxHeight = (MapEditor.editorState == 5) ? 150 : 300
        canvasArea.roundedRect(canvasArea.canvas.width - 500, 50, 400, boxHeight, 25)
        ctx.fill()

        // DRAW TEXT INFO BOX
        ctx.font = "40px BAHNSCHRIFT";
        ctx.fillStyle = (!UserInterface.darkMode) ? UserInterface.darkColor_1: UserInterface.lightColor_1;

        if (this.state == 1) { // normal map browser
            if (this.selectedMapIndex != -1) {
                ctx.fillText(this.selectedMapIndex, canvasArea.canvas.width - 475, 110)
            } else {
                ctx.fillText("Select A Map", canvasArea.canvas.width - 475, 110)
            }
        }

        if (this.state == 2) { // custom map browser
            if (this.selectedMapIndex != -1) {
                // Needs to do indexing stuff to get names of map selected (like in playMap Button)
                ctx.fillText("Custom Map " + (this.selectedMapIndex + 1), canvasArea.canvas.width - 475, 110)
            } else {
                ctx.font = "30px BAHNSCHRIFT";
                ctx.fillText("Import, Edit, & Create", canvasArea.canvas.width - 475, 100)
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
    pausePlayer : false,
    animatePos : 0,
    animateVel : 0,
    decalLoadState : -1, // -1 no, 0 started load, 4 finished load (number of decals loaded)
    decalList : ["horizontal_finger", "vertical_finger", "finger", "arrow"],

    reset : function() { // called on restart and when leaving level
        this.state = 0;
        this.targets = [[240,50],[120,50],[180,50],[0,50],[60,50],[300,50]];
        this.timerStarted = false;
        this.timerCompleted = false;
        this.pausePlayer = false;
        this.animatePos = 0;
        this.animateVel = 0;
    },



    update : function() {
        if (UserInterface.gamestate == 2) { // in map browser
            if (MapBrowser.selectedMapIndex !== "Awakening" || UserInterface.playTutorial == false) { // tutorial level not selected
                this.isActive = false;
            }
        } 

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
            if (
                !UserInterface.renderedButtons.includes(btn_next) &&  
                Math.abs(player.lookAngle.getAngle() - Map.playerStart.angle) > 45
            ) {
                UserInterface.renderedButtons = UserInterface.renderedButtons.concat(btn_next)
            }
        }

        if (!this.timerStarted && (
            this.state == 2 || 
            this.state == 7 || 
            this.state == 10 ||
            this.state == 14 ||
            this.state == 16 ||
            this.state == 18
        )) {
            setTimeout(() => {UserInterface.renderedButtons = UserInterface.renderedButtons.concat(btn_next)}, 1500);
            this.timerStarted = true;
        }

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

        if (!this.timerStarted && this.state == 6) { // jumping for 2 seconds
            setTimeout(() => {this.timerStarted = false; this.state ++; this.pausePlayer = true}, 2000);
            this.timerStarted = true;
        }

        if (this.state == 8 || this.state == 12) { // wait for a second then allow player to progess by swiping
            if (!this.timerStarted && !this.timerCompleted) {
                setTimeout(() => {this.timerStarted = false; this.timerCompleted = true}, 1200);
                this.timerStarted = true;
            }

            if (this.timerCompleted && touchHandler.dragging == true) {
                this.state ++; 
                this.pausePlayer = false
                this.timerCompleted = false
            }
        }

        if (this.state == 9) {
            if (player.checkpointIndex == 4) {this.state ++; this.pausePlayer = true}
        }

        if (this.state == 11) {
            if (player.checkpointIndex == 1) {this.state ++; this.pausePlayer = true}
        }

        // 12 is bundled with state 8 ^^

        if (this.state == 13) {
            if (player.checkpointIndex == 2) {this.state ++; this.pausePlayer = true}
        }

        if (this.state == 15) {
            if (player.checkpointIndex == 0) {this.state ++; this.pausePlayer = true}
        }

        if (this.state == 17) { // check if ended level
            if (UserInterface.levelState == 3) {this.state ++;}
        }

    },


    render : function() {
        const ctx = canvasArea.ctx;
        canvasArea.ctx.font = "28px BAHNSCHRIFT";
        const bg_color = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1;
        const icon_color = !UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1;

        // DEBUG TEXT
        // ctx.fillText("state: " + this.state, midX - 200, 34)
        // ctx.fillText(this.targets, 300, midY)


        function drawTextPanel (text){
            const textWidth = ctx.measureText(text).width

            ctx.fillStyle = bg_color
            canvasArea.roundedRect(midX - 25 - textWidth/2, 50, textWidth + 50, 80, 25)
            ctx.fill()

            ctx.fillStyle = icon_color
            ctx.fillText(text, midX - textWidth/2, 100)
            
            btn_next.x = midX + textWidth/2 + 45
        }


        if (this.state == 1) {
            drawTextPanel("Slide horizontally to turn the player");

            if (this.animatePos == 0 && this.animateVel == 0) {this.animateVel = 3} // STARTING ANIMATION
            if (this.animatePos > 0) {this.animateVel -= 0.06 * dt}
            if (this.animatePos < 0) {this.animateVel += 0.06 * dt}
            this.animatePos += this.animateVel * dt

            if (touchHandler.dragging == false) {
                const image = this.decalList[0]
                ctx.drawImage(image, midX - image.width/2 + this.animatePos, canvasArea.canvas.height - image.height - 60)
            }
        }


        if (this.state == 2) {
            drawTextPanel("Sliding vertically does NOT turn the player")

            if (this.animatePos == 0 && this.animateVel == 0) {this.animateVel = 2.5} // STARTING ANIMATION
            if (this.animatePos > 0) {this.animateVel -= 0.05 * dt}
            if (this.animatePos < 0) {this.animateVel += 0.05 * dt}
            this.animatePos += this.animateVel * dt

            if (touchHandler.dragging == false) {
                const image = this.decalList[1]
                ctx.drawImage(image, midX - 250, midY - 60 + this.animatePos)
            }
        }


        if (this.state == 3 && this.targets.length > 0) { // Targets

            const targetCounter = String(6 - this.targets.length + "/6")
            drawTextPanel("Rotate the player to look at the targets: " + targetCounter)
            
            ctx.save() // #4
            
            ctx.translate(midX, midY)
            ctx.rotate(this.targets[0][0] * Math.PI / 180)

            ctx.strokeStyle = Map.style.shadowColor
            ctx.fillStyle = Map.style.shadowColor
            ctx.lineWidth = 8
            ctx.lineCap = "round"

    
            // DRAW TARGET SHADOW
            if (this.targets[0][1] > 0) { // these two blocks could be a function. theyre called twice
                ctx.beginPath()
                ctx.arc(75, 0, 14, 0, (this.targets[0][1] / 50) * (2 * Math.PI));
                ctx.stroke()
            }

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

            if (this.targets[0][1] < 50 ) {
                ctx.beginPath()
                ctx.arc(75, 0, 5, 0, 2 * Math.PI);
                ctx.fill()
            }

                
            ctx.restore() // #4
            
        }



        if (this.state == 5) {
            drawTextPanel("Start jumping by pressing the jump button")
            
            if (this.animatePos == 0 && this.animateVel == 0) {this.animateVel = 1} // STARTING ANIMATION
            if (this.animatePos > 0) {this.animateVel -= 0.03 * dt}
            if (this.animatePos < 0) {this.animateVel += 0.03 * dt}
            this.animatePos += this.animateVel * dt

            const image = this.decalList[3] // ARROW
            ctx.drawImage(image, btn_jump.x + 150 + this.animatePos, btn_jump.y + btn_jump.width/2 - image.height/2)
        }


        if (this.state == 7) {
            drawTextPanel("Stay on the red platforms")  
        }

        
        if (this.state == 8) {
            drawTextPanel("Slide horizontally to change the direction of the player")

            if (this.animatePos == 0 && this.animateVel == 0) {this.animateVel = 3} // STARTING ANIMATION
            if (this.animatePos > 20) {this.animateVel -= 0.06 * dt}
            if (this.animatePos < -20) {this.animateVel += 0.06 * dt}
            this.animatePos += this.animateVel * dt

            if (touchHandler.dragging == false && this.timerCompleted) {
                const image = this.decalList[0]
                ctx.drawImage(image, midX - image.width/2 + this.animatePos, canvasArea.canvas.height - image.height - 60)
            }
        }


        if (this.state == 10) {
            drawTextPanel("Slow and smooth swipes increase speed")

            // graphic showing smooth turn vs sharp turn?
        }


        if (this.state == 12) {
            drawTextPanel("Turn smoothly to gain speed and clear the gap")
            
            if (this.animatePos == 0 && this.animateVel == 0) {this.animateVel = 3} // STARTING ANIMATION
            if (this.animatePos > 20) {this.animateVel -= 0.06 * dt}
            if (this.animatePos < -20) {this.animateVel += 0.06 * dt}
            this.animatePos += this.animateVel * dt

            if (touchHandler.dragging == false && this.timerCompleted) {
                const image = this.decalList[0]
                ctx.drawImage(image, midX - image.width/2 + this.animatePos, canvasArea.canvas.height - image.height - 60)
            }
        }


        if (this.state == 14) {
            drawTextPanel("Don't touch the brown walls")
        }


        if (this.state == 16) {
            drawTextPanel("Reach the gold endzone to finish the level")
        }


        if (this.state == 18) {
            drawTextPanel("Finish levels faster to climb the leaderboards")

            // arrow to leaderboard??
        }


        if (this.state == 19) {
            drawTextPanel("Click here to select a new level")

            // arrow to back button
            if (this.animatePos == 0 && this.animateVel == 0) {this.animateVel = 1} // STARTING ANIMATION
            if (this.animatePos > 0) {this.animateVel -= 0.03 * dt}
            if (this.animatePos < 0) {this.animateVel += 0.03 * dt}
            this.animatePos += this.animateVel * dt

            const image = this.decalList[3] // ARROW
            ctx.drawImage(image, btn_mainMenu.x + 150 + this.animatePos, btn_mainMenu.y + btn_mainMenu.width/2 - image.height/2)
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
        "x": 130,
        "y": 125,
        "width": 70,
        "height": 70,
        "angle": 45,
        "endzone": 0,
        "wall": 0
    },

    wall : {
        "x": 45,
        "y": 60,
        "width": 50,
        "height": 100,
        "angle": 45,
        "endzone": 0,
        "wall": 1
    },

    endzone : {
        "x": 215,
        "y": 60,
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

            MapEditor.loadedMap.style.lightAngleVector =  new Vector(Math.cos(MapEditor.loadedMap.style.lightAngle * (Math.PI/180)), Math.sin(MapEditor.loadedMap.style.lightAngle * (Math.PI/180)))
            const shadowX = MapEditor.loadedMap.style.lightAngleVector.x * MapEditor.loadedMap.style.shadowLength;
            const shadowY = MapEditor.loadedMap.style.lightAngleVector.y * MapEditor.loadedMap.style.shadowLength;

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

            const litPercent1 = (side1Vec.angleDifference(MapEditor.loadedMap.style.lightAngleVector)* (180/Math.PI)) / 180
            const litPercent2 = (side2Vec.angleDifference(MapEditor.loadedMap.style.lightAngleVector)* (180/Math.PI)) / 180
            const litPercent3 = (side3Vec.angleDifference(MapEditor.loadedMap.style.lightAngleVector)* (180/Math.PI)) / 180
            
            platform.lit_topColor = canvasArea.getShadedColor(colorToUse2, 1)
            platform.sideColor1 = canvasArea.getShadedColor(colorToUse, litPercent1)
            platform.sideColor2 = canvasArea.getShadedColor(colorToUse, litPercent2)
            platform.sideColor3 = canvasArea.getShadedColor(colorToUse, litPercent3)


            // SHADOW POLYGON
            const angleRad = platform.angle * (Math.PI/180);
            const wallShadowMultiplier = platform.wall ? (1 + (MapEditor.loadedMap.style.wallHeight / MapEditor.loadedMap.style.platformHeight)) : 1;

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
        MapEditor.loadedMap.style.lit_playerTop = canvasArea.getShadedColor(MapEditor.loadedMap.style.playerColor, 1) // 0.2 instead of 0 to pretend there's bounce lighting
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
            ctx.translate(PreviewWindow.x + platform.x + platform.width/2, PreviewWindow.y + platform.y + platform.height/2);

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
            ctx.translate(PreviewWindow.x + platform.x + platform.width/2, PreviewWindow.y + platform.y + platform.height/2 - adjustedHeight);
            ctx.rotate(platform.angle * Math.PI/180);


            
            ctx.fillStyle = platform.lit_topColor

            ctx.fillRect(-platform.width/2, -platform.height/2, platform.width, platform.height);

            ctx.restore(); // restores platform rotation NOT translation


            // SIDES OF PLATFORMS
            ctx.save();
            ctx.translate(PreviewWindow.x + platform.x + platform.width/2, PreviewWindow.y + platform.y + platform.height/2);

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
            const litPercent = (sideVector.angleDifference(MapEditor.loadedMap.style.lightAngleVector)* (180/Math.PI)) / 180
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
            const litPercent = (sideVector.angleDifference(MapEditor.loadedMap.style.lightAngleVector)* (180/Math.PI)) / 180
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
            const litPercent = (sideVector.angleDifference(MapEditor.loadedMap.style.lightAngleVector)* (180/Math.PI)) / 180
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
            const litPercent = (sideVector.angleDifference(MapEditor.loadedMap.style.lightAngleVector)* (180/Math.PI)) / 180
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
    screenX : 0, // where the view is located
    screenY : 0,

    scrollVelAveragerX : new Averager(10),
    scrollVelAveragerY : new Averager(10),

    renderedPlatforms : [],
    selectedPlatformIndex : -1, // -1 = nothing, -2 = player
    selectedCheckpointIndex : [-1,1],
    snapAmount : 0,
    multiSelect : false,
    debugText : false,

    render : function() {

        if (this.loadedMap !== null) { // IF MAP IS LOADED RENDER IT
            const ctx = canvasArea.ctx;
            ctx.save() // moving to screenx and screeny
            ctx.translate(this.screenX, this.screenY);


            ctx.fillRect(-2, -2, 4, 4) // (0,0) map origin


            // RENDER PLATFORMS
            this.renderedPlatforms.forEach(platform => {
                // DRAW PLATFORM TOP
                ctx.save(); // ROTATING for Platforms
                ctx.translate(platform.x + platform.width/2, platform.y + platform.height/2);
                ctx.rotate(platform.angle * Math.PI/180);

                // Change to endzone color if needed. Also where its determined if endzone is being rendered
                if (platform.wall) {
                    ctx.fillStyle = this.loadedMap.style.wallTopColor;
                } else if (platform.endzone) {
                    ctx.fillStyle = this.loadedMap.style.endZoneTopColor;
                } else {
                    ctx.fillStyle = this.loadedMap.style.platformTopColor;
                }
                
                ctx.fillRect(-platform.width/2, -platform.height/2, platform.width, platform.height);



                if (platform == this.loadedMap.platforms[this.selectedPlatformIndex]) { // DRAWING THE BORDER AROUND THE SELECTED PLATFORM
                    
                    ctx.strokeStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1
                    ctx.lineWidth = 4
                    ctx.strokeRect(-platform.width/2 + 2, -platform.height/2 + 2, platform.width - 4, platform.height - 4);
                }
                

                // PLAFORM RENDERING DEBUG TEXT
                // ctx.fillStyle = "#FFFFFF";
                // ctx.fillText("angle: " + platform.angle, 0,-20);
                // ctx.fillText("position: " + platform.x + ", " + platform.y, 0, 0);
                // ctx.fillText("screen Loc X mid: " + (platform.x + platform.width/2 + this.screenX), 0, 20);
                // ctx.fillText("screen Loc Y: " + (platform.y + platform.height/2 + this.screenY), 0, 40);

                ctx.restore(); // restoring platform rotation and translation

                // Draw platform corner and origin debug points
                // ctx.fillStyle = "#00FF00";
                // ctx.fillRect(platform.x, platform.y, 5, 5)
                // const angleRad = platform.angle * (Math.PI/180);
                // const pinCornerX = -((platform.width / 2) * Math.cos(angleRad)) + ((platform.height / 2) * Math.sin(angleRad))
                // const pinCornerY = -((platform.width / 2) * Math.sin(angleRad)) - ((platform.height / 2) * Math.cos(angleRad))
                // ctx.fillStyle = "#0000FF";
                // ctx.fillRect(pinCornerX + platform.x + platform.width/2, pinCornerY + platform.y + platform.height/2, 5, 5)
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


                if (checkpoint == this.loadedMap.checkpoints[this.selectedCheckpointIndex[0]]) { // DRAWING THE BORDER AROUND parts of THE SELECTED Checkpoint
                    
                    
                    if (this.selectedCheckpointIndex[1] == 1) { // trigger 1
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

                    if (this.selectedCheckpointIndex[1] == 2) { // trigger 2
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

                    if (this.selectedCheckpointIndex[1] == 3) { // player restart


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


                }

            });


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

            if (this.selectedPlatformIndex == -2) { // DRAWING SELECTION BORDER AROUND PLAYER
                ctx.strokeStyle = UserInterface.darkColor_1
                ctx.lineWidth = 6
                ctx.strokeRect(-13, -13, 26, 26);
                
                ctx.strokeStyle = UserInterface.lightColor_1
                ctx.lineWidth = 2
                ctx.strokeRect(-13, -13, 26, 26);
            }

            ctx.restore() //restoring player rotation and transformation
            ctx.restore() // restoring screenx and screeny translation



            // MAP EDITOR UI
            ctx.font = "20px BAHNSCHRIFT";


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

                if (this.selectedPlatformIndex == -2) { // player start is selected
                    
                    ctx.fillText("Player Start", sidePanel.x + 25, sidePanel.y + 100);
                    ctx.fillText("Position: " + this.loadedMap.playerStart.x + ", " + this.loadedMap.playerStart.y, sidePanel.x + 25, sidePanel.y + 130);

                }
                
                if (this.selectedPlatformIndex >= 0){ // platform is selected
                    
                    ctx.fillText("Platform", sidePanel.x + 25, sidePanel.y + 100);
                    ctx.fillText("Position: " + this.loadedMap.platforms[this.selectedPlatformIndex].x + ", " + this.loadedMap.platforms[this.selectedPlatformIndex].y, sidePanel.x + 25, sidePanel.y + 130);
                    ctx.fillText("Size: " + this.loadedMap.platforms[this.selectedPlatformIndex].width + ", " + this.loadedMap.platforms[this.selectedPlatformIndex].height, sidePanel.x + 25, sidePanel.y + 160);
                    ctx.fillText("Wall: " + (this.loadedMap.platforms[this.selectedPlatformIndex].wall?"Yes":"No"), sidePanel.x + 25, sidePanel.y + 280)
  
                }

                if (this.selectedCheckpointIndex[0] >= 0){ // checkpoint is selected
        
                    ctx.fillText("Checkpoint", sidePanel.x + 25, sidePanel.y + 100);
                    ctx.fillText("Trigger 1: " + this.loadedMap.checkpoints[this.selectedCheckpointIndex[0]].triggerX1 + ", " + this.loadedMap.checkpoints[this.selectedCheckpointIndex[0]].triggerY1, sidePanel.x + 25, sidePanel.y + 130);
                    ctx.fillText("Trigger 2: " + this.loadedMap.checkpoints[this.selectedCheckpointIndex[0]].triggerX2 + ", " + this.loadedMap.checkpoints[this.selectedCheckpointIndex[0]].triggerY2, sidePanel.x + 25, sidePanel.y + 160);
                    ctx.fillText("Respawn Pos: " + this.loadedMap.checkpoints[this.selectedCheckpointIndex[0]].x + ", " + this.loadedMap.checkpoints[this.selectedCheckpointIndex[0]].y, sidePanel.x + 25, sidePanel.y + 190);
  
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


            if (this.debugText) {
                
                // GENERAL MAP EDITOR DEBUG TEXT
                const textX = 150;
                ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1 :  UserInterface.lightColor_1;
                ctx.fillText("screenX: " + this.screenX, textX, 60);
                ctx.fillText("touchX: " + Math.round(touchHandler.touchX - this.screenX), textX, 80);
                ctx.fillText("touchY: " + Math.round(touchHandler.touchY - this.screenY), textX, 100);
                ctx.fillText("previousX: " + touchHandler.previousX, textX, 120);
                ctx.fillText("rendered platforms: " + this.renderedPlatforms.length, textX, 140);
                ctx.fillText("editorState: " + this.editorState, textX, 160);
                ctx.fillText("selected platform index: " + this.selectedPlatformIndex, textX, 180);
                
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

                this.screenX = -this.loadedMap.playerStart.x + canvasArea.canvas.width/2;
                this.screenY = -this.loadedMap.playerStart.y + canvasArea.canvas.height/2;

                this.editorState = 1
            }
        }

        if (this.editorState == 1 || this.editorState == 2) { // main map edit screen OR platform select screen

            // SCROLLING THE SCREEN and SETTING OBJECTS TO ANGLE SLIDERS VALUES EVERY FRAME
            if (touchHandler.dragging == 1 &&
                !btn_translate.isPressed && 
                !btn_resize.isPressed && 
                btn_angleSlider.confirmed && 
                btn_playerAngleSlider.confirmed && 
                btn_checkpointAngleSlider.confirmed && 
                btn_snappingSlider.confirmed 
            ){
                if (this.scrollAmountX == null && this.scrollAmountY == null) { // starting scroll
                    this.scrollAmountX = this.screenX;
                    this.scrollAmountY = this.screenY;
                }

                this.scrollAmountX += touchHandler.dragAmountX
                this.scrollAmountY += touchHandler.dragAmountY


                // sets scrollVel to average drag amount of past 10 frames
                this.scrollVelAveragerX.pushValue(touchHandler.dragAmountX)
                this.scrollVelAveragerY.pushValue(touchHandler.dragAmountY)

                this.scrollVelX = this.scrollVelAveragerX.getAverage()
                this.scrollVelY = this.scrollVelAveragerY.getAverage()

                this.screenX = this.scrollAmountX;
                this.screenY = this.scrollAmountY;
            
            } else { // not dragging around screen

                if (this.scrollAmountX != null && this.scrollAmountY != null) { // just stopped dragging
                    this.scrollAmountX = null
                    this.scrollAmountY = null

                    this.scrollVelAveragerX.clear()
                    this.scrollVelAveragerY.clear()
                }
    
                this.screenX += this.scrollVelX
                this.screenY += this.scrollVelY
                this.scrollVelX = (Math.abs(this.scrollVelX) > 0.1) ? this.scrollVelX * (1 - 0.05 * dt) : 0 // dampening
                this.scrollVelY = (Math.abs(this.scrollVelY) > 0.1) ? this.scrollVelY * (1 - 0.05 * dt) : 0


                // UPDATE THE ANGLE OF OBJECTS WHEN THEIR ANGLE SLIDER IS PRESSED
                if (!btn_angleSlider.confirmed) {this.loadedMap.platforms[this.selectedPlatformIndex].angle = btn_angleSlider.value}
                if (!btn_playerAngleSlider.confirmed) {this.loadedMap.playerStart.angle = btn_playerAngleSlider.value}
                if (!btn_checkpointAngleSlider.confirmed) {this.loadedMap.checkpoints[this.selectedCheckpointIndex[0]].angle = btn_checkpointAngleSlider.value}
            }



            // FIGURING OUT WHICH PLATFORMS TO RENDER IN MAP EDITOR
            this.renderedPlatforms = [];

            this.loadedMap.platforms.forEach(platform => { // Loop through platforms
                if (!platform.hypotenuse) {platform.hypotenuse = Math.sqrt(platform.width * platform.width + platform.height * platform.height)/2}

                if (
                    (platform.x + platform.width/2 + platform.hypotenuse + this.screenX > 0) && // coming into frame on left side
                    (platform.x + platform.width/2 - platform.hypotenuse + this.screenX < canvasArea.canvas.width) && // right side
                    (platform.y + platform.height/2 + platform.hypotenuse + this.screenY > 0) && // top side
                    (platform.y + platform.height/2 - platform.hypotenuse + this.screenY < canvasArea.canvas.height) // bottom side
                ) {
                    this.renderedPlatforms.push(platform); // ADD platform to renderedPlatforms
                }
            });


        }

        // UPDATING SLIDER CHANGES EVERY FRAME
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

            if (!btn_lightAngleSlider.confirmed) {
                this.loadedMap.style.lightAngle = btn_lightAngleSlider.value
                PreviewWindow.update()
            }

            if (!btn_shadowLengthSlider.confirmed) {
                this.loadedMap.style.shadowLength = btn_shadowLengthSlider.value
                PreviewWindow.update()
            }   
        }



        if (this.editorState == 2) { // update translate and resize buttons every frame

            if (UserInterface.renderedButtons.includes(btn_translate)) {
                btn_translate.func(true)
            }
            
            if (UserInterface.renderedButtons.includes(btn_resize)) {
                btn_resize.func(true) // update tag is true -- distinguish between updates and touch releases
            }
        }


        // changing the editorState
        if (this.editorState == 1 && (this.selectedPlatformIndex != -1 || this.selectedCheckpointIndex[0] != -1)) {
            this.editorState = 2;
        }

        if (this.editorState == 2 && (this.selectedPlatformIndex == -1 && this.selectedCheckpointIndex[0] == -1)) {
            this.editorState = 1;
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
                    "lightAngle": map.style.lightAngle,
                    "shadowLength": map.style.shadowLength
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
            MapEditor.screenX = 0;
            MapEditor.screenY = 0;
            MapEditor.scrollX_vel = 0;
            MapEditor.scrollY_vel = 0;
            MapEditor.snapAmount = 0;
            MapEditor.renderedPlatforms = [];
            MapEditor.selectedPlatformIndex = -1;
            MapEditor.selectedCheckpointIndex = [-1,1];
            btn_snappingSlider.updateState(0);
            
            UserInterface.renderedButtons = UserInterface.btnGroup_mapEditorMenu
        }

        function sortPlatformsBACKUP(platforms) {  // returns array of sorted platforms
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

                // global coordinates of left and rightmost corners
                platform.leftMostCornerX = platform.cornersSorted[0][0] + platform.x + platform.width/2
                platform.leftMostCornerY = platform.cornersSorted[0][1] + platform.y + platform.height/2
                
                platform.rightMostCornerX = platform.cornersSorted[3][0] + platform.x + platform.width/2
                platform.rightMostCornerY = platform.cornersSorted[3][1] + platform.y + platform.height/2


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

            /*
            function sortY(a, b) {
                // if return is negative ... a comes first 
                // if return is positive ... b comes first
                // return is 0... nothing is changed
                if (a.y + a.height/2 < b.y + b.height/2) {return -1;}
                if (a.y + a.height/2 > b.y + b.height/2) {return 1;}
                return 0;
            }
            */

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


            // take unsorted platforms array
            // select 2 platforms and place them sorted into new array
            // select platform from unsorted array
            // compare this platform with each platform in the sorted array
            // if this platform needs to be in front of a platform in the sorted array, record that index
            // after comparing this platform to every platform in the sorted array, move it into the highest recorded index(needs to be in front of this index) within the sorted array


            let sortedPlatforms = []
            console.log(platforms)

            platforms.forEach( platform => {
                let deepestIndex = 0
                let indexBeingChecked = 0
                
                sortedPlatforms.forEach( sortedPlatform => {        

                    if (test_A_below_B(platform, sortedPlatform)) {
                        deepestIndex = indexBeingChecked + 1

                        // console.log("v infront of platform " + sortedPlatform.y)
                    } else {
                        // console.log("^ NOT it front of " + sortedPlatform.y)
                    }    

                    indexBeingChecked ++
                })

                sortedPlatforms.splice(deepestIndex, 0, platform) // array.splice(start, deleteCount, item1);

                console.log("[][][] SPLICED " + platform.y + " to index " + deepestIndex + ". indexes checked: " + indexBeingChecked)
            })


            console.log("finished sort in: " + (Date.now() - millis) + "ms")


            return sortedPlatforms

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
                platform.leftMostCornerX = platform.cornersSorted[0][0] + platform.x + platform.width/2
                platform.leftMostCornerY = platform.cornersSorted[0][1] + platform.y + platform.height/2
                
                platform.rightMostCornerX = platform.cornersSorted[3][0] + platform.x + platform.width/2
                platform.rightMostCornerY = platform.cornersSorted[3][1] + platform.y + platform.height/2


                // Get global coordinates of top and bot corners
                if (platform.cornersSorted[1][1] < platform.cornersSorted[2][1]) {
                    platform.topCornerX = platform.cornersSorted[1][0] + platform.x + platform.width / 2
                    platform.topCornerY = platform.cornersSorted[1][1] + platform.y + platform.height / 2
                    platform.botCornerX = platform.cornersSorted[2][0] + platform.x + platform.width / 2
                    platform.botCornerY = platform.cornersSorted[2][1] + platform.y + platform.height / 2
                } else {
                    platform.topCornerX = platform.cornersSorted[2][0] + platform.x + platform.width / 2
                    platform.topCornerY = platform.cornersSorted[2][1] + platform.y + platform.height / 2
                    platform.botCornerX = platform.cornersSorted[1][0] + platform.x + platform.width / 2
                    platform.botCornerY = platform.cornersSorted[1][1] + platform.y + platform.height / 2
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


        function writeCustomMap(exportObj, exportName) {
            console.log("WRITING MAP NOW!")
            exportName = prompt("Enter Map Name");

            // writes (dataObj) to cordova.file.dataDirectory with specified (name)
            function writeFile(exportName, dataObj) {
                // create directory and empty file
                window.resolveLocalFileSystemURL(cordova.file.dataDirectory, (directoryEntry) => {
                    directoryEntry.getFile(exportName + ".json", {create: true, exclusive: false}, (logFileEntry) => {
                        // addding to the empty file
                        logFileEntry.createWriter(function(writer) {
                            writer.onwriteend = function() {
                                
                                console.log("Successful Save");
                                
                                exitEdit()
                            };
                    
                            writer.onerror = function(e) {
                                console.log("Error :(", e);
                            };
                    
                            writer.write(dataObj);
                        });
                    });
                }, error => {console.log(error)});
            }

            const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });

            writeFile(exportName, blob)
        }
    },

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
        // this.successAudio.volume = 0.5 * UserInterface.volume;
        // this.splashAudio.volume = 0.4 * UserInterface.volume;
        // this.jumpAudio.volume = 0.5 * UserInterface.volume;

        this.menuMusic.setVolume(UserInterface.volume);
        this.successAudio.setVolume(UserInterface.volume);
        this.jumpAudio.setVolume(UserInterface.volume);
        this.splashAudio.setVolume(UserInterface.volume);
    },
}


const Map = {
    walls : [],
    renderedPlatforms : [],
    wallsToCheck : [],
    endZoneIsRendered : false,
    name : null,
    record : null,
    upperShadowClip : new Path2D(),
    endZoneShadowClip : new Path2D(),
    playerClip : new Path2D(), // calculated every frame
    endZone : null,

    initMap : function (name) {
        this.platforms = [];
        this.playerStart = null;
        this.style = null;
        this.checkpoints = [];
        this.upperShadowClip = new Path2D()
        this.endZoneShadowClip = new Path2D()

        

        if (typeof name  === "string"){ // distinguishing between loading a normal map (string) OR a custom map (object)
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
        
            
        } else { // is an object (CUSTOM MAP)
            this.name = name.name;
            console.log("passed an object. CUSTOM MAP below: ")
            console.log(name)
            this.parseMapData(name)
        }
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
        this.style.lightAngleVector =  new Vector(Math.cos(this.style.lightAngle * (Math.PI/180)), Math.sin(this.style.lightAngle * (Math.PI/180)))
        const shadowX = this.style.lightAngleVector.x * this.style.shadowLength;
        const shadowY = this.style.lightAngleVector.y * this.style.shadowLength;

        let platformIndex = 0 // set this so that it is z-order
        this.platforms.forEach(platform => { // CALCULATE PLATFORMS COLORS and SHADOW POLYGON

            // Setting the colors for platforms, endzones, and walls
            let colorToUse1 = this.style.platformTopColor;
            let colorToUse2 = this.style.platformSideColor;

            if (platform.endzone) {
                colorToUse1 = this.style.endZoneTopColor;
                colorToUse2 = this.style.endZoneSideColor;
                this.endZone = platform;
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

            const litPercent1 = (side1Vec.angleDifference(this.style.lightAngleVector)* (180/Math.PI)) / 180
            const litPercent2 = (side2Vec.angleDifference(this.style.lightAngleVector)* (180/Math.PI)) / 180
            const litPercent3 = (side3Vec.angleDifference(this.style.lightAngleVector)* (180/Math.PI)) / 180

            platform.shaded_topColor = canvasArea.getShadedColor(colorToUse1, 1)
            platform.shaded_sideColor1 = canvasArea.getShadedColor(colorToUse2, litPercent1)
            platform.shaded_sideColor2 = canvasArea.getShadedColor(colorToUse2, litPercent2)
            platform.shaded_sideColor3 = canvasArea.getShadedColor(colorToUse2, litPercent3)

            // SHADOW POLYGON
            const angleRad = platform.angle * (Math.PI/180);
            const wallShadowMultiplier = platform.wall ? (this.style.wallHeight + this.style.platformHeight) / this.style.platformHeight : 1 // makes sure shadows are longer for taller walls

            platform.shadowPoints = [ // ALL THE POSSIBLE POINTS TO INPUT IN CONVEX HULL FUNCTION
            
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


            const clipToUse = platform.endzone ? this.endZoneShadowClip : this.upperShadowClip // get shadow clip to add this platform to

            // SHADOW CLIP FOR UPPER PLAYER SHADOW
            clipToUse.moveTo( // bot left
                platform.x + platform.width/2 + platform.corners[0][0], // x
                platform.y + platform.height/2 + platform.corners[0][1] // y
            )
            
            clipToUse.lineTo( // bot right
                platform.x + platform.width/2 + platform.corners[1][0],
                platform.y + platform.height/2 + platform.corners[1][1]
            )

            clipToUse.lineTo( // top right
                platform.x + platform.width/2 + platform.corners[2][0],
                platform.y + platform.height/2 + platform.corners[2][1]
            )

            clipToUse.lineTo( // top left
                platform.x + platform.width/2 + platform.corners[3][0],
                platform.y + platform.height/2 + platform.corners[3][1]
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
        this.style.shaded_playerColor = canvasArea.getShadedColor(this.style.playerColor, 1) // 0.2 instead of 0 to pretend there's bounce lighting
        this.style.shaded_backgroundColor = canvasArea.getShadedColor(this.style.backgroundColor, 1)

        this.style.shadow_platformColor = canvasArea.getShadedColor(this.style.platformTopColor, 0.2) // 0.2 instead of 0 to pretend there's bounce lighting
        this.style.shadow_endzoneColor = canvasArea.getShadedColor(this.style.endZoneTopColor, 0.2)
        this.style.shadow_backgroundColor = canvasArea.getShadedColor(this.style.backgroundColor, 0.2)
        

        canvasArea.canvas.style.backgroundColor = this.style.shaded_backgroundColor;
        document.body.style.backgroundColor = this.style.shaded_backgroundColor;
        player = new Player(this.playerStart.x, this.playerStart.y, this.playerStart.angle);

        // Get map record from local storage
        this.record = window.localStorage.getItem("record_" + this.name)

        UserInterface.determineButtonColor();
        UserInterface.mapLoaded(); // moves onto gamestate 6
        
    },


    update : function() {  // Figure out which platforms are in view. Update Map.playerClip
        // checks if endZoneIsRendered at the bottom

        this.renderedPlatforms = [];
        this.wallsToCheck = [];


        this.platforms.forEach(platform => { // Loop through ALL platforms to get renderedPlatforms

            const adjustedHeight = platform.wall ? this.style.wallHeight : 0 // for adding height to walls
            const wallShadowMultiplier = platform.wall ? (this.style.wallHeight + this.style.platformHeight) / this.style.platformHeight : 1 // makes sure shadows are longer for taller walls

            if (
                (platform.x + platform.width/2 + platform.hypotenuse + (this.style.shadowLength * wallShadowMultiplier) > player.x - midX) && // coming into frame on left side
                (platform.x + platform.width/2 - platform.hypotenuse - (this.style.shadowLength * wallShadowMultiplier) < player.x + midX) && // right side
                (platform.y + platform.height/2 + platform.hypotenuse + (this.style.shadowLength * wallShadowMultiplier) + this.style.platformHeight > player.y - midY) && // top side
                (platform.y + platform.height/2 - platform.hypotenuse - (this.style.shadowLength * wallShadowMultiplier) - adjustedHeight < player.y + midY) // bottom side
            ) {
                this.renderedPlatforms.push(platform); // ADD platform to renderedPlatforms
            }
        }); // end of looping through ALL platforms


        this.playerClip = new Path2D() // resets the clip every frame. when it is used there must be an counter clockwise rectangle drawn first to invert clip

        this.endZoneIsRendered = false; // resets every frame. if one of renderedPlatforms is an endzone then its made true

        this.renderedPlatforms.forEach(platform => { // Loop through RENDERED platforms (will loop through in order of index)
                                    
            if (platform.wall) {
                
                if ( // if wall is close enough to player that it needs to be checked with player rotation
                    (platform.x + platform.width/2 + platform.hypotenuse > player.x - 25) && // colliding with player from left
                    (platform.x + platform.width/2 - platform.hypotenuse < player.x + 25) && // right side
                    (platform.y + platform.height/2 + platform.hypotenuse > player.y - 73) && // top side
                    (platform.y + platform.height/2 - platform.hypotenuse - this.style.wallHeight < player.y + 25) // bottom side
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
                        (player.x <= platform.x + platform.width/2 && player.rightMostPlayerCornerY < platform.getSplitLineY(player.rightMostPlayerCornerX)) ||  
                        (player.x > platform.x + platform.width/2 && player.leftMostPlayerCornerY < platform.getSplitLineY(player.leftMostPlayerCornerX))
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
                                    platform.x + platform.width / 2 + platform.clipPoints[i][0], // x
                                    platform.y + platform.height / 2 + platform.clipPoints[i][1] // y
                                )
                            } else { // its not the first point in the hull so use lineTo
                                Map.playerClip.lineTo(
                                    platform.x + platform.width / 2 + platform.clipPoints[i][0], // x
                                    platform.y + platform.height / 2 + platform.clipPoints[i][1] // y
                                )
                            }
                        }

                        Map.playerClip.closePath()
                    }

                }   
            }

            if (platform.endzone) {
                this.endZoneIsRendered = true;
            }
        }); // end of looping through each rendered platform

    },


    renderPlatform : function(platform) { // seperate function to render platforms so that it can be called at different times (ex. called after drawing player inorder to render infront)
        
        const ctx = canvasArea.ctx;        
        
        // DRAW PLATFORM TOP
        ctx.save(); // #17 GO TO PLATFORMs MIDDLE AND ROTATING 
        const adjustedHeight = platform.wall ? this.style.wallHeight : 0 // for adding height to walls
        ctx.translate(platform.x + platform.width/2, platform.y + platform.height/2 - adjustedHeight);
        ctx.rotate(platform.angle * Math.PI/180);

        ctx.fillStyle = platform.shaded_topColor;        
        
        ctx.fillRect(-platform.width/2, -platform.height/2, platform.width, platform.height);

        ctx.restore(); // #17 restores platform translation and rotation


        // SIDES OF PLATFORMS
        ctx.save(); // #18
        ctx.translate(platform.x + platform.width/2, platform.y + platform.height/2);

        const angleRad = platform.angle * (Math.PI/180);
        
        // platform angles should only be max of 90 and -90 in mapData
        // calculating shading works with any angle but sides arent draw because drawing "if statements" are hardcoded to 90 degrees

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
        if (UserInterface.debugText) {
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



        // LOOP THROUGHT TO DRAW PLATFORMS SHADOWS
        this.renderedPlatforms.forEach(platform => { 

            ctx.save(); // #21
            ctx.translate(platform.x + platform.width/2, platform.y + platform.height/2);

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
        if (UserInterface.debugText == true) {
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
    touchStartX = null;
    touchStartY = null;
    previousX = 0;
    previousY = 0;
    touchX = 0;
    touchY = 0;
    dragging = false;
    currentDragID = null;
    averageDragX = new Averager(30)
    averageDragY = new Averager(30)


    constructor() {

        window.addEventListener("touchstart", e => {
            // e.preventDefault() // attempt to suppress highlighting magnifing glass (didnt work on old ios)

            
            for (let i = 0; i < e.changedTouches.length; i++){ // for loop needed incase multiple touches are sent in the same frame

                if (this.dragging == false) { // if this should be the new dragging touch
                    this.currentDragID = e.changedTouches[i].identifier;
                    this.dragging = true;

                    this.touchStartX = this.touchX = e.changedTouches[i].pageX * canvasArea.scale;
                    this.touchStartY = this.touchY = e.changedTouches[i].pageY * canvasArea.scale;
                    this.previousX = e.changedTouches[i].pageX * canvasArea.scale;
                    this.previousY = e.changedTouches[i].pageY * canvasArea.scale;
                }

                UserInterface.touchStarted(e.changedTouches[i].pageX * canvasArea.scale, e.changedTouches[i].pageY * canvasArea.scale); // sends touchStarted for every touchStart

            }
        });


        window.addEventListener("touchmove", e => {
            for (let i = 0; i < e.changedTouches.length; i++){ // for loop needed incase multiple touches are sent in the same frame

                if (e.changedTouches[i].identifier == this.currentDragID) { // if this touch is the dragging touch
                    this.touchX = e.changedTouches[i].pageX * canvasArea.scale;
                    this.touchY = e.changedTouches[i].pageY * canvasArea.scale;
                }

                if (this.dragging == false) { // if main drag is released but theres another to jump to
                    this.currentDragID = e.changedTouches[i].identifier;
                }

            }
        });


        window.addEventListener("touchcancel", e => { // Fixes tripple tap bugs by reseting everything
            this.currentDragID = null;
            this.dragging = false;
        });

        window.addEventListener("touchend", e => {

            for (let i = 0; i < e.changedTouches.length; i++){ // for loop needed incase multiple touches are sent in the same frame

                if (this.dragging && e.changedTouches[i].identifier == this.currentDragID) { // might not need to check if dragging is true here
                    
                    // released current drag

                    this.averageDragX.clear()
                    this.averageDragY.clear()

                    if (e.touches.length == 0) { // if theres no other drags to switch to

                        this.currentDragID = null;
                        this.dragAmountX = 0;
                        this.dragAmountY = 0;
                        this.touchStartX = null;
                        this.touchStartY = null;
                        this.touchX = 0;
                        this.touchY = 0;
                        this.previousX = 0;
                        this.previousY = 0;
                        this.dragging = false;


                    } else { // switch to another touch for primary dragging
                        this.currentDragID = e.touches[0].identifier
                        this.touchStartX = this.touchX = e.touches[0].pageX * canvasArea.scale;
                        this.touchStartY = this.touchY = e.touches[0].pageY * canvasArea.scale;
                        this.previousX = e.touches[0].pageX * canvasArea.scale;
                        this.previousY = e.touches[0].pageY * canvasArea.scale;
                    }
            
                }

                UserInterface.touchReleased(e.changedTouches[i].pageX * canvasArea.scale, e.changedTouches[i].pageY * canvasArea.scale); // sends touchRealease for every release

            }
        });
    }

    update() {
        if (this.dragging == true) {
            this.dragAmountX = this.touchX - this.previousX;
            this.dragAmountY = this.touchY - this.previousY;

            this.averageDragX.pushValue(this.dragAmountX)
            this.averageDragY.pushValue(this.dragAmountY)

            this.previousY = this.touchY;
            this.previousX = this.touchX;
        }

        // FOR TESTING
        // this.dragAmountX = 2 * dt;
        // console.log(2 * dt)
    }

}


class Player {
    jumpValue = 0;
    jumpVelocity = 2;
    endSlow = 1;
    gain = 0;
    checkpointIndex = -1;

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

        if (Map.endZoneIsRendered) { // draw a clipped version of the players shadow over endzone
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
            const litPercent = (sideVector.angleDifference(Map.style.lightAngleVector)* (180/Math.PI)) / 180
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
            const litPercent = (sideVector.angleDifference(Map.style.lightAngleVector)* (180/Math.PI)) / 180
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
            const litPercent = (sideVector.angleDifference(Map.style.lightAngleVector)* (180/Math.PI)) / 180
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
            const litPercent = (sideVector.angleDifference(Map.style.lightAngleVector)* (180/Math.PI)) / 180
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
            ctx.strokeRect(-15, -15, 30, 30)
            ctx.stroke()
        }

        ctx.restore() // #24.5
    
    }

    startLevel() {
        this.velocity.set(6,0); // 6,0
        this.velocity = this.velocity.rotate(this.lookAngle.getAngle());
    }

    updatePos() {  // NEEDS TO BE FPS INDEPENDENT
        
        if (UserInterface.levelState == 1 || UserInterface.levelState == 2) { // if NOT at end screen

            this.lookAngle = this.lookAngle.rotate(touchHandler.dragAmountX * UserInterface.sensitivity)
            
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
            
            if (this.addSpeed > airAcceleration * dt) {this.addSpeed = airAcceleration * dt; console.log("maxspeed clipped by AA")} // addspeed is to big and needs to be limited by airacceleration value
            if (this.addSpeed <= 0) {this.addSpeed = 0; console.log("zero addspeed")} // currentSpeedProjected is greater than max_speed. dont add speed
            
            
            // addSpeed is a scaler for wishdir. if addspeed == 0 no wishdir is applied
            this.velocity.x += (this.wishDir.x * this.addSpeed)
            this.velocity.y += (this.wishDir.y * this.addSpeed)
            // addSpeed needs to be adjusted by dt. Bigger dt, less fps, bigger addSpeed


            // APPLYING VELOCITY
            this.x += this.velocity.x / 5 * dt;
            this.y += this.velocity.y / 5 * dt;



            
            // JUMPING
            if (this.jumpValue < 0) { 
                this.jumpValue = 0;
                this.jumpVelocity = 2;
                AudioHandler.jumpAudio.play();
                if (!this.checkCollision(Map.renderedPlatforms)) {
                    AudioHandler.splashAudio.play();
                    this.teleport();
                }
            } else {
                this.jumpValue += this.jumpVelocity * dt;
                this.jumpVelocity -= gravity * dt;
            }


            // CHECK IF COLLIDING WITH WALLS
            if (this.checkCollision(Map.wallsToCheck)) {

                // new wall collision that doesnt instakill
                // get walls normal
                // subtract that normals direction

                AudioHandler.splashAudio.play();
                this.teleport();
            }
    


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

            // CHECK IF COLLIDING WITH ENDZONE
            if (Map.endZoneIsRendered) { 
                if (this.checkCollision([Map.endZone])) {
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

    checkCollision(arrayOfPlatformsToCheck) { // called every time player hits the floor ALSO used to check endzone collision
        let collision = 0;
        arrayOfPlatformsToCheck.forEach(platform => { // LOOP THROUGH PLATFORMS

            class Rectangle{
                constructor(x,y,width,height,angle){
                    this.x = x;
                    this.y = y;
                    this.width = width;
                    this.height = height;
                    this.angle = angle;
                }
            }

            const rectangleStore = [
                new Rectangle(player.x-16, player.y-16, 32, 32, player.lookAngle.getAngle()),
                new Rectangle(platform.x, platform.y, platform.width, platform.height, platform.angle)
            ]

            canvasArea.ctx.fillRect(rectangleStore[0].x, rectangleStore[0].y, rectangleStore[0].width, rectangleStore[0].height)

            function workOutNewPoints(cx, cy, vx, vy, rotatedAngle){ //From a rotated object
                //cx,cy are the centre coordinates, vx,vy is the point to be measured against the center point
                    //Convert rotated angle into radians
                    rotatedAngle = rotatedAngle * Math.PI / 180;
                    const dx = vx - cx;
                    const dy = vy - cy;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const originalAngle = Math.atan2(dy,dx);
                    const rotatedX = cx + distance * Math.cos(originalAngle + rotatedAngle);
                    const rotatedY = cy + distance * Math.sin(originalAngle + rotatedAngle);
                
                    return {
                        x: rotatedX,
                        y: rotatedY
                    }
            }
            
            //Get the rotated coordinates for the square
            function getRotatedSquareCoordinates(square){
                const centerX = square.x + (square.width / 2);
                const centerY = square.y + (square.height / 2);
                //Work out the new locations
                const topLeft = workOutNewPoints(centerX, centerY, square.x, square.y, square.angle);
                const topRight = workOutNewPoints(centerX, centerY, square.x + square.width, square.y, square.angle);
                const bottomLeft = workOutNewPoints(centerX, centerY, square.x, square.y + square.height, square.angle);
                const bottomRight = workOutNewPoints(centerX, centerY, square.x + square.width, square.y + square.height, square.angle);
                return{
                    tl: topLeft,
                    tr: topRight,
                    bl: bottomLeft,
                    br: bottomRight
                }
            }
            
            //Functional objects for the Seperate Axis Theorum (SAT)
            //Single vertex
            function xy(x,y){
                this.x = x;
                this.y = y;
            };
            //The polygon that is formed from vertices and edges.
            function polygon(vertices, edges){
                this.vertex = vertices;
                this.edge = edges;
            };

            //The actual Seperate Axis Theorum function
            function sat(polygonA, polygonB){
                let perpendicularLine = null;
                let dot = 0;
                const perpendicularStack = [];
                let amin = null;
                let amax = null;
                let bmin = null;
                let bmax = null;
                //Work out all perpendicular vectors on each edge for polygonA
                for(let i = 0; i < polygonA.edge.length; i++){
                    perpendicularLine = new xy(-polygonA.edge[i].y,
                                                polygonA.edge[i].x);
                    perpendicularStack.push(perpendicularLine);
                }
                //Work out all perpendicular vectors on each edge for polygonB
                for(let i = 0; i < polygonB.edge.length; i++){
                    perpendicularLine = new xy(-polygonB.edge[i].y,
                                                polygonB.edge[i].x);
                    perpendicularStack.push(perpendicularLine);
                }
                //Loop through each perpendicular vector for both polygons
                for(let i = 0; i < perpendicularStack.length; i++){
                    //These dot products will return different values each time
                    amin = null;
                    amax = null;
                    bmin = null;
                    bmax = null;
                    /*Work out all of the dot products for all of the vertices in PolygonA against the perpendicular vector
                    that is currently being looped through*/
                    for(let j = 0; j < polygonA.vertex.length; j++){
                        dot = polygonA.vertex[j].x *
                                perpendicularStack[i].x +
                                polygonA.vertex[j].y *
                                perpendicularStack[i].y;
                        //Then find the dot products with the highest and lowest values from polygonA.
                        if(amax === null || dot > amax){
                            amax = dot;
                        }
                        if(amin === null || dot < amin){
                            amin = dot;
                        }
                    }
                    /*Work out all of the dot products for all of the vertices in PolygonB against the perpendicular vector
                    that is currently being looped through*/
                    for(let j = 0; j < polygonB.vertex.length; j++){
                        dot = polygonB.vertex[j].x *
                                perpendicularStack[i].x +
                                polygonB.vertex[j].y *
                                perpendicularStack[i].y;
                        //Then find the dot products with the highest and lowest values from polygonB.
                        if(bmax === null || dot > bmax){
                            bmax = dot;
                        }
                        if(bmin === null || dot < bmin){
                            bmin = dot;
                        }
                    }
                    //If there is no gap between the dot products projection then we will continue onto evaluating the next perpendicular edge.
                    if((amin < bmax && amin > bmin) ||
                        (bmin < amax && bmin > amin)){
                        continue;
                    }
                    //Otherwise, we know that there is no collision for definite.
                    else {
                        return false;
                    }
                }
                /*If we have gotten this far. Where we have looped through all of the perpendicular edges and not a single one of there projections had
                a gap in them. Then we know that the 2 polygons are colliding for definite then.*/
                return true;
            }

            //Detect for a collision between the 2 rectangles
            function detectRectangleCollision(index){

                const thisRect = rectangleStore[0];
                const otherRect = rectangleStore[1];

                //Get rotated coordinates for both rectangles
                const tRR = getRotatedSquareCoordinates(thisRect);
                const oRR = getRotatedSquareCoordinates(otherRect);
                //Vertices & Edges are listed in clockwise order. Starting from the top right
                const thisTankVertices = [
                    new xy(tRR.tr.x, tRR.tr.y),
                    new xy(tRR.br.x, tRR.br.y),
                    new xy(tRR.bl.x, tRR.bl.y),
                    new xy(tRR.tl.x, tRR.tl.y),
                ];
                const thisTankEdges = [
                    new xy(tRR.br.x - tRR.tr.x, tRR.br.y - tRR.tr.y),
                    new xy(tRR.bl.x - tRR.br.x, tRR.bl.y - tRR.br.y),
                    new xy(tRR.tl.x - tRR.bl.x, tRR.tl.y - tRR.bl.y),
                    new xy(tRR.tr.x - tRR.tl.x, tRR.tr.y - tRR.tl.y)
                ];
                const otherTankVertices = [
                    new xy(oRR.tr.x, oRR.tr.y),
                    new xy(oRR.br.x, oRR.br.y),
                    new xy(oRR.bl.x, oRR.bl.y),
                    new xy(oRR.tl.x, oRR.tl.y),
                ];
                const otherTankEdges = [
                    new xy(oRR.br.x - oRR.tr.x, oRR.br.y - oRR.tr.y),
                    new xy(oRR.bl.x - oRR.br.x, oRR.bl.y - oRR.br.y),
                    new xy(oRR.tl.x - oRR.bl.x, oRR.tl.y - oRR.bl.y),
                    new xy(oRR.tr.x - oRR.tl.x, oRR.tr.y - oRR.tl.y)
                ];
                const thisRectPolygon = new polygon(thisTankVertices, thisTankEdges);
                const otherRectPolygon = new polygon(otherTankVertices, otherTankEdges);

                if(sat(thisRectPolygon, otherRectPolygon)){
                    collision += 1;
                    
                }else{
                    
                    //Because we are working with vertices and edges. This algorithm does not cover the normal un-rotated rectangle
                    //algorithm which just deals with sides
                    if(thisRect.angle === 0 && otherRect.angle === 0){
                        if(!(
                            thisRect.x>otherRect.x+otherRect.width || 
                            thisRect.x+thisRect.width<otherRect.x || 
                            thisRect.y>otherRect.y+otherRect.height || 
                            thisRect.y+thisRect.height<otherRect.y
                        )){
                            collision += 1;
                        }
                    }
                }
            }

            detectRectangleCollision(platform);
        
        });
        
        if (collision > 0) {return true} else {return false}
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
