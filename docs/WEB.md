# Web

当前 Web 端只保留一个 Next.js 应用：`apps/web`。

## 目录结构

```text
apps/web/
  public/      # 静态资源
  src/app/     # App Router 页面与 API Route
  src/components/
  src/hooks/
  src/lib/
  src/store/
```

## 功能范围

- `src/app/b50`：B50 页面
- `src/app/calculator`：定数/分数计算器
- `src/app/api`：服务端代理接口
- `src/app/assets/[...path]/route.ts`：素材资源转发与兼容层

## 本地开发

```bash
nvm use
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm dev
```

## 构建与部署

```bash
pnpm build
```

根目录 `vercel.json` 已直接指向 `apps/web/.next`，当前部署目标就是这个 Next.js 应用。
