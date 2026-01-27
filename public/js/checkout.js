(function(window, document) {
  'use strict';

  function loadZenoPayServices() {
    if (window.ZenoPay) return;

    const script = document.createElement('script');
    script.src = window.location.origin + '/js/zenopay-services.js';
    document.head.appendChild(script);
  }

  loadZenoPayServices();

})(window, document);