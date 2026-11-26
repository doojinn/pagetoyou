# 予页 · 聊天星河（本地体验版）

基于 [Memory Universe](https://github.com/weitakaodaxue/memory-universe)，上游快照 `65fb6721de75a68b37c61af1dface89fdc6a4bbc`。保留原作者的星系布局、星空粒子、自写辉光管线、消息星尘、时间螺旋、相机交互与声音。新增予页界面、四种视图、原文卡片池、日期时间轴、原文搜索定位、Moect 导入、素材展示和本机预览服务。上游 MIT 授权见 `LICENSE.upstream`。

## 运行

在项目根目录执行：

```powershell
node scripts/import-memory-wall.cjs "你的 Moect 导出文件夹"
node scripts/serve-memory-wall.cjs
```

浏览器打开 http://127.0.0.1:4196 。已导入后只需要第二行。

推荐直接双击 `memory-wall/open.cmd`：它会生成并打开 `.data/memory-wall/Chat-Galaxy.html`，将程序、样式和完整聊天数据打包到一个离线 HTML 中，无需保持服务运行。也可手动执行 `node scripts/build-memory-wall.cjs` 后双击该 HTML。媒体仍从原导出目录读取；移动文件到另一台电脑时，这些本机媒体路径将失效。离线 HTML 含真实聊天，保留在本机被 Git 忽略的目录。

## 体验

- **星河**：每天一个星团；点击星辰或日期重读当日原文。
- **时光螺旋**：星团沿时间排列为立体螺旋，展开全部消息星点。
- **回忆之墙**：星团变换为立体阵列，展示原文卡片。
- **文字穿梭**：原文卡片持续从远处飞来，以固定卡片池循环遍历全部记录；长消息显示节选，完整文本仍在详情中。
- **漫游**：每八秒切换一个聊天日；拖动或滚轮会停止自动相机。
- **搜索**：全量原文检索，展示前 30 个结果；点击直接定位对应句子。
- **时间坐标**：拖动定位到某个聊天日；最左端返回全景。

每条主聊天消息保留为一颗星点，没有将消息条数当成装饰数字。转发聊天目前保留主消息中的文字，未递归展开其独立附件。默认隐藏上游的装饰太阳系，可用 `?sun=1` 恢复。音效按钮沿用上游环境音，首次交互才解锁音频。

## 数据边界

真实聊天 JSON 和素材路径表只保存于被 Git 忽略的 `.data/memory-wall/`，不包含在本目录源码中。素材按明确映射从原导出目录读取，不复制加密文件、不请求微信头像服务器。预览服务仅监听 `127.0.0.1`，无上传接口。现有主站构建使用明确文件名单，不包含此页面与聊天样例。

样例共有 5,802 条主聊天消息、15 个聊天日；85 条图片消息标记为加密，显示占位说明。141 个可读取素材是去重后的头像、表情和媒体文件，并不代表 141 张聊天图片。

## 验证

```powershell
node --check memory-wall/app.js
node --check memory-wall/enhance.js
node --test tests/memory-wall.test.cjs
```

浏览器回归脚本为 `tests/browser/memory-wall.cjs`，需设置 `QA_PLAYWRIGHT_MODULE` 和可选的 `QA_BROWSER`，或使用当前环境的 `NODE_REPL_NODE_MODULE_DIRS`。当前环境 Edge 启动失败，尚未完成实际 WebGL 截图、性能与手机浏览器回归。功能不等同于已验证的海量数据性能指标。
