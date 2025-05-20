class QueueItem {
    
    // Translate platform/checkpoint/playerstart
    // Resize platform
    // Rotate platform/checkpoint/playerstart
    // Select platforms/checkpoint/playerstart
    // Deselect platforms/checkpoint/playerstart
    // Create platform/checkpoint
    // Delete platform/checkpoint
    // Duplicate platform/checkpoint
    // Convert platform to wall / endzone
    // Change map settings / map color slider
    
    constructor(action, element, x, y, width, height, data) {
        this.action = action
        this.element = element
        this.xChange = x
        this.yChange = y
        this.widthChange = width
        this.heightChange = height
        this.dataChange = data
    }

    revertAction() {
        if (this.action == "translate") {
            MapEditor.loadedMap.platforms[this.element].x -= this.xChange
            MapEditor.loadedMap.platforms[this.element].y -= this.yChange
        }

        if (this.action == "resize") {
            MapEditor.loadedMap.platforms[this.element].x -= this.xChange
            MapEditor.loadedMap.platforms[this.element].y -= this.yChange
            MapEditor.loadedMap.platforms[this.element].width -= this.widthChange
            MapEditor.loadedMap.platforms[this.element].height -= this.heightChange
        }

        if (this.action == "rotate") {
            MapEditor.loadedMap.platforms[this.element].angle -= this.dataChange
        }
    }

}