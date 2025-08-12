class SliderUI {

    constructor(x, y, width, min, max, decimalDetail, label, variable, func) {
        this.x = eval(x);
        this.y = eval(y);
        this.width = width;
        this.min = min;
        this.max = max;
        this.decimalDetail = decimalDetail //0.2 or 1/5 = multiples of 5, 1 = whole numbers, 10 = 10ths place, 100 = 100ths place
        this.label = label;
        this.value = variable;
        this.func = func;
        this.sliderX = this.x + width / ((max - min)/this.value);
        this.confirmed = true;
    }

    updateState(value) { // updates the button when its value is changed by external source
        this.value = value;
        // this.sliderX = this.x + this.width / ((this.max - this.min)/this.value);
        this.sliderX = (this.value - this.min) * (this.x + this.width - this.x) / (this.max - this.min) + this.x;

    }


    render() {
        const ctx = UserInterfaceCanvas.ctx
        ctx.lineWidth = 6;
        ctx.lineCap = "round"
        ctx.fillStyle = ctx.strokeStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1: UserInterface.lightColor_1;

        
        ctx.beginPath(); // Slider Line
        ctx.moveTo(this.x, this.y)
        ctx.lineTo(this.x + this.width, this.y)
        ctx.stroke();

        ctx.font = "16px BAHNSCHRIFT"; // Label
        ctx.fillText(this.label + ": " + this.value, this.x, this.y - 20)

        ctx.beginPath(); // Slider Handle
        ctx.arc(this.sliderX, this.y, 10, 0, 2 * Math.PI);
        ctx.fill();

        // draw highlight color in slider handle
        ctx.fillStyle = (!UserInterface.darkMode) ? UserInterface.darkColor_1: UserInterface.lightColor_1;
        ctx.beginPath();
        ctx.arc(this.sliderX, this.y, 5, 0, 2 * Math.PI);
        ctx.fill();
    }

    update() {
        if (!this.confirmed) {

            if (TouchHandler.dragging) {

                if (TouchHandler.touches[0].x < this.x) {
                    // set to lowest
                    this.sliderX = this.x
                } else {
                    if (TouchHandler.touches[0].x > this.x + this.width) {
                        // set to highest
                        this.sliderX = this.x + this.width
                    } else {
                        // within slider bounds
                        this.sliderX = TouchHandler.touches[0].x
                    }
                }

                // MAP TO RANGE: https://stackoverflow.com/questions/10756313/javascript-jquery-map-a-range-of-numbers-to-another-range-of-numbers
                // (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
                // inmin = this.x
                // inmax = this.x + this.width
                // outmin = this.min
                // outmax = this.max

                this.value = (this.sliderX - this.x) * (this.max - this.min) / (this.width) + this.min;
                this.value = Math.round(this.value * this.decimalDetail) / this.decimalDetail;
                // this.value = Math.round(this.value / 10) * 10; // for snapping to nearest multiple of 10 


            } else { // not dragging -- need to confirm slider
                // map snapped value to pixels along slider. snapping the position of the visual slider
                this.sliderX = (this.value - this.min) * (this.x + this.width - this.x) / (this.max - this.min) + this.x;

                this.func(); // run the functions built into the slider
                this.confirmed = true;
            }
        }
    }
}