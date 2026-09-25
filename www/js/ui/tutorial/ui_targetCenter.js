const ui_targetCenter = new uiElement("display", () => {
    return /* HTML */ parseComponentIntoDomElement`
        <div id="ui_targetCenter">
            <svg viewBox="0 0 64 64" width="64" height="64" id="target" style="overflow: visible">
                <defs>
                    <filter id="sideShadow" x="-25%" y="-150%" width="150%" height="300%">
                        <!-- top face -->
                        <feOffset in="SourceAlpha" dx="0" dy="-32" result="offset1">
                            <animate
                                begin="0s"
                                attributeName="dy"
                                dur="2s"
                                repeatCount="indefinite"
                                values="-20;-32;-20"
                                keyTimes="0;0.5;1"
                                calcMode="spline"
                                keySplines=".4,0,0.6,1; .4,0,.6,1"
                            />
                        </feOffset>
                        <feFlood flood-color="var(--uiBackgroundColor)" result="flood1" />
                        <feComposite in="flood1" in2="offset1" operator="in" result="topFace" />

                        <!-- side face -->
                        <feOffset in="SourceAlpha" dx="0" dy="-30" result="offset2">
                            <animate
                                begin="0s"
                                attributeName="dy"
                                dur="2s"
                                repeatCount="indefinite"
                                values="-18;-30;-18"
                                keyTimes="0;0.5;1"
                                calcMode="spline"
                                keySplines=".4,0,0.6,1; .4,0,.6,1"
                            />
                        </feOffset>
                        <!-- flood-color was var(--uiBackgroundColor_pressed) but it was too light -->
                        <feFlood flood-color="#b4b4b4" result="flood2" />
                        <feComposite in="flood2" in2="offset2" operator="in" result="sideFace" />

                        <!-- Merge both shadows and the original graphic -->
                        <feMerge>
                            <feMergeNode in="SourceGraphic" />
                            <feMergeNode in="sideFace" />
                            <feMergeNode in="topFace" />
                        </feMerge>
                    </filter>
                </defs>

                <g filter="url(#sideShadow)">
                    <circle id="arc" cx="32" cy="32" r="12" stroke="rgb(170,58,40)" stroke-width="8" fill="none" stroke-linecap="round" />
                    <circle id="dot" class="" cx="32" cy="32" r="5" fill="rgb(170,58,40)" />
                </g>
            </svg>
        </div>
    `;
});
