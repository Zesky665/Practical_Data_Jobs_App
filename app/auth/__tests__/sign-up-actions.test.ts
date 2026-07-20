import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted mocks — must use vi.hoisted() so the factory references are
// available by the time vitest hoists the vi.mock() calls.
const { mockSignUp, mockCreateClient, mockRedirect, mockRevalidatePath } =
  vi.hoisted(() => ({
    mockSignUp: vi.fn(),
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

import { signUp, type SignUpState } from "@/app/auth/sign-up/actions";

function buildFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    fd.append(key, value);
  }
  return fd;
}

const emptyState: SignUpState = {};

describe("signUp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validation", () => {
    it("returns error for empty email", async () => {
      const result = await signUp(
        emptyState,
        buildFormData({
          email: "",
          password: "123456789012",
          confirmPassword: "123456789012",
        }),
      );
      expect(result).toEqual({
        error: "Please enter a valid email address.",
      });
    });

    it("returns error for email without @", async () => {
      const result = await signUp(
        emptyState,
        buildFormData({
          email: "notanemail",
          password: "123456789012",
          confirmPassword: "123456789012",
        }),
      );
      expect(result).toEqual({
        error: "Please enter a valid email address.",
      });
    });

    it("returns error for short password", async () => {
      const result = await signUp(
        emptyState,
        buildFormData({
          email: "test@example.com",
          password: "short",
          confirmPassword: "short",
        }),
      );
      expect(result).toEqual({
        error: "Password must be at least 12 characters.",
      });
    });

    it("returns error when passwords do not match", async () => {
      const result = await signUp(
        emptyState,
        buildFormData({
          email: "test@example.com",
          password: "123456789012",
          confirmPassword: "different",
        }),
      );
      expect(result).toEqual({ error: "Passwords do not match." });
    });
  });

  describe("success", () => {
    it("redirects to /app when session is returned (email confirmation off)", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          signUp: mockSignUp.mockResolvedValue({
            data: {
              session: { access_token: "abc" },
              user: { id: "1" },
            },
            error: null,
          }),
        },
      });
      mockRedirect.mockImplementation(() => {
        throw new Error("NEXT_REDIRECT");
      });

      await expect(
        signUp(
          emptyState,
          buildFormData({
            email: "test@example.com",
            password: "123456789012",
            confirmPassword: "123456789012",
          }),
        ),
      ).rejects.toThrow("NEXT_REDIRECT");

      expect(mockRedirect).toHaveBeenCalledWith("/app");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
    });

    it("returns email when no session is returned (email confirmation on)", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          signUp: mockSignUp.mockResolvedValue({
            data: { session: null, user: { id: "1" } },
            error: null,
          }),
        },
      });

      const result = await signUp(
        emptyState,
        buildFormData({
          email: "test@example.com",
          password: "123456789012",
          confirmPassword: "123456789012",
        }),
      );
      expect(result).toEqual({ email: "test@example.com" });
    });
  });

  describe("errors", () => {
    it("maps status 500 to a user-friendly message", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          signUp: mockSignUp.mockResolvedValue({
            data: {},
            error: { message: "{}", status: 500 },
          }),
        },
      });

      const result = await signUp(
        emptyState,
        buildFormData({
          email: "test@example.com",
          password: "123456789012",
          confirmPassword: "123456789012",
        }),
      );
      expect(result.error).toContain("We couldn't complete sign-up.");
    });

    it("maps empty message to a user-friendly message", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          signUp: mockSignUp.mockResolvedValue({
            data: {},
            error: { message: "", status: 400 },
          }),
        },
      });

      const result = await signUp(
        emptyState,
        buildFormData({
          email: "test@example.com",
          password: "123456789012",
          confirmPassword: "123456789012",
        }),
      );
      expect(result.error).toContain("We couldn't complete sign-up.");
    });

    it("passes through the Supabase error message when not 500 or empty", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          signUp: mockSignUp.mockResolvedValue({
            data: {},
            error: { message: "User already registered", status: 400 },
          }),
        },
      });

      const result = await signUp(
        emptyState,
        buildFormData({
          email: "test@example.com",
          password: "123456789012",
          confirmPassword: "123456789012",
        }),
      );
      expect(result).toEqual({ error: "User already registered" });
    });
  });
});
