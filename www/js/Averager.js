class Averager {
    
    constructor(maxFramesSampled) {
        this.maxFramesSampled = maxFramesSampled;
        this.frames = [];
    }
        
    pushValue = (value) => {
        this.frames.push(value)
        if (this.frames.length > this.maxFramesSampled / 60 / dt) {this.frames.shift()} // adds new value to frames[] & removes oldest (if theres more then max allowed frames in array)
    }

    getAverage = () => {
        const average = this.frames.reduce((a, b) => a + b) / this.frames.length
        return average
    }

    clear = () => {
        this.frames = []
    }
}
