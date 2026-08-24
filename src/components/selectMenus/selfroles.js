// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const builders = require('../../utils/builders');

module.exports = {
  async execute(interaction, client) {
    // customId selfroles_select:<roleIds> values = selected role ids
    const selected = interaction.values; // array of role ids chosen
    const customId = interaction.customId;
    const allIds = customId.split(':')[1]?.split(',').filter(id=> /^\d{17,19}$/.test(id)) || [];
    const member = interaction.member;
    let added = [], removed = [];
    try {
      for (const roleId of allIds) {
        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) continue;
        const shouldHave = selected.includes(roleId);
        const has = member.roles.cache.has(roleId);
        if (shouldHave && !has) {
          if (interaction.guild.members.me.roles.highest.position <= role.position) continue;
          await member.roles.add(roleId).catch(()=>{});
          added.push(role.name);
        } else if (!shouldHave && has) {
          await member.roles.remove(roleId).catch(()=>{});
          removed.push(role.name);
        }
      }
      const desc = [];
      if (added.length) desc.push(`**Added:** ${added.join(', ')}`);
      if (removed.length) desc.push(`**Removed:** ${removed.join(', ')}`);
      if (!desc.length) desc.push('No changes (already synced).');
      const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.selfroles} Selfroles Updated`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(desc.join('\n')))
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
