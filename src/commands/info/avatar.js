// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const builders = require('../../utils/builders');

module.exports = {
  data: new SlashCommandBuilder().setName('avatar').setDescription('Show user avatar')
    .addUserOption(o => o.setName('user').setDescription('User to check').setRequired(false)),
  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    const user = interaction.options.getUser('user') || interaction.user;
    const avatar = user.displayAvatarURL({ size: 1024, extension: 'png', forceStatic: false });
    const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.avatar} Avatar • ${user.tag}`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**User:** ${user} • \`${user.id}\``))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
    const { MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
    const gallery = new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(avatar).setDescription('Avatar'));
    container.addMediaGalleryComponents(gallery);
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel('Download').setStyle(ButtonStyle.Link).setURL(avatar));
    await interaction.editReply({ components: [container, row], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
