const Player = {
    wish_velocity: new Vector2D3D(0, 0),
    velocity: new Vector2D3D(0, 0),
    currentSpeedProjected: 0,
    addSpeed: 0, // initialized here so that userInterface can access for debug

    previousJumpSpeed: 0, // for jump stats display

    speedCameraOffset: {
        zoom: 1, // from 1 (default) to 0.5 (zoomed out)
        direction: new Vector2D3D(0, 0),
        zoomAverager: new Averager(90),
        dirAveragerX: new Averager(180),
        dirAveragerY: new Averager(180),
    },

    loopedAngle: null,
    angleRad: null,

    playerPoligon: null, // similar to shadow corners but used for collision checks with platforms and walls (32x32)

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

        this.speedCameraOffset.zoom = 1.5;
        this.speedCameraOffset.zoomAverager.frames.fill(1.5, 0);
        this.speedCameraOffset.dirAveragerX.frames.fill(0, 0);
        this.speedCameraOffset.dirAveragerY.frames.fill(0, 0);

        this.velocity.set(0, 0);

        this.jumpValue = 0;
        this.jumpVelocity = 200;
        this.endSlow = 1;
        this.checkpointIndex = -1;
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
            // FIX this should use a single shadowPolygon instance of Polygon and just update it every frame as opposed to creating new ones
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
            // if (this.addSpeed > 320 * airAcceleration * dt) {
            if (TouchHandler.dragAmountX * UserInterface.settings.sensitivity * dt > 0.4) {
                // not the right way to do this
                // 11:04 in zweeks bhopping video he shows why u lose speed
                if (UserInterface.showOverstrafeWarning == false) {
                    UserInterface.addUiElement(ui_overstrafeWarning);
                    UserInterface.showOverstrafeWarning = true;
                    setTimeout(() => {
                        UserInterface.removeUiElement(ui_overstrafeWarning);
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
                this.previousJumpSpeed = 100;
            } else {
                // similar code to btn_restart.func();
                UserInterface.switchToUiGroup(UserInterface.uiGroup_inLevel);
                ui_speedometer.textContent = "Speed: 0";
                ui_jumpStats.textContent = "";
                UserInterface.timer = 0;
                UserInterface.levelState = 1;
                Player.checkpointIndex = -1;
                Player.restart();
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

                    // set jump stats

                    // fail and go to checkpoint: reset previousJumpSpeed to 100
                    // restart level/leave level: reset previousJumpSpeed to 150
                    const deltaSpeed = Math.round(this.velocity.magnitude() - this.previousJumpSpeed);
                    this.previousJumpSpeed = this.velocity.magnitude();
                    ui_jumpStats.textContent = deltaSpeed != 0 ? `${deltaSpeed > 0 ? "+" : "-"}${Math.abs(deltaSpeed)}` : ""; // ▲▼
                    ui_jumpStats.style.opacity = "1";
                    ui_jumpStats.style.transform = "translateY(0px)";
                    ui_jumpStats.style.animation = `fadeOut 0.65s forwards cubic-bezier(0.7, 0, 1.0, 1.0), ${
                        deltaSpeed > 0 ? "moveUp" : "moveDown"
                    } 0.65s forwards linear`;
                    setTimeout(() => {
                        ui_jumpStats.style.opacity = "0";
                        ui_jumpStats.style.animation = "";
                    }, 650);
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
                if (ui_endScreen.classList.contains("hidden")) {
                    // not a great way of doing this. Maybe add a levelState = 4?
                    UserInterface.activateEndScreen();
                }
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
        this.speedCameraOffset.zoomAverager.pushValue(mapToRange(this.velocity.magnitude(), 100, 1100, 1.5, 0.5));

        // apply averager zoom to actual zoom
        this.speedCameraOffset.zoom = this.speedCameraOffset.zoomAverager.getAverage();

        // add current offset direction to averager
        this.speedCameraOffset.dirAveragerX.pushValue(-this.velocity.x / 5);
        this.speedCameraOffset.dirAveragerY.pushValue(-this.velocity.y / 5);

        // apply averager offset direction to actual offset direction
        this.speedCameraOffset.direction.x = this.speedCameraOffset.dirAveragerX.getAverage();
        this.speedCameraOffset.direction.y = this.speedCameraOffset.dirAveragerY.getAverage();
    },

    startLevel: function () {
        this.velocity.set(150, 0).rotate(this.lookAngle.getAngleInDegrees());
        this.previousJumpSpeed = 150;
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
};
