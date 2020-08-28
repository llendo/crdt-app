"use strict";

var cachename = "recipebook-v0.1";
var urlstocache = [
    "index.html",
    "app.js",
    "crdt.js",
    "database.js",
    "/ext/idb.js",
    "app.css",
    "https://unpkg.com/vue-material@0.7.4/dist/vue-material.js",
    "https://unpkg.com/vue@2.4.2/dist/vue.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/cuid/1.3.8/browser-cuid.min.js",
    "https://unpkg.com/vue-material@0.7.4/dist/vue-material.css",
    "//fonts.googleapis.com/css?family=Roboto:300,400,500,700,400italic",
    "//fonts.googleapis.com/icon?family=Material+Icons",
];

self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(cachename).then(function (cache) {
            console.log("cache opened");
            return cache.addAll(urlstocache);
        }),
    );
});

self.addEventListener("fetch", function (event) {
    if (event.request.url == "https://crdt-server.herokuapp.com/api/sync") {
        event.respondWith(fetch(event.request));
    } else {
        event.respondWith(
            caches.match(event.request).then(function (response) {
                return response || fetch(event.request);
            }),
        );
    }
});

self.addEventListener("activate", function (event) {
    console.log("worker activated");
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys
                    .filter(function (key) {
                        return key !== cachename;
                    })
                    .map(function (key) {
                        return caches.delete(key);
                    }),
            );
        }),
    );
});
