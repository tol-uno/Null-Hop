const btn_submitMapName = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_submitMapName"><div>Save</div></button>
        `;
    },

    async () => {
        const mapName = ui_inputMapName.domReference.value.trim();
        const isValid = validateMapName(mapName);

        if (!isValid.valid) {
            // update ui_mapNameErrorTex
            // Hide this if X button pressed or name is accepted (might not need too) kill
            UserInterface.addUiElement(ui_mapNameErrorText);
            ui_mapNameErrorText.domReference.textContent = isValid.reason;
        } else {
            // clear text field
            ui_inputMapName.domReference.value = ""; // probably not needed with new UI system
            try {
                await MapEditor.saveCustomMap(mapName);
            } catch (error) {
                console.log(error);
            } finally {
                MapEditor.leaveMapEditor();
            }
        }

        function validateMapName(input) {
            const banned = [
                "unlocked",
                "null",
                "awakening",
                "pitfall",
                "cavern abyss",
                "crystals",
                "surfacing",
                "wheat fields",
                "trespass",
                "turmoil",
                "tangled forest",
                "pinnacle",
                "moonlight",
                "rapture",
                "forever",
            ];

            const existingMaps = MapBrowser.customMapNamesCache;

            if (input.length === 0) return { valid: false, reason: "Name cannot be blank" };
            if (input.length > 25) return { valid: false, reason: "Name is too long (over 25 characters)" };
            if (!/^[a-zA-Z0-9_ ]+$/.test(input)) return { valid: false, reason: "Name can only contain letters, numbers, underscores, & spaces" };
            if (banned.includes(input.toLowerCase())) return { valid: false, reason: "That name is restricted and cannot be used" };
            if (existingMaps.includes(input)) return { valid: false, reason: "That name is already being used by another map" };
            existingMaps;
            return { valid: true, reason: null };
        }
    },
);
