// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize
} = require('discord.js');
const db = require('../utils/db');
const builders = require('../utils/builders');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isButton()) return;
    const id = interaction.customId;
    if (!id.startsWith('verify')) return;

    // verify button: verify or verify:<roleId> or verify_role_<id>
    try {
      const guildId = interaction.guildId;
      const verifyCfg = db.get(guildId, 'verify');
      if (!verifyCfg || !verifyCfg.roleId) {
        const err = builders.buildErrorContainer('Verification Not Setup', 'Verification system is not configured. Ask an admin to use `/verify`.');
        return interaction.reply({ components: [err], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
      }

      const roleId = verifyCfg.roleId;
      const role = interaction.guild.roles.cache.get(roleId);
      if (!role) {
        const err = builders.buildErrorContainer('Role Not Found', 'Verification role no longer exists. Contact admin.');
        return interaction.reply({ components: [err], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
      }

      // If button has selectable role? spec says role selectable -> maybe verify panel with selectable roleId encoded
      let targetRoleId = roleId;
      if (id.includes(':')) {
        const parts = id.split(':');
        if (parts[1] && /^\d{17,19}$/.test(parts[1])) targetRoleId = parts[1];
      } else if (id.includes('_') && id !== 'verify') {
        const maybe = id.split('_').pop();
        if (/^\d{17,19}$/.test(maybe)) targetRoleId = maybe;
      }
      const targetRole = interaction.guild.roles.cache.get(targetRoleId) || role;

      const member = interaction.member;
      if (member.roles.cache.has(targetRole.id)) {
        const already = new ContainerBuilder().setAccentColor(0xFEE75C)
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.warning} Already Verified\nYou already have ${targetRole}.`))
          .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
        return interaction.reply({ components: [already], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
      }

      await member.roles.add(targetRole).catch(e => { throw new Error(`Missing permissions: ${e.message}`); });

      const success = new ContainerBuilder().setAccentColor(0x57F287)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.success} Verified!\nYou have been given ${targetRole}. Welcome to **${interaction.guild.name}**!`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
      return interaction.reply({ components: [success], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
    } catch (e) {
      const err = builders.buildErrorContainer('Verification Failed', e.message.slice(0, 1500));
      if (interaction.replied || interaction.deferred) await interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      else await interaction.reply({ components: [err], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
