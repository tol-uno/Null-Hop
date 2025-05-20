const PlayerCanvas = {
    
    start : function() { // called in deviceReady
        this.canvas = document.createElement("canvas")

        this.scale = window.devicePixelRatio || 1

        this.canvas.width = window.outerWidth * this.scale;
        this.canvas.height = window.outerHeight * this.scale;

        this.canvas.style.width = window.outerWidth + "px";
        this.canvas.style.height = window.outerHeight + "px";

        this.canvas.style.display = "none"

        this.ctx = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        },


    clear : function() { // CLEARS WHOLE CANVAS
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    },
}