### Anleitung
Der Client lässt sich einfach über das Aufrufen der `index.html` über einen lokalen Webserver starten.

Wenn ein lokaler Server zum Synchronisieren genutzt werden soll, muss die URL 
```JS
if (event.request.url == "https://crdt-app-server.herokuapp.com/api/sync") {
```
in der Funktion `sync` in der Datei `crdt.js` durch die des lokalen Servers ersetzt werden, z.B.:
```JS
if (event.request.url == "localhost:8001/api/sync") {
```

#### Nachtrag 29.08.:
Beim Aufräumen des Codes hatte sich leider ein kleiner Fehler eingeschlichen, der nun behoben ist:
Die Methode `updateObject` muss ihre Änderungen direkt Speichern, anstatt `saveObject` aufzurufen. Würde die Änderung über `saveObject` gespeichert werden (wie es nach dem Aufräumen der Fall war), öffnet dies eine neue Transaktion. Das Objekt muss jedoch in der gleichen Transaktion gespeichert werden, um zu Verhindern, dass in der Zwischenzeit andere Operationen das gleiche Objekt bearbeiten bevor es gespeichert wurde. Somit konnte es passieren, dass mehrere Operationen am gleichen Objekt sich gegenseitig überschrieben haben. Diese Änderung habe ich nun Rückgängig gemacht.

Somit ist der letzte Satz auf Seite 54 der Thesis inkorrekt: 
>"Dies erfolgt über die gleiche Methode, mit welcher zuvor schon die Operation gespeichert wurde." 

müsste heißen:

>"Dies erfolgt direkt über die idb Methode *store.put*, damit das geänderte Objekt noch in der selben Transaktion gespeichert wird."
