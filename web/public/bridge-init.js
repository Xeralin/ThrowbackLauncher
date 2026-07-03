(function () {
  if (typeof window === "undefined") return;

  var tries = 0;

  function init() {
    if (window.throwback) return;
    if (!window.qt || !window.qt.webChannelTransport) {
      if (tries++ < 200) setTimeout(init, 50);
      return;
    }
    var script = document.createElement("script");
    script.src = "/qwebchannel.js";
    script.onload = function () {
      new QWebChannel(window.qt.webChannelTransport, function (channel) {
        window.throwback = channel.objects;
        window.dispatchEvent(new Event("throwback:ready"));
      });
    };
    document.head.appendChild(script);
  }

  init();
})();
