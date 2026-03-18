// @vitest-environment node
import { test, expect, vi, afterEach } from "vitest";
import { jwtVerify } from "jose";

// vi.hoisted ensures mockCookieStore is defined before vi.mock factories run
const mockCookieStore = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve(mockCookieStore),
}));

import { createSession } from "@/lib/auth";

const JWT_SECRET = new TextEncoder().encode("development-secret-key");
const COOKIE_NAME = "auth-token";

afterEach(() => {
  vi.clearAllMocks();
});

test("createSession sets a cookie named auth-token", async () => {
  await createSession("user-123", "test@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledOnce();
  const [name] = mockCookieStore.set.mock.calls[0];
  expect(name).toBe(COOKIE_NAME);
});

test("createSession stores userId and email in the JWT", async () => {
  await createSession("user-123", "test@example.com");

  const [, token] = mockCookieStore.set.mock.calls[0];
  const { payload } = await jwtVerify(token, JWT_SECRET);

  expect(payload.userId).toBe("user-123");
  expect(payload.email).toBe("test@example.com");
});

test("createSession sets httpOnly, sameSite, and path cookie attributes", async () => {
  await createSession("user-123", "test@example.com");

  const [, , options] = mockCookieStore.set.mock.calls[0];
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
});

test("createSession sets secure=false outside production", async () => {
  const original = process.env.NODE_ENV;
  // NODE_ENV is 'test' in vitest
  await createSession("user-123", "test@example.com");

  const [, , options] = mockCookieStore.set.mock.calls[0];
  expect(options.secure).toBe(false);
  process.env.NODE_ENV = original;
});

test("createSession sets an expiry ~7 days in the future", async () => {
  const before = Date.now();
  await createSession("user-123", "test@example.com");
  const after = Date.now();

  const [, , options] = mockCookieStore.set.mock.calls[0];
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  expect(options.expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(options.expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
});

test("createSession JWT expires in 7 days", async () => {
  const before = Date.now();
  await createSession("user-123", "test@example.com");

  const [, token] = mockCookieStore.set.mock.calls[0];
  const { payload } = await jwtVerify(token, JWT_SECRET);

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  expect(payload.exp! * 1000).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(payload.exp! * 1000).toBeLessThanOrEqual(Date.now() + sevenDaysMs + 1000);
});

test("createSession JWT is signed with HS256", async () => {
  await createSession("user-123", "test@example.com");

  const [, token] = mockCookieStore.set.mock.calls[0];
  const header = JSON.parse(atob(token.split(".")[0]));
  expect(header.alg).toBe("HS256");
});
