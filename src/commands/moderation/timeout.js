// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const builders = require('../../utils/builders');

function parseDuration(str) {
  const m = str.match(/^(\d+)(s|m|h|d)$/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const mult = { s: 1000, m: 60*1000, h: 3600*1000, d: 86400*1000 }[unit];
  return n * mult;
}

module.exports = {
  data: new SlashCommandBuilder().setName('timeout').setDescription('Timeout a user')
    .addUserOption(o=> o.setName('user').setDescription('User to timeout').setRequired(true))
    .addStringOption(o=> o.setName('duration').setDescription('Duration e.g. 10m, 1h, 1d').setRequired(true))
    .addStringOption(o=> o.setName('reason').setDescription('Reason').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    const user = interaction.options.getUser('user', true);
    const durStr = interaction.options.getString('duration', true);
    const reason = interaction.options.getString('reason') || `Timeout by ${interaction.user.tag}`;
    const ms = parseDuration(durStr);
    if (!ms || ms < 1000 || ms > 28*24*3600*1000) {
      const err = builders.buildErrorContainer('Invalid Duration', 'Use format like `10m`, `1h`, `1d` (max 28d).');
      return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    const member = await interaction.guild.members.fetch(user.id).catch(()=>null);
    if (!member) {
      const err = builders.buildErrorContainer('Not Found', 'User not found.');
      return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    if (!member.moderatable) {
      const err = builders.buildErrorContainer('Cannot Timeout', 'I cannot timeout this user.');
      return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    try {
      await member.timeout(ms, reason);
      const until = Math.floor((Date.now()+ms)/1000);
      const ok = new ContainerBuilder().setAccentColor(0xED4245)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.mute} User Timed Out`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**User:** ${user.tag} (\`${user.id}\`)\n**Duration:** \`${durStr}\` • Until <t:${until}:F>\n**Moderator:** ${interaction.user}\n**Reason:** ${reason}`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
      await interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    } catch(e) {
      const err = builders.buildErrorContainer('Timeout Failed', e.message.slice(0,1500));
      await interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
