// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const builders = require('../../utils/builders');

module.exports = {
  async execute(interaction, client) {
    // customId: selfroles:<roleId>
    const roleId = interaction.customId.split(':')[1] || interaction.customId.split('_')[1];
    if (!roleId || !/^\d{17,19}$/.test(roleId)) {
      const err = builders.buildErrorContainer('Invalid', 'Role not found.');
      return interaction.reply({ components: [err], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
    }
    const role = interaction.guild.roles.cache.get(roleId);
    if (!role) {
      const err = builders.buildErrorContainer('Not Found', 'Role no longer exists.');
      return interaction.reply({ components: [err], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
    }
    if (interaction.guild.members.me.roles.highest.position <= role.position) {
      const err = builders.buildErrorContainer('Hierarchy', 'I cannot manage this role.');
      return interaction.reply({ components: [err], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
    }
    try {
      const member = interaction.member;
      const has = member.roles.cache.has(roleId);
      if (has) await member.roles.remove(roleId).catch(e=>{ throw e; });
      else await member.roles.add(roleId).catch(e=>{ throw e; });
      const container = new ContainerBuilder().setAccentColor(has ? 0xED4245 : 0x57F287)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${has ? builders.emojis.minus + ' Removed' : builders.emojis.plus + ' Added'} • ${role.name}`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(has ? `Removed ${role} from you.` : `Added ${role} to you.`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
      await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
    } catch(e) {
      const err = builders.buildErrorContainer('Failed', e.message.slice(0,1500));
      await interaction.reply({ components: [err], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
