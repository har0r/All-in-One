// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const builders = require('../../utils/builders');

module.exports = {
  data: new SlashCommandBuilder().setName('ban').setDescription('Ban a user')
    .addUserOption(o=> o.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(o=> o.setName('reason').setDescription('Reason').setRequired(false))
    .addIntegerOption(o=> o.setName('days').setDescription('Days of messages to delete (0-7)').setRequired(false).setMinValue(0).setMaxValue(7))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || `Banned by ${interaction.user.tag}`;
    const days = interaction.options.getInteger('days') || 0;
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      const err = builders.buildErrorContainer('No Permission', 'You need BanMembers permission.');
      return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    if (user.id === interaction.user.id) {
      const err = builders.buildErrorContainer('Invalid', 'You cannot ban yourself.');
      return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    try {
      const member = await interaction.guild.members.fetch(user.id).catch(()=>null);
      if (member && !member.bannable) {
        const err = builders.buildErrorContainer('Cannot Ban', 'I cannot ban this user (role hierarchy).');
        return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      }
      await interaction.guild.members.ban(user.id, { reason, deleteMessageDays: days }).catch(e=>{ throw e; });
      const ok = new ContainerBuilder().setAccentColor(0xED4245)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.ban} User Banned`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**User:** ${user.tag} (\`${user.id}\`)\n**Moderator:** ${interaction.user}\n**Reason:** ${reason}\n**Messages Deleted:** \`${days} days\``))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
      await interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    } catch(e) {
      const err = builders.buildErrorContainer('Ban Failed', e.message.slice(0,1500));
      await interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
