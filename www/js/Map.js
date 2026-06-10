const Map = {
    walls: [],
    renderedPlatforms: [],
    wallsToCheck: [],
    endZonesToCheck: [],
    name: null,

    initMap: async function (name, isCustom = false) {
        this.platforms = [];
        this.playerStart = null;
        this.style = null;
        this.checkpoints = [];

        this.name = name;

        let mapDataRaw;
        if (isCustom) {
            // load from custom map directory on device
            mapDataRaw = await readFile("device", "maps", name + ".json", "text");
        } else {
            // load from normal local files
            mapDataRaw = await readFile("local", "assets/maps/", name + ".json", "text");
        }

        this.parseMapData(JSON.parse(mapDataRaw)); // sets up map data, styles, lighting, shadows, shadow clips, etc

        Player.initPlayer(this.playerStart.x, this.playerStart.y, this.playerStart.angle);

        document.getElementById("webgl-canvas").classList.remove("hidden");

        UserInterface.switchToUiGroup(UserInterface.uiGroup_inLevel);
        UserInterface.determineButtonColor();

        // set record text in timer box
        ui_timerBox.children[1].textContent = `Record: ${UserInterface.secondsToMinutes(
            UserInterface.records[name] == null ? 0 : UserInterface.records[name],
        )}`;

        // switch to low gravity for maps with moon in the name
        if (name.toLowerCase().includes("moon")) {
            gravity = 300;
        } else {
            gravity = 500;
        }

        renderer.setMapData(this);

        UserInterface.gamestate = 6; // switch to in level
    },

    parseMapData: function (jsonData) {
        this.playerStart = jsonData.playerStart;
        this.style = jsonData.style;
        this.checkpoints = jsonData.checkpoints; // returns an object

        for (const platform of jsonData.platforms) {
            // LOOP THROUGH PLATFORMS TO POPULATE platforms AND walls ARRAYS
            this.platforms.push(platform);
            if (platform.wall) {
                this.walls.push(platform);
            }
        }

        // SET ALL LIGHTING

        // Turning lightDirection and lightPitch into a 3D vector
        const lightDirection_Rads = this.style.lightDirection * (Math.PI / 180);
        const lightPitch_Rads = this.style.lightPitch * (Math.PI / 180); // light pitch = light angle. 0 == flat at the horizon. 90 == directly above

        const x = Math.cos(lightDirection_Rads) * Math.cos(lightPitch_Rads);
        const y = Math.sin(lightDirection_Rads) * Math.cos(lightPitch_Rads);
        const z = Math.sin(lightPitch_Rads);

        this.directLightVector = new Vector2D3D(x, y, z);

        const shadowX = (this.directLightVector.x / Math.tan(lightPitch_Rads)) * this.style.platformHeight;
        const shadowY = (this.directLightVector.y / Math.tan(lightPitch_Rads)) * this.style.platformHeight;

        // LOOPING THROUGH EACH PLATFORM
        // SETTING : shadow poligon (used to determine if platform is on screen)
        for (const platform of this.platforms) {
            // set the additional length that's added to wall shadows
            let wallShadowMultiplier;
            if (platform.wall && this.style.platformHeight > 0) {
                wallShadowMultiplier = 1 + this.style.wallHeight / this.style.platformHeight;
            } else {
                wallShadowMultiplier = 1;
            }

            platform.shadowPoints = [
                // ALL THE POSSIBLE POINTS TO INPUT IN CONVEX HULL FUNCTION

                // bot left corner
                [platform.corners[0][0], platform.corners[0][1] + this.style.platformHeight],

                // bot right corner
                [platform.corners[1][0], platform.corners[1][1] + this.style.platformHeight],

                // top right corner
                [platform.corners[2][0], platform.corners[2][1] + this.style.platformHeight],

                // top left corner
                [platform.corners[3][0], platform.corners[3][1] + this.style.platformHeight],

                // bot left SHADOW
                [
                    platform.corners[0][0] + shadowX * wallShadowMultiplier,
                    platform.corners[0][1] + this.style.platformHeight + shadowY * wallShadowMultiplier,
                ],

                // bot right SHADOW
                [
                    platform.corners[1][0] + shadowX * wallShadowMultiplier,
                    platform.corners[1][1] + this.style.platformHeight + shadowY * wallShadowMultiplier,
                ],

                // top right SHADOW
                [
                    platform.corners[2][0] + shadowX * wallShadowMultiplier,
                    platform.corners[2][1] + this.style.platformHeight + shadowY * wallShadowMultiplier,
                ],

                // top left SHADOW
                [
                    platform.corners[3][0] + shadowX * wallShadowMultiplier,
                    platform.corners[3][1] + this.style.platformHeight + shadowY * wallShadowMultiplier,
                ],
            ]; // end of shadowPoints array

            platform.shadowPoints = CanvasArea.convexHull(platform.shadowPoints);
        } // end of looping thrugh each platform

        // SETTING BOUNDING POINTS
        // bounding points are used for determining if platform is in view

        for (const platform of this.platforms) {
            // Set the bounding points for each platform for determining if they're in view
            let minX = Infinity;
            let maxX = -Infinity;
            let minY = Infinity;
            let maxY = -Infinity;

            for (const point of platform.shadowPoints) {
                // shadowPoints are local to platform
                if (point[0] < minX) {
                    minX = point[0];
                }
                if (point[1] < minY) {
                    minY = point[1];
                }
                if (point[0] > maxX) {
                    maxX = point[0];
                }
                if (point[1] > maxY) {
                    maxY = point[1];
                }
            }

            platform.minX = platform.x + minX; // shadowpoints will always coorespond with max and min X
            platform.maxX = platform.x + maxX;
            platform.minY = Math.min(platform.y - platform.hypotenuse - (platform.wall ? this.style.wallHeight : 0), platform.y + minY);
            platform.maxY = Math.max(platform.y + platform.hypotenuse + this.style.platformHeight, platform.y + maxY);
        }
    },

    update: function () {
        // Figure out which platforms are in view. Updates wallsToCheck and endZonesToCheck

        this.renderedPlatforms = [];
        this.wallsToCheck = [];
        this.endZonesToCheck = [];

        for (const platform of this.platforms) {
            // Loop through ALL platforms to get renderedPlatforms
            let zoomOffsetX = (screenWidth / Player.speedCameraOffset.zoom - screenWidth) / 2;
            let zoomOffsetY = (screenHeight / Player.speedCameraOffset.zoom - screenHeight) / 2;

            if (
                platform.minX < Player.x + midX + zoomOffsetX - Player.speedCameraOffset.direction.x && // coming into frame on right side
                platform.maxX > Player.x - midX - zoomOffsetX - Player.speedCameraOffset.direction.x && // coming into frame on left side
                platform.maxY > Player.y - midY - zoomOffsetY - Player.speedCameraOffset.direction.y && // top side
                platform.minY < Player.y + midY + zoomOffsetY - Player.speedCameraOffset.direction.y // bottom side
            ) {
                this.renderedPlatforms.push(platform); // ADD platform to renderedPlatforms
            }
        } // end of looping through ALL platforms

        for (const platform of this.renderedPlatforms) {
            // Loop through renderedPlatforms. Update wallsToCheck, endZonesToCheck
            if (platform.wall) {
                if (
                    // if wall is close enough to Player that it needs to be checked with Player rotation
                    platform.x + platform.hypotenuse > Player.x - 25 && // colliding with Player from left
                    platform.x - platform.hypotenuse < Player.x + 25 && // right side
                    platform.y + platform.hypotenuse > Player.y - 73 && // top side
                    platform.y - platform.hypotenuse - this.style.wallHeight < Player.y + 25 // bottom side
                ) {
                    // test for Player overlap and rendering z-order
                    this.wallsToCheck.push(platform); // for checking if Player is colliding with walls in Player.update()

                    // GET PLAYERS LEFTMOST AND RIGHT MOST CORNERS
                    function sortCornersX(a, b) {
                        // if return is negative ... a comes first
                        // if return is positive ... b comes first
                        // return is 0... nothing is changed
                        if (a.x < b.x) {
                            return -1;
                        }
                        if (a.x > b.x) {
                            return 1;
                        }
                        return 0;
                    }

                    // toSorted() isnt supported by old safari
                    let playerCornersSorted = [...Player.playerPoligon];
                    playerCornersSorted.sort(sortCornersX);
                }
            }

            if (platform.endzone) {
                this.endZonesToCheck.push(platform);
            }
        } // end of looping through each rendered platform
    },
};
