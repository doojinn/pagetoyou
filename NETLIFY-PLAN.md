# Netlify 专用版本

版本 v1.1.0-netlify.1，独立分支 deployment/netlify。原通用版本保持在 master / v1.0.0-rc.2。

## 架构

- 静态文件仅按允许列表复制到 dist，不发布后台、数据库、密钥、项目文档。
- netlify/functions/api.mjs 为 Netlify 适配器，cloud/api.cjs 接收通用 Postgres pool 和文件 store，可用于其他托管平台。
- netlify/database/migrations 包含标准 Postgres SQL，由 Netlify 原生迁移流程执行。
- 保留账号密码、会话、离线恢复码、个人中心、草稿、发布快照、修改冲突和停止分享。
- 图片、音乐、背景拆到 Blobs。保存只接受当前账号的文件引用；匿名用户只能读取当前已发布礼物引用的文件，停止分享后停止公开获取。
- 测试期每账号最多 50 份礼物、100 MB / 500 个上传文件。删除或替换礼物不立即回收文件，避免损坏其他快照；后续需增加孤立文件清理。
- Cookie 在 HTTPS 下使用 Secure / HttpOnly / SameSite=Lax。持久化 SQL 限流替代进程内限流，注册、上传、保存和找回均有限额。
- 本机 SQLite 数据不自动迁移，以免把私人测试数据自动上传。

## 本地验证

pnpm install --frozen-lockfile
pnpm run check
pnpm test
pnpm run build:netlify

cloud.test.cjs 使用内嵌 Postgres（PGlite）和独立文件存储替身，覆盖账号、上传、所有权、快照文件权限、版本并发冲突、重启持久性和恢复码。

浏览器全流程设置 QA_CLOUD=1 后执行 tests/browser/release-walk.cjs；还需要 Playwright 和 Chromium，路径可用 QA_PLAYWRIGHT_MODULE / QA_BROWSER 配置。已通过全部 11 种礼物和账号恢复流程，浏览器无未捕获错误。

## 部署

项目使用 Free / credit-based 方案，不开启自动充值或购买套餐。Netlify CLI 登录后，创建专用站点并关联本目录，再执行 netlify deploy --build --prod。构建会自动创建数据库、执行 SQL 迁移并打包 API。不要只上传 dist；那样没有账号和分享功能。

控制台如关联 GitHub，生产分支必须设为 deployment/netlify，构建命令 pnpm run build:netlify，发布目录 dist。配置中无硬编码平台网址，分享地址来自当前 HTTPS 请求。

平台构建和实际公网验收需要完成部署工具登录。本次授权票据仍待批准，尚未创建或发布公网站点。实际站点网址将以部署结果为准。

## 更换平台

保留 master 通用版本可随时重新运行。若迁移当前云端数据，需要导出全部 Postgres 表及媒体文件，再接入新连接池／文件存储，并保留或转换 /api/media 路径与分享 token。不要仅换代码却遗留 Netlify 存储中的照片。

参考：
https://docs.netlify.com/build/data-and-storage/netlify-database/
https://docs.netlify.com/build/data-and-storage/netlify-blobs/
