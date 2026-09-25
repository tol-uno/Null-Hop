const btn_resize_TR = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_resize_TR" class="short-button">
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 38 38">
                        <path
                            fill="var(--myForegroundColor)"
                            d="M11.52 28.32a1.5 1.5 0 0 1-1.85-1.84l2.18-8.12a1.5 1.5 0 0 1 2.5-.69l6.04 5.9a1.5 1.5 0 0 1-.66 2.53l-8.21 2.22Z"
                        />
                        <path
                            fill="var(--myForegroundColor)"
                            fill-rule="evenodd"
                            d="M23.65 20.33c.82.8 2.2.42 2.5-.69l2.18-8.12a1.5 1.5 0 0 0-1.85-1.84l-8.2 2.23a1.5 1.5 0 0 0-.67 2.52l6.04 5.9Z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </div>
            </button>
        `;
    },

    () => {
        MapEditor.resizeBtnFuncLogic(btn_resize_TR.domReference, 2, 0, +19, -19, +1, -1);
    },
);
