const PreviewWindow = {
    style: null,
    
    platforms: [
        // wall
        {x: 240, y: 170, width: 50, height: 100, angle: -30, endzone: 0, wall:1},
    
        // platform
        {x: 355, y: 170, width: 70, height: 70, angle: 45, endzone: 0, wall: 0},

        // endzone
        {x: 460, y: 165, width: 50, height: 50, angle: 20, endzone: 1, wall: 0},
    ],

    player: {x: 355, y: 168, angle: 45, jumpValue: 29},
    

    // called by buttons
    update: function () {
        // updates all lighting and shadows

        this.style = MapEditor.loadedMap.style;

        this.platforms.forEach((platform) => {
            MapEditor.updatePlatformCorners(platform);

            // GENERATE platform.hull
            // getting all corners needed for hull. need to consider walls that need upper corners

            const upperCorners = platform.wall
                ? [
                      // return empty array if not wall
                      [platform.corners[0][0], platform.corners[0][1] - this.style.wallHeight],
                      [platform.corners[1][0], platform.corners[1][1] - this.style.wallHeight],
                      [platform.corners[2][0], platform.corners[2][1] - this.style.wallHeight],
                      [platform.corners[3][0], platform.corners[3][1] - this.style.wallHeight],
                  ]
                : [];

            // midCorners == platforms.corners

            const lowerCorners = [
                [platform.corners[0][0], platform.corners[0][1] + this.style.platformHeight],
                [platform.corners[1][0], platform.corners[1][1] + this.style.platformHeight],
                [platform.corners[2][0], platform.corners[2][1] + this.style.platformHeight],
                [platform.corners[3][0], platform.corners[3][1] + this.style.platformHeight],
            ];

            const allHullPoints = platform.corners.concat(upperCorners).concat(lowerCorners);

            platform.hull = CanvasArea.convexHull(allHullPoints);
        });

        Map.setMapLighting(this);
    },

    // called in MapEditor.render()
    render: function () {
        CanvasArea.canvas.style.backgroundColor = MapEditor.loadedMap.style.shaded_backgroundColor;

        CanvasArea.ctx.save();
        CanvasArea.ctx.scale(1.5, 1.5);

        // DRAW ALL PLATFORM SHADOWS IN this.platforms
        CanvasArea.ctx.fillStyle = MapEditor.loadedMap.style.shadow_backgroundColor;

        CanvasArea.ctx.beginPath();
        for (const platform of this.platforms) {
            CanvasArea.ctx.moveTo(
                platform.x + platform.shadowPoints[0][0],
                platform.y + platform.shadowPoints[0][1]
            );
            for (let i = platform.shadowPoints.length - 1; i > 0; i--) {
                CanvasArea.ctx.lineTo(
                    platform.x + platform.shadowPoints[i][0],
                    platform.y + platform.shadowPoints[i][1]
                );
            }
            CanvasArea.ctx.closePath();
        }
        CanvasArea.ctx.fill(); // Fill all shadows


        // DRAW ALL PLATFORMS IN this.platforms
        for (const platform of this.platforms) {
            Map.renderPlatform(CanvasArea.ctx, MapEditor.loadedMap, platform);
        }

        // RENDER PLAYER
        Player.initPlayer(this.player.x, this.player.y, this.player.angle);
        Player.jumpValue = this.player.jumpValue;
        Player.render();

        CanvasArea.ctx.restore();
    },
};
