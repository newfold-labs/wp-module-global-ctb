/**
 * Global CTB Module Test Helpers
 * 
 * Specific utilities for testing the global click-to-buy (CTB) module functionality.
 * Includes API mocking, capability management, and CTB-specific assertions.
 */

const { expect } = require('@playwright/test');
const { execSync } = require('child_process');

/**
 * WordPress CLI helper for global CTB module
 * 
 * @param {string} cmd - WP-CLI command to execute
 * @param {boolean} failOnNonZeroExit - Whether to fail on non-zero exit code
 * @returns {string} Command output
 */
function wpCli(cmd, failOnNonZeroExit = true) {
  try {
    const result = execSync(`npx wp-env run cli wp ${cmd}`, { 
      encoding: 'utf-8',
      stdio: failOnNonZeroExit ? 'pipe' : 'inherit'
    });
    return result.trim();
  } catch (error) {
    if (failOnNonZeroExit) {
      throw new Error(`WP-CLI command failed: ${cmd}\n${error.message}`);
    }
    return '';
  }
}

/**
 * Set capability helper
 * 
 * This calls performs a cli command to set a specific capability
 * 
 * @param {Object} capJSON - JSON of capabilities
 * @param {number} expiration - Seconds for transient to expire, default 3600 (1 hour)
 */
function setCapability(capJSON, expiration = 3600) {
  try {
    wpCli(
      `option update _transient_nfd_site_capabilities '${JSON.stringify(capJSON)}' --format=json`
    );
    
    // Set transient expiration to specified time from now
    const expiry = Math.floor(new Date().getTime() / 1000.0) + expiration;
    wpCli(
      `option update _transient_timeout_nfd_site_capabilities ${expiry}`
    );
  } catch (error) {
    console.warn('Failed to set capability:', error.message);
  }
}

/**
 * Clear marketplace transient data
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function clearMarketplaceTransient(page) {
  try {
    wpCli('transient delete newfold_marketplace', false);
  } catch (error) {
    console.warn('Failed to clear marketplace transient:', error.message);
  }
}

/**
 * Setup marketplace API intercepts
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} marketplaceData - Marketplace data to return
 * @param {number} delay - Response delay in milliseconds
 */
async function setupMarketplaceIntercepts(page, marketplaceData, delay = 0) {
  await page.route('**/newfold-marketplace/v1/marketplace**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(marketplaceData),
      delay: delay
    });
  });
}

/**
 * Setup CTB API intercepts
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} ctbData - CTB data to return
 * @param {number} delay - Response delay in milliseconds
 */
async function setupCTBIntercepts(page, ctbData = { url: 'https://example.com' }, delay = 0) {
  await page.route('**/newfold-ctb/v2/ctb**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ctbData),
      delay: delay
    });
  });
}

/**
 * Navigate to marketplace page
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} pluginId - Plugin ID for URL construction
 */
async function navigateToMarketplace(page, pluginId = 'bluehost') {
  await page.goto(`/wp-admin/admin.php?page=${pluginId}#/marketplace`);
}

/**
 * Set CTB capability in browser context
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {boolean} canAccess - Whether user can access global CTB
 */
async function setCTBCapabilityInBrowser(page, canAccess = true) {
  await page.evaluate((canAccess) => {
    if (window.NewfoldRuntime && window.NewfoldRuntime.capabilities) {
      window.NewfoldRuntime.capabilities.canAccessGlobalCTB = canAccess;
    }
  }, canAccess);
}

/**
 * Wait for CTB modal to open
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {number} timeout - Timeout in milliseconds
 */
async function waitForCTBModal(page, timeout = 10000) {
  await page.waitForSelector('#nfd-global-ctb-container', { timeout });
  await page.waitForSelector('.global-ctb-modal-content', { timeout });
}

/**
 * Wait for CTB modal to close
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {number} timeout - Timeout in milliseconds
 */
async function waitForCTBModalClose(page, timeout = 5000) {
  await page.waitForFunction(() => {
    const container = document.querySelector('#nfd-global-ctb-container');
    return container && container.getAttribute('aria-hidden') === 'true';
  }, { timeout });
}

/**
 * Get CTB button for specific product
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} productId - Product ID
 * @returns {import('@playwright/test').Locator} CTB button locator
 */
function getCTBButton(page, productId) {
  return page.locator(`#marketplace-item-${productId} [data-action="load-nfd-ctb"]`);
}

/**
 * Get CTB modal container
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {import('@playwright/test').Locator} CTB modal container locator
 */
function getCTBModal(page) {
  return page.locator('#nfd-global-ctb-container');
}

/**
 * Get CTB modal content
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {import('@playwright/test').Locator} CTB modal content locator
 */
function getCTBModalContent(page) {
  return page.locator('.global-ctb-modal-content');
}

/**
 * Get CTB modal close button
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {import('@playwright/test').Locator} CTB modal close button locator
 */
function getCTBModalCloseButton(page) {
  return page.locator('.global-ctb-modal-close');
}

/**
 * Get CTB iframe
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {import('@playwright/test').Locator} CTB iframe locator
 */
function getCTBIframe(page) {
  return page.locator('.global-ctb-modal-content iframe');
}

/**
 * Click CTB button
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} productId - Product ID
 */
async function clickCTBButton(page, productId) {
  const button = getCTBButton(page, productId);
  await button.scrollIntoViewIfNeeded();
  await button.click();
}

/**
 * Close CTB modal
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function closeCTBModal(page) {
  const closeButton = getCTBModalCloseButton(page);
  await closeButton.click({ force: true });
  await page.waitForTimeout(200);
}

/**
 * Verify CTB button attributes
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} productId - Product ID
 * @param {string} expectedCTBId - Expected CTB ID
 */
async function verifyCTBButtonAttributes(page, productId, expectedCTBId) {
  const button = getCTBButton(page, productId);
  await expect(button).toBeVisible();
  await expect(button).toHaveAttribute('data-ctb-id', expectedCTBId);
  await expect(button).toHaveAttribute('target', '_blank');
}

/**
 * Verify CTB modal is open
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function verifyCTBModalOpen(page) {
  const container = getCTBModal(page);
  const content = getCTBModalContent(page);
  
  await expect(container).toHaveCount(1);
  await expect(content).toBeVisible();
  await expect(page.locator('body')).toHaveClass(/noscroll/);
}

/**
 * Verify CTB modal is closed
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function verifyCTBModalClosed(page) {
  const container = getCTBModal(page);
  const content = getCTBModalContent(page);
  
  await expect(page.locator('body')).not.toHaveClass(/noscroll/);
  await expect(container).toHaveAttribute('aria-hidden', 'true');
  await expect(content).toHaveCount(0);
}

/**
 * Verify CTB iframe source
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} expectedUrl - Expected URL pattern
 * @param {string} expectedCTBId - Expected CTB ID
 */
async function verifyCTBIframeSource(page, expectedUrl, expectedCTBId) {
  const iframe = getCTBIframe(page);
  await expect(iframe).toBeVisible();
  
  const src = await iframe.getAttribute('src');
  expect(src).toContain(expectedUrl);
  expect(src).toContain('locale=en_US');
  expect(src).toContain(`id=${expectedCTBId}`);
}

/**
 * Verify CTB iframe dimensions
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} expectedWidth - Expected width
 * @param {string} expectedHeight - Expected height
 */
async function verifyCTBIframeDimensions(page, expectedWidth, expectedHeight) {
  const iframe = getCTBIframe(page);
  await expect(iframe).toHaveCSS('width', expectedWidth);
  await expect(iframe).toHaveCSS('height', expectedHeight);
}

/**
 * Simulate iframe resize messages
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} width - New width
 * @param {string} height - New height
 */
async function simulateIframeResize(page, width, height) {
  await page.evaluate(({ width, height }) => {
    // Simulate 'frameWidth' event
    const widthEvent = new MessageEvent('message', {
      data: { type: 'frameWidth', width: width },
      origin: 'http://hiive.com',
    });
    window.dispatchEvent(widthEvent);

    // Simulate 'frameHeight' event
    const heightEvent = new MessageEvent('message', {
      data: { type: 'frameHeight', height: height },
      origin: 'http://hiive.com',
    });
    window.dispatchEvent(heightEvent);
  }, { width, height });
}

/**
 * Verify CTB fallback link
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} productId - Product ID
 * @param {string} expectedUrl - Expected fallback URL
 */
async function verifyCTBFallbackLink(page, productId, expectedUrl) {
  const button = getCTBButton(page, productId);
  await expect(button).toHaveAttribute('href');
  
  const href = await button.getAttribute('href');
  expect(href).toContain(expectedUrl);
}

/**
 * Click CTB fallback link
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} productId - Product ID
 */
async function clickCTBFallbackLink(page, productId) {
  const button = getCTBButton(page, productId);
  await button.scrollIntoViewIfNeeded();
  await button.click();
}

/**
 * Verify body scroll state
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {boolean} shouldHaveNoScroll - Whether body should have noscroll class
 */
async function verifyBodyScrollState(page, shouldHaveNoScroll) {
  const body = page.locator('body');
  if (shouldHaveNoScroll) {
    await expect(body).toHaveClass(/noscroll/);
  } else {
    await expect(body).not.toHaveClass(/noscroll/);
  }
}

module.exports = {
  wpCli,
  setCapability,
  clearMarketplaceTransient,
  setupMarketplaceIntercepts,
  setupCTBIntercepts,
  navigateToMarketplace,
  setCTBCapabilityInBrowser,
  waitForCTBModal,
  waitForCTBModalClose,
  getCTBButton,
  getCTBModal,
  getCTBModalContent,
  getCTBModalCloseButton,
  getCTBIframe,
  clickCTBButton,
  closeCTBModal,
  verifyCTBButtonAttributes,
  verifyCTBModalOpen,
  verifyCTBModalClosed,
  verifyCTBIframeSource,
  verifyCTBIframeDimensions,
  simulateIframeResize,
  verifyCTBFallbackLink,
  clickCTBFallbackLink,
  verifyBodyScrollState,
};
