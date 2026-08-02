# Fragment Token 提取器

一个简单的 Chrome 扩展：读取当前浏览器里 fragment.com 的 `stel_token`，方便你在做 Fragment 相关的个人开发 / 接口调试时，快速拿到登录后的 Token。

## 功能

- 只读取名称精确匹配 `stel_token` 的 Cookie，包括 HttpOnly Cookie
- 不展示 fragment.com 下的其他 Cookie
- 点击 Token 值可展开/收起，点击「复制」可将其复制到剪贴板
- 可粘贴 Token 写入本机 Cookie，并自动刷新 Fragment 页面完成登录

## 安装方法（开发者模式加载）

1. 解压这个压缩包
2. Chrome 打开 `chrome://extensions`
3. 打开右上角「开发者模式」
4. 点击「加载已解压的扩展程序」，选择解压后的文件夹
5. 先在浏览器里打开并登录 fragment.com

## 使用方法

1. 登录 fragment.com 后，点击工具栏里的插件图标
2. 面板会显示当前的 `stel_token`
3. 点「复制」，粘贴到自己的脚本 / Postman / curl 里使用

也可以在「通过 Token 登录」区域粘贴已有 Token，点击「登录并刷新」。扩展只会将 Token 写入本机的 fragment.com Cookie，不会保存到扩展存储或上传到服务器。

## 注意事项

- Token 相当于你的登录凭证，请只在自己的脚本里使用，不要发给别人，也不要提交到公开代码仓库
- 插件只在你主动点击图标或刷新时读取 `stel_token`，不会在后台常驻运行，也不会把数据发送到任何服务器，所有内容只停留在你本机
- 请遵守 fragment.com / Telegram 的服务条款，仅用于个人合法用途（自己的自动化工具、接口调试等）
