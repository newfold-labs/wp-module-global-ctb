import { test, expect } from '@playwright/test';
import {
  auth,
  newfold,
  productsFixture,
  clearMarketplaceTransient,
  setupMarketplaceIntercepts,
  setupCTBIntercepts,
  navigateToMarketplace,
  waitForMarketplaceProductCard,
  setCTBCapabilityInBrowser,
  waitForCTBModal,
  waitForCTBModalClose,
  getCTBButton,
  getCTBIframe,
  closeCTBModal,
  verifyCTBModalOpen,
  verifyCTBModalClosed,
  verifyCTBIframeDimensions,
  simulateIframeResize,
  verifyBodyScrollState
} from '../helpers';

// Brand plugin id
const pluginId = process.env.PLUGIN_ID || 'bluehost';

// Marketplace product id from fixture (scoped CTB — avoid matching other plugins' [data-action="load-nfd-ctb"], e.g. Yoast admin bar)
const marketplaceProductId = productsFixture.products.data[0].id;

test.describe('Global Click to Buy (CTB)', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await auth.loginToWordPress(page);

    // Clear marketplace transient
    await clearMarketplaceTransient(page);

    // Go to dashboard to establish context
    await page.goto('/wp-admin/index.php');

    // Setup intercepts
    await setupMarketplaceIntercepts(page, productsFixture);
    await setupCTBIntercepts(page, { url: 'https://example.com' });
  });

  test('CTB Button renders and CTB Modal opens', async ({ page }) => {
    // Set CTB capability via WP options and browser runtime
    await newfold.setCapability({ canAccessGlobalCTB: true });

    await navigateToMarketplace(page, pluginId);
    await setCTBCapabilityInBrowser(page, true);

    // Scope to marketplace card — `.first()` on the page matches unrelated CTB links (e.g. Yoast) that may be hidden
    await waitForMarketplaceProductCard(page, marketplaceProductId);
    const ctbButton = getCTBButton(page, marketplaceProductId);
    await ctbButton.scrollIntoViewIfNeeded();
    await expect(ctbButton).toBeVisible({ timeout: 20000 });
    await expect(ctbButton).toHaveAttribute('data-ctb-id');
    await expect(ctbButton).toHaveAttribute('target', '_blank');

    // Ensure body is initially scrollable
    await verifyBodyScrollState(page, false);

    // Open CTB modal
    await ctbButton.click();

    // Wait for modal contents
    await waitForCTBModal(page);
    await verifyCTBModalOpen(page);

    // Verify iframe URL is from intercept and includes locale param
    const iframe = getCTBIframe(page);
    const src = await iframe.getAttribute('src');
    expect(src).toContain('https://example.com');
    expect(src).toContain('locale=en_US');

    // Simulate iframe resize messages and verify dimensions
    await simulateIframeResize(page, '800px', '600px');
    await verifyCTBIframeDimensions(page, '800px', '600px');

    // Close modal and verify closed state
    await closeCTBModal(page);
    await waitForCTBModalClose(page);
    await verifyCTBModalClosed(page);
  });

  test('CTB fallback is functional', async ({ page }) => {
    // Disable CTB capability
    await newfold.setCapability({ canAccessGlobalCTB: false });

    await navigateToMarketplace(page, pluginId);
    await setCTBCapabilityInBrowser(page, false);

    // Body should remain scrollable
    await verifyBodyScrollState(page, false);

    // Verify fallback href and clicking does not open modal
    await waitForMarketplaceProductCard(page, marketplaceProductId);
    const ctbButton = getCTBButton(page, marketplaceProductId);
    await ctbButton.scrollIntoViewIfNeeded();
    await expect(ctbButton).toBeVisible({ timeout: 20000 });
    await expect(ctbButton).toHaveAttribute('href');
    await ctbButton.click();

    // Confirm modal is still closed
    await verifyCTBModalClosed(page);
  });
});
