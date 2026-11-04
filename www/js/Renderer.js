// requires regl and mat4 functions (lookAt and ortho)
const squareRootOf2 = 1.4142135623730951;

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

class Renderer {
    #canvas = null;
    #aspectRatio = null;
    #camera = {
        x: 0,
        y: 10,
        z: 0,
        zoom: 300,
    };

    #initialized = false;
    #regl = null;

    #SHADOW_RES = 1024;
    #fbo = null;

    #positionBuffer = null;
    #normalBuffer = null;

    #boxVertexPosition = [
        // side faces
        [-0.5, +0.5, +0.5],
        [+0.5, +0.5, +0.5],
        [+0.5, -0.5, +0.5],
        [-0.5, -0.5, +0.5], // positive z face.
        [+0.5, +0.5, +0.5],
        [+0.5, +0.5, -0.5],
        [+0.5, -0.5, -0.5],
        [+0.5, -0.5, +0.5], // positive x face
        [+0.5, +0.5, -0.5],
        [-0.5, +0.5, -0.5],
        [-0.5, -0.5, -0.5],
        [+0.5, -0.5, -0.5], // negative z face
        [-0.5, +0.5, -0.5],
        [-0.5, +0.5, +0.5],
        [-0.5, -0.5, +0.5],
        [-0.5, -0.5, -0.5], // negative x face.
        [-0.5, +0.5, -0.5],
        [+0.5, +0.5, -0.5],
        [+0.5, +0.5, +0.5],
        [-0.5, +0.5, +0.5], // top face
        [-0.5, -0.5, -0.5],
        [+0.5, -0.5, -0.5],
        [+0.5, -0.5, +0.5],
        [-0.5, -0.5, +0.5], // bottom face
    ];

    #boxElements = [
        [2, 1, 0],
        [2, 0, 3],
        [6, 5, 4],
        [6, 4, 7],
        [10, 9, 8],
        [10, 8, 11],
        [14, 13, 12],
        [14, 12, 15],
        [18, 17, 16],
        [18, 16, 19],
        [20, 21, 22],
        [23, 20, 22],
    ];

    #boxVertexNormal = [
        // side faces
        [0.0, 0.0, +1.0],
        [0.0, 0.0, +1.0],
        [0.0, 0.0, +1.0],
        [0.0, 0.0, +1.0],
        [+1.0, 0.0, 0.0],
        [+1.0, 0.0, 0.0],
        [+1.0, 0.0, 0.0],
        [+1.0, 0.0, 0.0],
        [0.0, 0.0, -1.0],
        [0.0, 0.0, -1.0],
        [0.0, 0.0, -1.0],
        [0.0, 0.0, -1.0],
        [-1.0, 0.0, 0.0],
        [-1.0, 0.0, 0.0],
        [-1.0, 0.0, 0.0],
        [-1.0, 0.0, 0.0],
        // top
        [0.0, +1.0, 0.0],
        [0.0, +1.0, 0.0],
        [0.0, +1.0, 0.0],
        [0.0, +1.0, 0.0],
        // bottom
        [0.0, -1.0, 0.0],
        [0.0, -1.0, 0.0],
        [0.0, -1.0, 0.0],
        [0.0, -1.0, 0.0],
    ];

    #mapData = null;

    // This call encapsulates the common state between `drawNormal` and `drawDepth`
    #globalScope = null;
    #drawInstancedBoxesDepth = null;
    #drawPlayerDepth = null;
    #drawInstancedBoxes = null;
    #drawPlayer = null;

    constructor(targetCanvas) {
        this.#canvas = targetCanvas;
        // devicePixelRatio
    }

    init(width, height) {
        if (this.#initialized) return;

        this.resize(width, height);

        this.#regl = createREGL({
            canvas: this.#canvas,
            extensions: ["ANGLE_instanced_arrays", "oes_texture_float", "WEBGL_color_buffer_float"], // "WEBGL_depth_texture"
            // attributes: {
            //     antialias: this._antialias,
            //     alpha: this._alpha,
            //     premultipliedAlpha: false,
            //     preserveDrawingBuffer: false,  // better perf on mobile
            //     powerPreference: 'high-performance',
            // },
        });

        // set up geometry buffers
        this.#positionBuffer = this.#regl.buffer({
            data: this.#boxVertexPosition,
            type: "float32",
        });

        this.#normalBuffer = this.#regl.buffer({
            data: this.#boxVertexNormal,
            type: "float32", // maybe not float?
        });

        this.#fbo = this.#regl.framebuffer({
            color: this.#regl.texture({
                width: this.#SHADOW_RES,
                height: this.#SHADOW_RES,
                wrap: "clamp",
                type: "float",
            }),
            depth: true,
        });

        this.#initialized = true;
    }

    #destroyMapDataBuffers() {
        if (!this.#mapData) return;

        console.log("[Renderer] Destroying existing mapData buffers and keys");
        try {
            this.#mapData.translateBuffer.destroy();
            this.#mapData.scaleBuffer.destroy();
            this.#mapData.rotationBuffer.destroy();
            this.#mapData.instanceTypeBuffer.destroy();
        } catch {
            console.log("error deleting mapData buffers");
        }

        this.#mapData = null; // gets rid of all color properties and lightvector
    }

    #writePlatformInstance(index, platform, style) {
        // Update a single platform within the CPU side instance data
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

    #writeGroundInstance(style) {
        // Add ground cube
        // style.platform height is needed to determine how far down below 0 the ground needs to be placed on Y axis
        const mapData = this.#mapData;
        const index = mapData.platformCount; // ground is always last
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

    // combine writePlatformInstance and writeGroundInstance
    #writeAllInstances(mapDataObject) {
        const style = mapDataObject.style;
        const platforms = mapDataObject.platforms;

        for (let i = 0; i < platforms.length; i++) {
            this.#writePlatformInstance(i, platforms[i], style);
        }

        this.#writeGroundInstance(style);
    }

    #updateInstanceBuffersWithinRange(start, end) {
        // update data in all buffers but only in the specified range
        // end param is "exclusive"
        // Offsets passed to subdata are in bytes (4 bytes per float).

        // Translate and scale store 3 floats per instance (x, y, z),
        // so convert instance indices to float indices.
        const mapData = this.#mapData;
        const start3 = start * 3;
        const end3 = end * 3;

        // Each float is 4 bytes, so the byte offset is the float index * 4.
        // .subdata(data, byteOffset) copies `data` into the buffer starting at `byteOffset`.
        mapData.translateBuffer.subdata(mapData.translateData.subarray(start3, end3), start3 * 4);
        mapData.scaleBuffer.subdata(mapData.scaleData.subarray(start3, end3), start3 * 4);
        mapData.rotationBuffer.subdata(mapData.rotationData.subarray(start, end), start * 4);
        mapData.instanceTypeBuffer.subdata(mapData.instanceTypeData.subarray(start, end), start * 4);
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

    setMapData(mapDataObject) {
        // parses platform and style data from mapDataObject in this.#mapData
        //

        this.#destroyMapDataBuffers();

        const style = mapDataObject.style;
        const platformCount = mapDataObject.platforms.length;
        const instanceCount = platformCount + 1; // +1 for ground

        this.#mapData = {
            instanceCount,
            platformCount,

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
        this.#writeAllInstances(mapDataObject);

        // assign GPU buffers
        this.#mapData.translateBuffer = this.#regl.buffer(this.#mapData.translateData);
        this.#mapData.scaleBuffer = this.#regl.buffer(this.#mapData.scaleData);
        this.#mapData.rotationBuffer = this.#regl.buffer(this.#mapData.rotationData);
        this.#mapData.instanceTypeBuffer = this.#regl.buffer(this.#mapData.instanceTypeData);

        this.#globalScope = this.#regl({
            context: {
                // light POSITION is at [0,0,0]
                // lightVector: [-1.0, -1.0, -0.3], // example
                lightVector: () => this.#mapData.lightVector,
            },
            uniforms: {
                lightVector: this.#regl.context("lightVector"),
                lightView: (context) => {
                    return mat4_lookAt(
                        // giving the camera the "sun's" position and angle
                        // this light-view-camera follows the cameras position
                        [], // Output Matrix
                        new Vector2D3D(this.#camera.x, 0, this.#camera.z), // light POSITION
                        new Vector2D3D(context.lightVector[0] + this.#camera.x, context.lightVector[1], context.lightVector[2] + this.#camera.z), // light Direction Vector
                        new Vector2D3D(0, 1, 0), // Up Vector
                    );
                },
                lightProjection: () =>
                    mat4_ortho([], -this.#camera.zoom / 2, this.#camera.zoom / 2, -this.#camera.zoom / 2, this.#camera.zoom / 2, -600, 800),
                // lightProjection: mat4.ortho([], -200, 200, -200, 200, -600, 800), // near is negative because light position is (0,0,0)
                // near and far plane distance is small if light is stright down. needs to be larger distance if light is as dramatic angle.
                // bounds of this light change based on camera's zoom level.
            },
        });

        this.#drawInstancedBoxesDepth = this.#regl({
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

            uniforms: {
                // all uniforms covered by globalScope
            },

            elements: this.#boxElements,

            instances: this.#mapData.instanceCount,

            cull: { enable: true },

            vert: `
            precision mediump float;

            attribute vec3 position;
            attribute vec3 translate;
            attribute vec3 scale;
            attribute float rotation;

            uniform mat4 lightProjection;
            uniform mat4 lightView;

            varying vec3 vPosition;

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
                vPosition = gl_Position.xyz;
            }
            `,
            frag: `
            precision mediump float;
            varying vec3 vPosition;
            void main () {
                gl_FragColor = vec4(vPosition.z, 0.0, 0.0, 1.0);
            }
            `,
        });

        this.#drawPlayerDepth = this.#regl({
            attributes: {
                position: {
                    buffer: this.#positionBuffer,
                    size: 3,
                },
            },

            uniforms: {
                // most uniforms covered by globalScope
                translate: this.#regl.prop("translate"),
                rotation: this.#regl.prop("rotation"),
            },

            elements: this.#boxElements,

            cull: { enable: true },

            vert: `
            precision mediump float;

            attribute vec3 position;

            uniform vec3 translate;
            uniform float rotation;
            uniform mat4 lightProjection;
            uniform mat4 lightView;

            varying vec3 vPosition;

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
                mat4 model = getModelMatrix(translate, rotation, vec3(32, 32, 32));
                vec4 worldPosition = model * vec4(position, 1.0);
                gl_Position = lightProjection * lightView * worldPosition;
                vPosition = gl_Position.xyz;
            }
            `,
            frag: `
            precision mediump float;
            varying vec3 vPosition;
            void main () {
                gl_FragColor = vec4(vPosition.z, 0.0, 0.0, 1.0);
            }
            `,
        });

        this.#drawInstancedBoxes = this.#regl({
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
                projection: () =>
                    mat4_ortho(
                        [],
                        // FIX FIX MOVE THIS TO A FUNCTION. or add the view and projection mat4s to the global scope because they
                        // are used / repeated twice.

                        // Military projection
                        // Horizontal bounds are stretched by √2
                        // This "squashes" the view horizontally when it tries to fit into a viewport that is NOT scaled by √2
                        // the larger dimension of the screen (either width or height) will always be used as the dimension
                        // that is equal to camera.zoom. The smaller dimmension will vary and be squished for military projection

                        // when in portrait (height is GREATER than width) width needs to HAVE squashing
                        // in portrait mode: height should be sqashed down to account for the 45deg angle of the camera showing more than we want

                        // WIDTH
                        -this.#camera.zoom * 0.5 * (screenHeight > screenWidth ? this.#aspectRatio : 1),
                        this.#camera.zoom * 0.5 * (screenHeight > screenWidth ? this.#aspectRatio : 1),

                        // when in landcape (height is LESS than width) height needs to HAVE squashing
                        // HEIGHT
                        (-this.#camera.zoom * 0.5) / (screenHeight < screenWidth ? this.#aspectRatio * squareRootOf2 : 1 * squareRootOf2),
                        (this.#camera.zoom * 0.5) / (screenHeight < screenWidth ? this.#aspectRatio * squareRootOf2 : 1 * squareRootOf2),

                        // Because the camera isnt looking straight down at the map (despite what military projection might look like)
                        // The VERTICAL bounds of -camera.zoom to +camera.zoom will not map directly to world coodinates. Horizontal will though.
                        // So having zoom be equal to how much of the world is visible only works on the horizontal axis unless
                        // you took into account the 45deg angle of the camera by multipling zoom by sqrt of 2

                        -2000,
                        2000,
                    ),

                view: () =>
                    mat4_lookAt(
                        [],
                        // Camera looks down at 45deg angle
                        new Vector2D3D(this.#camera.x, 10, this.#camera.z + 10), // eye (camera position)
                        new Vector2D3D(this.#camera.x, 0, this.#camera.z), // center (look at)
                        new Vector2D3D(0, 1, 0), // Up
                    ),

                shadowMap: this.#fbo,

                minBias: 0.001,
                maxBias: 0.01,

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

            elements: this.#boxElements,

            instances: this.#mapData.instanceCount,

            cull: { enable: true },

            vert: `
            precision mediump float;

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

            varying vec3 vNormal;
            varying vec3 vShadowCoord;
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
                vShadowCoord = (lightProjection * lightView * worldPosition).xyz; // just get the vec3 not vec4
                vInstanceType = instanceType; // pass to fragment shader
            }
            `,

            // The shadow coordinate transform is incomplete. In the vertex shader, vShadowCoord is computed but not divided by w.
            // For orthographic projection this doesn't matter (w=1), but the coordinate is in NDC range [-1, 1] on Z,
            // yet you compare it directly against the shadow map depth which was stored as vPosition.z (also NDC range).
            // This works, but the depth pass stores vPosition.z which ranges from -1 to 1 while typical shadow maps store 0 to 1.
            // The bias values (0.001/0.01) may be tuned to compensate but this is fragile.

            frag: `
            precision mediump float;

            // Varying inputs from the vertex shader
            varying vec3 vNormal;         // Interpolated surface normal (world space or view space)
            varying vec3 vShadowCoord;    // Fragment position in light's projection space (for shadow lookup)
            varying float vInstanceType;  // Per-instance type data

            // Uniforms (global shader inputs)
            uniform sampler2D shadowMap;       // Shadow map texture (depth values from light’s POV)
            uniform vec3 lightVector;          // Direction of the light (not normalized)
            uniform float minBias;             // Minimum depth bias to avoid shadow artifacts
            uniform float maxBias;             // Maximum depth bias, used at glancing angles

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

            // Constant: size of one texel in the shadow map
            #define texelSize (1.0 / float(${this.#SHADOW_RES})) // SHADOW_RES replaced by actual resolution at compile time


            // Compare depth map point to projected point
            float shadowSample(vec2 uv, float fragDepth, float bias) {
                float shadowMapDepth = texture2D(shadowMap, uv).r;  // Depth from the shadow map
                return step(fragDepth - bias, shadowMapDepth);      // Returns 1.0 if not in shadow, 0.0 if in shadow
            }

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

                // Shadow Bias Calculation
                // Avoids shadow acne by offsetting the fragment's depth
                float bias = max(maxBias * (1.0 - cosTheta), minBias);

                // Shadow Map Coordinates
                // Transform shadow coord from NDC space (-1..1) to UV space (0..1)
                vec2 uv = vShadowCoord.xy * 0.5 + 0.5;


                // Shadow Sampling with PCF (2x2 filter)
                float shadowFactor = 1.0; // Default: fully lit

                // Sample depth at 4 neighboring texels and average
                float s0 = shadowSample(uv + texelSize * vec2(0.0, 0.0), vShadowCoord.z, bias);
                float s1 = shadowSample(uv + texelSize * vec2(1.0, 0.0), vShadowCoord.z, bias);
                float s2 = shadowSample(uv + texelSize * vec2(0.0, 1.0), vShadowCoord.z, bias);
                float s3 = shadowSample(uv + texelSize * vec2(1.0, 1.0), vShadowCoord.z, bias);
                shadowFactor = (s0 + s1 + s2 + s3) * 0.25;


                // Edge Case: Outside of Shadow Map
                // If the projected shadow coordinate is outside the light's frustum, assume fully lit
                if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                    shadowFactor = 1.0;
                }

                // Final Color Output: Combine ambient and shadowed diffuse lighting
                vec3 finalColor = ambient + diffuse * shadowFactor;

                // Output the final color with full opacity
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `,
        });

        this.#drawPlayer = this.#regl({
            attributes: {
                position: {
                    buffer: this.#positionBuffer,
                    size: 3,
                },
                normal: {
                    buffer: this.#normalBuffer,
                    size: 3,
                },
            },

            uniforms: {
                // extract projection and view into global scope because they are used twice
                projection: () =>
                    mat4_ortho(
                        [],
                        -this.#camera.zoom * 0.5 * (screenHeight > screenWidth ? this.#aspectRatio : 1),
                        this.#camera.zoom * 0.5 * (screenHeight > screenWidth ? this.#aspectRatio : 1),
                        (-this.#camera.zoom * 0.5) / (screenHeight < screenWidth ? this.#aspectRatio * squareRootOf2 : 1 * squareRootOf2),
                        (this.#camera.zoom * 0.5) / (screenHeight < screenWidth ? this.#aspectRatio * squareRootOf2 : 1 * squareRootOf2),
                        -2000,
                        2000,
                    ),

                view: () =>
                    mat4_lookAt(
                        [],
                        new Vector2D3D(this.#camera.x, 10, this.#camera.z + 10), // eye (camera position)
                        new Vector2D3D(this.#camera.x, 0, this.#camera.z), // center (look at)
                        new Vector2D3D(0, 1, 0), // Up
                    ),

                shadowMap: this.#fbo,

                minBias: 0.001,
                maxBias: 0.01,

                // translations = translations.concat([mapDataObject.playerStart.x, mapDataObject.style.platformHeight + 16, mapDataObject.playerStart.y]); // +16 becasue player is 32 tall
                // scales = scales.concat([32, 32, 32]);
                // rotations.push((-mapDataObject.playerStart.angle * Math.PI) / 180)
                translate: this.#regl.prop("translate"),
                rotation: this.#regl.prop("rotation"),

                ambientLight: () => this.#mapData.ambientLight,
                directLight: () => this.#mapData.directLight,
                playerColor: () => this.#mapData.playerColor,
            },

            elements: this.#boxElements,

            cull: { enable: true },

            vert: `
            precision mediump float;

            attribute vec3 position;
            attribute vec3 normal;

            uniform vec3 translate;
            uniform float rotation;

            uniform mat4 projection;
            uniform mat4 view;
            uniform mat4 lightProjection;
            uniform mat4 lightView;

            varying vec3 vNormal;
            varying vec3 vShadowCoord;

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
                mat4 model = getModelMatrix(translate, rotation, vec3(32, 32, 32));

                vec4 worldPosition = model * vec4(position, 1.0);
                gl_Position = projection * view * worldPosition;

                vNormal = mat3(model) * normal;
                vShadowCoord = (lightProjection * lightView * worldPosition).xyz; // just get the vec3 not vec4
            }
            `,

            // The shadow coordinate transform is incomplete. In the vertex shader, vShadowCoord is computed but not divided by w.
            // For orthographic projection this doesn't matter (w=1), but the coordinate is in NDC range [-1, 1] on Z,
            // yet you compare it directly against the shadow map depth which was stored as vPosition.z (also NDC range).
            // This works, but the depth pass stores vPosition.z which ranges from -1 to 1 while typical shadow maps store 0 to 1.
            // The bias values (0.001/0.01) may be tuned to compensate but this is fragile.

            frag: `
            precision mediump float;

            // Varying inputs from the vertex shader
            varying vec3 vNormal;         // Interpolated surface normal (world space or view space)
            varying vec3 vShadowCoord;    // Fragment position in light's projection space (for shadow lookup)

            // Uniforms (global shader inputs)
            uniform sampler2D shadowMap;       // Shadow map texture (depth values from light’s POV)
            uniform vec3 lightVector;          // Direction of the light (not normalized)
            uniform float minBias;             // Minimum depth bias to avoid shadow artifacts
            uniform float maxBias;             // Maximum depth bias, used at glancing angles

            uniform vec3 ambientLight;
            uniform vec3 directLight;
            uniform vec3 playerColor;

            // Constant: size of one texel in the shadow map
            #define texelSize (1.0 / float(${this.#SHADOW_RES})) // SHADOW_RES replaced by actual resolution at compile time


            // Compare depth map point to projected point
            float shadowSample(vec2 uv, float fragDepth, float bias) {
                float shadowMapDepth = texture2D(shadowMap, uv).r;  // Depth from the shadow map
                return step(fragDepth - bias, shadowMapDepth);      // Returns 1.0 if not in shadow, 0.0 if in shadow
            }

            void main() {

                // determine if pixel should use top or side color
                bool isTop = (vNormal.y > 0.0);

                vec3 topColor = playerColor;
                vec3 sideColor = playerColor;
                
                // set appropriate base color for pixel
                vec3 baseColor = isTop ? topColor : sideColor;

                // Lighting: Ambient + Diffuse
                vec3 ambient = ambientLight * baseColor;

                // Calculate diffuse lighting using Lambert's cosine law
                float cosTheta = dot(normalize(vNormal), -normalize(lightVector));
                float diffuseStrength = clamp(cosTheta, 0.0, 1.0);
                vec3 diffuse = directLight * baseColor * diffuseStrength;

                // Shadow Bias Calculation
                // Avoids shadow acne by offsetting the fragment's depth
                float bias = max(maxBias * (1.0 - cosTheta), minBias);

                // Shadow Map Coordinates
                // Transform shadow coord from NDC space (-1..1) to UV space (0..1)
                vec2 uv = vShadowCoord.xy * 0.5 + 0.5;


                // Shadow Sampling with PCF (2x2 filter)
                float shadowFactor = 1.0; // Default: fully lit

                // Sample depth at 4 neighboring texels and average
                float s0 = shadowSample(uv + texelSize * vec2(0.0, 0.0), vShadowCoord.z, bias);
                float s1 = shadowSample(uv + texelSize * vec2(1.0, 0.0), vShadowCoord.z, bias);
                float s2 = shadowSample(uv + texelSize * vec2(0.0, 1.0), vShadowCoord.z, bias);
                float s3 = shadowSample(uv + texelSize * vec2(1.0, 1.0), vShadowCoord.z, bias);
                shadowFactor = (s0 + s1 + s2 + s3) * 0.25;


                // Edge Case: Outside of Shadow Map
                // If the projected shadow coordinate is outside the light's frustum, assume fully lit
                if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                    shadowFactor = 1.0;
                }

                // Final Color Output: Combine ambient and shadowed diffuse lighting
                vec3 finalColor = ambient + diffuse * shadowFactor;

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
            if (this.#writePlatformInstance(i, platforms[i], mapDataObject.style)) { 
                // if this platform DOES need to get changed then writePlatformInstance returns true the following runs vvv 
                if (i < firstChanged) firstChanged = i;
                lastChanged = i;
            }
        }

        if (heightsChanged) {
            // Changing platform height also moves the ground cubes y position
            if (this.#writeGroundInstance(mapDataObject.style)) {
                firstChanged = Math.min(firstChanged, this.#mapData.platformCount);
                lastChanged = this.#mapData.platformCount; 
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
        this.#globalScope(() => {
            // Shadow pass (to shadow map)
            this.#fbo.use(() => {
                this.#regl.clear({ color: [1, 1, 1, 1], depth: 1 });
                this.#drawInstancedBoxesDepth();
                this.#drawPlayerDepth({
                    translate: [player.x, player.y + 16, player.z], // +16 to that players "origin" is at its base
                    rotation: -player.angleRad,
                });
            });

            // Color pass (main scene with shadows)
            this.#drawInstancedBoxes();

            this.#drawPlayer({
                translate: [player.x, player.y + 16, player.z], // +16 to that players "origin" is at its base
                rotation: -player.angleRad,
            });
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
        }

        this.#initialized = false;
    }
}
