// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('broadcast')
    .setDescription('Send a DM to many members at once (all / online / offline)')
    .addStringOption(o => o.setName('target').setDescription('Who receives it').setRequired(true)
      .addChoices(
        { name: 'All members', value: 'all' },
        { name: 'Online members', value: 'online' },
        { name: 'Offline members', value: 'offline' }
      ))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    const target = interaction.options.getString('target', true);
    const modal = new ModalBuilder()
      .setCustomId(`broadcast_modal:${target}:${interaction.user.id}`)
      .setTitle(`Broadcast — ${target}`);
    const message = new TextInputBuilder().setCustomId('message').setLabel('Message to send')
      .setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1800)
      .setPlaceholder('Write the message members will receive in their DMs...');
    modal.addComponents(new ActionRowBuilder().addComponents(message));
    await interaction.showModal(modal).catch(()=>{});
  }
};
// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
