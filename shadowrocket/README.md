# Shadowrocket 使用说明

本目录用于 iPhone / iPad 上的 Shadowrocket（小火箭）。

## 文件说明

- `Fragment_Token_Get.sgmodule`：从 `fragment.com` 请求 Cookie 中提取 `stel_token`，通过 Shadowrocket 通知显示。
- `GetStelToken.js`：提取模块对应脚本。
- `Fragment_Token_Inject.sgmodule`：手动输入 Token，并将其作为 `stel_token` 注入 `fragment.com` 请求。
- `InjectStelToken.js`：注入模块对应脚本。

## 1. 提取 Token

模块地址：

```text
https://raw.githubusercontent.com/qwwzi/fragment-token/main/shadowrocket/Fragment_Token_Get.sgmodule
```

在 Shadowrocket 中添加上面的模块地址并启用模块，然后确保 HTTPS 解密 / MITM 已正确配置并信任证书。使用 Safari 打开并登录 `https://fragment.com/`，脚本检测到 `stel_token` 后会通过通知显示 Token。

提取脚本会使用 Shadowrocket 的 `$persistentStore` 保存上一次检测到的 Token 和通知时间，用于通知去重。

## 2. 注入 Token

模块地址：

```text
https://raw.githubusercontent.com/qwwzi/fragment-token/main/shadowrocket/Fragment_Token_Inject.sgmodule
```

添加并启用模块后，进入该模块的参数设置，在 `Token` 输入框中直接粘贴 Token，例如：

```text
8b11fdb8...
```

只填写 Token 本身，不要填写：

```text
token=...
stel_token=...
{{{...}}}
```

模块内部会自动通过：

```text
argument=token={{{Token}}}
```

把你填写的值传给 `InjectStelToken.js`。

注入脚本不会读取 `GetStelToken.js` 保存的 Token。它只使用模块参数中手动输入的 Token。脚本的持久化存储仅用于记录通知状态和 Token 指纹，不保存真实的注入 Token。

## 3. 通知行为

注入模块：

- 未填写 Token 时，在符合条件的网页主请求上提示“未填写 stel_token”。
- 成功注入后，在网页主请求上提示“token 注入成功”。
- 同一个 Token 使用指纹记录通知状态，避免普通资源请求反复通知。

## 4. 注意事项

- 两个模块都会匹配 `fragment.com`，一般按当前需求启用“提取”或“注入”其中一个即可。
- Token 等同于敏感登录凭据，请勿公开分享、提交到 GitHub 或发送给不可信的人。
- `.sgmodule` 中已经使用 GitHub Raw 脚本地址，无需另外下载 JS 文件。
- 本项目仅用于管理你自己的 Fragment 登录会话，请遵守相关服务条款。
