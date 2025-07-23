class Vector2D3D {
    // Works as both a 2D or 3D vector
    // All functions mutate the current vector -- they dont create a new one
    // .rotate and .getAngleInDegrees methods only work for 2D vectors

    constructor(x, y, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    set(x, y, z = this.z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

    clone() {
        return new Vector2D3D(this.x, this.y, this.z);
    }

    // UNUSED
    // add(vector) {
    //     this.x += vector.x;
    //     this.y += vector.y;
    //     this.z += vector.z;
    // }

    // UNUSED
    // subtract(vector) {
    //     this.x -= vector.x;
    //     this.y -= vector.y;
    //     this.z -= vector.z
    // }

    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
        return this;
    }

    divide(scalar) {
        // Used by .normalize()
        if (scalar == 0) throw new Error("Cannot divide by zero");
        this.x /= scalar;
        this.y /= scalar;
        this.z /= scalar;
        return this;
    }

    dotProduct(vector) {
        return this.x * vector.x + this.y * vector.y + this.z * vector.z;
    }

    magnitude() {
        return Math.sqrt(this.dotProduct(this));
    }

    normalize(scalar = 1) {
        // player movement uses scalar param
        const mag = this.magnitude();
        if (mag == 0) throw new Error("Cannot normalize a zero vector");
        this.divide(mag).multiply(scalar); // Normalize the vector then scale it
        return this;
    }

    rotate(angleInDegrees) {
        // increments current angle by angleInDegrees
        // DOES NOT set the vectors absolute angle to angleInDegrees

        const angleInRadians = angleInDegrees * (Math.PI / 180);
        const cos = Math.cos(angleInRadians);
        const sin = Math.sin(angleInRadians);

        const x = this.x; // need to save due to mutation below
        const y = this.y;

        this.x = x * cos - y * sin;
        this.y = x * sin + y * cos;

        return this;
    }

    getAngleInDegrees() {
        // only gets angle for 2D vectors
        if (this.z != 0) throw new Error("getAngle only for 2D vectors");
        let angle = Math.atan2(this.y, this.x) * (180 / Math.PI); // Calculate angle in degrees
        // Adjust angle to be between 0 and 360
        return Math.round((angle + 360) % 360);
    }

    angleDifference(vector) {
        const dotProduct = this.dotProduct(vector);
        const magnitudes = this.magnitude() * vector.magnitude();
        if (magnitudes === 0) throw new Error("Cannot calculate angle with zero vector");
        const cosTheta = dotProduct / magnitudes;

        // const angleDegrees = Math.acos(cosTheta) * (180 / Math.PI); // angle in degrees

        return Math.acos(cosTheta); // angle in radians
    }
}
