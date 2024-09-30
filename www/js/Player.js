const Player = {

    // new movement code that uses real quake / source movement
    // https://adrianb.io/2015/02/14/bunnyhop.html
    // https://www.youtube.com/watch?v=v3zT3Z5apaM
    // https://www.youtube.com/watch?v=rTsXO6Zicls
    // https://www.youtube.com/watch?v=rTsXO6Zicls
    // https://steamcommunity.com/sharedfiles/filedetails/?id=184184420
    // https://github.com/myria666/qMovementDoc/blob/main/Quake_s_Player_Movement.pdf

    // left (-1,0) vector OR right (1,0) vector that is rotated by the change in angle that frame. 
    // if angle change is postive use Right vec. Negative use left vec
    // normalized left and right vectors act as if strafe keys were pressed 
    wishDir : new Vector2D3D(0,0),
    velocity : new Vector2D3D(0,0),
    currentSpeedProjected : 0,
    addSpeed : 0, // initialized here so that userInterface can access for debug


    initPlayer : function (x, y, angle) {
        this.x = x;
        this.y = y;
        this.restartX = x;
        this.restartY = y;
        this.lookAngle = new Vector2D3D(1,0)
        this.lookAngle = this.lookAngle.rotate(angle)
        this.restartAngle = angle;

        this.jumpValue = 0
        this.jumpVelocity = 2
        this.endSlow = 1
        this.checkpointIndex = -1
    },

    render : function () {
        
        const ctx = CanvasArea.ctx;
        
        ctx.save() // #21.5
        
        // create inverted playerClip so not drawn behind walls
        const clipPathCombo = new Path2D()
        clipPathCombo.moveTo(0, 0)
        clipPathCombo.lineTo(0, CanvasArea.canvas.height)
        clipPathCombo.lineTo(CanvasArea.canvas.width, CanvasArea.canvas.height)
        clipPathCombo.lineTo(CanvasArea.canvas.width, 0)
        clipPathCombo.closePath()

        clipPathCombo.addPath(Map.playerClip, new DOMMatrix([1, 0, 0, 1, -this.x + midX, -this.y + midY]))
        
        // Draw playerClip DEBUG
        // ctx.lineWidth = 5
        // ctx.strokeStyle = "#00ff00"
        // ctx.stroke(clipPathCombo)
        
        ctx.clip(clipPathCombo)


        ctx.save(); // #22
        ctx.translate(midX, midY);


        // LOWER SHADOW IS DRAWN BY MAP
        // DRAWING UPPER SHADOW HERE \/ (drawn twice while over platform or over endzone)
        ctx.save() // #23
        
        ctx.translate(-this.x, -this.y)
        
        // Draw standard shadowClip DEBUG
        // ctx.lineWidth = 5
        // ctx.strokeStyle = "#00ff00"
        // ctx.stroke(Map.upperShadowClip)
        
        ctx.clip(Map.upperShadowClip);
        ctx.translate(this.x , this.y);
    
        ctx.rotate(this.lookAngle.getAngleInDegrees() * Math.PI/180)

        ctx.fillStyle = Map.style.shadow_platformColor;
        ctx.fillRect(-15, -15, 30, 30)

        ctx.restore() // #23 clears upperShadowClip

        if (Map.endZonesToCheck.length > 0) { // draw a clipped version of the players shadow over endzone
            ctx.save() // #23.5
            
            ctx.translate(-this.x, -this.y)
            
            // Draw endZoneShadowClip DEBUG
            // ctx.lineWidth = 3
            // ctx.strokeStyle = "#0000ff"
            // ctx.stroke(Map.endZoneShadowClip)
            
            ctx.clip(Map.endZoneShadowClip);
            ctx.translate(this.x , this.y);

            ctx.rotate(this.lookAngle.getAngleInDegrees() * Math.PI/180)

            ctx.fillStyle = Map.style.shadow_endzoneColor;
            ctx.fillRect(-15, -15, 30, 30)

            ctx.restore() // #23.5 clears endZoneShadowClip
        }




        // DRAWING PLAYER TOP
        ctx.translate(0, -this.jumpValue - 32); 
        ctx.rotate(this.lookAngle.getAngleInDegrees() * Math.PI/180) // rotating canvas
        ctx.fillStyle = Map.style.shaded_playerColor;
        ctx.fillRect(-16,-16,32,32)

        // Draw players top arrow
        ctx.strokeStyle = "#00000030";
        ctx.lineWidth = 2

        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-5, -7);
        ctx.lineTo(-5, 7);
        ctx.lineTo(8, 0)
        ctx.stroke();


        ctx.restore(); // #22 leaves players space translation AND rotation AND jump value translation


        // SIDES OF PLAYER
        ctx.save(); // #24

        const angleRad = this.lookAngle.getAngleInDegrees() * (Math.PI/180);
        const loopedAngle = this.lookAngle.getAngleInDegrees();


        // GETTING CORNERS OF ROTATED RECTANGLE
        // https://stackoverflow.com/questions/41898990/find-corners-of-a-rotated-rectangle-given-its-center-point-and-rotation

        if (loopedAngle > 270 || loopedAngle < 90) { // BOT WALL

            const sideVector = new Vector2D3D(0,1).rotate(this.lookAngle.getAngleInDegrees())
            const litPercent = sideVector.angleDifference(Map.style.lightDirectionVector) / Math.PI
            ctx.fillStyle = CanvasArea.getShadedColor(Map.style.playerColor, litPercent)

            ctx.beginPath();
            ctx.moveTo(midX - (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), midY - 32 - this.jumpValue - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(midX + (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), midY - 32 - this.jumpValue + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(midX + (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), midY - this.jumpValue + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(midX - (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), midY - this.jumpValue - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.closePath();
            ctx.fill();
        }

        if (0 < loopedAngle && loopedAngle < 180) { // RIGHT WALL

            const sideVector = new Vector2D3D(1,0).rotate(this.lookAngle.getAngleInDegrees())
            const litPercent = sideVector.angleDifference(Map.style.lightDirectionVector) / Math.PI
            ctx.fillStyle = CanvasArea.getShadedColor(Map.style.playerColor, litPercent)

            ctx.beginPath();
            ctx.moveTo(midX + (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), midY - 32 - this.jumpValue + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(midX + (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), midY - 32 - this.jumpValue + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(midX + (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), midY - this.jumpValue + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(midX + (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), midY - this.jumpValue + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.closePath();
            ctx.fill();
        }

        if (90 < loopedAngle && loopedAngle < 270) { // TOP WALL
            
            const sideVector = new Vector2D3D(0,-1).rotate(this.lookAngle.getAngleInDegrees())
            const litPercent = sideVector.angleDifference(Map.style.lightDirectionVector) / Math.PI
            ctx.fillStyle = CanvasArea.getShadedColor(Map.style.playerColor, litPercent)

            ctx.beginPath();
            ctx.moveTo(midX + (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), midY - 32 - this.jumpValue + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(midX + (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), midY - this.jumpValue + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(midX - (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), midY - this.jumpValue - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(midX - (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), midY - 32 - this.jumpValue - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.closePath();
            ctx.fill();
        }

        if (180 < loopedAngle && loopedAngle < 360) { // LEFT WALL

            const sideVector = new Vector2D3D(-1,0).rotate(this.lookAngle.getAngleInDegrees())
            const litPercent = sideVector.angleDifference(Map.style.lightDirectionVector) / Math.PI
            ctx.fillStyle = CanvasArea.getShadedColor(Map.style.playerColor, litPercent)

            ctx.beginPath();
            ctx.moveTo(midX - (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), midY - 32 - this.jumpValue - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(midX - (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), midY - 32 - this.jumpValue - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(midX - (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), midY - this.jumpValue - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(midX - (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), midY - this.jumpValue - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.closePath();
            ctx.fill();
        }


        ctx.restore(); // #24
        ctx.restore(); // 21.5 Clears Map.playerClip


        ctx.save() // #24.5

        // DRAW PLAYER XRAY IF BEHIND WALL
        if (Map.wallsToCheck.length != 0) { // could use more precice check here ex: looking to see if theres data in Map.playerClip
            
            ctx.translate(-this.x + midX, -this.y + midY)
            ctx.clip(Map.playerClip)

            ctx.translate(this.x , this.y);
            ctx.rotate(this.lookAngle.getAngleInDegrees() * Math.PI/180)

            ctx.strokeStyle = Map.style.shaded_playerColor
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.strokeRect(-16, -16, 32, 32)
            ctx.stroke()
        }

        ctx.restore() // #24.5    
    },

    startLevel : function () {
        this.velocity.set(6,0); // 6,0
        this.velocity = this.velocity.rotate(this.lookAngle.getAngleInDegrees());
    },

    updatePos : function () {
        
        if (UserInterface.levelState == 1 || UserInterface.levelState == 2) { // if NOT at end screen

            this.lookAngle = this.lookAngle.rotate(TouchHandler.dragAmountX * UserInterface.settings.sensitivity)
            
            // Setting wishDir
            if (TouchHandler.dragAmountX > 0) {
                this.wishDir = this.lookAngle.rotate(90) // look angle is already a normalized
                this.wishDir.normalize(maxVelocity) // changes the length to be maxVelocity
            }

            if (TouchHandler.dragAmountX < 0) {
                this.wishDir = this.lookAngle.rotate(-90) // look angle is already a normalized
                this.wishDir.normalize(maxVelocity) // changes the length to be maxVelocity
            }

            if (TouchHandler.dragAmountX == 0) {this.wishDir.set(0,0)}
        
        }

        if (UserInterface.levelState == 2) { // 1 = pre-start, 2 = playing level, 3 = in endzone

            // ALL MOVEMENT CALCULATIONS
            // THIS IS VIDEO VERSION OF QUAKE1 CODE	

            this.currentSpeedProjected = this.velocity.dotProduct(this.wishDir); // Vector projection of Current_velocity onto wishDir

            // addSpeed is clipped between 0 and MAX_ACCEL * dt  --- addSpeed should only be 0 when wishDir is 0
            this.addSpeed = maxVelocity - this.currentSpeedProjected; // sometimes currentSpeedProj is negative
            
            // this is a hack to make gain consistent between fps changes BAD BAD BAD BS
            // https://www.desmos.com/calculator/k1uc1yai14
            this.addSpeed *= (0.25 * (Math.cbrt(dt)+3))
            
            
            
            if (this.addSpeed > airAcceleration * dt) { // addspeed is too big and needs to be limited by airacceleration value
                this.addSpeed = airAcceleration * dt; 
                
                // show overstrafe warning
                if (UserInterface.showOverstrafeWarning == false) {
                    UserInterface.showOverstrafeWarning = true;
                    setTimeout(() => {UserInterface.showOverstrafeWarning = false}, 1500); // wait 1.5 seconds to hide warning
                }
            }
            
            if (this.addSpeed <= 0) {this.addSpeed = 0; console.log("zero addspeed")} // currentSpeedProjected is greater than max_speed. dont add speed
            
            
            // addSpeed is a scaler for wishdir. if addspeed == 0 no wishdir is applied
            this.velocity.x += (this.wishDir.x * this.addSpeed)
            this.velocity.y += (this.wishDir.y * this.addSpeed)
            // addSpeed needs to be adjusted by dt. Bigger dt, less fps, bigger addSpeed

            // velocity applied to player coords after checking wall collisions


            
            // JUMPING
            if (this.jumpValue < 0) { 
                this.jumpValue = 0;
                this.jumpVelocity = 2;
                AudioHandler.jumpAudio.play();
                if (!this.checkCollision(Map.renderedPlatforms.filter(platform => platform.wall == 0))) { // checkCollision on an array of just platforms (no walls)
                    AudioHandler.splashAudio.play();
                    this.teleport();
                }
            } else {
                this.jumpValue += this.jumpVelocity * dt;
                this.jumpVelocity -= gravity * dt;
            }



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
            this.x += this.velocity.x / 5 * dt;
            this.y += this.velocity.y / 5 * dt;



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


        if (UserInterface.levelState == 3) { // SLOW DOWN MOVEMENT AFTER HITTING END ZONE
            // if (this.endSlow > 0.02) {this.endSlow = (this.endSlow * 0.95);} else {this.endSlow = 0} // THIS NEEDS TO BE FPS INDEPENDENT
            if (this.endSlow > 0.02) {this.endSlow = (this.endSlow - 0.02 * dt);} else {this.endSlow = 0}

            this.x += this.velocity.x/5 * dt * this.endSlow; // MOVE FORWARD AT ANGLE BASED ON VELOCITY
            this.y += this.velocity.y/5 * dt * this.endSlow;
        
            if (this.jumpValue < 0) { // JUMPING
                this.jumpValue = 0;
                this.jumpVelocity = 2;
            } else {
                this.jumpValue += this.jumpVelocity * dt * this.endSlow;
                this.jumpVelocity -= gravity * dt * this.endSlow;
            }
        }
    },


    checkCollision : function (arrayOfPlatformsToCheck) {

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


    teleport : function () { // Called when player hits the water
        if (this.checkpointIndex !== -1) {
            this.x = Map.checkpoints[this.checkpointIndex].x;
            this.y = Map.checkpoints[this.checkpointIndex].y;
            this.lookAngle.set(1,0)
            this.lookAngle = this.lookAngle.rotate(Map.checkpoints[this.checkpointIndex].angle)
            this.velocity.set(2,0)
            this.velocity = this.velocity.rotate(this.lookAngle.getAngleInDegrees())
            this.jumpValue = 0;
            this.jumpVelocity = 2;
        } else {
            btn_restart.released(true);
        }
    },

    restart : function () { // Called when user hits restart button (not when teleported from water)
        this.x = this.restartX;
        this.y = this.restartY;
        this.lookAngle.set(1,0)
        this.lookAngle = this.lookAngle.rotate(this.restartAngle)
        this.velocity.set(0,0)
        this.jumpValue = 0;
        this.jumpVelocity = 2;
        this.endSlow = 1;
    }
}