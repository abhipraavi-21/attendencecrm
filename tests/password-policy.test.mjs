import test from "node:test";
import assert from "node:assert/strict";
import { isStrongPassword } from "../src/lib/password-policy.js";

test("password policy requires length and mixed character classes", () => {
  assert.equal(isStrongPassword("short"), false);
  assert.equal(isStrongPassword("alllowercase123!"), false);
  assert.equal(isStrongPassword("NoNumberSymbol"), false);
  assert.equal(isStrongPassword("StrongLocal!2026"), true);
});
