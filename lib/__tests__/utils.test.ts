import { describe, it, expect, beforeEach, vi } from "vitest";

describe("hasEnvVars", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns true when both Supabase env vars are set", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "pk_test_123";

    const { hasEnvVars } = await import("@/lib/utils");
    expect(hasEnvVars).toBeTruthy();
  });

  it("returns false when URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "pk_test_123";

    const { hasEnvVars } = await import("@/lib/utils");
    expect(hasEnvVars).toBeFalsy();
  });

  it("returns false when publishable key is missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const { hasEnvVars } = await import("@/lib/utils");
    expect(hasEnvVars).toBeFalsy();
  });

  it("returns false when both env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const { hasEnvVars } = await import("@/lib/utils");
    expect(hasEnvVars).toBeFalsy();
  });
});
