const btn_next = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_next" class="hidden">
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 60 60">
                        <path
                            stroke="var(--myForegroundColor)"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="8"
                            d="m25.5 16 14 14-14 14"
                        />
                    </svg>
                </div>
            </button>
        `;
    },

    () => {
        Tutorial.setState(Tutorial.state + 1);
    },
);
