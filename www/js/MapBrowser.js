const MapBrowser = {
    state: 1,
    // 1: standard
    // 2: custom
    // 3: editor

    scrollPos: 0,
    scrollVel: 0,
    scrollVelAverager: new Averager(5),
    scrollAmount: null,
    selectedMapIndex: -1, // -1 == no map selected ... becomes a string of map name when a map is selected
    maxScroll: -40,
    infoBox: {
        x: window.outerWidth - 444,
        y: 128,
        width: 400, // set dynamically in .render()
        height: 162, // set dynamically
    },
    container: null,
    customMapNamesCache: [], // used for validating new map names in map editor

    init: async function () {
        this.scrollPos = 0;
        this.scrollVel = 0;
        this.selectedMapIndex = -1;

        this.container = document.querySelector(".map-list-container:not(.hidden)"); // there are two containers (standard and custom) only one should be visible/used at a time. Set by uiGroups

        // if in one of the two Map Browsers that use custom maps
        if (this.state >= 2) {
            this.container.innerHTML = ""; // clear all previous custom buttons
            this.customMapNamesCache = [];

            // Fetch custom maps file entries from cordova file system
            // map each map entry to a new uiElement
            // Add each uiElement to the active map-list-container
            // Modify the domReference for the button manually with name and colored circles
            // Can't insert these at ${mapName} anymore because they'd get parsed as subElements

            try {
                const entries = await new Promise((resolve, reject) => {
                    window.resolveLocalFileSystemURL(
                        cordova.file.dataDirectory + "maps",
                        function (fileSystem) {
                            const reader = fileSystem.createReader();
                            reader.readEntries(resolve, reject);
                        },
                        reject,
                    );
                });

                for (const mapEntry of entries) {
                    const mapName = String(mapEntry.name.split(".")[0]);
                    this.customMapNamesCache.push(mapName); // used for validating new map names in map editor

                    const button = new uiElement(
                        "button",

                        () => {
                            return /* HTML */ parseComponentIntoDomElement`
                                <button class="btn_customMap">
                                    <div>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 256 128">
                                            <path fill="var(--uiBackgroundColor)" d="M0 0h256v128H0z" />
                                            <circle cx="27" cy="27" r="13" stroke="var(--uiForegroundColor)" stroke-width="4" />
                                            <circle cx="229" cy="27" r="13" stroke="var(--uiForegroundColor)" stroke-width="4" />
                                            <circle cx="27" cy="101" r="13" stroke="var(--uiForegroundColor)" stroke-width="4" />
                                            <circle cx="229" cy="101" r="13" stroke="var(--uiForegroundColor)" stroke-width="4" />
                                        </svg>
                                        <span></span>
                                    </div>
                                </button>
                            `;
                        },

                        () => {
                            MapBrowser.selectedMapIndex = mapName;
                            MapBrowser.updateMapBrowserUI();
                        },
                    );

                    UserInterface.addUiElement(button, this.container);

                    // insert name into button span
                    button.domReference.querySelector("span").textContent = mapName;

                    // color each of the circles
                    const randomColors = generateColorsFromString(mapName);
                    const circles = button.domReference.querySelectorAll("circle");
                    for (let i = 0; i < circles.length; i++) {
                        circles[i].style.fill = randomColors[i];
                    }
                }
            } catch (error) {
                console.error("Failed to load custom maps:", error);
            }
        }

        this.setMaxScroll();

        this.updateMapBrowserUI();
    },

    setMaxScroll: function () {
        this.maxScroll = this.container.scrollHeight - this.container.clientHeight;
        this.maxScroll *= -1;
    },

    update: function () {
        // called every frame when gamestate == 2
        // change the position of buttons on scroll

        // touch is within DOM container
        if (
            TouchHandler.dragging == 1 &&
            TouchHandler.touches[0].x > this.container.offsetLeft &&
            TouchHandler.touches[0].x < this.container.offsetLeft + this.container.clientWidth &&
            TouchHandler.touches[0].y > this.container.offsetTop &&
            TouchHandler.touches[0].y < this.container.offsetTop + this.container.clientHeight
        ) {
            // if start of a new scroll
            if (this.scrollAmount == null) {
                this.scrollAmount = this.scrollPos;
            }

            // get right drag direction based on orientation
            // applicableTouchDrag = UserInterface.orientation == "landscape" ? TouchHandler.dragAmountY : TouchHandler.dragAmountX;
            applicableTouchDrag = TouchHandler.dragAmountY;

            this.scrollAmount += applicableTouchDrag;

            // sets scrollVel to average drag amount of past 10 frames
            this.scrollVelAverager.pushValue(applicableTouchDrag);
            this.scrollVel = this.scrollVelAverager.getAverage();

            this.scrollPos = this.scrollAmount;
        } else {
            // not dragging

            if (this.scrollAmount != null) {
                // just stopped dragging
                this.scrollAmount = null;
                this.scrollVelAverager.clear();
            }

            this.scrollPos += this.scrollVel;
            if (Math.abs(this.scrollVel) > 0.1) {
                // apply friction
                this.scrollVel -= this.scrollVel * 5 * dt;
            } else {
                this.scrollVel = 0;
            }
        }

        // stopping scrolling
        if (this.scrollPos > 0) {
            this.scrollPos = 0;
        }
        if (this.scrollPos < this.maxScroll) {
            this.scrollPos = this.maxScroll;
        }

        // if (UserInterface.orientation == "landscape") {
        //     this.container.scrollTop = -this.scrollPos;
        // } else {
        //     this.container.scrollLeft = -this.scrollPos;
        // }

        this.container.scrollTop = -this.scrollPos;
    },

    updateMapBrowserUI: function () {
        // updates the MapInfoBox and adds/ removes the nessesary buttons when map buttons are clicked

        // ENABLING and DISABLING btn_playMap, toggle_playTutorial, btn_editMap, btn_shareMap, btn_deleteMap

        if (this.state != 3) {
            // In standard or custom MapBrowser

            // ADDING btn_playMap
            if (this.selectedMapIndex != -1) {
                UserInterface.addUiElement(btn_playMap);
            } else {
                // REMOVING btn_playMap
                UserInterface.removeUiElement(btn_playMap);
            }

            // ADDING toggle_playTutorial toggle
            if (this.state == 1 && this.selectedMapIndex == "Awakening") {
                UserInterface.addUiElement(toggle_playTutorial);
                UserInterface.setToggleState(toggle_playTutorial, UserInterface.settings.playTutorial);
            }

            // REMOVING toggle_playTutorial toggle
            if (this.state == 1 && this.selectedMapIndex != "Awakening") {
                UserInterface.removeUiElement(toggle_playTutorial);
            }
        } else {
            // In MapEditor's browser
            // ADD & REMOVE: btn_editMap, btn_shareMap, btn_deleteMap
            // these might want to be a visability toggle instead of adding and removing FIX?
            if (this.selectedMapIndex != -1) {
                UserInterface.addUiElement(btn_editMap);
                UserInterface.addUiElement(btn_shareMap);
                UserInterface.addUiElement(btn_deleteMap);
            } else {
                UserInterface.removeUiElement(btn_editMap);
                UserInterface.removeUiElement(btn_shareMap);
                UserInterface.removeUiElement(btn_deleteMap);
            }
        }

        // SET UP MAP INFO BOX
        if (this.selectedMapIndex == -1) {
            ui_mapInfoBox.domReference.querySelector(".mapName").textContent = "Select A Map";
            ui_mapInfoBox.domReference.querySelector(".yourTime").textContent = ``;
            ui_mapInfoBox.domReference.querySelector(".medalList").classList.add("hidden");
            return;
        }

        ui_mapInfoBox.domReference.querySelector(".mapName").textContent = this.selectedMapIndex;

        const personalBest = UserInterface.records[this.selectedMapIndex];
        const yourTimeInSeconds = UserInterface.secondsToMinutes(personalBest == undefined ? 0 : personalBest);
        ui_mapInfoBox.domReference.querySelector(".yourTime").textContent = `Your Time: ${yourTimeInSeconds}`;

        // update medal times and active medal OR hide medal list
        const mapMedals = UserInterface.medals[this.selectedMapIndex];
        if (mapMedals !== undefined) {
            ui_mapInfoBox.domReference.querySelector(".medalList").classList.remove("hidden");

            const goldMedal = ui_mapInfoBox.domReference.querySelector(".gold");
            const silverMedal = ui_mapInfoBox.domReference.querySelector(".silver");
            const bronzeMedal = ui_mapInfoBox.domReference.querySelector(".bronze");

            // update times
            goldMedal.textContent = UserInterface.secondsToMinutes(mapMedals.gold);
            silverMedal.textContent = UserInterface.secondsToMinutes(mapMedals.silver);
            bronzeMedal.textContent = UserInterface.secondsToMinutes(mapMedals.bronze);

            // remove activeMedal from all
            goldMedal.classList.remove("activeMedal");
            silverMedal.classList.remove("activeMedal");
            bronzeMedal.classList.remove("activeMedal");

            // set activeMedal
            if (personalBest <= mapMedals.gold) {
                goldMedal.classList.add("activeMedal");
            } else if (personalBest <= mapMedals.silver) {
                silverMedal.classList.add("activeMedal");
            } else if (personalBest <= mapMedals.bronze) {
                bronzeMedal.classList.add("activeMedal");
            }
        } else {
            // No medals -> hide medal list
            ui_mapInfoBox.domReference.querySelector(".medalList").classList.add("hidden");
        }
    },
};
