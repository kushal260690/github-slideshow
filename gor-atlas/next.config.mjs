import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This app lives in a subdirectory of a repo that has its own lockfile;
  // pin the tracing root so Next does not infer the parent directory.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
};
export default nextConfig;
