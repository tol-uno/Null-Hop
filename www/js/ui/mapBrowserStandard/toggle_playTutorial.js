const toggle_playTutorial = new uiElement(
    "toggle",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div id="toggle_playTutorial" class="toggle-container">
                <span class="label">Play Tutorial</span>
                <div class="toggle"></div>
            </div>
        `;
    },

    (sync) => {
        if (sync) {
            UserInterface.setToggleState(toggle_playTutorial, UserInterface.settings.playTutorial);
            return;
        }

        toggle_playTutorial.domReference.classList.toggle("toggled");
        UserInterface.settings.playTutorial = UserInterface.getToggleState(toggle_playTutorial);

        UserInterface.writeSettings();
    },
);
