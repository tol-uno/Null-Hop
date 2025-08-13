const MapBrowser = { // should set back to 0 at some points
    // 0 = disabled
    // 1 = standard map browser
    // 2 = custom map browser
    state: 0, 
    scrollY: 0,
    scrollVel: 0,
    scrollVelAverager: new Averager(5),
    scrollAmount: null,
    selectedMapIndex: -1, // -1 == no map selected ... string of map name when a map is selected
    maxScroll: -40,
    infoBox: {
        x: window.outerWidth - 444,
        y: 128,
        width: 400, // set dynamically in .render()
        height: 162, // set dynamically
    },

    init: function () {

        function setMaxScroll() {
            MapBrowser.maxScroll = -40
            UserInterface.renderedButtons.forEach((button) => {
                if (button.x == 144) { MapBrowser.maxScroll -= 144 }
            })
            MapBrowser.maxScroll += 200 // bottom padding (empty space at bottom of browsers map list)
            if (MapBrowser.maxScroll > 0) { MapBrowser.maxScroll = 0 } // clipping it incase theres not more than 5 buttons
        }

        if (this.state == 1) { // Normal map browser (MAP BUTTON LAYOUTS ARE SET IN UserInterface)

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

            window.resolveLocalFileSystemURL(cordova.file.dataDirectory + "maps", function (fileSystem) {
                var reader = fileSystem.createReader();
                reader.readEntries((entries) => { // entries is an array of all the maps

                    // LOOP THROUGH EACH CUSTOM MAP
                    let mapNumber = 0
                    entries.forEach((mapEntry) => {

                        console.log(mapEntry.name)

                        // create toggle buttons for each map. These can be selected to preview map info. seperate play button will play them 

                        // create dynamic labeled button. KEEP IN SYNC WITH THE CHECK IN UPDATE AND RENDER FUNCS
                        let button = new Button(144, 50 + (76 * mapNumber), 256, "", "", 1, String(mapEntry.name.split(".")[0]), function (sync) {

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

    toggleAllButtons: function () {
        UserInterface.renderedButtons.forEach(button => {
            // dont toggle playTutorial
            if (button.toggle == 1 && button != btn_playTutorial) { button.toggle = 0 }
        })
    },

    update: function () {
        // called every frame when gamestate == 2

        // change the position of buttons on scroll
        if (TouchHandler.dragging == 1 && TouchHandler.touches[0].x > 110 && TouchHandler.touches[0].x < 460) {
            if (this.scrollAmount == null) { // start of scroll
                this.scrollAmount = this.scrollY
            }

            // is scrolling
            this.scrollAmount += TouchHandler.dragAmountY

            // sets scrollVel to average drag amount of past 10 frames
            this.scrollVelAverager.pushValue(TouchHandler.dragAmountY)
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
        if (this.scrollY > 0) { this.scrollY = 0 }
        if (this.scrollY < this.maxScroll) { this.scrollY = this.maxScroll }


        // applying scroll to buttons
        UserInterface.renderedButtons.forEach((button) => {
            if (button.x == 144) {
                button.y = button.savedY + this.scrollY
            }
        })



        // ENABLING and DISABLING btn_playMap and btn_playTutorial in browsers BESIDES map editor's

        if (MapEditor.editorState !== 5) { // not in map editors browser

            // ADDING btn_playmap
            if (this.selectedMapIndex != -1 && !UserInterface.renderedButtons.includes(btn_playMap)) {
                UserInterface.renderedButtons = UserInterface.renderedButtons.concat(btn_playMap)
            }
            // REMOVING  btn_playmap
            if (this.selectedMapIndex == -1 && UserInterface.renderedButtons.includes(btn_playMap)) {
                UserInterface.renderedButtons = UserInterface.renderedButtons.filter(item => item !== btn_playMap);
            }

            // ADDING AND REMOVING btn_playTutorial
            if (this.state == 1 && this.selectedMapIndex == "Awakening" && !UserInterface.renderedButtons.includes(btn_playTutorial)) {
                UserInterface.renderedButtons = UserInterface.renderedButtons.concat(btn_playTutorial)
            }

            if (this.state == 1 && this.selectedMapIndex != "Awakening" && UserInterface.renderedButtons.includes(btn_playTutorial)) {
                UserInterface.renderedButtons = UserInterface.renderedButtons.filter(item => item !== btn_playTutorial);
            }

        } else {
            // in MapEditors browser
            // ADD AND REMOVE: btn_editMap, btn_shareMap, btn_deleteMap

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
            ) { UserInterface.renderedButtons = UserInterface.renderedButtons.slice(0, -3) }

        }

    },

    render: function () { // MOVE TO UserInterface.render()
        // called every frame when gamestate == 2
        // draw detail box for maps with title, time, and medals
        const ctx = UserInterfaceCanvas.ctx;
        ctx.save() // UI scale save
        ctx.scale(UserInterfaceCanvas.scale, UserInterfaceCanvas.scale)

        // DRAW MAP INFO BOX BG
        ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1 : UserInterface.lightColor_1;

        UserInterfaceCanvas.roundedRect(this.infoBox.x, this.infoBox.y, this.infoBox.width, this.infoBox.height, 24)
        ctx.fill()

        // DRAW infoBox's MAP NAME, TIME, AND MEDALS
        ctx.font = "32px BAHNSCHRIFT";
        ctx.fillStyle = (!UserInterface.darkMode) ? UserInterface.darkColor_1 : UserInterface.lightColor_1;

        if (this.selectedMapIndex != -1) { // Write map title and info
            
            const mapHasMedals = (UserInterface.leaderboards[this.selectedMapIndex] !== undefined)

            const mapTitle = UserInterface.truncateText(this.selectedMapIndex, mapHasMedals ? 200: 380)

            ctx.fillText(mapTitle, this.infoBox.x + 18, this.infoBox.y + 70)

            // DRAW YOUR TIME
            ctx.font = "18px BAHNSCHRIFT";
            const yourRecord = UserInterface.secondsToMinutes((UserInterface.records[this.selectedMapIndex] == undefined ? 0 : UserInterface.records[this.selectedMapIndex]))
            ctx.fillText("Your Time: " + yourRecord, this.infoBox.x + 18, this.infoBox.y + 115)

            // DRAW METALS
            if (mapHasMedals) { // if leaderboard medal list exists

                // TIME BOX
                const timeBox = {
                    x: this.infoBox.x + this.infoBox.width - 176,
                    y: this.infoBox.y, // not used (debug)
                    width: 164,
                    height: this.infoBox.height, // not used (debug)
                    midY: this.infoBox.y + this.infoBox.height/2,
                }

                // HIGHLIGHT MEDAL BOX SPECS
                const yourMedalBox = {
                    width: 164,
                    height: 46,
                    x: timeBox.x,
                    y: timeBox.midY - 23, // adjust later -- this is at silver position
                }

                // DRAWING BOX THAT HIGHLIGHTS YOUR MEDAL
                const personalBest = UserInterface.records[this.selectedMapIndex] ? UserInterface.records[this.selectedMapIndex] : 999999999
                let medal = null

                // set yourMedalBox.y
                if (personalBest <= UserInterface.leaderboards[this.selectedMapIndex].gold) {
                    medal = 1
                    yourMedalBox.y -= yourMedalBox.height
                } else if (personalBest <= UserInterface.leaderboards[this.selectedMapIndex].silver) {
                    medal = 2 
                } else if (personalBest <= UserInterface.leaderboards[this.selectedMapIndex].bronze) {
                    medal = 3
                    yourMedalBox.y += yourMedalBox.height
                }


                // draw highlight box
                if (medal !== null) {
                    // draw medal box shadow first 
                    ctx.fillStyle = "rgba(0, 0, 0, 0.25)"
                    UserInterfaceCanvas.roundedRect(yourMedalBox.x + 6, yourMedalBox.y + 6, yourMedalBox.width, yourMedalBox.height, 12) // radius is slightly bigger for shadow
                    ctx.fill()
                
                    // draw actual box
                    ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1 : UserInterface.lightColor_1;
                    ctx.strokeStyle = (!UserInterface.darkMode) ? UserInterface.darkColor_1 : UserInterface.lightColor_1;
                    UserInterfaceCanvas.roundedRect(yourMedalBox.x, yourMedalBox.y, yourMedalBox.width, yourMedalBox.height, 10)
                    ctx.lineWidth = 4
                    ctx.fill();
                    ctx.stroke();
                }


                // medals and times
                let halfFontHeight = 8
                let xOffset = 0
                let medalRadius = 12
                let medalShadow = false
                let edgeWidth = 3

                function setMedalParameters(number) { // sets specific parameters for each drawMedal
                    ctx.font = medal == number ? "30px BAHNSCHRIFT" : "24px BAHNSCHRIFT"
                    halfFontHeight = medal == number ? 10 : 8
                    xOffset = medal == number ? 18 : 0
                    medalRadius = medal == number ? 16 : 12
                    medalShadow = medal == number ? true : false
                    edgeWidth = medal == number ? 4 : 3
                    ctx.globalAlpha = (medal == number || medal == null) ? 1 : 0.5
                }

                ctx.fillStyle = (!UserInterface.darkMode) ? UserInterface.darkColor_1 : UserInterface.lightColor_1;
                ctx.textAlign = "right"

                setMedalParameters(1)
                ctx.fillText(UserInterface.secondsToMinutes(UserInterface.leaderboards[this.selectedMapIndex].gold), timeBox.x + timeBox.width - 6, timeBox.midY - 46 + halfFontHeight);
                ctx.globalAlpha = 1
                UserInterface.drawMedal(timeBox.x + timeBox.width - 124 - xOffset, timeBox.midY - 46, medalRadius, "#F1B62C", "#FDE320", edgeWidth, medalShadow)

                setMedalParameters(2)
                ctx.fillText(UserInterface.secondsToMinutes(UserInterface.leaderboards[this.selectedMapIndex].silver), timeBox.x + timeBox.width - 6, timeBox.midY + halfFontHeight);
                ctx.globalAlpha = 1
                UserInterface.drawMedal(timeBox.x + timeBox.width - 124 - xOffset, timeBox.midY, medalRadius, "#8C9A9B", "#D4D4D6", edgeWidth, medalShadow)

                setMedalParameters(3)
                ctx.fillText(UserInterface.secondsToMinutes(UserInterface.leaderboards[this.selectedMapIndex].bronze), timeBox.x + timeBox.width - 6, timeBox.midY + 46 + halfFontHeight);
                ctx.globalAlpha = 1
                UserInterface.drawMedal(timeBox.x + timeBox.width - 124 - xOffset, timeBox.midY + 46, medalRadius, "#E6823E", "#F4A46F", edgeWidth, medalShadow)

                ctx.textAlign = "left"
            }

            // DRAW "Play Tutorial" TEXT
            if (this.state == 1 && this.selectedMapIndex == "Awakening") {

                ctx.font = "24px BAHNSCHRIFT";
                ctx.fillStyle = (!UserInterface.darkMode) ? UserInterface.lightColor_1 : UserInterface.darkColor_1;
                ctx.fillText("Play Tutorial", screenWidthUI - 404, screenHeightUI - 62)
            }

        } else { // no map is selected
            if (this.state == 1) {
                ctx.font = "32px BAHNSCHRIFT";
                ctx.fillText("Select A Map", this.infoBox.x + 18, this.infoBox.y + 70)
            }

            if (this.state == 2) {
                ctx.font = "24px BAHNSCHRIFT";
                ctx.fillText("Import, or Create Custom ", this.infoBox.x + 58, this.infoBox.y + 64)
                ctx.fillText("Maps in the Map Editor", this.infoBox.x + 70, this.infoBox.y + 98)
            }
        }

        // Map BROWSER DEBUG TEXT
        // ctx.font = "8px BAHNSCHRIFT";
        // ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1: UserInterface.lightColor_1;
        // ctx.fillText("MapIndex: " + this.selectedMapIndex, 44, 200)
        // ctx.fillText("scrollAmount: " + this.scrollAmount, 44, 210)
        // ctx.fillText("scrollY: " + this.scrollY, 44, 220)
        // ctx.fillText("scrollVel: " + this.scrollVel, 44, 230)
        // ctx.fillText("scrollVelAverager: " + this.scrollVelAverager.frames, 44, 240)
        // ctx.fillText("maxScroll: " + this.maxScroll, 44, 250)

        ctx.restore() // UI scale restore


    }
}