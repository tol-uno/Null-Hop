const PlayerCanvas = {
    start: function () {
        // called in onDeviceReady()

        this.canvas = document.getElementById("player-canvas");
        this.ctx = this.canvas.getContext("2d");

        this.scale = CanvasArea.scale;

        this.setSize();
    },

    setSize: function () {
        this.canvas.width = screenWidth;
        this.canvas.height = screenHeight;
    },

    clear: function (x = 0, y = 0) {
        this.ctx.clearRect(x, y, screenWidth, screenHeight);
    },
};
