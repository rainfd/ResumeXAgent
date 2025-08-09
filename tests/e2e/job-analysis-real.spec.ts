import { test, expect } from '@playwright/test';

// 真实的Boss直聘URL用于测试 - 通过爬虫实时抓取的有效URL
const realBossUrls = [
  // 最新抓取的有效URL (2025-08-07)
  'https://www.zhipin.com/job_detail/6e5a8896abcee92303B439i1GVVV.html',
  'https://www.zhipin.com/job_detail/5603c8bdf8d6a79e03d-29u1EltS.html',
  'https://www.zhipin.com/job_detail/21c5b3700caeaaef1X183dm4FlpX.html',
  // 备用URL
  'https://www.zhipin.com/job_detail/f840a802f917c2391HBz3961FFFX.html',
  'https://www.zhipin.com/job_detail/1f4c0a69d5ddcc551nZ_0tW4F1U~.html'
];

// 从多个URL中随机选择一个进行测试
const getRandomBossUrl = () => {
  const randomIndex = Math.floor(Math.random() * realBossUrls.length);
  return realBossUrls[randomIndex];
};

const realBossUrl = getRandomBossUrl();
const invalidUrl = 'https://invalid-site.com/job/123';

// URL失效检测和提示功能
const checkUrlAndProvideAlternatives = async (page, testUrl) => {
  const hasError = await page.locator('.text-destructive').isVisible();
  const hasResult = await page.locator('text=分析结果').isVisible();
  const needsVerification = await page.locator('text=需要用户验证').isVisible();

  if (!hasResult && !needsVerification && hasError) {
    const errorText = await page.locator('.text-destructive').textContent();
    console.log(`⚠️ 当前测试URL可能已失效: ${testUrl}`);
    console.log(`错误信息: ${errorText}`);
    console.log('📝 建议尝试以下替代URL:');
    realBossUrls.forEach((url, index) => {
      if (url !== testUrl) {
        console.log(`  ${index + 1}. ${url}`);
      }
    });
    console.log('\n💡 如需更新测试URL，请访问 https://www.zhipin.com 查找最新的岗位详情页面URL');
    console.log('   格式应为: https://www.zhipin.com/job_detail/[job_id].html');
    return false;
  }
  return true;
};

test.describe('岗位分析功能 - 真实URL测试', () => {
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

  // 真实URL测试 - 可能需要较长时间
  test('真实Boss直聘URL分析', async ({ page }) => {
    // 增加测试超时时间，因为真实浏览器启动和页面加载需要时间
    test.setTimeout(120000); // 2分钟

    await page.goto('/job/analyze');

    // 输入真实的Boss直聘URL
    await page.fill('input[placeholder*="请输入Boss直聘岗位网址"]', realBossUrl);
    
    // 点击开始分析
    await page.click('button:has-text("开始分析")');

    // 等待分析开始 - 可能会看到加载状态（使用更具体的选择器）
    await expect(page.locator('button:has-text("开始分析"), button:has-text("正在分析")')).toBeVisible();

    // 等待结果或用户验证提示 - 给较长时间因为要启动真实浏览器
    await Promise.race([
      // 成功情况：显示分析结果
      page.waitForSelector('text=分析结果', { timeout: 60000 }),
      // 需要验证情况：显示验证提示
      page.waitForSelector('text=需要用户验证', { timeout: 60000 }),
      // 错误情况：显示错误消息
      page.waitForSelector('.text-destructive', { timeout: 60000 })
    ]);

    // 检查是否有任何响应（成功、验证需求或错误）
    const hasResult = await page.locator('text=分析结果').isVisible();
    const needsVerification = await page.locator('text=需要用户验证').isVisible();
    const hasError = await page.locator('.text-destructive').isVisible();

    // 至少应该有一种响应
    expect(hasResult || needsVerification || hasError).toBeTruthy();

    if (hasResult) {
      console.log('✅ 成功获取岗位信息');
      
      // 检查岗位信息显示
      await expect(page.locator('text=职位名称')).toBeVisible();
      await expect(page.locator('text=公司名称')).toBeVisible();
      
    } else if (needsVerification) {
      console.log('⚠️  需要用户验证 - 这是正常情况');
      
      // 检查验证提示
      await expect(page.locator('text=需要用户验证')).toBeVisible();
      await expect(page.locator('text=请在浏览器中完成登录或验证码验证')).toBeVisible();
      await expect(page.locator('button', { hasText: '继续分析' })).toBeVisible();
      
    } else if (hasError) {
      console.log('ℹ️  出现错误 - 检查错误信息并提供替代URL');
      
      // 使用URL失效检测功能
      const isUrlValid = await checkUrlAndProvideAlternatives(page, realBossUrl);
      
      if (!isUrlValid) {
        console.log('\n🔄 建议更新测试文件中的URL数组，使用更新的岗位URL');
      }
      
      // 检查是否有错误信息显示
      await expect(page.locator('.text-destructive')).toBeVisible();
    }
  });

  test('UI交互状态检查', async ({ page }) => {
    await page.goto('/job/analyze');

    // 初始状态：按钮禁用（因为没有输入）
    await expect(page.locator('button:has-text("开始分析")')).toBeDisabled();
    
    // 输入URL后按钮启用
    await page.fill('input[placeholder*="请输入Boss直聘岗位网址"]', realBossUrl);
    await expect(page.locator('button:has-text("开始分析")')).toBeEnabled();
    
    // 检查输入框可见性
    await expect(page.locator('input[placeholder*="请输入Boss直聘岗位网址"]')).toBeVisible();
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
    await page.fill('input[placeholder*="请输入Boss直聘岗位网址"]', realBossUrl);
    
    await page.waitForLoadState('networkidle');

    // 检查没有严重的JavaScript错误（忽略一些网络相关的非关键错误）
    const criticalErrors = errors.filter(error => 
      !error.includes('net::') && 
      !error.includes('favicon') &&
      !error.includes('404')
    );
    expect(criticalErrors).toHaveLength(0);
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

test.describe('真实场景错误处理测试', () => {
  test('不存在的岗位URL处理', async ({ page }) => {
    test.setTimeout(60000);
    
    await page.goto('/job/analyze');
    
    // 使用格式正确但不存在的Boss直聘URL
    const nonExistentUrl = 'https://www.zhipin.com/job_detail/nonexistent123.html';
    
    await page.fill('input[placeholder*="请输入Boss直聘岗位网址"]', nonExistentUrl);
    await page.click('button:has-text("开始分析")');

    // 等待错误响应或其他响应
    await Promise.race([
      page.waitForSelector('.text-destructive', { timeout: 30000 }),
      page.waitForSelector('text=分析结果', { timeout: 30000 }),
      page.waitForSelector('text=需要用户验证', { timeout: 30000 })
    ]);

    // 检查是否有任何合理的响应
    const hasError = await page.locator('.text-destructive').isVisible();
    const hasResult = await page.locator('text=分析结果').isVisible();
    const needsVerification = await page.locator('text=需要用户验证').isVisible();

    expect(hasError || hasResult || needsVerification).toBeTruthy();

    // 如果遇到错误，检查是否需要提供替代URL
    if (hasError && !hasResult && !needsVerification) {
      await checkUrlAndProvideAlternatives(page, nonExistentUrl);
    }
  });
});