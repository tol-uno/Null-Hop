const CanvasArea = {
    
    start : function() { // called in deviceReady
        this.canvas = document.createElement("canvas")

        this.scale = 1.3

        this.canvas.width = window.outerWidth * this.scale;
        this.canvas.height = window.outerHeight * this.scale;

        this.canvas.style.width = window.outerWidth + "px";
        this.canvas.style.height = window.outerHeight + "px";

        midX = CanvasArea.canvas.width / 2;
        midY = CanvasArea.canvas.height / 2;

        this.ctx = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        
        prevDateNow = performance.now()

        this.interval = setInterval(updateGameArea, 10); // Number sets the taget frame rate. 1000/# = FPS

        UserInterface.start(); // need to be ran here after canvas is resized in CanvasArea.start()
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


    HSLToRGB: function(h, s, l) {
        s /= 100;
        l /= 100;
        const k = n => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = n =>
          l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return "rgb(" + Math.round(255 * f(0)) + "," + Math.round(255 * f(8)) + "," + Math.round(255 * f(4)) + ")"
    },


    RGBToHSL: function (r, g, b) {
        r /= 255
        g /= 255
        b /= 255

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
        const ctx = CanvasArea.ctx

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