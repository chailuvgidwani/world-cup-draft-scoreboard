import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the file-tracing root to this project so a stray lockfile elsewhere on
  // the machine can't make Next.js infer the wrong workspace root.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
