import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthButton } from "@/components/auth-button";

// Mock the signOut server action
vi.mock("@/app/auth/login/actions", () => ({
  signOut: vi.fn(),
}));

describe("AuthButton", () => {
  it("renders a Sign out button with the user email in the title", () => {
    render(<AuthButton email="user@example.com" />);

    const button = screen.getByRole("button", { name: "Sign out" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("title", "Signed in as user@example.com");
  });

  it("renders a form that posts to the signOut action", () => {
    render(<AuthButton email="test@test.com" />);

    const form = screen.getByRole("button", { name: "Sign out" }).closest("form");
    expect(form).toBeInTheDocument();
  });
});
