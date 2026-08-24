// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, PermissionsBitField } = require('discord.js');
const builders = require('../../utils/builders');

module.exports = {
  async execute(interaction, client) {
    const id = interaction.customId;
    if (id === 'deleteall_cancel') {
      await interaction.update({ components: [new ContainerBuilder().setAccentColor(0x57F287).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.success} Cancelled\nDelete All operation cancelled.`)).addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)).addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`))], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      return;
    }
    if (id === 'deleteall_confirm') {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const err = builders.buildErrorContainer('No Permission', 'You need Administrator.');
        return interaction.reply({ components: [err], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
      }
      await interaction.deferUpdate().catch(()=>{});
      let deleted = 0, failed = 0;
      const channels = [...interaction.guild.channels.cache.values()];
      for (const ch of channels) {
        try {
          if (ch.id === interaction.channel.id) continue; // keep current channel for feedback?
          await ch.delete().catch(()=>{ throw new Error(); });
          deleted++;
        } catch { failed++; }
      }
      const result = new ContainerBuilder().setAccentColor(0xED4245)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.trash} Delete All Finished`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Deleted:** \`${deleted}\`\n**Failed:** \`${failed}\``))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
      await interaction.editReply({ components: [result], flags: MessageFlags.IsComponentsV2 }).catch(async ()=>{
        await interaction.followUp({ components: [result], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
        await interaction.channel.send({ components: [result], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      });
      // Also send in current channel if not deleted
      await interaction.channel.send({ components: [result], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
