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

        ui_tutorialTextWrapper.style.removeProperty("top");
    },

    setState: function (newState) {
        this.state = newState;

        switch (newState) {
            case 1: {
                UserInterface.switchToUiGroup(new Set([btn_mainMenu, ui_tutorialTextWrapper, ui_tutorialText, tutorial_swipe]));
                ui_tutorialText.textContent = "Slide horizontally to turn the player";
                break;
            }

            case 2: {
                UserInterface.removeUiElement(tutorial_swipe);
                UserInterface.addUiElement(tutorial_swipeVertical);
                ui_tutorialText.textContent = "Sliding vertically does NOT turn the player";
                break;
            }

            case 3: {
                UserInterface.removeUiElement(btn_next);
                UserInterface.removeUiElement(tutorial_swipeVertical);
                UserInterface.addUiElement(tutorial_swipe);
                tutorial_swipe.classList.add("zero-opacity");

                UserInterface.addUiElement(UserInterface.tutorial_targetCenter);

                Player.lookAngle.set(0, -1); // so that ur not already looking at a target
                ui_tutorialText.textContent = "Rotate the player to look at the rings: 0/6";

                // set up initial target stuff
                const circumference = Math.PI * 2 * 12; // 12 is radius of ring
                UserInterface.tutorial_arc.setAttribute("stroke-dasharray", circumference); // defines the length of the visible stroke
                const angle = this.targets[0][0];
                UserInterface.tutorial_targetCenter.style.setProperty("--angle", `${angle}deg`);

                break;
            }

            case 5: {
                ui_tutorialText.textContent = "Start jumping by pressing the jump button";
                UserInterface.addUiElement(btn_restart);
                UserInterface.addUiElement(btn_jump);
                UserInterface.addUiElement(tutorial_arrow);
                UserInterface.removeUiElement(tutorial_swipe);
                UserInterface.removeUiElement(UserInterface.tutorial_targetCenter);

                break;
            }

            case 6: {
                UserInterface.removeUiElement(tutorial_arrow);
                UserInterface.removeUiElement(ui_tutorialText);
                UserInterface.addUiElement(ui_speedometer);
                // start 1.8 second timer for jumping before moving to next state
                setTimeout(() => {
                    this.setState(7);
                }, 1800);
                break;
            }

            case 7: {
                // pause player after jumping for 1.8 seconds
                this.pausePlayer = true;

                UserInterface.removeUiElement(ui_speedometer);

                UserInterface.addUiElement(ui_tutorialText);
                ui_tutorialText.textContent = "Stay on the red platforms";
                UserInterface.addUiElement(btn_next);
                break;
            }

            case 8: {
                // wait for user to start swiping again (with arrow swipe graphic)
                UserInterface.removeUiElement(btn_next);
                ui_tutorialText.textContent = "Slide horizontally to change the direction of the player";
                UserInterface.addUiElement(tutorial_swipe);
                tutorial_swipe.classList.add("zero-opacity");

                document.addEventListener(
                    "touchstart",
                    () => {
                        this.setState(9);
                    },
                    { once: true }
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
                UserInterface.removeUiElement(ui_tutorialText);
                UserInterface.removeUiElement(tutorial_swipe);
                UserInterface.addUiElement(ui_speedometer);
                break;
            }

            case 10: {
                // Hit checkpoint. Show good stafe info and draw finger swipe to progess
                this.pausePlayer = true;
                UserInterface.addUiElement(tutorial_swipe);
                tutorial_swipe.classList.add("zero-opacity");

                UserInterface.addUiElement(ui_tutorialText);
                ui_tutorialText.textContent = "Slow and steady swipes increase speed";

                UserInterface.removeUiElement(ui_speedometer);

                document.addEventListener(
                    "touchstart",
                    () => {
                        this.setState(11);
                    },
                    { once: true }
                );

                break;
            }

            // 11 unpause

            case 12: {
                // Hit checkpoint. Turn smoothly text
                this.pausePlayer = true;
                UserInterface.addUiElement(tutorial_swipe);
                tutorial_swipe.classList.add("zero-opacity");

                UserInterface.addUiElement(ui_tutorialText);
                ui_tutorialText.textContent = "Turn smoothly to gain speed and clear the gap";

                UserInterface.removeUiElement(ui_speedometer);

                document.addEventListener(
                    "touchstart",
                    () => {
                        this.setState(13);
                    },
                    { once: true }
                );
                break;
            }

            // 13 unpause

            case 14: {
                // Hit checkpoint. Wall warning text
                this.pausePlayer = true;
                UserInterface.addUiElement(tutorial_swipe);
                tutorial_swipe.classList.add("zero-opacity");

                UserInterface.addUiElement(ui_tutorialText);
                ui_tutorialText.textContent = "Don't touch the walls!";

                UserInterface.removeUiElement(ui_speedometer);

                document.addEventListener(
                    "touchstart",
                    () => {
                        this.setState(15);
                    },
                    { once: true }
                );
                break;
            }

            // 15 unpause

            case 16: {
                // Hit checkpoint. Ednzone text
                this.pausePlayer = true;
                UserInterface.addUiElement(tutorial_swipe);
                tutorial_swipe.classList.add("zero-opacity");

                UserInterface.addUiElement(ui_tutorialText);
                ui_tutorialText.textContent = "Reach the gold endzone to finish the level";

                UserInterface.removeUiElement(ui_speedometer);

                document.addEventListener(
                    "touchstart",
                    () => {
                        this.setState(17);
                    },
                    { once: true }
                );
                break;
            }

            // 17 unpause

            case 18: {
                // Ending the level sets a new uiGroup so have to unhide stuff again

                UserInterface.addUiElement(btn_next);
                UserInterface.addUiElement(ui_tutorialTextWrapper);
                UserInterface.addUiElement(ui_tutorialText);
                ui_tutorialText.textContent = "Finish levels faster to earn medals ⇩";
                ui_tutorialTextWrapper.style.top = "24px";
                UserInterface.removeUiElement(ui_speedometer);

                UserInterface.setToggleState(btn_playTutorial, false);
                UserInterface.settings.playTutorial = false;
                UserInterface.writeSettings();
                // isActive needs to stay true so that btn_restart & btn_mainMenu KNOW they are in the tutorial and call Tutorial.reset() when pressed

                break;
            }

            case 19: {
                UserInterface.removeUiElement(btn_next);
                ui_tutorialText.innerHTML = `Click <span style="border: 2px solid var(--uiForegroundColor); border-radius: 50%; padding: 1px 6.5px 1px 7px;">×</span> to select a new level or <span style="border: 2px solid var(--uiForegroundColor); border-radius: 50%; padding: 0px 6px 2px 6px;">↺</span> to try again`;
                break;
            }

            // default: {
            // }
        }
    },

    update: function () {
        if (this.state == 0 && UserInterface.gamestate == 6) {
            // map is loaded
            this.setState(1);
            return;
        }

        if (this.state == 1 || this.state == 3 || this.state == 8 || this.state == 10 || this.state == 12 || this.state == 14 || this.state == 16) {
            if (TouchHandler.dragging || UserInterface.showVerticalWarning) {
                tutorial_swipe.classList.add("zero-opacity");
            } else {
                tutorial_swipe.classList.remove("zero-opacity");
            }
        }

        if (this.state == 1 && !UserInterface.activeUiGroup.has(btn_next)) {
            if (Math.abs(Player.lookAngle.getAngleInDegrees() - Map.playerStart.angle) > 45) {
                UserInterface.addUiElement(btn_next);
            }
            return;
        }

        if (this.state == 2) {
            if (TouchHandler.dragging) {
                tutorial_swipeVertical.classList.add("zero-opacity");
            } else {
                tutorial_swipeVertical.classList.remove("zero-opacity");
            }
            return;
        }

        if (this.state == 3) {
            if (this.targets[0][1] > 0) {
                if (Math.abs(Player.lookAngle.getAngleInDegrees() - this.targets[0][0]) < 8) {
                    this.targets[0][1] -= 60 * dt;
                    UserInterface.tutorial_dot.classList.remove("hidden"); // dont add or remove "hidden" class every frame -- only do when player first enters or leaves target's angle. Low priority FIX
                } else {
                    this.targets[0][1] = 50;
                    UserInterface.tutorial_dot.classList.add("hidden");
                }

                // Update the targets visually
                const circumference = Math.PI * 2 * 12; // 12 is radius of ring. Shouldnt calculate this every frame
                const completedPercent = 1 - this.targets[0][1] / 50; // between 0 -> 1
                UserInterface.tutorial_arc.setAttribute("stroke-dashoffset", circumference * completedPercent); // offset the start of the stroke's dashes
            } else {
                // remove first element
                this.targets.shift();

                if (this.targets.length == 0) {
                    this.setState(5); // skips state 4 (it was removed)
                    return;
                }

                ui_tutorialText.textContent = `Rotate the player to look at the rings: ${6 - this.targets.length}/6`;

                // change targets position
                const angle = this.targets[0][0];
                UserInterface.tutorial_targetCenter.style.setProperty("--angle", `${angle}deg`);
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
};
