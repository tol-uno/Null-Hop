const UserInterfaceCanvas = {

    start: function () { // called in deviceReady
        this.canvas = document.createElement("canvas")

        this.scale = window.devicePixelRatio || 1

        this.canvas.width = window.outerWidth * this.scale;
        this.canvas.height = window.outerHeight * this.scale;

        this.canvas.style.width = window.outerWidth + "px";
        this.canvas.style.height = window.outerHeight + "px";

        this.canvas.style.position = "absolute";
        this.canvas.style.zIndex = "1";

        this.ctx = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
    },


    clear: function () { // CLEARS WHOLE CANVAS
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    },

    mapToRange: function (number, inMin, inMax, outMin, outMax) {

        // MAP TO RANGE: https://stackoverflow.com/questions/10756313/javascript-jquery-map-a-range-of-numbers-to-another-range-of-numbers
        return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    },

    roundedRect: function (x, y, width, height, radius) { // not perfect corner arcs. could use .arc() instead
        const ctx = UserInterfaceCanvas.ctx

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