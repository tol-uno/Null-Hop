function mat4_ortho(out, left, right, bottom, top, near, far) {
    const lr = 1 / (left - right);
    const bt = 1 / (bottom - top);
    const nf = 1 / (near - far);

    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 2 * nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;

    return out;
}

function mat4_lookAt(out, eye, center, up) {
    // Forward vector (z-axis): eye - center, then normalize
    const zAxis = eye.clone().subtract(center).normalize();

    // Right vector (x-axis): up x zAxis, then normalize
    const xAxis = up.clone().crossProduct(zAxis).normalize();

    // True up vector (y-axis): zAxis x xAxis
    const yAxis = zAxis.clone().crossProduct(xAxis);

    out[0] = xAxis.x;
    out[1] = yAxis.x;
    out[2] = zAxis.x;
    out[3] = 0;
    out[4] = xAxis.y;
    out[5] = yAxis.y;
    out[6] = zAxis.y;
    out[7] = 0;
    out[8] = xAxis.z;
    out[9] = yAxis.z;
    out[10] = zAxis.z;
    out[11] = 0;
    out[12] = -xAxis.dotProduct(eye);
    out[13] = -yAxis.dotProduct(eye);
    out[14] = -zAxis.dotProduct(eye);
    out[15] = 1;

    return out;
}
