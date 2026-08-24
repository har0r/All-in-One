// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  AuditLogEvent,
  ChannelType,
  PermissionsBitField
} = require('discord.js');
const db = require('../utils/db');
const builders = require('../utils/builders');

function getLogConfig(guildId) {
  return db.get(guildId, 'logging');
}

async function sendLog(guild, container) {
  const cfg = getLogConfig(guild.id);
  if (!cfg || !cfg.enabled || !cfg.channelId) return;
  const ch = guild.channels.cache.get(cfg.channelId) || await guild.channels.fetch(cfg.channelId).catch(()=>null);
  if (!ch || !ch.isTextBased()) return;
  // Check if group disabled? cfg.disabledGroups etc
  ch.send({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
}

function baseContainer(title, emoji, color, description, fields) {
  const c = new ContainerBuilder().setAccentColor(color || builders.BRAND_COLOR)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${emoji ? emoji + ' ' : ''}${title}`));
  if (description) c.addTextDisplayComponents(new TextDisplayBuilder().setContent(description));
  if (fields && fields.length) {
    c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
    for (const f of fields) c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${f.name}**\n${f.value}`));
  }
  c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER} • <t:${Math.floor(Date.now()/1000)}:F>`));
  return c;
}

async function fetchAudit(guild, type, limit = 1) {
  try {
    if (!guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) return null;
    const logs = await guild.fetchAuditLogs({ type, limit });
    return logs.entries.first() || null;
  } catch { return null; }
}

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    // Attach all logging listeners once ready fires
    // Do not duplicate if already attached
    if (client._loggingAttached) return;
    client._loggingAttached = true;

    // MESSAGE DELETE
    client.on('messageDelete', async (message) => {
      try {
        if (!message.guild) return;
        const cfg = getLogConfig(message.guild.id);
        if (!cfg || !cfg.enabled) return;
        if (cfg.disabledGroups && cfg.disabledGroups.includes('messages')) return;
        if (message.partial) return;
        if (message.author && message.author.bot) return;
        const audit = await fetchAudit(message.guild, AuditLogEvent.MessageDelete);
        const container = baseContainer('Message Deleted', builders.emojis.trash, 0xED4245,
          `Message by ${message.author ? `${message.author.tag}` : 'Unknown'} deleted in ${message.channel}`,
          [
            { name: 'Author', value: message.author ? `${message.author.tag} • \`${message.author.id}\`` : 'Unknown' },
            { name: 'Channel', value: `${message.channel} • \`${message.channel.id}\`` },
            { name: 'Content', value: message.content ? `\`\`\`${message.content.slice(0, 1000)}\`\`\`` : '*No text content* (embeds/attachments)*' + (message.attachments.size ? `\nAttachments: ${[...message.attachments.values()].map(a=>a.url).join('\n')}` : '') },
            { name: 'Audit Log', value: audit && audit.executor ? `Deleted by ${audit.executor.tag} (${audit.executor.id})` : 'No audit data / self-delete' }
          ]
        );
        await sendLog(message.guild, container);
      } catch {}
    });

    client.on('messageUpdate', async (oldMsg, newMsg) => {
      try {
        if (!newMsg.guild) return;
        const cfg = getLogConfig(newMsg.guild.id);
        if (!cfg || !cfg.enabled) return;
        if (cfg.disabledGroups && cfg.disabledGroups.includes('messages')) return;
        if (newMsg.partial) return;
        if (newMsg.author && newMsg.author.bot) return;
        if (oldMsg.content === newMsg.content) return;
        const container = baseContainer('Message Edited', builders.emojis.edit, 0xFEE75C,
          `Message by ${newMsg.author.tag} edited in ${newMsg.channel} [Jump](https://discord.com/channels/${newMsg.guild.id}/${newMsg.channel.id}/${newMsg.id})`,
          [
            { name: 'Author', value: `${newMsg.author.tag} • \`${newMsg.author.id}\`` },
            { name: 'Before', value: oldMsg.content ? `\`\`\`${oldMsg.content.slice(0, 1000)}\`\`\`` : '*No content*' },
            { name: 'After', value: newMsg.content ? `\`\`\`${newMsg.content.slice(0, 1000)}\`\`\`` : '*No content*' }
          ]
        );
        await sendLog(newMsg.guild, container);
      } catch {}
    });

    client.on('messageDeleteBulk', async (messages) => {
      try {
        const first = messages.first();
        if (!first || !first.guild) return;
        const cfg = getLogConfig(first.guild.id);
        if (!cfg || !cfg.enabled) return;
        const container = baseContainer('Bulk Message Delete', builders.emojis.clear, 0xED4245,
          `${messages.size} messages deleted in ${first.channel}`,
          [
            { name: 'Channel', value: `${first.channel} • \`${first.channel.id}\`` },
            { name: 'Count', value: `\`${messages.size}\`` }
          ]);
        await sendLog(first.guild, container);
      } catch {}
    });

    // MEMBER JOIN / LEAVE / UPDATE
    client.on('guildMemberAdd', async (member) => {
      try {
        const cfg = getLogConfig(member.guild.id);
        if (!cfg || !cfg.enabled) return;
        if (cfg.disabledGroups && cfg.disabledGroups.includes('members')) return;
        const container = baseContainer('Member Joined', builders.emojis.welcome, 0x57F287,
          `${member.user.tag} joined the server`,
          [
            { name: 'User', value: `${member.user.tag} • \`${member.id}\`` },
            { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp/1000)}:F> (<t:${Math.floor(member.user.createdTimestamp/1000)}:R>)` },
            { name: 'Member Count', value: `\`${member.guild.memberCount}\`` }
          ]);
        await sendLog(member.guild, container);
      } catch {}
    });

    client.on('guildMemberRemove', async (member) => {
      try {
        const cfg = getLogConfig(member.guild.id);
        if (!cfg || !cfg.enabled) return;
        if (cfg.disabledGroups && cfg.disabledGroups.includes('members')) return;
        const audit = await fetchAudit(member.guild, AuditLogEvent.MemberKick);
        const wasKicked = audit && audit.target && audit.target.id === member.id && Date.now() - audit.createdTimestamp < 5000;
        const wasBanned = await fetchAudit(member.guild, AuditLogEvent.MemberBanAdd);
        const container = baseContainer(wasKicked ? 'Member Kicked' : 'Member Left', wasKicked ? builders.emojis.kick : builders.emojis.member, wasKicked ? 0xED4245 : 0xFEE75C,
          `${member.user ? member.user.tag : 'Unknown'} ${wasKicked ? 'was kicked' : 'left'} the server`,
          [
            { name: 'User', value: `${member.user ? member.user.tag : 'Unknown'} • \`${member.id}\`` },
            { name: 'Reason', value: wasKicked && audit.reason ? audit.reason : 'No reason provided' }
          ]);
        await sendLog(member.guild, container);
      } catch {}
    });

    client.on('guildMemberUpdate', async (oldM, newM) => {
      try {
        const cfg = getLogConfig(newM.guild.id);
        if (!cfg || !cfg.enabled) return;
        if (cfg.disabledGroups && cfg.disabledGroups.includes('members')) return;
        // Roles changed
        const oldRoles = oldM.roles.cache.map(r=>r.id);
        const newRoles = newM.roles.cache.map(r=>r.id);
        const added = newM.roles.cache.filter(r=>!oldM.roles.cache.has(r.id));
        const removed = oldM.roles.cache.filter(r=>!newM.roles.cache.has(r.id));
        if (added.size || removed.size) {
          const audit = await fetchAudit(newM.guild, AuditLogEvent.MemberRoleUpdate);
          const container = baseContainer('Member Roles Updated', builders.emojis.role, 0x5865F2,
            `Roles updated for ${newM.user.tag}`,
            [
              { name: 'User', value: `${newM.user.tag} • \`${newM.id}\`` },
              { name: 'Added', value: added.size ? added.map(r=>`${r}`).join(', ') : 'None' },
              { name: 'Removed', value: removed.size ? removed.map(r=>`${r}`).join(', ') : 'None' },
              { name: 'Moderator', value: audit && audit.executor ? `${audit.executor.tag} (\`${audit.executor.id}\`)` : 'Unknown / Auto' }
            ]);
          await sendLog(newM.guild, container);
        }
        if (oldM.nickname !== newM.nickname) {
          const container = baseContainer('Nickname Changed', builders.emojis.edit, 0x5865F2,
            `Nickname changed for ${newM.user.tag}`,
            [
              { name: 'User', value: `${newM.user.tag} • \`${newM.id}\`` },
              { name: 'Before', value: oldM.nickname || '*None*' },
              { name: 'After', value: newM.nickname || '*None*' }
            ]);
          await sendLog(newM.guild, container);
        }
        if (oldM.communicationDisabledUntil !== newM.communicationDisabledUntil) {
          const isTimeout = newM.communicationDisabledUntil && newM.communicationDisabledUntil > new Date();
          const container = baseContainer(isTimeout ? 'Member Timed Out' : 'Member Timeout Removed', isTimeout ? builders.emojis.mute : builders.emojis.unmute, isTimeout ? 0xED4245 : 0x57F287,
            `${newM.user.tag} ${isTimeout ? 'was timed out' : 'timeout removed'}`,
            [
              { name: 'User', value: `${newM.user.tag} • \`${newM.id}\`` },
              { name: 'Until', value: isTimeout ? `<t:${Math.floor(newM.communicationDisabledUntilTimestamp/1000)}:F>` : 'Now' }
            ]);
          await sendLog(newM.guild, container);
        }
      } catch {}
    });

    // ROLES
    client.on('roleCreate', async (role) => {
      try {
        const cfg = getLogConfig(role.guild.id);
        if (!cfg || !cfg.enabled) return;
        if (cfg.disabledGroups && cfg.disabledGroups.includes('roles')) return;
        const audit = await fetchAudit(role.guild, AuditLogEvent.RoleCreate);
        const container = baseContainer('Role Created', builders.emojis.role, 0x57F287,
          `Role ${role.name} created`,
          [
            { name: 'Role', value: `${role} • \`${role.id}\`` },
            { name: 'Created By', value: audit && audit.executor ? `${audit.executor.tag} (\`${audit.executor.id}\`)` : 'Unknown' }
          ]);
        await sendLog(role.guild, container);
      } catch {}
    });
    client.on('roleDelete', async (role) => {
      try {
        const cfg = getLogConfig(role.guild.id);
        if (!cfg || !cfg.enabled) return;
        if (cfg.disabledGroups && cfg.disabledGroups.includes('roles')) return;
        const audit = await fetchAudit(role.guild, AuditLogEvent.RoleDelete);
        const container = baseContainer('Role Deleted', builders.emojis.trash, 0xED4245,
          `Role ${role.name} deleted`,
          [
            { name: 'Role', value: `${role.name} • \`${role.id}\`` },
            { name: 'Deleted By', value: audit && audit.executor ? `${audit.executor.tag} (\`${audit.executor.id}\`)` : 'Unknown' }
          ]);
        await sendLog(role.guild, container);
      } catch {}
    });
    client.on('roleUpdate', async (oldR, newR) => {
      try {
        const cfg = getLogConfig(newR.guild.id);
        if (!cfg || !cfg.enabled) return;
        if (cfg.disabledGroups && cfg.disabledGroups.includes('roles')) return;
        const changes = [];
        if (oldR.name !== newR.name) changes.push(`Name: \`${oldR.name}\` → \`${newR.name}\``);
        if (oldR.color !== newR.color) changes.push(`Color: \`${oldR.color}\` → \`${newR.color}\``);
        if (oldR.permissions.bitfield !== newR.permissions.bitfield) changes.push(`Permissions changed`);
        if (!changes.length) return;
        const audit = await fetchAudit(newR.guild, AuditLogEvent.RoleUpdate);
        const container = baseContainer('Role Updated', builders.emojis.edit, 0xFEE75C,
          `Role ${newR.name} updated`,
          [
            { name: 'Role', value: `${newR} • \`${newR.id}\`` },
            { name: 'Changes', value: changes.join('\n') },
            { name: 'Updated By', value: audit && audit.executor ? `${audit.executor.tag}` : 'Unknown' }
          ]);
        await sendLog(newR.guild, container);
      } catch {}
    });

    // CHANNELS
    client.on('channelCreate', async (ch) => {
      try {
        if (!ch.guild) return;
        const cfg = getLogConfig(ch.guild.id);
        if (!cfg || !cfg.enabled) return;
        if (cfg.disabledGroups && cfg.disabledGroups.includes('channels')) return;
        const audit = await fetchAudit(ch.guild, AuditLogEvent.ChannelCreate);
        const container = baseContainer('Channel Created', builders.emojis.channel, 0x57F287,
          `Channel ${ch.name} created`,
          [
            { name: 'Channel', value: `${ch} • \`${ch.id}\` • Type: \`${ChannelType[ch.type]}\`` },
            { name: 'Created By', value: audit && audit.executor ? `${audit.executor.tag}` : 'Unknown' }
          ]);
        await sendLog(ch.guild, container);
      } catch {}
    });
    client.on('channelDelete', async (ch) => {
      try {
        if (!ch.guild) return;
        const cfg = getLogConfig(ch.guild.id);
        if (!cfg || !cfg.enabled) return;
        if (cfg.disabledGroups && cfg.disabledGroups.includes('channels')) return;
        const audit = await fetchAudit(ch.guild, AuditLogEvent.ChannelDelete);
        const container = baseContainer('Channel Deleted', builders.emojis.trash, 0xED4245,
          `Channel ${ch.name} deleted`,
          [
            { name: 'Channel', value: `${ch.name} • \`${ch.id}\`` },
            { name: 'Deleted By', value: audit && audit.executor ? `${audit.executor.tag}` : 'Unknown' }
          ]);
        await sendLog(ch.guild, container);
      } catch {}
    });
    client.on('channelUpdate', async (oldC, newC) => {
      try {
        if (!newC.guild) return;
        const cfg = getLogConfig(newC.guild.id);
        if (!cfg || !cfg.enabled) return;
        if (cfg.disabledGroups && cfg.disabledGroups.includes('channels')) return;
        const changes = [];
        if (oldC.name !== newC.name) changes.push(`Name: \`${oldC.name}\` → \`${newC.name}\``);
        if (oldC.topic !== newC.topic) changes.push(`Topic changed`);
        if (String(oldC.permissionOverwrites.cache.size) !== String(newC.permissionOverwrites.cache.size)) changes.push(`Permissions updated`);
        if (!changes.length) return;
        const container = baseContainer('Channel Updated', builders.emojis.edit, 0xFEE75C,
          `Channel ${newC.name} updated`,
          [
            { name: 'Channel', value: `${newC} • \`${newC.id}\`` },
            { name: 'Changes', value: changes.join('\n') }
          ]);
        await sendLog(newC.guild, container);
      } catch {}
    });

    // VOICE
    client.on('voiceStateUpdate', async (oldS, newS) => {
      try {
        const guild = newS.guild || oldS.guild;
        const cfg = getLogConfig(guild.id);
        if (!cfg || !cfg.enabled) return;
        if (cfg.disabledGroups && cfg.disabledGroups.includes('vc')) return;
        const member = newS.member || oldS.member;
        if (!oldS.channel && newS.channel) {
          const container = baseContainer('Voice Joined', '🔊', 0x57F287,
            `${member.user.tag} joined voice`,
            [
              { name: 'User', value: `${member.user.tag} • \`${member.id}\`` },
              { name: 'Channel', value: `${newS.channel} • \`${newS.channel.id}\`` }
            ]);
          await sendLog(guild, container);
        } else if (oldS.channel && !newS.channel) {
          const container = baseContainer('Voice Left', '🔇', 0xED4245,
            `${member.user.tag} left voice`,
            [
              { name: 'User', value: `${member.user.tag} • \`${member.id}\`` },
              { name: 'Channel', value: `${oldS.channel} • \`${oldS.channel.id}\`` }
            ]);
          await sendLog(guild, container);
        } else if (oldS.channel && newS.channel && oldS.channel.id !== newS.channel.id) {
          const container = baseContainer('Voice Moved', '🔀', 0x5865F2,
            `${member.user.tag} moved voice`,
            [
              { name: 'User', value: `${member.user.tag} • \`${member.id}\`` },
              { name: 'From', value: `${oldS.channel} • \`${oldS.channel.id}\`` },
              { name: 'To', value: `${newS.channel} • \`${newS.channel.id}\`` }
            ]);
          await sendLog(guild, container);
        }
      } catch {}
    });

    // MODERATION: Ban, Unban, Timeout via audit already partly covered. Also listen to guildBanAdd/Remove
    client.on('guildBanAdd', async (ban) => {
      try {
        const cfg = getLogConfig(ban.guild.id);
        if (!cfg || !cfg.enabled) return;
        if (cfg.disabledGroups && cfg.disabledGroups.includes('moderation')) return;
        const audit = await fetchAudit(ban.guild, AuditLogEvent.MemberBanAdd);
        const container = baseContainer('Member Banned', builders.emojis.ban, 0xED4245,
          `${ban.user.tag} was banned`,
          [
            { name: 'User', value: `${ban.user.tag} • \`${ban.user.id}\`` },
            { name: 'Reason', value: ban.reason || (audit && audit.reason) || 'No reason' },
            { name: 'Moderator', value: audit && audit.executor ? `${audit.executor.tag}` : 'Unknown' }
          ]);
        await sendLog(ban.guild, container);
      } catch {}
    });
    client.on('guildBanRemove', async (ban) => {
      try {
        const cfg = getLogConfig(ban.guild.id);
        if (!cfg || !cfg.enabled) return;
        if (cfg.disabledGroups && cfg.disabledGroups.includes('moderation')) return;
        const audit = await fetchAudit(ban.guild, AuditLogEvent.MemberBanRemove);
        const container = baseContainer('Member Unbanned', builders.emojis.unlock, 0x57F287,
          `${ban.user.tag} was unbanned`,
          [
            { name: 'User', value: `${ban.user.tag} • \`${ban.user.id}\`` },
            { name: 'Moderator', value: audit && audit.executor ? `${audit.executor.tag}` : 'Unknown' }
          ]);
        await sendLog(ban.guild, container);
      } catch {}
    });

    console.log('[LOGGING] Professional logging system attached (messages/members/roles/channels/vc/moderation)');
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
