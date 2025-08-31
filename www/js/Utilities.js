/**
For reading files from devices app data OR from local files in /www/
Need to use within an asyc function and use await: "data = await readFile()"
@param { "local" | "device" } baseDirectory - (Required) whether to read from www or hidden app data on device
@param { string } fileName - include extension ex: "myMap.json", "jump.mp3"
@param { "text" | "arraybuffer" } readDataAs - determines what kind of data this function returns
@returns {Promise<void>} Returns a promise that resolves to raw unparsed text or arraybuffer
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

/**
For writing files to device's hidden app data directory
Must be used within an async function with await: "await writeFile()"
@param {string} fileName - (Required) File name with extension (e.g., "data.json")
@param {Blob} blobData - (Required) Data to write to the file
@param {string} subDirectory - Optional subdirectory within the data directory (e.g., "maps")
@returns {Promise<void>} - Returns a promise that resolves when file is successfully written
*/

function writeFile(fileName, blobData, subDirectory = "") {
    return new Promise((resolve, reject) => {
        // Validate input
        if (!(blobData instanceof Blob)) {
            return reject("writeFile error: blobData must be a valid Blob object");
        }

        // Normalize subdirectory (remove leading/trailing slashes)
        subDirectory = subDirectory.replace(/^\/+|\/+$/g, "");

        const basePath = cordova.file.dataDirectory;

        // Step 1: Resolve the base app data directory
        window.resolveLocalFileSystemURL(
            basePath,
            (dataDirEntry) => {
                // Step 2: If subdirectory is provided, access or create it
                if (subDirectory !== "") {
                    dataDirEntry.getDirectory(
                        subDirectory,
                        { create: true },
                        (subDirEntry) => {
                            // Step 3: Proceed to save file in the subdirectory
                            saveFile(subDirEntry);
                        },
                        (err) => reject("writeFile error: Unable to access/create subdirectory. Code: " + err.code)
                    );
                } else {
                    // No subdirectory, save directly in the base data directory
                    saveFile(dataDirEntry);
                }
            },
            (err) => reject("writeFile error: Unable to resolve data directory. Code: " + err.code)
        );

        // Step 4: Create or overwrite the file and write blobData to it
        function saveFile(directoryEntry) {
            directoryEntry.getFile(
                fileName,
                { create: true, exclusive: false },
                (fileEntry) => {
                    fileEntry.createWriter(
                        (fileWriter) => {
                            fileWriter.onwriteend = () => {
                                console.log("writeFile: Successfully wrote file:", fileName);
                                resolve();
                            };

                            fileWriter.onerror = (err) => {
                                reject("writeFile error: Failed during write. Code: " + err.code);
                            };

                            fileWriter.write(blobData);
                        },
                        (err) => reject("writeFile error: Failed to create fileWriter. Code: " + err.code)
                    );
                },
                (err) => reject("writeFile error: Failed to access or create file. Code: " + err.code)
            );
        }
    });
}

