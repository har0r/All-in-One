// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const builders = require('../../utils/builders');

module.exports = {
  data: new SlashCommandBuilder().setName('role').setDescription('Add a role to a user')
    .addUserOption(o=> o.setName('user').setDescription('User').setRequired(true))
    .addRoleOption(o=> o.setName('role').setDescription('Role to add').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    const user = interaction.options.getUser('user', true);
    const role = interaction.options.getRole('role', true);
    if (role.managed) {
      const err = builders.buildErrorContainer('Invalid Role', 'Cannot manage integration roles.');
      return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    if (interaction.guild.members.me.roles.highest.position <= role.position) {
      const err = builders.buildErrorContainer('Hierarchy', 'My role is not high enough to give this role.');
      return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    const member = await interaction.guild.members.fetch(user.id).catch(()=>null);
    if (!member) {
      const err = builders.buildErrorContainer('Not Found', 'Member not found.');
      return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    if (member.roles.cache.has(role.id)) {
      const err = builders.buildWarningContainer('Already Has Role', `${user.tag} already has ${role}.`);
      return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    try {
      await member.roles.add(role);
      const ok = new ContainerBuilder().setAccentColor(0x57F287)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.success} Role Added`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**User:** ${user.tag} (\`${user.id}\`)\n**Role:** ${role} (\`${role.id}\`)\n**Moderator:** ${interaction.user}`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
      await interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    } catch(e) {
      const err = builders.buildErrorContainer('Failed', e.message.slice(0,1500));
      await interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
