import { expect, test } from '@playwright/test';

test('uses the release-ready viewer and selects a system', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('NearbyStarsViewer');
  await expect(page.getByText('Phase 8 · 88 constellations')).toBeVisible();
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
  await expect(page.locator('.details-panel').getByText('Centaurus (Cen)')).toBeVisible();
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

test('preserves the scene while toggling layers and expands a selected star label', async ({
  page,
}) => {
  await page.goto('/');
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible({ timeout: 15_000 });
  await canvas.evaluate((element) => {
    element.dataset.sceneInstance = 'preserve-me';
  });

  await page.getByLabel('Galactic plane').check();
  await expect(canvas).toHaveAttribute('data-scene-instance', 'preserve-me');
  await page.getByLabel('Galactic plane').uncheck();
  await expect(canvas).toHaveAttribute('data-scene-instance', 'preserve-me');

  await page.getByRole('searchbox').fill('Barnard');
  await expect(page.getByText('1 of 150 systems shown')).toBeVisible();
  await page.getByRole('button', { name: /Barnard's Star.*5.96 ly/ }).click();
  const starLabel = page.locator('.star-label', { hasText: "Barnard's Star" });
  const labelPosition = await starLabel.locator('.star-label__name').boundingBox();
  await starLabel.click();
  await expect(starLabel).toHaveClass(/is-selected/);
  await expect(starLabel).toHaveAttribute('aria-expanded', 'true');
  await expect(starLabel.locator('.star-label__details')).toBeVisible();
  await expect(starLabel).toContainText('5.96 ly');
  await expect(starLabel).toContainText('M3.5-4 V');
  await expect(starLabel).toContainText('Ophiuchus (Oph)');
  await expect(starLabel).toContainText('RA 269.4485\u00b0');
  await expect(starLabel).toContainText('Apparent mag.');
  await expect(starLabel).toContainText('8.19 (Gaia G)');
  await expect(page.locator('.details-panel')).toContainText('Apparent magnitude');
  await expect(page.locator('.details-panel')).toContainText('Observed brightness from Earth');
  const distanceHelp = page.getByRole('button', { name: /Show help for Distance/ });
  await distanceHelp.hover();
  await expect(page.getByRole('tooltip')).toContainText('distance from the Sun');
  await page.locator('.details-heading').hover();
  await expect(page.getByRole('tooltip')).toBeHidden();
  await distanceHelp.click();
  await page.locator('.details-heading').hover();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await distanceHelp.click();
  await expect(page.getByRole('tooltip')).toBeHidden();
  const expandedPosition = await starLabel.locator('.star-label__name').boundingBox();
  expect(expandedPosition?.x).toBeCloseTo(labelPosition?.x ?? 0, 0);
  expect(expandedPosition?.y).toBeCloseTo(labelPosition?.y ?? 0, 0);

  await page.locator('.scene-heading').click();
  await expect(starLabel).toHaveAttribute('aria-expanded', 'false');
  await expect(starLabel.locator('.star-label__details')).toBeHidden();
  await expect(page.getByRole('heading', { name: "Barnard's Star" })).toBeVisible();
});

test('scrolls both side panels when their content exceeds the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 500 });
  await page.goto('/');

  const controls = page.locator('.control-panel');
  await expect(controls).toBeVisible();
  await expect
    .poll(() =>
      controls.evaluate(
        (element) =>
          getComputedStyle(element).overflowY === 'auto' &&
          element.scrollHeight > element.clientHeight,
      ),
    )
    .toBe(true);

  await page.getByRole('searchbox').fill('Alpha Centauri');
  await page.getByRole('button', { name: /Alpha Centauri.*4.32 ly/ }).click();
  const details = page.locator('.details-panel');
  await expect(details).toBeVisible();
  await expect
    .poll(() =>
      details.evaluate(
        (element) =>
          getComputedStyle(element).overflowY === 'auto' &&
          element.scrollHeight > element.clientHeight,
      ),
    )
    .toBe(true);
  await details.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(details.getByText('Proxima Cen b')).toBeVisible();
});
