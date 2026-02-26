// PM2 Ecosystem Configuration
// Run with: npx pm2 start ecosystem.config.js
// To save & auto-start on reboot: npx pm2 save && npx pm2 startup

module.exports = {
    apps: [
        {
            name: 'veedra-backend',
            script: 'src/server.js',
            cwd: __dirname,
            instances: 1,
            autorestart: true,           // Auto-restart if it crashes
            watch: false,                // Don't watch files in production
            max_memory_restart: '500M',  // Restart if memory exceeds 500MB
            restart_delay: 3000,         // Wait 3s before restart
            max_restarts: 10,            // Max 10 restarts in restart_delay window
            env: {
                NODE_ENV: 'production',
                PORT: 5000
            },
            env_development: {
                NODE_ENV: 'development',
                PORT: 5000
            },
            error_file: './logs/pm2-error.log',
            out_file: './logs/pm2-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            merge_logs: true
        }
    ]
};
