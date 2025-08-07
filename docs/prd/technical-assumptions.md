# Technical Assumptions

## Repository Structure: Monorepo

单一代码库管理所有代码，包括前端、后端和测试代码，便于统一版本管理和代码共享。

## Service Architecture

**CRITICAL DECISION - Monolith（单体架构）**

- 采用单体架构，所有功能集成在一个应用中
- 简化部署和维护，适合本地运行场景
- 降低系统复杂度，加快MVP开发速度

## Testing Requirements

**CRITICAL DECISION - 集成测试和端到端测试**

- 使用浏览器自动化工具（如 Playwright 或 Puppeteer）
- 测试网页能否完成完整的用户任务流程
- 确保简历上传、分析、结果展示等核心功能正常工作
- 不要求特定的单元测试覆盖率，专注于功能测试

## Additional Technical Assumptions and Requests

• **全栈框架：Next.js** - 是的，Next.js 完全支持全栈开发，包括前端React组件和后端API路由
• **编程语言：TypeScript/JavaScript** - Next.js 的默认选择，提供类型安全
• **UI框架：建议使用 Tailwind CSS + shadcn/ui** - 快速构建程序员友好的界面
• **AI API集成：**

- OpenRouter API - 提供多种模型选择的统一接口
- DeepSeek API - 成本效益高的中文处理能力
- 使用环境变量管理API密钥
  • **数据库：SQLite** - 轻量级本地数据库，无需额外部署，适合本地使用场景
  • **文件处理库：**
- PDF解析：pdf-parse 或 pdfjs
- Markdown处理：marked 或 remark
- 文本处理：内置Node.js能力
  • **部署方式：本地部署** - 使用 Next.js 的生产构建，用户在本地运行
  • **无需认证系统** - 简化架构，本地单用户使用
  • **文件存储：本地文件系统** - 临时文件处理，分析后即删除
