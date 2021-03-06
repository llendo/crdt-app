### Anleitung zum Aufsetzen:
Der Client lässt sich einfach über das Aufrufen der `index.html` über einen lokalen Webserver starten.

Wenn ein lokaler Server zum Synchronisieren genutzt werden soll, muss die URL 
```JS
if (event.request.url == "https://crdt-app-server.herokuapp.com/api/sync") {
```
in der Funktion `sync` in der Datei `crdt.js` durch die des lokalen Servers ersetzt werden, z.B.:
```JS
if (event.request.url == "localhost:8001/api/sync") {
```
Alternativ zum lokalen Aufsetzen ist der gesamte Prototyp auch gehostet auf:
https://thesis-recipebook.netlify.app/

### Anleitung zur Benutzung:

Nach dem ersten Starten einmal den `Sync` Knopf drücken, um die Daten vom Server zu bekommen.
Anschließend kann der lokale Stand immer per `Sync` Knopf mit dem Server synchronisiert werden.
Interessant ist es, offline auf verschiedenen Browsern/Geräten eine Hand voll Änderungen vorzunehmen (ruhig verschiedene Änderungen am Gleichen Rezept) und anschließend beide zu Synchronisieren. Daraufhin werden beide Browser/Geräte auf dem gleichen Stand sein. 

#### Nachtrag 29.08.:
Beim Aufräumen des Codes hatte sich leider ein kleiner Fehler eingeschlichen, der nun behoben ist:
Die Methode `updateObject` muss ihre Änderungen direkt Speichern, anstatt `saveObject` aufzurufen. Würde die Änderung über `saveObject` gespeichert werden (wie es nach dem Aufräumen der Fall war), öffnet dies eine neue Transaktion. Das Objekt muss jedoch in der gleichen Transaktion gespeichert werden, um zu Verhindern, dass in der Zwischenzeit andere Operationen das gleiche Objekt bearbeiten bevor es gespeichert wurde. Somit konnte es passieren, dass mehrere Operationen am gleichen Objekt sich gegenseitig überschrieben haben. Diese Änderung habe ich nun Rückgängig gemacht.

Somit ist der letzte Satz auf Seite 54 der Thesis inkorrekt: 
>"Dies erfolgt über die gleiche Methode, mit welcher zuvor schon die Operation gespeichert wurde." 

müsste heißen:

>"Dies erfolgt direkt über die idb Methode *store.put*, damit das geänderte Objekt noch in der selben Transaktion gespeichert wird."
