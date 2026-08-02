const DOMAIN = "fragment.com";
const TOKEN_NAME = "stel_token";
const FRAGMENT_URL = `https://${DOMAIN}/`;

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch (e2) {
      return false;
    }
  }
}

function setDot(state) {
  const dot = document.getElementById("status-dot");
  dot.dataset.state = state || "";
}

function cookieUrl(cookie) {
  const protocol = cookie.secure ? "https" : "http";
  const hostname = cookie.domain.replace(/^\./, "");
  return `${protocol}://${hostname}${cookie.path || "/"}`;
}

async function setLoginToken(value) {
  const existingTokens = await chrome.cookies.getAll({
    domain: DOMAIN,
    name: TOKEN_NAME,
  });

  if (existingTokens.length === 0) {
    const created = await chrome.cookies.set({
      url: FRAGMENT_URL,
      name: TOKEN_NAME,
      value,
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "lax",
    });
    if (!created) throw new Error("无法写入登录信息");
    return;
  }

  const updated = await Promise.all(
    existingTokens.map((cookie) => {
      const details = {
        url: cookieUrl(cookie),
        name: TOKEN_NAME,
        value,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
        storeId: cookie.storeId,
      };
      if (!cookie.hostOnly) details.domain = cookie.domain;
      if (!cookie.session && Number.isFinite(cookie.expirationDate)) {
        details.expirationDate = cookie.expirationDate;
      }
      return chrome.cookies.set(details);
    })
  );

  if (updated.some((cookie) => !cookie)) {
    throw new Error("无法更新登录信息");
  }
}

function isFragmentUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname === DOMAIN || hostname.endsWith(`.${DOMAIN}`);
  } catch {
    return false;
  }
}

async function refreshFragmentPage() {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (activeTab?.id && isFragmentUrl(activeTab.url)) {
    await chrome.tabs.reload(activeTab.id);
    return;
  }

  const [fragmentTab] = await chrome.tabs.query({
    currentWindow: true,
    url: ["https://fragment.com/*", "https://*.fragment.com/*"],
  });

  if (fragmentTab?.id) {
    await chrome.tabs.reload(fragmentTab.id);
  } else {
    await chrome.tabs.create({ url: FRAGMENT_URL });
  }
}

async function loadCookies() {
  const statusEl = document.getElementById("status");
  const refreshBtn = document.getElementById("refresh");
  setDot("loading");
  statusEl.textContent = "正在读取 Token…";
  refreshBtn.disabled = true;
  refreshBtn.classList.add("loading");
  refreshBtn.setAttribute("aria-busy", "true");
  try {
    const tokens = await chrome.cookies.getAll({
      domain: DOMAIN,
      name: TOKEN_NAME,
    });
    render(tokens);
  } catch (e) {
    statusEl.textContent = "读取失败：" + e.message;
    setDot("empty");
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.classList.remove("loading");
    refreshBtn.removeAttribute("aria-busy");
  }
}

function render(tokens) {
  const listEl = document.getElementById("cookie-list");
  const statusEl = document.getElementById("status");
  listEl.innerHTML = "";

  if (tokens.length === 0) {
    statusEl.textContent = "";
    setDot("empty");
    listEl.innerHTML =
      '<div class="empty"><strong class="empty-title">未找到 Token</strong>可在下方粘贴 Token 登录，或打开 <a href="https://fragment.com" target="_blank">fragment.com</a> 正常登录。</div>';
    return;
  }

  setDot("ok");
  statusEl.textContent =
    tokens.length === 1 ? "Token 已就绪" : `已找到 ${tokens.length} 个 Token`;

  for (const token of tokens) {
    const item = document.createElement("div");
    item.className = "token-item";

    const valueEl = document.createElement("div");
    valueEl.className = "token-value";
    valueEl.textContent = token.value;
    valueEl.title = "点击展开/收起";
    valueEl.tabIndex = 0;
    valueEl.setAttribute("role", "button");
    valueEl.setAttribute("aria-label", "展开或收起 Token");
    valueEl.setAttribute("aria-expanded", "false");
    const toggleValue = () => {
      const expanded = valueEl.classList.toggle("expanded");
      valueEl.setAttribute("aria-expanded", String(expanded));
    };
    valueEl.addEventListener("click", toggleValue);
    valueEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleValue();
      }
    });

    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-btn";
    copyBtn.type = "button";
    copyBtn.textContent = "复制 Token";
    copyBtn.addEventListener("click", async () => {
      const ok = await copyText(token.value);
      copyBtn.textContent = ok ? "已复制 ✓" : "失败";
      setTimeout(() => (copyBtn.textContent = "复制 Token"), 1200);
    });

    item.appendChild(valueEl);
    item.appendChild(copyBtn);
    listEl.appendChild(item);
  }
}

const loginForm = document.getElementById("login-form");
const loginTokenInput = document.getElementById("login-token");
const loginButton = document.getElementById("login-btn");
const loginStatus = document.getElementById("login-status");
const toggleTokenButton = document.getElementById("toggle-token");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const token = loginTokenInput.value.trim();

  if (!token) {
    loginStatus.textContent = "请先粘贴 Token";
    loginTokenInput.focus();
    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = "正在登录…";
  loginStatus.textContent = "正在写入本地登录信息…";

  try {
    await setLoginToken(token);
    loginTokenInput.value = "";
    loginTokenInput.type = "password";
    toggleTokenButton.textContent = "显示";
    toggleTokenButton.setAttribute("aria-label", "显示 Token");
    toggleTokenButton.setAttribute("aria-pressed", "false");
    await loadCookies();
    loginStatus.textContent = "登录成功，正在刷新 Fragment 页面…";
    await refreshFragmentPage();
  } catch (error) {
    loginStatus.textContent = `登录失败：${error.message}`;
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "登录并刷新";
  }
});

toggleTokenButton.addEventListener("click", () => {
  const shouldShow = loginTokenInput.type === "password";
  loginTokenInput.type = shouldShow ? "text" : "password";
  toggleTokenButton.textContent = shouldShow ? "隐藏" : "显示";
  toggleTokenButton.setAttribute("aria-label", shouldShow ? "隐藏 Token" : "显示 Token");
  toggleTokenButton.setAttribute("aria-pressed", String(shouldShow));
  loginTokenInput.focus();
});

document.getElementById("refresh").addEventListener("click", loadCookies);
document.addEventListener("DOMContentLoaded", loadCookies);
