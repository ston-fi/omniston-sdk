/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,

  // enabling server side source maps
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.devtool = "source-map";
    }
    return config;
  },
};

export default nextConfig;
