import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-libsql", "@libsql/client", "libsql", "google-auth-library"],
  images: { remotePatterns: [{ protocol: "https", hostname: "lh3.googleusercontent.com" }] },
  webpack(config, { isServer, webpack }) {
    if (!isServer) {
      // pptxgenjs memuat modul Node dengan skema "node:" yang tidak diperlukan di peramban
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:(fs|https|http|os|path)$/, (resource: { request: string }) => {
          resource.request = resource.request.replace(/^node:/, "");
        })
      );
      config.resolve.fallback = { ...(config.resolve.fallback ?? {}), fs: false, https: false, http: false, os: false, path: false };
    }
    return config;
  },
  async headers() {
    return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }, { key: "Service-Worker-Allowed", value: "/" }] }];
  },
};

export default nextConfig;
