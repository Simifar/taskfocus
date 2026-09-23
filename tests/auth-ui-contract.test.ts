import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import assert from "node:assert/strict";

function source(relativePath: string) {
  const url = new URL(`../${relativePath}`, import.meta.url);
  return {
    exists: existsSync(fileURLToPath(url)),
    text: existsSync(fileURLToPath(url)) ? readFileSync(url, "utf8") : "",
  };
}

test("authentication has separate login and registration routes", () => {
  const loginPage = source("src/app/login/page.tsx");
  const registerPage = source("src/app/register/page.tsx");

  assert.equal(loginPage.exists, true);
  assert.equal(registerPage.exists, true);
  assert.match(loginPage.text, /mode="login"/);
  assert.match(registerPage.text, /mode="register"/);
  assert.match(loginPage.text, /GOOGLE_CLIENT_ID/);
  assert.match(registerPage.text, /GOOGLE_CLIENT_SECRET/);
});

test("auth page uses the shared shell instead of tabs", () => {
  const authPage = source("src/features/auth/components/auth-page.tsx");
  const authShell = source("src/features/auth/components/auth-shell.tsx");

  assert.equal(authShell.exists, true);
  assert.match(authPage.text, /AuthShell/);
  assert.doesNotMatch(authPage.text, /@\/shared\/ui\/tabs/);
  assert.doesNotMatch(authPage.text, /activeTab/);
  assert.match(authShell.text, /googleEnabled &&/);
  assert.match(authShell.text, /"\/register"/);
  assert.match(authShell.text, /"\/login"/);
});

test("auth forms expose mobile and password accessibility behavior", () => {
  const authPage = source("src/features/auth/components/auth-page.tsx");

  assert.match(authPage.text, /autoComplete="email"/);
  assert.match(authPage.text, /"current-password"/);
  assert.match(authPage.text, /"new-password"/);
  assert.match(authPage.text, /type="button"/);
  assert.match(authPage.text, /Показать пароль/);
  assert.match(authPage.text, /Скрыть пароль/);
  assert.match(authPage.text, /role="alert"/);
});
