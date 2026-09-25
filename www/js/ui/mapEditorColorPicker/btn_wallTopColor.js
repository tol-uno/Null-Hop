const btn_wallTopColor = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_wallTopColor">
                <div>
                    <div>Top</div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 29 47">
                        <path fill="var(--myMapColor)" d="M1.5 14.23 14.23 1.5l12.73 12.73-12.73 12.73L1.5 14.23Z" />
                        <path fill="none" d="m14.23 26.96 12.73-12.73v18L14.23 44.96v-18Z" />
                        <path fill="none" d="m1.5 14.23 12.73 12.73v18L1.5 32.23v-18Z" />
                        <path
                            stroke="var(--myForegroundColor)"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="3"
                            d="M1.5 14.23 14.23 1.5l12.73 12.73m-25.46 0 12.73 12.73M1.5 14.23v18l12.73 12.73m12.73-30.73L14.23 26.96m12.73-12.73v18L14.23 44.96m0-18v18"
                        />
                    </svg>
                </div>
            </button>
        `;
    },

    () => {
        ColorPicker.editingElement = 5;
        ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.wallTopColor);
        UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState2);
        ColorPicker.syncGradients();
    },
);
