# Maimai Lab (Monorepo)

`maimai-lab` 是当前仓库内的统一 Web 集成层，集中管理：

- `apps/image-cache`（资源缓存/API）
- `apps/rating-web`（B50 网页）
- `apps/tools-web`（小工具网页）

## 目录结构

```text
apps/
  image-cache/    # Express + ImageKit，统一资源入口
  rating-web/     # Vue + Vite
  tools-web/      # Vue + Vite
package.json      # npm workspaces 聚合脚本
vercel.json       # 根部署入口，指向 apps/image-cache/index.js
```

## Curl 分析结果（2026-03-01）

目标站点：`https://maimai.mpas.top`

- 首页：`HTTP/2 200`
- `main.css` / `demo.css`：`HTTP/2 200`
- `robots.txt`：`HTTP/2 404`
- `sitemap.xml`：`HTTP/2 404`

资源路径特征（实测）：

- `GET /assets/cover/8` -> `200`
- `GET /assets/cover/8.png` -> `404`
- `GET /assets/cover/8?tr=w-250,h-250` -> `200`
- 结论：`cover` 路径应使用“无扩展名 ID”

B50 关键资源抽样（实测）：

- `/assets/images/b50_score_basic.png` -> `200`
- `/assets/images/UI_CMN_DXRating_01.png` -> `200`
- `/assets/prism/b50_bg1-min.png` -> `200`
- `/assets/prism/logo1.png` -> `200`
- `/assets/ongeki/ongeki1.png` -> `200`
- `/assets/avatar/0` -> `200`
- `/assets/plate/1` -> `200`
- `/assets/course_rank/1` -> `200`
- `/assets/class_rank/1` -> `200`
- `/assets/rank/sssp` -> `200`
- `/assets/badge/fc` -> `200`

## 统一部署（Vercel）

根 `vercel.json` 已配置为：

- 入口函数：`apps/image-cache/index.js`
- 所有路由转发到该函数

`apps/image-cache` 内新增了：

- `/assets/*` 资源路由（ImageKit 命中 + 回源上传）
- `/rating` 与 `/tools` SPA 托管路由

> 也就是说，单个 Vercel 项目即可同时提供资源缓存和两个前端入口。

## 构建与同步

根目录脚本：

```bash
npm run web:build
```

流程：

1. 构建 `apps/rating-web`
2. 构建 `apps/tools-web`
3. 执行 `apps/image-cache/scripts/sync-web.mjs`
4. 将产物同步到：
   - `apps/image-cache/public/rating`
   - `apps/image-cache/public/tools`

本地运行缓存服务：

```bash
npm run web:start
```

## 资源回源参数

`apps/image-cache/.env.example`：

- `MAIMAI_IMAGEKIT_PUBLIC_KEY`
- `MAIMAI_IMAGEKIT_PRIVATE_KEY`
- `MAIMAI_IMAGEKIT_URL_ENDPOINT`
- `MAIMAI_LEGACY_ASSET_ORIGIN`（用于 `images/prism/ongeki` 冷缓存回源）
