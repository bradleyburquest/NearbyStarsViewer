import { expect, test } from '@playwright/test';

test('uses the release-ready viewer and selects a system', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('NearbyStarsViewer');
  await expect(page.getByText('Phase 8 · Production hardened')).toBeVisible();
  await page.getByRole('button', { name: 'Help' }).click();
  await expect(page.getByRole('dialog', { name: 'Viewer help' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Viewer help' })).toBeHidden();
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('150 systems visible')).toBeVisible();
  await page.getByLabel('Confirmed planet hosts only').check();
  await expect(page.getByText('37 of 150 systems shown')).toBeVisible();
  await page.getByRole('button', { name: 'Earth' }).click();
  await expect(page.getByRole('heading', { name: 'Earth-centered scene' })).toBeVisible();
  await page.getByLabel('Equatorial grid').check();
  await page.getByLabel('Proper-motion vectors').check();
  await expect(page.getByText(/Arrows: proper-motion direction/)).toBeVisible();
  await page.getByRole('searchbox').fill('Alpha Centauri');
  await expect(page.getByText('1 of 150 systems shown')).toBeVisible();
  await page.getByRole('button', { name: /Alpha Centauri.*4.32 ly/ }).click();
  await expect(page.getByRole('heading', { name: 'Alpha Centauri' })).toBeVisible();
  await expect(page.getByText(/HIP 71683/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Exoplanets · 2' })).toBeVisible();
  await expect(page.getByText('Proxima Cen b')).toBeVisible();
  await page.getByRole('button', { name: 'Focus in scene' }).click();
  await page.getByRole('button', { name: 'Reset view' }).click();
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Earth' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Equatorial grid')).toBeChecked();
  await expect(page.getByLabel('Proper-motion vectors')).toBeChecked();
  await expect(page.getByLabel('Confirmed planet hosts only')).toBeChecked();
});

test('keeps the semantic catalog usable at a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('searchbox')).toBeVisible();
  await page.getByRole('searchbox').fill('Barnard');
  await expect(page.getByText('1 of 150 systems shown')).toBeVisible();
  await page.getByRole('button', { name: /Barnard's Star 5\.96 ly/ }).click();
  await expect(page.getByRole('heading', { name: "Barnard's Star" })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: "Barnard's Star" })).toBeHidden();
});
