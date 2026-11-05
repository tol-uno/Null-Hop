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
        screenWidthUI = window.outerWidth;
        screenHeightUI = window.outerHeight;

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
};
