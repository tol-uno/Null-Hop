const toggle_strafeHUD = new uiElement(
    "toggle",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div id="toggle_strafeHUD" class="toggle-container">
                <span class="label">Strafe Helper</span>
                <div class="toggle"></div>
            </div>
        `;
    },

    (sync) => {
        if (sync) {
            UserInterface.setToggleState(toggle_strafeHUD, UserInterface.settings.strafeHUD);
            return;
        }

        toggle_strafeHUD.domReference.classList.toggle("toggled");
        UserInterface.settings.strafeHUD = UserInterface.getToggleState(toggle_strafeHUD);
        UserInterface.writeSettings();
    },
);
