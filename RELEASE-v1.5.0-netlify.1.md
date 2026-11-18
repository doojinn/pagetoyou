# 予页 v1.5.0-netlify.1 上线记录

- 授权日期：2026-11-18。用户确认部署已验收的新版本。
- 站点：https://pagetoyou-doojinn.netlify.app
- Netlify 项目：pagetoyou-doojinn / faa9b624-d712-4dfa-beb1-0f2893962d5a
- 生产分支：deployment/netlify
- 本地验收来源：v1.5.0-local.1 / 043145b，保留 codex/experience-v1.5。
- 上一生产部署：6afd19f71728f40671fef60a（v1.2.0-netlify.2），保留作回退点。
- 数据：复用既有 Postgres / pagetoyou-media Blobs，不导入本机数据库，不更改套餐。
- 本次部署状态：ready，已成为生产站点当前发布版本。
- 部署 ID：6afdbca752fd491cd033a46a
- 发布时间：2026-11-18 14:56:53 UTC（北京时间 22:56:53）
- 部署源码提交：e76716c（v1.5.0-netlify.1 标签）。随后提交补充验收记录及浏览器检查，不改变已发布资源。
- 部署记录：https://app.netlify.com/projects/pagetoyou-doojinn/deploys/6afdbca752fd491cd033a46a
- GitHub 代码：https://github.com/doojinn/pagetoyou/tree/deployment/netlify

## 更新内容

22 个首页实际作品样例、模板顺序调整、可跳过信封、羊皮纸归并贺卡、拆封与绳结改进、立体礼物飘雪、圣诞树装饰与礼盒、照片云沉浸视角、独立樱花/垂柳结构，以及照片场景加载提示。

## 发布验证

以下检查已通过：

- 发布前语法检查、9 项自动测试、Netlify 构建。
- 本次平台构建生成的真实函数包在隔离目录可导入运行。
- 生产首页包含 22 个不同样例；首页及 tree-webgl.js / gift-effects.js / photo-space.js 与发布构建一致。比较首页时剔除 Netlify 自动添加的托管注释和工具条脚本，业务脚本按完整 SHA-256 比较。
- /api/meta 正常返回远端存储状态；Netlify API 确认当前生产部署 ID 与本次一致，状态为 ready。
- 实际公网浏览器依次验证 10 类礼物的自定义、保存、发布、手机匿名收礼；树的飘雪关闭、装饰配置随发布保留。
- 账号注册、登录、生成恢复码、重设密码及重新登录通过；浏览器未捕获运行错误。
- 公网专项验证作品样例、模板顺序、加载提示、雪花开关、装饰、沉浸视角、树种切换和手机布局通过。树专项的导航等待调整为 DOM 就绪，避免第三方托管脚本拖延完整 load 事件。
- 测试礼物全部删除，临时测试账号密码已随机轮换；不修改用户已有礼物。本机账号和私人照片未上传。
