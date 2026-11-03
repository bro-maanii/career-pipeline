import test from "node:test";
import assert from "node:assert/strict";
import {
  isSameOriginJsonRequest,
  isPublicAuthPath,
  signupValidation,
  emailCallbackPath,
} from "../src/lib/auth";
test("only the explicit authentication routes are public", () => {
  for (const path of ["/login", "/signup", "/auth/callback", "/auth/confirm"])
    assert.equal(isPublicAuthPath(path), true);
  for (const path of [
    "/",
    "/applications",
    "/contacts",
    "/templates",
    "/interviews",
    "/activity",
    "/funnel",
    "/api/import",
    "/auth/admin",
    "/signup/private",
  ])
    assert.equal(isPublicAuthPath(path), false);
});
test("signup rejects short passwords and mismatched confirmation", () => {
  assert.match(signupValidation("short", "short")!, /8 characters/);
  assert.match(
    signupValidation("long-password", "different-password")!,
    /do not match/,
  );
  assert.equal(signupValidation("a-valid-password", "a-valid-password"), null);
});
test("email confirmations landing on the Site URL keep their code on a public route", () => {
  assert.equal(
    emailCallbackPath(new URL("https://app.example/?code=one-time-code")),
    "/auth/callback?code=one-time-code",
  );
  assert.equal(
    emailCallbackPath(new URL("https://app.example/?error=access_denied")),
    "/login?notice=confirmation-failed",
  );
  assert.equal(emailCallbackPath(new URL("https://app.example/")), null);
  assert.equal(
    emailCallbackPath(
      new URL("https://app.example/applications?code=unrelated"),
    ),
    null,
  );
});
test("confirmation redirects do not accept an external next destination", () => {
  assert.equal(
    emailCallbackPath(
      new URL("https://app.example/?code=abc&next=https://other.example"),
    ),
    "/auth/callback?code=abc",
  );
  assert.equal(
    emailCallbackPath(
      new URL(
        "https://app.example/?code=abc%26next%3Dhttps%3A%2F%2Fother.example",
      ),
    ),
    "/auth/callback?code=abc%26next%3Dhttps%3A%2F%2Fother.example",
  );
});
test("cookie-authenticated imports reject foreign origins and form submissions", () => {
  const request = (origin: string | null, type: string) => ({
    headers: new Headers({
      "content-type": type,
      ...(origin ? { origin } : {}),
    }),
  });
  assert.equal(
    isSameOriginJsonRequest(
      request("https://app.example", "application/json; charset=utf-8"),
      "https://app.example",
    ),
    true,
  );
  assert.equal(
    isSameOriginJsonRequest(
      request(null, "application/json"),
      "https://app.example",
    ),
    true,
  );
  assert.equal(
    isSameOriginJsonRequest(
      request("https://other.example", "application/json"),
      "https://app.example",
    ),
    false,
  );
  assert.equal(
    isSameOriginJsonRequest(
      request("https://app.example", "text/plain"),
      "https://app.example",
    ),
    false,
  );
  assert.equal(
    isSameOriginJsonRequest(
      request("null", "application/json"),
      "https://app.example",
    ),
    false,
  );
});
