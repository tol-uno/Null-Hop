
// ADD A writeFile function here



/**
For reading files from devices app data OR from local files in /www/
Returns a promise that resolves to raw unparsed text or arraybuffer
Need to use within an asyc function and use await: "data = await readFile()"
@param { "local" | "device" } baseDirectory - (Required) whether to read from www or hidden app data on device
@param { string } fileName - include extension ex: "myMap.json", "jump.mp3"
@param { "text" | "arraybuffer" } readDataAs - determines what kind of data this function returns
*/

function readFile(baseDirectory = "local", subDirectory = "", fileName, readDataAs = "text") {


    return new Promise((resolve, reject) => {
        let basePath;

        if (baseDirectory == "local") {
            basePath = cordova.file.applicationDirectory + "www/";
        } else if (baseDirectory == "device") {
            basePath = cordova.file.dataDirectory;
        } else throw new Error("baseDirectory parameter is invalid");

        const readMethod = readDataAs === "arraybuffer" ? "readAsArrayBuffer" : "readAsText";

        // Step 1: Resolve the base data directory
        window.resolveLocalFileSystemURL(
            basePath,
            (baseDirEntry) => {
                // Step 2: Get the subdirectory inside the data directory
                baseDirEntry.getDirectory(
                    subDirectory,
                    { create: false },
                    (subDirEntry) => {
                        // Step 3: Get the file inside the subdirectory
                        subDirEntry.getFile(
                            fileName,
                            { create: false },
                            (fileEntry) => {
                                // Step 4: Read the file using the appropriate FileReader method
                                fileEntry.file(
                                    (file) => {
                                        const reader = new FileReader();
                                        reader.onloadend = () => resolve(reader.result);
                                        reader.onerror = () => reject("FileReader error: " + reader.error);
                                        reader[readMethod](file); // "readAsArrayBuffer" or "readAsText"
                                    },
                                    () => reject("Unable to access file: " + fileName)
                                );
                            },
                            () => reject("File not found: " + fileName)
                        );
                    },
                    (err) => reject("Subdirectory not found: " + err.code)
                );
            },
            (err) => reject("Could not resolve data directory: " + err.code)
        );
    });
}
