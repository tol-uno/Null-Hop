const btn_directLightColor = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_directLightColor">
                <div>
                    <div>Direct Light</div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 43 43">
                        <circle cx="21.5" cy="21.5" r="20" fill="var(--myMapColor)" stroke="var(--myForegroundColor)" stroke-width="3" />
                    </svg>
                </div>
            </button>
        `;
    },

    () => {
        ColorPicker.editingElement = 9;
        ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.directLight);
        UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState2);
        ColorPicker.syncGradients();
    },
);
