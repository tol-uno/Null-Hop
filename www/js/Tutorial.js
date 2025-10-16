const Tutorial = {
    isActive : false,
    state : 0, //  20 stages in google doc
    // STATES SKIPPED / REMOVED: 4, 
    targets : [[240,50],[120,50],[180,50],[0,50],[60,50],[300,50]], // 1st number is target angle, 2nd is targets health
    timerStarted : false, // used to prevent multiple timers from being set every frame
    timerCompleted : false,
    liftedFinger : false,
    pausePlayer : false,
    animatePos : 0,
    animateVel : 0,
    decalLoadState : -1, // -1 no, 0 started load, 4 finished load (number of decals loaded)
    decalList : ["horizontal_finger", "vertical_finger", "finger", "arrow"],
    timeoutToCancel : null,

    reset : function() { // called on restart and when leaving level
        this.state = 0;
        this.targets = [[240,50],[120,50],[180,50],[0,50],[60,50],[300,50]];
        this.timerStarted = false;
        this.timerCompleted = false;
        this.liftedFinger = false;
        this.pausePlayer = false;
        this.animatePos = 0;
        this.animateVel = 0;
        clearTimeout(this.timeoutToCancel)
    },



    update : function() {
        if (UserInterface.gamestate == 2) { // in map browser
            if (MapBrowser.selectedMapIndex !== "Awakening") { // tutorial level not selected
                this.isActive = false;
            }
        } 

        // ONLY DO THESE CHECKS IF this.isActive

        if (this.state == 0) {
            if ((UserInterface.gamestate == 5 || UserInterface.gamestate == 6) && this.decalLoadState == -1) { // decals havn't started loading yet
                // INITIATE DECALS
                this.decalLoadState = 0

                window.resolveLocalFileSystemURL(cordova.file.applicationDirectory + "www/assets/images/decals/", (dirEntry) => {
                    // LOOP TO GET EACH DECAL IMAGE
                    for(let i = 0; i < this.decalList.length; i++) {

                        dirEntry.getFile(this.decalList[i] + ".svg", {create: false, exclusive: false}, (fileEntry) => {
                            fileEntry.file( (file) => {
                                const reader = new FileReader();
                                reader.onload = (e) => {
    
                                    const SVG = new DOMParser().parseFromString(e.target.result, "image/svg+xml").documentElement;                                
                                    SVG.getElementById("bg").style.fill = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1
                                    const SVG_string = new XMLSerializer().serializeToString(SVG);
                                    const SVG_blob = new Blob([SVG_string], {type: 'image/svg+xml'});
                                    const SVG_url = URL.createObjectURL(SVG_blob);
                                    this.decalList[i] = new Image()
                                    this.decalList[i].addEventListener("load", () => {
                                        //once image is loaded
                                        this.decalLoadState ++;
                                        URL.revokeObjectURL(SVG_url)
                                    }, {once: true});

                                    this.decalList[i].src = SVG_url
                                };
                                reader.onerror = (e) => alert(e.target.error.name);
                    
                                reader.readAsText(file)
                            })
                        }, () => {console.log(this.decalList[i] + ": no svg found");});
                    

                    } // end of for loop
                })
            }
            
            if (UserInterface.gamestate == 6) { // map is loaded
                // called early incase decals arent loaded yet. Dont want all buttons visible
                UserInterface.renderedButtons = [btn_mainMenu]

                if (this.decalLoadState == 4) {
                    this.state = 1;
                }
            }
        }

        if (this.state == 1) {
            this.timerCompleted = true;

            if (
                !UserInterface.renderedButtons.includes(btn_next) &&  
                Math.abs(Player.lookAngle.getAngleInDegrees() - Map.playerStart.angle) > 45
            ) {
                UserInterface.renderedButtons = UserInterface.renderedButtons.concat(btn_next)
            }
        }

        // state 2 has no wait timer on btn_next

        if (this.state == 3) {

            if (this.targets.length > 0) {

                if (this.targets[0][1] > 0) {

                    if (Math.abs(Player.lookAngle.getAngleInDegrees() - this.targets[0][0]) < 8) {
                        this.targets[0][1] -= (60 * dt);
                    } else { this.targets[0][1] = 50 }
    
                } else { this.targets.shift()} // remove first element

            } else { // All targets completed
                this.state = 5; // skip state 4
                UserInterface.switchToUiGroup(UserInterface.uiGroup_inLevel)
            }
        }

        if (this.state == 5) {
            if (UserInterface.levelState == 2) { // if Player is jumping
                this.state ++;
                Tutorial.animatePos = 0;
                Tutorial.animateVel = 0;
            }
        }

        if (!this.timerStarted && this.state == 6) { // timer to jump for 2 seconds
            this.timeoutToCancel = setTimeout(() => {
                this.timerStarted = false;
                this.state ++;
                this.pausePlayer = true
                UserInterface.switchToUiGroup(UserInterface.uiGroup_inLevel.concat(btn_next)) // THIS THROWS ERROR BC btn_next is old style btn

            }, 1800);
            this.timerStarted = true;
        }

        // state 7 has no wait timer on btn_next

        if (this.state == 8 || this.state == 10 || this.state == 12 || this.state == 14 || this.state == 16) { // wait for a bit then allow Player to progess by swiping
            if (!this.timerStarted && !this.timerCompleted) {
                this.timeoutToCancel = setTimeout(() => {this.timerStarted = false; this.timerCompleted = true}, 800);
                this.timerStarted = true;
                this.liftedFinger = false;
            }

            if (!TouchHandler.dragging) {this.liftedFinger = true}

            if (this.timerCompleted && TouchHandler.dragging == true && this.liftedFinger) {
                this.state ++; 
                this.pausePlayer = false
                this.timerCompleted = false
            }
        }

        if (this.state == 9) {
            if (Player.checkpointIndex == 4) {this.state ++; this.pausePlayer = true}
        }

        // 10 bundled w 8

        if (this.state == 11) {
            if (Player.checkpointIndex == 1) {this.state ++; this.pausePlayer = true}
        }

        // 12 bundled w 8

        if (this.state == 13) {
            if (Player.checkpointIndex == 2) {this.state ++; this.pausePlayer = true}
        }

        // 14 bundled w 8

        if (this.state == 15) {
            if (Player.checkpointIndex == 0) {this.state ++; this.pausePlayer = true}
        }

        // 16 bundled w 8

        if (this.state == 17) { // check if ended level
            if (UserInterface.levelState == 3 && Player.endSlow == 0) {
                this.state ++; 
                UserInterface.switchToUiGroup(UserInterface.uiGroup_inLevel.concat(btn_next)) // THIS THROWS ERROR BC btn_next is old style btn
            }
        }

        // state 18 has no wait timer on btn_next

    },


    render : function() {
        const ctx = UserInterfaceCanvas.ctx;
        ctx.save() // for canvas scaling
        ctx.scale(UserInterfaceCanvas.scale, UserInterfaceCanvas.scale)

        ctx.font = "22px BAHNSCHRIFT";
        const bg_color = UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1;
        const icon_color = !UserInterface.darkMode ? UserInterface.darkColor_1 : UserInterface.lightColor_1;

        // TUTORIAL DEBUG TEXT
        if (UserInterface.settings.debugText) {
            // ctx.fillText("state: " + this.state, midX - 200, 34)
            // ctx.fillText(this.targets, 300, midY_UI)
        }


        function drawTextPanel(text) {
            const textWidth = ctx.measureText(text).width

            ctx.fillStyle = bg_color
            UserInterfaceCanvas.roundedRect(midX_UI - 20 - textWidth/2, 38, textWidth + 38, 60, 20)
            ctx.fill()

            ctx.fillStyle = icon_color
            ctx.fillText(text, midX_UI - textWidth/2, 75)
            
            // resets position of btn_next so that it can pulse
            btn_next.x = midX_UI + textWidth/2 + 34
            btn_next.y = 40
        }


        function pulseNextButton() {

            speed = 0.006 // 0.002 makes it oscillate ~every second. smaller = faster, larger = slower.
            const animValue = Math.sin(performance.now() * speed);

            // Pulse btn_next
            btn_next.width = 60 + (-1 * animValue * 8)
            btn_next.height = 60 + (-1 * animValue * 8)
            // this relies on drawTextPanel reseting btn_next's position every frame
            btn_next.x += (60 - btn_next.width) / 2
            btn_next.y += (60 - btn_next.height) / 2
        }


        function drawFingerSwipe() {

            const speed = 0.002 // 0.002 makes it oscillate ~every second. smaller = faster, larger = slower.
            const animValue = Math.sin(performance.now() * speed); // Use a sin wave to occilate between -1 and 1

            if (TouchHandler.dragging == false && Tutorial.timerCompleted) {
                const image = Tutorial.decalList[0]
                ctx.drawImage(image, midX_UI - image.width/2 + (animValue * 116), screenHeightUI - image.height - 36)
            }
        }


        if (this.state == 1) {
            drawTextPanel("Slide horizontally to turn the player");

            drawFingerSwipe()
            pulseNextButton()
        }


        if (this.state == 2) {
            drawTextPanel("Sliding vertically does NOT turn the player")

            // Draw NO VERTICAL swipe decal
            const speed = 0.002 // 0.002 makes it oscillate ~every second. smaller = faster, larger = slower.           
            const animValue = Math.sin(performance.now() * speed); // Use a sin wave to occilate between -1 and 1
            //const animValueFast = Math.sin(performance.now() * speed * 3);

            if (TouchHandler.dragging == false) {
                const image = this.decalList[1]
                ctx.drawImage(image, midX_UI - 250, midY_UI - 60 + (animValue * 50))
            }

            pulseNextButton()
        }


        if (this.state == 3 && this.targets.length > 0) { // Targets

            const targetCounter = String(6 - this.targets.length + "/6")
            drawTextPanel("Rotate the player to look at the rings: " + targetCounter)
            
            ctx.save() // #4
            
            ctx.translate(midX_UI, midY_UI)
            ctx.rotate(this.targets[0][0] * Math.PI / 180)

            ctx.strokeStyle = Map.style.shadow_platformColor
            ctx.fillStyle = Map.style.shadow_platformColor
            ctx.lineWidth = 6
            ctx.lineCap = "round"

    
            // DRAW TARGET SHADOW
            if (this.targets[0][1] > 0) { // these two blocks could be a function. theyre called twice. Translate the ctx between the two
                ctx.beginPath()
                ctx.arc(58 , 0, 10, 0, (this.targets[0][1] / 50) * (2 * Math.PI));
                ctx.stroke()
            }

            // center dot that appears when looking at target
            if (this.targets[0][1] < 50 ) {
                ctx.beginPath()
                ctx.arc(58, 0, 4, 0, 2 * Math.PI);
                ctx.fill()
            }


            // move up for actual targets
            ctx.rotate(-this.targets[0][0] * Math.PI / 180) // have to unrotate first
            ctx.translate(0, -24)
            ctx.rotate(this.targets[0][0] * Math.PI / 180)

            ctx.strokeStyle = bg_color
            ctx.fillStyle = bg_color

            
            // DRAW ACTUAL TARGET
            if (this.targets[0][1] > 0) {
                ctx.beginPath()
                ctx.arc(58, 0, 10, 0, (this.targets[0][1] / 50) * (2 * Math.PI));
                ctx.stroke()
            }

            // center dot that appears when looking at target
            if (this.targets[0][1] < 50 ) {
                ctx.beginPath()
                ctx.arc(58, 0, 4, 0, 2 * Math.PI);
                ctx.fill()
            }

            ctx.restore() // #4
            
        }



        if (this.state == 5) {
            drawTextPanel("Start jumping by pressing the jump button")

            // DRAW ARROW
            const speed = 0.005 // 0.002 makes it oscillate ~every second. smaller = faster, larger = slower.
            const animValue = Math.sin(performance.now() * speed); // Use a sin wave to occilate between -1 and 1

            const image = this.decalList[3]
            ctx.drawImage(image, btn_jump.x + 132 + (animValue * 20), btn_jump.y + btn_jump.width/2 - image.height/2)
        }


        if (this.state == 7) {
            drawTextPanel("Stay on the red platforms")
            pulseNextButton()
        }

        
        if (this.state == 8) {
            drawTextPanel("Slide horizontally to change the direction of the player")
            drawFingerSwipe()
        }


        if (this.state == 10) {
            drawTextPanel("Slow and steady swipes increase speed")
            drawFingerSwipe()
            // graphic showing smooth turn vs sharp turn?
        }


        if (this.state == 12) {
            drawTextPanel("Turn smoothly to gain speed and clear the gap")
            drawFingerSwipe()
        }


        if (this.state == 14) {
            drawTextPanel("Don't touch the walls!")
            drawFingerSwipe()
        }


        if (this.state == 16) {
            drawTextPanel("Reach the gold endzone to finish the level")
            drawFingerSwipe()
        }


        if (this.state == 18) {
            drawTextPanel("Finish levels faster to earn medals")
            pulseNextButton()
        }


        if (this.state == 19) {
            drawTextPanel("Click here to select a new level")

            // DRAW ARROW
            const speed = 0.005 // 0.002 makes it oscillate ~every second. smaller = faster, larger = slower.
            // Use a sin wave to occilate between -1 and 1
            const animValue = Math.sin(performance.now() * speed);

            const image = this.decalList[3]
            ctx.drawImage(image, btn_mainMenu.x + 110 + (animValue * 20), btn_mainMenu.y + btn_mainMenu.width/2 - image.height/2)
        }

        ctx.restore() // for canvas scaling

    },

}
