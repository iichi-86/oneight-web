import { defineConfig } from "astro/config";
import { loadEnv } from "vite";
import deployment from "./src/data/deployment.json" with { type: "json" };

const env = loadEnv(
  process.env.NODE_ENV || "production",
  process.cwd(),
  "PUBLIC_",
);
const candidate =
  process.env.PUBLIC_SITE_URL || env.PUBLIC_SITE_URL || deployment.siteUrl;
let site;
if (candidate) {
  const parsed = new URL(candidate);
  if (
    parsed.protocol !== "https:" ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash ||
    parsed.username ||
    parsed.password
  ) {
    throw new Error(
      "PUBLIC_SITE_URL must be an HTTPS origin without a path, query or credentials.",
    );
  }
  site = parsed.origin;
}

export default defineConfig({
  site,
  output: "static",
  trailingSlash: "always",
});
