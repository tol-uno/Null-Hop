class Averager {
    
    constructor(maxFramesSampled) {
        this.maxFramesSampled = maxFramesSampled;
        this.frames = [];
    }
        
    pushValue(value) {
        this.frames.push(value)
        if (this.frames.length > this.maxFramesSampled / 60 / dt) {this.frames.shift()} // adds new value to frames[] & removes oldest (if theres more then max allowed frames in array)
    }

    getAverage() {
        if (this.frames.length === 0) return 0; // reduce cant work on empty array and would divide by zero bc initial value is set to 0
        return this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
    }

    clear() {
        this.frames = []
    }
}
