module.exports = {
  apps: [
    {
      name: 'kasyrooms',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: '5000',
        JWT_SECRET: process.env.JWT_SECRET || 'dev-secret'
      }
    }
  ]
};
