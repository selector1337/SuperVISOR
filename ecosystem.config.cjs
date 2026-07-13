const path = require('path');

module.exports = {
  apps: [
    {
      name: 'supervisor',
      script: 'src/server.js',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      restart_delay: 5000,
      min_uptime: '30s',
      max_restarts: 10,
      kill_timeout: 20000,
      max_memory_restart: '850M',
      env: {
        NODE_ENV: 'production',
        PUPPETEER_CACHE_DIR: path.join(__dirname, '.cache', 'puppeteer')
      }
    }
  ]
};
