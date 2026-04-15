# 生图风格库与字体一致性 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在前端提供生图风格选择，并让后端基于风格库注入一致的字体/排版提示词，保证同一轮生成的字体风格与画面风格一致。

**Architecture:** 前端用 Zustand 维护 `styleProfile`，随 `/api/generate` 请求提交；后端在 `generateAmazonPrompt` 中根据 `styleProfile` 选择不同的 typography profile 片段，统一用于 scene/detail/aplus 的文字规则。

**Tech Stack:** React + Zustand + TailwindCSS + Node(Express) + wan2.7-image-skill

---

## File Map

**Modify**
- [useStore.ts](file:///Users/yidongwu/IV_Gen/src/store/useStore.ts): 新增 `styleProfile`，提交到后端
- [CategoryConfigurator.tsx](file:///Users/yidongwu/IV_Gen/src/components/CategoryConfigurator.tsx): 增加风格选择 UI（放在分类列表顶部，生成按钮之前）
- [server.js](file:///Users/yidongwu/IV_Gen/server.js): 新增风格库与提示词注入逻辑

**No new dependencies**
- 前端不引入新库，使用现有 Tailwind 样式实现 segmented control

---

### Task 1: Store 支持 styleProfile

**Files:**
- Modify: [useStore.ts](file:///Users/yidongwu/IV_Gen/src/store/useStore.ts)

- [ ] **Step 1: 新增类型与状态字段**
  
在 `StoreState` 中新增：
```ts
styleProfile: 'minimal_modern' | 'japanese_soft' | 'luxury_editorial'
setStyleProfile: (profile: StoreState['styleProfile']) => void
```

在初始 state 中加入：
```ts
styleProfile: 'minimal_modern'
```

- [ ] **Step 2: 新增 setter 实现**
```ts
setStyleProfile: (styleProfile) => set({ styleProfile })
```

- [ ] **Step 3: 生成请求携带 styleProfile**
  
在 `startGeneration` 构建 `FormData` 时加入：
```ts
formData.append('styleProfile', state.styleProfile)
```

- [ ] **Step 4: Type check**
Run: `npm run check`  
Expected: PASS

---

### Task 2: 前端增加风格选择器

**Files:**
- Modify: [CategoryConfigurator.tsx](file:///Users/yidongwu/IV_Gen/src/components/CategoryConfigurator.tsx)

- [ ] **Step 1: 接入 store 字段**
在组件顶部解构：
```ts
const { styleProfile, setStyleProfile } = useStore()
```

- [ ] **Step 2: 在分类卡片列表之前插入 segmented control**
放置位置：`<h2 ...>Image Categories</h2>` 下方、`<div className="space-y-4">` 之前。

UI 结构（示例）：
```tsx
<div className="border border-slate-200 bg-white rounded-lg p-2 flex gap-2">
  {[
    { key: 'minimal_modern', label: '简约' },
    { key: 'japanese_soft', label: '日系' },
    { key: 'luxury_editorial', label: '轻奢' }
  ].map((opt) => (
    <button
      key={opt.key}
      onClick={() => setStyleProfile(opt.key as any)}
      className={styleProfile === opt.key
        ? 'flex-1 py-2 rounded-md bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold'
        : 'flex-1 py-2 rounded-md bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200'}
    >
      {opt.label}
    </button>
  ))}
</div>
```

- [ ] **Step 3: Type check**
Run: `npm run check`  
Expected: PASS

---

### Task 3: 后端风格库与提示词注入

**Files:**
- Modify: [server.js](file:///Users/yidongwu/IV_Gen/server.js)

- [ ] **Step 1: 读取 styleProfile（默认 minimal_modern）**
在 `/api/generate` handler 里读取：
```js
const styleProfile = req.body.styleProfile || 'minimal_modern'
```
并在生成每张图时把 styleProfile 传入 `generateAmazonPrompt(productInfo, type, description, styleProfile)`。

- [ ] **Step 2: 扩展 generateAmazonPrompt 签名**
```js
function generateAmazonPrompt(productInfo, imageType, description, styleProfile) { ... }
```

- [ ] **Step 3: 实现风格库 typography 片段**
在 `server.js` 内新增：
```js
const typographyProfiles = {
  minimal_modern: 'minimal modern typography, clean sans-serif display, flat text, subtle or no shadow, no outline',
  japanese_soft: 'soft handwritten style, gentle stroke, warm tone, flat text, minimal decoration',
  luxury_editorial: 'luxury editorial typography, premium serif or display font, flat text, minimal effects'
}
```

并在 scene/detail/aplus 的文字段落中注入：
```js
const typography = typographyProfiles[styleProfile] || typographyProfiles.minimal_modern
```
然后把原本 “Typography: ...” 替换为：
`Typography: ${typography}.`

- [ ] **Step 4: 保持通用负向约束不变**
确保仍包含：
- keep original language, do NOT translate
- flat text + 禁止 3D/描边/厚阴影/透视
- only include this exact text
- detail 的 extreme macro 约束
- main 的 85% 占比与 no text/logo/watermark

- [ ] **Step 5: Type check（前端）**
Run: `npm run check`  
Expected: PASS

- [ ] **Step 6: 手动冒烟验证**
Run: `npm run dev:full`  
在页面选择 3 种风格分别生成 1 张 scene/detail/aplus，观察提示词日志中 Typography 片段是否随选择切换。

---

### Task 4: 回归检查（请求体与后端兼容）

**Files:**
- Modify: [server.js](file:///Users/yidongwu/IV_Gen/server.js)
- Modify: [useStore.ts](file:///Users/yidongwu/IV_Gen/src/store/useStore.ts)

- [ ] **Step 1: 确认后端对缺省 styleProfile 兼容**
当不传 `styleProfile` 时使用默认 `minimal_modern`。

- [ ] **Step 2: 确认 history 不受影响**
历史记录仅存图片结果，不需要存 styleProfile（本期不加）。

- [ ] **Step 3: Type check**
Run: `npm run check`  
Expected: PASS

