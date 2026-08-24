// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const builders = require('../../utils/builders');

module.exports = {
  async execute(interaction, client) {
    // customId embed_select:<stable>
    const value = interaction.values[0];
    if (value === 'thumb') {
      const container = builders.buildInfoContainer({ title: 'Thumbnail', description: 'To add a thumbnail, edit the embed and provide an image URL. Thumbnails are supported via Container media.', emoji: '🖼️' });
      return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
    }
    if (value === 'clone') {
      try {
        // Clone the embed message (delete+resend style)
        const msg = interaction.message;
        // Extract container
        const newComponents = msg.components;
        await interaction.channel.send({ components: newComponents, flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
        const ok = builders.buildSuccessContainer('Cloned', 'Embed cloned to this channel.');
        return interaction.reply({ components: [ok], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
      } catch(e) {
        const err = builders.buildErrorContainer('Clone Failed', e.message.slice(0,1000));
        return interaction.reply({ components: [err], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
      }
    }
    if (value === 'plain') {
      try {
        const msg = interaction.message;
        // Try to extract text from container
        let text = '';
        try {
          const json = msg.components[0].toJSON ? msg.components[0].toJSON() : msg.components[0];
          if (json && json.components) {
            text = json.components.filter(c=> c.content).map(c=> c.content).join('\n\n');
          }
        } catch {}
        await interaction.channel.send({ content: text.slice(0,4000) || 'No content', allowedMentions: { parse: [] } }).catch(()=>{});
        const ok = builders.buildSuccessContainer('Sent as Plain', 'Embed content sent as plain text.');
        return interaction.reply({ components: [ok], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
      } catch(e) {
        const err = builders.buildErrorContainer('Failed', e.message.slice(0,1000));
        return interaction.reply({ components: [err], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
      }
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
