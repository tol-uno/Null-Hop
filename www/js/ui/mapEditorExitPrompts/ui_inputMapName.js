const ui_inputMapName = new uiElement("display", () => {
    return /* HTML */ parseComponentIntoDomElement`
        <input type="text" class="allow-native-touch" id="ui_inputMapName" maxlength="25" autocomplete="off" />
    `;
});
