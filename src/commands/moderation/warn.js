// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const builders = require('../../utils/builders');
const db = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder().setName('warn').setDescription('Warn a user')
    .addUserOption(o=> o.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption(o=> o.setName('reason').setDescription('Reason').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';
    if (user.bot) {
      const err = builders.buildErrorContainer('Invalid', 'You cannot warn bots.');
      return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    const key = `warns_${interaction.guild.id}_${user.id}`;
    let data = db.get(key) || [];
    if (!Array.isArray(data)) data = [];
    data.push({ reason, moderator: interaction.user.id, at: Date.now(), id: Date.now().toString(36) });
    db.set(key, data);
    const ok = new ContainerBuilder().setAccentColor(0xFEE75C)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.warning} User Warned`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**User:** ${user.tag} (\`${user.id}\`)\n**Moderator:** ${interaction.user}\n**Reason:** ${reason}\n**Total Warns:** \`${data.length}\``))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
    await interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
