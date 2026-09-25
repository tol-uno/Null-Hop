const ui_mapInfoBox = new uiElement(
    "display",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div id="ui_mapInfoBox">
                <div>
                    <div class="mapName">Map Name</div>
                    <div class="yourTime">Your Time: 0:00.000</div>
                </div>
                <div class="medalList">
                    <div class="gold activeMedal">0:10.000</div>
                    <div class="silver">0:20.000</div>
                    <div class="bronze">0:30.000</div>
                </div>
            </div>
        `;
    },
);
