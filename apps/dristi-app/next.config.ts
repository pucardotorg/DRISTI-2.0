import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
