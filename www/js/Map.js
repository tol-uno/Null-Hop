const Map = {
    walls: [],
    renderedPlatforms: [],
    wallsToCheck: [],
    endZonesToCheck: [],
    name: null,
    upperShadowClip: null, // set up in initMap > parseMapData
    endZoneShadowClip: null, // set up in initMap > parseMapData
    playerClip: null, // calculated every frame

    initMap: async function (name, isCustom = false) {
        this.platforms = [];
        this.playerStart = null;
        this.style = null;
        this.checkpoints = [];
        this.upperShadowClip = new Path2D();
        this.endZoneShadowClip = new Path2D();
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

        CanvasArea.canvas.style.backgroundColor = this.style.shaded_backgroundColor;
        CanvasArea.canvas.classList.remove("hidden");

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

        UserInterface.gamestate = 6; // switch to in level
    },

    parseMapData: function (jsonData) {
        // Sets up lighting, shadows, shadow clips, etc

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
        this.setMapLighting(this);

        // SETTING BOUNDING POINTS AND CLIPS
        // bounding points are used for determining if platform is in view
        // clips for area behind each wall AND for drawing the player shadow ontop of platforms or endzones
        for (const platform of this.platforms) {
            // Set the bounding points for each platform for determining if they're in view
            let minX = (minY = Infinity);
            let maxX = (maxY = -Infinity);

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

            // GENERATE platform.hull
            // getting all corners needed for hull. need to consider walls that need upper corners

            const upperCorners = platform.wall
                ? [
                      // return empty array if not wall
                      [platform.corners[0][0], platform.corners[0][1] - Map.style.wallHeight],
                      [platform.corners[1][0], platform.corners[1][1] - Map.style.wallHeight],
                      [platform.corners[2][0], platform.corners[2][1] - Map.style.wallHeight],
                      [platform.corners[3][0], platform.corners[3][1] - Map.style.wallHeight],
                  ]
                : [];

            // midCorners == platforms.corners

            const lowerCorners = [
                [platform.corners[0][0], platform.corners[0][1] + Map.style.platformHeight],
                [platform.corners[1][0], platform.corners[1][1] + Map.style.platformHeight],
                [platform.corners[2][0], platform.corners[2][1] + Map.style.platformHeight],
                [platform.corners[3][0], platform.corners[3][1] + Map.style.platformHeight],
            ];

            const allHullPoints = platform.corners.concat(upperCorners).concat(lowerCorners);

            platform.hull = CanvasArea.convexHull(allHullPoints);

            // add a .clipPoints property to each wall for occluding Player and drawing players xray
            if (platform.wall) {
                // corners + wall height points need to be "concated" as serperate variable otherwise they dont stay as points
                const upperCorners = [
                    [platform.corners[0][0], platform.corners[0][1] - this.style.wallHeight],
                    [platform.corners[1][0], platform.corners[1][1] - this.style.wallHeight],
                    [platform.corners[2][0], platform.corners[2][1] - this.style.wallHeight],
                    [platform.corners[3][0], platform.corners[3][1] - this.style.wallHeight],
                ];

                let behindWallClipPoints = platform.corners.concat(upperCorners);

                platform.clipPoints = CanvasArea.convexHull(behindWallClipPoints);

                // USED FOR TESTING WETHER A WALL IS INFRONT OF PLAYER
                platform.getSplitLineY = function (x) {
                    // y = mx + b
                    // m = rise over run
                    const slope = (platform.rightMostCornerY - platform.leftMostCornerY) / (platform.rightMostCornerX - platform.leftMostCornerX);
                    // b = y - mx
                    const b = platform.rightMostCornerY - slope * platform.rightMostCornerX;
                    const y = slope * x + b;
                    return y;
                };
            } else {
                // platform isnt wall

                // ADDS EACH AND EVERY PLATFORM INTO COORESPONDING SHADOW CLIP (endZone or platform) To draw correct player shadow color
                const clipToUse = platform.endzone ? this.endZoneShadowClip : this.upperShadowClip;

                clipToUse.moveTo(
                    // bot left
                    platform.x + platform.corners[0][0], // x
                    platform.y + platform.corners[0][1], // y
                );

                clipToUse.lineTo(
                    // bot right
                    platform.x + platform.corners[1][0],
                    platform.y + platform.corners[1][1],
                );

                clipToUse.lineTo(
                    // top right
                    platform.x + platform.corners[2][0],
                    platform.y + platform.corners[2][1],
                );

                clipToUse.lineTo(
                    // top left
                    platform.x + platform.corners[3][0],
                    platform.y + platform.corners[3][1],
                );

                clipToUse.closePath();
            }
        } // end of looping through platforms to set clips
    },

    update: function () {
        // Figure out which platforms are in view. Updates playerClip, wallsToCheck, and endZonesToCheck

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

        // FIX but not sure how
        this.playerClip = new Path2D(); // resets the clip every frame

        for (const platform of this.renderedPlatforms) {
            // Loop through renderedPlatforms. Update wallsToCheck, playerClip, endZonesToCheck
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

                    // NEW TEST FOR WHETHER OR NOT TO ADD WALL PLATFORM TO CLIP
                    if (
                        (Player.x <= platform.x && playerCornersSorted[3].y < platform.getSplitLineY(playerCornersSorted[3].x)) ||
                        (Player.x > platform.x && playerCornersSorted[0].y < platform.getSplitLineY(playerCornersSorted[0].x))
                    ) {
                        addToPlayerClip();
                    }

                    // ADD TO CLIP SHAPE FOR AREAS BEHIND WALLS
                    function addToPlayerClip() {
                        // the clipPoints array can have different lengths so it must dynamicly go through the array of points

                        let clipPolygon = new Path2D();

                        for (let i = 0; i < platform.clipPoints.length; i++) {
                            if (i == 0) {
                                // first point in array so use moveTo

                                // -Player.x + midX, -Player.y + midY

                                clipPolygon.moveTo(
                                    platform.x + platform.clipPoints[i][0], // x
                                    platform.y + platform.clipPoints[i][1], // y
                                );
                            } else {
                                // its not the first point in the hull so use lineTo
                                clipPolygon.lineTo(
                                    platform.x + platform.clipPoints[i][0], // x
                                    platform.y + platform.clipPoints[i][1], // y
                                );
                            }
                        }
                        clipPolygon.closePath();
                        Map.playerClip.addPath(clipPolygon);
                    }
                }
            }

            if (platform.endzone) {
                this.endZonesToCheck.push(platform);
            }
        } // end of looping through each rendered platform
    },

    setMapLighting: function (mapData) {
        // Calculates all lighting and shadows

        // Turning lightDirection and lightPitch into a 3D vector
        const lightDirection_Rads = mapData.style.lightDirection * (Math.PI / 180);
        const lightPitch_Rads = mapData.style.lightPitch * (Math.PI / 180); // light pitch = light angle. 0 == flat at the horizon. 90 == directly above

        const x = Math.cos(lightDirection_Rads) * Math.cos(lightPitch_Rads);
        const y = Math.sin(lightDirection_Rads) * Math.cos(lightPitch_Rads);
        const z = Math.sin(lightPitch_Rads);

        mapData.directLightVector = new Vector2D3D(x, y, z);

        const shadowX = (mapData.directLightVector.x / Math.tan(lightPitch_Rads)) * mapData.style.platformHeight;
        const shadowY = (mapData.directLightVector.y / Math.tan(lightPitch_Rads)) * mapData.style.platformHeight;

        let litPercentTop; // init here so that background and others can use

        // LOOPING THROUGH EACH PLATFORM
        // SETTING : Shaded colors and shadow poligon
        for (const platform of mapData.platforms) {
            let colorToUse1 = mapData.style.platformTopColor;
            let colorToUse2 = mapData.style.platformSideColor;

            if (platform.endzone) {
                colorToUse1 = mapData.style.endZoneTopColor;
                colorToUse2 = mapData.style.endZoneSideColor;
            }
            if (platform.wall) {
                colorToUse1 = mapData.style.wallTopColor;
                colorToUse2 = mapData.style.wallSideColor;
            }

            // CALCULATING PLATFORM COLORS

            // get surface normals
            topNormal = new Vector2D3D(0, 0, -1);
            side1Normal = new Vector2D3D(-1, 0, 0).rotate(platform.angle);
            side2Normal = new Vector2D3D(0, 1, 0).rotate(platform.angle);
            side3Normal = new Vector2D3D(1, 0, 0).rotate(platform.angle);

            // angleDifference result will be between 0 and PI radians
            // if angleDifference is > PI/2 (90 deg) then side is in light. Otherwise no direct light is hitting it
            // if angleDifference is < PI/2 (90 deg) then side is in shadow & litPercent = 0

            litPercentTop = Math.cos(Math.PI - topNormal.angleDifference(mapData.directLightVector)); // known as geometry term
            if (litPercentTop < 0) {
                litPercentTop = 0;
            } // clamp to 0 to 1

            let litPercent1 = Math.cos(Math.PI - side1Normal.angleDifference(mapData.directLightVector)); // known as geometry term
            if (litPercent1 < 0) {
                litPercent1 = 0;
            } // clamp to 0 to 1

            let litPercent2 = Math.cos(Math.PI - side2Normal.angleDifference(mapData.directLightVector)); // known as geometry term
            if (litPercent2 < 0) {
                litPercent2 = 0;
            } // clamp to 0 to 1

            let litPercent3 = Math.cos(Math.PI - side3Normal.angleDifference(mapData.directLightVector)); // known as geometry term
            if (litPercent3 < 0) {
                litPercent3 = 0;
            } // clamp to 0 to 1

            platform.shaded_topColor = CanvasArea.getShadedColor(colorToUse1, litPercentTop, mapData.style);
            platform.shaded_sideColor1 = CanvasArea.getShadedColor(colorToUse2, litPercent1, mapData.style);
            platform.shaded_sideColor2 = CanvasArea.getShadedColor(colorToUse2, litPercent2, mapData.style);
            platform.shaded_sideColor3 = CanvasArea.getShadedColor(colorToUse2, litPercent3, mapData.style);

            // SHADOW POLYGON

            // set the additional length that's added to wall shadows
            let wallShadowMultiplier;
            if (platform.wall && mapData.style.platformHeight > 0) {
                wallShadowMultiplier = 1 + mapData.style.wallHeight / mapData.style.platformHeight;
            } else {
                wallShadowMultiplier = 1;
            }

            platform.shadowPoints = [
                // ALL THE POSSIBLE POINTS TO INPUT IN CONVEX HULL FUNCTION

                // bot left corner
                [platform.corners[0][0], platform.corners[0][1] + mapData.style.platformHeight],

                // bot right corner
                [platform.corners[1][0], platform.corners[1][1] + mapData.style.platformHeight],

                // top right corner
                [platform.corners[2][0], platform.corners[2][1] + mapData.style.platformHeight],

                // top left corner
                [platform.corners[3][0], platform.corners[3][1] + mapData.style.platformHeight],

                // bot left SHADOW
                [
                    platform.corners[0][0] + shadowX * wallShadowMultiplier,
                    platform.corners[0][1] + mapData.style.platformHeight + shadowY * wallShadowMultiplier,
                ],

                // bot right SHADOW
                [
                    platform.corners[1][0] + shadowX * wallShadowMultiplier,
                    platform.corners[1][1] + mapData.style.platformHeight + shadowY * wallShadowMultiplier,
                ],

                // top right SHADOW
                [
                    platform.corners[2][0] + shadowX * wallShadowMultiplier,
                    platform.corners[2][1] + mapData.style.platformHeight + shadowY * wallShadowMultiplier,
                ],

                // top left SHADOW
                [
                    platform.corners[3][0] + shadowX * wallShadowMultiplier,
                    platform.corners[3][1] + mapData.style.platformHeight + shadowY * wallShadowMultiplier,
                ],
            ]; // end of shadowPoints array

            platform.shadowPoints = CanvasArea.convexHull(platform.shadowPoints);
        } // end of looping thrugh each platform

        // calculate all other map colors
        // THESE ALL NEED TO USE 3D Normal Vectors for calculations
        mapData.style.shaded_backgroundColor = CanvasArea.getShadedColor(mapData.style.backgroundColor, litPercentTop, mapData.style);

        mapData.style.shadow_platformColor = CanvasArea.getShadedColor(
            mapData.style.platformTopColor,
            Math.max(0, litPercentTop - 0.7),
            mapData.style,
        ); // shadow brightness can be between 0 and 0.3
        mapData.style.shadow_endzoneColor = CanvasArea.getShadedColor(mapData.style.endZoneTopColor, Math.max(0, litPercentTop - 0.7), mapData.style);
        mapData.style.shadow_backgroundColor = CanvasArea.getShadedColor(
            mapData.style.backgroundColor,
            Math.max(0, litPercentTop - 0.7),
            mapData.style,
        );
    },

    renderPlatform: function (ctx, mapData, platform) {
        const adjustedHeight = platform.wall ? mapData.style.wallHeight : 0; // for adding height to walls

        // DRAW BACKGROUND HULL
        ctx.fillStyle = platform.shaded_topColor;

        ctx.beginPath();
        ctx.moveTo(platform.x + platform.hull[0][0], platform.y + platform.hull[0][1]);
        for (let i = platform.hull.length - 1; i > 0; i--) {
            ctx.lineTo(platform.x + platform.hull[i][0], platform.y + platform.hull[i][1]);
        }
        ctx.closePath();
        ctx.fill();

        // SIDES OF PLATFORMS
        // THESE SHOULD BE SAVED BY MAPEDITOR IN GLOBAL COORDS ALREADY
        // platform angles should only be max of 45 and -45 in mapData
        // corners array order: BL BR TR TL

        // ALWAYS RENDER BOTTOM SIDE. side2
        ctx.fillStyle = platform.shaded_sideColor2;
        ctx.beginPath();
        ctx.moveTo(platform.x + platform.corners[1][0], platform.y + platform.corners[1][1] - adjustedHeight); // BR
        ctx.lineTo(platform.x + platform.corners[0][0], platform.y + platform.corners[0][1] - adjustedHeight); // BL
        ctx.lineTo(platform.x + platform.corners[0][0], platform.y + platform.corners[0][1] + mapData.style.platformHeight); // BL + height
        ctx.lineTo(platform.x + platform.corners[1][0], platform.y + platform.corners[1][1] + mapData.style.platformHeight); // BR + height
        ctx.closePath();
        ctx.fill();

        if (platform.angle < 0) {
            // side1 left side
            ctx.fillStyle = platform.shaded_sideColor1;
            ctx.beginPath();
            ctx.moveTo(platform.x + platform.corners[0][0], platform.y + platform.corners[0][1] - adjustedHeight); // BL
            ctx.lineTo(platform.x + platform.corners[3][0], platform.y + platform.corners[3][1] - adjustedHeight); // TL
            ctx.lineTo(platform.x + platform.corners[3][0], platform.y + platform.corners[3][1] + mapData.style.platformHeight); // TL + height
            ctx.lineTo(platform.x + platform.corners[0][0], platform.y + platform.corners[0][1] + mapData.style.platformHeight); // BL + height
            ctx.closePath();
            ctx.fill();
        } else if (platform.angle > 0) {
            // side3 right side
            ctx.fillStyle = platform.shaded_sideColor3;
            ctx.beginPath();
            ctx.moveTo(platform.x + platform.corners[1][0], platform.y + platform.corners[1][1] - adjustedHeight); // BR
            ctx.lineTo(platform.x + platform.corners[2][0], platform.y + platform.corners[2][1] - adjustedHeight); // TR
            ctx.lineTo(platform.x + platform.corners[2][0], platform.y + platform.corners[2][1] + mapData.style.platformHeight); // TR + height
            ctx.lineTo(platform.x + platform.corners[1][0], platform.y + platform.corners[1][1] + mapData.style.platformHeight); // BR + height
            ctx.closePath();
            ctx.fill();
        }

        // PLATFORM RENDERING DEBUG TEXT
        /*
        if (UserInterface.settings.debugText == 1) {
            ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1 : UserInterface.lightColor_1;
            ctx.font = "12px 'Alte DIN'"
            ctx.fillText("angle: " + platform.angle, 0, 20);
            ctx.fillText("position: " + platform.x + ", " + platform.y, 0 , 40)
            ctx.fillText("size: " + platform.width + ", " + platform.height, 0 , 60)
            
            // Drawing split line
            ctx.strokeStyle = "#00FF00"
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(platform.leftMostCornerX, platform.leftMostCornerY)
            ctx.lineTo(platform.rightMostCornerX, platform.rightMostCornerY)
            ctx.stroke()
        }
        */
    },

    render: function () {
        // Renders Player lower shadow, platforms shadows, platforms, and checkpoints

        const ctx = CanvasArea.ctx;

        const camera = Player.speedCameraOffset;

        const cameraTargetX = Player.x - camera.direction.x;
        const cameraTargetY = Player.y - camera.direction.y;

        const translateX = midX - cameraTargetX * camera.zoom;
        const translateY = midY - cameraTargetY * camera.zoom;

        ctx.setTransform(camera.zoom, 0, 0, camera.zoom, translateX, translateY);

        // Set color for all shadows
        ctx.fillStyle = this.style.shadow_backgroundColor;

        ctx.beginPath();

        // DRAW PLAYER LOWER SHADOW (gets filled alongside platform shadows)
        // Player.shadowPoints is updated in Player.update() not Player.render so that it is ready for this opperation
        Player.drawPlayerShadow(ctx, this.style.platformHeight);

        // DRAW ALL PLATFORM SHADOWS IN renderedPlatforms
        for (const platform of this.renderedPlatforms) {
            ctx.moveTo(platform.x + platform.shadowPoints[0][0], platform.y + platform.shadowPoints[0][1]);
            for (let i = platform.shadowPoints.length - 1; i > 0; i--) {
                ctx.lineTo(platform.x + platform.shadowPoints[i][0], platform.y + platform.shadowPoints[i][1]);
            }
            ctx.closePath();
        }
        ctx.fill(); // Fill all lower shadows (players and platforms)

        // DRAW ALL PLATFORMS IN renderedPlatforms
        for (const platform of this.renderedPlatforms) {
            Map.renderPlatform(ctx, Map, platform);
        }

        // Draw checkpoints if Debugging
        if (UserInterface.settings.debugText == 1) {
            for (const checkpoint of this.checkpoints) {
                ctx.strokeStyle = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(checkpoint.triggerX1, checkpoint.triggerY1);
                ctx.lineTo(checkpoint.triggerX2, checkpoint.triggerY2);
                ctx.stroke();
            }
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0); // resets ctx to identity matrix
    },
};
