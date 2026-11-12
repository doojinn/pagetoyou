# 部署说明

本版本以 Node.js 24+ 运行，入口 `server.cjs`，无生产 npm 依赖。GitHub 仓库只保存代码；公网应用尚未部署。GitHub Pages 的静态托管无法运行当前账号、SQLite、上传和发布 API。

## 本地

`npm start`，默认 `http://127.0.0.1:4175`。数据写入 `.data`，不会进入 Git。已有旧服务占用端口时可设置其他 `PORT`。

## 全功能正式部署

部署到能运行 Node 24 并挂载持久化磁盘的主机或容器平台。配置 HTTPS 入口和以下变量：

```text
NODE_ENV=production
HOST=0.0.0.0
PORT=4175
PUBLIC_ORIGIN=https://实际域名
DATA_DIR=/data
```

`PUBLIC_ORIGIN` 只包含协议和域名，不带末尾斜杠；反向代理保留实际域名 Host。生产入口会拒绝缺少 HTTPS 公网地址的配置。健康检查为 `GET /healthz`。使用单个应用实例及本地持久化磁盘；当前未设计跨主机共享 SQLite。

可使用仓库 Dockerfile 构建，映射 4175 端口、挂载 `/data`，传入实际 `PUBLIC_ORIGIN`。容器以 node 用户运行，挂载目录须允许该用户读写。Docker 镜像构建尚未在本机验证；应用代码、服务启动和浏览器流程已验证。

迁移时停服后复制数据目录中的数据库及相关 SQLite 文件，启动后核对账号、草稿、发布链接。运行中直接复制单个数据库文件可能遗漏 WAL 中的数据。为数据目录配置定期备份，部署更新不可覆盖此目录。

## 账号

账号名和密码登录，密码加盐 scrypt 哈希，Cookie 为 HttpOnly / SameSite=Lax，HTTPS 配置下附带 Secure。保留登录 7 天；取消保留时使用浏览器会话 Cookie，后台有效期 12 小时。

个人中心可验证当前密码并生成 10 枚离线恢复码，仅展示一次，有效期一年。生成新码会替换旧码。找回密码后全部旧恢复码及登录会话失效，用户需使用新密码重新登录。未提供邮件、短信或人工身份找回。

恢复机制参考 [OWASP 密码找回指导](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)。

## 验证

`npm run check` 和 `npm test`。GitHub Actions 会在推送和 PR 时运行这两项，不自动部署网站。

完整 UI 验收脚本为 `tests/browser/release-walk.cjs`，需要可用的 Playwright 和 Chromium。默认 `require('playwright')`；可通过 `QA_PLAYWRIGHT_MODULE` 指定模块路径、`QA_BROWSER` 指定浏览器路径。执行 `node tests/browser/release-walk.cjs`，使用隔离的临时数据库，结果和截图写入忽略的 `.document-work/browser-qa`。该脚本不对真实账号库执行写入。
