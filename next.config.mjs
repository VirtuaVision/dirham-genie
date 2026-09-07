/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "images-eu.ssl-images-amazon.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  // @napi-rs/canvas ships a compiled native binary (.node file). Without
  // this, webpack tries to parse that binary as JavaScript and the build
  // fails with "Module parse failed: Unexpected character". Marking it as
  // an external server package tells Next.js to require() it directly
  // from node_modules at runtime instead of bundling it.
  experimental: {
    serverComponentsExternalPackages: ["@napi-rs/canvas"],
  },
};

export default nextConfig;
