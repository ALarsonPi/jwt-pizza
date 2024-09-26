import { randomUUID } from 'crypto';
import { test, expect } from 'playwright-test-coverage';

async function createLoginMock(page, email) {
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill(email);
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();
}

async function createAuthRouteMock(page, email) {
  await page.route('*/**/api/auth', async (route) => {
    // Register
    if (route.request().method() == 'PUT') {
      const loginReq = { email: email, password: 'a' };
      const loginRes = { user: { id: 3, name: 'Kai Chen', email: email, roles: [{ role: 'diner' }] }, token: 'abcdef' };
      expect(route.request().method()).toBe('PUT');
      expect(route.request().postDataJSON()).toMatchObject(loginReq);
      await route.fulfill({ json: loginRes });
    // Logout
    } else {
      await route.fulfill({ json: {} });
    }
  });
}

test('home page', async ({ page }) => {
  await page.goto('/');
  expect(await page.title()).toBe('JWT Pizza');
});

test('purchase with login', async ({ page }) => {
  await page.route('*/**/api/order/menu', async (route) => {
    const menuRes = [
      { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
      { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });

  await page.route('*/**/api/franchise', async (route) => {
    const franchiseRes = [
      {
        id: 2,
        name: 'LotaPizza',
        stores: [
          { id: 4, name: 'Lehi' },
          { id: 5, name: 'Springville' },
          { id: 6, name: 'American Fork' },
        ],
      },
      { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
      { id: 4, name: 'topSpot', stores: [] },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: franchiseRes });
  });

  const randomEmailForTest = "d@jwt" + randomUUID() + ".com";
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: randomEmailForTest, password: 'a' };
    const loginRes = { user: { id: 3, name: 'Kai Chen', email: randomEmailForTest, roles: [{ role: 'diner' }] }, token: 'abcdef' };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route('*/**/api/order', async (route) => {
    const orderReq = {
      items: [
        { menuId: 1, description: 'Veggie', price: 0.0038 },
        { menuId: 2, description: 'Pepperoni', price: 0.0042 },
      ],
      storeId: '4',
      franchiseId: 2,
    };
    const orderRes = {
      order: {
        items: [
          { menuId: 1, description: 'Veggie', price: 0.0038 },
          { menuId: 2, description: 'Pepperoni', price: 0.0042 },
        ],
        storeId: '4',
        franchiseId: 2,
        id: 23,
      },
      jwt: 'eyJpYXQ',
    };
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toMatchObject(orderReq);
    await route.fulfill({ json: orderRes });
  });

  await page.goto('http://localhost:5173/');

  // Go to order page
  await page.getByRole('button', { name: 'Order now' }).click();

  // Create order
  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();

  // Login
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill(randomEmailForTest);
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

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
  const nonExistantPageRoute = 'pageRouteThatDoesNotExist';
  await page.goto(`http://localhost:5173/${nonExistantPageRoute}`);

  // Heading Text should say 'Oops'
  await expect(page.getByRole('heading', { name: 'Oops' })).toBeVisible();

  // Page should also include this explanation
  const errorMessage = page.getByText('It looks like we have dropped a pizza on the floor. Please try another page.');
  await expect(errorMessage).toBeVisible();
});

test('registerLoginTest', async ({ page }) => {
  await page.goto(`http://localhost:5173/login`);

  const randomEmailForTest = "d@jwt" + randomUUID() + ".com";
  await createLoginMock(page, randomEmailForTest);

  // Expect 404 not found error
  await expect(page.getByText(/404/)).toBeVisible();

  // Create new User
  await createAuthRouteMock(page, randomEmailForTest);

  // Return to Login Screen and successfully login
  await page.goto(`http://localhost:5173/login`);
  await createLoginMock(page, randomEmailForTest);
});

test('logoutTest', async ({ page }) => {
  const randomEmailForTest = "d@jwt" + randomUUID() + ".com";

  // Create new User and Login
  await createAuthRouteMock(page, randomEmailForTest);
  await page.goto(`http://localhost:5173/login`);
  await createLoginMock(page, randomEmailForTest);

  // Logout
  await page.getByRole('link', { name: 'Logout' }).click();

  // Expect home page title text
  await page.goto(`http://localhost:5173`);
  expect(await page.title()).toBe('JWT Pizza');

  // Expect Login Button and Register Buttons to be visible
  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
});


