import { describe, it, expect, vi } from "vitest";

const { mockRedirect } = vi.hoisted(() => ({
  mockRedirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

import { failTo } from "@/lib/action-errors";

describe("failTo", () => {
  it("redirects to the given path with an encoded error message", () => {
    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    expect(() => failTo("/login", "Something went wrong")).toThrow(
      "NEXT_REDIRECT",
    );

    expect(mockRedirect).toHaveBeenCalledWith(
      "/login?error=Something%20went%20wrong",
    );
  });

  it("encodes special characters in the error message", () => {
    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    expect(() => failTo("/login", "Invalid email & password?")).toThrow(
      "NEXT_REDIRECT",
    );

    expect(mockRedirect).toHaveBeenCalledWith(
      "/login?error=Invalid%20email%20%26%20password%3F",
    );
  });

  it("handles empty message", () => {
    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    expect(() => failTo("/app", "")).toThrow("NEXT_REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/app?error=");
  });
});
