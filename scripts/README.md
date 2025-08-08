# Scripts 目录

这个目录包含项目的实用脚本和测试工具。

## 可用脚本

### test-parser.ts

简历解析器测试脚本，用于验证解析器对不同格式简历文件的处理能力。

**功能**：

- 自动测试 `data/test-resumes/` 目录下的所有简历文件
- 支持 PDF、Markdown、TXT 三种格式
- 显示详细的解析结果和性能指标
- 生成测试报告和统计信息

**使用方法**：

```bash
# 运行解析器测试
npm run test:parser

# 或直接运行
npx tsx scripts/test-parser.ts
```

**输出信息**：

- 文件解析状态（成功/失败）
- 解析耗时和置信度
- 提取的基本信息（姓名、邮箱、电话）
- 识别的章节数量和类型
- 验证警告和错误
- 整体测试统计报告

## 添加新脚本

1. 在此目录下创建新的 TypeScript 文件
2. 在 `package.json` 的 `scripts` 部分添加对应命令
3. 更新此 README 文件说明新脚本的用途

## 注意事项

- 所有脚本都使用 TypeScript 编写
- 使用 `tsx` 运行器直接执行 TypeScript 代码
- 脚本可以直接导入项目中的模块和类型定义
