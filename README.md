# Amazon Product Image Generator

AI-powered tool for generating Amazon-ready product images (main/scene/detail/A+) from reference images, with controllable styles and text rules.

## Features

- Generate four image types: Main (white background), Scene, Detail, A+
- Upload up to 3 reference images, or provide up to 3 public HTTPS reference URLs
- Style profiles: `minimal_modern`, `japanese_soft`, `luxury_editorial`
- Built-in history panel (localStorage)
- Vite proxy setup for local full-stack development

## Tech Stack

- Frontend: Vite + React + TypeScript + Tailwind CSS
- State: Zustand
- Backend: Express (Node.js)
- Image generation: DashScope API + local python scripts (Trae `wan2.7-image-skill`)

## Prerequisites

- Node.js (recommended: latest LTS)
- npm
- Python 3 (required by the image generation scripts)

## Setup

```bash
npm install
```

## Environment Variables

This project uses DashScope for image generation. Configure environment variables before running the backend.

Required:

- `DASHSCOPE_API_KEY`: Your DashScope API key

Optional:

- `DASHSCOPE_BASE_URL`: Defaults to `https://dashscope.aliyuncs.com/api/v1/`

Example (macOS/Linux):

```bash
export DASHSCOPE_API_KEY="***"
export DASHSCOPE_BASE_URL="https://dashscope.aliyuncs.com/api/v1/"
```

Security note: do not commit `.env` files or any secrets to git.

## Development

Run frontend + backend together:

```bash
npm run dev:full
```

Or run them separately:

```bash
npm run server
```

```bash
npm run dev
```

### Ports and Proxy

- Backend: `http://localhost:3001`
- Frontend dev server: Vite default (usually `http://localhost:5173`)

Vite proxies:

- `/api` → `http://localhost:3001`
- `/generated` → `http://localhost:3001`

## Build

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Lint / Type Check

```bash
npm run lint
```

```bash
npm run check
```

## API

### `POST /api/generate`

Content type: `multipart/form-data`

Inputs:

- `references`: up to 3 files (field name: `references`)
- `referenceUrls`: JSON string array of public `https://` image URLs (up to 3 total with file uploads)
- `productInfo`: JSON string, at least includes `name`
- `categories`: JSON string array, each item includes:
  - `type`: `main` | `scene` | `detail` | `aplus`
  - `count`: number (0–10)
  - `size`: number (`main/scene/detail` use square `N*N`; `aplus` uses `W*H` encoded as `W*10000+H` in UI)
  - `descriptions`: string array (optional per-image text)
- `styleProfile`: `minimal_modern` | `japanese_soft` | `luxury_editorial`

Response:

- `success`: boolean
- `generatedImages`: grouped by type, each contains image `url` under `/generated/...`
- `generatedPrompts`: prompts used during generation

## Project Structure

```text
.
├── server.js                # Express backend
├── src/                     # React frontend
│   ├── components/
│   └── store/
├── public/
│   └── generated/           # Generated images (ignored by git)
└── uploads/                 # Temporary uploads (ignored by git)
```

## Notes

- Generated images and uploads are ignored by git by default.
- Reference URLs must be public `https://` links; private network addresses and `localhost` are rejected.

---

# 亚马逊商品图生成器（Amazon Product Image Generator）

基于参考图生成可用于 Amazon 上架的商品图片（白底主图/场景图/细节图/A+），支持风格控制与严格的文案渲染规则。

## 功能特性

- 支持四种图片类型：主图（白底）、场景图、细节图、A+
- 支持上传最多 3 张参考图，或填写最多 3 个公开 HTTPS 参考图链接
- 支持风格：`minimal_modern`、`japanese_soft`、`luxury_editorial`
- 生成历史记录（localStorage）
- 本地全栈开发：Vite 反向代理到 Express 后端

## 技术栈

- 前端：Vite + React + TypeScript + Tailwind CSS
- 状态管理：Zustand
- 后端：Express（Node.js）
- 生成能力：DashScope API + 本地 Python 脚本（Trae `wan2.7-image-skill`）

## 运行前置

- Node.js（建议：最新 LTS）
- npm
- Python 3（生成脚本依赖）

## 安装依赖

```bash
npm install
```

## 环境变量

后端生成图片依赖 DashScope，请先配置环境变量。

必需：

- `DASHSCOPE_API_KEY`：DashScope API Key

可选：

- `DASHSCOPE_BASE_URL`：默认 `https://dashscope.aliyuncs.com/api/v1/`

示例（macOS/Linux）：

```bash
export DASHSCOPE_API_KEY="***"
export DASHSCOPE_BASE_URL="https://dashscope.aliyuncs.com/api/v1/"
```

安全提示：不要把 `.env` 或任何密钥提交到仓库。

## 本地开发

同时启动前端 + 后端：

```bash
npm run dev:full
```

或分别启动：

```bash
npm run server
```

```bash
npm run dev
```

### 端口与代理

- 后端：`http://localhost:3001`
- 前端开发服务：Vite 默认端口（通常是 `http://localhost:5173`）

Vite 代理规则：

- `/api` → `http://localhost:3001`
- `/generated` → `http://localhost:3001`

## 构建

```bash
npm run build
```

预览构建产物：

```bash
npm run preview
```

## 代码检查

```bash
npm run lint
```

```bash
npm run check
```

## 接口说明

### `POST /api/generate`

请求类型：`multipart/form-data`

输入：

- `references`：最多 3 个文件（字段名：`references`）
- `referenceUrls`：公开 `https://` 图片链接数组（JSON 字符串；与上传文件合计最多 3 个）
- `productInfo`：JSON 字符串（至少包含 `name`）
- `categories`：JSON 字符串数组，每项包含：
  - `type`：`main` | `scene` | `detail` | `aplus`
  - `count`：数量（0–10）
  - `size`：尺寸（`main/scene/detail` 使用正方形 `N*N`；`aplus` 在 UI 中用 `W*10000+H` 的方式编码为一个数）
  - `descriptions`：文案数组（可选，每张图对应一条）
- `styleProfile`：`minimal_modern` | `japanese_soft` | `luxury_editorial`

输出：

- `success`：是否成功
- `generatedImages`：按类型分组的图片列表（图片 URL 在 `/generated/...`）
- `generatedPrompts`：本次生成使用的提示词

## 目录结构

```text
.
├── server.js                # Express 后端
├── src/                     # React 前端
│   ├── components/
│   └── store/
├── public/
│   └── generated/           # 生成图片（默认不入库）
└── uploads/                 # 临时上传目录（默认不入库）
```

## 备注

- 生成的图片与临时文件默认不提交到 git。
- 参考图 URL 必须是公开的 `https://` 链接；`localhost` 和内网地址会被拒绝。
