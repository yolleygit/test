# AGENTS.md

这是一个 Next.js（App Router）项目，使用 React 19 + TypeScript。
该文件用于指导在本仓库工作的智能代理（如本助手）。

## 快速概览
- 目录结构基于 App Router：`app/`
- TypeScript 严格模式开启
- ESLint 使用 `eslint-config-next`
- 当前未配置测试框架
- 路径别名：`@/*` 指向仓库根目录

## 安装依赖
- `npm install`

## 开发服务器
- `npm run dev`

## 构建
- `npm run build`

## 生产启动
- `npm run start`

## 代码检查
- `npm run lint`

## 单文件 Lint
- `npm run lint -- app/page.tsx`
- 或：`npx eslint app/page.tsx`

## 测试
- `package.json` 中暂无测试脚本
- 如后续添加测试框架，请在此补充：
  - 基本测试命令
  - 单测或单文件测试命令

## 目录结构
- `app/layout.tsx`: 根布局与字体设置
- `app/page.tsx`: 主要 UI（客户端组件）
- `app/api/guess/route.ts`: Gemini 相关 API 路由
- `app/*.css`: CSS Modules 与全局样式
- `next.config.ts`: Next.js 配置
- `tsconfig.json`: TypeScript 配置与路径别名

## 语言与格式
- 代码语言：TypeScript + React + Next.js
- 字符串使用双引号
- 使用分号结尾
- 缩进 2 空格
- 对象/数组使用尾逗号（符合 TS/ES 习惯）
- 控制行长度，保持可读性

## Imports
- 仅类型导入使用 `import type`
- 排序顺序：类型导入 → 值导入 → 样式/资源导入
- 跨目录引用优先使用 `@/` 别名
- 同目录内使用相对路径

## 组件约定
- 使用函数组件与 Hooks
- 保持组件纯度，避免副作用
- 使用 Hooks 或浏览器 API 的文件需添加 `"use client"`
- `useMemo` 仅在明确避免重复计算时使用
- DOM/Canvas 访问使用 `useRef`

## 状态与事件
- 本地 UI 状态使用 `useState`
- 从旧状态派生新状态时使用函数式更新
- 事件处理函数使用显式命名（如 `handlePointerDown`）
- `useEffect` 中添加的监听或定时器需要清理

## API 路由（`app/api`）
- 仅导出 HTTP 方法函数（如 `export async function POST`）
- 先校验输入，再返回 `NextResponse.json`
- 必需环境变量缺失时返回 500
- 外部请求需检查 `response.ok`
- JSON 解析要防御式处理并提供默认值

## 错误处理
- 客户端 `fetch` 使用 `try/catch`
- 服务端返回结构化错误与状态码
- 避免从 API 路由抛出未处理异常
- 错误提示需对用户友好

## 类型约定
- refs 与 props 使用显式类型
- props 对象优先 `Readonly<...>`
- 禁用 `any`，需要时使用 `unknown` 并做收敛

## 命名规范
- 组件：`PascalCase`
- 变量/函数：`camelCase`
- 常量：`UPPER_SNAKE_CASE`
- CSS module 类名：`camelCase`

## 样式
- 优先使用 CSS Modules
- 类名需体现区域/功能
- 除简单动态值外避免内联样式
- 设计 Token 尽量集中管理

## 可访问性
- 图标按钮需加 `aria-label`
- 使用语义化标签（`header`/`main`/`aside` 等）
- 按钮文案清晰且可操作

## 环境变量
- Gemini API Key：`GEMINI_API_KEY`
- 禁止硬编码密钥
- 新增环境变量需在此文件补充

## 本地化
- UI 文案当前以中文为主
- 单个组件内语言保持一致
- 如新增英文，考虑简单的 i18n 方案

## 工具与检查
- 当前无 Prettier 配置
- ESLint 仅使用 Next 默认规则
- 暂无测试框架

## Cursor / Copilot 规则
- 未发现 `.cursor/rules/`、`.cursorrules` 或 `.github/copilot-instructions.md`
- 如后续新增，请在此处补充规则摘要

## 新功能开发注意
- 如果命令或约定有变更，请同步更新本文件
- 新的 API 路由请放在 `app/api/*/route.ts`
- 保持功能粒度小而清晰
- 新增逻辑需补充错误处理与安全默认值

## 智能代理工作准则
- 保持最小改动，意图清晰
- 保留现有 UI 语气与文案风格
- 未请求时避免大范围重构
- 保证严格 TypeScript 兼容
