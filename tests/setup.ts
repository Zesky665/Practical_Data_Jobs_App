import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// @testing-library/react v16 falls back to react-dom/test-utils when
// React.act is missing (production React builds). On Vercel, React is
// installed with NODE_ENV=production, so react-dom/cjs/react-dom-test-utils.
// production.js exports `act = React.act` which is undefined.
// Mock react-dom/test-utils to provide a working act passthrough.
vi.mock("react-dom/test-utils", () => ({
  act: (fn: () => void | Promise<void>) => fn(),
}));
