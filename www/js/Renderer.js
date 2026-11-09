// requires three.js (global THREE, see www/js/three.min.js)

const PLAYER_SIZE = 32;
const GROUND_SIZE = 10000;
const SHADOW_MAP_SIZE = 1024;

// The camera sits this far above and this far "behind" its target, which is a 45 degree angle down.
const CAMERA_OFFSET = 10;

// The shadow frustum is fitted around the visible volume (see updateLight), then padded by this many shadow texels
// on every side. This leaves room for texel snapping (up to half a texel) and for the shadow filter's kernel.
const SHADOW_PAD_TEXELS = 2;

// Gap, in world units, between the sun and the nearest/farthest thing it has to render
const SHADOW_DEPTH_MARGIN = 1;

// A sun this close to the horizon would cast infinitely long shadows. Clamps how far from the visible area
// a tall wall can be and still have its shadow considered.
const MIN_SUN_SIN_PITCH = 0.05;

const SHADOW_BIAS = -0.0005;

// Maps were authored for "color * light color" shading. Three's lights are physically based (the diffuse
// BRDF divides by PI), so light intensity must be PI to get the authored look.
const LIGHT_INTENSITY = Math.PI;

// Editor instance buffers get this much spare room so adding a platform rarely needs a new buffer
const EDITOR_SPARE_INSTANCES = 16;

// Platforms, walls, and end zones are each their own InstancedMesh since they differ in color.
// Index = type. Values are the map style keys for that type's colors.
const PLATFORM_TYPES = [
    { top: "platformTopColor", side: "platformSideColor" },
    { top: "wallTopColor", side: "wallSideColor" },
    { top: "endZoneTopColor", side: "endZoneSideColor" },
];

function getType(platform) {
    if (platform.wall) return 1;
    if (platform.endzone) return 2;
    return 0;
}

function setColor(color, rgbString) {
    // FIX should store Map color data in a format so that this function is not needed.
    // Parses "rgb(r, g, b)" / "rgba(r, g, b, a)" into 0-1 values. Alpha is ignored.
    const matches = rgbString.match(/[\d.]+/g);
    if (!matches || matches.length < 3) {
        console.error("Invalid RGB(A) string");
        return;
    }

    const [r, g, b] = matches.slice(0, 3).map((n) => parseFloat(n) / 255);

    // Map colors were authored for raw output, so they are used as-is (no sRGB conversion)
    color.setRGB(r, g, b, THREE.LinearSRGBColorSpace);
}

function createPlatformGeometry() {
    // Build a unit cube with only the faces visible from above
    // Sides use material 0 and top uses material 1
    // BoxGeometry stores 6 indices per face in the order [+x -x +y -y +z -z]
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const source = geometry.index.array; // Original cube index buffer

    // Keep the four side faces (+x, -x, +z, -z) first so they form one contiguous group
    // Then add the top face (+y). The bottom face (-y) is omitted since it's never visible
    const faceOrder = [0, 1, 4, 5, 2];

    // Allocate an index buffer with 6 indices per kept face, using the same array type as the source
    const index = new source.constructor(faceOrder.length * 6);

    // Copy each selected face's 6 indices into the new buffer, in the new order
    faceOrder.forEach((face, i) => index.set(source.subarray(face * 6, face * 6 + 6), i * 6));

    // Replace the cube's index buffer with the reduced one and reset its draw groups
    geometry.setIndex(new THREE.BufferAttribute(index, 1));
    geometry.clearGroups();

    // Group 0 (material 0): the four side faces, 4 faces × 6 indices = 24
    geometry.addGroup(0, 24, 0); // sides

    // Group 1 (material 1): the top face, 1 face × 6 indices, starting after the sides
    geometry.addGroup(24, 6, 1); // top
    return geometry;
}

class Renderer {
    canvas;
    width = 1;
    height = 1;
    contextLost = false;
    editorMode = false; // see setEditorMode

    // Where the camera is looking. (Camera height is fixed, see CAMERA_OFFSET)
    target = { x: 0, z: 0, zoom: 300 };

    renderer = null; // THREE.WebGLRenderer. Also acts as the "initialized" flag
    scene = null;
    camera = null;
    ambientLight = null;
    sunLight = null;
    lightVector = new THREE.Vector3(0, -1, 0); // direction the sun shines in. Unit length
    lightRight = new THREE.Vector3(1, 0, 0); // light space axes, see updateLightBasis
    lightUp = new THREE.Vector3(0, 0, -1);

    boxGeometry = null; // unit cube shared by every platform instance
    typeMaterials = []; // per type: { top, side, faces }. faces is [side, top] to match the groups of boxGeometry
    groundMaterial = null;
    playerMaterial = null;
    ground = null;
    player = null;

    // The map object last given to setMapData / updateMapData, kept so the scene can be rebuilt after a context loss
    mapData = null;

    // { types, slots, meshes } or null. types[i] and slots[i] are platform i's type and its index in that type's mesh
    map = null;

    constructor(targetCanvas, { editorMode = false } = {}) {
        this.canvas = targetCanvas;
        this.editorMode = editorMode;
    }

    setEditorMode(enabled) {
        // In editor mode instance matrices are flagged as frequently updated, and instance buffers get spare capacity.
        // Takes effect for instance meshes created from now on, so call it before setMapData.
        this.editorMode = enabled;
    }

    init(width, height) {
        if (this.renderer) return;

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: "default" }); // could remove powerPreference
        this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // see setColor
        this.renderer.shadowMap.enabled = true;

        this.canvas.addEventListener("webglcontextlost", this.onContextLost);
        this.canvas.addEventListener("webglcontextrestored", this.onContextRestored);

        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -2000, 2000);

        this.ambientLight = new THREE.AmbientLight(0xffffff, LIGHT_INTENSITY);
        this.scene.add(this.ambientLight);

        this.sunLight = new THREE.DirectionalLight(0xffffff, LIGHT_INTENSITY);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
        this.sunLight.shadow.bias = SHADOW_BIAS; // normalBias is set every frame, it depends on the texel size
        this.scene.add(this.sunLight, this.sunLight.target);

        this.boxGeometry = createPlatformGeometry();
        this.createMaterials();

        // Ground is a flat plane under everything. It follows the camera (see drawFrame) so it always fills the view.
        // Its height is set in applyStyle
        this.ground = new THREE.Mesh(new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE), this.groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.ground.matrixAutoUpdate = false; // only recomputed when it moves
        this.ground.updateMatrix();
        this.scene.add(this.ground);

        // Player's origin is at its base
        const playerGeometry = new THREE.BoxGeometry(PLAYER_SIZE, PLAYER_SIZE, PLAYER_SIZE);
        playerGeometry.translate(0, PLAYER_SIZE / 2, 0);
        this.player = new THREE.Mesh(playerGeometry, this.playerMaterial);
        this.player.castShadow = true;
        this.player.receiveShadow = true;
        this.scene.add(this.player);

        this.resize(width, height);
    }

    onContextLost = (event) => {
        event.preventDefault(); // tells the browser we want the context back
        this.contextLost = true;
    };

    onContextRestored = () => {
        // Three resets its own GPU state when the context comes back. What it can't know is that our materials and
        // shadow map were built against the old context, so those get rebuilt here along with the map's buffers.
        if (!this.renderer) return;

        for (const { top, side } of this.typeMaterials) {
            top.needsUpdate = true;
            side.needsUpdate = true;
        }
        this.groundMaterial.needsUpdate = true;
        this.playerMaterial.needsUpdate = true;

        const shadow = this.sunLight.shadow;
        shadow.dispose();
        shadow.map = null; // recreated on the next render
        shadow.mapPass = null;

        if (this.mapData) {
            this.destroyMap();
            this.setMapData(this.mapData);
        }

        this.contextLost = false;
    };

    createMaterials() {
        this.typeMaterials = PLATFORM_TYPES.map(() => {
            const top = new THREE.MeshLambertMaterial();
            const side = new THREE.MeshLambertMaterial();
            return { top, side, faces: [side, top] };
        });
        this.groundMaterial = new THREE.MeshLambertMaterial();
        this.playerMaterial = new THREE.MeshLambertMaterial();
    }

    applyStyle(style) {
        // Colors, light direction, and ground height all come from the map style
        PLATFORM_TYPES.forEach((keys, type) => {
            setColor(this.typeMaterials[type].top.color, style[keys.top]);
            setColor(this.typeMaterials[type].side.color, style[keys.side]);
        });
        setColor(this.groundMaterial.color, style.backgroundColor);
        setColor(this.playerMaterial.color, style.playerColor);
        setColor(this.ambientLight.color, style.ambientLight);
        setColor(this.sunLight.color, style.directLight);

        this.renderer.setClearColor(this.groundMaterial.color); // this wont match ground exactly because it is unshaded

        // FIX Should store light vector as a real vector so we dont need to compute it here.
        const direction = THREE.MathUtils.degToRad(style.lightDirection);
        const pitch = THREE.MathUtils.degToRad(style.lightPitch);
        this.lightVector.set(Math.cos(pitch) * Math.cos(direction), -Math.sin(pitch), Math.cos(pitch) * Math.sin(direction));
        this.updateLightBasis();

        // Platforms extend from y = 0 down to -platformHeight, so the ground sits at the bottom.
        // Its matrix is updated in drawFrame
        this.ground.position.y = -style.platformHeight;
    }

    updateLightBasis() {
        // This does something so that the shadow map snaps to texels and doesnt make the shadows "shimmer"

        // Right/up axes of the sun's shadow camera. These must be exactly the axes three's lookAt builds for the
        // shadow camera, otherwise snapping to the texel grid would not line up with the shadow map's real texels.
        // lookAt uses right = normalize(cross(forward, UP)) and up = cross(right, forward).
        const f = this.lightVector;
        const right = this.lightRight;

        right.set(-f.z, 0, f.x); // cross(f, UP)
        if (right.lengthSq() < 1e-8) {
            // Sun is straight up or down, so cross(f, UP) is zero. Any horizontal axis works, pick a fixed one
            right.set(1, 0, 0);
        } else {
            right.normalize();
        }

        this.lightUp.crossVectors(right, f).normalize();

        // Make three use the same up vector, so it never has to deal with the degenerate case itself
        this.sunLight.shadow.camera.up.copy(this.lightUp);
    }

    writeTransforms(platforms, style) {
        const { types, slots, meshes } = this.map;
        const matrix = new THREE.Matrix4();

        platforms.forEach((platform, i) => {
            const extraHeight = platform.wall ? style.wallHeight : 0;

            // Translate * RotateY * Scale, written out directly. Rotation is only ever about Y.
            const angle = (-platform.angle * Math.PI) / 180; // idk why negative really
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const scaleX = platform.width;
            const scaleY = style.platformHeight + extraHeight;
            const scaleZ = platform.height;

            matrix.set(
                cos * scaleX,
                0,
                sin * scaleZ,
                platform.x,
                0,
                scaleY,
                0,
                (-style.platformHeight + extraHeight) / 2,
                -sin * scaleX,
                0,
                cos * scaleZ,
                platform.y,
                0,
                0,
                0,
                1,
            );

            meshes[types[i]].setMatrixAt(slots[i], matrix);
        });

        for (const mesh of meshes) {
            if (mesh) mesh.instanceMatrix.needsUpdate = true;
        }
    }

    destroyMap() {
        if (!this.map) return;

        for (const mesh of this.map.meshes) {
            if (!mesh) continue;
            this.scene.remove(mesh);
            mesh.dispose(); // frees the instance buffer. Geometry and materials are shared so they stay
        }
        this.map = null;
    }

    syncLayout(platforms) {
        // Works out each platform's type and slot, then makes sure each type's mesh can hold its platforms.
        // Meshes are kept between calls. One is only recreated if it is too small or its draw usage is wrong,
        // so adding or removing a platform normally just changes mesh.count.
        const types = platforms.map(getType);
        const counts = PLATFORM_TYPES.map(() => 0);
        const slots = types.map((type) => counts[type]++);

        const meshes = this.map?.meshes ?? PLATFORM_TYPES.map(() => null);
        const usage = this.editorMode ? THREE.DynamicDrawUsage : THREE.StaticDrawUsage;

        counts.forEach((count, type) => {
            let mesh = meshes[type];

            if (mesh && (count > mesh.instanceMatrix.count || mesh.instanceMatrix.usage !== usage)) {
                this.scene.remove(mesh);
                mesh.dispose();
                mesh = null;
            }

            if (!mesh && count > 0) {
                const capacity = this.editorMode ? count + (count >> 1) + EDITOR_SPARE_INSTANCES : count;

                mesh = new THREE.InstancedMesh(this.boxGeometry, this.typeMaterials[type].faces, capacity);
                if (this.editorMode) mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                mesh.frustumCulled = false; // platforms move around in the map editor. Bounds would go stale
                mesh.matrixAutoUpdate = false; // the mesh itself never moves, only its instances
                mesh.updateMatrix();
                this.scene.add(mesh);
            }

            if (mesh) {
                mesh.count = count;
                mesh.visible = count > 0;
            }
            meshes[type] = mesh;
        });

        this.map = { types, slots, meshes };
    }

    setMapData(mapDataObject) {
        // Builds all of the scene's map geometry from mapDataObject (platforms and style)
        if (!this.renderer) throw new Error("Renderer.setMapData called before init");

        this.mapData = mapDataObject;
        const { platforms, style } = mapDataObject;

        this.syncLayout(platforms);
        this.writeTransforms(platforms, style);
        this.applyStyle(style);
    }

    updateMapData(mapDataObject) {
        // Syncs the renderer with an updated Map object (usually from MapEditor)
        if (!this.renderer) return;

        this.mapData = mapDataObject;
        const { platforms, style } = mapDataObject;
        const types = this.map?.types;

        // Adding/removing platforms or changing a platform's type changes which platform goes in which instance slot
        const layoutChanged = !types || platforms.length !== types.length || platforms.some((p, i) => getType(p) !== types[i]);

        if (layoutChanged) {
            this.syncLayout(platforms);
        }

        // FIX MapEditor already knows which platforms changed. It could pass those so we dont rewrite all of them.
        this.writeTransforms(platforms, style);
        this.applyStyle(style);
    }

    setCameraPos(x, z, zoom) {
        // The camera always looks at ground level
        this.target.x = x;
        this.target.z = z;
        this.target.zoom = zoom;
    }

    resize(width, height) {
        // width and height should already be scaled by devicePixelRatio (the renderer's pixel ratio is left at 1)
        this.width = width;
        this.height = height;
        this.renderer?.setSize(width, height, false); // false: leave the canvas's CSS size alone
    }

    updateCamera() {
        // Military projection
        // The larger screen dimension always equals camera.zoom in world units (horizontally). The smaller
        // dimension is proportionally smaller.
        // Vertical is divided by √2 because the camera looks down at 45deg, which would otherwise show
        // √2 times more of the world vertically than horizontally.
        const aspect = this.width / this.height;
        const halfZoom = this.target.zoom / 2;

        const halfWidth = halfZoom * Math.min(aspect, 1);
        const halfHeight = halfZoom / (Math.max(aspect, 1) * Math.SQRT2);

        const camera = this.camera;
        camera.left = -halfWidth;
        camera.right = halfWidth;
        camera.bottom = -halfHeight;
        camera.top = halfHeight;
        camera.updateProjectionMatrix();

        const { x, z } = this.target;
        camera.position.set(x, CAMERA_OFFSET, z + CAMERA_OFFSET);
        camera.lookAt(x, 0, z);

        // On the ground, the screen's vertical half size is stretched back out by √2
        return { halfWidth, halfDepth: halfHeight * Math.SQRT2 };
    }

    updateLight({ halfWidth, halfDepth }) {
        // The sun follows the camera and its shadow frustum is fitted to the visible volume, so the shadow map is only
        // spent on what is on screen.

        // The visible volume is the screen's footprint on the ground, extruded up to the top of the tallest walls.
        // The camera looks down at 45deg, so at height y the footprint is shifted by y along z. The footprint is
        // axis aligned in the world, but the sun's axes are rotated by the light direction, so the shadow frustum is
        // the bounding box of this volume's corners in light space. That box is exact since the volume is convex.
        const { x, z } = this.target;
        const { platformHeight, wallHeight } = this.mapData.style;
        const f = this.lightVector;
        const right = this.lightRight;
        const up = this.lightUp;
        const sun = this.sunLight;
        const shadowCamera = sun.shadow.camera;

        const yMin = -platformHeight;
        const yMax = Math.max(wallHeight, 0);

        // Light space bounds relative to (x, 0, z): along right, along up, and along the light's forward (depth)
        let rMin = Infinity,
            rMax = -Infinity;
        let uMin = Infinity,
            uMax = -Infinity;
        let dMin = Infinity,
            dMax = -Infinity;

        for (let i = 0; i < 8; i++) {
            const dy = i & 1 ? yMax : yMin;
            const dx = i & 2 ? halfWidth : -halfWidth;
            const dz = dy + (i & 4 ? halfDepth : -halfDepth);

            const r = right.x * dx + right.z * dz; // right is horizontal
            const u = up.x * dx + up.y * dy + up.z * dz;
            const d = f.x * dx + f.y * dy + f.z * dz;

            rMin = Math.min(rMin, r);
            rMax = Math.max(rMax, r);
            uMin = Math.min(uMin, u);
            uMax = Math.max(uMax, u);
            dMin = Math.min(dMin, d);
            dMax = Math.max(dMax, d);
        }

        // Size of a shadow texel in world units, once the padding is added
        const texelCount = SHADOW_MAP_SIZE - 2 * SHADOW_PAD_TEXELS;
        const texelRight = Math.max(rMax - rMin, 1) / texelCount;
        const texelUp = Math.max(uMax - uMin, 1) / texelCount;

        shadowCamera.left = rMin - SHADOW_PAD_TEXELS * texelRight;
        shadowCamera.right = rMax + SHADOW_PAD_TEXELS * texelRight;
        shadowCamera.bottom = uMin - SHADOW_PAD_TEXELS * texelUp;
        shadowCamera.top = uMax + SHADOW_PAD_TEXELS * texelUp;

        // Shadow swimming fix: move the target to the nearest texel grid point in light space. The frustum is fixed
        // relative to the target, so this keeps every texel at the same place in the world while the camera moves.
        // (The real camera is not snapped.) Shifting along right/up never changes the depth, so it doesn't affect near/far.
        const targetRight = right.x * x + right.z * z;
        const targetUp = up.x * x + up.z * z; // the target is at y = 0
        const snapRight = Math.round(targetRight / texelRight) * texelRight - targetRight;
        const snapUp = Math.round(targetUp / texelUp) * texelUp - targetUp;

        sun.target.position.set(x, 0, z).addScaledVector(right, snapRight).addScaledVector(up, snapUp);

        // Depth: walls outside the visible volume can still shadow it. A point at the top of a wall shadows a point
        // at the bottom of the ground up to (height difference / sin(pitch)) away along the light. Put the sun
        // beyond that, and stop the far plane just past the volume.
        const sinPitch = Math.max(-f.y, MIN_SUN_SIN_PITCH);
        const reach = (yMax - yMin) / sinPitch;
        const distance = SHADOW_DEPTH_MARGIN + reach - dMin;

        sun.position.copy(sun.target.position).addScaledVector(f, -distance);

        shadowCamera.near = SHADOW_DEPTH_MARGIN;
        shadowCamera.far = distance + dMax + SHADOW_DEPTH_MARGIN;
        shadowCamera.updateProjectionMatrix();

        sun.shadow.normalBias = Math.max(texelRight, texelUp);
    }

    drawFrame(player) {
        if (!this.renderer || !this.map || this.contextLost) return;

        this.player.position.set(player.x, player.y, player.z);
        this.player.rotation.y = -player.angleRad;

        const view = this.updateCamera();
        this.updateLight(view);

        // The ground stays under the camera. Its matrix is only recomputed when it actually moved
        const ground = this.ground;
        const { x, z } = this.target;
        if (ground.position.x !== x || ground.position.z !== z || ground.matrix.elements[13] !== ground.position.y) {
            ground.position.x = x;
            ground.position.z = z;
            ground.updateMatrix();
        }

        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        // Listeners come off first because forceContextLoss fires webglcontextlost
        this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
        this.canvas.removeEventListener("webglcontextrestored", this.onContextRestored);

        this.destroyMap();

        this.boxGeometry.dispose();
        this.player.geometry.dispose();
        this.ground.geometry.dispose();

        for (const { top, side } of this.typeMaterials) {
            top.dispose();
            side.dispose();
        }
        this.groundMaterial.dispose();
        this.playerMaterial.dispose();

        this.sunLight.shadow.dispose();

        this.renderer.forceContextLoss(); // releases the GPU context now instead of whenever it is garbage collected
        this.renderer.dispose();

        this.renderer = null;
        this.scene = null;
        this.mapData = null;
    }
}
