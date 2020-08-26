//TODO Find a way to save Operations

function generateUpdateOperation(store, Id, key, value) {
    let targetStore = store;
    let targetObject = Id;
    let targetKey = key;
    let targetValue = value;
    let timestamp = Date.now();
    console.log(
        "Changed " +
            targetObject +
            "property " +
            targetKey +
            "to " +
            targetValue +
            "in " +
            targetStore,
    );
    return {
        store: targetStore,
        object: targetObject,
        key: targetKey,
        value: targetValue,
        timestamp: timestamp,
        _id: "op_" + cuid(),
    };
}

function generateDeleteOperation(store, Id) {
    let targetStore = store;
    let targetObject = Id;
    let timestamp = Date.now();
    console.log("deleted " + targetObject + "in Store ", targetStore);
    //navigator.storage.estimate().then((data)=>console.log(data))
    return {
        store: targetStore,
        object: targetObject,
        key: "tombstone",
        value: 1,
        timestamp: timestamp,
        _id: "op_" + cuid(),
    };
}

function modifyObject(object, operation) {
    return new Promise(function (resolve, reject) {
        if (object == undefined) {
            object = {
                _id: operation.object,
            };
        }
        var modifiedObject = object;
        modifiedObject[operation.key] = operation.value;
        saveObject("operations", operation);
        resolve(modifiedObject);
    });
}

function updateObject(operation, storeName) {
    return getSingleObjectFromStore(storeName, operation.object)
        .then((objectToUpdate) => {
            return modifyObject(objectToUpdate, operation);
        })
        .then((modifiedObject) => {
            return saveObject(storeName, modifiedObject);
        });
}

//valid operations is a map of store name and valid operations for that store
//like this: storeName:operations[]
//sieht komisch aus: array machen aus den keys, für jeden key die funktion ausführen)
//es kommen zurück: 0, 1, oder 2 arrays mit modifizierten objekten.
function processOperations(newOperations) {
    if (newOperations.length > 0) {
        return getAllFromStore("operations")
            .then((localOperations) => {
                //console.log(localOperations)
                return mapOperations(localOperations, newOperations);
            })
            .then((mappedOperations) => {
                return filterOperationsToApply(mappedOperations);
            })
            .then((validOperationsMap) => {
                return Promise.all(
                    Array.from(validOperationsMap.keys()).map((storeName) => {
                        return Promise.all(
                            validOperationsMap
                                .get(storeName)
                                .map((validOperation) => {
                                    return updateObject(
                                        validOperation,
                                        storeName,
                                    );
                                }),
                        );
                    }),
                );
            })
            .catch((e) => {
                console.log(e);
            });
    } else {
        console.log("No new operations found");
        return Promise.resolve();
    }
}

function mapOperations(localOperations, newOperations) {
    return new Promise((resolve, reject) => {
        let mappedOperations = new Map();
        let sortedLocalOperations = localOperations.sort((a, b) => {
            return b.timestamp - a.timestamp;
        });
        newOperations.forEach((newOperation) => {
            let mostRecentMatchingLocalOperation = sortedLocalOperations.find(
                (localOperation) =>
                    localOperation.store === newOperation.store &&
                    localOperation.object === newOperation.object &&
                    localOperation.key === newOperation.key,
            );
            //most recent matching local operation can be undefined
            //mapped operations cannot be undefined as long as there are operations
            mappedOperations.set(
                newOperation,
                mostRecentMatchingLocalOperation,
            );
        });
        if (mappedOperations.size > 0) {
            console.log("Mapped new operations to local operations");
            resolve(mappedOperations);
        } else {
            reject(
                new Error(
                    "Error: No operations to map. Something went wrong or there might be no incoming operations. This should not happen.",
                ),
            );
        }
    });
}

function filterOperationsToApply(mappedOperations) {
    return new Promise((resolve, reject) => {
        let recipeOperationsToApply = [];
        let ingredientOperationsToApply = [];
        Array.from(mappedOperations.keys()).forEach((mappedOperation) => {
            let recentMatchingOperation = mappedOperations.get(mappedOperation);
            if (
                !recentMatchingOperation ||
                mappedOperation.timestamp > recentMatchingOperation.timestamp
            ) {
                if (mappedOperation.store == "recipes") {
                    recipeOperationsToApply.push(mappedOperation);
                } else ingredientOperationsToApply.push(mappedOperation);
            }
            if (
                !!recentMatchingOperation &&
                mappedOperation.timestamp > recentMatchingOperation.timestamp
            ) {
                deleteOperation(recentMatchingOperation._id);
            }
        });
        let operationsToApply = new Map([
            ["recipes", recipeOperationsToApply],
            ["ingredients", ingredientOperationsToApply],
        ]);
        if (
            operationsToApply.get("recipes").length > 0 ||
            operationsToApply.get("ingredients").length > 0
        ) {
            resolve(operationsToApply);
        }
        reject(
            "Local operations are already up to date. No newer operations found!",
        );
    });
}

function sync() {
    return getAllFromStore("operations")
        .then((operations) => {
            // return fetch('http://localhost:8081/api/sync', {
            return fetch("https://crdt-app-server.herokuapp.com/api/sync", {
                method: "POST",
                body: JSON.stringify(operations),
                headers: {
                    "Content-Type": "application/json",
                },
            });
        })
        .then((res) => {
            return res.json();
        })
        .then((data) => {
            //console.log(data)
            return processOperations(data);
        })
        .catch((e) => console.log(e));
}
