/** @type {import('next').NextConfig} */
const isDesktop = process.env.BUILD_TARGET === "desktop"

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // For the Electron desktop build we export a fully static site that is
  // bundled into the app and served locally. Relative asset paths let it load
  // from the internal static server without a fixed origin.
  ...(isDesktop
    ? {
        output: "export",
        assetPrefix: "./",
        trailingSlash: true,
      }
    : {}),
}

export default nextConfig
