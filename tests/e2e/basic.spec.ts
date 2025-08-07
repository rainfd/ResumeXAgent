import { test, expect } from '@playwright/test';

test('应用首页可以正常加载', async ({ page }) => {
  await page.goto('/');

  // 检查页面是否成功加载
  await expect(page).toHaveURL(/.*localhost:3000.*/);

  // 检查页面标题或基本内容存在
  await expect(page.locator('body')).toBeVisible();
});

test('页面无JavaScript错误', async ({ page }) => {
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  expect(errors).toHaveLength(0);
});
