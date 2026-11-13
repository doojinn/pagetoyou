# Netlify 迁移状态

已准备 netlify.toml 和允许列表构建脚本，发布目录 dist，不包含后台源码、环境变量、本机数据库及内部文档。尚未创建站点或实际部署。

完整功能需将常驻 Node HTTP 接口迁到 Functions，将同步 SQLite 迁到云端 Postgres，并把照片、背景与音乐的 base64 数据拆到文件存储，避免函数请求体限制。需要保留安全 Cookie、账号恢复、云端限流、发布快照和撤回功能，并重新验收 11 种礼物。可考虑 Netlify Database，无需强制引入 Supabase。

当前缺少 Netlify 登录授权；需要登录平台并关联 GitHub 仓库或使用 CLI 交互登录。不要在聊天中提供密码或密钥。仅部署当前静态目录不等于账号、保存与分享已上线。

参考：https://docs.netlify.com/build/data-and-storage/netlify-database/
