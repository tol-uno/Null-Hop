const toggle_debugText = new uiElement(
    "toggle",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div id="toggle_debugText" class="toggle-container">
                <span class="label">Debug Information</span>
                <div class="toggle"></div>
            </div>
        `;
    },

    (sync) => {
        if (sync) {
            UserInterface.setToggleState(toggle_debugText, UserInterface.settings.debugText);
            return;
        }

        toggle_debugText.domReference.classList.toggle("toggled"); // .toggle adds or removes class depending on if it's already added
        UserInterface.settings.debugText = UserInterface.getToggleState(toggle_debugText); // adjust settings to match toggle state
        // unhiding or hiding debug text (doesnt add to activeGroup so it never gets switched off when moving to new UiGroup)
        if (UserInterface.settings.debugText) {
            UserInterface.addUiElement(ui_debugText);
        } else {
            UserInterface.removeUiElement(ui_debugText);
        }
        UserInterface.writeSettings();
    },
);
