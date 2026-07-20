import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockGetUser,
  mockUpdateUser,
  mockCreateClient,
  mockRedirect,
  mockRevalidatePath,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockUpdateUser: vi.fn(),
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

import {
  updatePassword,
  type UpdatePasswordState,
} from "@/app/auth/update-password/actions";

function buildFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    fd.append(key, value);
  }
  return fd;
}

const emptyState: UpdatePasswordState = {};

describe("updatePassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validation", () => {
    it("returns error for short password", async () => {
      const result = await updatePassword(
        emptyState,
        buildFormData({
          password: "short",
          confirmPassword: "short",
        }),
      );
      expect(result).toEqual({
        error: "Password must be at least 12 characters.",
      });
    });

    it("returns error when passwords do not match", async () => {
      const result = await updatePassword(
        emptyState,
        buildFormData({
          password: "123456789012",
          confirmPassword: "different",
        }),
      );
      expect(result).toEqual({ error: "Passwords do not match." });
    });
  });

  describe("session check", () => {
    it("returns error when user has no valid session", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: mockGetUser.mockResolvedValue({
            data: { user: null },
            error: { message: "session not found" },
          }),
        },
      });

      const result = await updatePassword(
        emptyState,
        buildFormData({
          password: "123456789012",
          confirmPassword: "123456789012",
        }),
      );
      expect(result).toEqual({
        error:
          "Your reset link has expired or is invalid. Please request a new one.",
      });
    });

    it("returns error when getUser returns an error", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: mockGetUser.mockResolvedValue({
            data: { user: null },
            error: { message: "unauthorized" },
          }),
        },
      });

      const result = await updatePassword(
        emptyState,
        buildFormData({
          password: "123456789012",
          confirmPassword: "123456789012",
        }),
      );
      expect(result.error).toContain(
        "Your reset link has expired or is invalid.",
      );
    });
  });

  describe("errors", () => {
    it("surfaces the Supabase error message on updateUser failure", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: mockGetUser.mockResolvedValue({
            data: { user: { id: "1" } },
            error: null,
          }),
          updateUser: mockUpdateUser.mockResolvedValue({
            error: {
              message:
                "New password should be different from the old password.",
            },
          }),
        },
      });

      const result = await updatePassword(
        emptyState,
        buildFormData({
          password: "123456789012",
          confirmPassword: "123456789012",
        }),
      );
      expect(result).toEqual({
        error: "New password should be different from the old password.",
      });
    });
  });

  describe("success", () => {
    it("redirects to /app on successful password update", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: mockGetUser.mockResolvedValue({
            data: { user: { id: "1" } },
            error: null,
          }),
          updateUser: mockUpdateUser.mockResolvedValue({
            error: null,
          }),
        },
      });
      mockRedirect.mockImplementation(() => {
        throw new Error("NEXT_REDIRECT");
      });

      await expect(
        updatePassword(
          emptyState,
          buildFormData({
            password: "123456789012",
            confirmPassword: "123456789012",
          }),
        ),
      ).rejects.toThrow("NEXT_REDIRECT");

      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: "123456789012",
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
      expect(mockRedirect).toHaveBeenCalledWith("/app");
    });
  });
});
