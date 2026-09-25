const ui_saveExistingMapBtnContainer = new uiElement("display", () => {
    return /* HTML */ parseComponentIntoDomElement`
        <div id="ui_saveExistingMapBtnContainer">
            ${btn_save}
            ${btn_saveAsCopy}
            ${btn_discard}
        </div>
    `;
});
