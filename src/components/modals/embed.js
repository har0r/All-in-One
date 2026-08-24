// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const builders = require('../../utils/builders');

module.exports = {
  async execute(interaction, client) {
    // Handles embed_modal and embed_edit
    const id = interaction.customId;
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2, ephemeral: true }).catch(()=>{});

    const title = interaction.fields.getTextInputValue('title')?.trim();
    const description = interaction.fields.getTextInputValue('description')?.trim();
    const colorRaw = interaction.fields.getTextInputValue('color')?.trim();
    const footer = interaction.fields.getTextInputValue('footer')?.trim();
    const image = interaction.fields.getTextInputValue('image')?.trim();

    let color = builders.BRAND_COLOR;
    if (colorRaw) {
      if (colorRaw.startsWith('#')) {
        const parsed = parseInt(colorRaw.slice(1), 16);
        if (!isNaN(parsed)) color = parsed;
      } else {
        const parsed = parseInt(colorRaw, 10);
        if (!isNaN(parsed)) color = parsed;
      }
    }

    const isEdit = id.startsWith('embed_edit');
    let targetMessageId = null;
    if (isEdit) {
      const parts = id.split(':');
      targetMessageId = parts[1];
    }

    // Build container TechRoad-style
    const container = new ContainerBuilder().setAccentColor(color)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${title}`))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(description))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(footer ? `-# ${footer} • ${builders.BRAND_FOOTER}` : `-# ${builders.BRAND_FOOTER}`));

    if (image && /^https?:\/\/.+\.(png|jpg|jpeg|gif|webp)$/i.test(image)) {
      const { MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
      const gallery = new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(image).setDescription(title));
      container.addMediaGalleryComponents(gallery);
    } else if (image && /^https?:\/\//.test(image)) {
      // Still try to add as gallery
      try {
        const { MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
        const gallery = new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(image).setDescription(title));
        container.addMediaGalleryComponents(gallery);
      } catch {}
    }

    if (isEdit && targetMessageId) {
      try {
        const msg = await interaction.channel.messages.fetch(targetMessageId).catch(()=>null);
        if (msg) {
          // Delete and resend (no edited tag)
          await msg.delete().catch(()=>{});
          const sent = await interaction.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(e=>{ throw e; });
          const ok = builders.buildSuccessContainer('Embed Updated', `Resent in ${interaction.channel} — no edited tag.\nNew ID: \`${sent.id}\``);
          return interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
        }
      } catch(e) {
        const err = builders.buildErrorContainer('Edit Failed', e.message.slice(0,1500));
        return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      }
    }

    try {
      const sent = await interaction.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(e=>{ throw e; });
      const ok = builders.buildSuccessContainer('Embed Sent', `Sent clean in ${interaction.channel} — no buttons attached.\nMessage ID: \`${sent.id}\``);
      await interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    } catch(e) {
      const err = builders.buildErrorContainer('Send Failed', e.message.slice(0,1500));
      await interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
