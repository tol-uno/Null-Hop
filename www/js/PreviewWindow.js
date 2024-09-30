const PreviewWindow = {

    // update() is called by buttons
    // render() is called in MapEditor.render()

    x : 40, // kinda weird to use these now that its a full screen window
    y : 160,

    // OBJECTS TO DRAW
    platform : {
        "x": 165,
        "y": 160,
        "width": 70,
        "height": 70,
        "angle": 45,
        "endzone": 0,
        "wall": 0
    },

    wall : {
        "x": 70,
        "y": 110,
        "width": 50,
        "height": 100,
        "angle": 45,
        "endzone": 0,
        "wall": 1
    },

    endzone : {
        "x": 240,
        "y": 85,
        "width": 50,
        "height": 50,
        "angle": 45,
        "endzone": 1,
        "wall": 0
    },

    player : {
        "x" : 165,
        "y" : 148,
        "angle" : 45,
        "jumpValue" : 29
    },


    update : function() { // updates the shading for all colors (and platform shadow points)
        
        function updatePlatform(platform) { // Calculate lighting and shadows for whatever platform is passed as param

            // turning lightDirection integer into a Vector 
            MapEditor.loadedMap.style.lightDirectionVector = new Vector2D3D(Math.cos(MapEditor.loadedMap.style.lightDirection * (Math.PI/180)), Math.sin(MapEditor.loadedMap.style.lightDirection * (Math.PI/180)))

            // Setting the colors for platforms, endzones, and walls
            let colorToUse = MapEditor.loadedMap.style.platformSideColor;
            if (platform.endzone) {colorToUse = MapEditor.loadedMap.style.endZoneSideColor;}
            if (platform.wall) {colorToUse = MapEditor.loadedMap.style.wallSideColor;}

            let colorToUse2 = MapEditor.loadedMap.style.platformTopColor;
            if (platform.endzone) {colorToUse2 = MapEditor.loadedMap.style.endZoneTopColor;}
            if (platform.wall) {colorToUse2 = MapEditor.loadedMap.style.wallTopColor;}
            
            // platform COLORS + wall and endzone
            const side1Vec = new Vector2D3D(-1,0).rotate(platform.angle)
            const side2Vec = new Vector2D3D(0,1).rotate(platform.angle)
            const side3Vec = new Vector2D3D(1,0).rotate(platform.angle)

            const litPercent1 = side1Vec.angleDifference(MapEditor.loadedMap.style.lightDirectionVector) / Math.PI
            const litPercent2 = side2Vec.angleDifference(MapEditor.loadedMap.style.lightDirectionVector) / Math.PI
            const litPercent3 = side3Vec.angleDifference(MapEditor.loadedMap.style.lightDirectionVector) / Math.PI


            platform.lit_topColor = CanvasArea.getShadedColor(colorToUse2, 1)
            platform.sideColor1 = CanvasArea.getShadedColor(colorToUse, litPercent1)
            platform.sideColor2 = CanvasArea.getShadedColor(colorToUse, litPercent2)
            platform.sideColor3 = CanvasArea.getShadedColor(colorToUse, litPercent3)


            // SHADOW POLYGON
            // lightPitch is actually sun's angle between 0 -> 89
            const sunAngle = MapEditor.loadedMap.style.lightPitch
            const shadowX = MapEditor.loadedMap.style.lightDirectionVector.x * Math.tan(sunAngle * Math.PI / 180) * MapEditor.loadedMap.style.platformHeight
            const shadowY = MapEditor.loadedMap.style.lightDirectionVector.y * Math.tan(sunAngle * Math.PI / 180) * MapEditor.loadedMap.style.platformHeight

            const angleRad = platform.angle * (Math.PI/180);
            
            let wallShadowMultiplier
            if (platform.wall && MapEditor.loadedMap.style.platformHeight > 0) {
                wallShadowMultiplier = 1 + (MapEditor.loadedMap.style.wallHeight / MapEditor.loadedMap.style.platformHeight)
            } else {
                wallShadowMultiplier = 1
            }

            platform.shadowPoints = [ // ALL THE POSSIBLE POINTS TO INPUT IN CONVEX HULL FUNCTION
            
                // bot left corner
                [
                -((platform.width / 2) * Math.cos(angleRad)) - ((platform.height / 2) * Math.sin(angleRad)),
                -((platform.width / 2) * Math.sin(angleRad)) + ((platform.height / 2) * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight
                ],

                // bot right corner
                [
                ((platform.width / 2) * Math.cos(angleRad)) - ((platform.height / 2) * Math.sin(angleRad)),
                ((platform.width / 2) * Math.sin(angleRad)) + ((platform.height / 2) * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight
                ],

                // top right corner
                [
                ((platform.width / 2) * Math.cos(angleRad)) + ((platform.height / 2) * Math.sin(angleRad)),
                ((platform.width / 2) * Math.sin(angleRad)) - ((platform.height / 2) * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight
                ],
            
                // top left corner
                [
                -((platform.width / 2) * Math.cos(angleRad)) + ((platform.height / 2) * Math.sin(angleRad)),
                -((platform.width / 2) * Math.sin(angleRad)) - ((platform.height / 2) * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight
                ],
            
                // bot left SHADOW
                [
                -((platform.width / 2) * Math.cos(angleRad)) - ((platform.height / 2) * Math.sin(angleRad)) + shadowX * wallShadowMultiplier,
                -((platform.width / 2) * Math.sin(angleRad)) + ((platform.height / 2) * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight + shadowY * wallShadowMultiplier
                ],

                // bot right SHADOW
                [
                ((platform.width / 2) * Math.cos(angleRad)) - ((platform.height / 2) * Math.sin(angleRad)) + shadowX * wallShadowMultiplier,
                ((platform.width / 2) * Math.sin(angleRad)) + ((platform.height / 2) * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight + shadowY * wallShadowMultiplier
                ],
                
                // top right SHADOW
                [
                ((platform.width / 2) * Math.cos(angleRad)) + ((platform.height / 2) * Math.sin(angleRad)) + shadowX * wallShadowMultiplier,
                ((platform.width / 2) * Math.sin(angleRad)) - ((platform.height / 2) * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight + shadowY * wallShadowMultiplier
                ],

                // top left SHADOW
                [
                -((platform.width / 2) * Math.cos(angleRad)) + ((platform.height / 2) * Math.sin(angleRad)) + shadowX * wallShadowMultiplier,
                -((platform.width / 2) * Math.sin(angleRad)) - ((platform.height / 2) * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight + shadowY * wallShadowMultiplier
                ],
                
            ]; // end of shadowPoints array

            platform.shadowPoints = CanvasArea.convexHull(platform.shadowPoints)
        }

        updatePlatform(PreviewWindow.platform)
        updatePlatform(PreviewWindow.wall)
        updatePlatform(PreviewWindow.endzone)


        // update all other colors
        MapEditor.loadedMap.style.lit_playerTop = CanvasArea.getShadedColor(MapEditor.loadedMap.style.playerColor, 1)
        MapEditor.loadedMap.style.lit_background = CanvasArea.getShadedColor(MapEditor.loadedMap.style.backgroundColor, 1)

        MapEditor.loadedMap.style.platformShadow = CanvasArea.getShadedColor(MapEditor.loadedMap.style.platformTopColor, 0.2) // 0.2 instead of 0 to pretend there's bounce lighting
        MapEditor.loadedMap.style.endzoneShadow = CanvasArea.getShadedColor(MapEditor.loadedMap.style.endZoneTopColor, 0.2)
        MapEditor.loadedMap.style.backgroundShadow = CanvasArea.getShadedColor(MapEditor.loadedMap.style.backgroundColor, 0.2)
    },


    render : function() {
        const ctx = CanvasArea.ctx

        // WINDOW
        ctx.fillStyle = MapEditor.loadedMap.style.lit_background
        ctx.fillRect(0,0,CanvasArea.canvas.width, CanvasArea.canvas.height)

        
        function renderPreviewItemShadow(platform) { // render lower shadows
            ctx.save();
            ctx.translate(PreviewWindow.x + platform.x, PreviewWindow.y + platform.y);

            ctx.fillStyle = MapEditor.loadedMap.style.backgroundShadow;

            ctx.beginPath();
            
            ctx.moveTo(platform.shadowPoints[0][0], platform.shadowPoints[0][1]);
            for (let i = platform.shadowPoints.length - 1; i > 0; i --) {
                ctx.lineTo(platform.shadowPoints[i][0], platform.shadowPoints[i][1]);
            }

            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }

        function renderPreviewItem(platform) {
                        
            const adjustedHeight = platform.wall ? MapEditor.loadedMap.style.wallHeight : 0 // for adding height to walls

            // DRAW PLATFORM TOP
            ctx.save(); // ROTATING 
            ctx.translate(PreviewWindow.x + platform.x, PreviewWindow.y + platform.y - adjustedHeight);
            ctx.rotate(platform.angle * Math.PI/180);

            
            ctx.fillStyle = platform.lit_topColor

            ctx.fillRect(-platform.width/2, -platform.height/2, platform.width, platform.height);

            ctx.restore(); // restores platform rotation NOT translation


            // SIDES OF PLATFORMS
            ctx.save();
            ctx.translate(PreviewWindow.x + platform.x, PreviewWindow.y + platform.y);

            const angleRad = platform.angle * (Math.PI/180);
            
            // platform angles should only be max of 90 and -90 in mapData
            // calculating shading works with any angle but sides arent draw because drawing "if statements" are hardcoded to 90 degrees

            if (-90 < platform.angle && platform.angle < 90) { // ALMOST ALWAYS RENDER BOTTOM SIDE. side2
                
                ctx.fillStyle = platform.sideColor2; // sideColor2
                ctx.beginPath();
                ctx.moveTo(platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) - adjustedHeight); // bot right
                ctx.lineTo(-platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), -platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) - adjustedHeight); // bot left
                ctx.lineTo(-platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), -platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight);
                ctx.lineTo(platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight);
                ctx.closePath();
                ctx.fill();
            }


            if (0 < platform.angle && platform.angle <= 90) { // side3

                ctx.fillStyle = platform.sideColor3; // sideColor3
                ctx.beginPath();
                ctx.moveTo(platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) - adjustedHeight); // bot right
                ctx.lineTo(platform.width/2 * Math.cos(angleRad) + (platform.height/2 * Math.sin(angleRad)), platform.width/2 * Math.sin(angleRad) - (platform.height/2 * Math.cos(angleRad)) - adjustedHeight); // top right
                ctx.lineTo(platform.width/2 * Math.cos(angleRad) + (platform.height/2 * Math.sin(angleRad)), platform.width/2 * Math.sin(angleRad) - (platform.height/2 * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight);
                ctx.lineTo(platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight);
                ctx.closePath();
                ctx.fill();
            }

            if (-90 <= platform.angle && platform.angle < 0) { // side1

                ctx.fillStyle = platform.sideColor1; // sideColor1
                ctx.beginPath();
                ctx.moveTo(-platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), -platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) - adjustedHeight); // bot left
                ctx.lineTo(-platform.width/2 * Math.cos(angleRad) + (platform.height/2 * Math.sin(angleRad)), -platform.width/2 * Math.sin(angleRad) - (platform.height/2 * Math.cos(angleRad)) - adjustedHeight); // top left
                ctx.lineTo(-platform.width/2 * Math.cos(angleRad) + (platform.height/2 * Math.sin(angleRad)), -platform.width/2 * Math.sin(angleRad) - (platform.height/2 * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight);
                ctx.lineTo(-platform.width/2 * Math.cos(angleRad) - (platform.height/2 * Math.sin(angleRad)), -platform.width/2 * Math.sin(angleRad) + (platform.height/2 * Math.cos(angleRad)) + MapEditor.loadedMap.style.platformHeight);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore(); // resets back from platform local space. player view space??
        
        
        } 

        renderPreviewItemShadow(this.wall)
        renderPreviewItemShadow(this.endzone)
        renderPreviewItemShadow(this.platform)

        renderPreviewItem(this.wall)
        renderPreviewItem(this.endzone)
        renderPreviewItem(this.platform)


        // DRAW PLAYER
        // Shadow
        ctx.save()
        ctx.translate(PreviewWindow.x + this.player.x, PreviewWindow.y + this.player.y)
        
        ctx.rotate(this.player.angle * Math.PI/180)

        ctx.fillStyle = MapEditor.loadedMap.style.platformShadow;
        ctx.fillRect(-15, -15, 30, 30)
        
        ctx.restore() // player translation and rotation

        
        // DRAWING PLAYER TOP
        ctx.save()
        ctx.translate(PreviewWindow.x + this.player.x, PreviewWindow.y + this.player.y - this.player.jumpValue - 32); 
        ctx.rotate(this.player.angle * Math.PI/180) // rotating canvas
        ctx.fillStyle = MapEditor.loadedMap.style.lit_playerTop;
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
        
        ctx.restore() // player translation and rotation
        

        // SIDES OF PLAYER
        ctx.save();
        
        const angleRad = this.player.angle * (Math.PI/180);
        const loopedAngle = this.player.angle;
        
        const originX = PreviewWindow.x + this.player.x
        const originY = PreviewWindow.y + this.player.y

        // GETTING CORNERS
        if (loopedAngle > 270 || loopedAngle < 90) { // BOT WALL

            const sideVector = new Vector2D3D(0,1).rotate(this.player.angle)
            const litPercent = sideVector.angleDifference(MapEditor.loadedMap.style.lightDirectionVector) / Math.PI
            ctx.fillStyle = CanvasArea.getShadedColor(MapEditor.loadedMap.style.playerColor, litPercent)

            ctx.beginPath();
            ctx.moveTo(originX - (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), originY - 32 - this.player.jumpValue - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(originX + (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), originY - 32 - this.player.jumpValue + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(originX + (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), originY - this.player.jumpValue + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(originX - (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), originY - this.player.jumpValue - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.closePath();
            ctx.fill();
        }
        
        if (0 < loopedAngle && loopedAngle < 180) { // RIGHT WALL

            const sideVector = new Vector2D3D(1,0).rotate(this.player.angle)
            const litPercent = sideVector.angleDifference(MapEditor.loadedMap.style.lightDirectionVector) / Math.PI
            ctx.fillStyle = CanvasArea.getShadedColor(MapEditor.loadedMap.style.playerColor, litPercent)

            ctx.beginPath();
            ctx.moveTo(originX + (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), originY - 32 - this.player.jumpValue + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(originX + (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), originY - 32 - this.player.jumpValue + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(originX + (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), originY - this.player.jumpValue + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(originX + (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), originY - this.player.jumpValue + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.closePath();
            ctx.fill();
        }
        
        if (90 < loopedAngle && loopedAngle < 270) { // TOP WALL
            
            const sideVector = new Vector2D3D(0,-1).rotate(this.player.angle)
            const litPercent = sideVector.angleDifference(MapEditor.loadedMap.style.lightDirectionVector) / Math.PI
            ctx.fillStyle = CanvasArea.getShadedColor(MapEditor.loadedMap.style.playerColor, litPercent)

            ctx.beginPath();
            ctx.moveTo(originX + (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), originY - 32 - this.player.jumpValue + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(originX + (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), originY - this.player.jumpValue + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(originX - (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), originY - this.player.jumpValue - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(originX - (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), originY - 32 - this.player.jumpValue - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.closePath();
            ctx.fill();
        }
        
        if (180 < loopedAngle && loopedAngle < 360) { // LEFT WALL
            
            const sideVector = new Vector2D3D(-1,0).rotate(this.player.angle)
            const litPercent = sideVector.angleDifference(MapEditor.loadedMap.style.lightDirectionVector) / Math.PI
            ctx.fillStyle = CanvasArea.getShadedColor(MapEditor.loadedMap.style.playerColor, litPercent)

            ctx.beginPath();
            ctx.moveTo(originX - (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), originY - 32 - this.player.jumpValue - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(originX - (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), originY - 32 - this.player.jumpValue - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(originX - (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), originY - this.player.jumpValue - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(originX - (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), originY - this.player.jumpValue - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }
}
