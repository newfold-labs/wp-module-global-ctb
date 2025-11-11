const { test, expect } = require('@playwright/test');
const path = require('path');

// Use environment variable to resolve plugin helpers
const pluginDir = process.env.PLUGIN_DIR || path.resolve(__dirname, '../../../../../../');
const { auth } = require(path.join(pluginDir, 'tests/playwright/helpers'));
const helpers = require('../helpers');

const productsFixture = require('../fixtures/global-ctb-products.json');

// Brand plugin id
const pluginId = process.env.PLUGIN_ID || 'bluehost';

test.describe('Global Click to Buy (CTB)', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await auth.loginToWordPress(page);

    // Clear marketplace transient
    await helpers.clearMarketplaceTransient(page);

    // Go to dashboard to establish context
    await page.goto('/wp-admin/index.php');

    // Setup intercepts
    await helpers.setupMarketplaceIntercepts(page, productsFixture);
    await helpers.setupCTBIntercepts(page, { url: 'https://example.com' });
  });

  test('CTB Button renders and CTB Modal opens', async ({ page }) => {
    // Set CTB capability via WP options and browser runtime
    await helpers.setCapability({ canAccessGlobalCTB: true });

    await helpers.navigateToMarketplace(page, pluginId);
    await helpers.setCTBCapabilityInBrowser(page, true);

    // Find a CTB button and verify attributes
    const ctbButton = page.locator('[data-action="load-nfd-ctb"]').first();
    await expect(ctbButton).toBeVisible();
    await expect(ctbButton).toHaveAttribute('data-ctb-id');
    await expect(ctbButton).toHaveAttribute('target', '_blank');

    // Ensure body is initially scrollable
    await helpers.verifyBodyScrollState(page, false);

    // Open CTB modal
    await ctbButton.scrollIntoViewIfNeeded();
    await ctbButton.click();

    // Wait for modal contents
    await helpers.waitForCTBModal(page);
    await helpers.verifyCTBModalOpen(page);

    // Verify iframe URL is from intercept and includes locale param
    const iframe = helpers.getCTBIframe(page);
    const src = await iframe.getAttribute('src');
    expect(src).toContain('https://example.com');
    expect(src).toContain('locale=en_US');

    // Simulate iframe resize messages and verify dimensions
    await helpers.simulateIframeResize(page, '800px', '600px');
    await helpers.verifyCTBIframeDimensions(page, '800px', '600px');

    // Close modal and verify closed state
    await helpers.closeCTBModal(page);
    await helpers.waitForCTBModalClose(page);
    await helpers.verifyCTBModalClosed(page);
  });

  test('CTB fallback is functional', async ({ page }) => {
    // Disable CTB capability
    await helpers.setCapability({ canAccessGlobalCTB: false });

    await helpers.navigateToMarketplace(page, pluginId);
    await helpers.setCTBCapabilityInBrowser(page, false);

    // Body should remain scrollable
    await helpers.verifyBodyScrollState(page, false);

    // Verify fallback href and clicking does not open modal
    const ctbButton = page.locator('[data-action="load-nfd-ctb"]').first();
    await expect(ctbButton).toHaveAttribute('href');
    await ctbButton.click();

    // Confirm modal is still closed
    await helpers.verifyCTBModalClosed(page);
  });
});
