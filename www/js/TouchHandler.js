const TouchHandler = {
    dragAmountX: 0,
    dragAmountY: 0,
    dragging: false,

    zoom: {
        isZooming: false,
        x: null, // middle point between the two zooming fingers
        y: null,
        startLength: null,
        ratio: null,
    },

    touches: [],
    averageDragX: new Averager(30),
    averageDragY: new Averager(30),

    init: function () {
        window.addEventListener("touchstart", (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                // for loop needed incase multiple touches are sent in the same frame

                const touch = {
                    identifier: e.changedTouches[i].identifier,
                    x: e.changedTouches[i].pageX,
                    y: e.changedTouches[i].pageY,
                    startX: e.changedTouches[i].pageX,
                    startY: e.changedTouches[i].pageY,
                    previousX: e.changedTouches[i].pageX,
                    previousY: e.changedTouches[i].pageY,
                };

                if (this.dragging == false) {
                    this.dragging = true;
                }

                UserInterface.touchStarted(touch.x, touch.y); // sends touchStarted for every touchStart

                this.touches.push(touch);
            }

            if (UserInterface.gamestate == 7 && this.touches.length >= 2) {
                // If in map editor
                this.zoom.isZooming = true;
                this.zoom.x = (this.touches[0].x + this.touches[1].x) / 2;
                this.zoom.y = (this.touches[0].y + this.touches[1].y) / 2;
                this.zoom.startLength = Math.sqrt((this.touches[1].x - this.touches[0].x) ** 2 + (this.touches[1].y - this.touches[0].y) ** 2);
                this.zoom.ratio = 1;
            }
        });

        window.addEventListener("touchmove", (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                // for loop needed incase multiple touches are sent in the same frame

                const touch = {
                    identifier: e.changedTouches[i].identifier,
                    x: e.changedTouches[i].pageX,
                    y: e.changedTouches[i].pageY,
                };

                // updating this touch within this.touches
                const touchIndex = this.touches.findIndex((t) => t.identifier == touch.identifier);

                this.touches[touchIndex].x = touch.x;
                this.touches[touchIndex].y = touch.y;
            }

            if (this.zoom.isZooming) {
                this.zoom.x = (this.touches[0].x + this.touches[1].x) / 2;
                this.zoom.y = (this.touches[0].y + this.touches[1].y) / 2;
                let currentLength = Math.sqrt((this.touches[1].x - this.touches[0].x) ** 2 + (this.touches[1].y - this.touches[0].y) ** 2);
                this.zoom.ratio = currentLength / this.zoom.startLength;
            }
        });

        window.addEventListener("touchcancel", (e) => {
            // Prevents tripple tap bugs by reseting everything
            this.dragging = false;
            this.touches = []; // this could cause issues i think
            this.zoom.isZooming = false;
        });

        window.addEventListener("touchend", (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                // for loop needed incase multiple touches are sent in the same frame

                const touch = {
                    identifier: e.changedTouches[i].identifier,
                    x: e.changedTouches[i].pageX,
                    y: e.changedTouches[i].pageY,
                };

                const touchIndex = this.touches.findIndex((t) => t.identifier == touch.identifier);

                if (this.dragging && touchIndex == 0) {
                    // if this is the primary/first/oldest touch

                    // released current drag
                    this.averageDragX.clear();
                    this.averageDragY.clear();

                    if (e.touches.length == 0) {
                        // if theres no other drags to switch to
                        this.dragAmountX = 0;
                        this.dragAmountY = 0;
                        this.dragging = false;
                    }
                }

                // removing this touch within this.touches
                if (touchIndex > -1) {
                    // only splice array when item is found
                    this.touches.splice(touchIndex, 1); // 2nd parameter means remove one item only
                }

                UserInterface.touchReleased(touch.x, touch.y); // sends touchRealease for every release
            }

            if (this.zoom.isZooming && this.touches.length < 2) {
                // stop zooming if less than two touches
                this.zoom.isZooming = false;
                this.zoom.x = null;
                this.zoom.y = null;
                this.zoom.startLength = null;
                this.zoom.ratio = 1;
            }
        });

        // CODE TO REMOVE THE MAGNIFIER LOUPE
        // https://discourse.threejs.org/t/iphone-how-to-remove-text-selection-magnifier/47812/12
        function createDoubleTapPreventer(timeout_ms) {
            let dblTapTimer = 0;
            let dblTapPressed = false;

            return function (e) {
                clearTimeout(dblTapTimer);
                if (dblTapPressed) {
                    e.preventDefault();
                    dblTapPressed = false;
                } else {
                    dblTapPressed = true;
                    dblTapTimer = setTimeout(function () {
                        dblTapPressed = false;
                    }, timeout_ms);
                }
            };
        }

        document.body.addEventListener("touchstart", createDoubleTapPreventer(590), { passive: false });
    },

    // processTouchEvent : function () {
    update: function () {
        if (!this.zoom.isZooming && this.touches.length >= 1) {
            this.dragAmountX = this.touches[0].x - this.touches[0].previousX;
            this.dragAmountY = this.touches[0].y - this.touches[0].previousY;

            // loop through each touch and set its previousX and Y
            this.touches.forEach((touch) => {
                touch.previousX = touch.x;
                touch.previousY = touch.y;
            });
        }

        if (this.zoom.isZooming && this.touches.length >= 2) {
            // pan using center of screen in map editor

            const zoomMidX = (this.touches[0].x + this.touches[1].x) / 2;
            const zoomMidX_prev = (this.touches[0].previousX + this.touches[1].previousX) / 2;
            const zoomMidY = (this.touches[0].y + this.touches[1].y) / 2;
            const zoomMidY_prev = (this.touches[0].previousY + this.touches[1].previousY) / 2;

            this.dragAmountX = zoomMidX - zoomMidX_prev;
            this.dragAmountY = zoomMidY - zoomMidY_prev;

            this.touches[0].previousX = this.touches[0].x;
            this.touches[0].previousY = this.touches[0].y;
            this.touches[1].previousX = this.touches[1].x;
            this.touches[1].previousY = this.touches[1].y;
        }

        this.averageDragX.pushValue(this.dragAmountX);
        this.averageDragY.pushValue(this.dragAmountY);
    },
};
