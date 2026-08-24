// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const builders = require('../../utils/builders');

module.exports = {
  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      const err = builders.buildErrorContainer('No Permission', 'You need ManageMessages to handle suggestions.');
      return interaction.reply({ components: [err], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
    }
    const [action, authorId, msgId] = interaction.customId.split(':');
    const isAccept = action.includes('accept');
    const orig = interaction.message;
    // Update embed to show status
    try {
      const oldContainer = orig.components[0]; // ContainerBuilder raw? We'll reconstruct
      // Instead, create new status container based on content
      const content = orig.components[0]?.toJSON ? orig.components[0].toJSON() : null;
      // Simplistic: create new container with Accepted/Rejected
      const statusText = isAccept ? `✅ **Accepted** by ${interaction.user}` : `❌ **Rejected** by ${interaction.user}`;
      // Try to extract original suggestion text
      let originalDesc = 'Suggestion';
      try {
        // Attempt to get text from components JSON
        const json = orig.components[0].toJSON ? orig.components[0].toJSON() : orig.components[0];
        if (json && json.components) {
          const txt = json.components.find(c=> c.content && c.content.includes('New Suggestion'));
          if (txt) originalDesc = txt.content.slice(0,2000);
        }
      } catch {}
      const newContainer = new ContainerBuilder().setAccentColor(isAccept ? 0x57F287 : 0xED4245)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(isAccept ? `## ${builders.emojis.success} Suggestion Accepted` : `## ${builders.emojis.error} Suggestion Rejected`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(originalDesc))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(statusText))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
      await interaction.update({ components: [newContainer], flags: MessageFlags.IsComponentsV2 }).catch(async ()=>{
        await interaction.reply({ components: [newContainer], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
      });
      // Try DM author
      try {
        const author = await client.users.fetch(authorId).catch(()=>null);
        if (author) {
          const dmContainer = new ContainerBuilder().setAccentColor(isAccept?0x57F287:0xED4245)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(isAccept? `## ✅ Your suggestion was accepted!` : `## ❌ Your suggestion was rejected`))
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
