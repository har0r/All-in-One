// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const builders = require('../../utils/builders');
const config = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder().setName('invite').setDescription('Get bot invite link'),
  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    const perms = PermissionsBitField.Flags.Administrator;
    const invite = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=${perms}&scope=bot%20applications.commands`;
    const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.invite} Invite • TechRoad`))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`Add **TechRoad All-in-One** to your server!`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Invite Link:**\n${invite}`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel('Invite TechRoad').setStyle(ButtonStyle.Link).setURL(invite));
    await interaction.editReply({ components: [container, row], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
