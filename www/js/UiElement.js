class uiElement {
    /**
     * @param type {"button" | "slider" | "toggle" | "display"}
     * @param template {function} Arrow function returning HTML
     * @param func {function} Arrow function representing the buttons behavior when clicked
     * @param nativeFunc {function} function for an addEventListener("click") on the domReference (must use allow-native-touch class)
     */
    constructor(type, template, func, nativeFunc) {
        this.type = type;
        this.template = template;
        if (func) {
            this.func = func;
        }
        if (nativeFunc) {
            this.nativeFunc = nativeFunc;
        }
        this.subElements = [];
        this.domReference = null;

        if (type === "slider") {
            this.handle = null;
            this.labelValue = null;
        }

        if (type === "toggle") {
            this.label = null;
        }
    }

    /**
     * COULD DO:
     * When subElements are being added they should all check to make sure they dont already exist
     * - If they do, remove the old one before adding the new one
     */

    addDomElement(container) {
        const { domElement, allSubElementsFound } = this.template();

        // Add additional sub references for sliders and toggles ui parts
        this.registerDomReferences(domElement);

        this.subElements = allSubElementsFound;

        if (this.nativeFunc) {
            domElement.addEventListener("click", this.nativeFunc);
        }

        container.appendChild(domElement);

        const syncIfToggleOrSlider = (element) => {
            if (element.type === "toggle" || element.type === "slider") {
                element.func(true); // run func() with sync = true. This runs a special version of func() that is set up to sync this ui element with external state
            }
        } 
        
        syncIfToggleOrSlider(this)

        for (const subElement of allSubElementsFound) {
            syncIfToggleOrSlider(subElement)
        }

        return domElement;
    }

    registerDomReferences(domElement) {
        this.domReference = domElement;

        if (this.type === "slider") {
            // register labelValue and handle
            this.labelValue = domElement.querySelector(".label > span");
            this.handle = domElement.querySelector(".handle");
        } else if (this.type === "toggle") {
            // register toggle and label
            this.label = domElement.querySelector(".label");
        }
    }
}
