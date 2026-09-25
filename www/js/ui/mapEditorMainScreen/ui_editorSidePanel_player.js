const ui_editorSidePanel_player = new uiElement("display", () => {
    return /* HTML */ parseComponentIntoDomElement`
        <div id="ui_editorSidePanel_player" class="ui_editorSidePanel">
            <div class="splitSection">
                <div id="element-title-box">
                    ${btn_unselect}
                    ${ui_elementTitle}
                </div>
                ${ui_elementInfo}
            </div>
            <div class="splitSection">
                ${slider_playerAngle}
            </div>
        </div>
    `;
});
