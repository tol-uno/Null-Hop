const ui_arrow = new uiElement("display", () => {
    return /* HTML */ parseComponentIntoDomElement`
        <div id="ui_arrow">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 44">
                <path
                    stroke="var(--uiBackgroundColor)"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="8"
                    d="M20 4 4 20l16 16"
                ></path>
                <path stroke="var(--uiBackgroundColor)" stroke-linecap="round" stroke-width="8" d="M4 20h56"></path>
            </svg>
        </div>
    `;
});
