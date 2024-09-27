import { randomUUID } from 'crypto';
import { expect } from 'playwright-test-coverage';

export function getRandomEmail() {
    return "d@jwt" + randomUUID() + ".com";
}

export function getHostUrl() {
    return "http://localhost:5173";
}

export function getAdminEmail() {
    return "a@jwt.com";
}

export function getAdminPassword() {
    return "admin";
}

export function getFranchiseEmail() {
    return "f@jwt.com";
}

export function getFranchisePassword() {
    return "franchisee";
}

export async function performLoginAction(page, email, password) {
    await page.getByPlaceholder('Email address').click();
    await page.getByPlaceholder('Email address').fill(email);
    await page.getByPlaceholder('Email address').press('Tab');
    await page.getByPlaceholder('Password').fill(password);
    await page.getByRole('button', { name: 'Login' }).click();
}

export async function registerAuthRouteMocks(page, email, password, role='diner') {
    await page.route('*/**/api/auth', async (route) => {
        // Register
        if (route.request().method() == 'PUT') {
        const loginReq = { email: email, password: password };
        const loginRes = { user: { id: 3, name: 'Kai Chen', email: email, roles: [{ role: role }] }, token: 'abcdef' };
        expect(route.request().method()).toBe('PUT');
        expect(route.request().postDataJSON()).toMatchObject(loginReq);
        await route.fulfill({ json: loginRes });
        // Logout
        } else if (route.request().method() == 'DELETE') {
        const logoutRes = { message: "Success Message" };
        await route.fulfill({ json: logoutRes });
    }
});
}

export async function registerMenuRouteMocks(page) {
    await page.route('*/**/api/order/menu', async (route) => {
        const menuRes = [
        { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
        { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
        ];
        expect(route.request().method()).toBe('GET');
        await route.fulfill({ json: menuRes });
    });
}

export async function registerFranchiseRouteMocks(page) {
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
}

export async function registerOrderRouteMocks(page) {
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
}