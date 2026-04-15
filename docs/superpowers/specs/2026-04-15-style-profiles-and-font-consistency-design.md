# 生图风格库与字体一致性（设计稿）

## 背景
当前项目的文字融入由 wan2.7 直接生成。实际效果中会出现字体风格跳变（同一套图里从浮雕宋体到书法体）、以及“图片风格”和“字体气质”不匹配的问题。目标是把“字体风格”收敛到与整套图一致的风格档案（Style Profile），并在前端提供风格选择入口。

## 目标
- 支持用户在前端选择整套生图风格，并使 **scene / detail / A+** 的文字风格与整体画面风格一致。
- 同一轮生成（主图/场景/细节/A+）统一使用同一个风格档案，避免字体风格漂移。
- 默认风格为「简约现代」。
- 兼容用户描述为任意语言，要求文本原样输出（不翻译）。

## 非目标
- 不实现前端叠字（仍由模型生成文字）。
- 不做自动风格识别（不从图片推断风格），以用户选择为准。
- 不保证模型 100% 严格遵循字体要求（模型能力边界），但通过提示词约束提高一致性概率。

## 方案概述
引入后端“风格库（Style Profiles）”与前端“风格选择器”：
- 前端：在「生成图片配置区」上方新增风格选择器（3 个按钮），默认选中「简约现代」。
- Store：新增 `styleProfile` 字段，随生成请求提交给后端。
- 后端：根据 `styleProfile` 注入不同的 typography 约束片段，统一用于 scene/detail/aplus 的文本生成规则；主图保持不出字且强化主体占比。

## 风格档案定义
风格档案以 `styleProfile` 作为枚举值：

### 1) minimal_modern（默认）
- 画面气质：干净、克制、简约电商/杂志留白。
- 字体气质：现代无衬线 / 极简展示字体（不做书法笔刷）。
- 约束关键词（加入提示词）：minimal modern typography, clean sans-serif display, flat text, subtle/no shadow, no outline.

### 2) japanese_soft
- 画面气质：日系温柔、自然光、柔和对比。
- 字体气质：轻手写/细笔触，但克制、不夸张。
- 约束关键词：soft handwritten style, gentle stroke, warm tone, flat text, minimal decoration.

### 3) luxury_editorial
- 画面气质：轻奢、高级感、编辑风（editorial）。
- 字体气质：高端展示字体/衬线（高对比但不花）。
- 约束关键词：luxury editorial typography, premium serif/display font, flat text, minimal effects.

## 提示词拼装策略
### 总体原则
- 文本要求必须包含：`Include the EXACT text (keep original language, do NOT translate): "<desc>"`
- 严格禁止：3D、浮雕、描边、厚阴影、透视变形、额外文字。
- 通过 `styleProfile` 替换 typography 段，使字体风格与图片风格一致。

### 文本排版通用约束（所有风格共享）
- Placement：优先放在 negative space；边距 6–10%；避免底部整条 banner strip。
- Style constraints：flat text, no 3D extrude, no bevel/emboss, no outline stroke, no heavy drop shadow, no perspective warp.
- Content constraints：Only include this exact text, do not add any extra words.

### 不同类别的字形尺度
- scene：8–14% 图高（标题感但不盖住产品）
- detail：4–6% 图高（标签/注释感）
- aplus：12–18% 图高（海报标题层级更明显）

### detail 构图约束（防止变成场景图）
- Extreme macro / close-up，tight crop。
- 细节主体占 60–80% 画面。
- 实景背景允许，但必须强烈虚化（bokeh）且不抢主体。
- 禁止 wide shot / full product / lifestyle composition。

### main 构图约束（主体占比）
- 产品占比至少 85%，tight framing，极少白边。
- 明确禁止任何文字、logo、水印。
- 明确“不得变成其它产品”，保持参考图身份一致。

## 前端交互设计
- 位置：风格选择器放在 CategoryConfigurator 顶部区域，位于分类卡片列表之上，生成按钮之前（用户描述的“生成图片上方（A+图下方）”在现有布局中等价于该位置）。
- 控件形态：3 个按钮的 segmented control：
  - 简约（minimal_modern）
  - 日系（japanese_soft）
  - 轻奢（luxury_editorial）
- 默认：简约。

## API 变更
- `/api/generate` 的 multipart body 中新增一个字段：
  - `styleProfile`: string（枚举值）
- 后端根据 `styleProfile` 注入对应 typography 片段。

## 兼容性与迁移
- 老数据（history/localStorage）不需要迁移，风格仅影响生成过程，不影响历史渲染。
- 若未传 `styleProfile`，后端默认 `minimal_modern`。

## 验收标准
- 前端能选择风格并保持选中状态；生成请求携带 `styleProfile`。
- 同一轮生成的 scene/detail/aplus 文字风格更一致（不再出现浮雕宋体 + 书法体混用）。
- description 为英文时，模型提示词要求原样输出英文，不再被引导翻译成中文。
- detail 图明显更“微距细节”而非“摆在桌面上的场景图”。

