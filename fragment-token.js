(function () {
  function finish() {
    try { $done({}); } catch (_) {}
  }

  try {
    var url = String(($request && $request.url) || "");
    if (!/^https:\/\/fragment\.com(?::\d+)?(?:\/|$)/i.test(url)) return finish();

    var headers = ($request && $request.headers) || {};
    var cookie = "";
    Object.keys(headers).some(function (name) {
      if (name.toLowerCase() === "cookie") {
        var value = headers[name];
        cookie = Array.isArray(value) ? value.join("; ") : String(value || "");
        return true;
      }
      return false;
    });

    var token = "";
    cookie.split(";").some(function (item) {
      var separator = item.indexOf("=");
      if (separator < 0) return false;
      if (item.slice(0, separator).trim() === "stel_token") {
        token = item.slice(separator + 1).trim();
        return true;
      }
      return false;
    });

    var now = Date.now();
    var storageKey = "fragment_stel_token_last_notice";
    var lastNotice = 0;
    try { lastNotice = Number($persistentStore.read(storageKey)) || 0; } catch (_) {}

    if (!lastNotice || now - lastNotice >= 15000) {
      if (token) {
        try { $notification.post("Fragment Token", "已捕捉到Token，点击打开复制！", token); } catch (_) {}
      } else {
        try { $notification.post("Fragment Token", "未找到Token，请检查是否已登录账号！"); } catch (_) {}
      }
      try { $persistentStore.write(String(now), storageKey); } catch (_) {}
    }
  } catch (_) {}

  finish();
})();
