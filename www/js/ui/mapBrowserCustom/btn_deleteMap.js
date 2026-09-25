const btn_deleteMap = new uiElement(
    "button",

    () => {
        return /* HTML */ parseComponentIntoDomElement`
            <button id="btn_deleteMap">
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64">
                        <path stroke="var(--myForegroundColor)" stroke-width="3" d="M28.75 17.43v-.5a3 3 0 1 1 6 0v.5" />
                        <path
                            fill="var(--myForegroundColor)"
                            d="M44.75 22.45h-25.5a2 2 0 0 1-2-2v-1.17c0-1.1.9-2 2-2h25.5a2 2 0 0 1 2 2v1.17a2 2 0 0 1-2 2Z"
                        />
                        <path
                            fill="var(--myForegroundColor)"
                            fill-rule="evenodd"
                            d="M24.02 50.07a2 2 0 0 1-1.97-1.7L18.6 25.43a2 2 0 0 1 1.97-2.3h22.9a2 2 0 0 1 1.99 2.26l-2.97 22.94a2 2 0 0 1-1.99 1.74H24.02Zm.86-23c.61-.06 1.16.39 1.22 1l1.69 17.4a1.12 1.12 0 0 1-2.24.22l-1.68-17.4c-.06-.61.39-1.16 1-1.22Zm6.28 18.51v-17.4a1.12 1.12 0 1 1 2.24 0v17.4a1.12 1.12 0 0 1-2.24 0Zm8.53-18.51c.61.06 1.06.6 1 1.22l-1.68 17.4a1.12 1.12 0 0 1-2.23-.22l1.68-17.4c.06-.61.6-1.06 1.23-1Z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </div>
            </button>
        `;
    },

    () => {
        const deleteMap = confirm("Delete Map?");
        if (deleteMap) {
            window.resolveLocalFileSystemURL(cordova.file.dataDirectory + "maps", (fileSystem) => {
                const reader = fileSystem.createReader();
                reader.readEntries((entries) => {
                    fileSystem.getFile(MapBrowser.selectedMapIndex + ".json", { create: false }, (fileEntry) => {
                        fileEntry.remove(
                            (file) => {
                                alert("Map Deleted");

                                UserInterface.removeRecord(MapBrowser.selectedMapIndex);

                                // reload map editor map browser by pressing btn_mapEditor again
                                btn_mapEditor.func();
                            },
                            function (error) {
                                alert("error occurred: " + error.code);
                            },
                            function () {
                                alert("file does not exist");
                            },
                        );
                    });
                });
            });
        }
    },
);
