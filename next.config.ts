import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents (Next 16's prerender-by-default / "use cache" model) is
  // intentionally OFF. Our pages are per-user dynamic (auth/cookies on nearly
  // every route), so with it enabled every such page fails the production
  // build with "Uncached data accessed outside <Suspense>". Same call as the
  // sister project PDC_Job_Board.
  poweredByHeader: false,
};

export default nextConfig;
