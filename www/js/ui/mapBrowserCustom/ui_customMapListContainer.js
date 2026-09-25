const ui_customMapListContainer = new uiElement(
    "display",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div id="ui_customMapListContainer" class="map-list-container"></div>
        `;
    },
);
