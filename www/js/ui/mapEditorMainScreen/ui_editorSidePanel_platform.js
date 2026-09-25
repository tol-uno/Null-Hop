const ui_editorSidePanel_platform = new uiElement("display", () => {
    return /* HTML */ parseComponentIntoDomElement`
        <div id="ui_editorSidePanel_platform" class="ui_editorSidePanel">
            <div class="splitSection">
                <div id="element-title-box">
                    ${btn_unselect}
                    ${ui_elementTitle}
                </div>
                ${ui_elementInfo}
            </div>
            <div class="splitSection">
                ${slider_platformAngle}
                ${toggle_wall}
                ${toggle_endzone}
            </div>
        </div>
    `;
});
