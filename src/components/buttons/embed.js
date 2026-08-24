// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const builders = require('../../utils/builders');

module.exports = {
  async execute(interaction, client) {
    const id = interaction.customId; // e.g. embed_edit:123, embed_delete:123, embed_disable:123, embed_info:123
    const [prefix, target] = id.split(':');
    // Actually split by _ and :
    // Format: embed_edit:<stable>
    const action = id.split(':')[0]; // embed_edit
    const stable = id.split(':')[1] || 'unknown';

    if (action === 'embed_edit' || id.startsWith('embed_edit')) {
      // Show edit modal prefilled? For simplicity show fresh modal but handle as edit (delete+resend)
      const modal = new ModalBuilder().setCustomId(`embed_edit:${interaction.message.id}:${stable}`).setTitle('Edit Embed - TechRoad');
      const titleInput = new TextInputBuilder().setCustomId('title').setLabel('Title').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(256);
      const descInput = new TextInputBuilder().setCustomId('description').setLabel('Description').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(3000);
      const colorInput = new TextInputBuilder().setCustomId('color').setLabel('Color').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('#2F3136');
      const footerInput = new TextInputBuilder().setCustomId('footer').setLabel('Footer').setStyle(TextInputStyle.Short).setRequired(false);
      const imageInput = new TextInputBuilder().setCustomId('image').setLabel('Image URL').setStyle(TextInputStyle.Short).setRequired(false);
      modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(descInput),
        new ActionRowBuilder().addComponents(colorInput),
        new ActionRowBuilder().addComponents(footerInput),
        new ActionRowBuilder().addComponents(imageInput)
      );
      await interaction.showModal(modal).catch(()=>{});
      return;
    }

    if (action === 'embed_delete' || id.startsWith('embed_delete')) {
      await interaction.deferUpdate().catch(()=>{});
      try {
        await interaction.message.delete().catch(()=>{});
      } catch {}
      return;
    }

    if (action === 'embed_disable' || id.startsWith('embed_disable')) {
      await interaction.deferUpdate().catch(()=>{});
      try {
        const rows = interaction.message.components.map(row => {
          const newRow = ActionRowBuilder.from(row);
          newRow.components.forEach(c=> { try{ c.setDisabled(true);}catch{} });
          return newRow;
        });
        await interaction.message.edit({ components: rows }).catch(()=>{});
        // Send ephemeral confirmation via followUp? Can't as deferUpdate doesn't allow reply? Use followUp
        await interaction.followUp({ components: [builders.buildSuccessContainer('Disabled', 'Buttons disabled.')], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
      } catch {}
      return;
    }

    if (action === 'embed_info' || id.startsWith('embed_info')) {
      const info = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.info} Embed Info`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Message ID:** \`${interaction.message.id}\`\n**Channel:** ${interaction.channel}\n**Stable ID:** \`${stable}\`\n**Created:** <t:${Math.floor(interaction.message.createdTimestamp/1000)}:F>`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
      await interaction.reply({ components: [info], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
      return;
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
