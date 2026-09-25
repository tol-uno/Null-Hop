const ui_warningContainer = new uiElement("display", () => {
    return /* HTML */ parseComponentIntoDomElement`
        <div id="ui_warningContainer">
            ${ui_verticalWarning}
            ${ui_overstrafeWarning}
        </div>
    `;
});
