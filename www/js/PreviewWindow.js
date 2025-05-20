const PreviewWindow = {

    style: null,
    platforms: [

        { // wall
            "x": 130,
            "y": 270,
            "width": 50,
            "height": 100,
            // "angle": 45,
            "angle": -30,
            "endzone": 0,
            "wall": 1
        },

        { // endzone
            "x": 300,
            "y": 245,
            "width": 50,
            "height": 50,
            // "angle": 45,
            "angle": 20,
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

    player: {
        "x": 225,
        "y": 308,
        "angle": 45,
        "jumpValue": 29
    },


    //called by buttons
    update: function () { // updates all lighting and shadows

        this.style = MapEditor.loadedMap.style

        this.platforms.forEach(platform => {
            MapEditor.updatePlatformCorners(platform)

            // GENERATE platform.hull
            // getting all corners needed for hull. need to consider walls that need upper corners

            const upperCorners = platform.wall ? [ // return empty array if not wall
                [
                    platform.corners[0][0],
                    platform.corners[0][1] - this.style.wallHeight
                ],
                [
                    platform.corners[1][0],
                    platform.corners[1][1] - this.style.wallHeight
                ],
                [
                    platform.corners[2][0],
                    platform.corners[2][1] - this.style.wallHeight
                ],
                [
                    platform.corners[3][0],
                    platform.corners[3][1] - this.style.wallHeight
                ],
            ] : []

            // midCorners == platforms.corners

            const lowerCorners = [
                [
                    platform.corners[0][0],
                    platform.corners[0][1] + this.style.platformHeight
                ],
                [
                    platform.corners[1][0],
                    platform.corners[1][1] + this.style.platformHeight
                ],
                [
                    platform.corners[2][0],
                    platform.corners[2][1] + this.style.platformHeight
                ],
                [
                    platform.corners[3][0],
                    platform.corners[3][1] + this.style.platformHeight
                ],
            ]

            const allHullPoints = platform.corners.concat(upperCorners).concat(lowerCorners)

            platform.hull = CanvasArea.convexHull(allHullPoints)


        })

        Map.setMapLighting()
    },


    // called in MapEditor.render()
    render: function () {
        CanvasArea.canvas.style.backgroundColor = MapEditor.loadedMap.style.shaded_backgroundColor

        // draw shadows
        this.platforms.forEach(platform => {
            Map.renderPlatformShadow(platform)
        })

        // draw platforms
        this.platforms.forEach(platform => {
            Map.renderPlatform(platform)
        })

        // RENDER PLAYER
        Player.initPlayer(this.player.x, this.player.y, this.player.angle)
        Player.jumpValue = this.player.jumpValue
        Player.render()
    }
}
