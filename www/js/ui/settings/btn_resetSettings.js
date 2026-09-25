const btn_resetSettings = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_resetSettings">
                <div>Reset Settings <br />And Records</div>
            </button>
        `;
    },

    () => {
        const reset = confirm("Reset All Settings and Records?");
        if (reset) {
            UserInterface.records = {
                unlocked: UserInterface.records.unlocked,
            };
            UserInterface.writeRecords();

            UserInterface.settings = {
                sensitivity: 1.0,
                volume: 0.5,
                debugText: 0,
                strafeHUD: 1,
                playTutorial: 1,
            };
            UserInterface.writeSettings();

            // sync all settings buttons / sliders with new reset settings
            UserInterface.setSliderValue(slider_sensitivity, UserInterface.settings.sensitivity);
            UserInterface.setSliderValue(slider_volume, UserInterface.settings.volume);
            UserInterface.setToggleState(toggle_debugText, UserInterface.settings.debugText);
            UserInterface.removeUiElement(ui_debugText)
            UserInterface.setToggleState(toggle_strafeHUD, UserInterface.settings.strafeHUD);
            AudioHandler.setVolume(UserInterface.settings.volume);

            console.log("Records And Settings Cleared");
        }
    },
);
