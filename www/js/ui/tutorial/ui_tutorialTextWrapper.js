const ui_tutorialTextWrapper = new uiElement("display", () => {
    return /* HTML */ parseComponentIntoDomElement`
        <div id="ui_tutorialTextWrapper">
            ${ui_tutorialText}
            ${btn_next}
        </div>
    `;
});
