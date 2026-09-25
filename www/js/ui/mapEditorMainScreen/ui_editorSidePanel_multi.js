const ui_editorSidePanel_multi = new uiElement("display", () => {
    return /* HTML */ parseComponentIntoDomElement`
        <div id="ui_editorSidePanel_multi" class="ui_editorSidePanel">
            <div class="splitSection">
                <div id="element-title-box">
                    ${btn_unselect}
                    ${ui_elementTitle}
                </div>
                ${ui_elementInfo}
            </div>
        </div>
    `;
});
