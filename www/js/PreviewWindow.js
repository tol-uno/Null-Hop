const PreviewWindow = {

    style : null,
    platforms : [

        { // wall
            "x": 130,
            "y": 270,
            "width": 50,
            "height": 100,
            "angle": 45,
            "endzone": 0,
            "wall": 1
        },

        { // endzone
            "x": 300,
            "y": 245,
            "width": 50,
            "height": 50,
            "angle": 45,
            "endzone": 1,
            "wall": 0
        },

        { // platform
            "x": 225,
            "y": 320,
            "width": 70,
            "height": 70,
            "angle": 45,
            "endzone": 0,
            "wall": 0
        },
    ],
    
    player : {
        "x" : 225,
        "y" : 308,
        "angle" : 45,
        "jumpValue" : 29
    },


    //called by buttons
    update : function() { // updates all lighting and shadows
        this.style = MapEditor.loadedMap.style

        this.platforms.forEach(platform => {
            MapEditor.updatePlatformCorners(platform)
        })

        Map.setMapLighting()
    },


    // called in MapEditor.render()
    render : function() {
        const ctx = CanvasArea.ctx

        // draw shadows
        this.platforms.forEach(platform => {
            Map.renderPlatformShadow(platform)
        })

        // draw platforms
        this.platforms.forEach(platform => {
            Map.renderPlatform(platform)
        })


        // DRAW PLAYER
        // shadow
        ctx.save()
        ctx.translate(this.player.x, this.player.y)
        
        ctx.rotate(this.player.angle * Math.PI/180)

        ctx.fillStyle = MapEditor.loadedMap.style.shadow_platformColor;
        ctx.fillRect(-15, -15, 30, 30)
        
        ctx.restore() // player translation and rotation

        
        // DRAWING PLAYER TOP
        ctx.save()
        ctx.translate(this.player.x, this.player.y - this.player.jumpValue - 32); 
        ctx.rotate(this.player.angle * Math.PI/180) // rotating canvas
        ctx.fillStyle = MapEditor.loadedMap.style.shaded_playerColor;
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
        
        // GETTING CORNERS
        if (loopedAngle > 270 || loopedAngle < 90) { // BOT WALL

            const sideVector = new Vector2D3D(0,1).rotate(this.player.angle)
            const litPercent = sideVector.angleDifference(MapEditor.loadedMap.style.lightDirectionVector) / Math.PI
            ctx.fillStyle = CanvasArea.getShadedColor(MapEditor.loadedMap.style.playerColor, litPercent)

            ctx.beginPath();
            ctx.moveTo(this.player.x - (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), this.player.y - 32 - this.player.jumpValue - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(this.player.x + (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), this.player.y - 32 - this.player.jumpValue + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(this.player.x + (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), this.player.y - this.player.jumpValue + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(this.player.x - (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), this.player.y - this.player.jumpValue - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.closePath();
            ctx.fill();
        }
        
        if (0 < loopedAngle && loopedAngle < 180) { // RIGHT WALL

            const sideVector = new Vector2D3D(1,0).rotate(this.player.angle)
            const litPercent = sideVector.angleDifference(MapEditor.loadedMap.style.lightDirectionVector) / Math.PI
            ctx.fillStyle = CanvasArea.getShadedColor(MapEditor.loadedMap.style.playerColor, litPercent)

            ctx.beginPath();
            ctx.moveTo(this.player.x + (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), this.player.y - 32 - this.player.jumpValue + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(this.player.x + (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), this.player.y - 32 - this.player.jumpValue + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(this.player.x + (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), this.player.y - this.player.jumpValue + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(this.player.x + (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), this.player.y - this.player.jumpValue + (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.closePath();
            ctx.fill();
        }
        
        if (90 < loopedAngle && loopedAngle < 270) { // TOP WALL
            
            const sideVector = new Vector2D3D(0,-1).rotate(this.player.angle)
            const litPercent = sideVector.angleDifference(MapEditor.loadedMap.style.lightDirectionVector) / Math.PI
            ctx.fillStyle = CanvasArea.getShadedColor(MapEditor.loadedMap.style.playerColor, litPercent)

            ctx.beginPath();
            ctx.moveTo(this.player.x + (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), this.player.y - 32 - this.player.jumpValue + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(this.player.x + (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), this.player.y - this.player.jumpValue + (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(this.player.x - (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), this.player.y - this.player.jumpValue - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(this.player.x - (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), this.player.y - 32 - this.player.jumpValue - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.closePath();
            ctx.fill();
        }
        
        if (180 < loopedAngle && loopedAngle < 360) { // LEFT WALL
            
            const sideVector = new Vector2D3D(-1,0).rotate(this.player.angle)
            const litPercent = sideVector.angleDifference(MapEditor.loadedMap.style.lightDirectionVector) / Math.PI
            ctx.fillStyle = CanvasArea.getShadedColor(MapEditor.loadedMap.style.playerColor, litPercent)

            ctx.beginPath();
            ctx.moveTo(this.player.x - (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), this.player.y - 32 - this.player.jumpValue - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.lineTo(this.player.x - (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), this.player.y - 32 - this.player.jumpValue - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(this.player.x - (16 * Math.cos(angleRad) + (16 * Math.sin(angleRad))), this.player.y - this.player.jumpValue - (16 * Math.sin(angleRad) - (16 * Math.cos(angleRad))));
            ctx.lineTo(this.player.x - (16 * Math.cos(angleRad) - (16 * Math.sin(angleRad))), this.player.y - this.player.jumpValue - (16 * Math.sin(angleRad) + (16 * Math.cos(angleRad))));
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }
}
