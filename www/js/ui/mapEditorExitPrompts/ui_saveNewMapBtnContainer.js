const ui_saveNewMapBtnContainer = new uiElement("display", () => {
    return /* HTML */ parseComponentIntoDomElement`
        <div id="ui_saveNewMapBtnContainer">
            ${btn_save}
            ${btn_discard}
        </div>
    `;
});
