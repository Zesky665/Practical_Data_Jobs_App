import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockSignInWithPassword,
  mockSignOut,
  mockCreateClient,
  mockRedirect,
  mockRevalidatePath,
} = vi.hoisted(() => ({
  mockSignInWithPassword: vi.fn(),
  mockSignOut: vi.fn(),
  mockCreateClient: vi.fn(),
  mockRedirect: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

import { signIn, signOut, type SignInState } from "@/app/auth/login/actions";

function buildFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    fd.append(key, value);
  }
  return fd;
}

const emptyState: SignInState = {};

describe("signIn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validation", () => {
    it("returns error when email is empty", async () => {
      const result = await signIn(
        emptyState,
        buildFormData({ email: "", password: "password" }),
      );
      expect(result).toEqual({
        error: "Email and password are required.",
      });
    });

    it("returns error when password is empty", async () => {
      const result = await signIn(
        emptyState,
        buildFormData({ email: "test@example.com", password: "" }),
      );
      expect(result).toEqual({
        error: "Email and password are required.",
      });
    });
  });

  describe("success", () => {
    it("redirects to /app by default on success", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          signInWithPassword: mockSignInWithPassword.mockResolvedValue({
            error: null,
          }),
        },
      });
      mockRedirect.mockImplementation(() => {
        throw new Error("NEXT_REDIRECT");
      });

      await expect(
        signIn(
          emptyState,
          buildFormData({
            email: "test@example.com",
            password: "password",
          }),
        ),
      ).rejects.toThrow("NEXT_REDIRECT");

      expect(mockRedirect).toHaveBeenCalledWith("/app");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
    });

    it("redirects to a relative next path when provided", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          signInWithPassword: mockSignInWithPassword.mockResolvedValue({
            error: null,
          }),
        },
      });
      mockRedirect.mockImplementation(() => {
        throw new Error("NEXT_REDIRECT");
      });

      await expect(
        signIn(
          emptyState,
          buildFormData({
            email: "test@example.com",
            password: "password",
            next: "/app/settings",
          }),
        ),
      ).rejects.toThrow("NEXT_REDIRECT");

      expect(mockRedirect).toHaveBeenCalledWith("/app/settings");
    });

    it("falls back to /app when next is not a relative path", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          signInWithPassword: mockSignInWithPassword.mockResolvedValue({
            error: null,
          }),
        },
      });
      mockRedirect.mockImplementation(() => {
        throw new Error("NEXT_REDIRECT");
      });

      await expect(
        signIn(
          emptyState,
          buildFormData({
            email: "test@example.com",
            password: "password",
            next: "https://evil.com",
          }),
        ),
      ).rejects.toThrow("NEXT_REDIRECT");

      expect(mockRedirect).toHaveBeenCalledWith("/app");
    });
  });

  describe("errors", () => {
    it("returns a generic error message on auth failure", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          signInWithPassword: mockSignInWithPassword.mockResolvedValue({
            error: { message: "Invalid credentials" },
          }),
        },
      });

      const result = await signIn(
        emptyState,
        buildFormData({
          email: "test@example.com",
          password: "password",
        }),
      );
      expect(result).toEqual({ error: "Invalid email or password." });
    });
  });
});

describe("signOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("signs out and redirects to /", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        signOut: mockSignOut.mockResolvedValue({ error: null }),
      },
    });
    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(signOut()).rejects.toThrow("NEXT_REDIRECT");

    expect(mockSignOut).toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });
});
