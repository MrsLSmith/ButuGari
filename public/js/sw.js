this.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('v1').then(function(cache) {
      return cache.addAll([
        '/',
        '/index.html',
        '/css/style.css',
        '/css/responsive.css',
        '/js/main.js',
        '/img/ButuGariLogo.png'
      ]);
    })
  );
});


if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/js/sw.js')
  .then(function(reg) {
    // registration worked
    console.log('Registration succeeded');
  }).catch(function(error) {
    // registration failed
    console.log('Registration failed with ' + error);
  });
}


this.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(resp) {
      return resp || fetch(event.request).then(function(response) {
        caches.open('v1').then(function(cache) {
          cache.put(event.request, response.clone());
        });
        return response;
      });
    }).catch(function() {
      console.log('wat');
    })
  );
});
