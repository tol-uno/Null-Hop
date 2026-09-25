const btn_restart = new uiElement(
    "button",
    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_restart">
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 62 62">
                        <path
                            fill="var(--myForegroundColor)"
                            d="M19 31a4 4 0 0 0-8 0h8Zm-4 0h-4a20 20 0 0 0 4.4 12.52l3.12-2.5 3.12-2.5A12 12 0 0 1 19 31h-4Zm3.52 10.02-3.12 2.5a20 20 0 0 0 11.28 7l.86-3.9.87-3.9a12 12 0 0 1-6.77-4.2l-3.12 2.5Zm9.02 5.6-.86 3.9a20 20 0 0 0 13.18-1.59l-1.77-3.58-1.78-3.6a12 12 0 0 1-7.9.97l-.87 3.9Zm10.55-1.27 1.77 3.58a20 20 0 0 0 9.27-9.5l-3.62-1.68-3.63-1.69a12 12 0 0 1-5.57 5.7l1.78 3.59Zm7.42-7.6 3.62 1.69a20 20 0 0 0 1.3-13.21l-3.9.95-3.88.96a12 12 0 0 1-.77 7.92l3.63 1.69Zm1.03-10.57 3.88-.95a20 20 0 0 0-7.27-11.11l-2.43 3.17-2.43 3.18a12 12 0 0 1 4.36 6.67l3.89-.96Zm-5.82-8.89 2.43-3.17A20 20 0 0 0 30.53 11l.1 4 .09 4a12 12 0 0 1 7.57 2.46l2.43-3.18ZM30.62 15l-.09-4a20 20 0 0 0-12.41 4.7l2.57 3.06 2.58 3.06A12 12 0 0 1 30.72 19l-.1-4Z"
                        />
                        <path
                            fill="var(--myForegroundColor)"
                            d="M15.41 23.04a2 2 0 0 1-1.3-3.24l8.93-11.13a2 2 0 0 1 3.42.5l5.22 12.99a2 2 0 0 1-2.11 2.73L15.4 23.04Z"
                        />
                    </svg>
                </div>
            </button>
    `;
    },

    () => {
        // brings back the start jumping button
        UserInterface.switchToUiGroup(UserInterface.uiGroup_inLevel);

        ui_speedometer.domReference.textContent = "Speed: 0";
        ui_jumpStats.domReference.textContent = "";
        UserInterface.timer = 0;
        UserInterface.levelState = 1;
        Player.checkpointIndex = -1;
        Player.restart();

        if (Tutorial.isActive) {
            // only reaches this code if tutorial is on last two states (pretty much completed)
            Tutorial.isActive = false;
            Tutorial.reset();
        }
    },
);
