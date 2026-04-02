require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const express = require('express');

// Environment Variables
const BOT_TOKEN = process.env.BOT_TOKEN;
const RENDER_URL = process.env.RENDER_URL;
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) {
    console.error('❌ Error: BOT_TOKEN is missing in .env file');
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

const path = require('path');

// --- Telegram Bot Logic ---

// Start Command
bot.start((ctx) => {
    const welcomeMessage = `
👋 *Welcome to YETCOIN!*

Explore the interactive sections below to learn more about our mining ecosystem.
    `;
    
    // Construct URLs using the provided BOT_URL or a fallback
    const baseUrl = process.env.BOT_URL || 'https://yetcoinstgbot.onrender.com';
    
    return ctx.replyWithMarkdownV2(
        welcomeMessage.replace(/[.!#-]/g, '\\$&'),
        Markup.inlineKeyboard([
            [Markup.button.webApp('⛏️ Mine YETC', RENDER_URL || 'https://yetcoins.render.com')],
            [Markup.button.webApp('❓ How to Mine', `${baseUrl}/how-to-mine.html`)],
            [Markup.button.webApp('ℹ️ About Us', `${baseUrl}/about.html`)],
            [Markup.button.webApp('🗺️ Roadmap', `${baseUrl}/roadmap.html`)],
            [Markup.button.webApp('📞 Contact Us', `${baseUrl}/contact.html`)]
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
        console.error('❌ Bot launch failed!');
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);
        if (err.code === 'ETIMEDOUT') {
            console.error('💡 This usually means your network is blocking api.telegram.org or is too slow. Try using a VPN or checking your internet connection.');
        }
    });

// --- Auto-Ping Logic (Every 52 Seconds) ---

const PING_INTERVAL_MS = 52 * 1000;

const pingService = async () => {
    if (!RENDER_URL) {
        console.warn('⚠️ RENDER_URL not set. Skipping ping.');
        return;
    }
    
    try {
        console.log(`[${new Date().toLocaleTimeString()}] Pinging ${RENDER_URL}...`);
        const response = await axios.get(RENDER_URL);
        console.log(`✅ Success (Status: ${response.status})`);
    } catch (error) {
        console.error(`❌ Ping failed: ${error.message}`);
    }
};

// Start Pinging
if (RENDER_URL) {
    console.log(`🔔 Auto-ping enabled for ${RENDER_URL} every 52 seconds.`);
    setInterval(pingService, PING_INTERVAL_MS);
}

// --- Health Check & Static File Server ---

const app = express();
// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => res.send('YETCOIN Bot Alive 🚀'));
app.listen(PORT, () => console.log(`🌍 Health check & static server listening on port ${PORT}`));

// Graceful stop
process.once('SIGINT', () => {
    bot.stop('SIGINT');
    process.exit(0);
});
process.once('SIGTERM', () => {
    bot.stop('SIGTERM');
    process.exit(0);
});
