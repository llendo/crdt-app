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

function generateUpdateOperation (store, object, key, value) {
    let targetStore = store;
    let targetObject = object;
    let targetKey  = key;
    let targetValue = value;
    let timestamp = Date.now();
    console.log ('changed ', targetObject, 'property', targetKey, 'to', targetValue, 'in',  targetStore);
    return {
        //Nicht durcheinanderkommen: In der Datenbank ist der Key die objectID
        //Der Key in diesem Objekt ist der des zu ändernden Values
        store: targetStore,
        object: targetObject,
        key: targetKey,
        value: targetValue,
        timestamp: timestamp,
        __id: 'message:' + cuid()
    }
}

function generateDeleteOperation (store, object) {
    let targetStore = store;
    let targetObject = object;
    let timestamp = Date.now();
    console.log ('deleted ', targetObject, 'in Store ', targetStore);
    navigator.storage.estimate().then((data)=>console.log(data))
    return {
        store: targetStore,
        object: targetObject,
        key: 'tombstone',
        value: 1,
        timestamp: timestamp,
        __id: 'op_' + cuid()
    }
}

function applyOperationn(operation){
    fetchObjectById(operation.store, operation.object)
        .then(result => {
            console.log(result);
            targetField = operation.key;
            result.targetField = operation.value;
        });
}

function modifyObjects(operations, storeName){
    return dbPromise.then(db => {
        var transaction = db.transaction(storeName);
        var store = transaction.objectStore(storeName);
        return Promise.all(
            operations.map( operation => {
                return store.get(operation.object).then( objectToModify => {
                    //Store.get returns undefined when the object was not found.
                    //in that case, we need to create the object with the corresponding ID
                    //otherwise we can't modify an undefined object
                    if(objectToModify == undefined){
                        objectToModify = {
                            __id: operation.object
                        };
                    };
                    return modifyObject(objectToModify, operation);
                })
            })
        ).then(modifiedObjects => {
            return createStoreToObjectsMap(modifiedObjects, storeName);
        })
    })
}

function createStoreToObjectsMap(objects, storeName){
    return new Promise ((resolve, reject) => {
        let storeNameToModifiedObjectsMap = new Map([
            [storeName, objects]
        ])
        resolve(storeNameToModifiedObjectsMap);
    })
}

function modifyObject(object, operation){
    return new Promise(function(resolve, reject){
        var modifiedObject = object;
        modifiedObject[operation.key] = operation.value;
        console.log(update)
        resolve(modifiedObject);
    })
}

function reallyApplyOperations(operations){
    console.log(operations)
    Promise.all(operations.map(operation => {
         applyOperation(operation)
            .then(operation => {
                console.log("applied", operation)
                saveOperation(operation)
            })
            .catch(e =>{
                console.log(e)
            })
    }))
}

function applyOperations(newOperations) {
    console.log('hi')
    let mappedOperations = mapToMatchingLocalOperations(newOperations);
    let operationsToApply = [];
    newOperations.forEach(newOperation => {
        let recentMatchingOperation = mappedOperations.get(newOperation)
        if (!recentMatchingOperation || newOperation.timestamp > recentMatchingOperation){
            //applyOperation(newOperation)
            operationsToApply.push[newOperation]
        }
    })
    reallyApplyOperations(operationsToApply);
}

function mapToMatchingLocalOperations(newOperations) {
    console.log('burr')
    let mappedOperations = new Map();
    fetchOperations()
        .then(result => {
            let sortedLocalOperations = result.sort((a, b) => {
                return a.timestamp - b.timestamp;
            });
            //Array.find returned die erste passende, locale operation 
            newOperations.forEach(newOperation => {
                let mostRecentMatchingLocalOperation = sortedLocalOperations.find( operation =>
                    operation.store === newOperation.store  &&
                    operation.object === newOperation.object  &&
                    operation.key === newOperation.key  
                );
                mappedOperations.set(newOperation, mostRecentMatchingLocalOperation);
            });
        });
    console.log('mapped new operations to local operations :', mappedOperations)
    return mappedOperations;
}

function handleOperations(newOperations){
    fetchOperations().then( localOperations => {
        console.log('hi')
        return mapOperations(localOperations, newOperations);
    }).then( mappedOperations => {
        console.log('hi2')
        return filterOperationsToApply(mappedOperations);
    }).then( validOperationsMap => {
        console.log('h3')
        //valid operations is a map of store name and valid operations for that store
        //like this: storeName:operations[]
        return Promise.all(
            //sieht komisch aus: array machen aus den keys, für jeden key die funktion ausführen)
            //es kommen zurück: 0, 1, oder 2 arrays mit modifizierten objekten.
            Array.from(validOperationsMap.keys()).map( storeName => {
                return modifyObjects(validOperationsMap[storeName], storeName)
            })
        )
    }).then( modifiedObjectMapArray => {
        console.log('hi4')
        updateProductStores(modifiedObjectMapArray)
    })
}

function updateProductStores(objectMapArray) {
    Promise.all(objectMapArray.map (storeNameToObjectMap => {
        dbPromise.then( db => {
            storeName = Object.keys(storeNameToObjectMap)[0];
            objects = storeNameToObjectMap[storeName];
            var transaction = db.transaction(storeName, 'readwrite');
            var store = transaction.objectStore(storeName);
            return Promise.all(objects.map( (object) => {
                return store.put(item);
            }
            ))
        })
    })).catch( e => {
        console.log(e)
    }).then(() => {
        console.log('Product store updated successfully')
    })
}


function mapOperations(localOperations, newOperations){
    return new Promise((resolve, reject) => {
        let mappedOperations = new Map();
        let sortedLocalOperations = localOperations.sort((a, b) => {
            return a.timestamp - b.timestamp;
        });
        newOperations.forEach(newOperation => {
            mostRecentMatchingLocalOperation = sortedLocalOperations.find( localOperation =>
                localOperation.store === newOperation.store  &&
                localOperation.object === newOperation.object  &&
                localOperation.key === newOperation.key  
            );
            //most recent matching local operation can be undefined
            //mapped operations cannot be undefined as long as there are operations
            mappedOperations.set(newOperation, mostRecentMatchingLocalOperation);
        });
        if(mappedOperations.length > 0){
            console.log('mapped new operations to local operations :', mappedOperations)
            resolve (mappedOperations);
        }
        reject(new Error('No Operations to Map. There might be no incoming operations.'))
    });
}

function filterOperationsToApply(mappedOperations){
    return new Promise((resolve, reject) => {
        let recipeOperationsToApply = [];
        let ingredientOperationsToApply = [];
        mappedOperations.forEach(mappedOperation => {
            let recentMatchingOperation = mappedOperations.get(mappedOperation)
            if (!recentMatchingOperation || mappedOperation.timestamp > recentMatchingOperation){
                if(mappedOperations.store == 'recipes'){
                    recipeOperationsToApply.push[mappedOperation]
                }else
                    ingredientOperationsToApply.push[mappedOperation]
            }
        })
        let operationsToApply = new Map([
            ['recipes', recipeOperationsToApply],
            ['ingredients', ingredientOperationsToApply]
        ])
        if(operationsToApply.get('recipes').length > 0 || operationsToApply.get('ingredients').length > 0){
            resolve(operationsToApply);
        }
        reject(new Error('No Operations to Apply. Incoming operations are already applied!'));
    })
}