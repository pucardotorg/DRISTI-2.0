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
  /**
   * Dev only. Next blocks cross-origin dev requests, and reaching the app on
   * `127.0.0.1` instead of `localhost` therefore served a page that rendered but never
   * hydrated — no interactivity, no effects, and nothing in the console but failed
   * `webpack-hmr` websocket attempts. It reads as a broken screen and is not one.
   * `localhost` is still the address to use; this only stops the other spelling from
   * failing silently.
   */
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
