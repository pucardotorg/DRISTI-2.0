import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Next 16 blocks its own dev resources when the page is reached from a host it
   * does not consider the dev origin — including `127.0.0.1`, which is the URL
   * `.claude/rules/dev-server.md` tells everyone to use. The block is silent in
   * the browser: `/_next/webpack-hmr` 403s, the client runtime never boots, and
   * every screen that loads its data client-side sits on a spinner for ever,
   * with no console error to explain it. Only the server log says why.
   *
   * Both loopback names, so the documented URL works and the trap is closed.
   */
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  output: process.env.STATIC_EXPORT === "true" ? "export" : undefined,
};

export default nextConfig;
