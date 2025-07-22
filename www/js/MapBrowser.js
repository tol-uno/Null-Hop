const MapBrowser = { // should set back to 0 at some points
    state: 0, // 0 = disabled, 1 = standard map browser, 2 = custom map browser
    scrollY: 0,
    scrollVel: 0,
    scrollVelAverager: new Averager(5),
    scrollAmount: null,
    selectedMapIndex: -1, // -1 == no map selected ... string of map name when a map is selected
    maxScroll: -50,
    infoBox: {
        x: window.outerWidth - 470,
        y: 130,
        width: 390, // set dynamically in .render()
        height: 150, // set dynamically
    },

    init: function () {

        function setMaxScroll() {
            MapBrowser.maxScroll = -50
            UserInterface.renderedButtons.forEach((button) => {
                if (button.x == 160) { MapBrowser.maxScroll -= 76 }
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
            // function initCustomMapBrowser(path){

            window.resolveLocalFileSystemURL(cordova.file.dataDirectory + "maps", function (fileSystem) {
                var reader = fileSystem.createReader();
                reader.readEntries((entries) => { // entries is an array of all the maps

                    // LOOP THROUGH EACH CUSTOM MAP
                    let mapNumber = 0
                    entries.forEach((mapEntry) => {

                        console.log(mapEntry.name)

                        // create toggle buttons for each map. These can be selected to preview map info. seperate play button will play them 

                        // create dynamic labeled button. KEEP IN SYNC WITH THE CHECK IN UPDATE AND RENDER FUNCS
                        let button = new Button(160, 50 + (76 * mapNumber), 250, "", "", 1, String(mapEntry.name.split(".")[0]), function (sync) {

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

        // changes the position of buttons on scroll
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
            if (button.x == 160) {
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

        // change size of map details box depending on if in MapEditor and if there are medals
        if (MapEditor.editorState == 5) { // in map editor browser
            this.infoBox.width = 220
            this.infoBox.height = 120 // for shorter map detail box in map editor's browser
        } else { // NOT in map editor browser
            this.infoBox.height = 140
            if (UserInterface.leaderboards[this.selectedMapIndex] !== undefined) { // if there are medals
                this.infoBox.width = 390
                this.infoBox.x = window.outerWidth - 470
            } else {
                this.infoBox.width = 220
                this.infoBox.x = window.outerWidth - 300
            }
        }

        UserInterfaceCanvas.roundedRect(this.infoBox.x, this.infoBox.y, this.infoBox.width, this.infoBox.height, 20)
        ctx.fill()

        // DRAW MAP INFO BOX CONTENT
        ctx.font = "28px BAHNSCHRIFT";
        ctx.fillStyle = (!UserInterface.darkMode) ? UserInterface.darkColor_1 : UserInterface.lightColor_1;

        if (this.selectedMapIndex != -1) { // Write map title and info
            const mapTitle = UserInterface.truncateText(this.selectedMapIndex, 190)
            ctx.fillText(mapTitle, this.infoBox.x + 20, this.infoBox.y + 46)

            if (MapEditor.editorState != 5) { // if not in MapEditor browser
                // DRAW YOUR TIME
                ctx.font = "20px BAHNSCHRIFT";
                const yourRecord = UserInterface.secondsToMinutes((UserInterface.records[this.selectedMapIndex] == undefined ? 0 : UserInterface.records[this.selectedMapIndex]))
                ctx.fillText("Your Time: " + yourRecord, this.infoBox.x + 20, this.infoBox.y + 120)

                // DRAW METALS
                if (UserInterface.leaderboards[this.selectedMapIndex] !== undefined) { // if leaderboards exist



                    // TIME BOX
                    const timeBox = {
                        x: this.infoBox.x + this.infoBox.width - 180,
                        y: this.infoBox.y, // not used (debug)
                        width: 172, // not used (debug)
                        height: this.infoBox.height, // not used (debug)
                        midY: this.infoBox.y + this.infoBox.height/2,
                    }


                    // HIGHLIGHT MEDAL BOX SPECS
                    const highlightBox = {
                        x: timeBox.x,
                        y: null, // set later
                        width: 172,
                        height: 58,
                    }

                    let medal = null


                    // DRAW HIGHLIGHT MEDAL BOX
                    ctx.fillStyle = (UserInterface.darkMode) ? UserInterface.darkColor_1 : UserInterface.lightColor_1;
                    ctx.strokeStyle = (!UserInterface.darkMode) ? UserInterface.darkColor_1 : UserInterface.lightColor_1;

                    ctx.save(); // save for shadow changes

                    ctx.shadowColor = "rgba(0, 0, 0, 0.21)";
                    ctx.shadowOffsetX = 10
                    ctx.shadowOffsetY = 10


                    // highlight medal box
                    const personalBest = UserInterface.records[this.selectedMapIndex] ? UserInterface.records[this.selectedMapIndex] : 99999999

                    // set hightlight box y and draw it
                    if (personalBest <= UserInterface.leaderboards[this.selectedMapIndex].gold) {
                        medal = 1
                        highlightBox.y = timeBox.midY - 50 - highlightBox.height / 2
                    } else if (personalBest <= UserInterface.leaderboards[this.selectedMapIndex].silver) {
                        medal = 2
                        highlightBox.y = timeBox.midY - highlightBox.height / 2
                    } else if (personalBest <= UserInterface.leaderboards[this.selectedMapIndex].bronze) {
                        medal = 3
                        highlightBox.y = timeBox.midY + 50 - highlightBox.height / 2
                    }

                    if (medal !== null) {
                        ctx.shadowOffsetX = 8
                        ctx.shadowOffsetY = 8

                        UserInterfaceCanvas.roundedRect(highlightBox.x, highlightBox.y, highlightBox.width, highlightBox.height, 12)
                        ctx.fill();

                        ctx.shadowColor = "transparent"
                        ctx.lineWidth = 4
                        ctx.stroke();
                    }


                    ctx.restore(); // restore shadow changes


                    // medals and times
                    let halfFontHeight = 8
                    let xOffset = 0
                    let medalRadius = 12
                    let medalShadow = false

                    function testMedal(number) { // sets specific parameters for each drawMedal
                        ctx.font = medal == number ? "30px BAHNSCHRIFT" : "24px BAHNSCHRIFT"
                        halfFontHeight = medal == number ? 10 : 8
                        xOffset = medal == number ? 10 : 0
                        medalRadius = medal == number ? 15 : 12
                        medalShadow = medal == number ? true : false
                        ctx.globalAlpha = (medal == number || medal == null) ? 1 : 0.5
                    }

                    ctx.fillStyle = (!UserInterface.darkMode) ? UserInterface.darkColor_1 : UserInterface.lightColor_1;

                    testMedal(1)
                    ctx.fillText(UserInterface.secondsToMinutes(UserInterface.leaderboards[this.selectedMapIndex].gold), timeBox.x + 58 - xOffset, timeBox.midY - 50 + halfFontHeight);
                    ctx.globalAlpha = 1
                    UserInterface.drawMedal(timeBox.x + 36 - xOffset, timeBox.midY - 50, medalRadius, "#f1b62c", "#fde320", 3, medalShadow)

                    testMedal(2)
                    ctx.fillText(UserInterface.secondsToMinutes(UserInterface.leaderboards[this.selectedMapIndex].silver), timeBox.x + 58 - xOffset, timeBox.midY + halfFontHeight);
                    ctx.globalAlpha = 1
                    UserInterface.drawMedal(timeBox.x + 36 - xOffset, timeBox.midY, medalRadius, "#8c9a9b", "#d4d4d6", 3, medalShadow)

                    testMedal(3)
                    ctx.fillText(UserInterface.secondsToMinutes(UserInterface.leaderboards[this.selectedMapIndex].bronze), timeBox.x + 58 - xOffset, timeBox.midY + 50 + halfFontHeight);
                    ctx.globalAlpha = 1
                    UserInterface.drawMedal(timeBox.x + 36 - xOffset, timeBox.midY + 50, medalRadius, "#e78b4c", "#f4a46f", 3, medalShadow)





                    // test medals box outline
                    // UserInterfaceCanvas.roundedRect(timeBox.x, timeBox.y, timeBox.width, timeBox.height, 5)
                    // ctx.lineWidth = 1
                    // ctx.stroke()
                }
            }

        } else { // no map is selected
            if (this.state == 1) {
                ctx.fillText("Select A Map", this.infoBox.x + 20, this.infoBox.y + 46)
            }

            if (this.state == 2) {
                ctx.font = "20px BAHNSCHRIFT";
                ctx.fillText("Import, or Create", this.infoBox.x + 20, this.infoBox.y + 40)
                ctx.fillText("Custom Maps in the", this.infoBox.x + 20, this.infoBox.y + 70)
                ctx.fillText("Map Editor", this.infoBox.x + 20, this.infoBox.y + 100)
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

        ctx.restore() // UI scale restore


    }
}