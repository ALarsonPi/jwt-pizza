import { randomUUID } from 'crypto';
import { test, expect } from 'playwright-test-coverage';
import { getHostUrl, registerMenuRouteMocks, registerFranchiseRouteMocks, getRandomEmail, registerAuthRouteMocks, registerOrderRouteMocks, performLoginAction, getAdminEmail, getAdminPassword, getFranchiseEmail, getFranchisePassword } from './testUtils';

test('home page', async ({ page }) => {
  await page.goto('/');
  expect(await page.title()).toBe('JWT Pizza');
});

test('purchase with login', async ({ page }) => {
  await registerMenuRouteMocks(page);
  await registerFranchiseRouteMocks(page);
  const randomEmailForTest = getRandomEmail();
  const randomPasswordForTest = randomUUID();
  await registerAuthRouteMocks(page, randomEmailForTest, randomPasswordForTest);
  await registerOrderRouteMocks(page);

  // Go to order page
  await page.goto(getHostUrl());
  await page.getByRole('button', { name: 'Order now' }).click();

  // Create order
  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();

  // Login
  await performLoginAction(page, randomEmailForTest, randomPasswordForTest);

  // Pay
  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
  await expect(page.locator('tbody')).toContainText('Veggie');
  await expect(page.locator('tbody')).toContainText('Pepperoni');
  await expect(page.locator('tfoot')).toContainText('0.008 ₿');
  await page.getByRole('button', { name: 'Pay now' }).click();

  // Check balance
  await expect(page.getByText('0.008')).toBeVisible();
});

test('notFoundUrlTest', async ({ page }) => {
  const nonExistantPageRoute = getHostUrl() + '/pageRouteThatDoesNotExist'; + 
  await page.goto(nonExistantPageRoute);

  // Heading Text should say 'Oops'
  await expect(page.getByRole('heading', { name: 'Oops' })).toBeVisible();

  // Page should also include this explanation
  const errorMessage = page.getByText('It looks like we have dropped a pizza on the floor. Please try another page.');
  await expect(errorMessage).toBeVisible();
});

test('registerLoginTest', async ({ page }) => {
  const loginUrl = getHostUrl() + "/login";
  await page.goto(loginUrl);

  const randomEmailForTest = getRandomEmail();
  const randomPasswordForTest = randomUUID();
  await performLoginAction(page, randomEmailForTest, randomPasswordForTest);

  // Expect 404 not found error
  await expect(page.getByText(/404/)).toBeVisible();

  // Create new User
  await registerAuthRouteMocks(page, randomEmailForTest, randomPasswordForTest);

  // Return to Login Screen and successfully login
  await page.goto(loginUrl);
  await performLoginAction(page, randomEmailForTest, randomPasswordForTest);
});

test('logoutTest', async ({ page }) => {
  const randomEmailForTest = getRandomEmail();
  const randomPasswordForTest = getRandomEmail();
  const loginUrl = getHostUrl() + "/login";

  // Create new User and Login
  await registerAuthRouteMocks(page, randomEmailForTest, randomPasswordForTest);
  await page.goto(loginUrl);
  await performLoginAction(page, randomEmailForTest, randomPasswordForTest);

  // Logout
  await page.getByRole('link', { name: 'Logout' }).click();

  // Expect home page title text
  await page.goto(getHostUrl());
  expect(await page.title()).toBe('JWT Pizza');

  // Expect Login Button and Register Buttons to be visible
  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
});

test('historyTest', async ({ page }) => {
  const historyUrl = getHostUrl() + "/history";
  await page.goto(historyUrl);
  await expect(page.locator('body')).toContainText('Mama Rucci, my my');

  // Find the navigation helper that has home -> history, ensure it's correct
  const navigationStack = page.locator('ol.flex.items-center');
  await expect(navigationStack.locator('li:nth-child(1)')).toContainText('home');
  await expect(navigationStack.locator('li:nth-child(2)')).toContainText('history');
});

test('aboutTest', async ({ page }) => {
  const aboutUrl = getHostUrl() + "/about";
  await page.goto(aboutUrl);
  await expect(page.locator('body')).toContainText('The secret sauce');

  // Find the navigation helper that has home -> history, ensure it's correct
  const navigationStack = page.locator('ol.flex.items-center');
  await expect(navigationStack.locator('li:nth-child(1)')).toContainText('home');
  await expect(navigationStack.locator('li:nth-child(2)')).toContainText('about');

  // Ensure all team members are displayed
  const numTeamMembers = 4;
  const allTeamImages = await page.$$('img.rounded-full');
  expect(allTeamImages.length).toBe(numTeamMembers);
});

test('docsTest', async ({ page }) => {
  const docsUrl = getHostUrl() + "/docs";
  await page.goto(docsUrl);

  // Find the navigation helper that has home -> docs, ensure it's correct
  const navigationStack = page.locator('ol.flex.items-center');
  await expect(navigationStack.locator('li:nth-child(1)')).toContainText('home');
  await expect(navigationStack.locator('li:nth-child(2)')).toContainText('docs');

  // Page is up and running and devs can see the APIs
  await expect(page.locator('body')).toContainText('JWT Pizza API');
});

test('registerNewUserTest', async ({ page }) => {
  const registerUrl = getHostUrl() + "/register";
  await page.goto(registerUrl);

  const fullName = "James Madison " + randomUUID();
  await page.getByPlaceholder('Full name').fill(fullName);

  const randomEmailForTest = getRandomEmail();
  await page.getByPlaceholder('Email address').fill(randomEmailForTest);

  const randomPassword = randomUUID();
  await page.getByPlaceholder('Password').fill(randomPassword);
  await page.getByRole('button', { name: 'Register' }).click();
});


