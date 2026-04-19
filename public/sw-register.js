(() => {
  if (!('serviceWorker' in navigator)) return;

  let hasRefreshed = false;

  const activateUpdate = (registration) => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      return;
    }
    window.location.reload();
  };

  const trackInstallingWorker = (registration) => {
    const worker = registration.installing;
    if (!worker) return;

    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        activateUpdate(registration);
      }
    });
  };

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hasRefreshed) return;
    hasRefreshed = true;
    window.location.reload();
  });

  navigator.serviceWorker
    .register('/sw.js')
    .then((registration) => {
      if (registration.waiting) {
        activateUpdate(registration);
      }

      registration.addEventListener('updatefound', () => {
        trackInstallingWorker(registration);
      });

      // Pull for updates on page load as well.
      registration.update().catch(() => {});
    })
    .catch(console.error);
})();
