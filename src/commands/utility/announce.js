// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('announce').setDescription('Send an announcement (modal)')
    .addChannelOption(o=> o.setName('channel').setDescription('Channel to announce in').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction, client) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const modal = new ModalBuilder().setCustomId(`announce_modal:${channel.id}:${interaction.user.id}`).setTitle('Announce - TechRoad');
    const title = new TextInputBuilder().setCustomId('title').setLabel('Title').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(256).setPlaceholder('Announcement title');
    const desc = new TextInputBuilder().setCustomId('description').setLabel('Description').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(3000).setPlaceholder('Announcement content');
    const image = new TextInputBuilder().setCustomId('image').setLabel('Image URL (optional)').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('https://...');
    const color = new TextInputBuilder().setCustomId('color').setLabel('Color (optional)').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('#2F3136');
    modal.addComponents(
      new ActionRowBuilder().addComponents(title),
      new ActionRowBuilder().addComponents(desc),
      new ActionRowBuilder().addComponents(image),
      new ActionRowBuilder().addComponents(color)
    );
    await interaction.showModal(modal).catch(()=>{});
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
