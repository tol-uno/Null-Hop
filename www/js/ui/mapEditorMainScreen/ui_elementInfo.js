const ui_elementInfo = new uiElement("display", () => {
    return /* HTML */ parseComponentIntoDomElement`
        <div id="ui_elementInfo">
            Position: 333, 888<br />
            Size: 100, 100
        </div>
    `;
});
