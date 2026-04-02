require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const express = require('express');
const path = require('path');

// Environment Variables
const BOT_TOKEN = process.env.BOT_TOKEN;
const RENDER_URL = process.env.RENDER_URL;
const BOT_URL = process.env.BOT_URL || 'https://yetcoinstgbot.onrender.com';
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) {
    console.error('❌ Error: BOT_TOKEN is missing in .env file');
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// --- Telegram Bot Logic ---

// Start Command
bot.start((ctx) => {
    const welcomeText = `
👋 *Welcome to YETCOIN!*

Explore the interactive sections below to learn more about our mining ecosystem.
    `;
    
    // Construct URLs using the provided BOT_URL or a fallback
    const baseUrl = BOT_URL;
    
    // Improved Grid-like Keyboard Layout
    return ctx.replyWithMarkdownV2(
        welcomeText.replace(/[.!#-]/g, '\\$&'),
        Markup.inlineKeyboard([
            [Markup.button.webApp('⛏️ Mine YETC Tokens', RENDER_URL || 'https://yetcoins.render.com')],
            [
                Markup.button.webApp('❓ How-to', `${baseUrl}/how-to-mine.html`),
                Markup.button.webApp('ℹ️ About Us', `${baseUrl}/about.html`)
            ],
            [
                Markup.button.webApp('🗺️ Roadmap', `${baseUrl}/roadmap.html`),
                Markup.button.webApp('📞 Contact Us', `${baseUrl}/contact.html`)
            ],
            [Markup.button.url('👥 Join Community', 'https://t.me/yetcoin_ann')] // Added placeholder; user can change link
        ])
    );
});

// Help Command
bot.help((ctx) => ctx.reply('Send /start to open the YETCOIN interactive menu.'));

// Launch Bot
console.log('📡 Attempting to connect to Telegram API...');
bot.launch()
    .then(() => console.log('🚀 YETCOIN Bot is successfully running and connected.'))
    .catch((err) => {
        console.error('❌ Bot launch failed!', err.message);
    });

// --- Enhanced Auto-Ping Logic (To bypass Render.com Sleep) ---

const PING_INTERVAL_MINS = 5; 
const PING_INTERVAL_MS = PING_INTERVAL_MINS * 60 * 1000;

const pingService = async () => {
    // We ping the /ping endpoint of both the Bot and the Main App
    const targets = [
        `${BOT_URL}/ping`,
        `${RENDER_URL}/ping`
    ].filter(url => url.startsWith('http'));

    if (targets.length === 0) {
        console.warn('⚠️ No valid endpoints for auto-ping configured.');
        return;
    }
    
    console.log(`\n[${new Date().toLocaleTimeString()}] 💓 Heartbeat: Pinging active services...`);
    
    for (const url of targets) {
        try {
            const start = Date.now();
            const res = await axios.get(url, { timeout: 10000 });
            const duration = Date.now() - start;
            console.log(`✅ ${url} -> Status: ${res.status} (${duration}ms)`);
        } catch (error) {
            console.error(`❌ Ping failed for ${url}: ${error.message}`);
        }
    }
    console.log(`🕒 Next heartbeat in ${PING_INTERVAL_MINS} minutes.\n`);
};

// Initial ping and then interval
setTimeout(pingService, 10000); // 10s after startup
setInterval(pingService, PING_INTERVAL_MS);

// --- Health Check & Static File Server ---

const app = express();

// Serve static files (TWA info pages)
app.use(express.static(path.join(__dirname, 'public')));

// Specific Heartbeat/Ping Endpoints for Render
app.get('/ping', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/health', (req, res) => res.send('YETCOIN Bot Alive 🚀'));

app.listen(PORT, () => {
    console.log(`🌍 Web Server: Listening on port ${PORT}`);
    console.log(`📍 Public URL: ${BOT_URL}`);
});

// Graceful stop
process.once('SIGINT', () => {
    bot.stop('SIGINT');
    process.exit(0);
});
process.once('SIGTERM', () => {
    bot.stop('SIGTERM');
    process.exit(0);
});
