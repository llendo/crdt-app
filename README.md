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
