const Tutorial = {
    isActive: false,
    state: 0, //  20 stages in google doc
    // STATES SKIPPED / REMOVED: 4,
    targets: [
        [240, 50],
        [120, 50],
        [180, 50],
        [0, 50],
        [60, 50],
        [300, 50],
    ], // 1st number is target angle, 2nd is targets health
    pausePlayer: false,

    reset: function () {
        // called on restart and when leaving level
        this.state = 0;
        this.targets = [
            [240, 50],
            [120, 50],
            [180, 50],
            [0, 50],
            [60, 50],
            [300, 50],
        ];
        this.pausePlayer = false;

        ui_tutorialTextWrapper.domReference?.style.removeProperty("top");
    },

    setState: function (newState) {
        this.state = newState;

        switch (newState) {
            case 1: {
                UserInterface.switchToUiGroup(new Set([btn_mainMenu, ui_tutorialTextWrapper, ui_swipeHorizontal, ui_strafeHelper, ui_warningContainer]));
                // ui_tutorialTextWrapper adds btn_next and ui_tutorialText
                ui_tutorialText.domReference.textContent = "Slide horizontally to turn the player";
                break;
            }

            case 2: {
                UserInterface.removeUiElement(ui_swipeHorizontal);
                UserInterface.addUiElement(ui_swipeVertical);
                // leave btn_next un-hidden
                ui_tutorialText.domReference.textContent = "Sliding vertically does NOT turn the player";
                break;
            }

            case 3: {
                btn_next.domReference.classList.add("hidden");
                UserInterface.removeUiElement(ui_swipeVertical);
                UserInterface.addUiElement(ui_swipeHorizontal);
                ui_swipeHorizontal.domReference.classList.add("zero-opacity");

                UserInterface.addUiElement(ui_targetCenter);

                Player.lookAngle.set(0, -1); // so that ur not already looking at a target
                ui_tutorialText.domReference.textContent = "Rotate the player to look at the rings: 0/6";

                // set up initial target stuff
                const circumference = Math.PI * 2 * 12; // 12 is radius of ring
                ui_targetCenter.domReference.querySelector("#arc").setAttribute("stroke-dasharray", circumference); // defines the length of the visible stroke
                const angle = this.targets[0][0];
                ui_targetCenter.domReference.style.setProperty("--angle", `${angle}deg`);

                break;
            }

            case 5: {
                ui_tutorialText.domReference.textContent = "Start jumping by pressing the jump button";
                UserInterface.addUiElement(btn_jump);
                UserInterface.addUiElement(ui_arrow);
                UserInterface.removeUiElement(ui_swipeHorizontal);
                UserInterface.removeUiElement(ui_targetCenter);

                break;
            }

            case 6: {
                UserInterface.removeUiElement(ui_arrow);
                ui_tutorialText.domReference.classList.add("hidden");
                UserInterface.addUiElement(ui_speedometer);
                UserInterface.addUiElement(ui_jumpStats);
                // Start 1.8 second timer for jumping before moving to next state
                // It's possible for the player to fail and restart before this timer ends. This sets state to 5 in handleNoCpRestart()
                // Need to make sure player is still on state 6 when this timer ends
                setTimeout(() => {
                    if (this.state === 6) {
                        this.setState(7);
                    }
                }, 1800);
                break;
            }

            case 7: {
                // pause player after jumping for 1.8 seconds
                this.pausePlayer = true;

                UserInterface.removeUiElement(ui_speedometer);

                ui_tutorialText.domReference.classList.remove("hidden");
                ui_tutorialText.domReference.textContent = "Stay on the red platforms";
                btn_next.domReference.classList.remove("hidden");
                break;
            }

            case 8: {
                // wait for user to start swiping again (with arrow swipe graphic)
                btn_next.domReference.classList.add("hidden");
                ui_tutorialText.domReference.textContent = "Slide horizontally to change the direction of the player";
                UserInterface.addUiElement(ui_swipeHorizontal);
                ui_swipeHorizontal.domReference.classList.add("zero-opacity");

                document.addEventListener(
                    "touchstart",
                    () => {
                        this.setState(9);
                    },
                    { once: true },
                );
                break;
            }

            case 9:
            case 11:
            case 13:
            case 15:
            case 17: {
                // Unpause.
                this.pausePlayer = false;
                ui_tutorialText.domReference.classList.add("hidden");
                UserInterface.removeUiElement(ui_swipeHorizontal);
                UserInterface.addUiElement(ui_speedometer);
                break;
            }

            case 10: {
                // Hit checkpoint. Show good stafe info and draw finger swipe to progess
                this.pausePlayer = true;
                UserInterface.addUiElement(ui_swipeHorizontal);
                ui_swipeHorizontal.domReference.classList.add("zero-opacity");

                ui_tutorialText.domReference.classList.remove("hidden");
                ui_tutorialText.domReference.textContent = "Slow and steady swipes increase speed";

                UserInterface.removeUiElement(ui_speedometer);

                document.addEventListener(
                    "touchstart",
                    () => {
                        this.setState(11);
                    },
                    { once: true },
                );

                break;
            }

            // 11 unpause

            case 12: {
                // Hit checkpoint. Turn smoothly text
                this.pausePlayer = true;
                UserInterface.addUiElement(ui_swipeHorizontal);
                ui_swipeHorizontal.domReference.classList.add("zero-opacity");

                ui_tutorialText.domReference.classList.remove("hidden");
                ui_tutorialText.domReference.textContent = "Turn smoothly to gain speed and clear the gap";

                UserInterface.removeUiElement(ui_speedometer);

                document.addEventListener(
                    "touchstart",
                    () => {
                        this.setState(13);
                    },
                    { once: true },
                );
                break;
            }

            // 13 unpause

            case 14: {
                // Hit checkpoint. Wall warning text
                this.pausePlayer = true;
                UserInterface.addUiElement(ui_swipeHorizontal);
                ui_swipeHorizontal.domReference.classList.add("zero-opacity");

                ui_tutorialText.domReference.classList.remove("hidden");
                ui_tutorialText.domReference.textContent = "Don't touch the walls!";

                UserInterface.removeUiElement(ui_speedometer);

                document.addEventListener(
                    "touchstart",
                    () => {
                        this.setState(15);
                    },
                    { once: true },
                );
                break;
            }

            // 15 unpause

            case 16: {
                // Hit checkpoint. Reach Endzone text
                this.pausePlayer = true;
                UserInterface.addUiElement(ui_swipeHorizontal);
                ui_swipeHorizontal.domReference.classList.add("zero-opacity");

                ui_tutorialText.domReference.classList.remove("hidden");
                ui_tutorialText.domReference.textContent = "Reach the gold endzone to finish the level";

                UserInterface.removeUiElement(ui_speedometer);

                document.addEventListener(
                    "touchstart",
                    () => {
                        this.setState(17);
                    },
                    { once: true },
                );
                break;
            }

            // 17 unpause

            case 18: {
                // Ending the level sets a new uiGroup so have to add and remove stuff again

                UserInterface.addUiElement(ui_tutorialTextWrapper);
                btn_next.domReference.classList.remove("hidden");
                ui_tutorialText.domReference.textContent = "Finish levels faster to earn medals";
                UserInterface.removeUiElement(ui_speedometer);
                UserInterface.removeUiElement(btn_restart); // would get in the way of text. Add in next state

                UserInterface.settings.playTutorial = false;
                UserInterface.writeSettings();
                // isActive needs to stay true so that btn_restart & btn_mainMenu KNOW they are in the tutorial and call Tutorial.reset() when pressed

                break;
            }

            case 19: {
                ui_tutorialText.domReference.classList.add("hidden");
                btn_next.domReference.classList.add("hidden");
                UserInterface.addUiElement(btn_restart);
                // Add two labels next to the main menu and restart buttons
                UserInterface.addUiElement(ui_menuLabel);
                UserInterface.addUiElement(ui_restartLabel);
                break;
            }
        }
    },

    update: function () {
        if (this.state == 0 && UserInterface.gamestate == 6) {
            // map is loaded
            this.setState(1);
            return;
        }

        if (this.state == 1 || this.state == 3 || this.state == 8 || this.state == 10 || this.state == 12 || this.state == 14 || this.state == 16) {
            // this is inefficient FIX. trying to add/remove class every frame
            if (TouchHandler.dragging || UserInterface.showVerticalWarning) {
                ui_swipeHorizontal.domReference.classList.add("zero-opacity");
            } else {
                ui_swipeHorizontal.domReference.classList.remove("zero-opacity");
            }
        }

        if (this.state == 1 && btn_next.domReference.classList.contains("hidden")) {
            if (Math.abs(Player.lookAngle.getAngleInDegrees() - Map.playerStart.angle) > 45) {
                btn_next.domReference.classList.remove("hidden");
            }
            return;
        }

        if (this.state == 2) {
            if (TouchHandler.dragging || UserInterface.showVerticalWarning) {
                // this is inefficient FIX. trying to add/remove class every frame
                // update to domReference
                ui_swipeVertical.domReference.classList.add("zero-opacity");
            } else {
                ui_swipeVertical.domReference.classList.remove("zero-opacity");
            }
            return;
        }

        if (this.state == 3) {
            if (this.targets[0][1] > 0) {
                if (Math.abs(Player.lookAngle.getAngleInDegrees() - this.targets[0][0]) < 8) {
                    this.targets[0][1] -= 60 * dt;
                    ui_targetCenter.domReference.querySelector("#dot").classList.remove("hidden"); // dont add or remove "hidden" class every frame -- only do when player first enters or leaves target's angle. Low priority FIX
                } else {
                    this.targets[0][1] = 50;
                    ui_targetCenter.domReference.querySelector("#dot").classList.add("hidden");
                }

                // Update the targets visually
                const circumference = Math.PI * 2 * 12; // 12 is radius of ring. Shouldnt calculate this every frame
                const completedPercent = 1 - this.targets[0][1] / 50; // between 0 -> 1
                ui_targetCenter.domReference.querySelector("#arc").setAttribute("stroke-dashoffset", circumference * completedPercent); // offset the start of the stroke's dashes
            } else {
                // remove first element
                this.targets.shift();

                if (this.targets.length == 0) {
                // if (this.targets.length < 6) { // uncomment this to bypass target practice
                    this.setState(5); // skips state 4 (it was removed)
                    return;
                }

                ui_tutorialText.domReference.textContent = `Rotate the player to look at the rings: ${6 - this.targets.length}/6`;

                // change targets position
                const angle = this.targets[0][0];
                ui_targetCenter.domReference.style.setProperty("--angle", `${angle}deg`);
            }

            return;
        }

        if (this.state == 5 && UserInterface.levelState == 2) {
            // wait for user to press jump button
            this.setState(6);
            return;
        }

        if (this.state == 9 && Player.checkpointIndex == 4) {
            this.setState(10);
            return;
        }

        if (this.state == 11 && Player.checkpointIndex == 1) {
            this.setState(12);
            return;
        }

        if (this.state == 13 && Player.checkpointIndex == 2) {
            this.setState(14);
            return;
        }

        if (this.state == 15 && Player.checkpointIndex == 0) {
            this.setState(16);
            return;
        }

        if (this.state == 17 && UserInterface.levelState == 3 && Player.endSlow == 0) {
            this.setState(18);
            return;
        }
    },

    handleNoCpRestart: function () {
        // Called when players fails tutorial without any checkpoints yet
        // Restarting without checkpoint sets a new uiGroup so have to add and remove stuff again
        // Go back to state: 5 to show jump button arrow and text

        UserInterface.removeUiElement(btn_restart);
        UserInterface.removeUiElement(ui_timerBox);
        UserInterface.removeUiElement(ui_speedometer);
        UserInterface.removeUiElement(ui_jumpStats);

        UserInterface.addUiElement(ui_tutorialTextWrapper);

        this.setState(5);
    },
};
