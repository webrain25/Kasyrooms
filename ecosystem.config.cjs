module.exports = {
  apps: [
    {
      name: 'kasyrooms',
      script: 'dist/index.js',
      // Zero-downtime ready: use cluster with 2 instances and pm2 reload in CI
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      
      // Load all env from file written by the workflow
      env_file: '/var/www/kasyrooms/.env',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: '5000',
        // Serve all external images via our proxy to comply with strict CSP (img-src 'self' data:)
        FORCE_PROXY_IMAGES: process.env.FORCE_PROXY_IMAGES || '1',
        // Keep CSP strict by default; set to '1' to allow https: images directly (not recommended when proxy is enabled)
        CSP_IMG_ALLOW_ALL: process.env.CSP_IMG_ALLOW_ALL || '0'
      }
      ,
      env_production: {
        NODE_ENV: 'production',
        HOST: process.env.HOST || '127.0.0.1',
        PORT: process.env.PORT || '5000',
        FORCE_PROXY_IMAGES: process.env.FORCE_PROXY_IMAGES || '1',
        CSP_IMG_ALLOW_ALL: process.env.CSP_IMG_ALLOW_ALL || '0'
      }
    }
  ]
};
