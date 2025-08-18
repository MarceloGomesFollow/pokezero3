const CACHE_NAME = 'pokerzero3-fc-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/constants.ts',
  '/metadata.json',
  '/lib/poker.ts',
  '/lib/audio.ts',
  '/lib/championshipApi.ts',
  '/lib/championshipCalculations.ts',
  '/components/Card.tsx',
  '/components/ChampionshipView.tsx',
  '/components/CommunityCards.tsx',
  '/components/GameBoard.tsx',
  '/components/GameSetup.tsx',
  '/components/LandingPage.tsx',
  '/components/PasswordModal.tsx',
  '/components/Player.tsx',
  '/components/PlayerActions.tsx',
  '/components/Scoreboard.tsx',
  '/components/SponsorBanner.tsx',
  '/components/ZoomControls.tsx',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap',
  'https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLBT5Z1xlFd2JQEk.woff2', // Cache for offline font
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://esm.sh/react@19.1.1',
  'https://esm.sh/react-dom@19.1.1/client'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching assets');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // Not in cache - fetch from network
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
