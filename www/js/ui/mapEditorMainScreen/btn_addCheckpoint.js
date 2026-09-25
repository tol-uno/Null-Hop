const btn_addCheckpoint = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_addCheckpoint"><div>Add Checkpoint</div></button>
        `;
    },

    () => {
        const middleX = Math.round(MapEditor.screen.x);
        const middleY = Math.round(MapEditor.screen.y);
        const newCheckpoint = {
            triggerX1: middleX - 100,
            triggerY1: middleY,
            triggerX2: middleX + 100,
            triggerY2: middleY,
            x: middleX,
            y: middleY + 50,
            angle: 270,
        };

        MapEditor.loadedMap.checkpoints.push(newCheckpoint);
    },
);
