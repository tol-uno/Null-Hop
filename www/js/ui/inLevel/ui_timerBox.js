const ui_timerBox = new uiElement(
    "display",
    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div id="ui_timerBox">
                <span style="display: block">Time: 0:00.000</span>
                <span style="display: block">Record: 0:00.000</span>
            </div>
        `;
    },
);
