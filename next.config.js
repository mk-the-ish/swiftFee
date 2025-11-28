/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // CRITICAL: This forces the static export to 'out/'
  
  // CRITICAL: This makes assets relative (./) so they work in file:// protocol
  assetPrefix: './', 
  
  images: {
    unoptimized: true, // CRITICAL: Local apps cannot use image optimization
  },
  
  // @ts-ignore
  webpack: (config) => {
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
