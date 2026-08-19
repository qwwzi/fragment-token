(function () {
  // 相同 stel_token 在这个时间内不重复通知。
  // 例如：10 * 1000 = 10 秒；60 * 1000 = 60 秒。
  var NOTIFY_COOLDOWN = 10 * 1000;
  var STORAGE_KEY = '__fragment_stel_token_notify_state__';

  function done() {
    $done({});
  }

  function getHeaderIgnoreCase(headers, name) {
    if (!headers) return '';
    var target = String(name).toLowerCase();
    for (var key in headers) {
      if (
        Object.prototype.hasOwnProperty.call(headers, key) &&
        String(key).toLowerCase() === target
      ) {
        return String(headers[key] || '');
      }
    }
    return '';
  }

  function safeDecode(value) {
    try {
      return decodeURIComponent(value);
    } catch (e) {
      return value;
    }
  }

  function readState() {
    try {
      var raw = $persistentStore.read(STORAGE_KEY);
      if (!raw) return { token: '', time: 0 };

      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return { token: '', time: 0 };
      }

      return {
        token: typeof parsed.token === 'string' ? parsed.token : '',
        time: Number(parsed.time) || 0
      };
    } catch (e) {
      console.log('[GetStelToken] 读取去重状态失败: ' + e);
      return { token: '', time: 0 };
    }
  }

  function writeState(token, time) {
    try {
      return $persistentStore.write(
        JSON.stringify({ token: token, time: time }),
        STORAGE_KEY
      );
    } catch (e) {
      console.log('[GetStelToken] 写入去重状态失败: ' + e);
      return false;
    }
  }

  try {
    var cookie = getHeaderIgnoreCase($request && $request.headers, 'cookie');
    if (!cookie) return done();

    var match = cookie.match(/(?:^|;\s*)stel_token=([^;]+)/i);
    if (!match || !match[1]) return done();

    var stelToken = safeDecode(match[1].trim());
    if (!stelToken) return done();

    var now = Date.now();
    var state = readState();
    var sameToken = stelToken === state.token;
    var elapsed = now - state.time;

    // token 变化：立即通知。
    // token 相同：只有超过冷却时间后才再次通知。
    var shouldNotify = !sameToken || elapsed >= NOTIFY_COOLDOWN;

    if (shouldNotify) {
      // 先持久化，再通知。这样后续请求会尽早看到最新状态。
      var saved = writeState(stelToken, now);

      // Shadowrocket 正常支持 $persistentStore。
      // 若持久化写入失败，不发送通知，避免退化成每个请求都重复弹窗。
      if (saved !== false) {
        $notification.post(
          '已获取 token',
          'fragment.com',
          stelToken
        );
      }
    }
  } catch (e) {
    console.log('[GetStelToken] ' + (e && e.stack ? e.stack : e));
    $notification.post('stel_token 获取失败', 'fragment.com', String(e));
  }

  done();
})();