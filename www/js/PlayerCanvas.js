const PlayerCanvas = {
    
    start : function() { // called in deviceReady
        this.canvas = document.createElement("canvas")

        this.scale = CanvasArea.scale

        this.canvas.width = screenWidth;
        this.canvas.height = screenHeight;

        this.canvas.style.width = screenWidthUI + "px";
        this.canvas.style.height = screenHeightUI + "px";

        this.canvas.style.display = "none"

        this.ctx = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        },


    clear : function() { // CLEARS WHOLE CANVAS
        this.ctx.clearRect(0, 0, screenWidth, screenHeight)
    },
}