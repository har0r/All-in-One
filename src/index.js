// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  REST,
  Routes,
  ActivityType,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize
} = require('discord.js');
const chalk = require('chalk');

const config = require('./config.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildPresences
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember, Partials.User],
  allowedMentions: { parse: ['users'], repliedUser: false }
});

client.commands = new Collection();
client.prefix = config.prefix || '#';
client.branding = config.branding || { botName: 'TechRoad', color: 3092790, footer: 'TechRoad • All Rights Reserved' };

// Load commands recursively
function loadCommands(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let count = 0;
  for (const file of files) {
    const full = path.join(dir, file.name);
    if (file.isDirectory()) {
      count += loadCommands(full);
    } else if (file.name.endsWith('.js')) {
      try {
        const cmd = require(full);
        if (cmd && cmd.data && cmd.execute) {
          const name = cmd.data.name || path.basename(file.name, '.js');
          client.commands.set(name, cmd);
          if (cmd.data.aliases) {
            for (const alias of cmd.data.aliases) client.commands.set(alias, cmd);
          }
          count++;
        }
      } catch (e) {
        console.log(chalk.red(`[CMD ERROR] ${full}: ${e.message}`));
      }
    }
  }
  return count;
}

// Load events
function loadEvents(dir) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
  let count = 0;
  for (const file of files) {
    try {
      const evt = require(path.join(dir, file));
      const name = evt.name || file.replace('.js', '');
      if (evt.once) client.once(name, (...args) => evt.execute(...args, client));
      else client.on(name, (...args) => evt.execute(...args, client));
      count++;
      console.log(chalk.cyan(`[EVENT] Loaded ${name}`));
    } catch (e) {
      console.log(chalk.red(`[EVENT ERROR] ${file}: ${e.message}`));
    }
  }
  return count;
}

const commandsPath = path.join(__dirname, 'commands');
const eventsPath = path.join(__dirname, 'events');

const cmdCount = loadCommands(commandsPath);
console.log(chalk.green(`[LOADER] Loaded ${cmdCount} commands`));
const evtCount = loadEvents(eventsPath);
console.log(chalk.green(`[LOADER] Loaded ${evtCount} events`));

// Ready handler for sync and presence
client.once('ready', async () => {
  console.log(chalk.green(`[READY] Logged in as ${client.user.tag} (${client.user.id})`));
  console.log(chalk.yellow(`[BRANDING] ${client.branding.botName} • ${client.branding.footer}`));

  // Presence TechRoad-style
  try {
    client.user.setPresence({
      status: 'online',
      activities: [{ name: 'TechRoad • /help', type: ActivityType.Watching }]
    });
  } catch {}

  // Sync guild commands if guildId provided
  const rest = new REST({ version: '10' }).setToken(config.token);
  const slashCommands = [];
  for (const [name, cmd] of client.commands) {
    // only register once per unique command (avoid aliases double)
    if (cmd.data && typeof cmd.data.toJSON === 'function') {
      // check if we've already added this command name
      if (!slashCommands.find(c => c.name === cmd.data.name)) {
        slashCommands.push(cmd.data.toJSON());
      }
    } else if (cmd.data && cmd.data.name) {
      if (!slashCommands.find(c => c.name === cmd.data.name)) slashCommands.push(cmd.data);
    }
  }

  try {
    if (config.guildId && config.guildId !== 'YOUR_GUILD_ID') {
      console.log(chalk.yellow(`[SYNC] Syncing ${slashCommands.length} guild commands to ${config.guildId}...`));
      await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: slashCommands });
      console.log(chalk.green(`[SYNC] Guild commands synced`));
    } else if (config.clientId && config.clientId !== 'YOUR_CLIENT_ID') {
      console.log(chalk.yellow(`[SYNC] Syncing ${slashCommands.length} global commands...`));
      await rest.put(Routes.applicationCommands(config.clientId), { body: slashCommands });
      console.log(chalk.green(`[SYNC] Global commands synced`));
    } else {
      console.log(chalk.gray('[SYNC] Skipped (no guildId/clientId set)'));
    }
  } catch (e) {
    console.log(chalk.red(`[SYNC ERROR] ${e.message}`));
    if (e.rawError) console.log(chalk.red(JSON.stringify(e.rawError, null, 2)));
  }

  // Ensure database folder
  const dbFolder = path.join(__dirname, '..', 'database');
  if (!fs.existsSync(dbFolder)) fs.mkdirSync(dbFolder, { recursive: true });
  console.log(chalk.green(`[DB] Database folder ready at ${dbFolder}`));
});

client.on('error', e => console.log(chalk.red(`[CLIENT ERROR] ${e.message}`)));
process.on('unhandledRejection', e => console.log(chalk.red(`[UNHANDLED] ${e}`)));
process.on('uncaughtException', e => console.log(chalk.red(`[UNCAUGHT] ${e.message}`)));

// Login
if (!config.token || config.token === 'YOUR_BOT_TOKEN') {
  console.log(chalk.red('[LOGIN] Token not set in src/config.json (YOUR_BOT_TOKEN) - set your token to start the bot.'));
  console.log(chalk.yellow('[LOGIN] Running syntax check mode only. Not logging in.'));
} else {
  client.login(config.token).catch(e => console.log(chalk.red(`[LOGIN ERROR] ${e.message}`)));
}

module.exports = client;

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
