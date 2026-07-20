import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { AuthButton } from "@/components/auth-button";

// Mock the signOut server action
vi.mock("@/app/auth/login/actions", () => ({
  signOut: vi.fn(),
}));

describe("AuthButton", () => {
  it("renders a Sign out button with the user email in the title", () => {
    const html = renderToString(<AuthButton email="user@example.com" />);

    expect(html).toContain("Sign out");
    expect(html).toContain('title="Signed in as user@example.com"');
  });

  it("renders a form that posts to the signOut action", () => {
    const html = renderToString(<AuthButton email="test@test.com" />);

    expect(html).toContain("<form");
    expect(html).toContain("Sign out");
  });
});
