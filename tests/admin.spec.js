import { test, expect } from 'playwright-test-coverage';
import { getHostUrl, registerMenuRouteMocks, registerFranchiseRouteMocks, getRandomEmail, registerAuthRouteMocks, registerOrderRouteMocks, performLoginAction, getAdminEmail, getAdminPassword, getFranchiseEmail, getFranchisePassword } from './testUtils';

async function loginAsAdmin(page) {
    const adminEmail = getAdminEmail();
    const adminPassword = getAdminPassword();
    await registerAuthRouteMocks(page, adminEmail, adminPassword, 'admin');
  
    const loginUrl = getHostUrl() + "/login";
    await page.goto(loginUrl);
    await performLoginAction(page, adminEmail, adminPassword);
}

async function performCreateFranchiseAction(newFranchiseName) {
    const franchiseeEmail = getFranchiseEmail();
    await page.getByPlaceholder("franchise name").fill(newFranchiseName);
    await page.getByPlaceholder("franchisee admin email").fill(franchiseeEmail);
    await page.getByRole('button', { name: "Create" }).click();
}

test('adminDashboardTest', async ({ page }) => {
    await page.goto(getHostUrl());
    await loginAsAdmin(page);
      
    // Should be on home page and Admin option should show up
    expect(await page.title()).toBe('JWT Pizza');
    const adminButtonLink = await  page.getByRole('link', { name: 'Admin' });
    await expect(adminButtonLink).toBeVisible();

    // Click Admin and be routed to the Admin Dashboard
    await adminButtonLink.click();

    // Find the navigation helper that has home -> admin, ensure it's correct
    const navigationStack = page.locator('ol.flex.items-center');
    await expect(navigationStack.locator('li:nth-child(1)')).toContainText('home');
    await expect(navigationStack.locator('li:nth-child(2)')).toContainText('admin-dashboard');
});

test('addNewFranchiseTest', async ({ page }) => {
    await page.goto(getHostUrl());
    await loginAsAdmin(page);

    const addFranchiseButton = await page.getByRole('button', { name: 'Add Franchise' });
    expect(addFranchiseButton).toBeVisible();
    await addFranchiseButton.click();

    await expect(page.locator('body')).toContainText("Create franchise");
    await expect(page.locator('body')).toContainText("Want to create franchise?");

    // Find the navigation helper that has home -> admin -> create, ensure it's correct
    const navigationStack = page.locator('ol.flex.items-center');
    await expect(navigationStack.locator('li:nth-child(1)')).toContainText('home');
    await expect(navigationStack.locator('li:nth-child(2)')).toContainText('admin-dashboard');
    await expect(navigationStack.locator('li:nth-child(3)')).toContainText('create-franchise');

    // After creation, routes back to admin-dashboard
    const newFranchiseName = "MY NEW FRANCHISE";
    await performCreateFranchiseAction(newFranchiseName);

    await expect(page.locator('body')).toContainText(newFranchiseName);
    await expect(page.locator('body')).toContainText(newFranchiseName);
});

test('closeFranchiseTest', async ({ page }) => {
    await loginAsAdmin();
      
    
});
  