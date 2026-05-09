import { expect, test } from "@playwright/test";

const demoEmail = process.env.E2E_DEMO_EMAIL;
const demoPassword = process.env.E2E_DEMO_PASSWORD;

test("login page is reachable", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: /Connexion a la plateforme/i })).toBeVisible();
  await expect(page.getByLabel(/Adresse e-mail/i)).toBeVisible();
  await expect(page.getByLabel(/Mot de passe/i)).toBeVisible();
});

test("health endpoint responds with JSON", async ({ request }) => {
  const response = await request.get("/api/health");
  const body = await response.json();

  expect([200, 503]).toContain(response.status());
  expect(body.service).toBe("gestion-stagiaires");
});

test.describe("credential smoke", () => {
  test.skip(!demoEmail || !demoPassword, "Requires demo credentials for full authentication smoke test");

  test("demo user can submit the login form", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel(/Adresse e-mail/i).fill(demoEmail!);
    await page.getByLabel(/Mot de passe/i).fill(demoPassword!);
    await page.getByRole("button", { name: /Se connecter/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });
});
