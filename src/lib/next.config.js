/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Required for Electron (static export)
  images: {
    unoptimized: true, // Required for local images in Electron
  },
  // @ts-ignore
  webpack: (config) => {
    // This allows native Node modules to be used in the Electron environment
    // without Next.js trying to bundle them.
    config.externals.push({
      'better-sqlite3': 'commonjs better-sqlite3',
      'fs': 'commonjs fs',
      'path': 'commonjs path',
      'crypto': 'commonjs crypto',
      'os': 'commonjs os',
    });
    return config;
  },
};

module.exports = nextConfig;