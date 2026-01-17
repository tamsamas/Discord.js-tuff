const Discord = require('discord.js-selfbot-v13');
const fetch = require('node-fetch');

const TOKEN = 'YOUR_DISCORD_TOKEN';
const TELEGRAM_BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
const TELEGRAM_CHAT_ID = 'YOUR_TELEGRAM_CHAT_ID';

const client = new Discord.Client({
  ws: {
    properties: {
      os: "Android",
      browser: "Discord Android",
      device: "Discord Android"
    }
  }
});

function setPresence() {
  const now = Date.now();
  const hoursPlayed = 99999;

  const activityData = {
    name: "you",
    type: "WATCHING",
    details: "Your description goes here",
    timestamps: {
      start: now - hoursPlayed * 60 * 60 * 1000
    }
  };

  client.user.setPresence({
// UNCOMMENT THIS IF YOUR WANT A CRAZY RICH PRESENCE    activities: [activityData],
    status: "dnd"
  });

  // Force mobile DND presence
  client.ws.shards.first().send(
    JSON.stringify({
      op: 3,
      d: {
        since: null,
// UNCOMMENT THIS IF YOUR WANT A CRAZY RICH PRESENCE        activities: [activityData],
        status: "dnd",
        afk: false,
        client_status: {
          desktop: "offline",
          web: "offline",
          mobile: "dnd"
        }
      }
    })
  );
}

async function sendToTelegram(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const body = {
    chat_id: TELEGRAM_CHAT_ID,
    text: text,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const json = await res.json();
    if (!json.ok) {
      console.error('Telegram API error:', json);
    }
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  setPresence();

  await sendToTelegram(`✅ Logged in as <b>${client.user.tag}</b>`);
});

client.on('messageCreate', async (message) => {
  if (message.author.id === client.user.id) return;
  if (message.channel.type !== 'DM') return;

  const author = message.author.username;
  let content = message.content;

  // Replace user mentions
  if (message.mentions.users.size > 0) {
    message.mentions.users.forEach((user) => {
      const mentionSyntax = `<@${user.id}>`;
      content = content.replaceAll(mentionSyntax, `@${user.username}`);
    });
  }

  // Replace role mentions
  if (message.mentions.roles.size > 0) {
    message.mentions.roles.forEach((role) => {
      const mentionSyntax = `<@&${role.id}>`;
      content = content.replaceAll(mentionSyntax, `@${role.name}`);
    });
  }

  // Handle attachments
  if (message.attachments.size > 0) {
    message.attachments.forEach((att) => {
      content += `\n📎 <a href="${att.url}">Attachment</a>`;
    });
  }

  console.log(`New DM from ${author}: ${content}`);

  const telegramMsg = `✉️ <b>${author}</b>:\n${content}`;
  await sendToTelegram(telegramMsg);
});

client.on('disconnect', (event) => {
  console.log(`[!] Disconnected with code ${event.code}. Reconnecting in 10 seconds...`);
  setTimeout(() => {
    client.destroy();
    client.login(TOKEN).catch(console.error);
  }, 10000);
});

client.on('error', (error) => {
  console.error('[!] Client error:', error);
});

client.login(TOKEN).catch(console.error);
