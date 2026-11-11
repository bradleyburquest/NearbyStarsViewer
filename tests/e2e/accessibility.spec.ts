import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('has no automatically detectable WCAG A or AA violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('150 systems visible')).toBeVisible({ timeout: 15_000 });
  const results = await new AxeBuilder({ page })
    .exclude('.label-layer')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    results.violations,
    results.violations.map((violation) => `${violation.id}: ${violation.help}`).join('\n'),
  ).toEqual([]);
});
