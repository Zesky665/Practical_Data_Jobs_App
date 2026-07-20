import * as React from "react";
import "@testing-library/jest-dom/vitest";

// @testing-library/react v16 needs React.act, which is stripped from React's
// production CJS bundle. Vercel installs with NODE_ENV=production, so React.act
// is missing and render() crashes. Polyfill with an identity pass-through.
if (!(React as unknown as Record<string, unknown>).act) {
  Object.defineProperty(React, "act", {
    value: (fn: () => void | Promise<void>) => fn(),
    writable: true,
    configurable: true,
  });
}
