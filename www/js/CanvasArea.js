const CanvasArea = {
    start: function () {
        // called in onDeviceReady()

        this.canvas = document.getElementById("map-canvas");
        this.ctx = this.canvas.getContext("2d");

        this.scale = window.devicePixelRatio || 1;

        this.setSize();
    },

    setSize: function () {
        // these screen size vars are initialized in index.js for global accesss
        screenWidthUI = window.innerWidth;
        screenHeightUI = window.innerHeight;

        this.canvas.width = screenWidth = screenWidthUI * this.scale;
        this.canvas.height = screenHeight = screenHeightUI * this.scale;

        midX = screenWidth / 2;
        midY = screenHeight / 2;
        midX_UI = screenWidthUI / 2;
        midY_UI = screenHeightUI / 2;
    },

    clear: function () {
        this.ctx.clearRect(0, 0, screenWidth, screenHeight);
    },


    HSLToRGB: function (h, s, l) {
        s /= 100;
        l /= 100;
        const k = (n) => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return "rgb(" + Math.round(255 * f(0)) + "," + Math.round(255 * f(8)) + "," + Math.round(255 * f(4)) + ")";
    },

    RGBToHSL: function (r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        let max = Math.max(r, g, b),
            min = Math.min(r, g, b);
        let h,
            s,
            l = (max + min) / 2;

        if (max == min) {
            h = s = 0; // achromatic
        } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }

        return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    },

    getShadedColor: function (color, litPercent, styleData) {
        // litPercent is how much influence the direct light has on the surface.
        // 1 = completly lit by direct
        // 0 = no direct light only ambient light is illuminating surface
        // 0.5 means direct and ambient have equal influence over lighting the surface

        const directWeight = litPercent;

        let directLight = styleData.directLight ?? "rba(255,255,255)";
        let ambientLight = styleData.ambientLight ?? "rba(50,50,50)";

        // parse main color
        color = color.replace(/[^\d,.]/g, "").split(",");
        color = {
            r: color[0],
            g: color[1],
            b: color[2],
        };

        // parse directLight color
        directLight = directLight.replace(/[^\d,.]/g, "").split(",");
        directLight = {
            r: directLight[0],
            g: directLight[1],
            b: directLight[2],
        };

        // parse ambientLight color
        ambientLight = ambientLight.replace(/[^\d,.]/g, "").split(",");
        ambientLight = {
            r: ambientLight[0],
            g: ambientLight[1],
            b: ambientLight[2],
        };

        // calculate contributions of lights with weights
        const colorWithDirectWeighted = {
            r: ((color.r * directLight.r) / 255) * directWeight,
            g: ((color.g * directLight.g) / 255) * directWeight,
            b: ((color.b * directLight.b) / 255) * directWeight,
        };

        const colorWithAmbientWeighted = {
            r: (color.r * ambientLight.r) / 255,
            g: (color.g * ambientLight.g) / 255,
            b: (color.b * ambientLight.b) / 255,
        };

        // combine the contributions (weighted to account for influence)
        color = {
            r: colorWithDirectWeighted.r + colorWithAmbientWeighted.r,
            g: colorWithDirectWeighted.g + colorWithAmbientWeighted.g,
            b: colorWithDirectWeighted.b + colorWithAmbientWeighted.b,
        };

        // clamp and round values to ensure they are not over 255
        color = {
            r: Math.round(Math.min(color.r, 255)),
            g: Math.round(Math.min(color.g, 255)),
            b: Math.round(Math.min(color.b, 255)),
        };

        return `rgb(${color.r},${color.g},${color.b})`;
    },

    generateGradient: function (x1, y1, x2, y2, colorRGB, contrast, reverse = false) {
        // dark to light unless reversed
        // contrast is the + and - to apply to lightess in hsl colors

        // parse rgb
        let color1 = colorRGB.replace(/[^\d,.]/g, "").split(",");
        color1 = {
            r: color1[0],
            g: color1[1],
            b: color1[2],
        };

        // convert to hsl ARRAY
        color1 = this.RGBToHSL(color1.r, color1.g, color1.b);

        // adjust lightness
        let color2 = [color1[0], color1[1], Math.min(255, color1[2] + contrast)]; // set first so color1 isnt modified
        color1 = [color1[0], color1[1], Math.max(0, color1[2] - contrast)];

        // convert back to rgb string
        color1 = this.HSLToRGB(color1[0], color1[1], color1[2]);
        color2 = this.HSLToRGB(color2[0], color2[1], color2[2]);

        const gradient = CanvasArea.ctx.createLinearGradient(x1, y1, x2, y2);

        gradient.addColorStop(0, reverse ? color2 : color1);
        gradient.addColorStop(1, reverse ? color1 : color2);

        return gradient;
    },
};
