const MapBrowser = {
    // should set back to 0 at some points
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

    init: async function () {
        if (this.state === 1) {
            // Standard Map Browser
            this.scrollY = 0;
            this.scrollVel = 0;
            this.selectedMapIndex = -1;
        } else if (this.state === 2) {
            // Custom Map Browser
            this.scrollY = 0;
            this.scrollVel = 0;
            this.selectedMapIndex = -1;

            const container = document.getElementById("custom-map-list-container");
            container.innerHTML = ""; // clear all previous custom buttons

            try {
                const entries = await new Promise((resolve, reject) => {
                    window.resolveLocalFileSystemURL(
                        cordova.file.dataDirectory + "maps",
                        function (fileSystem) {
                            const reader = fileSystem.createReader();
                            reader.readEntries(resolve, reject);
                        },
                        reject
                    );
                });

                for (const mapEntry of entries) {
                    const mapName = String(mapEntry.name.split(".")[0]);
                    const buttonHTML = `
                    <div>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 256 128">
                            <circle cx="24" cy="24" r="10" stroke="var(--uiForegroundColor)" stroke-width="4" />
                            <circle cx="232" cy="24" r="10" stroke="var(--uiForegroundColor)" stroke-width="4" />
                            <circle cx="24" cy="104" r="10" stroke="var(--uiForegroundColor)" stroke-width="4" />
                            <circle cx="232" cy="104" r="10" stroke="var(--uiForegroundColor)" stroke-width="4" />
                        </svg>
                        <span>${mapName}</span>
                    </div>
                `;

                    const button = document.createElement("button");
                    button.classList.add("btn_customMap");
                    button.innerHTML = buttonHTML.trim();
                    button.func = () => {
                        MapBrowser.selectedMapIndex = mapName;
                        MapBrowser.updateMapBrowserState();
                    };
                    container.appendChild(button);
                    UserInterface.addUiElement(button); // removed the true flag to see if it will work
                }
            } catch (error) {
                console.error("Failed to load custom maps:", error);
            }
        }

        // Set maxScroll
        const container = document.querySelector(".map-list-container:not(.hidden)");
        if (container) {
            this.maxScroll = container.scrollHeight - container.clientHeight;
            this.maxScroll *= -1;
        }

        this.updateMapBrowserState();
    },

    update: function () {
        // called every frame when gamestate == 2

        // change the position of buttons on scroll
        // update this to just check if touch is within new DOM button container
        if (TouchHandler.dragging == 1 && TouchHandler.touches[0].x > 110 && TouchHandler.touches[0].x < 460) {
            if (this.scrollAmount == null) {
                // start of scroll
                this.scrollAmount = this.scrollY;
            }

            // is scrolling
            this.scrollAmount += TouchHandler.dragAmountY;

            // sets scrollVel to average drag amount of past 10 frames
            this.scrollVelAverager.pushValue(TouchHandler.dragAmountY);
            this.scrollVel = this.scrollVelAverager.getAverage();

            this.scrollY = this.scrollAmount;
        } else {
            // not dragging

            if (this.scrollAmount != null) {
                // just stopped dragging
                this.scrollAmount = null;
                this.scrollVelAverager.clear();
            }

            this.scrollY += this.scrollVel;
            if (Math.abs(this.scrollVel) > 0.1) {
                // apply friction
                this.scrollVel -= this.scrollVel * 5 * dt;
            } else {
                this.scrollVel = 0;
            }
        }

        // stopping scrolling
        if (this.scrollY > 0) {
            this.scrollY = 0;
        }
        if (this.scrollY < this.maxScroll) {
            this.scrollY = this.maxScroll;
        }

        document.querySelector(".map-list-container:not(.hidden)").scrollTop = -this.scrollY;
    },

    updateMapBrowserState: function () {
        // updates the MapInfoBox and adds/ removes the nessesary buttons when map buttons are clicked
        this.updateMapInfoBox();

        // ENABLING and DISABLING btn_playMap, btn_playTutorial, btn_editMap, btn_shareMap, btn_deleteMap

        if (MapEditor.editorState !== 5) {
            // NOT in map editors browser

            // ADDING btn_playMap
            if (this.selectedMapIndex != -1 && !UserInterface.activeUiGroup.has(btn_playMap)) {
                UserInterface.addUiElement(btn_playMap);
            }
            // REMOVING btn_playMap
            if (this.selectedMapIndex == -1 && UserInterface.activeUiGroup.has(btn_playMap)) {
                UserInterface.removeUiElement(btn_playMap);
            }

            // ADDING AND REMOVING btn_playTutorial toggle
            if (this.state == 1 && this.selectedMapIndex == "Awakening" && !UserInterface.activeUiGroup.has(btn_playTutorial)) {
                UserInterface.addUiElement(btn_playTutorial);
            }

            if (this.state == 1 && this.selectedMapIndex != "Awakening" && UserInterface.activeUiGroup.has(btn_playTutorial)) {
                UserInterface.removeUiElement(btn_playTutorial);
            }
        } else {
            // in MapEditors browser
            // ADD & REMOVE: btn_editMap, btn_shareMap, btn_deleteMap

            if (this.selectedMapIndex != -1 && !UserInterface.activeUiGroup.has(btn_editMap)) {
                UserInterface.addUiElement(btn_editMap);
                UserInterface.addUiElement(btn_shareMap);
                UserInterface.addUiElement(btn_deleteMap);
            }

            if (this.selectedMapIndex == -1 && UserInterface.activeUiGroup.has(btn_editMap)) {
                UserInterface.removeUiElement(btn_editMap);
                UserInterface.removeUiElement(btn_shareMap);
                UserInterface.removeUiElement(btn_deleteMap);
            }
        }
    },

    // this could be inside of updateMapBrowserState
    updateMapInfoBox: function () {
        if (this.selectedMapIndex == -1) {
            ui_mapInfoBox.querySelector(".mapName").textContent = "Select A Map";
            ui_mapInfoBox.querySelector(".yourTime").textContent = ``;
            ui_mapInfoBox.querySelector(".medalList").classList.add("hidden");
            return;
        }

        ui_mapInfoBox.querySelector(".mapName").textContent = this.selectedMapIndex;

        const personalBest = UserInterface.records[this.selectedMapIndex];
        const yourTimeInSeconds = UserInterface.secondsToMinutes(personalBest == undefined ? 0 : personalBest);
        ui_mapInfoBox.querySelector(".yourTime").textContent = `Your Time: ${yourTimeInSeconds}`;

        // update medal times and active medal OR hide medal list
        const mapMedals = UserInterface.medals[this.selectedMapIndex];
        if (mapMedals !== undefined) {
            ui_mapInfoBox.querySelector(".medalList").classList.remove("hidden");

            const goldMedal = ui_mapInfoBox.querySelector(".gold");
            const silverMedal = ui_mapInfoBox.querySelector(".silver");
            const bronzeMedal = ui_mapInfoBox.querySelector(".bronze");

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
            ui_mapInfoBox.querySelector(".medalList").classList.add("hidden");
        }
    },
};
