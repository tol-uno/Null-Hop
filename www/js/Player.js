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

    topColor: "rgb(0,255,0)",
    botSideColor: "rgb(0,255,0)",
    rightSideColor: "rgb(0,200,0)",
    topSideColor: "rgb(0,150,0)",
    leftSideColor: "rgb(0,100,0)",

    debugTurn: 2, // intialized here so it can be accesed in console

    initPlayer: function (x, y, angle) {
        this.x = x;
        this.y = y;
        this.restartX = x;
        this.restartY = y;
        this.lookAngle = new Vector2D3D(1, 0)
        this.lookAngle = this.lookAngle.rotate(angle)
        this.restartAngle = angle;
        this.velocity.set(0, 0)

        this.speedCameraOffset.zoomAverager.frames.fill(1, 0)
        this.speedCameraOffset.zoom = 1
        this.speedCameraOffset.dirAveragerX.frames.fill(0, 0)
        this.speedCameraOffset.dirAveragerY.frames.fill(0, 0)

        this.jumpValue = 0
        this.jumpVelocity = 200
        this.endSlow = 1
        this.checkpointIndex = -1
    },

    setPlayerLighting: function () {

        // determine where to pull platforms and styles from
        const MapData = UserInterface.gamestate == 7 ? MapEditor.loadedMap : Map

        // Turning lightDirection and lightPitch into a 3D vector
        const lightDirection_Rads = MapData.style.lightDirection * (Math.PI / 180)
        const lightPitch_Rads = MapData.style.lightPitch * (Math.PI / 180) // light pitch = light angle. 0 == flat at the horizon. 90 == directly above

        const x = Math.cos(lightDirection_Rads) * Math.cos(lightPitch_Rads)
        const y = Math.sin(lightDirection_Rads) * Math.cos(lightPitch_Rads)
        const z = Math.sin(lightPitch_Rads)

        const directLightVector = new Vector2D3D(x, y, z)


        // NORMALS
        const topNormal = new Vector2D3D(0, 0, -1)
        const botSideNormal = new Vector2D3D(0, 1, 0).rotate(this.lookAngle.getAngleInDegrees())
        const rightSideNormal = new Vector2D3D(1, 0, 0).rotate(this.lookAngle.getAngleInDegrees())
        const topSideNormal = new Vector2D3D(0, -1, 0).rotate(this.lookAngle.getAngleInDegrees())
        const leftSideNormal = new Vector2D3D(-1, 0, 0).rotate(this.lookAngle.getAngleInDegrees())

        // angleDifference result will be between 0 and PI radians
        // if angleDifference is > PI/2 (90 deg) then side is in light. Otherwise no direct light is hitting it
        // if angleDifference is < PI/2 (90 deg) then side is in shadow & litPercent = 0

        litPercentTop = Math.cos(Math.PI - topNormal.angleDifference(directLightVector)) // known as geometry term
        if (litPercentTop < 0) { litPercentTop = 0 } // clamp to 0 to 1

        let litPercentBotSide = Math.cos(Math.PI - botSideNormal.angleDifference(directLightVector))
        if (litPercentBotSide < 0) { litPercentBotSide = 0 }

        let litPercentRightSide = Math.cos(Math.PI - rightSideNormal.angleDifference(directLightVector))
        if (litPercentRightSide < 0) { litPercentRightSide = 0 }

        let litPercentTopSide = Math.cos(Math.PI - topSideNormal.angleDifference(directLightVector))
        if (litPercentTopSide < 0) { litPercentTopSide = 0 }

        let litPercentLeftSide = Math.cos(Math.PI - leftSideNormal.angleDifference(directLightVector))
        if (litPercentLeftSide < 0) { litPercentLeftSide = 0 }


        this.topColor = CanvasArea.getShadedColor(MapData.style.playerColor, litPercentTop)
        this.botSideColor = CanvasArea.getShadedColor(MapData.style.playerColor, litPercentBotSide)
        this.rightSideColor = CanvasArea.getShadedColor(MapData.style.playerColor, litPercentRightSide)
        this.topSideColor = CanvasArea.getShadedColor(MapData.style.playerColor, litPercentTopSide)
        this.leftSideColor = CanvasArea.getShadedColor(MapData.style.playerColor, litPercentLeftSide)

    },

    renderLowerShadow: function () { // used by map
        const ctx = CanvasArea.ctx;

        const MapData = UserInterface.gamestate == 7 ? MapEditor.loadedMap : Map // to use in PreviewWindow

        ctx.save(); // #1
        ctx.translate(this.x, this.y + MapData.style.platformHeight)
        ctx.rotate(this.lookAngle.getAngleInDegrees() * Math.PI / 180); // rotating canvas
        ctx.fillStyle = MapData.style.shadow_backgroundColor;
        ctx.fillRect(-15, -15, 30, 30)
        ctx.restore(); // #1
    },

    render: function () {

        // Player is drawn on a seperate PlayerCanvas.
        // On PlayerCanvas, parts of the player that
        // are behind walls are erased using Map.playerClip
        // PlayerCanvas is then pasted onto the main CanvasArea

        this.setPlayerLighting()

        const ctx = PlayerCanvas.ctx;
        PlayerCanvas.clear()

        const MapData = UserInterface.gamestate == 7 ? MapEditor.loadedMap : Map // to use in PreviewWindow



        ctx.save() // #2 For scaling the canvas for zoom

        ctx.scale(this.speedCameraOffset.zoom, this.speedCameraOffset.zoom)
        ctx.translate(
            (CanvasArea.canvas.width / this.speedCameraOffset.zoom - CanvasArea.canvas.width) / 2 + this.speedCameraOffset.direction.x,
            (CanvasArea.canvas.height / this.speedCameraOffset.zoom - CanvasArea.canvas.height) / 2 + this.speedCameraOffset.direction.y,
        )


        if (MapData == Map) {
            ctx.translate(midX, midY); // translate to center of the screen
        } else {
            ctx.translate(this.x, this.y) // translate to wherever player is at on screen
        }


        // LOWER SHADOW IS DRAWN BY MAP
        // DRAWING UPPER SHADOW HERE (drawn twice, once while over platform and once while over endzone)

        // SHADOW OVER PLATFORM
        ctx.save() // #5 upperShadowClip canvas 

        if (MapData == Map) { // only set clip if in Map not PreviewWindow
            ctx.translate(-this.x, -this.y) // ctx goes to map origin to set clip

            // Draw standard shadowClip DEBUG
            // ctx.lineWidth = 5
            // ctx.strokeStyle = "#00ff00"
            // ctx.stroke(Map.upperShadowClip)

            ctx.clip(Map.upperShadowClip);
            ctx.translate(this.x, this.y); // reset ctx to middle of player at middle of screen
        }

        ctx.rotate(this.lookAngle.getAngleInDegrees() * Math.PI / 180)

        ctx.fillStyle = MapData.style.shadow_platformColor;
        ctx.fillRect(-15, -15, 30, 30)

        ctx.restore() // #5 clears upperShadowClip



        // SHADOW OVER ENDZONE
        if (MapData == Map && Map.endZonesToCheck.length > 0) {
            ctx.save() // #6 endZoneShadowClip canvas

            ctx.translate(-this.x, -this.y)

            // Draw endZoneShadowClip DEBUG
            // ctx.lineWidth = 3
            // ctx.strokeStyle = "#0000ff"
            // ctx.stroke(Map.endZoneShadowClip)

            ctx.clip(Map.endZoneShadowClip);
            ctx.translate(this.x, this.y);

            ctx.rotate(this.lookAngle.getAngleInDegrees() * Math.PI / 180)

            ctx.fillStyle = Map.style.shadow_endzoneColor;
            ctx.fillRect(-15, -15, 30, 30)

            ctx.restore() // #6 clears endZoneShadowClip
        }



        ctx.save(); // #6.5 for reverting Player.rotation and Player.jumpValue translations

        // DRAWING PLAYER TOP
        ctx.translate(0, -this.jumpValue - 32);
        ctx.rotate(this.lookAngle.getAngleInDegrees() * Math.PI / 180) // rotating canvas
        ctx.fillStyle = this.topColor;
        ctx.fillRect(-16, -16, 32, 32)

        // Draw players top arrow
        ctx.strokeStyle = "#00000030";
        ctx.lineWidth = 2

        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-5, -7);
        ctx.lineTo(-5, 7);
        ctx.lineTo(8, 0)
        ctx.stroke();

        ctx.restore(); // #6.5 leaves player rotation and jump value translation
        // ctx is now back at player middle


        // SIDES OF PLAYER
        const angleRad = this.lookAngle.getAngleInDegrees() * (Math.PI / 180);
        const loopedAngle = this.lookAngle.getAngleInDegrees();


        // GETTING CORNERS OF ROTATED RECTANGLE
        // https://stackoverflow.com/questions/41898990/find-corners-of-a-rotated-rectangle-given-its-center-point-and-rotation

        if (loopedAngle > 270 || loopedAngle < 90) { // BOT WALL

            ctx.fillStyle = this.botSideColor

            ctx.beginPath();
            ctx.moveTo(-(16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), - 32 - this.jumpValue - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo((16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), - 32 - this.jumpValue + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo((16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), - this.jumpValue + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(-(16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), - this.jumpValue - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.closePath();
            ctx.fill();
        }

        if (0 < loopedAngle && loopedAngle < 180) { // RIGHT WALL

            ctx.fillStyle = this.rightSideColor

            ctx.beginPath();
            ctx.moveTo((16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), - 32 - this.jumpValue + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo((16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), - 32 - this.jumpValue + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo((16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), - this.jumpValue + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo((16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), - this.jumpValue + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.closePath();
            ctx.fill();
        }

        if (90 < loopedAngle && loopedAngle < 270) { // TOP WALL

            ctx.fillStyle = this.topSideColor

            ctx.beginPath();
            ctx.moveTo((16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), - 32 - this.jumpValue + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo((16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), - this.jumpValue + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(-(16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), - this.jumpValue - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(-(16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), - 32 - this.jumpValue - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.closePath();
            ctx.fill();
        }

        if (180 < loopedAngle && loopedAngle < 360) { // LEFT WALL

            ctx.fillStyle = this.leftSideColor

            ctx.beginPath();
            ctx.moveTo(-(16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), - 32 - this.jumpValue - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(-(16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), - 32 - this.jumpValue - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(-(16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), - this.jumpValue - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(-(16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), - this.jumpValue - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.closePath();
            ctx.fill();
        }


        // ERASE PARTS OF PLAYER THAT ARE BEHIND WALLS

        // ctx is still at player middle
        ctx.translate(-this.x, -this.y) // ctx is at map origin

        // Draw playerClip DEBUG (This is being drawn on PlayerCanvas)
        // ctx.lineWidth = 5
        // ctx.strokeStyle = "#00ff00"
        // ctx.stroke(Map.playerClip)

        // ADD CLIP of area behind walls
        ctx.clip(Map.playerClip)

        // ERASE PLAYER THATS BEHIND CLIP
        ctx.translate(this.x - midX, this.y - midY) // translate to the top left of the screen / canvas
        PlayerCanvas.clear()

        // COPY PLAYER TO MAIN CANVAS AFTER ERASE
        CanvasArea.ctx.drawImage(PlayerCanvas.canvas, 0, 0)



        // DRAW PLAYER XRAY IF BEHIND WALL (on normal CanvasArea)
        if (MapData == Map && Map.wallsToCheck.length != 0) { // could use more precice check here ex: looking to see if theres data in Map.playerClip OPTIMIZE

            // DRAW PLAYER XRAY
            CanvasArea.ctx.save() // # 7 used to reset the CanvasArea (which hasnt really been used in Player.render)

            // This zooming was only done on PlayerCanvas. CanvasArea needs too 
            CanvasArea.ctx.scale(this.speedCameraOffset.zoom, this.speedCameraOffset.zoom)
            CanvasArea.ctx.translate(
                (CanvasArea.canvas.width / this.speedCameraOffset.zoom - CanvasArea.canvas.width) / 2 + this.speedCameraOffset.direction.x,
                (CanvasArea.canvas.height / this.speedCameraOffset.zoom - CanvasArea.canvas.height) / 2 + this.speedCameraOffset.direction.y,
            )

            CanvasArea.ctx.translate(-this.x + midX, -this.y + midY) // Map origin ??

            CanvasArea.ctx.clip(Map.playerClip)

            CanvasArea.ctx.translate(this.x, this.y); // middle of player ??
            CanvasArea.ctx.rotate(this.lookAngle.getAngleInDegrees() * Math.PI / 180)

            CanvasArea.ctx.strokeStyle = this.topColor
            CanvasArea.ctx.lineWidth = 2
            CanvasArea.ctx.beginPath()
            CanvasArea.ctx.strokeRect(-16, -16, 32, 32)
            CanvasArea.ctx.stroke()

            CanvasArea.ctx.restore() // # 7 resets the CanvasArea to whatever weird state it was in previously
        }


        ctx.restore() // #2 clears ctx.scale for zoom. Also restores Player.x / .y translation or midX midY
    },

    update: function () {

        //TouchHandler.dragAmountX = dt // debugTurn

        if (UserInterface.levelState == 1 || UserInterface.levelState == 2) { // if NOT at end screen

            this.lookAngle = this.lookAngle.rotate(TouchHandler.dragAmountX * UserInterface.settings.sensitivity)

            // Setting wish_velocity
            // normalized unit vector that is perpendicular to lookAngle
            // simulates left or right strafe keys being pressed depending on dragAmount direction

            if (TouchHandler.dragAmountX > 0) {
                this.wish_velocity = this.lookAngle.rotate(90) // look angle is already normalized
            }

            if (TouchHandler.dragAmountX < 0) {
                this.wish_velocity = this.lookAngle.rotate(-90) // look angle is already normalized
            }

            if (TouchHandler.dragAmountX == 0) { this.wish_velocity.set(0, 0) }

        }

        if (UserInterface.levelState == 2) { // 1 = pre-start, 2 = playing level, 3 = in endzone

            // ALL MOVEMENT CALCULATIONS BASED OFF QUAKE 1 CODE
            // BUILT MOSTLY FROM zweek's video on how airstrafing works
            // https://www.youtube.com/watch?v=gRqoXy-0d84

            // Other references for quake / source movement info
            // https://adrianb.io/2015/02/14/bunnyhop.html
            // https://www.youtube.com/watch?v=v3zT3Z5apaM
            // https://www.youtube.com/watch?v=rTsXO6Zicls
            // https://www.youtube.com/watch?v=rTsXO6Zicls
            // https://steamcommunity.com/sharedfiles/filedetails/?id=184184420
            // https://github.com/myria666/qMovementDoc/blob/main/Quake_s_Player_Movement.pdf


            // SUEDO QUAKE 1 CODE
            /*
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


            // maxVelocity replaces the action of clipping wish_speed to 30 --- maxVelocity == 30
            this.addSpeed = maxVelocity - this.currentSpeedProjected;


            
            // show overstrafe warning BROKEN
            if (this.addSpeed > 320 * airAcceleration * dt) { // 11:04 in zweeks video shows why u lose speed
                if (UserInterface.showOverstrafeWarning == false) {
                    UserInterface.showOverstrafeWarning = true;
                    setTimeout(() => { UserInterface.showOverstrafeWarning = false }, 1500); // wait 1.5 seconds to hide warning
                }
            }
  
            // new simplified stuff that replaces commented code block below \/
            this.addSpeed = Math.max(0, this.addSpeed)
            this.addSpeed = Math.min(this.addSpeed, 320 * airAcceleration * dt)


            this.velocity.x += (this.addSpeed * this.wish_velocity.x)
            this.velocity.y += (this.addSpeed * this.wish_velocity.y)



            // THIS IS A MORE VERBOSE VERSION OF THE CODE THAT FOLLOWS THE QUAKE CODE CLOSER BUT IS NOT AS CLEAR AS ABOVE
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



            // velocity applied to player coords after checking wall collisions

            // CHECK IF COLLIDING WITH WALLS
            Map.wallsToCheck.forEach(wall => {

                function isColliding(player, wall) {
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

                    if (distanceSquared <= (18 * 18)) {  // 16 is the player's collision radius
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
                        if (playerInsideWall) { // if inside the wall the vector needs to be flipped to point the right way
                            normalVector.x *= -1;
                            normalVector.y *= -1;
                        }
                        normalVector.normalize(1); // Normalize the vector

                        return {
                            collided: true,
                            normal: normalVector,
                            collisionPoint: {
                                x: collisionX,
                                y: collisionY
                            }
                        };
                    }

                    // No collision detected
                    return {
                        collided: false
                    };
                }


                function adjustVelocity(playerMovementVector, wallNormalVector) {
                    // Calculate the dot product of player movement vector and wall normal vector
                    const dotProduct = playerMovementVector.x * wallNormalVector.x + playerMovementVector.y * wallNormalVector.y;

                    // If the dot product is negative, it means the player is moving towards the wall
                    if (dotProduct < 0) {
                        // Remove the component of player movement vector that's in the direction of the wall
                        playerMovementVector.x -= dotProduct * wallNormalVector.x;
                        playerMovementVector.y -= dotProduct * wallNormalVector.y;
                    }
                }



                const collisionData = isColliding(Player, wall)
                if (collisionData.collided) {
                    //console.log("collided!")

                    adjustVelocity(this.velocity, collisionData.normal)

                    // bounce player backwards from being inside wall
                    this.x = collisionData.collisionPoint.x + collisionData.normal.x * 20
                    this.y = collisionData.collisionPoint.y + collisionData.normal.y * 20


                }

            })


            // APPLYING VELOCITY
            this.x += this.velocity.x * dt;
            this.y += this.velocity.y * dt;


            // JUMPING
            if (this.jumpValue < 0) {
                this.jumpValue = 0;
                this.jumpVelocity = 200;
                AudioHandler.jumpAudio.play();
                if (!this.checkCollision(Map.renderedPlatforms.filter(platform => platform.wall == 0))) { // checkCollision on an array of just platforms (no walls)
                    AudioHandler.splashAudio.play();
                    this.speedCameraOffset.zoomAverager.clear()
                    this.teleport();

                }
            } else {
                this.jumpValue += this.jumpVelocity * dt;
                this.jumpVelocity -= gravity * dt;
            }


            // CHECK if colliding with checkpoint triggers
            Map.checkpoints.forEach(checkpoint => {

                const distance = pDistance(this.x, this.y, checkpoint.triggerX1, checkpoint.triggerY1, checkpoint.triggerX2, checkpoint.triggerY2)
                // console.log("distance to " + checkpoint + ": " + distance)

                if (distance <= 16) { // COLLIDING WITH CP TRIGGER
                    this.checkpointIndex = Map.checkpoints.indexOf(checkpoint) // could do this with a callback index function?
                    // console.log(this.checkpointIndex);
                }

                // gets minumum distance to line segment from point: https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
                function pDistance(x, y, x1, y1, x2, y2) {

                    const A = x - x1;
                    const B = y - y1;
                    const C = x2 - x1;
                    const D = y2 - y1;

                    const dot = A * C + B * D;
                    const len_sq = C * C + D * D;
                    let param = -1;
                    if (len_sq != 0) //in case of 0 length line
                        param = dot / len_sq;

                    let xx, yy;

                    if (param < 0) {
                        xx = x1;
                        yy = y1;
                    }
                    else if (param > 1) {
                        xx = x2;
                        yy = y2;
                    }
                    else {
                        xx = x1 + param * C;
                        yy = y1 + param * D;
                    }

                    const dx = x - xx;
                    const dy = y - yy;
                    return Math.sqrt(dx * dx + dy * dy);
                }
            });


            // CHECK IF COLLIDING WITH ANY ENDZONES
            if (Map.endZonesToCheck.length > 0) {
                if (this.checkCollision(Map.endZonesToCheck)) {
                    AudioHandler.successAudio.play();
                    UserInterface.handleRecord();
                    UserInterface.levelState = 3;
                }
            }
        }



        // CHANGING CAMERA ZOOM and OFFSET BASED ON SPEED
        // add current zoom level to averager
        this.speedCameraOffset.zoomAverager.pushValue(CanvasArea.mapToRange(this.velocity.magnitude(), 100, 900, 1, 0.5))

        // apply averager zoom to actual zoom
        this.speedCameraOffset.zoom = this.speedCameraOffset.zoomAverager.getAverage()

        // add current offset direction to averager
        this.speedCameraOffset.dirAveragerX.pushValue(-this.velocity.x / 5)
        this.speedCameraOffset.dirAveragerY.pushValue(-this.velocity.y / 5)

        // apply averager offset direction to actual offset direction
        this.speedCameraOffset.direction.x = this.speedCameraOffset.dirAveragerX.getAverage()
        this.speedCameraOffset.direction.y = this.speedCameraOffset.dirAveragerY.getAverage()
        


        if (UserInterface.levelState == 3) { // SLOW DOWN MOVEMENT AFTER HITTING END ZONE
            // if (this.endSlow > 0.02) {this.endSlow = (this.endSlow * 0.95);} else {this.endSlow = 0} // THIS NEEDS TO BE FPS INDEPENDENT
            if (this.endSlow > 0) { this.endSlow -= 2 * dt } else { this.endSlow = 0 }

            this.x += this.velocity.x * dt * this.endSlow; // MOVE FORWARD AT ANGLE BASED ON VELOCITY
            this.y += this.velocity.y * dt * this.endSlow;

            if (this.jumpValue < 0) { // JUMPING
                this.jumpValue = 0;
                this.jumpVelocity = 200;
            } else {
                this.jumpValue += this.jumpVelocity * dt * this.endSlow;
                this.jumpVelocity -= gravity * dt * this.endSlow;
            }
        }
    },

    startLevel: function () {
        this.velocity.set(150, 0); // 6,0
        this.velocity = this.velocity.rotate(this.lookAngle.getAngleInDegrees());
    },

    checkCollision: function (arrayOfPlatformsToCheck) {

        let collisions = 0;

        // takes a rectangle defined by center coordinates (x, y), width, height, and angle in radians
        // returns an array of corner points in clockwise order, starting from the top-left corner
        function createPoligon(x, y, width, height, angle) {
            // Calculate half width and half height
            var hw = width / 2;
            var hh = height / 2;

            // Calculate the cos and sin of the angle
            var cosAngle = Math.cos(angle);
            var sinAngle = Math.sin(angle);

            // Calculate the corner points relative to the center
            var topLeft = {
                x: x - (hw * cosAngle) - (hh * sinAngle),
                y: y - (hw * sinAngle) + (hh * cosAngle)
            };

            var topRight = {
                x: x + (hw * cosAngle) - (hh * sinAngle),
                y: y + (hw * sinAngle) + (hh * cosAngle)
            };

            var bottomRight = {
                x: x + (hw * cosAngle) + (hh * sinAngle),
                y: y + (hw * sinAngle) - (hh * cosAngle)
            };

            var bottomLeft = {
                x: x - (hw * cosAngle) + (hh * sinAngle),
                y: y - (hw * sinAngle) - (hh * cosAngle)
            };


            // Return the corner points in clockwise order
            return [topLeft, topRight, bottomRight, bottomLeft];
        }

        const playerPoligon = createPoligon(this.x, this.y, 32, 32, this.lookAngle.getAngleInDegrees() * Math.PI / 180) // player angle converted to rads

        // check player against every platform
        arrayOfPlatformsToCheck.forEach(platform => {
            const platformPoligon = createPoligon(platform.x, platform.y, platform.width, platform.height, platform.angleRad)

            // @param a an array of connected points [{x:, y:}, {x:, y:},...] that form a closed polygon
            // @param b an array of connected points [{x:, y:}, {x:, y:},...] that form a closed polygon
            // @return true if there is any intersection between the 2 polygons, false otherwise
            // https://stackoverflow.com/questions/10962379/how-to-check-intersection-between-2-rotated-rectangles
            function doPolygonsIntersect(a, b) {
                const polygons = [a, b];
                let minA, maxA, projected, i, i1, j, minB, maxB;

                for (i = 0; i < polygons.length; i++) {

                    // for each polygon, look at each edge of the polygon, and determine if it separates
                    // the two shapes
                    const polygon = polygons[i];
                    for (i1 = 0; i1 < polygon.length; i1++) {

                        // grab 2 vertices to create an edge
                        const i2 = (i1 + 1) % polygon.length;
                        const p1 = polygon[i1];
                        const p2 = polygon[i2];

                        // find the line perpendicular to this edge
                        const normal = {
                            x: p2.y - p1.y,
                            y: p1.x - p2.x
                        };

                        minA = maxA = undefined;
                        // for each vertex in the first shape, project it onto the line perpendicular to the edge
                        // and keep track of the min and max of these values
                        for (j = 0; j < a.length; j++) {
                            projected = normal.x * a[j].x + normal.y * a[j].y;
                            if (minA == null || projected < minA) {
                                minA = projected;
                            }
                            if (maxA == null || projected > maxA) {
                                maxA = projected;
                            }
                        }

                        // for each vertex in the second shape, project it onto the line perpendicular to the edge
                        // and keep track of the min and max of these values
                        minB = maxB = undefined;
                        for (j = 0; j < b.length; j++) {
                            projected = normal.x * b[j].x + normal.y * b[j].y;
                            if (minB == null || projected < minB) {
                                minB = projected;
                            }
                            if (maxB == null || projected > maxB) {
                                maxB = projected;
                            }
                        }

                        // if there is no overlap between the projects, the edge we are looking at separates the two
                        // polygons, and we know there is no overlap
                        if (maxA < minB || maxB < minA) {
                            return false;
                        }
                    }
                }
                return true;
            };


            if (doPolygonsIntersect(playerPoligon, platformPoligon)) {
                collisions++
            }
        })

        return (collisions > 0)
    },

    teleport: function () { // Called when player hits the water
        if (this.checkpointIndex !== -1) {
            this.x = Map.checkpoints[this.checkpointIndex].x;
            this.y = Map.checkpoints[this.checkpointIndex].y;
            this.lookAngle.set(1, 0)
            this.lookAngle = this.lookAngle.rotate(Map.checkpoints[this.checkpointIndex].angle)
            this.velocity.set(100, 0)
            this.velocity = this.velocity.rotate(this.lookAngle.getAngleInDegrees())
            this.jumpValue = 0;
            this.jumpVelocity = 200;
        } else {
            btn_restart.released(true);
        }
    },

    restart: function () { // Called when user hits restart button (not when teleported from water)
        this.x = this.restartX;
        this.y = this.restartY;
        this.lookAngle.set(1, 0)
        this.lookAngle = this.lookAngle.rotate(this.restartAngle)
        this.velocity.set(0, 0)
        this.jumpValue = 0;
        this.jumpVelocity = 2;
        this.endSlow = 1;
        this.speedCameraOffset.zoomAverager.frames.fill(1, 0)
        this.speedCameraOffset.zoom = 1
        this.speedCameraOffset.dirAveragerX.frames.fill(0, 0)
        this.speedCameraOffset.dirAveragerY.frames.fill(0, 0)

    }
}