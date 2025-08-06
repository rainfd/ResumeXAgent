# User Interface Design Goals

## Overall UX Vision

创建一个程序员友好的求职辅助界面，借鉴代码审查工具的交互范式。界面应简洁高效，信息密度适中，支持快速扫描和批量操作。采用类似 IDE 的布局设计，左侧文件树展示简历版本和岗位列表，中央主区域展示分析结果，右侧面板提供实时建议和修改提示。

## Key Interaction Paradigms

• **拖放操作**：支持拖放简历文件和岗位描述文本到分析区域
• **实时反馈**：类似代码编辑器的实时错误提示和建议标注
• **批量处理**：支持同时分析多个岗位与简历的匹配度
• **版本对比**：支持简历修改前后的对比视图
• **快捷键支持**：提供键盘快捷键提升操作效率

## Core Screens and Views

• **Dashboard** - 显示当前简历状态、待改进项和最近分析记录
• **Resume Analyzer** - 简历上传和STAR法则检测、语法检查界面
• **Job Match Analysis** - 岗位JD输入和匹配度分析界面
• **Project Optimizer** - 项目经历管理和优化建议界面
• **AI Agent Config** - 自定义AI模型和prompt配置界面
• **HR Communication Helper** - 打招呼内容生成和模板管理界面

## Accessibility: WCAG AA

支持标准的可访问性要求，包括键盘导航、屏幕阅读器兼容和高对比度模式

## Branding

采用专业、简洁的设计风格，类似现代开发工具的视觉语言。主色调使用深色主题友好的配色方案，支持亮/暗主题切换。避免过度装饰，专注于功能性和信息展示效率。

## Target Device and Platforms: Web Responsive

Web响应式设计，优先支持桌面端体验，同时确保移动端基本可用。考虑到简历编辑和分析的使用场景，桌面端体验优先级最高。
