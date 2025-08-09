# 端到端测试指南

本项目包含多种端到端测试方式，支持Mock数据测试和真实URL测试。

## 📋 可用的测试命令

### 1. 基础Mock测试
```bash
npm run test:e2e
```
- 使用Mock数据模拟Boss直聘API响应
- 测试前端UI交互和用户流程
- 运行速度快，不依赖外部网站
- **推荐用于**: 开发阶段的快速验证

### 2. 真实URL测试
```bash
npm run test:e2e-real  
```
- 使用预设的真实Boss直聘岗位URL
- 测试完整的浏览器自动化流程
- 可能遇到验证码或登录要求
- **推荐用于**: 功能完整性测试

### 3. 多URL批量测试
```bash
npm run test:e2e-multi
```
- 测试多个候选URL，寻找有效的岗位链接
- 提供URL失效检测和替代建议
- 输出详细的测试结果统计
- **推荐用于**: URL有效性验证

### 4. 实时爬虫测试 🆕
```bash
npm run test:e2e-crawl
```
- 从Boss直聘首页实时抓取最新岗位URL
- 自动测试抓取到的真实岗位链接
- 提供详细的抓取和测试报告
- **推荐用于**: 获取最新有效URL

## 🎯 测试场景覆盖

所有测试都涵盖以下场景：
- ✅ 页面加载和UI组件显示
- ✅ URL输入验证（格式检查、域名验证）
- ✅ 成功分析岗位信息
- ✅ 用户验证流程（验证码/登录）
- ✅ 错误处理（无效URL、网络错误、服务器错误）
- ✅ UI交互状态（按钮启用/禁用、加载状态）

## 📊 最新测试状态

### 最近一次爬虫测试结果 (2025-08-07)
**✅ 成功抓取3个有效URL:**
1. `https://www.zhipin.com/job_detail/6e5a8896abcee92303B439i1GVVV.html`
2. `https://www.zhipin.com/job_detail/5603c8bdf8d6a79e03d-29u1EltS.html`
3. `https://www.zhipin.com/job_detail/21c5b3700caeaaef1X183dm4FlpX.html`

**状态:** 所有URL需要用户验证（正常的Boss直聘安全机制）

## 🔧 手动测试

项目运行后访问：`http://localhost:3000/job/analyze`

可以使用以上任意有效URL进行手动测试：
1. 输入URL到输入框
2. 点击"开始分析"
3. 如提示需要验证，在弹出的浏览器中完成验证
4. 点击"继续分析"查看结果

## 🚨 故障排除

### URL失效问题
- 运行 `npm run test:e2e-crawl` 获取最新有效URL
- 或手动访问 https://www.zhipin.com 复制新的岗位链接

### 验证码问题  
- 这是Boss直聘的正常防护机制
- 在弹出的浏览器窗口中手动完成验证
- 验证后系统会自动继续分析

### 网络问题
- 确保可以访问 https://www.zhipin.com
- 检查防火墙和代理设置
- 某些环境可能需要VPN

## 📈 测试报告

测试完成后可以查看详细报告：
```bash
npx playwright show-report
```

## 🔄 更新测试URL

当URL失效时，可以：
1. 运行爬虫测试获取新URL
2. 手动更新 `tests/e2e/job-analysis-real.spec.ts` 中的URL数组
3. 提交更新供其他开发者使用