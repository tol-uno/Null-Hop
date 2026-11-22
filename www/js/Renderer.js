// requires regl and mat4 functions (lookAt and ortho)

function parseRGB(rgbString) {
    // FIX should store Map color data in a format so that this function is not needed.
    // Extract numbers (supports decimals for alpha too)
    const matches = rgbString.match(/[\d.]+/g);

    if (!matches || matches.length < 3) {
        console.error("Invalid RGB(A) string");
    }

    // Return only [r, g, b] normalized
    return matches.slice(0, 3).map((num) => parseInt(num, 10) / 255);
}

function getLightVector(lightDirectionDeg, lightAngleDeg) {
    // FIX Should store light vector as a real vector so we dont need this function.
    const dir = (lightDirectionDeg * Math.PI) / 180;
    const ang = (lightAngleDeg * Math.PI) / 180;

    const x = Math.cos(ang) * Math.cos(dir);
    const y = -Math.sin(ang);
    const z = Math.cos(ang) * Math.sin(dir);

    return [x, y, z];
}

// Fixed 45deg military orthographic camera
const CAMERA_EYE_HEIGHT = 10;
const CAMERA_EYE_Z_OFFSET = 10;
const GROUND_VIEW_SAFETY_MARGIN = 2; // world units
const PLAYER_SIZE = 32;

class Renderer {
    #canvas = null;
    #aspectRatio = null;
    #camera = {
        x: 0,
        y: 10,
        z: 0,
        zoom: 300,
    };

    #halfX = 0;
    #halfZ = 0;
    #shadowNormalOffset = 0;
    #shadowDepthBias = 0;

    #lightView = new Float32Array(16);
    #lightProjection = new Float32Array(16);
    #projection = new Float32Array(16);
    #view = new Float32Array(16);

    editorMode = false; // optimizes rendering for 'dynamic' vs 'static' mapData TODO
    #initialized = false;
    #regl = null;

    #SHADOW_RES = 1024;
    #shadowMap = null;
    #shadowFrameBufferObject = null;

    #positionBuffer = null;
    #normalBuffer = null;

    #mapData = null;

    #globalScope = null; // This command encapsulates the common state between drawNormal and drawDepth
    #drawInstancedCubesDepth = null;
    #drawInstancedCubes = null;

    constructor(targetCanvas) {
        this.#canvas = targetCanvas;
    }

    init(width, height) {
        if (this.#initialized) return;

        this.resize(width, height);

        this.#regl = createREGL({
            canvas: this.#canvas,
            extensions: ["ANGLE_instanced_arrays", "WEBGL_depth_texture"],
            attributes: { antialias: true, alpha: false, premultipliedAlpha: false, powerPreference: "high-performance" },

            // powerPreference:
            // 'high-performance' prioritize fast performance, not battery life
            // 'default' lets the browser choose
            // 'low-power' favors energy efficiency
        });

        // set up geometry buffers
        this.#positionBuffer = this.#regl.buffer({
            data: cubeVertexPosition,
            type: "float32",
        });

        this.#normalBuffer = this.#regl.buffer({
            data: cubeVertexNormal,
            type: "float32", // maybe not float?
        });

        this.#shadowMap = this.#regl.texture({
            width: this.#SHADOW_RES,
            height: this.#SHADOW_RES,
            format: "depth",
            type: "uint32",
            min: "nearest",
            mag: "nearest", // minification and magnification algorithms
        });

        this.#shadowFrameBufferObject = this.#regl.framebuffer({
            color: this.#regl.renderbuffer({
                // Unused, but required to create a complete framebuffer
                width: this.#SHADOW_RES,
                height: this.#SHADOW_RES,
                format: "rgb565", // 2 bytes/pixel
            }),
            depth: this.#shadowMap,
        });

        this.#initialized = true;
    }

    #destroyMapDataResources() {
        if (!this.#mapData) return;

        this.#globalScope?.destroy();

        this.#mapData.translateBuffer.destroy();
        this.#mapData.scaleBuffer.destroy();
        this.#mapData.rotationBuffer.destroy();
        this.#mapData.instanceTypeBuffer.destroy();

        // There are more buffers to destroy here I think FIX

        this.#mapData = null; // gets rid of all color properties and lightvector
    }

    #updatePlatformInstanceArrays(index, platform, style) {
        // Add/Update a single platform within the 4 CPU side instance data arrays
        // Returns "true" if something actually changed
        const mapData = this.#mapData;
        const indexTimes3 = index * 3;

        const translateX = platform.x;
        const translateY = -style.platformHeight / 2 + (platform.wall ? style.wallHeight / 2 : 0);
        const translateZ = platform.y;

        const scaleX = platform.width;
        const scaleY = style.platformHeight + (platform.wall ? style.wallHeight : 0);
        const scaleZ = platform.height;

        const rotation = (-platform.angle * Math.PI) / 180; // idk why negative really

        let type = 0; // 0 = platform (default)
        if (platform.wall) {
            type = 1;
        } else if (platform.endzone) {
            type = 2;
        }

        let changed = false;

        // X index
        if (mapData.translateData[indexTimes3] !== Math.fround(translateX)) {
            mapData.translateData[indexTimes3] = translateX;
            changed = true;
        }
        // Y index (up down vertical)
        if (mapData.translateData[indexTimes3 + 1] !== Math.fround(translateY)) {
            mapData.translateData[indexTimes3 + 1] = translateY;
            changed = true;
        }
        // Z index
        if (mapData.translateData[indexTimes3 + 2] !== Math.fround(translateZ)) {
            mapData.translateData[indexTimes3 + 2] = translateZ;
            changed = true;
        }

        // scale X
        if (mapData.scaleData[indexTimes3] !== Math.fround(scaleX)) {
            mapData.scaleData[indexTimes3] = scaleX;
            changed = true;
        }
        // scale Y
        if (mapData.scaleData[indexTimes3 + 1] !== Math.fround(scaleY)) {
            mapData.scaleData[indexTimes3 + 1] = scaleY;
            changed = true;
        }
        // scale Z
        if (mapData.scaleData[indexTimes3 + 2] !== Math.fround(scaleZ)) {
            mapData.scaleData[indexTimes3 + 2] = scaleZ;
            changed = true;
        }

        // rotation
        if (mapData.rotationData[index] !== Math.fround(rotation)) {
            mapData.rotationData[index] = rotation;
            changed = true;
        }

        // platform type
        if (mapData.instanceTypeData[index] !== type) {
            mapData.instanceTypeData[index] = type;
            changed = true;
        }

        return changed;
    }

    #updateGroundInstanceArrays(style) {
        // Add/Update ground cube to the 4 CPU side instance buffers
        // style.platform height is needed to determine how far down below 0 the ground needs to be placed on Y axis
        const mapData = this.#mapData;
        const index = mapData.groundIndex;
        const indexTimes3 = index * 3;

        const translateY = -0.5 - style.platformHeight; // y = -0.5 since cubes origin is at its center

        let changed = false;

        // Ground is always at x = 0, z = 0.
        // x
        if (mapData.translateData[indexTimes3] !== 0) {
            // This is probably uneeded. Ground x and z are never updated KILL
            mapData.translateData[indexTimes3] = 0;
            changed = true;
        }
        // y
        if (mapData.translateData[indexTimes3 + 1] !== Math.fround(translateY)) {
            mapData.translateData[indexTimes3 + 1] = translateY;
            changed = true;
        }
        // z
        if (mapData.translateData[indexTimes3 + 2] !== 0) {
            // This is probably uneeded. Ground x and z are never updated KILL
            mapData.translateData[indexTimes3 + 2] = 0;
            changed = true;
        }

        // scale x y z
        if (mapData.scaleData[indexTimes3] !== 10000) {
            mapData.scaleData[indexTimes3] = 10000;
            changed = true;
        }
        if (mapData.scaleData[indexTimes3 + 1] !== 1) {
            mapData.scaleData[indexTimes3 + 1] = 1;
            changed = true;
        }
        if (mapData.scaleData[indexTimes3 + 2] !== 10000) {
            mapData.scaleData[indexTimes3 + 2] = 10000;
            changed = true;
        }

        // rotation -- always 0 for ground. Can probably kill this
        if (mapData.rotationData[index] !== 0) {
            mapData.rotationData[index] = 0;
            changed = true;
        }

        // type of platform -- always 3 for ground. Can probably kill this
        if (mapData.instanceTypeData[index] !== 3) {
            mapData.instanceTypeData[index] = 3;
            changed = true;
        }

        return changed;
    }

    // Used to seed initial CPU-side instance arrays. Combines updatePlatformInstanceArrays and updateGroundInstanceArrays
    #populateCpuInstanceArrays(mapDataObject) {
        const style = mapDataObject.style;
        const platforms = mapDataObject.platforms;

        for (let i = 0; i < platforms.length; i++) {
            this.#updatePlatformInstanceArrays(i, platforms[i], style);
        }

        this.#updateGroundInstanceArrays(style);

        // Add static player data (scale and instance type)
        const playerIndex = this.#mapData.playerIndex;
        const playerIndexTimes3 = playerIndex * 3;
        this.#mapData.scaleData[playerIndexTimes3] = PLAYER_SIZE;
        this.#mapData.scaleData[playerIndexTimes3 + 1] = PLAYER_SIZE;
        this.#mapData.scaleData[playerIndexTimes3 + 2] = PLAYER_SIZE;
        this.#mapData.instanceTypeData[playerIndex] = 4;
    }

    #updateInstanceBuffersWithinRange(start, end) {
        // update specified sub-section of data within the 4 GPU buffers
        // end param is "exclusive"
        // Offsets passed to subdata are in bytes (4 bytes per float).

        // The translateBuffer and scaleBuffer store 3 floats per instance (x, y, z),
        // so convert instance indices to float indices.
        const mapData = this.#mapData;
        const start3 = start * 3;
        const end3 = end * 3;

        // Each float is 4 bytes, so the byte offset is the float index * 4.
        // .subdata(data, byteOffset) copies data from the CPU arrays into the GPU buffer starting at byteOffset.
        mapData.translateBuffer.subdata(mapData.translateData.subarray(start3, end3), start3 * 4);
        mapData.scaleBuffer.subdata(mapData.scaleData.subarray(start3, end3), start3 * 4);
        mapData.rotationBuffer.subdata(mapData.rotationData.subarray(start, end), start * 4);
        mapData.instanceTypeBuffer.subdata(mapData.instanceTypeData.subarray(start, end), start * 4);
    }

    #updatePlayerInstanceArraysAndBuffers(player) {
        const playerIndex = this.#mapData.playerIndex;
        const playerIndexTimes3 = playerIndex * 3;

        // Update CPU Side Data
        this.#mapData.translateData[playerIndexTimes3] = player.x;
        this.#mapData.translateData[playerIndexTimes3 + 1] = player.y + PLAYER_SIZE / 2;
        this.#mapData.translateData[playerIndexTimes3 + 2] = player.z;
        this.#mapData.rotationData[playerIndex] = -player.angleRad;

        // Upload to GPU
        // .subdata(data, byteOffset) copies data from the CPU arrays into the GPU buffer starting at byteOffset.
        this.#mapData.translateBuffer.subdata(this.#mapData.translateData.subarray(playerIndexTimes3, playerIndexTimes3 + 3), playerIndexTimes3 * 4); // 4 because each float is 4 bytes
        this.#mapData.rotationBuffer.subdata(this.#mapData.rotationData.subarray(playerIndex, playerIndex + 1), playerIndex * 4);
    }

    // called to keep ground in camera's view
    #syncGroundInstanceArraysAndBuffersWithCamera(style) {
        const mapData = this.#mapData;
        const index = mapData.groundIndex;
        const indexTimes3 = index * 3;

        const groundTopY = -style.platformHeight;

        // Small extra margin around camera's view for safety.
        const scaleX = 2 * (this.#halfX + GROUND_VIEW_SAFETY_MARGIN);
        const scaleZ = 2 * (this.#halfZ + GROUND_VIEW_SAFETY_MARGIN);

        // Update CPU Side Data Arrays
        // Ground cube's top should sit at groundTopY
        mapData.translateData[indexTimes3] = this.#camera.x;
        mapData.translateData[indexTimes3 + 1] = groundTopY - 0.5; // 0.5 to get top of the cube at groundTopY
        mapData.translateData[indexTimes3 + 2] = this.#camera.z + groundTopY; // 45deg view means ground needs to be shifted

        mapData.scaleData[indexTimes3] = scaleX;
        // skip y scale -- it doesnt change
        mapData.scaleData[indexTimes3 + 2] = scaleZ;

        // Upload to GPU buffers
        // .subdata(data, byteOffset) copies data from the CPU arrays into the GPU buffer starting at byteOffset.
        mapData.translateBuffer.subdata(mapData.translateData.subarray(indexTimes3, indexTimes3 + 3), indexTimes3 * 4); // 4 because each float is 4 bytes
        mapData.scaleBuffer.subdata(mapData.scaleData.subarray(indexTimes3, indexTimes3 + 3), indexTimes3 * 4);
    }

    #updateMapStyle(style) {
        // Updates colors and lighting WITHOUT recreating buffers. Returns true if a
        // height changed, since that also changes EVERY platform's transform.
        const mapData = this.#mapData;
        const previous = mapData.style;

        const heightsChanged = previous.platformHeight !== style.platformHeight || previous.wallHeight !== style.wallHeight;

        if (previous.ambientLight !== style.ambientLight) mapData.ambientLight = parseRGB(style.ambientLight);
        if (previous.backgroundColor !== style.backgroundColor) mapData.backgroundColor = parseRGB(style.backgroundColor);
        if (previous.directLight !== style.directLight) mapData.directLight = parseRGB(style.directLight);
        if (previous.endZoneSideColor !== style.endZoneSideColor) mapData.endZoneSideColor = parseRGB(style.endZoneSideColor);
        if (previous.endZoneTopColor !== style.endZoneTopColor) mapData.endZoneTopColor = parseRGB(style.endZoneTopColor);
        if (previous.platformSideColor !== style.platformSideColor) mapData.platformSideColor = parseRGB(style.platformSideColor);
        if (previous.platformTopColor !== style.platformTopColor) mapData.platformTopColor = parseRGB(style.platformTopColor);
        if (previous.playerColor !== style.playerColor) mapData.playerColor = parseRGB(style.playerColor);
        if (previous.wallSideColor !== style.wallSideColor) mapData.wallSideColor = parseRGB(style.wallSideColor);
        if (previous.wallTopColor !== style.wallTopColor) mapData.wallTopColor = parseRGB(style.wallTopColor);

        if (previous.lightDirection !== style.lightDirection || previous.lightPitch !== style.lightPitch) {
            const newLightVector = getLightVector(style.lightDirection, style.lightPitch);
            // Keep the same array instance: it is registered in the regl context.
            mapData.lightVector[0] = newLightVector[0];
            mapData.lightVector[1] = newLightVector[1];
            mapData.lightVector[2] = newLightVector[2];
        }

        Object.assign(previous, style);

        return heightsChanged;
    }

    #updateHalfGroundExtents() {
        // update the half-extents (in world units) of the visible ground rectangle that is visible in the camera
        const half = this.#camera.zoom * 0.5;

        if (this.#aspectRatio < 1) {
            this.#halfX = half * this.#aspectRatio;
            this.#halfZ = half;
        } else {
            this.#halfX = half;
            this.#halfZ = half / this.#aspectRatio;
        }
    }

    #updateLightMatrices(yMin, yMax) {
        // UPDATE LIGHT VIEW
        // Light view from a FIXED origin so the shadow map can be texel-snapped
        mat4_lookAt(
            this.#lightView, // Output Matrix
            new Vector2D3D(0, 0, 0), // light POSITION
            new Vector2D3D(this.#mapData.lightVector[0], this.#mapData.lightVector[1], this.#mapData.lightVector[2]), // light Direction Vector (where to look)
            Math.abs(this.#mapData.lightVector[1]) > 0.999 ? new Vector2D3D(0, 0, -1) : new Vector2D3D(0, 1, 0), // Up Vector. Swap with alternative up vector when light vector comes close to vertical
        );

        // Project the 8 corners of the visible world box into light space (column-major) idk what column major means...
        let minX = Infinity,
            maxX = -Infinity;
        let minY = Infinity,
            maxY = -Infinity;
        let minZ = Infinity,
            maxZ = -Infinity;

        // Visit all 8 corners of the box.
        // Each bit of cornerIndex selects one of the two sides on an axis:
        // bit 0: low/high Y, bit 1: left/right X, bit 2: near/far Z.
        for (let cornerIndex = 0; cornerIndex < 8; cornerIndex++) {
            const isUpperY = (cornerIndex & 1) !== 0;
            const isPositiveX = (cornerIndex & 2) !== 0;
            const isPositiveZ = (cornerIndex & 4) !== 0;

            const worldY = isUpperY ? yMax : yMin;
            const worldX = this.#camera.x + (isPositiveX ? this.#halfX : -this.#halfX);

            // With the 45° camera, height also shifts the corner along Z.
            const worldZ = this.#camera.z + worldY + (isPositiveZ ? this.#halfZ : -this.#halfZ);

            // Transform this corner into view space.
            const viewX = this.#lightView[0] * worldX + this.#lightView[4] * worldY + this.#lightView[8] * worldZ + this.#lightView[12];

            const viewY = this.#lightView[1] * worldX + this.#lightView[5] * worldY + this.#lightView[9] * worldZ + this.#lightView[13];

            const viewZ = this.#lightView[2] * worldX + this.#lightView[6] * worldY + this.#lightView[10] * worldZ + this.#lightView[14];

            // Expand the view-space bounds to include this corner.
            minX = Math.min(minX, viewX);
            maxX = Math.max(maxX, viewX);
            minY = Math.min(minY, viewY);
            maxY = Math.max(maxY, viewY);
            minZ = Math.min(minZ, viewZ);
            maxZ = Math.max(maxZ, viewZ);
        }

        // Square bounds (for uniform texels) + 2 texels of padding per side for 3x3 Percentage-closer filtering (PCF)
        const size = Math.max(maxX - minX, maxY - minY) * (1 + 4 / this.#SHADOW_RES); // choose the largest bound (either x or y) and multiply it larger for padding
        const texel = size / this.#SHADOW_RES;

        // Snap the center to whole texels so shadows don't swim while panning (unnessasary really... i dont mind a little swim)
        const centerX = Math.round(((minX + maxX) * 0.5) / texel) * texel;
        const centerY = Math.round(((minY + maxY) * 0.5) / texel) * texel;
        const half = size * 0.5;

        // Shadow casters between the sun and the visible area: anything in the [yMin, yMax]
        // slab can cast a shadow, so extend the near plane toward the light by that reach of the shadows.
        const reach = (yMax - yMin) / Math.max(Math.abs(this.#mapData.lightVector[1]), 0.1);
        const near = -(maxZ + reach); // view space looks down -z
        const far = -minZ + 1;

        mat4_ortho(this.#lightProjection, centerX - half, centerX + half, centerY - half, centerY + half, near, far);

        // Bias scales with texel size, so it behaves the same at every zoom
        this.#shadowNormalOffset = texel * 1.5; // world units
        this.#shadowDepthBias = (texel * 0.5) / (far - near); // depth is linear in ortho projection
    }

    #updateCameraProjection(yBottom, yTop) {
        // UPDATE CAMERA PROJECTION
        // Make sure this.#updateHalfGroundExtents has already been called this frame

        const marginHalfZ = this.#halfZ + GROUND_VIEW_SAFETY_MARGIN;
        const depthOffset = CAMERA_EYE_HEIGHT + CAMERA_EYE_Z_OFFSET; // 20

        // View-space depth extremes over the visible world slab
        const minViewZ = (2 * yBottom - marginHalfZ - depthOffset) * Math.SQRT1_2;
        const maxViewZ = (2 * yTop + marginHalfZ - depthOffset) * Math.SQRT1_2;

        const near = -maxViewZ - GROUND_VIEW_SAFETY_MARGIN;
        const far = -minViewZ - GROUND_VIEW_SAFETY_MARGIN;

        // Military Orthographic projection for a 45° top-down camera.
        // The longer screen side always shows exactly `zoom` world units.
        // The shorter side shows zoom * (shorterSide / longerSide) world units.
        // X bounds are always in world units, so no extra scaling is needed.
        // Y bounds are in view space. The camera is pitched 45°, so a ground
        // distance along z appears shortened by 1/√2. Dividing the bounds by √2
        // converts world-z units to view units, so the ground is not stretched.
        mat4_ortho(
            this.#projection, // array to write to / update
            // WIDTH
            -this.#halfX,
            this.#halfX,
            // HEIGHT
            -this.#halfZ / Math.SQRT2,
            this.#halfZ / Math.SQRT2,
            // these near and far planes should be calculated intentionaly. Fix
            near,
            far,
        );
    }

    setEditorMode(enabled) {
        // In editor mode instance matrices are flagged as frequently updated, and instance buffers get spare capacity.
        // Takes effect for instance meshes created from now on, so call it before setMapData.
        this.editorMode = enabled;
    }

    setMapData(mapDataObject) {
        // parses platform and style data from mapDataObject in this.#mapData

        this.#destroyMapDataResources();

        const style = mapDataObject.style;
        const platformCount = mapDataObject.platforms.length;
        const playerIndex = platformCount; // index starts at 0. That's why there's no +1 here
        const groundIndex = platformCount + 1;
        const instanceCount = platformCount + 2; // platforms + ground + player
        const shadowCasterCount = platformCount + 1; // platforms + player but NO GROUND

        this.#mapData = {
            instanceCount,
            shadowCasterCount,
            platformCount,
            groundIndex,
            playerIndex,

            translateData: new Float32Array(instanceCount * 3),
            scaleData: new Float32Array(instanceCount * 3),
            rotationData: new Float32Array(instanceCount),
            instanceTypeData: new Float32Array(instanceCount),

            translateBuffer: null,
            scaleBuffer: null,
            rotationBuffer: null,
            instanceTypeBuffer: null,

            lightVector: getLightVector(style.lightDirection, style.lightPitch),

            ambientLight: parseRGB(style.ambientLight),
            backgroundColor: parseRGB(style.backgroundColor),
            directLight: parseRGB(style.directLight),
            endZoneSideColor: parseRGB(style.endZoneSideColor),
            endZoneTopColor: parseRGB(style.endZoneTopColor),
            platformSideColor: parseRGB(style.platformSideColor),
            platformTopColor: parseRGB(style.platformTopColor),
            playerColor: parseRGB(style.playerColor),
            wallSideColor: parseRGB(style.wallSideColor),
            wallTopColor: parseRGB(style.wallTopColor),

            // Snapshot of unparsed style (no parseRBG) used to detect style changes without re-parsing values every frame
            // Eventually this wont be needed because colors and light vectors will be stored in map data as the correct
            // format and wont need to be parsed at all. Kill Eventually
            style: { ...style },
        };

        // write all CPU-side arrays of instanced data
        this.#populateCpuInstanceArrays(mapDataObject);

        // assign GPU buffers
        this.#mapData.translateBuffer = this.#regl.buffer({ data: this.#mapData.translateData, usage: "dynamic" });
        this.#mapData.scaleBuffer = this.#regl.buffer(this.#mapData.scaleData);
        this.#mapData.rotationBuffer = this.#regl.buffer({ data: this.#mapData.rotationData, usage: "dynamic" });
        this.#mapData.instanceTypeBuffer = this.#regl.buffer(this.#mapData.instanceTypeData);

        this.#globalScope = this.#regl({
            uniforms: {
                lightVector: () => this.#mapData.lightVector,
                lightView: () => this.#lightView,
                lightProjection: () => this.#lightProjection,
                projection: () => this.#projection,
                view: () => this.#view,
            },
        });

        this.#drawInstancedCubesDepth = this.#regl({
            attributes: {
                position: {
                    buffer: this.#positionBuffer,
                    size: 3,
                },

                translate: {
                    buffer: this.#mapData.translateBuffer,
                    size: 3,
                    divisor: 1,
                },
                scale: {
                    buffer: this.#mapData.scaleBuffer,
                    size: 3,
                    divisor: 1,
                },
                rotation: {
                    buffer: this.#mapData.rotationBuffer,
                    size: 1,
                    divisor: 1,
                },
            },

            elements: cubeElements,

            framebuffer: this.#shadowFrameBufferObject,

            instances: this.#mapData.shadowCasterCount, // this excludes the ground from shadow pass
            colorMask: [false, false, false, false], // depth only

            cull: { enable: true },

            vert: `
            precision highp float;

            attribute vec3 position;
            attribute vec3 translate;
            attribute vec3 scale;
            attribute float rotation;

            uniform mat4 lightProjection; // no need to import both of these. multiply them OUTSIDE the shader FIX
            uniform mat4 lightView;

            mat4 getModelMatrix(vec3 t, float r, vec3 s) {
                mat4 model = mat4(1.0);
                model[3].xyz = t;

                float c = cos(r);
                float sin_r = sin(r);
                mat4 rotY = mat4(
                vec4(c, 0, -sin_r, 0),
                vec4(0, 1, 0, 0),
                vec4(sin_r, 0, c, 0),
                vec4(0, 0, 0, 1)
                );

                mat4 scl = mat4(
                vec4(s.x, 0, 0, 0),
                vec4(0, s.y, 0, 0),
                vec4(0, 0, s.z, 0),
                vec4(0, 0, 0, 1)
                );

                return model * rotY * scl;
            }

            void main() {
                mat4 model = getModelMatrix(translate, rotation, scale);
                vec4 worldPosition = model * vec4(position, 1.0);
                gl_Position = lightProjection * lightView * worldPosition;
            }
            `,
            frag: `
            precision mediump float;
            void main () {
                gl_FragColor = vec4(1.0);
            }
            `,
        });

        this.#drawInstancedCubes = this.#regl({
            attributes: {
                position: {
                    buffer: this.#positionBuffer,
                    size: 3,
                },
                normal: {
                    buffer: this.#normalBuffer,
                    size: 3,
                },
                translate: {
                    buffer: this.#mapData.translateBuffer,
                    size: 3,
                    divisor: 1,
                },
                scale: {
                    buffer: this.#mapData.scaleBuffer,
                    size: 3,
                    divisor: 1,
                },
                rotation: {
                    buffer: this.#mapData.rotationBuffer,
                    size: 1,
                    divisor: 1,
                },
                instanceType: {
                    buffer: this.#mapData.instanceTypeBuffer,
                    size: 1,
                    divisor: 1,
                },
            },

            uniforms: {
                shadowMap: this.#shadowMap,
                shadowNormalOffset: () => this.#shadowNormalOffset,
                shadowDepthBias: () => this.#shadowDepthBias,

                ambientLight: () => this.#mapData.ambientLight,
                backgroundColor: () => this.#mapData.backgroundColor,
                directLight: () => this.#mapData.directLight,
                endZoneSideColor: () => this.#mapData.endZoneSideColor,
                endZoneTopColor: () => this.#mapData.endZoneTopColor,
                platformSideColor: () => this.#mapData.platformSideColor,
                platformTopColor: () => this.#mapData.platformTopColor,
                playerColor: () => this.#mapData.playerColor,
                wallSideColor: () => this.#mapData.wallSideColor,
                wallTopColor: () => this.#mapData.wallTopColor,
            },

            elements: cubeElements,

            instances: this.#mapData.instanceCount,

            cull: { enable: true },

            vert: `
            precision highp float;

            attribute vec3 position;
            attribute vec3 normal;

            attribute vec3 translate;
            attribute vec3 scale;
            attribute float rotation;
            attribute float instanceType;

            uniform mat4 projection;
            uniform mat4 view;
            uniform mat4 lightProjection;
            uniform mat4 lightView;
            uniform float shadowNormalOffset;

            varying vec3 vNormal;
            varying vec4 vLightPos;
            varying float vInstanceType;

            mat4 getModelMatrix(vec3 t, float r, vec3 s) {
                mat4 model = mat4(1.0);
                model[3].xyz = t;

                float c = cos(r);
                float sin_r = sin(r);
                mat4 rotY = mat4(
                vec4(c, 0, -sin_r, 0),
                vec4(0, 1, 0, 0),
                vec4(sin_r, 0, c, 0),
                vec4(0, 0, 0, 1)
                );

                mat4 scl = mat4(
                vec4(s.x, 0, 0, 0),
                vec4(0, s.y, 0, 0),
                vec4(0, 0, s.z, 0),
                vec4(0, 0, 0, 1)
                );

                return model * rotY * scl;
            }

            void main() {
                mat4 model = getModelMatrix(translate, rotation, scale);

                vec4 worldPosition = model * vec4(position, 1.0);
                gl_Position = projection * view * worldPosition;

                vNormal = mat3(model) * normal;
                vec3 offsetPos = worldPosition.xyz + normalize(vNormal) * shadowNormalOffset;
                vLightPos = lightProjection * lightView * vec4(offsetPos, 1.0); // position as seen by the sun
                vInstanceType = instanceType; // pass to fragment shader
            }
            `,

            frag: `
            precision highp float;

            // Varying inputs from the vertex shader
            varying vec3 vNormal;         // Interpolated surface normal (world space or view space)
            varying vec4 vLightPos;       // Fragment position in light's projection space (for shadow lookup)
            varying float vInstanceType;  // Per-instance type data

            // Uniforms (global shader inputs)
            uniform sampler2D shadowMap;       // Shadow map texture (depth values from light's POV)
            uniform vec3 lightVector;          // Direction of the light (not normalized)
            uniform float shadowDepthBias;     // [add comment about what this is]

            uniform vec3 ambientLight;
            uniform vec3 backgroundColor;
            uniform vec3 directLight;
            uniform vec3 endZoneSideColor;
            uniform vec3 endZoneTopColor;
            uniform vec3 platformSideColor;
            uniform vec3 platformTopColor;
            uniform vec3 playerColor;
            uniform vec3 wallSideColor;
            uniform vec3 wallTopColor;

            const float SHADOW_TEXEL = 1.0 / float(${this.#SHADOW_RES});

            void main() {

                // determine if pixel should use top or side color
                bool isTop = (vNormal.y > 0.0);

                vec3 topColor = platformTopColor;
                vec3 sideColor = platformSideColor;

                if (vInstanceType == 1.0) {
                topColor = wallTopColor;
                sideColor = wallSideColor;
                }
                else if (vInstanceType == 2.0) {
                topColor = endZoneTopColor;
                sideColor = endZoneSideColor;
                }
                else if (vInstanceType == 3.0) {
                topColor = backgroundColor;
                sideColor = backgroundColor;
                }
                else if (vInstanceType == 4.0) {
                topColor = playerColor;
                sideColor = playerColor;
                }
                
                // set appropriate base color for pixel
                vec3 baseColor = isTop ? topColor : sideColor;

                // Lighting: Ambient + Diffuse
                vec3 ambient = ambientLight * baseColor;

                // Calculate diffuse lighting using Lambert's cosine law
                float cosTheta = dot(normalize(vNormal), -normalize(lightVector));
                float diffuseStrength = clamp(cosTheta, 0.0, 1.0);
                vec3 diffuse = directLight * baseColor * diffuseStrength;
                float bias = shadowDepthBias * (1.0 + 2.0 * (1.0 - diffuseStrength)); // slope-scaled bias

                // Shadow mapping: perspective divide, then NDC (Normalized Device Space) (-1..1) --> texture space (0..1)
                vec3 shadowCoord = vLightPos.xyz / vLightPos.w * 0.5 + 0.5;

                // 3x3 Percentage-closer filtering (PCF) with a fixed bias. Blurs shadows
                float lit = 0.0;
                
                const bool USE_PCF = false; // temp KILL eventually
                if (USE_PCF) {           
                    for (int x = -1; x <= 1; x++) {
                        for (int y = -1; y <= 1; y++) {
                            vec2 offset = vec2(float(x), float(y)) * SHADOW_TEXEL;
                            float closest = texture2D(shadowMap, shadowCoord.xy + offset).r;
                            lit += (shadowCoord.z - bias > closest) ? 0.0 : 1.0;
                        }
                    }
                    lit /= 9.0;  // 3 x 3 = 9
                } else {
                    // SKIP PCF FILTERING
                    float closest = texture2D(shadowMap, shadowCoord.xy).r;
                    lit = (shadowCoord.z - bias > closest) ? 0.0 : 1.0;
                }

                // If the projected shadow coordinate is outside the light's frustum, assume it's fully lit
                if (shadowCoord.x < 0.0 || shadowCoord.x > 1.0 || shadowCoord.y < 0.0 || shadowCoord.y > 1.0 || shadowCoord.z > 1.0) {
                    lit = 1.0;
                }

                // Final Color Output: Combine ambient and shadowed diffuse lighting
                vec3 finalColor = ambient + diffuse * lit;

                // Output the final color with full opacity
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `,
        });
    }

    updateMapData(mapDataObject) {
        // Syncs the renderer with an updated Map object (usually from MapEditor)
        // detects changes platforms on the CPU and only changed instances are uploaded/revised in the buffers on the  GPU
        if (!this.#initialized) return;

        // No existing map data
        if (!this.#mapData) {
            this.setMapData(mapDataObject);
            return;
        }

        const platforms = mapDataObject.platforms;

        // Adding or removing platforms changes the instance count which requires buffers to be rebuilt
        if (platforms.length !== this.#mapData.platformCount) {
            this.setMapData(mapDataObject);
            return;
        }

        const heightsChanged = this.#updateMapStyle(mapDataObject.style);

        let firstChanged = this.#mapData.platformCount; // starts at the end of the array and moves towards the start as changed items are found
        let lastChanged = -1; // starts at the start of the array and moves towards the end of the array as changed items are found

        // FIX
        // Instead of searching through all the platforms to figure out which have changed,
        // have MapEditor pass the info which ones have changed. It should already know

        for (let i = 0; i < platforms.length; i++) {
            if (this.#updatePlatformInstanceArrays(i, platforms[i], mapDataObject.style)) {
                // if this platform DOES need to get changed then updatePlatformInstanceArrays returns true the following runs vvv
                if (i < firstChanged) firstChanged = i;
                lastChanged = i;
            }
        }

        if (lastChanged >= firstChanged) {
            // only update a specific range within the GPU buffers, no need to rewrite them all
            this.#updateInstanceBuffersWithinRange(firstChanged, lastChanged + 1);
        }
    }

    setCameraPos(x, y, z, zoom) {
        this.#camera.x = x;
        this.#camera.y = y;
        this.#camera.z = z;
        this.#camera.zoom = zoom;
    }

    resize(width, height) {
        this.#canvas.width = width;
        this.#canvas.height = height;
        this.#aspectRatio = width / height;

        // tells regl to re-read canvas dimensions
        if (this.#regl) {
            this.#regl.poll();
        }
    }

    drawFrame(player) {
        this.#updateHalfGroundExtents();

        this.#syncGroundInstanceArraysAndBuffersWithCamera(this.#mapData.style);

        // Update lightView and lightProjection
        const yMin = -this.#mapData.style.platformHeight; // top of the ground
        const yMax = Math.max(this.#mapData.style.wallHeight, player.y + PLAYER_SIZE, 0); // top of walls or top of player, whichever is higher on y axis
        this.#updateLightMatrices(yMin, yMax);
        this.#updateCameraProjection(yMin, yMax); // could do yMin - 1 to include ground cubes bottom

        // UPDATE VIEW
        mat4_lookAt(
            this.#view,
            // Camera looks down at 45deg angle
            new Vector2D3D(this.#camera.x, CAMERA_EYE_HEIGHT, this.#camera.z + CAMERA_EYE_Z_OFFSET), // eye (camera position)
            new Vector2D3D(this.#camera.x, 0, this.#camera.z), // center (look at)
            new Vector2D3D(0, 1, 0), // Up
        );

        this.#updatePlayerInstanceArraysAndBuffers(player);

        this.#globalScope(() => {
            // Shadow pass (to shadow map)
            this.#regl.clear({ framebuffer: this.#shadowFrameBufferObject, depth: 1 });
            this.#drawInstancedCubesDepth();

            // Color pass (main scene with shadows)
            this.#regl.clear({ color: this.#mapData.backgroundColor, depth: 1 }); // use this.#mapData.backgroundColor color here. this allocates every frame. fix
            this.#drawInstancedCubes();
        });
    }

    destroy() {
        this.#regl.destroy();
        this.#regl = null;

        if (this.#mapData) {
            this.#mapData.translateBuffer.destroy();
            this.#mapData.scaleBuffer.destroy();
            this.#mapData.rotationBuffer.destroy();
            this.#mapData.instanceTypeBuffer.destroy();
            this.#mapData = null;

            this.#shadowFrameBufferObject.destroy();
            this.#shadowFrameBufferObject = null;
            this.#shadowMap.destroy();
            this.#shadowMap = null;
            this.#positionBuffer.destroy();
            this.#positionBuffer = null;
            this.#normalBuffer.destroy();
            this.#normalBuffer = null;
        }

        this.#initialized = false;
    }
}
