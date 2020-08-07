var idbPromise = idb.open('crdt-app', 1, function(upgradeDb) {
        console.log('Creating object stores')
        upgradeDb.createObjectStore('operations', { keyPath: '__id'});
        upgradeDb.createObjectStore('recipes', { keyPath: '__id'});
        upgradeDb.createObjectStore('ingredients', { keyPath: '__id'});
});

function getAllOperations(){
    idbPromise.then ( db => {
        let transaction = db.transaction('operations', 'readonly');
        let store = transaction.objectStore('operations');
        return store.getAll();
    }).then( a => {
        console.log(a)
    })
}

function saveOperation(operation) {
    idbPromise.then( db => {
        let transaction = db.transaction('operations', 'readwrite');
        let store = transaction.objectStore('operations');
        return store.put(operation);
    });
};

function fetchOperations() {
    return idbPromise.then ( db => {
        let transaction = db.transaction('operations', 'readonly');
        let store = transaction.objectStore('operations');
        return store.getAll();
    });
}

function postObject(storeName, object){
    idbPromise.then (db => {
        let transaction = db.transaction(storeName, 'readwrite');
        let store = transaction.objectStore(storeName);
        return store.put(object);
    })
}

function applyOperation(operation) {
    console.log(operation)
    idbPromise.then (db => {
        let transaction = db.transaction(operation.store, 'readwrite');
        let store = transaction.objectStore(operation.store);
        return store.get(operation.object);
    }).then ( result => {
        if (result == undefined) {
            console.log('Object does not exist, creating empty opject')
            var update = {}
            update.__id = operation.object
        }
        else {
            console.log('RESULT', result)
            console.log('OPERATION', operation)
            var update = result;
        }
        update[operation.key] = operation.value;
        console.log(update)
        return postObject(operation.store, update)
    }).then(() => {
        return saveOperation(operation)
    })
}

function fetchObjectById(storeName, objectId) {
    idbPromise.then (db => {
        let transaction = db.transaction(storeName, 'readwrite');
        let store = transaction.objectStore(storeName);
        return store.get(objectId);
    }).then ( result => {
        if (result === undefined) {
            return new Promise( (resolve, reject) => {
                resolve('undefined')
            });
        }
        else {
            return store.get(objectId);
        }
    })
}