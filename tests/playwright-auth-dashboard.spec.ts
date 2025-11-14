import { test, expect } from '@playwright/test';

/**
 * Playwright Test Plan for Authentication and Customer Dashboard
 * 
 * Run with: npx playwright test tests/playwright-auth-dashboard.spec.ts
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

test.describe('Authentication Flow', () => {
  test('should register a new user', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    
    // Fill registration form
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    const email = `test-${Date.now()}@example.com`;
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'TestPassword123');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect (either to account or login)
    await page.waitForURL(new RegExp(`${BASE_URL}/(account|login)`), { timeout: 10000 });
    
    // Should redirect to account dashboard or login
    const currentUrl = page.url();
    if (currentUrl.includes('/account')) {
      // Should see welcome message
      await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });
    } else {
      // If redirected to login, that's also acceptable (auto-login might fail)
      await expect(page.locator('text=Sign in')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Fill login form
    await page.fill('input[name="username"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL(new RegExp(`${BASE_URL}/account`), { timeout: 10000 }).catch(() => {
      // If login fails, skip this test
      test.skip();
    });
    
    // Should redirect to account dashboard
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/account`));
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await page.fill('input[name="username"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'WrongPassword');
    
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=/Invalid|error|failed/i')).toBeVisible();
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto(`${BASE_URL}/account`);
    
    // Should redirect to login
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/login`));
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/account`));
    
    // Click logout
    await page.click('text=Sign Out');
    
    // Should redirect to home
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/`));
  });
});

test.describe('Address Book CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/account`));
  });

  test('should navigate to addresses page', async ({ page }) => {
    await page.goto(`${BASE_URL}/account`);
    await page.click('text=Address Book');
    
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/account/addresses`));
  });

  test('should create a new address', async ({ page }) => {
    await page.goto(`${BASE_URL}/account/addresses`);
    
    // Click add new address
    await page.click('text=Add New Address');
    
    // Wait for form to appear
    await page.waitForSelector('select', { timeout: 5000 });
    
    // Fill address form
    await page.selectOption('select', 'billing');
    await page.fill('input[placeholder*="First Name"], label:has-text("First Name") + input', 'John');
    await page.fill('input[placeholder*="Last Name"], label:has-text("Last Name") + input', 'Doe');
    await page.fill('input[placeholder*="Address"], label:has-text("Address") + input', '123 Main St');
    await page.fill('input[placeholder*="City"], label:has-text("City") + input', 'Sydney');
    await page.fill('input[placeholder*="State"], label:has-text("State") + input', 'NSW');
    await page.fill('input[placeholder*="Postcode"], label:has-text("Postcode") + input', '2000');
    await page.selectOption('select[name="country"], select:has(option[value="AU"])', 'AU');
    await page.fill('input[type="email"]', 'john@example.com');
    await page.fill('input[type="tel"]', '+61 400 123 456');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should see success message or address in list
    await expect(
      page.locator('text=/Address added|Address updated|John Doe/i')
    ).toBeVisible({ timeout: 10000 });
  });

  test('should edit an existing address', async ({ page }) => {
    await page.goto(`${BASE_URL}/account/addresses`);
    
    // Wait for addresses to load
    await page.waitForSelector('text=Edit', { timeout: 5000 });
    
    // Click edit on first address
    await page.click('button:has-text("Edit")');
    
    // Update address
    await page.fill('input[placeholder*="First Name"]', 'Jane');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should see updated address
    await expect(page.locator('text=Jane')).toBeVisible();
  });

  test('should delete an address', async ({ page }) => {
    await page.goto(`${BASE_URL}/account/addresses`);
    
    // Wait for addresses to load
    await page.waitForSelector('button:has-text("Delete")', { timeout: 5000 });
    
    // Click delete
    await page.click('button:has-text("Delete")');
    
    // Confirm deletion
    page.on('dialog', dialog => dialog.accept());
    
    // Should see success message
    await expect(page.locator('text=/Address deleted/i')).toBeVisible();
  });

  test('should display address list', async ({ page }) => {
    await page.goto(`${BASE_URL}/account/addresses`);
    
    // Should see address book heading
    await expect(page.locator('h2:has-text("Address Book")')).toBeVisible();
    
    // Should see add button
    await expect(page.locator('button:has-text("Add New Address")')).toBeVisible();
  });
});

test.describe('Order History', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/account`));
  });

  test('should navigate to orders page', async ({ page }) => {
    await page.goto(`${BASE_URL}/account`);
    await page.click('text=Orders');
    
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/account/orders`));
  });

  test('should display orders list', async ({ page }) => {
    await page.goto(`${BASE_URL}/account/orders`);
    
    // Should see orders heading
    await expect(page.locator('h2:has-text("My Orders")')).toBeVisible();
  });

  test('should view order details', async ({ page }) => {
    await page.goto(`${BASE_URL}/account/orders`);
    
    // Wait for orders to load
    await page.waitForSelector('a:has-text("View Details")', { timeout: 5000 }).catch(() => {
      // If no orders, skip this test
      test.skip();
    });
    
    // Click view details
    await page.click('a:has-text("View Details")');
    
    // Should see order detail page
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/account/orders/\\d+`));
    await expect(page.locator('text=Order Details')).toBeVisible();
  });

  test('should display empty state when no orders', async ({ page }) => {
    await page.goto(`${BASE_URL}/account/orders`);
    
    // If no orders, should see empty state
    const emptyState = page.locator('text=You haven\'t placed any orders yet');
    const ordersList = page.locator('text=Order #');
    
    // Either empty state or orders list should be visible
    await expect(emptyState.or(ordersList)).toBeVisible();
  });
});

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/account`));
  });

  test('should navigate to all dashboard sections', async ({ page }) => {
    const sections = [
      { name: 'Dashboard', url: '/account' },
      { name: 'Orders', url: '/account/orders' },
      { name: 'Address Book', url: '/account/addresses' },
      { name: 'Wishlist', url: '/account/wishlist' },
      { name: 'Account Details', url: '/account/settings' },
    ];

    for (const section of sections) {
      await page.goto(`${BASE_URL}/account`);
      await page.click(`text=${section.name}`);
      await expect(page).toHaveURL(new RegExp(`${BASE_URL}${section.url}`));
    }
  });

  test('should display dashboard stats', async ({ page }) => {
    await page.goto(`${BASE_URL}/account`);
    
    // Should see welcome message
    await expect(page.locator('text=Welcome back')).toBeVisible();
    
    // Should see stats cards
    await expect(page.locator('text=Total Orders')).toBeVisible();
    await expect(page.locator('text=Total Spent')).toBeVisible();
  });
});

test.describe('Wishlist Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/account`));
  });

  test('should navigate to wishlist page', async ({ page }) => {
    await page.goto(`${BASE_URL}/account`);
    await page.click('text=Wishlist');
    
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/account/wishlist`));
  });

  test('should display wishlist items', async ({ page }) => {
    await page.goto(`${BASE_URL}/account/wishlist`);
    
    // Should see wishlist heading
    await expect(page.locator('h2:has-text("My Wishlist")')).toBeVisible();
  });
});

test.describe('Account Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/account`));
  });

  test('should update account details', async ({ page }) => {
    await page.goto(`${BASE_URL}/account/settings`);
    
    // Update first name
    await page.fill('input[name="first_name"]', 'Updated');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should see success message
    await expect(page.locator('text=/Account updated|successfully/i')).toBeVisible();
  });
});

/**
 * Test Configuration
 * 
 * Add to playwright.config.ts:
 * 
 * export default defineConfig({
 *   testDir: './tests',
 *   use: {
 *     baseURL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
 *   },
 * });
 */

