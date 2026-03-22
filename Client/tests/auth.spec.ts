import { test, expect, type Page } from '@playwright/test';

/**
 * Full-stack e2e: requires Spring API at http://localhost:8080 (see Client/src/config/env.js)
 * and Postgres (or your configured datasource). Start the server before running, or reuse
 * an already-running instance; the Playwright config only starts the React dev server.
 * Run with: npx playwright test tests/auth.spec.ts
 */

type SignupRole = 'MENTEE' | 'MENTOR';

async function signUpAndLogIn(
  page: Page,
  opts: { username: string; email: string; password: string; role: SignupRole }
) {
  await page.goto('/');

  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('button', { name: 'Sign up' }).click();

  await page.locator('#signup-username').fill(opts.username);
  await page.locator('#signup-email').fill(opts.email);
  await page.locator('#signup-role').selectOption(opts.role);
  await page.locator('#signup-password').fill(opts.password);
  await page.locator('#confirmPassword').fill(opts.password);

  const signupResponsePromise = page.waitForResponse(
    (res) =>
      res.url().includes('/auth/signup') && res.request().method() === 'POST'
  );

  await page.getByRole('button', { name: 'Create Account' }).click();
  const signupRes = await signupResponsePromise;
  expect(signupRes.ok(), 'signup API should succeed').toBeTruthy();

  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible({
    timeout: 15_000,
  });

  const loginResponsePromise = page.waitForResponse(
    (res) =>
      res.url().includes('/auth/login') && res.request().method() === 'POST'
  );

  await page.locator('#username').fill(opts.username);
  await page.locator('#password').fill(opts.password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  const loginRes = await loginResponsePromise;
  expect(loginRes.ok(), 'login API should succeed').toBeTruthy();
}

function uniqueUsername(role: SignupRole): string {
  const tag = role === 'MENTOR' ? 'm' : 'e';
  const raw = `t${Date.now().toString(36)}${test.info().parallelIndex}${tag}`;
  return raw.slice(0, 20);
}

test.describe('signup and login', () => {
  test('mentee registers and signs in', async ({ page }) => {
    const username = uniqueUsername('MENTEE');
    const email = `${username}@e2e.test`;
    const password = 'E2ePass1!';

    await signUpAndLogIn(page, { username, email, password, role: 'MENTEE' });

    await expect(page.getByRole('heading', { name: /Mentee Learning Hub/ })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(new RegExp(`Welcome back, ${username}`))).toBeVisible();
  });

  test('mentor registers and signs in', async ({ page }) => {
    const username = uniqueUsername('MENTOR');
    const email = `${username}@e2e.test`;
    const password = 'E2ePass1!';

    await signUpAndLogIn(page, { username, email, password, role: 'MENTOR' });

    await expect(page.getByRole('heading', { name: 'Mentor Dashboard' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(new RegExp(`Welcome back, ${username}`))).toBeVisible();
  });
});
