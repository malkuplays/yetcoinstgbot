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

// --- Telegram Bot Logic ---

// Start Command
bot.start((ctx) => {
    const welcomeMessage = `
👋 *Welcome to YETCOIN!*

Welcome to the official YETCOIN bot. Use the menu below to navigate.
    `;
    
    return ctx.replyWithMarkdownV2(
        welcomeMessage.replace(/[.!#-]/g, '\\$&'),
        Markup.inlineKeyboard([
            [Markup.button.callback('❓ How to Mine', 'how_to_mine')],
            [Markup.button.callback('ℹ️ About YETCOIN', 'about')],
            [Markup.button.callback('📞 Contact Us', 'contact_us'), Markup.button.callback('👨‍💻 Support', 'support')]
        ])
    );
});

// Button Handlers
bot.action('how_to_mine', (ctx) => {
    return ctx.reply('⛏️ *How to Mine YETCOIN:*\n\n1. Launch the web app.\n2. Tap the screen to generate coins.\n3. Upgrade your tiers to earn more faster!', { parse_mode: 'Markdown' });
});

bot.action('about', (ctx) => {
    return ctx.reply('💎 *About YETCOIN:*\n\nYETCOIN is a next-generation crypto project focused on community growth and decentralized mining rewards.', { parse_mode: 'Markdown' });
});

bot.action('contact_us', (ctx) => {
    return ctx.reply('📞 *Contact Us:*\n\nEmail: contact@yetcoin.io\nTelegram: @yetcoin_official', { parse_mode: 'Markdown' });
});

bot.action('support', (ctx) => {
    return ctx.reply('👨‍💻 *Support:*\n\nIf you need help, please contact our support team at @yetcoin_support', { parse_mode: 'Markdown' });
});

// Help Command
bot.help((ctx) => ctx.reply('Send /start to open the YETCOIN menu.'));

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

// --- Health Check Server ---

const app = express();
app.get('/', (req, res) => res.send('YETCOIN Bot Alive 🚀'));
app.listen(PORT, () => console.log(`🌍 Health check server listening on port ${PORT}`));

// Graceful stop
process.once('SIGINT', () => {
    bot.stop('SIGINT');
    process.exit(0);
});
process.once('SIGTERM', () => {
    bot.stop('SIGTERM');
    process.exit(0);
});
