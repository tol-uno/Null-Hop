const ui_mapListContainer = new uiElement(
    "display",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div id="ui_mapListContainer" class="map-list-container">
                ${btn_level_awakening}
                ${btn_level_pitfall}
                ${btn_level_cavernAbyss}
                ${btn_level_crystals}
                ${btn_level_surfacing}
                ${btn_level_wheatFields}
                ${btn_level_trespass}
                ${btn_level_turmoil}
                ${btn_level_tangledForest}
                ${btn_level_pinnacle}
                ${btn_level_moonlight}
                ${btn_level_rapture}
                ${btn_level_forever}
            </div>
        `;
    },
);
