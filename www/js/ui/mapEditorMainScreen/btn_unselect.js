const btn_unselect = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_unselect" class="short-button">
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 62 62">
                        <path stroke="var(--myForegroundColor)" stroke-linecap="round" stroke-width="8" d="m19 43 24-24m-24 0 24 24" />
                    </svg>
                </div>
            </button>`;
    },

    () => {
        UserInterface.switchToUiGroup(UserInterface.uiGroup_mapEditorInterface);
        MapEditor.selectedElements = []; // remove all selected elements
    },
);
