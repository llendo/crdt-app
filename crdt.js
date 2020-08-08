//TODO Find a way to save Operations

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
        __id: 'op_' + cuid()
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


function modifyObject(object, operation){
    return new Promise(function(resolve, reject){
        if(object == undefined){
            object = {
                __id: operation.object
            };
        };
        var modifiedObject = object;
        modifiedObject[operation.key] = operation.value;
        saveOperation(operation)
        resolve(modifiedObject);
    })
}

function updateObject(operation, storeName){
    return idbPromise.then(db => {
        var transaction = db.transaction(storeName, 'readwrite');
        var store = transaction.objectStore(storeName);
        return store.get(operation.object).then( objectToUpdate => {
            return modifyObject(objectToUpdate, operation)
        }).then(modifiedObject => {
            return store.put(modifiedObject)
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
            //valid operations is a map of store name and valid operations for that store
            //like this: storeName:operations[]
                //sieht komisch aus: array machen aus den keys, für jeden key die funktion ausführen)
                //es kommen zurück: 0, 1, oder 2 arrays mit modifizierten objekten.
function processOperations(newOperations){
    if (newOperations.length > 0) {
        getAllFromStore('operations').then( localOperations => {
            console.log(localOperations)
            return mapOperations(localOperations, newOperations);
        }).then( mappedOperations => {
            return filterOperationsToApply(mappedOperations);
        }).then( validOperationsMap => {
            return Promise.all(
                Array.from(validOperationsMap.keys()).map( storeName => {
                    return Promise.all(
                        validOperationsMap.get(storeName).map( validOperation => {
                            return updateObject(validOperation, storeName)
                        })
                    )
                })
             )
        // }).then( modifiedObjectMaps => {
        //     updateProductStores(modifiedObjectMaps);
        }).catch(e => {
            console.log(e);
        })
    } else {
        console.log('No new operations found')
    }
}

function mapOperations(localOperations, newOperations){
    return new Promise((resolve, reject) => {
        let mappedOperations = new Map();
        let sortedLocalOperations = localOperations.sort((a, b) => {
            return b.timestamp - a.timestamp;
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
        if(mappedOperations.size > 0){
            console.log('Mapped new operations to local operations')
            resolve (mappedOperations);
        } else {
            reject(new Error('Error: No operations to map. Something went wrong or there might be no incoming operations. This should not happen.'))
        }
    });
}

function filterOperationsToApply(mappedOperations){
    return new Promise((resolve, reject) => {
        let recipeOperationsToApply = [];
        let ingredientOperationsToApply = [];
        Array.from(mappedOperations.keys()).forEach(mappedOperation => {
            let recentMatchingOperation = mappedOperations.get(mappedOperation)
            if (!recentMatchingOperation || mappedOperation.timestamp > recentMatchingOperation){
                if(mappedOperation.store == 'recipes'){
                    recipeOperationsToApply.push(mappedOperation)
                }else
                    ingredientOperationsToApply.push(mappedOperation)
            }
        })
        let operationsToApply = new Map([
            ['recipes', recipeOperationsToApply],
            ['ingredients', ingredientOperationsToApply]
        ])
        if(operationsToApply.get('recipes').length > 0 || operationsToApply.get('ingredients').length > 0){
            resolve(operationsToApply);
        }
        reject('Local operations are already up to date. No newer operations found!');
    })
}