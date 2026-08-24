// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, PermissionsBitField } = require('discord.js');
const builders = require('../../utils/builders');

module.exports = {
  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      const err = builders.buildErrorContainer('No Permission', 'You need ManageMessages to handle feedback.');
      return interaction.reply({ components: [err], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
    }
    const [action, authorId] = interaction.customId.split(':');
    const isAccept = action.includes('accept');
    try {
      let originalDesc = 'Feedback';
      try {
        const json = interaction.message.components[0].toJSON ? interaction.message.components[0].toJSON() : interaction.message.components[0];
        if (json && json.components) {
          const txt = json.components.find(c=> c.content && c.content.includes('New Feedback'));
          if (txt) originalDesc = txt.content.slice(0,2000);
        }
      } catch {}
      const newContainer = new ContainerBuilder().setAccentColor(isAccept ? 0x57F287 : 0xED4245)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(isAccept ? `## ${builders.emojis.success} Feedback Accepted` : `## ${builders.emojis.error} Feedback Rejected`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(originalDesc))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${isAccept? '✅':'❌'} Handled by ${interaction.user}`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
      await interaction.update({ components: [newContainer], flags: MessageFlags.IsComponentsV2 }).catch(async ()=>{
        await interaction.reply({ components: [newContainer], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
      });
      try {
        const author = await client.users.fetch(authorId).catch(()=>null);
        if (author) {
          const dmContainer = new ContainerBuilder().setAccentColor(isAccept?0x57F287:0xED4245)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(isAccept? `## ✅ Your feedback was accepted!` : `## ❌ Your feedback was rejected`))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`Guild: **${interaction.guild.name}**`))
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
          await author.send({ components: [dmContainer], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
        }
      } catch {}
    } catch(e) {
      const err = builders.buildErrorContainer('Failed', e.message.slice(0,1000));
      await interaction.reply({ components: [err], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
