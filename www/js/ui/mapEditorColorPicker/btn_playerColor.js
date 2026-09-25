const btn_playerColor = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_playerColor">
                <div>
                    <div>Player</div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 29 47">
                        <path fill="var(--myMapColor)" d="M1.5 14.23 14.23 1.5l12.73 12.73-12.73 12.73L1.5 14.23Z" />
                        <path fill="var(--myMapColor)" d="m14.23 26.96 12.73-12.73v18L14.23 44.96v-18Z" />
                        <path fill="var(--myMapColor)" d="m1.5 14.23 12.73 12.73v18L1.5 32.23v-18Z" />
                        <path
                            stroke="var(--myForegroundColor)"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="3"
                            d="M1.5 14.23 14.23 1.5l12.73 12.73m-25.46 0 12.73 12.73M1.5 14.23v18l12.73 12.73m12.73-30.73L14.23 26.96m12.73-12.73v18L14.23 44.96m0-18v18"
                        />
                        <path
                            stroke="var(--myForegroundColor)"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="m17.1 17.1-8.36-2.23 6.13-6.13 2.24 8.37Z"
                        />
                    </svg>
                </div>
            </button>
        `;
    },

    () => {
        ColorPicker.editingElement = 2;
        ColorPicker.setColorViaRGB(MapEditor.loadedMap.style.playerColor);
        UserInterface.switchToUiGroup(UserInterface.uiGroup_colorPickerState2);
        ColorPicker.syncGradients();
    },
);
