const btn_resize_BR = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_resize_BR" class="short-button">
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 38 38">
                        <path
                            fill="var(--myForegroundColor)"
                            d="M26.48 28.32a1.5 1.5 0 0 0 1.85-1.84l-2.18-8.12a1.5 1.5 0 0 0-2.5-.69l-6.04 5.9a1.5 1.5 0 0 0 .66 2.53l8.21 2.22Z"
                        />
                        <path
                            fill="var(--myForegroundColor)"
                            fill-rule="evenodd"
                            d="M14.35 20.33c-.82.8-2.2.42-2.5-.69l-2.18-8.12a1.5 1.5 0 0 1 1.85-1.84l8.2 2.23a1.5 1.5 0 0 1 .67 2.52l-6.04 5.9Z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </div>
            </button>
        `;
    },

    () => {
        MapEditor.resizeBtnFuncLogic(btn_resize_BR.domReference, 1, 3, +19, +19, +1, +1);
    },
);
