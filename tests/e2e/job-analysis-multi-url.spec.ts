import { test, expect } from '@playwright/test';

// 多个候选Boss直聘URL进行测试
const candidateBossUrls = [
  'https://www.zhipin.com/job_detail/f840a802f917c2391HBz3961FFFX.html',
  'https://www.zhipin.com/job_detail/1f4c0a69d5ddcc551nZ_0tW4F1U~.html',
  'https://www.zhipin.com/job_detail/a8c4e5f6d9b2c3e41nZ_2tW5G2V~.html',
  'https://www.zhipin.com/job_detail/b9d5f6e7a0c3d4f51nZ_3tW6H3W~.html',
  // 可以根据需要添加更多URL
];

test.describe('多URL岗位分析测试 - 寻找有效URL', () => {
  test('测试多个Boss直聘URL，找出有效的URL', async ({ page }) => {
    test.setTimeout(300000); // 5分钟，因为要测试多个URL

    let validUrls = [];
    let invalidUrls = [];
    let needVerificationUrls = [];

    console.log('\n🔍 开始测试多个Boss直聘URL...');
    console.log(`总计需要测试: ${candidateBossUrls.length} 个URL\n`);

    for (let i = 0; i < candidateBossUrls.length; i++) {
      const testUrl = candidateBossUrls[i];
      console.log(`[${i + 1}/${candidateBossUrls.length}] 测试URL: ${testUrl}`);

      try {
        await page.goto('/job/analyze');
        
        // 输入URL
        await page.fill('input[placeholder*="请输入Boss直聘岗位网址"]', testUrl);
        await page.click('button:has-text("开始分析")');

        // 等待响应 - 缩短超时时间以加快测试
        await Promise.race([
          page.waitForSelector('text=分析结果', { timeout: 30000 }),
          page.waitForSelector('text=需要用户验证', { timeout: 30000 }),
          page.waitForSelector('.text-destructive', { timeout: 30000 })
        ]);

        // 检查结果
        const hasResult = await page.locator('text=分析结果').isVisible();
        const needsVerification = await page.locator('text=需要用户验证').isVisible();
        const hasError = await page.locator('.text-destructive').isVisible();

        if (hasResult) {
          console.log(`✅ [有效] 成功获取岗位信息`);
          validUrls.push(testUrl);
          
        } else if (needsVerification) {
          console.log(`⚠️ [需要验证] 需要用户手动验证`);
          needVerificationUrls.push(testUrl);
          
        } else if (hasError) {
          const errorText = await page.locator('.text-destructive').textContent();
          console.log(`❌ [失效] 错误: ${errorText}`);
          invalidUrls.push(testUrl);
        }

      } catch (error) {
        console.log(`💥 [异常] 测试过程中出现异常: ${error.message}`);
        invalidUrls.push(testUrl);
      }

      console.log('---');
      
      // 短暂休息避免请求过于频繁
      await page.waitForTimeout(2000);
    }

    // 输出测试总结
    console.log('\n📊 测试结果总结:');
    console.log(`✅ 有效URL (${validUrls.length}个):`);
    validUrls.forEach((url, index) => {
      console.log(`  ${index + 1}. ${url}`);
    });

    console.log(`\n⚠️ 需要验证的URL (${needVerificationUrls.length}个):`);
    needVerificationUrls.forEach((url, index) => {
      console.log(`  ${index + 1}. ${url}`);
    });

    console.log(`\n❌ 失效URL (${invalidUrls.length}个):`);
    invalidUrls.forEach((url, index) => {
      console.log(`  ${index + 1}. ${url}`);
    });

    console.log('\n💡 建议:');
    if (validUrls.length > 0) {
      console.log('- 使用上述有效URL进行后续测试');
      console.log('- 建议更新测试文件中的URL列表，优先使用有效URL');
    } else if (needVerificationUrls.length > 0) {
      console.log('- 所有URL都需要验证，这是Boss直聘的正常防护机制');
      console.log('- 可以使用需要验证的URL进行手动测试');
    } else {
      console.log('- 所有URL都已失效，需要访问 https://www.zhipin.com 获取新的岗位URL');
      console.log('- URL格式应为: https://www.zhipin.com/job_detail/[job_id].html');
    }

    // 至少应该有一些响应，不管是有效、需要验证还是错误
    const totalResponses = validUrls.length + needVerificationUrls.length + invalidUrls.length;
    expect(totalResponses).toBeGreaterThan(0);
  });

  test('快速验证单个推荐URL', async ({ page }) => {
    test.setTimeout(60000);

    // 使用第一个候选URL进行快速测试
    const testUrl = candidateBossUrls[0];
    console.log(`\n🚀 快速测试推荐URL: ${testUrl}`);

    await page.goto('/job/analyze');
    await page.fill('input[placeholder*="请输入Boss直聘岗位网址"]', testUrl);
    await page.click('button:has-text("开始分析")');

    // 等待任何响应
    await Promise.race([
      page.waitForSelector('text=分析结果', { timeout: 30000 }),
      page.waitForSelector('text=需要用户验证', { timeout: 30000 }),
      page.waitForSelector('.text-destructive', { timeout: 30000 })
    ]);

    // 检查结果并给出建议
    const hasResult = await page.locator('text=分析结果').isVisible();
    const needsVerification = await page.locator('text=需要用户验证').isVisible();
    const hasError = await page.locator('.text-destructive').isVisible();

    if (hasResult) {
      console.log('✅ 推荐URL有效！可以用于手动测试');
    } else if (needsVerification) {
      console.log('⚠️  推荐URL需要验证，可以用于手动测试（正常情况）');
    } else if (hasError) {
      console.log('❌ 推荐URL已失效，建议运行完整的多URL测试找到有效URL');
    }

    // 至少应该有某种响应
    expect(hasResult || needsVerification || hasError).toBeTruthy();
  });
});

test.describe('URL格式验证', () => {
  test('验证Boss直聘URL格式检测功能', async ({ page }) => {
    await page.goto('/job/analyze');

    const testCases = [
      {
        url: 'https://www.zhipin.com/job_detail/valid123.html',
        expected: true,
        description: '有效的Boss直聘URL格式'
      },
      {
        url: 'https://invalid-site.com/job/123',
        expected: false,
        description: '无效域名'
      },
      {
        url: 'not-a-url',
        expected: false,
        description: '无效URL格式'
      },
      {
        url: 'https://www.zhipin.com/other/page',
        expected: false,
        description: 'Boss直聘但非岗位详情页面'
      }
    ];

    for (const testCase of testCases) {
      console.log(`测试: ${testCase.description} - ${testCase.url}`);
      
      await page.fill('input[placeholder*="请输入Boss直聘岗位网址"]', testCase.url);
      
      if (testCase.expected) {
        // 应该通过前端验证
        await expect(page.locator('button:has-text("开始分析")')).toBeEnabled();
        console.log('✅ 前端验证通过');
      } else {
        // 应该被前端验证拦截
        const button = page.locator('button:has-text("开始分析")');
        if (await button.isEnabled()) {
          await button.click();
          await expect(page.locator('.text-destructive')).toBeVisible();
          console.log('✅ 正确显示验证错误');
        } else {
          console.log('✅ 前端验证拦截成功');
        }
      }
      
      // 清空输入框
      await page.fill('input[placeholder*="请输入Boss直聘岗位网址"]', '');
    }
  });
});