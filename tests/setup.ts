import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// @testing-library/react v16 calls React.act, which is `undefined` in React's
// production CJS bundle (Vercel installs with NODE_ENV=production). The ES
// module namespace makes act non-configurable so Object.defineProperty fails.
// Mock the react module to provide an act passthrough when the real one is missing.
vi.mock("react", async (importOriginal) => {
  const React = await importOriginal<typeof import("react")>();
  if (!(React as Record<string, unknown>).act) {
    return {
      ...React,
      act: (fn: () => void | Promise<void>) => fn(),
    };
  }
  return React;
});
