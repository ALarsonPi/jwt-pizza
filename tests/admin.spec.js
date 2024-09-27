import { test, expect } from 'playwright-test-coverage';
import { getHostUrl, registerJustCreatedFranchiseMock, registerEmptyFranchiseRouteMocks, registerAuthRouteMocks, performLoginAction, getAdminEmail, getAdminPassword, getFranchiseEmail, registerCreateStoreOrDeleteFranchiseMocks, registerFranchiseWithStoresMock, registerDeleteStoreMock } from './testUtils';

async function loginAsAdmin(page) {
    const adminEmail = getAdminEmail();
    const adminPassword = getAdminPassword();
    await registerAuthRouteMocks(page, adminEmail, adminPassword, 'admin');
  
    const loginUrl = getHostUrl() + "/login";
    await page.goto(loginUrl);
    await performLoginAction(page, adminEmail, adminPassword);
}

async function loginAndNavigateToAdmin(page, newFranchiseName) {
    await loginAsAdmin(page);
    await registerEmptyFranchiseRouteMocks(page, newFranchiseName);
    const adminButtonLink = await  page.getByRole('link', { name: 'Admin' });
    await adminButtonLink.click();
}

async function performCreateFranchiseAction(page, newFranchiseName) {
    const franchiseeEmail = getFranchiseEmail();
    await page.getByPlaceholder("franchise name").fill(newFranchiseName);
    await page.getByPlaceholder("franchisee admin email").fill(franchiseeEmail);
    await page.getByRole('button', { name: "Create" }).click();
}

async function openFranchise(page, newFranchiseName) {
    const addFranchiseButton = await page.getByRole('button', { name: 'Add Franchise' });
    await expect(addFranchiseButton).toBeVisible();
    await addFranchiseButton.click();

    await expect(page.locator('body')).toContainText("Create franchise");
    await expect(page.locator('body')).toContainText("Want to create franchise?");

    // Find the navigation helper that has home -> admin -> create, ensure it's correct
    const navigationStack = page.locator('ol.flex.items-center');
    await expect(navigationStack.locator('li:nth-child(1)')).toContainText('home');
    await expect(navigationStack.locator('li:nth-child(2)')).toContainText('admin-dashboard');
    await expect(navigationStack.locator('li:nth-child(3)')).toContainText('create-franchise');

    // Fill in Franchise info, navigate back to admin-dashboard
    await registerJustCreatedFranchiseMock(page, newFranchiseName);
    await performCreateFranchiseAction(page, newFranchiseName);
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
    const newFranchiseName = "MY NEW FRANCHISE";
    await loginAndNavigateToAdmin(page, newFranchiseName);
    await openFranchise(page, newFranchiseName);

    // Expect one franchise to show up in the list with the name of the newly created franchise
    await expect(page.locator('body')).toContainText(newFranchiseName);
});

test('closeFranchiseTest', async ({ page }) => {
    await page.goto(getHostUrl());
    const newFranchiseName = "MY NEW FRANCHISE";
    await loginAndNavigateToAdmin(page, newFranchiseName);
    await openFranchise(page, newFranchiseName);
    await expect(page.locator('body')).toContainText(newFranchiseName);

    const expectedFranchiseCloseButton = await page.locator('table > tbody > tr:nth-of-type(1) button');
    await expectedFranchiseCloseButton.click();
    await expect(page.locator('body')).toContainText('Sorry to see you go');

    // Cancel, return to admin dashboard
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Click Close on the franchise (again)
    await expectedFranchiseCloseButton.click();

    // Confirm Closing franchise
    await registerEmptyFranchiseRouteMocks(page, newFranchiseName);
    await registerCreateStoreOrDeleteFranchiseMocks(page);
    await page.getByRole('button', { name: 'Close' }).click();

    // Franchise should no longer be there
    await expect(page.locator('body')).not.toContainText(newFranchiseName);
});

test('closeStoreTest', async ({ page }) => {
    await page.goto(getHostUrl());
    const newFranchiseName = "MY NEW FRANCHISE";
    await loginAndNavigateToAdmin(page, newFranchiseName);

    // await openFranchise(page, newFranchiseName);
    const addFranchiseButton = await page.getByRole('button', { name: 'Add Franchise' });
    await expect(addFranchiseButton).toBeVisible();
    await addFranchiseButton.click();
    await registerFranchiseWithStoresMock(page, newFranchiseName);
    await performCreateFranchiseAction(page, newFranchiseName);

    // Both expected Franchise and expected Store should appear
    const expectedStoreName = "Lehi";
    await expect(page.locator('body')).toContainText(newFranchiseName);
    await expect(page.locator('body')).toContainText(expectedStoreName);

    const expectedStoreCloseButton = await page.locator('table > tbody > tr:nth-of-type(2) button');
    await expectedStoreCloseButton.click();

    // Cancel, return to admin dashboard
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Click Close on the store (again)
    await expectedStoreCloseButton.click();

    // Actually close it
    await registerDeleteStoreMock(page);
    await page.getByRole('button', { name: 'Close' }).click();

    // Franchise should still be there, but not the store
    await expect(page.locator('body')).toContainText(newFranchiseName);
    await expect(page.locator('body')).not.toContainText(expectedStoreName);
});
  