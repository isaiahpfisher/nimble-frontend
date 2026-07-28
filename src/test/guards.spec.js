// The route guards decide *whether* a page is reachable, which the render
// smoke tests deliberately skip. They are plain functions, so test them directly.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fixtureFor, CURRENT_USER, PROJECT } from "./fixtures.js";

vi.mock("../services/services.js", () => ({
  default: {
    get: vi.fn((url) => Promise.resolve({ data: fixtureFor("get", url) })),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { isAdmin, isLoggedIn, isLoggedOut, resolveHome } from "../router/guards.js";

function signIn(user = CURRENT_USER) {
  localStorage.setItem("user", JSON.stringify(user));
}

beforeEach(() => {
  localStorage.clear();
});

describe("isLoggedIn", () => {
  it("allows a signed-in user through", () => {
    signIn();
    expect(isLoggedIn()).toBe(true);
  });

  it("redirects a signed-out user to login", () => {
    expect(isLoggedIn()).toEqual({ name: "login" });
  });
});

describe("isLoggedOut", () => {
  it("allows a signed-out user through", () => {
    expect(isLoggedOut()).toBe(true);
  });

  it("redirects a signed-in user home", () => {
    signIn();
    expect(isLoggedOut()).toEqual({ name: "home" });
  });
});

describe("isAdmin", () => {
  it("allows an admin through", () => {
    signIn({ ...CURRENT_USER, isAdmin: true });
    expect(isAdmin()).toBe(true);
  });

  it("redirects a non-admin home", () => {
    signIn({ ...CURRENT_USER, isAdmin: false });
    expect(isAdmin()).toEqual({ name: "home" });
  });

  it("redirects a signed-out user to login", () => {
    expect(isAdmin()).toEqual({ name: "login" });
  });
});

describe("resolveHome", () => {
  it("redirects a signed-out user to login", async () => {
    await expect(resolveHome()).resolves.toEqual({ name: "login" });
  });

  it("opens the user's first project when none is remembered", async () => {
    signIn();
    await expect(resolveHome()).resolves.toEqual({
      name: "projectBoard",
      params: { id: PROJECT.id },
    });
  });

  it("opens the remembered project when it is still available", async () => {
    signIn();
    localStorage.setItem("selectedProjectId", String(PROJECT.id));
    await expect(resolveHome()).resolves.toEqual({
      name: "projectBoard",
      params: { id: PROJECT.id },
    });
  });
});
