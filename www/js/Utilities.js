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
                                    () => reject("Unable to access file: " + fileName),
                                );
                            },
                            () => reject("File not found: " + fileName),
                        );
                    },
                    (err) => reject("Subdirectory not found: " + err.code),
                );
            },
            (err) => reject("Could not resolve data directory: " + err.code),
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
                        (err) => reject("writeFile error: Unable to access/create subdirectory. Code: " + err.code),
                    );
                } else {
                    // No subdirectory, save directly in the base data directory
                    saveFile(dataDirEntry);
                }
            },
            (err) => reject("writeFile error: Unable to resolve data directory. Code: " + err.code),
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
                        (err) => reject("writeFile error: Failed to create fileWriter. Code: " + err.code),
                    );
                },
                (err) => reject("writeFile error: Failed to access or create file. Code: " + err.code),
            );
        }
    });
}

function mapToRange(number, inMin, inMax, outMin, outMax) {
    // MAP TO RANGE: https://stackoverflow.com/questions/10756313/javascript-jquery-map-a-range-of-numbers-to-another-range-of-numbers
    return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

function parseStringToDomElement(templateString) {
    try {
        const parsedDocument = this.DomParser.parseFromString(templateString, "text/html");
        return parsedDocument.body.firstElementChild;
    } catch (error) {
        throw new Error(`Failed to parse DOM element: ${error.message}`);
    }
}

function parseComponentIntoDomElement(strings, ...values) {
    // each value is a ${} in the string template literal
    // recursivly expand all nested components to Dom elements
    const allSubElementsFound = [];
    const domChildrenArray = values.map((subElement) => {
        const result = subElement.template(); // uses this parseComponentIntoDomElement to parse template

        subElement.registerDomReferences(result.domElement); // register sub elements domReference

        // collect this child's own discovered sub-elements into the shared top-level array
        allSubElementsFound.push(...result.allSubElementsFound);

        // also track this child itself, since it's a sub-element of the current template
        allSubElementsFound.push(subElement);
        // allSubElementsFound.push(result.domElement); // old way where this array was populated with dom elements. Now that each class instance has its domReference set we can just use the class instance here. ^^ see above

        return result.domElement;
    });

    // add placeholder divs with the id of child that can be replaced with the actual child dom element
    // mash all string fragments together but turn ${subElements} into placeholder divs with an id
    let stringWithSubElementPlaceholders = "";
    for (let i = 0; i < strings.length; i++) {
        stringWithSubElementPlaceholders += strings[i];
        if (i < domChildrenArray.length) {
            stringWithSubElementPlaceholders += `<div id="${domChildrenArray[i].id}"></div>`;
        }
    }
    // parse and create the actual DOM element
    const domElement = parseStringToDomElement(stringWithSubElementPlaceholders);

    // slot in actual sub-element dom-elements into the placeholder divs
    for (const domChild of domChildrenArray) {
        // get placeholder div in domElement that aligns with this domChild
        const placeholderDiv = domElement.querySelector(`#${domChild.id}`);

        placeholderDiv.replaceWith(domChild);
    }

    return { domElement, allSubElementsFound };
}

// takes a rectangle defined by center coordinates (x, y), width, height, and angle in radians
// returns an array of global corner points in clockwise order, starting from the top-left corner
// [{x:1,y:1}, {x:3,y:1}, {x:3,y:3}, {x:1,y:3}]
function createPoligon(x, y, width, height, angle) {
    // Calculate half width and half height
    var hw = width / 2;
    var hh = height / 2;

    // Calculate the cos and sin of the angle
    var cosAngle = Math.cos(angle);
    var sinAngle = Math.sin(angle);

    // Calculate the corner points relative to the center
    var topLeft = {
        x: x - hw * cosAngle + hh * sinAngle,
        y: y - hw * sinAngle - hh * cosAngle,
    };

    var topRight = {
        x: x + hw * cosAngle + hh * sinAngle,
        y: y + hw * sinAngle - hh * cosAngle,
    };

    var bottomRight = {
        x: x + hw * cosAngle - hh * sinAngle,
        y: y + hw * sinAngle + hh * cosAngle,
    };

    var bottomLeft = {
        x: x - hw * cosAngle - hh * sinAngle,
        y: y - hw * sinAngle + hh * cosAngle,
    };

    // Return the corner points (GLOBAL) in clockwise order
    return [topLeft, topRight, bottomRight, bottomLeft];
}

/**
@param a an array of connected points [{x:, y:}, {x:, y:},...] that form a closed polygon
@param b an array of connected points [{x:, y:}, {x:, y:},...] that form a closed polygon
@return true if there is any intersection between the 2 polygons, false otherwise
https://stackoverflow.com/questions/10962379/how-to-check-intersection-between-2-rotated-rectangles
*/
function doPolygonsIntersect(a, b) {
    const polygons = [a, b];
    let minA, maxA, projected, i, i1, j, minB, maxB;

    for (i = 0; i < polygons.length; i++) {
        // for each polygon, look at each edge of the polygon, and determine if it separates
        // the two shapes
        const polygon = polygons[i];
        for (i1 = 0; i1 < polygon.length; i1++) {
            // grab 2 vertices to create an edge
            const i2 = (i1 + 1) % polygon.length;
            const p1 = polygon[i1];
            const p2 = polygon[i2];

            // find the line perpendicular to this edge
            const normal = {
                x: p2.y - p1.y,
                y: p1.x - p2.x,
            };

            minA = maxA = undefined;
            // for each vertex in the first shape, project it onto the line perpendicular to the edge
            // and keep track of the min and max of these values
            for (j = 0; j < a.length; j++) {
                projected = normal.x * a[j].x + normal.y * a[j].y;
                if (minA == null || projected < minA) {
                    minA = projected;
                }
                if (maxA == null || projected > maxA) {
                    maxA = projected;
                }
            }

            // for each vertex in the second shape, project it onto the line perpendicular to the edge
            // and keep track of the min and max of these values
            minB = maxB = undefined;
            for (j = 0; j < b.length; j++) {
                projected = normal.x * b[j].x + normal.y * b[j].y;
                if (minB == null || projected < minB) {
                    minB = projected;
                }
                if (maxB == null || projected > maxB) {
                    maxB = projected;
                }
            }

            // if there is no overlap between the projects, the edge we are looking at separates the two
            // polygons, and we know there is no overlap
            if (maxA < minB || maxB < minA) {
                return false;
            }
        }
    }
    return true;
}

function convexHull(points) {
    // points can be formated either two ways:
    // [ {x:1, y:1}, {x:2, y:2} ]
    // [ [1, 1], [2, 2] ]
    // returns points out in whatever format they where input as

    const isArrayFormat = Array.isArray(points[0]);

    // Normalize to {x, y} format
    const normalizedPoints = points.map((p) => (isArrayFormat ? { x: p[0], y: p[1] } : p));

    function cross(a, b, o) {
        return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    }

    normalizedPoints.sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

    const lower = [];
    for (let i = 0; i < normalizedPoints.length; i++) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], normalizedPoints[i]) <= 0) {
            lower.pop();
        }
        lower.push(normalizedPoints[i]);
    }

    const upper = [];
    for (let i = normalizedPoints.length - 1; i >= 0; i--) {
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], normalizedPoints[i]) <= 0) {
            upper.pop();
        }
        upper.push(normalizedPoints[i]);
    }

    upper.pop();
    lower.pop();
    const result = lower.concat(upper);

    // Convert back to original format if needed
    if (isArrayFormat) {
        return result.map((p) => [p.x, p.y]);
    } else {
        return result;
    }
}
