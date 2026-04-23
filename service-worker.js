/* ============================================
   SERVICE WORKER - PWA CACHE STRATEGY
   ============================================
   Cachea archivos críticos para funcionar offline
   y mejora velocidad de carga
*/

const CACHE_NAME = "pool-app-cache-v1";
const urlsToCache = [
  "/Proyecto-Pool/",
  "/Proyecto-Pool/index.html",
  "/Proyecto-Pool/styles.css",
  "/Proyecto-Pool/script.js",
  "/Proyecto-Pool/firebase-auth-ui.js",
  "/Proyecto-Pool/firebase-config.js",
  "/Proyecto-Pool/firestore-wrapper.js"
];

/* ============================================
   INSTALL EVENT - Crear cache
   ============================================ */
self.addEventListener("install", event => {
  console.log("[SW] Instalando Service Worker...");
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log("[SW] Cache creado:", CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error("[SW] Error al crear cache:", err))
  );
  
  // Activar inmediatamente (sin esperar a que se cierren tabs)
  self.skipWaiting();
});

/* ============================================
   ACTIVATE EVENT - Limpiar caches viejos
   ============================================ */
self.addEventListener("activate", event => {
  console.log("[SW] Activando Service Worker...");
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log("[SW] Eliminando cache antiguo:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
  
  // Tomar control de todos los clientes inmediatamente
  return self.clients.claim();
});

/* ============================================
   FETCH EVENT - Estrategia Cache First
   ============================================
   1. Buscar en cache
   2. Si no está, hacer request
   3. Guardar respuesta en cache si es exitosa
*/
self.addEventListener("fetch", event => {
  // Ignorar requests no-GET
  if (event.request.method !== "GET") {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si está en cache, devolver
        if (response) {
          console.log("[SW] Cache HIT:", event.request.url);
          return response;
        }
        
        // Si no está, hacer fetch
        return fetch(event.request)
          .then(fetchResponse => {
            // Validar que sea una respuesta válida
            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type === "error") {
              return fetchResponse;
            }
            
            // Clonar la respuesta para guardarla en cache
            const responseToCache = fetchResponse.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
                console.log("[SW] Cached:", event.request.url);
              })
              .catch(err => console.warn("[SW] Error al cachear:", err));
            
            return fetchResponse;
          })
          .catch(err => {
            // Si falla el fetch, intentar devolver de cache
            console.warn("[SW] Fetch fallido:", event.request.url);
            return caches.match(event.request)
              .then(cachedResponse => cachedResponse || new Response("Offline - Sin conexión"));
          });
      })
  );
});
