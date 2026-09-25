const btn_shareMap = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_shareMap" class="allow-native-touch">
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64">
                        <path
                            stroke="var(--myForegroundColor)"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="4"
                            d="M32 33V19M23.56 27H22a4 4 0 0 0-4 4v9a4 4 0 0 0 4 4h20a4 4 0 0 0 4-4v-9a4 4 0 0 0-4-4h-1.56"
                        />
                        <path fill="var(--myForegroundColor)" d="M30.27 14a2 2 0 0 1 3.46 0l3.47 6a2 2 0 0 1-1.74 3h-6.92a2 2 0 0 1-1.74-3l3.47-6Z" />
                    </svg>
                </div>
            </button>
        `;
    },

    // () => {
    //     console.log("btn_shareMap functionality handled by native touch click and UserInterface.shareMap()");
    // },

    () => {
        UserInterface.shareMap();
        console.log("Native event triggered");
    },
);
