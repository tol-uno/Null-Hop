const ui_strafeHelper = new uiElement(
    "display",
    
    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <div id="ui_strafeHelper" class="hidden">
                <div id="strafeHandle"></div>
            </div>
        `;
    },

    () => {
        const touchX = TouchHandler.touches[0].x;

        const parentRect = ui_strafeHelper.domReference.getBoundingClientRect();
        const parentLeft = parentRect.left;
        const parentWidth = parentRect.width;

        // relative position of touch inside the parent
        let rel = touchX - parentLeft;

        // wrap-around using modulo so it loops when going past edges
        rel = ((rel % parentWidth) + parentWidth) % parentWidth;

        // Fix this - querySelector and updating style every frame is expensive
        // first child and transforms might be better
        ui_strafeHelper.domReference.querySelector("#strafeHandle").style.left = rel + "px";
    },
);
