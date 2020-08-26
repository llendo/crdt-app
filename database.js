var idbPromise = idb.open("crdt-app", 2, function (upgradeDb) {
    switch (upgradeDb.oldVersion) {
        case 0:
        case 1:
            upgradeDb.createObjectStore("operations", { keyPath: "_id" });
            upgradeDb.createObjectStore("recipes", { keyPath: "_id" });
            upgradeDb.createObjectStore("ingredients", { keyPath: "_id" });
    }
});

function saveObject(storeName, object) {
    idbPromise.then((db) => {
        let transaction = db.transaction(storeName, "readwrite");
        let store = transaction.objectStore(storeName);
        return store.put(object);
    });
}

function deleteOperation(id) {
    idbPromise.then((db) => {
        let transaction = db.transaction("operations", "readwrite");
        let store = transaction.objectStore("operations");
        return store.delete(id);
    });
}

function getAllFromStore(storeName) {
    return idbPromise.then((db) => {
        let transaction = db.transaction(storeName, "readonly");
        let store = transaction.objectStore(storeName);
        return store.getAll();
    });
}

function getSingleObjectFromStore(storeName, objectID) {
    return idbPromise.then((db) => {
        let transaction = db.transaction(storeName, "readonly");
        let store = transaction.objectStore(storeName);
        return store.get(objectID);
    });
}
