
// Fix for RevenueCat and other libraries that try to overwrite window.fetch in environments where it's a getter-only property
(function() {
  try {
    const originalFetch = window.fetch;
    if (originalFetch) {
      let currentFetch = originalFetch;
      Object.defineProperty(window, 'fetch', {
        get: () => currentFetch,
        set: (v) => { currentFetch = v; },
        configurable: true,
        enumerable: true
      });
    }
  } catch (e) {
    console.warn("Muriell: Could not make window.fetch writable in module context.", e);
  }
})();
