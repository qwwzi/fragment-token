# Fragment Token

用于管理自己 `fragment.com` 登录 Token 的小工具，包含两种使用方式：

- **电脑版：Chrome / Edge 浏览器扩展**
- **手机版：iPhone / iPad Shadowrocket（小火箭）模块**

> `stel_token` 属于敏感登录凭据，请勿公开分享或提交到仓库。

## 仓库结构

```text
fragment-token/
├── manifest.json          # 电脑版浏览器扩展
├── popup.html
├── popup.css
├── popup.js
├── icons/
│
├── shadowrocket/          # 手机版 Shadowrocket
│   ├── Fragment_Token_Get.sgmodule
│   ├── GetStelToken.js
│   ├── Fragment_Token_Inject.sgmodule
│   ├── InjectStelToken.js
│   └── README.md
│
├── README.md
└── LICENSE
```

---

# 电脑版：Chrome / Edge

浏览器扩展可以读取当前浏览器中 `fragment.com` 的 Token，也可以手动输入已有 Token 来登录。

## 安装

1. 下载或克隆本仓库。
2. Chrome / Edge 打开“管理扩展”。
3. 开启“开发者模式”。
4. 点击“加载已解压的扩展程序”。
5. 选择本仓库根目录，也就是包含 `manifest.json` 的文件夹。

## 使用

### 获取 Token

1. 在浏览器中登录 `fragment.com`。
2. 点击工具栏中的 Fragment Token 扩展图标。
3. 面板会显示当前 Token。

### 使用 Token 登录

在扩展的“通过 Token 登录”区域粘贴已有 Token，然后点击“登录并刷新”。

浏览器扩展只在本机处理 Fragment Cookie，不会把 Token 上传到服务器。

---

# 手机版：Shadowrocket / 小火箭

手机脚本统一放在 [`shadowrocket/`](./shadowrocket/) 目录。

## A. 提取 Token

Shadowrocket 模块地址：

```text
https://raw.githubusercontent.com/qwwzi/fragment-token/main/shadowrocket/Fragment_Token_Get.sgmodule
```

模块会加载：

```text
https://raw.githubusercontent.com/qwwzi/fragment-token/main/shadowrocket/GetStelToken.js
```

添加并启用模块后，确保 Shadowrocket 的 HTTPS 解密 / MITM 已正确配置并信任证书，然后使用 Safari 打开并登录 `fragment.com`。检测到 `stel_token` 后会通过通知显示 Token。

## B. 注入 Token

Shadowrocket 模块地址：

```text
https://raw.githubusercontent.com/qwwzi/fragment-token/main/shadowrocket/Fragment_Token_Inject.sgmodule
```

模块会加载：

```text
https://raw.githubusercontent.com/qwwzi/fragment-token/main/shadowrocket/InjectStelToken.js
```

导入模块以后，进入模块参数设置，在 **Token** 输入框里只粘贴 Token 本身。

正确：

```text
8b11fdb8...
```

不要填写：

```text
token=8b11fdb8...
stel_token=8b11fdb8...
{{{8b11fdb8...}}}
```

模块内部已经通过：

```text
argument=token={{{Token}}}
```

自动把输入值传给注入脚本。

**注入脚本不会读取 GetStelToken 脚本保存的 Token。** 注入使用的 Token 只来自你在模块参数中手动输入的内容。

更详细的手机使用说明见 [`shadowrocket/README.md`](./shadowrocket/README.md)。

---

## 注意事项

- Token 相当于登录凭据，请不要发送给他人。
- 不要把真实 Token 写入 `.sgmodule` 或提交到 GitHub。
- Shadowrocket 的提取和注入模块都会匹配 `fragment.com`，一般根据需求启用其中一个即可。
- 本项目仅用于管理你自己的 Fragment 登录会话，请遵守 Fragment / Telegram 的相关服务条款。

## License

MIT
