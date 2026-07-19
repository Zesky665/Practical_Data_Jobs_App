import { updateSession } from "@/lib/supabase/proxy";
import { type NextRequest } from "next/server";

// Next 16 renamed middleware.ts → proxy.ts. Same role: runs on every matched
// request before the route handler. We use it only to refresh the Supabase
// session and enforce the public-vs-/app gate — no business logic, no DB writes.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Match all request paths except:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico
    // - common image extensions
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
