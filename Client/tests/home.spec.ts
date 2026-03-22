import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/PeerNest Mentoring Platform/);
});

test('get started shows login', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get Started' }).click();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});

test('login button shows login', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});

test('sign up from login shows create account', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
});

