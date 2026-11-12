# 信封与材质素材 · v0.6

使用内置图像生成工具制作，非商家图片下载，也未截取用户参考截图中的人物、文字或商品。封面图集只作纸张与装饰层，印章、丝带、绳结、开封动作由网页绘制。最终项目素材均已复制到本目录。

- `envelopes-v1.png`：1536 × 1024，三列三行的九种纸品底图；CSS 按格定位，同一图集用于封面、封舌和口袋。12 款可选信封来自九种底图与不同封印、绳结组合，并非 12 张独立底图。
- `ginkgo-v1.png`：透明背景银杏叶，前后翻面使用同一材质图，背面叠加可编辑文字；不是叶片三维扫描模型。

## 最终生成提示词

### 信封图集

Create ONE production texture atlas image for a tactile letter-writing website. A perfect 3 columns x 3 rows grid, nine equal rectangular cells, no gutters, no labels, no text, orthographic flat lay photographed handmade stationery. Each cell fills completely with the surface of one rectangular envelope at identical framing, no desk background and NO wax seals and NO strings (interactive seals/strings will be added in code). Visible diagonal envelope folds meeting at middle and a triangular TOP flap. Distinct cells in row order: 1 ivory cotton rag paper with subtle natural fibers; 2 pale powder blue handmade linen paper; 3 sage green textured paper; 4 romantic ivory with intricate vintage pink rose botanical prints mostly near corners; 5 beautiful pressed flowers in pink purple yellow and delicate green ferns around edges of cream envelope, realistic dry flowers shadows; 6 elaborate pale blue hydrangea and white rose paper-craft floral border, beautiful layered cut-paper petals with realistic shadows, leave center flap empty; 7 rustic brown antiqued manuscript parchment with embossed gold corner ornaments; 8 offwhite translucent mulberry handmade paper with embedded dried petals and grass fibers; 9 vintage golden cream engraved baroque stationery with fine brown botanical ornaments near corners. High-end editorial stationery photography, delicate warm sunlight from top left, realistic folds, tiny creases, tactile paper material. No logos, no people, no other objects. Strict 3x3 uniform grid. The atlas will be addressed with CSS background-position so exact nine equal cells is critical.

### 银杏叶

Use case: photorealistic-natural. Production website gift asset. ONE single authentic pressed ginkgo leaf with its slender long petiole, isolated on genuinely transparent background. Front face orthographic macro photograph, leaf fan broad and gently asymmetrical, fine radiating veins and lightly rippled organic edges. Warm autumn golden ochre fading into amber along outer edge, small natural brown freckles, subtle translucency and soft late afternoon light. Leaf large fills image but with clear transparent margin around all sides, stem points down and slightly right. No text, no writing, no hands, no other leaves, no paper, no border, no backdrop, no cast background shadow. Tangible quiet delicate botanical specimen, very detailed realistic natural material. Wide central uninterrupted leaf area for small website overlay caption.

## 视觉研究参考

用户提供的六张参考图用于：独立信封轮播、彩色火漆、蓝白纸艺花、压花、粗纤维棉纸、复古雕花与麻绳，不直接作为可售或公开模板素材。

- [Say It With Flower：手工棉纸、火漆与压花工艺](https://sayitwithflower.fr/pages/our-story)
- [Terra Paper Co：火漆、干花与纸绳封装](https://terrapaperco.com/how-it-works/)
- [Imagine DIY：植物花纸信封](https://imaginediy.co.uk/products/aster-floral-handmade-paper-and-envelope-set)

当前开封是分层动画，包含移印、解绳、翻舌和抽信；不包含真实纸张形变、绳索物理、撕裂或声音模拟。后续继续精修时保持首帧与打开后的纸张位置一致，避免完整封面图片直接变成内容页。


## v0.7 补充素材（内置图像生成工具）

- sunroom-v1.png：空白午后灰泥墙、叶影、木色窗台与亚麻帘，作为绳挂照片墙背景。生成要求：Photorealistic editorial interior background for an interactive hanging photograph wall website, empty warm ivory limewashed plaster wall, soft golden late afternoon window light, shadows of leaves, pale oak ledge, fern leaves and gauzy linen curtain at edges, no photos, frames, strings, text, people or watermark.
- memory-samples-v1.png：严格 3×3 九格摄影图集，浏览器转为九张示例照片；18 张陈列中有重复。生成要求：Nine equal square photographic cells, edge to edge, no gutters or text; green leaves in morning sun, coastal sunset, coffee and book, pink cosmos field, quiet old-town summer lane, forest light, blue-hour ocean, cherries picnic, mountains through train window; realistic soft film tones, no people, brands or watermarks.
