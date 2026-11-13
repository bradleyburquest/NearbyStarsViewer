import { expect, test } from '@playwright/test';

test('uses the release-ready viewer and selects a system', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('NearbyStarsViewer');
  await expect(page.getByRole('heading', { name: 'NearbyStarsViewer' })).toBeVisible();
  await page.getByRole('button', { name: 'Help' }).click();
  await expect(page.getByRole('dialog', { name: 'Viewer help' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Viewer help' })).toBeHidden();
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('151 systems visible')).toBeVisible();
  await page.getByLabel('Confirmed planet hosts only').check();
  await expect(page.getByText('38 of 151 systems shown')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sun-centered scene' })).toBeVisible();
  await page.getByLabel('Equatorial grid').check();
  await page.getByLabel('Proper-motion vectors').check();
  await expect(page.getByText(/Arrows: proper-motion direction/)).toBeVisible();
  await page.getByRole('searchbox').fill('Alpha Centauri');
  await expect(page.getByText('1 of 151 systems shown')).toBeVisible();
  await page.getByRole('button', { name: /Alpha Centauri.*4.32 ly/ }).click();
  await expect(page.getByRole('heading', { name: 'Alpha Centauri' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Alpha Centauri on Wikipedia/ })).toHaveAttribute(
    'href',
    'https://en.wikipedia.org/wiki/Alpha_Centauri',
  );
  await expect(page.getByText(/HIP 71683/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Exoplanets · 2' })).toBeVisible();
  await expect(page.getByText('Proxima Cen b')).toBeVisible();
  await expect(page.locator('.details-panel').getByText('Centaurus (Cen)')).toBeVisible();
  await page.getByRole('button', { name: 'Focus in scene' }).click();
  await page.getByRole('button', { name: 'Reset view' }).click();
  await page.goto('/');
  await expect(page.getByLabel('Equatorial grid')).toBeChecked();
  await expect(page.getByLabel('Proper-motion vectors')).toBeChecked();
  await expect(page.getByLabel('Confirmed planet hosts only')).toBeChecked();
});

test('keeps the semantic catalog usable at a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('combobox', { name: 'Labels' })).toHaveValue('all');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  await expect
    .poll(() =>
      page
        .locator('.star-label')
        .evaluateAll((labels) => labels.filter((label) => !label.hidden).length),
    )
    .toBe(151);
  const labelSwitch = page.getByRole('switch', { name: 'Star labels' });
  await expect(labelSwitch).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'Select Alpha Centauri' }).click({ force: true });
  await labelSwitch.click();
  await expect(page.getByRole('combobox', { name: 'Labels' })).toHaveValue('none');
  await expect(page.getByRole('button', { name: 'Select Sun' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Select Alpha Centauri' })).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator('.star-label')
        .evaluateAll((labels) => labels.filter((label) => !label.hidden).length),
    )
    .toBe(2);
  await page.getByRole('button', { name: 'Close details' }).click();
  await labelSwitch.click();
  await expect(labelSwitch).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('combobox', { name: 'Labels' })).toHaveValue('all');
  await page.getByRole('button', { name: "Select Barnard's Star" }).click({ force: true });
  await expect(page.getByRole('heading', { name: "Barnard's Star" })).toBeVisible();
  await page.getByRole('button', { name: 'Close details' }).click();
  await labelSwitch.click();
  await expect(labelSwitch).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByRole('combobox', { name: 'Labels' })).toHaveValue('none');
  await expect
    .poll(() =>
      page
        .locator('.star-label')
        .evaluateAll((labels) => labels.filter((label) => !label.hidden).length),
    )
    .toBe(3);
  await expect(page.getByRole('button', { name: "Select Barnard's Star" })).toBeVisible();
  const sceneCanvas = page.locator('.scene-canvas');
  const sceneBounds = await sceneCanvas.boundingBox();
  if (!sceneBounds) throw new Error('Scene canvas did not have layout bounds.');
  await sceneCanvas.click({
    position: { x: sceneBounds.width / 2, y: sceneBounds.height / 2 },
  });
  const selectedLabel = page.locator('.star-label.is-selected');
  await expect(selectedLabel).toHaveCount(1);
  await expect(selectedLabel).toBeVisible();
  await expect(selectedLabel.locator('.star-label__details')).toBeVisible();
  await page.locator('.scene-heading').click();
  await expect(selectedLabel).toBeVisible();
  await expect(selectedLabel.locator('.star-label__details')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Select Alpha Centauri' })).toBeVisible();
  await page.getByRole('button', { name: 'Close details' }).click();
  await labelSwitch.click();
  await expect(page.getByRole('combobox', { name: 'Labels' })).toHaveValue('all');
  const viewerBox = await page.locator('.scene-panel').boundingBox();
  const catalogBox = await page.locator('.control-panel').boundingBox();
  expect(viewerBox?.y).toBeLessThan(catalogBox?.y ?? 0);
  await expect(page.getByRole('searchbox')).toBeVisible();
  await page.getByRole('searchbox').fill('Barnard');
  await expect(page.getByText('1 of 151 systems shown')).toBeVisible();
  await page.getByRole('button', { name: /Barnard's Star 5\.96 ly/ }).click();
  await expect(page.getByRole('heading', { name: "Barnard's Star" })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: "Barnard's Star" })).toBeHidden();
});

test('includes the Sun as a selectable system at the scene origin', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Confirmed planet hosts only').check();
  await expect(page.getByText('38 of 151 systems shown')).toBeVisible();
  await page.getByRole('searchbox').fill('Sun');
  await expect(page.getByText('1 of 151 systems shown')).toBeVisible();
  await page.getByRole('button', { name: /Sun.*0\.00 ly/ }).click();
  const details = page.locator('.details-panel');
  await expect(details.getByRole('heading', { name: 'Sun' })).toBeVisible();
  await expect(details).toContainText('G2 V');
  await expect(details).toContainText('-26.74 (visual V)');
  await expect(details).toContainText('Cartesian origin (0, 0, 0)');
  await expect(details.getByRole('heading', { name: 'Planets · 8' })).toBeVisible();
  await expect(details.getByRole('link', { name: /Earth on Wikipedia/ })).toHaveAttribute(
    'href',
    'https://en.wikipedia.org/wiki/Earth',
  );

  const sunLabel = page.locator('.star-label', { hasText: 'Sun' });
  await sunLabel.click();
  await expect(sunLabel.locator('.star-label__details')).toBeVisible();
  await expect(sunLabel).toContainText('0 ly · scene origin');
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
  await page.getByLabel('Equatorial grid').check();
  await page.getByLabel('Proper-motion vectors').check();
  await expect(canvas).toHaveAttribute('data-scene-instance', 'preserve-me');
  await expect(page.getByLabel('Equatorial grid')).toBeChecked();
  await expect(page.getByLabel('Galactic plane')).not.toBeChecked();

  await page.getByRole('searchbox').fill('Barnard');
  await expect(page.getByText('1 of 151 systems shown')).toBeVisible();
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
