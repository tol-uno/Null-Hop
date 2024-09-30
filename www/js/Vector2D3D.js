class Vector2D3D {

    // Works as both a 2D or 3D vector
    // rotate and getAngleInDegrees methods only work for 2D vectors

    constructor(x, y, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.dimension = z === 0 ? 2 : 3; // Determine if it's 2D or 3D
    }

    set(x, y, z = this.z) {
        this.x = x;
        this.y = y;
        this.z = z;
        //return this; // Return the updated vector
    }

    add(vector) {
        this.x += vector.x;
        this.y += vector.y;
        this.z += vector.z;
        
        // return new Vector2D3D(this.x + vector.x, this.y + vector.y, this.z + vector.z);
    }

    // UNUSED
    // subtract(vector) {
    //     this.x -= vector.x;
    //     this.y -= vector.y;
    //     this.z -= vector.z
    //     // return new Vector2D3D(this.x - vector.x, this.y - vector.y, this.z - vector.z);
    // }

    multiply(scalar) { // returns a new vector
        return new Vector2D3D(this.x * scalar, this.y * scalar, this.z * scalar);
    }

    divide(scalar) { // returns a new vector
        if (scalar === 0) throw new Error("Cannot divide by zero");
        return new Vector2D3D(this.x / scalar, this.y / scalar, this.z / scalar);
    }

    dotProduct(vector) {
        return this.x * vector.x + this.y * vector.y + (this.dimension === 3 ? this.z * vector.z : 0);
    }

    magnitude() {
        return Math.sqrt(this.dotProduct(this));
    }

    normalize(scalar = 1) { // player movement uses scalar
        const mag = this.magnitude();
        if (mag === 0) throw new Error("Cannot normalize a zero vector");
        const normalizedVector = this.divide(mag); // Normalize the vector
        this.x = normalizedVector.x * scalar
        this.y = normalizedVector.y * scalar
        this.z = normalizedVector.z * scalar
    }

    // normalize = function(multiplier) { // NOTE: requires multiplier
    //     if (this.length !== 0) { // dont ever want to normalize when vector length is zero
    //         const n = this.divide(this.magnitude());
    //         this.x = n.x * multiplier;
    //         this.y = n.y * multiplier;
    //     }
    // }

    rotate(angleInDegrees) { // returns a new vector
        if (this.dimension !== 2) throw new Error("Rotation is only supported for 2D vectors");
        const angleInRadians = angleInDegrees * (Math.PI / 180);
        const cos = Math.cos(angleInRadians);
        const sin = Math.sin(angleInRadians);

        // needs to be ROUNDED
        return new Vector2D3D(
            Math.round(10000*(this.x * cos - this.y * sin))/10000, 
            Math.round(10000*(this.x * sin + this.y * cos))/10000
        );
    }

    angleDifference(vector) {
        const dotProduct = this.dotProduct(vector);
        const magnitudes = this.magnitude() * vector.magnitude();
        if (magnitudes === 0) throw new Error("Cannot calculate angle with zero vector");
        const cosTheta = dotProduct / magnitudes;

        // return Math.acos(cosTheta) * (180 / Math.PI); // return angle in degrees
        return Math.acos(cosTheta); // return angle in radians
    }

    getAngleInDegrees() {
        if (this.dimension !== 2) throw new Error("Angle is only defined for 2D vectors");
        let angle = Math.atan2(this.y, this.x) * (180 / Math.PI); // Calculate angle in degrees
        // Adjust angle to be between 0 and 360
        return Math.round((angle + 360) % 360);
    }
}
