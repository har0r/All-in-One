// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const builders = require('../../utils/builders');

module.exports = {
  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2, ephemeral: true }).catch(()=>{});
    const parts = interaction.customId.split(':');
    const channelId = parts[1];
    const channel = interaction.guild.channels.cache.get(channelId) || await interaction.guild.channels.fetch(channelId).catch(()=>null) || interaction.channel;
    const title = interaction.fields.getTextInputValue('title');
    const desc = interaction.fields.getTextInputValue('description');
    const image = interaction.fields.getTextInputValue('image')?.trim();
    const colorRaw = interaction.fields.getTextInputValue('color')?.trim();
    let color = builders.BRAND_COLOR;
    if (colorRaw) {
      if (colorRaw.startsWith('#')) {
        const p = parseInt(colorRaw.slice(1),16);
        if (!isNaN(p)) color = p;
      } else {
        const p = parseInt(colorRaw,10);
        if (!isNaN(p)) color = p;
      }
    }
    const container = new ContainerBuilder().setAccentColor(color)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent('@everyone'))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.announce} ${title}`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(desc))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`Announced by ${interaction.user} • -# ${builders.BRAND_FOOTER}`));
    if (image && /^https?:\/\//.test(image)) {
      try {
        const { MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
        container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(image).setDescription(title)));
      } catch {}
    }
    try {
      await channel.send({ components: [container], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: ['everyone'] } }).catch(e=>{ throw e; });
      const ok = builders.buildSuccessContainer('Announced', `Announcement sent in ${channel}.`);
      await interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    } catch(e) {
      const err = builders.buildErrorContainer('Failed', cleanError(e.message).slice(0,1500));
      await interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
