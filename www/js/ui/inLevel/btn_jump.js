const btn_jump = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_jump">
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 90 90">
                        <path
                            fill="var(--myForegroundColor)"
                            d="M72 61.81a2 2 0 0 1-3.5 0l-7.62-13.85A2 2 0 0 1 62.63 45h15.24a2 2 0 0 1 1.75 2.96L72 61.81Z"
                        />
                        <path
                            d="M18.75 54.5c0-7 2.5-15 11-15s11.5 8 11.5 15c0-11.5 4-23 15-23s15 11.5 15 23"
                            stroke="var(--myForegroundColor)"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="8"
                        />
                    </svg>
                </div>
            </button>
        `;
    },

    () => {
        if (UserInterface.levelState == 1) {
            // so user cant fire button again as it's fading out
            UserInterface.timerStart = Date.now();
            UserInterface.levelState = 2;
            Player.startLevel();

            btn_jump.domReference.style.animation = "fadeOut 200ms forwards cubic-bezier(0.7, 0, 1.0, 1.0)";

            setTimeout(() => {
                btn_jump.domReference.style.opacity = "1"; // reset fade out
                btn_jump.domReference.style.animation = "";
                if (UserInterface.levelState >= 2) {
                    btn_jump.domReference.classList.remove("pressed");
                    UserInterface.removeUiElement(btn_jump);
                }
            }, 200);
        }
    },
);
