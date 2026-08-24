// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  PermissionFlagsBits,
  ChannelType
} = require('discord.js');
const config = require('../config.json');
const db = require('../utils/db');
const builders = require('../utils/builders');

function buildV2Error(desc) {
  return builders.buildErrorContainer('Error', desc);
}
function buildV2Success(title, desc) {
  return builders.buildSuccessContainer(title, desc);
}

// anti-spam rolling window: userId -> [timestamps]
const spamWindow = new Map();

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;

    const guildId = message.guild.id;
    const prefix = config.prefix || '#';

    // === PROTECTION (honeypot / antispam / antilink / antiinvite) ===
    try {
      const protect = db.get(guildId, 'protect');
      if (protect) {
        const isStaff = message.member && (message.member.permissions.has(PermissionFlagsBits.ManageMessages) || config.owners.includes(message.author.id));

        // Honeypot: any message from a non-staff member = instant punishment
        if (protect.honeypot && protect.honeypot.channelId === message.channel.id && !isStaff) {
          const member = message.member;
          await message.delete().catch(()=>{});
          if (member) {
            if (protect.honeypot.punishment === 'ban') await member.ban({ reason: 'TechRoad honeypot' }).catch(()=>{});
            else await member.kick('TechRoad honeypot').catch(()=>{});
          }
          return;
        }

        if (!isStaff) {
          const punish = async (type, reason) => {
            const member = message.member;
            if (!member) return;
            if (type === 'ban') await member.ban({ reason }).catch(()=>{});
            else if (type === 'kick') await member.kick(reason).catch(()=>{});
            else if (type === 'timeout') await member.timeout(10 * 60 * 1000, reason).catch(()=>{});
          };

          // Anti-Link
          if (protect.antilink && /https?:\/\//i.test(message.content)) {
            await message.delete().catch(()=>{});
            if (protect.antilink === 'timeout') await punish('timeout', 'TechRoad anti-link');
            return;
          }
          // Anti-Invite
          if (protect.antiinvite && /(discord\.(gg|io|me|li)|discord\.com\/invite)\/[\w-]+/i.test(message.content)) {
            await message.delete().catch(()=>{});
            if (protect.antiinvite === 'timeout') await punish('timeout', 'TechRoad anti-invite');
            return;
          }
          // Anti-Spam (in-memory window)
          if (protect.antispam) {
            spamWindow.set(message.author.id, (spamWindow.get(message.author.id) || []).filter(t => Date.now() - t < protect.antispam.secs * 1000));
            const stamps = spamWindow.get(message.author.id);
            stamps.push(Date.now());
            if (stamps.length > protect.antispam.msgs) {
              spamWindow.delete(message.author.id);
              await message.delete().catch(()=>{});
              await punish(protect.antispam.punishment, 'TechRoad anti-spam');
              return;
            }
          }
        }
      }
    } catch {}

    // === AUTOLINE (media channel: images & videos only) ===
    try {
      const autoLineCfg = db.get(guildId, 'autoline');
      if (autoLineCfg && autoLineCfg.channelId === message.channel.id) {
        const isMedia = message.attachments.size > 0 && [...message.attachments.values()].some(a => a.contentType && (a.contentType.startsWith('image/') || a.contentType.startsWith('video/')));
        const hasEmbedMedia = message.embeds.some(e => e.image || e.thumbnail || e.video);
        if (!isMedia && !hasEmbedMedia) {
          if (message.deletable) await message.delete().catch(()=>{});
          const warn = new ContainerBuilder().setAccentColor(0xFEE75C)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.warning} Media Channel\n${message.author}, this channel only allows images and videos.`))
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
          const m = await message.channel.send({ components: [warn], flags: MessageFlags.IsComponentsV2 }).catch(()=>null);
          if (m) setTimeout(()=> m.delete().catch(()=>{}), 5000);
          return;
        }
      }
    } catch {}

    // === FEEDBACK / SUGGESTIONS AUTO HANDLER ===
    try {
      const feedbackCfg = db.get(guildId, 'feedback');
      if (feedbackCfg && feedbackCfg.channelId === message.channel.id) {
        const text = (message.content || '').trim();
        if (text.length <= 5) {
          if (message.deletable) await message.delete().catch(()=>{});
          return;
        }
        const { SectionBuilder, ThumbnailBuilder } = require('discord.js');
        const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
          .addSectionComponents(
            new SectionBuilder()
              .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.feedback} Feedback\n${message.content.slice(0, 3500)}`))
              .setThumbnailAccessory(new ThumbnailBuilder({ description: message.author.username, media: { url: message.author.displayAvatarURL({ extension: 'png', size: 128 }) } }))
          )
          .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${message.author.tag}** • ${message.channel.name}\n-# ${builders.BRAND_FOOTER}`));
        if (message.deletable) await message.delete().catch(()=>{});
        await message.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
        return;
      }
      const suggCfg = db.get(guildId, 'suggestions');
      if (suggCfg && suggCfg.channelId === message.channel.id) {
        const sText = (message.content || '').trim();
        if (sText.length <= 5) {
          if (message.deletable) await message.delete().catch(()=>{});
          return;
        }
        const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.suggestions} New Suggestion\n${sText.slice(0, 3500)}`))
          .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**From:** ${message.author} (\`${message.author.id}\`)\n**Status:** Pending`))
          .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`suggestion_accept:${message.author.id}:${message.id}`).setLabel('Accept').setStyle(ButtonStyle.Success).setEmoji('✅'),
          new ButtonBuilder().setCustomId(`suggestion_reject:${message.author.id}:${message.id}`).setLabel('Reject').setStyle(ButtonStyle.Danger).setEmoji('❌')
        );
        if (message.deletable) await message.delete().catch(()=>{});
        await message.channel.send({ components: [container, row], flags: MessageFlags.IsComponentsV2 }).catch(async ()=> {
          await message.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
        });
        return;
      }
    } catch {}

    // === LEVEL XP ===
    try {
      if (message.content && !message.content.startsWith(prefix)) {
        const key = `level_${guildId}_${message.author.id}`;
        let data = db.get(key);
        if (!data) data = { xp: 0, level: 0, totalXp: 0 };
        const xpToAdd = Math.floor(Math.random() * 10) + 5; // 5-15
        data.xp += xpToAdd;
        data.totalXp = (data.totalXp || 0) + xpToAdd;
        const needed = (data.level + 1) * 300; // simple formula
        if (data.xp >= needed) {
          data.level += 1;
          data.xp -= needed;
          // level up message with Components V2
          const lvlContainer = new ContainerBuilder().setAccentColor(0x57F287)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.level} Level Up!\n${message.author} reached **Level ${data.level}**!`))
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`Keep chatting to level up further!\n-# ${builders.BRAND_FOOTER}`));
          message.channel.send({ components: [lvlContainer], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
        }
        db.set(key, data);
      }
    } catch {}

    // === AFK SYSTEM ===
    try {
      const afkData = db.get(guildId, 'afk');
      if (afkData) {
        // If author is AFK, remove
        if (afkData[message.author.id]) {
          delete afkData[message.author.id];
          db.set(guildId, 'afk', afkData);
          const c = new ContainerBuilder().setAccentColor(0x57F287)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.success} Welcome Back\n${message.author}, your AFK has been removed.`))
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
          message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 }).then(m=> setTimeout(()=>m.delete().catch(()=>{}), 5000)).catch(()=>{});
          // restore nickname if had
          try {
            if (message.member && message.member.manageable && afkData[`_nick_${message.author.id}`]) {
              await message.member.setNickname(afkData[`_nick_${message.author.id}`]).catch(()=>{});
              delete afkData[`_nick_${message.author.id}`];
              db.set(guildId, 'afk', afkData);
            }
          } catch {}
        }
        // If mentioning someone AFK
        if (message.mentions.users.size) {
          for (const [id, user] of message.mentions.users) {
            if (afkData[id]) {
              const reason = afkData[id].reason || 'No reason';
              const since = afkData[id].since ? `<t:${Math.floor(afkData[id].since/1000)}:R>` : 'recently';
              const c = new ContainerBuilder().setAccentColor(0xFEE75C)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.info} AFK User\n${user.tag} is AFK ${since}\n**Reason:** ${reason}`))
                .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
              message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
              break;
            }
          }
        }
      }
    } catch {}

    // === PREFIX COMMAND BRIDGE ===
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const cmdName = args.shift()?.toLowerCase();
    if (!cmdName) return;

    const command = client.commands.get(cmdName);
    if (!command) return;

    // Build a fake interaction-like object for prefix support
    // We create minimal wrapper that maps reply/editReply to message reply
    const fakeInteraction = {
      isChatInputCommand: () => false,
      isPrefix: true,
      commandName: command.data.name,
      user: message.author,
      member: message.member,
      guild: message.guild,
      channel: message.channel,
      client,
      message,
      args,
      // Options shim: provide getString/getUser etc reading from args
      options: {
        getString: (name, required) => {
          // for commands that expect options, we try to map args positional
          // Return args joined or first arg
          if (args.length === 0) return required ? null : null;
          // Simple: return args[0] for first string option
          return args.join(' ') || null;
        },
        getUser: (name) => {
          const mention = message.mentions.users.first();
          if (mention) return mention;
          const id = args[0]?.replace(/[<@!>]/g, '');
          if (id && /^\d{17,19}$/.test(id)) return client.users.cache.get(id) || { id, tag: 'Unknown' };
          return null;
        },
        getMember: (name) => message.mentions.members.first() || null,
        getChannel: (name) => message.mentions.channels.first() || null,
        getRole: (name) => message.mentions.roles.first() || null,
        getInteger: (name) => {
          const v = parseInt(args.find(a => /^-?\d+$/.test(a)), 10);
          return isNaN(v) ? null : v;
        },
        getNumber: (name) => {
          const v = parseFloat(args.find(a => /^-?\d+(\.\d+)?$/.test(a)));
          return isNaN(v) ? null : v;
        },
        getBoolean: () => null,
        getSubcommand: () => args[0]?.toLowerCase() || null,
        getSubcommandGroup: () => null,
        getFocused: () => null
      },
      replied: false,
      deferred: false,
      _replyMsg: null,
      async reply(payload) {
        this.replied = true;
        // Ensure V2 flags
        if (payload.components && !payload.flags) payload.flags = MessageFlags.IsComponentsV2;
        // For prefix, we can't use ephemeral, remove it
        if (payload.flags && (payload.flags & MessageFlags.Ephemeral)) {
          payload.flags &= ~MessageFlags.Ephemeral;
        }
        const m = await message.reply(payload).catch(e=>null);
        this._replyMsg = m;
        return m;
      },
      async editReply(payload) {
        if (payload.components && !payload.flags) payload.flags = MessageFlags.IsComponentsV2;
        if (this._replyMsg) return this._replyMsg.edit(payload).catch(()=>null);
        return message.reply(payload).catch(()=>null);
      },
      async deferReply(opts) {
        this.deferred = true;
        // React with loading or send typing
        await message.channel.sendTyping().catch(()=>{});
        return;
      },
      async followUp(payload) {
        if (payload.components && !payload.flags) payload.flags = MessageFlags.IsComponentsV2;
        return message.channel.send(payload).catch(()=>null);
      },
      async deferUpdate() { this.deferred = true; return; },
      async update(payload) {
        if (this._replyMsg) return this._replyMsg.edit(payload).catch(()=>null);
        return message.reply(payload).catch(()=>null);
      }
    };

    try {
      // Prefer prefixExecute if exists, else execute with fakeInteraction
      if (typeof command.prefixExecute === 'function') {
        await command.prefixExecute(message, args, client, fakeInteraction);
      } else {
        await command.execute(fakeInteraction, client);
      }
    } catch (err) {
      console.error(`[PREFIX ERROR] ${cmdName}:`, err);
      const errC = builders.buildErrorContainer('Command Error', `\`\`\`${String(err.message).slice(0, 1500)}\`\`\``);
      message.reply({ components: [errC], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
