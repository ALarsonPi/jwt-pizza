import { test, expect } from 'playwright-test-coverage';
import { getHostUrl, registerCreateStoreMock, registerUsersFranchises, registerAuthRouteMocks, performLoginAction, getFranchiseEmail, registerDeleteStoreMock, getFranchisePassword } from './testUtils';

async function loginAsFranchisee(page) {
    const franchiseEmail = getFranchiseEmail();
    const franchisePassword = getFranchisePassword();
    await registerAuthRouteMocks(page, franchiseEmail, franchisePassword, 'franchisee');
  
    const loginUrl = getHostUrl() + "/login";
    await page.goto(loginUrl);
    await performLoginAction(page, franchiseEmail, franchisePassword);
}

async function loginAndNavigateToFranchise(page, newFranchiseName) {
    await loginAsFranchisee(page);
    await registerUsersFranchises(page, newFranchiseName);
    const franchiseButtonLink = (await page.getByRole('link', { name: 'Franchise' })).nth(1);
    await franchiseButtonLink.click();
}

test('accessFranchiseTest', async ({ page }) => {
    const franchiseName = "MY FRANCHISE";
    await loginAndNavigateToFranchise(page, franchiseName);

    await expect(page.locator('body')).toContainText('MY FRANCHISE');

    const navigationStack = page.locator('ol.flex.items-center');
    await expect(navigationStack.locator('li:nth-child(1)')).toContainText('home');
    await expect(navigationStack.locator('li:nth-child(2)')).toContainText('franchise-dashboard');    
});

test('closeStoreAsFranchiseeTest', async ({ page }) => {
    const franchiseName = "MY FRANCHISE";
    await loginAndNavigateToFranchise(page, franchiseName);

    // Expected Store should appear
    const expectedStoreName = "Lehi";
    await expect(page.locator('body')).toContainText(expectedStoreName);

    const expectedStoreCloseButton = await page.locator('table > tbody > tr:nth-of-type(1) button');
    await expectedStoreCloseButton.click();

    // Cancel, return to admin dashboard
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Click Close on the store (again)
    await expectedStoreCloseButton.click();

    // Actually close it
    await registerDeleteStoreMock(page, franchiseName);
    await page.getByRole('button', { name: 'Close' }).click();

    // Store should be gone
    await expect(page.locator('body')).not.toContainText(expectedStoreName);  
});

test('createStoreAsFranchisee', async ({ page }) => {
    const franchiseName = "MY FRANCHISE";
    await loginAndNavigateToFranchise(page, franchiseName);

    // New store shouldn't be here yet
    const expectedStoreName = "JamesTown";
    await expect(page.locator('body')).not.toContainText(expectedStoreName);

    const expectedCreateStoreButton = await page.getByRole('button', {name: "Create store"});
    await expectedCreateStoreButton.click();

    // Cancel, return to admin dashboard
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Click Close on the store (again)
    await expectedCreateStoreButton.click();

    // Actually close it
    await registerCreateStoreMock(page, franchiseName, expectedStoreName);
    await page.getByPlaceholder("store name").fill(expectedStoreName);
    await page.getByRole('button', { name: 'Create' }).click();

    // Store should now be on the screen
    await expect(page.locator('body')).toContainText(expectedStoreName);  
});

test('viewProfileAsFranchisee', async ({ page }) => {
    await loginAsFranchisee(page);
    await page.goto(getHostUrl() + "/diner-dashboard");

    await expect(page.locator('body')).toContainText(getFranchiseEmail());
    await expect(page.locator('body')).toContainText('Franchisee on');

    const buyOneLink = await page.getByRole('link', {name: "Buy one"});
    await expect(buyOneLink).toBeVisible();
    await buyOneLink.click();

    await expect(page.locator('body')).toContainText('Awesome is a click away');
});

