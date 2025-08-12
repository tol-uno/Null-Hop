const UserInterfaceCanvas = {
    start: function () {
        // called in deviceReady
        this.canvas = document.createElement("canvas");

        this.scale = window.devicePixelRatio || 1;

        this.canvas.width = window.outerWidth * this.scale;
        this.canvas.height = window.outerHeight * this.scale;

        this.canvas.style.width = window.outerWidth + "px";
        this.canvas.style.height = window.outerHeight + "px";

        this.canvas.style.position = "absolute";
        this.canvas.style.zIndex = "1";

        this.ctx = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
    },

    clear: function () {
        // CLEARS WHOLE CANVAS
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },

    mapToRange: function (number, inMin, inMax, outMin, outMax) {
        // MAP TO RANGE: https://stackoverflow.com/questions/10756313/javascript-jquery-map-a-range-of-numbers-to-another-range-of-numbers
        return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    },

    roundedRect: function (x, y, width, height, radius) {
        const ctx = UserInterfaceCanvas.ctx;

        // Clamp radius if it's too large
        const r = Math.min(radius, width / 2, height / 2);

        ctx.beginPath();
        ctx.moveTo(x + r, y); // Start at top-left corner (after rounding)

        // Top edge + top-right corner
        ctx.lineTo(x + width - r, y);
        ctx.arc(x + width - r, y + r, r, -Math.PI / 2, 0);

        // Right edge + bottom-right corner
        ctx.lineTo(x + width, y + height - r);
        ctx.arc(x + width - r, y + height - r, r, 0, Math.PI / 2);

        // Bottom edge + bottom-left corner
        ctx.lineTo(x + r, y + height);
        ctx.arc(x + r, y + height - r, r, Math.PI / 2, Math.PI);

        // Left edge + top-left corner
        ctx.lineTo(x, y + r);
        ctx.arc(x + r, y + r, r, Math.PI, 1.5 * Math.PI);

        ctx.closePath();
    },

    roundedRectQuadratic: function (x, y, width, height, radius) {
        // not perfect corner arcs
        const ctx = UserInterfaceCanvas.ctx;

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
};
