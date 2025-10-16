const Player = {
    wish_velocity: new Vector2D3D(0, 0),
    velocity: new Vector2D3D(0, 0),
    currentSpeedProjected: 0,
    addSpeed: 0, // initialized here so that userInterface can access for debug

    speedCameraOffset: {
        zoom: 1, // from 1 (default) to 0.5 (zoomed out)
        direction: new Vector2D3D(0, 0),
        zoomAverager: new Averager(90),
        dirAveragerX: new Averager(180),
        dirAveragerY: new Averager(180),
    },

    topColor: null,
    botSideColor: null,
    rightSideColor: null,
    topSideColor: null,
    leftSideColor: null,

    loopedAngle: null,
    angleRad: null,

    playerPoligon: null, // similar to shadow corners but used for collision checks with platforms and walls (32x32)

    shadowCorners: null, // need to expose here so that this.drawPlayerShadow() can use. (30x30)
    // set in Player.update because Map needs it before Player in the rendering pipeline.

    debugTurn: 2, // intialized here so it can be accesed in console

    initPlayer: function (x, y, angle) {
        this.x = x;
        this.y = y;
        this.restartX = x;
        this.restartY = y;
        this.restartAngle = angle;
        this.lookAngle = new Vector2D3D(1, 0).rotate(angle);
        this.loopedAngle = angle;
        this.angleRad = (angle * Math.PI) / 180;

        // set here so that PreviewWindow can render player without calling Player.update()
        this.playerPoligon = CanvasArea.createPoligon(this.x, this.y, 32, 32, this.angleRad);
        this.shadowCorners = CanvasArea.createPoligon(this.x, this.y, 30, 30, this.angleRad); // 30x30 instead of 32x32

        this.topNormal = new Vector2D3D(0, 0, -1);
        this.botSideNormal = new Vector2D3D(0, 1, 0).rotate(angle);
        this.rightSideNormal = new Vector2D3D(1, 0, 0).rotate(angle);
        this.topSideNormal = new Vector2D3D(0, -1, 0).rotate(angle);
        this.leftSideNormal = new Vector2D3D(-1, 0, 0).rotate(angle);

        this.topColor = null; // top shaded color wont be calculated if topColor already exists so need to reset

        this.speedCameraOffset.zoom = 1.5;
        this.speedCameraOffset.zoomAverager.frames.fill(1.5, 0);
        this.speedCameraOffset.dirAveragerX.frames.fill(0, 0);
        this.speedCameraOffset.dirAveragerY.frames.fill(0, 0);

        this.velocity.set(0, 0);

        this.jumpValue = 0;
        this.jumpVelocity = 200;
        this.endSlow = 1;
        this.checkpointIndex = -1;

        // set up this.mapData -- where to pull platforms and styles from
        this.mapData = UserInterface.gamestate == 7 ? PreviewWindow : Map;
    },

    update: function () {
        //TouchHandler.dragAmountX = dt // debugTurn

        const updatePlayerRotationFromTouch = () => {
            // arrow function so that "this" can be used to refer to Player

            this.lookAngle.rotate(TouchHandler.dragAmountX * UserInterface.settings.sensitivity);
            this.loopedAngle = this.lookAngle.getAngleInDegrees();
            this.angleRad = (this.loopedAngle * Math.PI) / 180;

            // Setting wish_velocity
            // normalized unit vector that is perpendicular to lookAngle
            // simulates left or right strafe keys being pressed depending on dragAmount direction

            if (TouchHandler.dragAmountX > 0) {
                this.wish_velocity.set(this.lookAngle.x, this.lookAngle.y).rotate(90); // look angle is already normalized
            }

            if (TouchHandler.dragAmountX < 0) {
                this.wish_velocity.set(this.lookAngle.x, this.lookAngle.y).rotate(-90); // look angle is already normalized
            }

            if (TouchHandler.dragAmountX == 0) {
                this.wish_velocity.set(0, 0);
            }
        };

        const updatePlayerPoligon = () => {
            // arrow function so that "this" can be used to refer to Player
            // needs to be called at different times depending on levelState
            this.playerPoligon = CanvasArea.createPoligon(this.x, this.y, 32, 32, this.angleRad);
        };

        const updatePlayerVelocity = () => {
            /*
            ALL MOVEMENT CALCULATIONS BASED OFF QUAKE 1 CODE
            BUILT MOSTLY FROM zweek's video on how airstrafing works
            https://www.youtube.com/watch?v=gRqoXy-0d84

            Other references for quake / source movement info
            https://adrianb.io/2015/02/14/bunnyhop.html
            https://www.youtube.com/watch?v=v3zT3Z5apaM
            https://www.youtube.com/watch?v=rTsXO6Zicls
            https://www.youtube.com/watch?v=rTsXO6Zicls
            https://steamcommunity.com/sharedfiles/filedetails/?id=184184420
            https://github.com/myria666/qMovementDoc/blob/main/Quake_s_Player_Movement.pdf

            SUEDO QUAKE 1 CODE    
            function SV_AirAccelerate(wish_velocity) {
                let wish_speed
                let current_speed
                let add_speed
                let accel_speed

                wish_speed = wish_velocity.length
                wish_velocity.normalize()

                if (wish_speed > 30) { wish_speed = 30 }

                current_speed = dotProduct(velocity, wish_velocity)
                // curent_speed is actually a measurement of how closely 
                // the wish_velocity vector aligns with the actual velocity vector
                // ranges from 1 * velocity.length (when both are aligned)
                // to -1 * velocity.length when they are pointing opposite each other.
                // it is 0 * velocity.length when wish_velocity is 90 degrees perpendicular to velocity vector

                add_speed = wish_speed - current_speed
                // how much speed needs to be added to the player. 
                if (add_speed <= 0) { return }
                // if its zero then skip the rest of the function

                accel_speed = grounded_wish_speed * sv_accelerate * host_frametime
                // grounded_wish_speed = 320 (running speed cap)
                // sv_accelerate = 10
                // host_frametime = deltaTime (time between frames expressed in SECONDS ?)
                // clips our per frame acceleration
                // defines how long it should take based off of sv_accelerate and frametime to reach grounded_wish_speed from zero speed
                // this is a per frame acceleration limit
                // this is what makes this whole thing framerate dependent ... :(
                // additional notes in actual code

                if (accel_speed > add_speed) { accel_speed = add_speed }
                // accel_speed cant be bigger than add_speed

                for (i = 0; i < 3; i++) { velocity[i] += accel_speed * wish_velocity[i] }
                // scales wish_velocity unit vector up to the length of accel_speed and adding it to velocity
            }
            */

            // currentSpeedProjected is a measurment of how closely the wish_velocity aligns with the actual velocity vector
            this.currentSpeedProjected = this.velocity.dotProduct(this.wish_velocity); // Vector projection of Current_velocity onto wish_velocity

            // maxVelocity replaces the action of clipping wish_speed to 32 --- maxVelocity == 32 set in index.js
            this.addSpeed = maxVelocity - this.currentSpeedProjected;

            // show overstrafe warning BROKEN FIX
            if (this.addSpeed > 320 * airAcceleration * dt) {
                // 11:04 in zweeks video shows why u lose speed
                if (UserInterface.showOverstrafeWarning == false) {
                    UserInterface.showOverstrafeWarning = true;
                    setTimeout(() => {
                        UserInterface.showOverstrafeWarning = false;
                    }, 1500); // wait 1.5 seconds to hide warning
                }
            }

            // new simplified stuff that replaces commented code block below \/
            this.addSpeed = Math.max(0, this.addSpeed);
            this.addSpeed = Math.min(this.addSpeed, 320 * airAcceleration * dt);

            this.velocity.x += this.addSpeed * this.wish_velocity.x;
            this.velocity.y += this.addSpeed * this.wish_velocity.y;

            // THIS IS A MORE VERBOSE VERSION OF THE THIS SECTION THAT FOLLOWS THE QUAKE CODE CLOSER BUT IS NOT AS CLEAR AS ABOVE
            /*
            if (this.addSpeed > 0) { // only run the rest of this movement code if speed should be added

                // show overstrafe warning
                if (this.addSpeed > 60) { // 11:04 in zweeks video shows why u lose speed
                    if (UserInterface.showOverstrafeWarning == false) {
                        UserInterface.showOverstrafeWarning = true;
                        setTimeout(() => { UserInterface.showOverstrafeWarning = false }, 1500); // wait 1.5 seconds to hide warning
                    }
                }

                let accel_speed = 320 * airAcceleration * dt
                // Quake: accel_speed = grounded_wish_speed * sv_accelerate * host_frametime
                // accel_speed is the upper limit that add_speed is clipped to 
                // except that if add_speed doesnt reach that upper threshold then accel_speed is
                // brought down to match add_speed and used in its place

                // accel_speed at 60fps = 320 * 10 * 0.016 = 53.33
                // accel_speed at 30fps = 320 * 10 * 0.033 = 106.66

                if (accel_speed > this.addSpeed) {
                    accel_speed = this.addSpeed;
                }

                
                this.velocity.x += (accel_speed * this.wish_velocity.x)
                this.velocity.y += (accel_speed * this.wish_velocity.y)
            }
            */
        };

        const updatePlayerPosition = () => {
            // APPLYING VELOCITY
            this.x += this.velocity.x * dt;
            this.y += this.velocity.y * dt;
        };

        const teleportPlayer = () => {
            // Called when player hits the water
            if (this.checkpointIndex !== -1) {
                this.x = Map.checkpoints[this.checkpointIndex].x;
                this.y = Map.checkpoints[this.checkpointIndex].y;
                this.lookAngle.set(1, 0).rotate(Map.checkpoints[this.checkpointIndex].angle);
                this.loopedAngle = this.lookAngle.getAngleInDegrees();
                this.angleRad = (this.loopedAngle * Math.PI) / 180;
                this.velocity.set(100, 0).rotate(this.lookAngle.getAngleInDegrees());
                this.jumpValue = 0;
                this.jumpVelocity = 200;
            } else {
                btn_restart.func()
            }
            updatePlayerPoligon();
        };

        // 1 = pre-start, 2 = playing level, 3 = in endzone

        if (UserInterface.levelState == 1) {
            updatePlayerRotationFromTouch();
            updatePlayerPoligon();
        } else if (UserInterface.levelState == 2) {
            updatePlayerRotationFromTouch();
            updatePlayerVelocity(); // doesnt apply velocity to position yet

            // CHECK IF COLLIDING WITH WALLS could move to abstracted function
            function getPlayerWallCollision(player, wall) {
                // Calculate relative position of player to the center of the wall
                const relativeX = player.x - wall.x;
                const relativeY = player.y - wall.y;

                // Rotate the relative position of the player around the origin (center of the wall)
                const rotatedX = relativeX * Math.cos(-wall.angleRad) - relativeY * Math.sin(-wall.angleRad);
                const rotatedY = relativeX * Math.sin(-wall.angleRad) + relativeY * Math.cos(-wall.angleRad);

                // Calculate closest point on the rotated rectangle to the player
                let closestX = Math.max(-wall.width / 2, Math.min(rotatedX, wall.width / 2));
                let closestY = Math.max(-wall.height / 2, Math.min(rotatedY, wall.height / 2));

                // Check if the closest point is within the player's circle
                const distanceX = rotatedX - closestX;
                const distanceY = rotatedY - closestY;
                const distanceSquared = distanceX * distanceX + distanceY * distanceY;

                if (distanceSquared <= 18 * 18) {
                    // 16 is the player's collision radius (18 is used)
                    // Collision detected

                    let collisionX, collisionY;
                    let playerInsideWall = false;

                    // Check if the center of player is inside the wall
                    if (rotatedX >= -wall.width / 2 && rotatedX <= wall.width / 2 && rotatedY >= -wall.height / 2 && rotatedY <= wall.height / 2) {
                        playerInsideWall = true;

                        // If inside, find the nearest edge
                        const halfWidth = wall.width / 2;
                        const halfHeight = wall.height / 2;
                        const dxLeft = halfWidth + rotatedX; // Distance to the left edge
                        const dxRight = halfWidth - rotatedX; // Distance to the right edge
                        const dyTop = halfHeight + rotatedY; // Distance to the top edge
                        const dyBottom = halfHeight - rotatedY; // Distance to the bottom edge
                        const minDx = Math.min(dxLeft, dxRight);
                        const minDy = Math.min(dyTop, dyBottom);

                        if (minDx < minDy) {
                            // Nearest edge is left or right
                            if (dxLeft < dxRight) {
                                // Left edge
                                closestX = -wall.width / 2;
                            } else {
                                // Right edge
                                closestX = wall.width / 2;
                            }
                            collisionY = -closestX * Math.sin(-wall.angleRad) + closestY * Math.cos(-wall.angleRad) + wall.y;
                        } else {
                            // Nearest edge is top or bottom
                            if (dyTop < dyBottom) {
                                // Top edge
                                closestY = -wall.height / 2;
                            } else {
                                // Bottom edge
                                closestY = wall.height / 2;
                            }
                            collisionX = closestX * Math.cos(-wall.angleRad) + closestY * Math.sin(-wall.angleRad) + wall.x;
                        }
                    }

                    // Calculate global collision point by moving closestX/Y into global coords by rotating and translating it
                    collisionX = closestX * Math.cos(-wall.angleRad) + closestY * Math.sin(-wall.angleRad) + wall.x;
                    collisionY = -closestX * Math.sin(-wall.angleRad) + closestY * Math.cos(-wall.angleRad) + wall.y;

                    // Calculate normal vector of collision
                    const normalVector = new Vector2D3D(player.x - collisionX, player.y - collisionY);
                    if (playerInsideWall) {
                        // if inside the wall the vector needs to be flipped to point the right way
                        normalVector.x *= -1;
                        normalVector.y *= -1;
                    }
                    normalVector.normalize(1); // Normalize the vector

                    return {
                        collided: true,
                        normal: normalVector,
                        collisionPoint: {
                            x: collisionX,
                            y: collisionY,
                        },
                    };
                }

                // No collision detected
                return {
                    collided: false,
                };
            }

            function setVelocityAfterCollision(playerMovementVector, wallNormalVector) {
                // Calculate the dot product of player movement vector and wall normal vector
                const dotProduct = playerMovementVector.x * wallNormalVector.x + playerMovementVector.y * wallNormalVector.y;

                // If the dot product is negative, it means the player is moving towards the wall
                if (dotProduct < 0) {
                    // Remove the component of player movement vector that's in the direction of the wall
                    playerMovementVector.x -= dotProduct * wallNormalVector.x;
                    playerMovementVector.y -= dotProduct * wallNormalVector.y;
                }
            }

            for (const wall of Map.wallsToCheck) {
                const collisionData = getPlayerWallCollision(Player, wall);
                if (collisionData.collided) {
                    setVelocityAfterCollision(this.velocity, collisionData.normal);

                    // bounce player backwards from being inside wall
                    this.x = collisionData.collisionPoint.x + collisionData.normal.x * 20;
                    this.y = collisionData.collisionPoint.y + collisionData.normal.y * 20;
                }
            }

            updatePlayerPosition();
            updatePlayerPoligon(); // update here so that checkCollisions can use it for platforms and endzone.
            // for use in wall z-depth testing by Map and this.checkCollisions
            // updated again if player is hitting water and teleports

            // JUMPING check platform collision
            if (this.jumpValue < 0) {
                this.jumpValue = 0;

                if (!this.checkCollision(Map.renderedPlatforms.filter((platform) => platform.wall == 0))) {
                    // checkCollision on platforms in renderedPlatforms array with walls removed
                    // Hit water
                    AudioHandler.playAudio(AudioHandler.splashBuffer, { volume: 0.4 });
                    this.speedCameraOffset.zoomAverager.clear();
                    teleportPlayer(); // takes care of changing player angle and updating playerPoligon
                } else {
                    // Landed on platform
                    this.jumpVelocity = 200;

                    // play random jump sound
                    // AudioHandler.playSound(AudioHandler[`jump${Math.floor(Math.random() * 3) + 1}Audio`], true);
                    AudioHandler.playAudio(AudioHandler.JumpSFXBuffer, { volume: 0.8 });
                }
            } else {
                this.jumpValue += this.jumpVelocity * dt;
                this.jumpVelocity -= gravity * dt;
            }

            // CHECK if colliding with checkpoint triggers
            // Used in checkpoint loop to get minumum distance to line segment from point
            function pDistance(x, y, x1, y1, x2, y2) {
                const A = x - x1;
                const B = y - y1;
                const C = x2 - x1;
                const D = y2 - y1;

                const dot = A * C + B * D;
                const len_sq = C * C + D * D;
                let param = -1;
                if (len_sq != 0)
                    //in case of 0 length line
                    param = dot / len_sq;

                let xx, yy;

                if (param < 0) {
                    xx = x1;
                    yy = y1;
                } else if (param > 1) {
                    xx = x2;
                    yy = y2;
                } else {
                    xx = x1 + param * C;
                    yy = y1 + param * D;
                }

                const dx = x - xx;
                const dy = y - yy;
                return Math.sqrt(dx * dx + dy * dy);
            }

            for (const checkpoint of Map.checkpoints) {
                const distance = pDistance(this.x, this.y, checkpoint.triggerX1, checkpoint.triggerY1, checkpoint.triggerX2, checkpoint.triggerY2);
                // console.log("distance to " + checkpoint + ": " + distance)

                if (distance <= 16) {
                    // COLLIDING WITH CP TRIGGER
                    this.checkpointIndex = Map.checkpoints.indexOf(checkpoint); // could do this with a callback index function?
                    // console.log(this.checkpointIndex);
                }
            }

            // CHECK IF COLLIDING WITH ANY ENDZONES
            if (Map.endZonesToCheck.length > 0) {
                if (this.checkCollision(Map.endZonesToCheck)) {
                    AudioHandler.playAudio(AudioHandler.successBuffer, { volume: 0.6 });
                    UserInterface.handleRecord();
                    UserInterface.levelState = 3;
                }
            }
        } else if (UserInterface.levelState == 3) {
            // SLOW DOWN MOVEMENT AFTER HITTING END ZONE
            if (this.endSlow > 0) {
                this.endSlow -= 2 * dt;
            } else {
                this.endSlow = 0;
            }

            this.x += this.velocity.x * dt * this.endSlow; // MOVE FORWARD AT ANGLE BASED ON VELOCITY
            this.y += this.velocity.y * dt * this.endSlow;

            updatePlayerPoligon();

            if (this.jumpValue < 0) {
                // JUMPING without checking collision
                this.jumpValue = 0;
                this.jumpVelocity = 200;
            } else {
                this.jumpValue += this.jumpVelocity * dt * this.endSlow;
                this.jumpVelocity -= gravity * dt * this.endSlow;
            }
        }

        // CHANGING CAMERA ZOOM and OFFSET BASED ON SPEED
        // add current zoom level to averager
        this.speedCameraOffset.zoomAverager.pushValue(UserInterfaceCanvas.mapToRange(this.velocity.magnitude(), 100, 1100, 1.5, 0.5));

        // apply averager zoom to actual zoom
        this.speedCameraOffset.zoom = this.speedCameraOffset.zoomAverager.getAverage();

        // add current offset direction to averager
        this.speedCameraOffset.dirAveragerX.pushValue(-this.velocity.x / 5);
        this.speedCameraOffset.dirAveragerY.pushValue(-this.velocity.y / 5);

        // apply averager offset direction to actual offset direction
        this.speedCameraOffset.direction.x = this.speedCameraOffset.dirAveragerX.getAverage();
        this.speedCameraOffset.direction.y = this.speedCameraOffset.dirAveragerY.getAverage();

        // Update shadowCorners here for use by Map to render Player lower shadow
        this.shadowCorners = CanvasArea.createPoligon(this.x, this.y, 30, 30, this.angleRad); // 30x30 instead of 32x32
    },

    startLevel: function () {
        this.velocity.set(150, 0).rotate(this.lookAngle.getAngleInDegrees());
    },

    checkCollision: function (arrayOfPlatformsToCheck) {
        for (const platform of arrayOfPlatformsToCheck) {
            // once parsemap gives these corners in global coordinates this will no longer be needed
            const platformPoligon = platform.corners.map(([x, y]) => ({
                x: platform.x + x,
                y: platform.y + y,
            }));

            if (CanvasArea.doPolygonsIntersect(this.playerPoligon, platformPoligon)) {
                return true; // breaks out of loop once at least one collision is detected
            }
        }

        return false;
    },

    restart: function () {
        // Called when user hits restart button or when player fails without a checkpoint
        this.x = this.restartX;
        this.y = this.restartY;
        this.lookAngle.set(1, 0).rotate(this.restartAngle);
        this.loopedAngle = this.lookAngle.getAngleInDegrees();
        this.angleRad = (this.loopedAngle * Math.PI) / 180;
        this.velocity.set(0, 0);
        this.jumpValue = 0;
        this.jumpVelocity = 200;

        this.endSlow = 1;
        this.speedCameraOffset.zoomAverager.frames.fill(1.5, 0);
        this.speedCameraOffset.zoom = 1.5;
        this.speedCameraOffset.dirAveragerX.frames.fill(0, 0);
        this.speedCameraOffset.dirAveragerY.frames.fill(0, 0);
    },

    setPlayerLighting: function () {
        // Update Normals
        this.botSideNormal.set(0, 1, 0).rotate(this.loopedAngle);
        this.rightSideNormal.set(1, 0, 0).rotate(this.loopedAngle);
        this.topSideNormal.set(0, -1, 0).rotate(this.loopedAngle);
        this.leftSideNormal.set(-1, 0, 0).rotate(this.loopedAngle);

        // angleDifference result will be between 0 and PI radians
        // if angleDifference is > PI/2 (90 deg) then side is at least partially in direct light.
        // if angleDifference is < PI/2 (90 deg) then side is in shadow & litPercent = 0. No direct light hitting it.

        let litPercentTop = Math.cos(Math.PI - this.topNormal.angleDifference(this.mapData.directLightVector)); // known as geometry term
        if (litPercentTop < 0) {
            litPercentTop = 0;
        } // clamp from 0 -> 1

        let litPercentBotSide = Math.cos(Math.PI - this.botSideNormal.angleDifference(this.mapData.directLightVector));
        if (litPercentBotSide < 0) {
            litPercentBotSide = 0;
        }

        let litPercentRightSide = Math.cos(Math.PI - this.rightSideNormal.angleDifference(this.mapData.directLightVector));
        if (litPercentRightSide < 0) {
            litPercentRightSide = 0;
        }

        let litPercentTopSide = Math.cos(Math.PI - this.topSideNormal.angleDifference(this.mapData.directLightVector));
        if (litPercentTopSide < 0) {
            litPercentTopSide = 0;
        }

        let litPercentLeftSide = Math.cos(Math.PI - this.leftSideNormal.angleDifference(this.mapData.directLightVector));
        if (litPercentLeftSide < 0) {
            litPercentLeftSide = 0;
        }

        if (!this.topColor) {
            // Only calculate once
            this.topColor = CanvasArea.getShadedColor(this.mapData.style.playerColor, litPercentTop);
        }
        this.botSideColor = CanvasArea.getShadedColor(this.mapData.style.playerColor, litPercentBotSide);
        this.rightSideColor = CanvasArea.getShadedColor(this.mapData.style.playerColor, litPercentRightSide);
        this.topSideColor = CanvasArea.getShadedColor(this.mapData.style.playerColor, litPercentTopSide);
        this.leftSideColor = CanvasArea.getShadedColor(this.mapData.style.playerColor, litPercentLeftSide);
    },

    drawPlayerShadow: function (ctx = PlayerCanvas.ctx, yOffset = 0) {
        // winding order is reversed so that player's lower shadow combines with platform shadows
        ctx.beginPath();
        ctx.moveTo(this.shadowCorners[3].x, this.shadowCorners[3].y + yOffset);
        ctx.lineTo(this.shadowCorners[2].x, this.shadowCorners[2].y + yOffset);
        ctx.lineTo(this.shadowCorners[1].x, this.shadowCorners[1].y + yOffset);
        ctx.lineTo(this.shadowCorners[0].x, this.shadowCorners[0].y + yOffset);
        ctx.closePath();
    },

    render: function () {
        // Player is drawn on a seperate PlayerCanvas.
        // On PlayerCanvas, parts of the player that are behind walls are erased using Map.playerClip
        // PlayerCanvas is then pasted onto the main CanvasArea

        this.setPlayerLighting();

        const ctx = PlayerCanvas.ctx;
        PlayerCanvas.clear();

        // Generate all player vertices
        // creates array of point objects: [ {x:1,y:1}, {x:2,y:2} ]
        // topLeft, topRight, bottomRight, bottomLeft -- when Player.angle == 0 (looking right)
        // shadowCorners is set in Player.update because Map needs it to render player lower shadow before Player is rendered
        const lowerCorners = this.playerPoligon.map((point) => ({ x: point.x, y: point.y - this.jumpValue }));
        const upperCorners = lowerCorners.map((point) => ({ x: point.x, y: point.y - 32 }));

        if (this.mapData == PreviewWindow) {
            // Map sets these otherwise
        } else {
            // in actual level with Map
            const camera = this.speedCameraOffset;
            const cameraTargetX = this.x - camera.direction.x;
            const cameraTargetY = this.y - camera.direction.y;

            const translateX = midX - cameraTargetX * camera.zoom;
            const translateY = midY - cameraTargetY * camera.zoom;

            ctx.setTransform(camera.zoom, 0, 0, camera.zoom, translateX, translateY);
        }

        // LOWER Player SHADOW IS DRAWN BY MAP
        // DRAWING UPPER SHADOW HERE
        // drawn twice, first using platform's shadedColor with platform clip applied
        // and second using endzone's shadedColor with endzone clip applied

        // SHADOW OVER PLATFORM
        ctx.save(); // #1 Necessary for clearing upperShadowClip

        if (this.mapData == Map) {
            // only set upper shadow clip if in Map not PreviewWindow

            // Draw standard shadowClip DEBUG
            // ctx.lineWidth = 4
            // ctx.strokeStyle = "#00ff00"
            // ctx.stroke(Map.upperShadowClip)

            ctx.clip(Map.upperShadowClip);
        }

        ctx.fillStyle = this.mapData.style.shadow_platformColor;
        this.drawPlayerShadow();
        ctx.fill();

        ctx.restore(); // #1 Necessary for clearing upperShadowClip

        // SHADOW OVER ENDZONE
        if (this.mapData == Map && Map.endZonesToCheck.length > 0) {
            // only applicable in Map not PreviewWindow
            ctx.save(); // #2 Necessary for clearing endZoneShadowClip

            // Draw endZoneShadowClip DEBUG
            // ctx.lineWidth = 3
            // ctx.strokeStyle = "#0000ff"
            // ctx.stroke(Map.endZoneShadowClip)

            ctx.clip(Map.endZoneShadowClip);

            ctx.fillStyle = Map.style.shadow_endzoneColor;
            this.drawPlayerShadow();
            ctx.fill();

            ctx.restore(); // #2 Necessary for clearing endZoneShadowClip
        }

        const allHullPoints = lowerCorners.concat(upperCorners);
        this.hull = CanvasArea.convexHull(allHullPoints);

        // DRAW BACKGROUND HULL
        ctx.fillStyle = this.topColor;

        ctx.beginPath();
        ctx.moveTo(this.hull[0].x, this.hull[0].y);
        for (let i = this.hull.length - 1; i > 0; i--) {
            ctx.lineTo(this.hull[i].x, this.hull[i].y);
        }
        ctx.closePath();
        ctx.fill();

        // Draw Player TOP ARROW
        ctx.strokeStyle = "#00000030";
        ctx.lineWidth = 2;

        const trianglePoints = [
            { x: 8, y: 0 },
            { x: -5, y: -7 },
            { x: -5, y: 7 },
        ];

        const cos = Math.cos(this.angleRad);
        const sin = Math.sin(this.angleRad);

        const rotatedPoints = trianglePoints.map(({ x, y }) => {
            return {
                x: x * cos - y * sin,
                y: x * sin + y * cos,
            };
        });

        ctx.beginPath();
        ctx.moveTo(this.x + rotatedPoints[0].x, this.y + rotatedPoints[0].y - this.jumpValue - 32);
        ctx.lineTo(this.x + rotatedPoints[1].x, this.y + rotatedPoints[1].y - this.jumpValue - 32);
        ctx.lineTo(this.x + rotatedPoints[2].x, this.y + rotatedPoints[2].y - this.jumpValue - 32);
        ctx.closePath();
        ctx.stroke();

        // SIDES OF PLAYER

        // at lookAngle == 0 the player is facing to the right. BOT WALL refers to the bottom wall when lookAngle == 0
        // lowerCorners & upperCorners order: topLeft, topRight, bottomRight, bottomLeft

        if (this.loopedAngle > 270 || this.loopedAngle < 90) {
            // BOT WALL
            // looking to the right + or - 90 deg
            ctx.fillStyle = this.botSideColor;

            ctx.beginPath();
            ctx.moveTo(upperCorners[2].x, upperCorners[2].y);
            ctx.lineTo(upperCorners[3].x, upperCorners[3].y);
            ctx.lineTo(lowerCorners[3].x, lowerCorners[3].y);
            ctx.lineTo(lowerCorners[2].x, lowerCorners[2].y);
            ctx.closePath();
            ctx.fill();
        }

        if (this.loopedAngle > 0 && this.loopedAngle < 180) {
            // RIGHT WALL
            // looking downwards + or - 90 deg
            ctx.fillStyle = this.rightSideColor;

            ctx.beginPath();
            ctx.moveTo(upperCorners[1].x, upperCorners[1].y);
            ctx.lineTo(upperCorners[2].x, upperCorners[2].y);
            ctx.lineTo(lowerCorners[2].x, lowerCorners[2].y);
            ctx.lineTo(lowerCorners[1].x, lowerCorners[1].y);
            ctx.closePath();
            ctx.fill();
        }

        if (this.loopedAngle > 90 && this.loopedAngle < 270) {
            // TOP WALL
            // looking to the left + or - 90 deg
            ctx.fillStyle = this.topSideColor;

            ctx.beginPath();
            ctx.moveTo(upperCorners[0].x, upperCorners[0].y);
            ctx.lineTo(upperCorners[1].x, upperCorners[1].y);
            ctx.lineTo(lowerCorners[1].x, lowerCorners[1].y);
            ctx.lineTo(lowerCorners[0].x, lowerCorners[0].y);
            ctx.closePath();
            ctx.fill();
        }

        if (this.loopedAngle > 180 && this.loopedAngle < 360) {
            // LEFT WALL
            // looking upwards + or - 90 deg
            ctx.fillStyle = this.leftSideColor;

            ctx.beginPath();
            ctx.moveTo(upperCorners[3].x, upperCorners[3].y);
            ctx.lineTo(upperCorners[0].x, upperCorners[0].y);
            ctx.lineTo(lowerCorners[0].x, lowerCorners[0].y);
            ctx.lineTo(lowerCorners[3].x, lowerCorners[3].y);
            ctx.closePath();
            ctx.fill();
        }

        // ERASE PARTS OF PLAYER THAT ARE BEHIND WALL AND DRAW PLAYER XRAY (if in Map not PreviewWindow)
        if (this.mapData == Map && Map.wallsToCheck.length != 0) {
            //  OPTIMIZE: Could use more precice check here like checking if there's data in Map.playerClip
            // if theres no data in playerClip path then this doesnt have to be run

            // Draw playerClip DEBUG on PlayerCanvas
            // ctx.lineWidth = 4;
            // ctx.strokeStyle = "#ff0000";
            // ctx.stroke(Map.playerClip);

            ctx.save(); // #3 Necessary for clearing playerClip
            // ADD CLIP of area behind walls
            ctx.clip(Map.playerClip);

            // ERASE PARTS OF PLAYER THAT ARE BEHIND WALLS
            PlayerCanvas.clear(this.x - midX, this.y - midY); // clear canvas at the players position - half screen width

            // DRAW PLAYER XRAY
            ctx.strokeStyle = this.topColor;
            ctx.lineWidth = 2;
            this.drawPlayerShadow();
            ctx.stroke();

            ctx.restore(); // #3 Necessary for clearing playerClip
        }

        // COPY PLAYER TO MAIN CANVAS AFTER ERASE
        CanvasArea.ctx.drawImage(PlayerCanvas.canvas, 0, 0);

        if (this.mapData == Map) {
            ctx.setTransform();
        }
    },
};
