import { test } from "node:test";
import assert from "node:assert/strict";

import {
  GENERIC_REGISTRATION_ERROR,
  MIN_PASSWORD_LENGTH,
  isValidPassword,
  normaliseDisplayName,
  normaliseEmail,
  normaliseUsername,
} from "../src/server/auth-policy";

test("normalises email and username at the auth boundary", () => {
  assert.equal(normaliseEmail("  USER@Example.COM "), "user@example.com");
  assert.equal(normaliseUsername("  focused-user  "), "focused-user");
});

test("keeps a meaningful registration name and stores blank names as null", () => {
  assert.equal(normaliseDisplayName("  Иван Иванов  "), "Иван Иванов");
  assert.equal(normaliseDisplayName("   "), null);
  assert.equal(normaliseDisplayName(undefined), null);
});

test("uses one eight-character password policy", () => {
  assert.equal(MIN_PASSWORD_LENGTH, 8);
  assert.equal(isValidPassword("1234567"), false);
  assert.equal(isValidPassword("12345678"), true);
  assert.equal(isValidPassword("a".repeat(257)), false);
});

test("uses a generic registration conflict message", () => {
  assert.match(GENERIC_REGISTRATION_ERROR, /Не удалось создать аккаунт/);
  assert.doesNotMatch(GENERIC_REGISTRATION_ERROR, /email|username/i);
});
