# ResumeXAgent

一个基于 AI 的简历优化和岗位匹配平台，帮助求职者优化简历并匹配最适合的工作机会。

## 技术栈

- **框架**: Next.js 14.2.0 (App Router)
- **语言**: TypeScript 5.3.3
- **运行时**: Node.js 20.11.0+
- **UI 框架**: React 18.3.0
- **样式**: Tailwind CSS 3.4.0
- **数据库**: SQLite 3 (better-sqlite3 9.4.0)
- **测试**: Playwright 1.42.0
- **代码质量**: ESLint 8.57.0 + Prettier 3.2.0

## 开发环境要求

- Node.js 20.11.0 或更高版本
- npm 或 yarn
- Git

## 项目设置

1. 克隆项目

```bash
git clone https://github.com/rainfd/ResumeXAgent.git
cd ResumeXAgent
```

2. 安装依赖

```bash
npm install
```

3. 设置环境变量

```bash
cp .env.example .env.local
# 编辑 .env.local 添加必要的 API 密钥
```

4. 启动开发服务器

```bash
npm run dev
```

5. 在浏览器中访问 [http://localhost:3000](http://localhost:3000)

## 可用脚本

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run start` - 启动生产服务器
- `npm run lint` - 运行 ESLint 代码检查
- `npm run test` - 运行所有测试
- `npm run test:e2e` - 运行端到端测试

## 项目结构

```
ResumeXAgent/
├── app/                    # Next.js App Router目录
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   └── globals.css        # 全局样式
├── components/            # React组件
│   ├── ui/               # 基础UI组件
│   ├── layout/           # 布局组件
│   ├── resume/           # 简历相关组件
│   ├── job/              # 岗位相关组件
│   └── analysis/         # 分析相关组件
├── lib/                  # 核心业务逻辑
│   ├── services/         # 业务服务层
│   ├── repositories/     # 数据访问层
│   ├── database/         # 数据库连接和管理
│   ├── utils/            # 工具函数
│   ├── types/            # TypeScript类型定义
│   └── config/           # 配置文件
├── data/                 # 本地数据存储
│   ├── database/         # SQLite数据库文件
│   └── uploads/          # 上传文件存储
├── tests/                # 测试文件
│   ├── e2e/             # 端到端测试
│   └── fixtures/        # 测试数据
├── public/              # 静态资源
└── docs/                # 项目文档
```

## 环境配置

项目需要以下环境变量：

- `OPENROUTER_API_KEY` - OpenRouter API 密钥
- `DEEPSEEK_API_KEY` - DeepSeek API 密钥
- `DATABASE_PATH` - SQLite 数据库路径
- `NODE_ENV` - 环境标识
- `NEXT_PUBLIC_APP_URL` - 应用访问地址

详细配置说明请参见 `.env.example` 文件。

## 文档

- [用户指南](./docs/user-guide.md) - 完整的功能使用说明
- [快速开始](./docs/quick-start.md) - 5分钟快速上手
- [故障排除](./docs/troubleshooting.md) - 常见问题解决方案
- [常见问题](./docs/faq.md) - 用户常见问题解答

### 功能详解

- [简历上传管理](./docs/features/resume-upload.md)
- [岗位分析](./docs/features/job-analysis.md)
- [智能匹配](./docs/features/matching.md)
- [AI 助手](./docs/features/ai-assistant.md)

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 许可证

本项目使用 ISC 许可证。详见 [LICENSE](LICENSE) 文件。
