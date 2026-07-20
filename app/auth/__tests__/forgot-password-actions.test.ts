import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockResetPasswordForEmail, mockCreateClient, mockHeadersGet } =
  vi.hoisted(() => ({
    mockResetPasswordForEmail: vi.fn(),
    mockCreateClient: vi.fn(),
    mockHeadersGet: vi.fn(),
  }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: mockHeadersGet,
  }),
}));

import {
  forgotPassword,
  type ForgotPasswordState,
} from "@/app/auth/forgot-password/actions";

function buildFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    fd.append(key, value);
  }
  return fd;
}

const emptyState: ForgotPasswordState = {};

describe("forgotPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validation", () => {
    it("returns error for empty email", async () => {
      const result = await forgotPassword(
        emptyState,
        buildFormData({ email: "" }),
      );
      expect(result).toEqual({
        error: "Please enter a valid email address.",
      });
    });

    it("returns error for email without @", async () => {
      const result = await forgotPassword(
        emptyState,
        buildFormData({ email: "notanemail" }),
      );
      expect(result).toEqual({
        error: "Please enter a valid email address.",
      });
    });
  });

  describe("success", () => {
    it("constructs absolute redirectTo from request headers and calls Supabase", async () => {
      mockHeadersGet.mockImplementation((header: string) => {
        if (header === "host") return "example.com";
        if (header === "x-forwarded-proto") return "https";
        return null;
      });
      mockCreateClient.mockResolvedValue({
        auth: {
          resetPasswordForEmail:
            mockResetPasswordForEmail.mockResolvedValue({
              error: null,
            }),
        },
      });

      const result = await forgotPassword(
        emptyState,
        buildFormData({ email: "test@example.com" }),
      );

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        "test@example.com",
        {
          redirectTo: "https://example.com/auth/update-password",
        },
      );
      expect(result).toEqual({ sent: true });
    });

    it("defaults to http when x-forwarded-proto is missing", async () => {
      mockHeadersGet.mockImplementation((header: string) => {
        if (header === "host") return "localhost:3000";
        return null;
      });
      mockCreateClient.mockResolvedValue({
        auth: {
          resetPasswordForEmail:
            mockResetPasswordForEmail.mockResolvedValue({
              error: null,
            }),
        },
      });

      await forgotPassword(
        emptyState,
        buildFormData({ email: "test@example.com" }),
      );

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        "test@example.com",
        {
          redirectTo: "http://localhost:3000/auth/update-password",
        },
      );
    });
  });

  describe("errors", () => {
    it("returns error when Supabase call fails", async () => {
      mockHeadersGet.mockReturnValue("example.com");
      mockCreateClient.mockResolvedValue({
        auth: {
          resetPasswordForEmail:
            mockResetPasswordForEmail.mockResolvedValue({
              error: { message: "Rate limit exceeded" },
            }),
        },
      });

      const result = await forgotPassword(
        emptyState,
        buildFormData({ email: "test@example.com" }),
      );
      expect(result).toEqual({
        error: "We couldn't send the reset email. Please try again.",
      });
    });
  });
});
