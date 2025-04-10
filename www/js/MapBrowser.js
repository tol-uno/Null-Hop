const MapBrowser = { // should set back to 0 at some points
    state : 0, // 0 = disabled, 1 = standard map browser, 2 = custom map browser
    scrollY: 0,
    scrollVel: 0,
    scrollVelAverager : new Averager(5),
    scrollAmount: null,
    selectedMapIndex: -1, // -1 == no map selected ... string of map name when a map is selected
    maxScroll: -50,

    init : function() {

        function setMaxScroll() {
            MapBrowser.maxScroll = -50
            UserInterface.renderedButtons.forEach((button) => {
                if (button.x == 300) {MapBrowser.maxScroll -= 100}
            })
            MapBrowser.maxScroll += 525 // 5 = buttons to offset
            if (MapBrowser.maxScroll > 0) {MapBrowser.maxScroll = 0} // clipping it incase theres not more than 5 buttons
        }

        if (this.state == 1) { // Normal map browser
            
            this.scrollY = 0
            this.scrollVel = 0
            this.selectedMapIndex = -1
        
            setMaxScroll()
        }

        if (this.state == 2) { // CUSTOM MAP BROWSER

            this.scrollY = 0
            this.scrollVel = 0
            this.selectedMapIndex = -1

            // access file system and set up all nessasary map buttons for the browser type
            // a horrible nested mess but it keeps everything firing in the right sequence
            //function initCustomMapBrowser(path){

            window.resolveLocalFileSystemURL(cordova.file.dataDirectory + "maps", function (fileSystem) {
                var reader = fileSystem.createReader();
                reader.readEntries((entries) => { // entries is an array of all the maps

                    // LOOP THROUGH EACH CUSTOM MAP
                    let mapNumber = 0
                    entries.forEach((mapEntry) => {

                        console.log(mapEntry.name)

                        // create toggle buttons for each map. These can be selected to preview map info. seperate play button will play them 

                        // create these with blank button icons. render() adds text ontop . ALSO CHANGE THE CHECK IN RENDER FUNC
                        let button = new Button(300, 50 + (100 * mapNumber), 280, "", "", 1, String(mapEntry.name.split(".")[0]), function (sync) {

                            if (sync) {
                                // doesnt need to sync toggle state
                                // used to detoggle map buttons when another one is selected
                                this.toggle = 0;
                            } else {
                                if (this.toggle) { // toggle off
                                    this.toggle = 0;
                                    MapBrowser.selectedMapIndex = -1
                                } else { // toggle on

                                    MapBrowser.toggleAllButtons();
                                    this.toggle = 1;
                                    MapBrowser.selectedMapIndex = this.label
                                }
                            }

                        })

                        UserInterface.renderedButtons = UserInterface.renderedButtons.concat([button])
                        mapNumber++
                        setMaxScroll()

                    }) // end of forEach loop                        
                }, (error) => { console.log(error) });
            }, (error) => { console.log(error) });
        }        
    },
    
    toggleAllButtons : function() {
        UserInterface.renderedButtons.forEach(button => {
            // dont toggle playTutorial
            if (button.toggle == 1 && button != btn_playTutorial) {button.toggle = 0}
        })
    },

    update : function() {
        // called every frame when gamestate == 2

        // changes the position of buttons on scroll
        if (TouchHandler.dragging == 1 && TouchHandler.touches[0].x * CanvasArea.scale > 250 && TouchHandler.touches[0].x * CanvasArea.scale < 650) {
            if (this.scrollAmount == null) { // start of scroll
                this.scrollAmount = this.scrollY
            }

            // is scrolling
            this.scrollAmount += TouchHandler.dragAmountY * CanvasArea.scale

            // sets scrollVel to average drag amount of past 10 frames
            this.scrollVelAverager.pushValue(TouchHandler.dragAmountY * CanvasArea.scale)
            this.scrollVel = this.scrollVelAverager.getAverage()

            this.scrollY = this.scrollAmount;

        } else { // not dragging

            if (this.scrollAmount != null) { // just stopped dragging
                this.scrollAmount = null
                this.scrollVelAverager.clear()
            }

            this.scrollY += this.scrollVel
            if (Math.abs(this.scrollVel) > 0.1) { // apply friction
                this.scrollVel -= this.scrollVel * 5 * dt
            } else {
                this.scrollVel = 0
            }
        }


        // stopping scrolling
        if (this.scrollY > 0) {this.scrollY = 0}
        if (this.scrollY < this.maxScroll) {this.scrollY = this.maxScroll}


        UserInterface.renderedButtons.forEach((button) => {
            if (button.x > 100 && button.x < 600) {
                button.y = button.savedY + this.scrollY
            }
        })



        // ENABLING and DISABLING btn_playMap and btn_playTutorial in browsers BESIDES map editor's

        if (MapEditor.editorState != 5) { // not in map editors browser
            
            // ADDING AND REMOVING btn_playmap
            if (this.selectedMapIndex != -1 && !UserInterface.renderedButtons.includes(btn_playMap)) {
                UserInterface.renderedButtons = UserInterface.renderedButtons.concat(btn_playMap)
            }
            
            if (this.selectedMapIndex == -1 && UserInterface.renderedButtons.includes(btn_playMap)) {
                UserInterface.renderedButtons = UserInterface.renderedButtons.filter(item => item !== btn_playMap);
            }

            // ADDING AND REMOVING btn_playTutorial
            if (this.selectedMapIndex == "Awakening" && !UserInterface.renderedButtons.includes(btn_playTutorial)) {
                UserInterface.renderedButtons = UserInterface.renderedButtons.concat(btn_playTutorial)
            }

            if (this.selectedMapIndex != "Awakening" && UserInterface.renderedButtons.includes(btn_playTutorial)) {
                UserInterface.renderedButtons = UserInterface.renderedButtons.filter(item => item !== btn_playTutorial);
            }

        } else {
            // in MapEditors browser
            // btn_editMap, btn_deleteMap, btn_shareMap
            
            if (
                this.selectedMapIndex != -1 &&
                !UserInterface.renderedButtons.includes(btn_editMap)
            ) {
                UserInterface.renderedButtons = UserInterface.renderedButtons.concat(btn_editMap)
                UserInterface.renderedButtons = UserInterface.renderedButtons.concat(btn_deleteMap)
                UserInterface.renderedButtons = UserInterface.renderedButtons.concat(btn_shareMap)
            }
            
            if (
                this.selectedMapIndex == -1 &&
                UserInterface.renderedButtons.includes(btn_editMap)
            ) {UserInterface.renderedButtons = UserInterface.renderedButtons.slice(0,-3)}

        }

    },

    render : function() {
        // needs to be called every frame when gamestate == 2
        // draw labels for maps
        // desription of maps
        const ctx = CanvasArea.ctx;

        // DRAW INFO BOX BG
        ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1: UserInterface.lightColor_1;
        const boxHeight = (MapEditor.editorState == 5) ? 160 : 300 // shorter map editor box to give room for 3 buttons
        CanvasArea.roundedRect(CanvasArea.canvas.width - 500, 50, 400, boxHeight, 25)
        ctx.fill()
        
        // DRAW TEXT INFO BOX
        ctx.font = "45px BAHNSCHRIFT";
        ctx.fillStyle = (!UserInterface.darkMode) ? UserInterface.darkColor_1: UserInterface.lightColor_1;

        if (this.selectedMapIndex != -1) { // Write map title and info
            const mapTitle = UserInterface.truncateText(this.selectedMapIndex, 340)
            ctx.fillText(mapTitle, CanvasArea.canvas.width - 475, 120)

            ctx.font = "25px BAHNSCHRIFT";
            const yourRecord = UserInterface.secondsToMinutes((UserInterface.records[this.selectedMapIndex] == undefined ? 0 : UserInterface.records[this.selectedMapIndex]))
            ctx.fillText("Your Time: " + yourRecord, CanvasArea.canvas.width - 475, 170)
            if (MapEditor.editorState !== 5 && UserInterface.leaderboards[this.selectedMapIndex] !== undefined) { // if not in MapEditor & leaderboards exist
                let rank
                if (UserInterface.records[this.selectedMapIndex] == undefined) {
                    rank = "None"
                } else {

                    rank = 1
                    for (const [key, value] of Object.entries(UserInterface.leaderboards[this.selectedMapIndex])) {
                        
                        if (UserInterface.records[this.selectedMapIndex] <= value) { // if your record is less than this leaderboard time
                            break;
                        } else {
                            rank ++
                        }
                    }
                    rank = UserInterface.getOrdinalSuffix(rank)
                }
                
                ctx.fillText("Leaderboard Rank: " + rank, CanvasArea.canvas.width - 475, 220)
                
                // GOLD SILVER AND BRONZE ICONS
                if (rank == "1st") {
                    ctx.fillStyle = "#fedc32" // gold
                }

                if (rank == "2nd") {
                    ctx.fillStyle = "#dbdbdd" // silver
                }

                if (rank == "3rd") {
                    ctx.fillStyle = "#f6b386" // bronze
                }

                CanvasArea.roundedRect(CanvasArea.canvas.width - 200, 186, 34, 34, 10)
                ctx.fill()
            }


        } else { // no map is selected
            if (this.state == 1) {
                ctx.fillText("Select A Map", CanvasArea.canvas.width - 475, 110)
            }

            if (this.state == 2) {
                ctx.font = "30px BAHNSCHRIFT";
                ctx.fillText("Import, or Create", CanvasArea.canvas.width - 475, 100)
                ctx.fillText("Custom Maps in the", CanvasArea.canvas.width - 475, 140)
                ctx.fillText("Map Editor", CanvasArea.canvas.width - 475, 180)
            }
        }


        // Map BROWSER DEBUG TEXT
        // ctx.font = "15px BAHNSCHRIFT";
        // ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1: UserInterface.lightColor_1;
        // ctx.fillText("MapIndex: " + this.selectedMapIndex, 80, 200)
        // ctx.fillText("scrollAmount: " + this.scrollAmount, 80, 220)
        // ctx.fillText("scrollY: " + this.scrollY, 80, 240)
        // ctx.fillText("scrollVel: " + this.scrollVel, 80, 260)
        // ctx.fillText("scrollVelAverager: " + this.scrollVelAverager.frames, 80, 280)
        // ctx.fillText("maxScroll: " + this.maxScroll, 80, 300)

    }
}