const btn_translate = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_translate" class="short-button">
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 38 38">
                        <path
                            fill="var(--myForegroundColor)"
                            d="M20.22 4.64a1.5 1.5 0 0 0-2.44 0l-3.52 4.9c-.71 1 0 2.38 1.22 2.38h1.9v3.96c0 .83-.67 1.5-1.5 1.5H11.9v-1.9a1.5 1.5 0 0 0-2.37-1.22l-4.9 3.52a1.5 1.5 0 0 0 0 2.44l4.9 3.52c1 .71 2.37 0 2.37-1.22v-1.9h3.97c.83 0 1.5.67 1.5 1.5v3.97h-1.9a1.5 1.5 0 0 0-1.22 2.37l3.52 4.9c.6.83 1.84.83 2.44 0l3.52-4.9c.71-1 0-2.37-1.22-2.37h-1.9v-3.97c0-.83.67-1.5 1.5-1.5h3.96v1.9a1.5 1.5 0 0 0 2.38 1.22l4.9-3.52a1.5 1.5 0 0 0 0-2.44l-4.9-3.52c-1-.71-2.38 0-2.38 1.22v1.9h-3.96a1.5 1.5 0 0 1-1.5-1.5v-3.96h1.9a1.5 1.5 0 0 0 1.22-2.38l-3.52-4.9Z"
                        />
                    </svg>
                </div>
            </button>
        `;
    },

    () => {
        // for multiselect:
        // get center average of all selected elements
        // create an array containing each element with its xKey / yKey
        // do a selectedElements.forEach loop to run logic on each element

        let avgMidX = 0;
        let avgMidY = 0;
        let conditioningArray = [];

        // populate conditioningArray
        for (let i = 0; i < MapEditor.selectedElements.length; i++) {
            // PRE CONDITIONING FOR THE SELECTED ELEMENTS
            let item = {
                element: null,
                xKey: "x", // these are used to distingish wheather to use triggerX1 or just x when dealing with checkpoints
                yKey: "y", // implemented this system so that the btn_translate logic can be done with one section of code
                offSet: 0, // amount to offset the bnt_translate from the center of the element
            };

            if (MapEditor.selectedElements[i] == "playerStart") {
                // if playerStart is selected
                item.element = MapEditor.loadedMap.playerStart;
                item.offSet = 32 / MapEditor.zoom;
            } else if (Array.isArray(MapEditor.selectedElements[i])) {
                const checkpoint = MapEditor.selectedElements[i];

                item.element = MapEditor.loadedMap.checkpoints[checkpoint[0]];

                if (checkpoint[1] == 1) {
                    item.xKey = "triggerX1";
                    item.yKey = "triggerY1";
                }

                if (checkpoint[1] == 2) {
                    item.xKey = "triggerX2";
                    item.yKey = "triggerY2";
                }

                if (checkpoint[1] == 3) {
                    item.offSet = 32;
                }
            } else {
                // selected platform
                item.element = MapEditor.loadedMap.platforms[MapEditor.selectedElements[i]];
            }

            conditioningArray.push(item);
            avgMidX += item.element[item.xKey];
            avgMidY += item.element[item.yKey];
        }

        avgMidX = avgMidX / conditioningArray.length;
        avgMidY = avgMidY / conditioningArray.length;

        // ACTUAL BUTTON LOGIC

        if (!btn_translate.domReference.classList.contains("pressed")) {
            // not pressed

            // element(s) map coords mapped to screen coords
            // mapToRange(number, inMin, inMax, outMin, outMax)
            const xMapped = mapToRange(avgMidX, MapEditor.screen.cornerX, MapEditor.screen.cornerX + MapEditor.screen.width, 0, screenWidthUI);
            const yMapped = mapToRange(avgMidY, MapEditor.screen.cornerY, MapEditor.screen.cornerY + MapEditor.screen.height, 0, screenHeightUI);

            // position button in the middle of element(s)
            if (MapEditor.selectedElements.length > 1) {
                // Multiple element selected -- position button in average middle
                UserInterface.setGizmoBtnPos(btn_translate.domReference, xMapped, yMapped);
            } else {
                // Just one element selected. Use its offSet (accounting for map zoom)
                UserInterface.setGizmoBtnPos(
                    btn_translate.domReference,
                    xMapped + conditioningArray[0].offSet * MapEditor.zoom,
                    yMapped + conditioningArray[0].offSet * MapEditor.zoom,
                );
            }
            return;
        }
        // MOVE BUTTON according to touch dragging
        // adjust and pan screen if button is near the edge
        // move element to rounded and mapped button coords
        // snap element to snapping slider

        let btnPos = UserInterface.getGizmoBtnPos(btn_translate.domReference);
        btnPos.x += TouchHandler.dragAmountX;
        btnPos.y += TouchHandler.dragAmountY;
        UserInterface.setGizmoBtnPos(btn_translate.domReference, btnPos.x, btnPos.y);
        // this could be done with transform: translate() which would be GPU accelerated. OPTIMIZE
        // would have to track full touch drag from when press starts till press ends

        // panning if at edges of screen
        if (btnPos.x > screenWidthUI - 64) {
            MapEditor.screen.x += (400 / MapEditor.zoom) * dt;
        }
        if (btnPos.x < 64) {
            MapEditor.screen.x -= (400 / MapEditor.zoom) * dt;
        }
        if (btnPos.y > screenHeightUI - 64) {
            MapEditor.screen.y += (400 / MapEditor.zoom) * dt;
        }
        if (btnPos.y < 48) {
            MapEditor.screen.y -= (400 / MapEditor.zoom) * dt;
        }

        // MOVING EACH SELECTED ELEMENT TO FOLLOW BUTTON
        for (let i = 0; i < MapEditor.selectedElements.length; i++) {
            let xMapped; // where this button is in global map coords
            let yMapped; // (and sometimes accounting for the offset when multiple platforms are selected)

            if (MapEditor.selectedElements.length > 1) {
                // Multiple objects selected

                // offSetFromBtn (offeset from middle of selection) for each platform is in global coords here
                const offSetFromAvgMidGlobalX = avgMidX - conditioningArray[i].element[conditioningArray[i].xKey];
                const offSetFromAvgMidGlobalY = avgMidY - conditioningArray[i].element[conditioningArray[i].yKey];

                // Map btn pos from UI coords to global map coords
                // mapToRange(number, inMin, inMax, outMin, outMax)
                const btnGlobalX = mapToRange(
                    btnPos.x,
                    0,
                    screenWidthUI,
                    MapEditor.screen.cornerX,
                    MapEditor.screen.cornerX + MapEditor.screen.width,
                );
                const btnGlobalY = mapToRange(
                    btnPos.y,
                    0,
                    screenHeightUI,
                    MapEditor.screen.cornerY,
                    MapEditor.screen.cornerY + MapEditor.screen.height,
                );

                xMapped = btnGlobalX - offSetFromAvgMidGlobalX;
                yMapped = btnGlobalY - offSetFromAvgMidGlobalY;
            } else {
                // use offset for single item

                xMapped = mapToRange(
                    btnPos.x - conditioningArray[i].offSet * MapEditor.zoom,
                    0,
                    screenWidthUI,
                    MapEditor.screen.cornerX,
                    MapEditor.screen.cornerX + MapEditor.screen.width,
                );
                yMapped = mapToRange(
                    btnPos.y - conditioningArray[i].offSet * MapEditor.zoom,
                    0,
                    screenHeightUI,
                    MapEditor.screen.cornerY,
                    MapEditor.screen.cornerY + MapEditor.screen.height,
                );
            }

            // set element position to (xMapped, yMapped)
            conditioningArray[i].element[conditioningArray[i].xKey] = Math.round(xMapped);
            conditioningArray[i].element[conditioningArray[i].yKey] = Math.round(yMapped);

            if (MapEditor.snapAmount > 0) {
                conditioningArray[i].element[conditioningArray[i].xKey] =
                    Math.round(conditioningArray[i].element[conditioningArray[i].xKey] / MapEditor.snapAmount) * MapEditor.snapAmount;
                conditioningArray[i].element[conditioningArray[i].yKey] =
                    Math.round(conditioningArray[i].element[conditioningArray[i].yKey] / MapEditor.snapAmount) * MapEditor.snapAmount;
            }

            UserInterface.updateMapEditorSidePanel();
        }
    },
);
