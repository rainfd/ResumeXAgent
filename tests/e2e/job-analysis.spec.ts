import { test, expect } from '@playwright/test';

// Mock数据用于测试
const mockJobData = {
  title: '高级前端开发工程师',
  company: '阿里巴巴集团',
  location: '杭州·西湖区',
  salary_range: '25-40K·14薪',
  experience_required: '3-5年',
  education_required: '本科',
  raw_description: '职位描述：\n1. 负责前端页面开发和维护\n2. 参与产品需求分析和技术方案设计\n3. 优化前端性能，提升用户体验\n\n任职要求：\n1. 熟练掌握React、Vue等前端框架\n2. 具备TypeScript开发经验\n3. 熟悉前端工程化工具'
};

const validBossUrl = 'https://www.zhipin.com/job_detail/12345678.html';
const invalidUrl = 'https://invalid-site.com/job/123';

// 拦截API请求用于测试
test.beforeEach(async ({ page }) => {
  // Mock成功的分析请求
  await page.route('/api/job/analyze', async (route, request) => {
    const method = request.method();
    const postData = request.postDataJSON();
    
    if (method === 'POST') {
      if (postData?.url === validBossUrl) {
        // 模拟成功分析
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockJobData,
            jobId: 'mock-job-id-123'
          })
        });
      } else if (postData?.url === 'https://www.zhipin.com/job_detail/needs_verification.html') {
        // 模拟需要验证的情况
        await route.fulfill({
          status: 202,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            needsUserAction: true,
            message: '请在浏览器中完成登录验证'
          })
        });
      } else if (postData?.url === invalidUrl) {
        // 模拟无效URL错误
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: '请输入有效的Boss直聘网址'
          })
        });
      }
    } else if (method === 'PUT') {
      // 模拟验证后继续分析
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockJobData,
          jobId: 'mock-job-id-123'
        })
      });
    }
  });
});

test.describe('岗位分析功能', () => {
  test('页面加载正确', async ({ page }) => {
    await page.goto('/job/analyze');

    // 检查页面标题
    await expect(page.locator('h1')).toHaveText('岗位分析');
    
    // 检查描述文本
    await expect(page.locator('p').first()).toContainText('输入Boss直聘的岗位网址');
    
    // 检查输入框和按钮
    await expect(page.locator('input[placeholder*="请输入Boss直聘岗位网址"]')).toBeVisible();
    await expect(page.locator('button', { hasText: '开始分析' })).toBeVisible();
  });

  test('空URL验证', async ({ page }) => {
    await page.goto('/job/analyze');

    // 检查初始状态：按钮应该被禁用
    await expect(page.locator('button:has-text("开始分析")')).toBeDisabled();
    
    // 输入空格然后删除，触发验证
    await page.fill('input[placeholder*="请输入Boss直聘岗位网址"]', ' ');
    await page.fill('input[placeholder*="请输入Boss直聘岗位网址"]', '');
    
    // 尝试点击按钮（应该仍然被禁用）
    await expect(page.locator('button:has-text("开始分析")')).toBeDisabled();
  });

  test('无效URL验证', async ({ page }) => {
    await page.goto('/job/analyze');

    // 输入无效URL
    await page.fill('input[placeholder*="请输入Boss直聘岗位网址"]', 'invalid-url');
    await page.click('button:has-text("开始分析")');

    // 检查错误消息
    await expect(page.locator('text=请输入有效的Boss直聘网址')).toBeVisible();
  });

  test('非Boss直聘域名验证', async ({ page }) => {
    await page.goto('/job/analyze');

    // 输入非Boss直聘域名的URL
    await page.fill('input[placeholder*="请输入Boss直聘岗位网址"]', invalidUrl);
    await page.click('button:has-text("开始分析")');

    // 检查前端验证错误消息
    await expect(page.locator('text=请输入有效的Boss直聘网址')).toBeVisible();
  });

  test('成功分析岗位信息', async ({ page }) => {
    await page.goto('/job/analyze');

    // 输入有效的Boss直聘URL
    await page.fill('input[placeholder*="请输入Boss直聘岗位网址"]', validBossUrl);
    
    // 点击开始分析
    await page.click('button:has-text("开始分析")');

    // 等待分析完成，检查结果（不强制检查加载状态，因为mock响应太快）
    await expect(page.locator('text=分析结果')).toBeVisible();
    
    // 检查岗位信息显示
    await expect(page.locator('text=职位名称')).toBeVisible();
    await expect(page.locator(`text=${mockJobData.title}`)).toBeVisible();
    
    await expect(page.locator('text=公司名称')).toBeVisible();
    await expect(page.locator(`text=${mockJobData.company}`)).toBeVisible();
    
    await expect(page.locator('text=工作地点')).toBeVisible();
    await expect(page.locator(`text=${mockJobData.location}`)).toBeVisible();
    
    await expect(page.locator('text=薪资范围')).toBeVisible();
    await expect(page.locator(`text=${mockJobData.salary_range}`)).toBeVisible();
    
    // 检查岗位描述
    await expect(page.locator('text=岗位描述')).toBeVisible();
    await expect(page.locator('pre')).toContainText('职位描述');
  });

  test('需要用户验证的流程', async ({ page }) => {
    await page.goto('/job/analyze');

    const verificationUrl = 'https://www.zhipin.com/job_detail/needs_verification.html';
    
    // 输入需要验证的URL
    await page.fill('input[placeholder*="请输入Boss直聘岗位网址"]', verificationUrl);
    await page.click('button:has-text("开始分析")');

    // 检查验证提示卡片出现
    await expect(page.locator('text=需要用户验证')).toBeVisible();
    await expect(page.locator('text=请在浏览器中完成登录验证')).toBeVisible();
    
    // 检查验证步骤说明
    await expect(page.locator('text=在弹出的浏览器窗口中完成登录或验证码验证')).toBeVisible();
    await expect(page.locator('text=确保可以正常查看岗位信息页面')).toBeVisible();
    await expect(page.locator('text=点击下方"继续分析"按钮')).toBeVisible();
    
    // 检查继续分析按钮
    await expect(page.locator('button', { hasText: '继续分析' })).toBeVisible();
    
    // 点击继续分析
    await page.click('button:has-text("继续分析")');
    
    // 等待分析完成，检查结果（不强制检查加载状态，因为mock响应太快）
    await expect(page.locator('text=分析结果')).toBeVisible();
    await expect(page.locator(`text=${mockJobData.title}`)).toBeVisible();
  });

  test('UI交互状态检查', async ({ page }) => {
    await page.goto('/job/analyze');

    // 初始状态：按钮禁用（因为没有输入）
    await expect(page.locator('button:has-text("开始分析")')).toBeDisabled();
    
    // 输入URL后按钮启用
    await page.fill('input[placeholder*="请输入Boss直聘岗位网址"]', validBossUrl);
    await expect(page.locator('button:has-text("开始分析")')).toBeEnabled();
    
    // 开始分析
    await page.click('button:has-text("开始分析")');
    
    // 检查加载状态（可能很快，但应该能捕获到）
    const loadingButton = page.locator('button:has-text("正在分析...")');
    const analysisResult = page.locator('text=分析结果');
    
    // 等待要么看到加载状态，要么直接看到结果
    await Promise.race([
      loadingButton.waitFor({ timeout: 1000 }).catch(() => {}),
      analysisResult.waitFor()
    ]);
    
    // 最终应该看到分析结果
    await expect(analysisResult).toBeVisible();
    
    // 分析完成后输入框重新启用
    await expect(page.locator('input[placeholder*="请输入Boss直聘岗位网址"]')).toBeEnabled();
  });

  test('页面无JavaScript错误', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/job/analyze');
    
    // 执行一些操作
    await page.fill('input[placeholder*="请输入Boss直聘岗位网址"]', validBossUrl);
    await page.click('button:has-text("开始分析")');
    
    await page.waitForLoadState('networkidle');

    // 检查没有JavaScript错误
    expect(errors).toHaveLength(0);
  });

  test('URL输入框样式和占位符', async ({ page }) => {
    await page.goto('/job/analyze');

    const input = page.locator('input[placeholder*="请输入Boss直聘岗位网址"]');
    
    // 检查占位符文本
    await expect(input).toHaveAttribute('placeholder', '请输入Boss直聘岗位网址...');
    
    // 检查输入框可见
    await expect(input).toBeVisible();
    
    // 检查卡片标题和描述
    await expect(page.locator('text=岗位URL分析')).toBeVisible();
    await expect(page.locator('text=支持Boss直聘网址格式')).toBeVisible();
  });
});

test.describe('错误处理测试', () => {
  test('服务器错误处理', async ({ page }) => {
    // Mock服务器错误
    await page.route('/api/job/analyze', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: '服务器内部错误'
        })
      });
    });

    await page.goto('/job/analyze');
    
    await page.fill('input[placeholder*="请输入Boss直聘岗位网址"]', validBossUrl);
    await page.click('button:has-text("开始分析")');

    // 检查错误消息显示
    await expect(page.locator('text=服务器内部错误')).toBeVisible();
  });

  test('网络错误处理', async ({ page }) => {
    // Mock网络错误
    await page.route('/api/job/analyze', (route) => {
      route.abort('failed');
    });

    await page.goto('/job/analyze');
    
    await page.fill('input[placeholder*="请输入Boss直聘岗位网址"]', validBossUrl);
    await page.click('button:has-text("开始分析")');

    // 检查网络错误消息（可能显示为通用错误消息）
    await expect(page.locator('.text-destructive')).toBeVisible();
  });
});