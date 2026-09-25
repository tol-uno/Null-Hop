const btn_settings = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_settings">
                <div>Settings</div>
            </button>
        `;
    },

    () => {
        UserInterface.gamestate = 3;
        UserInterface.switchToUiGroup(UserInterface.uiGroup_settings);
    },
);
