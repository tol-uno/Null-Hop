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


    // KILL KILL KILL
    // resize : function() { // SHOULDNT REALLY EVER BE CALLED 
    //     console.log("resized :)");

    //     this.canvas.width = window.outerWidth;
    //     this.canvas.height = window.outerHeight;

    //     midX = this.canvas.width / 2;
    //     midY = this.canvas.height / 2;

    // },


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


    getShadedColor: function (color, litPercent) { 
        // litPercent is how much influence the direct light has on the surface. 
        // 1 = completly lit by direct
        // 0 = no direct light only ambient light is illuminating surface
        // 0.5 means direct and ambient have equal influence over lighting the surface

        const directWeight = litPercent;
        const ambientWeight = 1 - litPercent;
        
        let directLight;
        let ambientLight;

        if (UserInterface.gamestate == 5 || UserInterface.gamestate == 6) {
            directLight = Map.style.directLight ?? "rba(255,255,255)"
            ambientLight = Map.style.ambientLight ?? "rba(50,50,50)"
        } else {
            directLight = MapEditor.loadedMap.style.directLight ?? "rba(255,255,255)"
            ambientLight = MapEditor.loadedMap.style.ambientLight ?? "rba(50,50,50)"
        }

        // parse main color
        color = color.replace(/[^\d,.]/g, '').split(',')
        color = {
            r : color[0],
            g : color[1],
            b : color[2],
        }
        
        
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
        
        
        // calculate contributions of lights with weights
        const colorWithDirectWeighted = {
            r : color.r * directLight.r/255 * directWeight,
            g : color.g * directLight.g/255 * directWeight,
            b : color.b * directLight.b/255 * directWeight,
        }

        // const colorWithAmbientWeighted = {
        //     r : color.r * ambientLight.r/255 * ambientWeight,
        //     g : color.g * ambientLight.g/255 * ambientWeight,
        //     b : color.b * ambientLight.b/255 * ambientWeight,
        // }
        
        const colorWithAmbientWeighted = {
            r : color.r * ambientLight.r/255,
            g : color.g * ambientLight.g/255,
            b : color.b * ambientLight.b/255,
        }

        // combine the contributions (weighted to account for influence)
        color = {
            r : colorWithDirectWeighted.r + colorWithAmbientWeighted.r,
            g : colorWithDirectWeighted.g + colorWithAmbientWeighted.g,
            b : colorWithDirectWeighted.b + colorWithAmbientWeighted.b,
        }

        // clamp and round values to ensure they are not over 255
        color = {
            r : Math.round(Math.min(color.r, 255)),
            g : Math.round(Math.min(color.g, 255)),
            b : Math.round(Math.min(color.b, 255)),
        }


        return `rgb(${color.r},${color.g},${color.b})`
    },


    generateGradient : function (x1, y1, x2, y2, colorRGB, contrast, reverse = false) { // dark to light unless reversed
        // contrast is the + and - to apply to lightess in hsl colors

        // parse rgb 
        let color1 = colorRGB.replace(/[^\d,.]/g, '').split(',')
        color1 = {
            r : color1[0],
            g : color1[1],
            b : color1[2],
        }
        
        // convert to hsl ARRAY
        color1 = this.RGBToHSL(color1.r, color1.g, color1.b)
        
        // adjust lightness
        let color2 = [color1[0], color1[1], Math.min(255, color1[2] + contrast)] // set first so color1 isnt modified
        color1 = [color1[0], color1[1], Math.max(0, color1[2] - contrast)]

        // convert back to rgb string
        color1 = this.HSLToRGB(color1[0], color1[1], color1[2])
        color2 = this.HSLToRGB(color2[0], color2[1], color2[2])
        
        const gradient = CanvasArea.ctx.createLinearGradient(x1, y1, x2, y2)
        
        gradient.addColorStop(0, reverse ? color2 : color1)
        gradient.addColorStop(1, reverse ? color1 : color2)
        
        return gradient 
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