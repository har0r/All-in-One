// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const builders = require('../../utils/builders');
const db = require('../../utils/db');

module.exports = {
  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2, ephemeral: true }).catch(()=>{});
    const parts = interaction.customId.split(':');
    const channelId = parts[1];
    const channel = interaction.guild.channels.cache.get(channelId) || await interaction.guild.channels.fetch(channelId).catch(()=>null);
    if (!channel) {
      const err = builders.buildErrorContainer('Channel Missing', 'The target channel no longer exists.');
      return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    const title = interaction.fields.getTextInputValue('title').trim();
    const desc = interaction.fields.getTextInputValue('description').trim();

    const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${title}`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(desc))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Categories:** Report 🔴 • Support 🛠️ • General 💬 • Partnership 🤝`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER} • Select a category`));
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_create:report').setLabel('Report').setEmoji('🚨').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('ticket_create:support').setLabel('Support').setEmoji('🛠️').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('ticket_create:general').setLabel('General').setEmoji('💬').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('ticket_create:partnership').setLabel('Partnership').setEmoji('🤝').setStyle(ButtonStyle.Success)
    );
    try {
      const msg = await channel.send({ components: [container, row], flags: MessageFlags.IsComponentsV2 }).catch(e=>{ throw e; });
      let cfg = db.get(interaction.guild.id, 'tickets') || { panelMessage: null, panelChannel: null, channels: [] };
      cfg.panelMessage = msg.id;
      cfg.panelChannel = channel.id;
      db.set(interaction.guild.id, 'tickets', cfg);
      const ok = builders.buildSuccessContainer('Ticket Panel Created', `Panel posted in ${channel}.`);
      await interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    } catch(e) {
      const err = builders.buildErrorContainer('Failed', e.message.slice(0,1500));
      await interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
  }
};
// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
