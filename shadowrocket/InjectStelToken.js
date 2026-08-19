(function () {
  var NOTICE_KEY = 'fragment_token_inject_notice_state_v3';

  function parseArgument(input) {
    var text = String(input || '').trim();
    if (!text) return '';

    var match = text.match(/(?:^|&)token=([^&]*)/i);
    if (match) {
      try {
        return decodeURIComponent(match[1]);
      } catch (_) {
        return match[1];
      }
    }

    return text;
  }

  function normalizeToken(token) {
    token = String(token || '').trim();
    token = token.replace(/^stel_token\s*=\s*/i, '');
    token = token.replace(/[\r\n;]/g, '');
    return token.trim();
  }

  function getHeader(headers, name) {
    var target = String(name).toLowerCase();
    for (var key in headers) {
      if (Object.prototype.hasOwnProperty.call(headers, key) && String(key).toLowerCase() === target) {
        return String(headers[key] || '');
      }
    }
    return '';
  }

  function findHeaderKey(headers, name) {
    var target = String(name).toLowerCase();
    for (var key in headers) {
      if (Object.prototype.hasOwnProperty.call(headers, key) && String(key).toLowerCase() === target) {
        return key;
      }
    }
    return name;
  }

  function isDocumentRequest(headers) {
    var dest = getHeader(headers, 'Sec-Fetch-Dest').toLowerCase();
    var accept = getHeader(headers, 'Accept').toLowerCase();
    if (dest === 'document') return true;
    if (accept.indexOf('text/html') !== -1 || accept.indexOf('application/xhtml+xml') !== -1) return true;
    return false;
  }

  function tokenFingerprint(text) {
    text = String(text || '');
    var h = 2166136261;
    for (var i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ('00000000' + (h >>> 0).toString(16)).slice(-8) + ':' + text.length;
  }

  function readNoticeState() {
    try {
      var raw = $persistentStore.read(NOTICE_KEY);
      if (!raw) return { mode: '', fp: '' };
      var obj = JSON.parse(raw);
      return { mode: String(obj.mode || ''), fp: String(obj.fp || '') };
    } catch (_) {
      return { mode: '', fp: '' };
    }
  }

  function writeNoticeState(mode, fp) {
    try {
      return $persistentStore.write(JSON.stringify({ mode: mode, fp: fp || '' }), NOTICE_KEY);
    } catch (_) {
      return false;
    }
  }

  function injectStelToken(cookie, token) {
    var source = String(cookie || '').trim();
    var pair = 'stel_token=' + token;
    if (!source) return pair;
    if (/(?:^|;\s*)stel_token=[^;]*/i.test(source)) {
      return source.replace(/(^|;\s*)stel_token=[^;]*/i, function (_, prefix) {
        return prefix + pair;
      });
    }
    return source.replace(/;\s*$/, '') + '; ' + pair;
  }

  try {
    var requestHeaders = {};
    var sourceHeaders = ($request && $request.headers) || {};
    for (var hk in sourceHeaders) {
      if (Object.prototype.hasOwnProperty.call(sourceHeaders, hk)) requestHeaders[hk] = sourceHeaders[hk];
    }

    var documentRequest = isDocumentRequest(requestHeaders);
    var argument = typeof $argument !== 'undefined' ? $argument : '';
    var token = normalizeToken(parseArgument(argument));

    if (!token) {
      if (documentRequest) {
        var emptyState = readNoticeState();
        if (emptyState.mode !== 'empty') {
          writeNoticeState('empty', '');
          $notification.post('Fragment Token Inject', '未填写 stel_token', '请在脚本参数中填写 token=你的Token');
        }
      }
      console.log('[Fragment Token Inject] 未填写 Token，本次请求不修改。');
      return $done({});
    }

    var cookieKey = findHeaderKey(requestHeaders, 'Cookie');
    requestHeaders[cookieKey] = injectStelToken(requestHeaders[cookieKey], token);

    if (documentRequest) {
      var fp = tokenFingerprint(token);
      var successState = readNoticeState();
      if (successState.mode !== 'success' || successState.fp !== fp) {
        writeNoticeState('success', fp);
        $notification.post('Fragment Token Inject', 'Token 注入成功');
      }
    }

    console.log('[Fragment Token Inject] stel_token 已注入');
    return $done({ headers: requestHeaders });
  } catch (e) {
    console.log('[Fragment Token Inject] ' + (e && e.stack ? e.stack : e));
    return $done({});
  }
})();
