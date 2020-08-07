/* global self, caches, fetch */
/*
'use strict'

var cachename = 'recipebook-v0.1'
var urlstocache = [
  'index.html',
  'recipebook.js',
  'recipebook.css',
  'https://unpkg.com/vue-material@0.7.4/dist/vue-material.js',
  'https://unpkg.com/vue@2.4.2/dist/vue.js',
  'https://cdnjs.cloudflare.com/ajax/libs/cuid/1.3.8/browser-cuid.min.js',
  'https://unpkg.com/vue-material@0.7.4/dist/vue-material.css',
  '//fonts.googleapis.com/css?family=Roboto:300,400,500,700,400italic',
  '//fonts.googleapis.com/icon?family=Material+Icons'
];
// install/cache page assets
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(cachename)
      .then(function (cache) {
        console.log('cache opened')
        return cache.addAll(urlstocache)
      })
  )
})

// intercept page requests
self.addEventListener('fetch', function (event) {
  console.log(event.request.url)
  event.respondWith(
    caches.match(event.request).then(function (response) {
      // serve requests from cache (if found)
      return response || fetch(event.request)
    })
  )
})

// service worker activated, remove outdated cache
self.addEventListener('activate', function (event) {
  console.log('worker activated')
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) {
          // filter old versioned keys
          return key !== cachename
        }).map(function (key) {
          return caches.delete(key)
        })
      )
    })
  )
}) */