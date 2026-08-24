// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('ticket').setDescription('Ticket system')
    .addSubcommand(s=> s.setName('setup').setDescription('Setup ticket panel (opens a form)')
      .addChannelOption(o=> o.setName('channel').setDescription('Channel to send panel').setRequired(true).addChannelTypes(ChannelType.GuildText))
    )
    .addSubcommand(s=> s.setName('close').setDescription('Close current ticket'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'close') {
      const db = require('../../utils/db');
      const builders = require('../../utils/builders');
      await interaction.deferReply({ flags: MessageFlags.IsComponentsV2, ephemeral: true }).catch(()=>{});
      const ticketData = db.get(interaction.guild.id, 'tickets');
      if (!ticketData || !ticketData.channels || !ticketData.channels.includes(interaction.channel.id)) {
        const err = builders.buildErrorContainer('Not a Ticket', 'This channel is not a ticket.');
        return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      }
      const ok = builders.buildSuccessContainer('Ticket Closing', 'Closing ticket in 3 seconds...');
      await interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      setTimeout(()=> interaction.channel.delete().catch(()=>{}), 3000);
      return;
    }
    // setup -> open form
    const channel = interaction.options.getChannel('channel', true);
    const modal = new ModalBuilder()
      .setCustomId(`ticket_setup:${channel.id}:${interaction.user.id}`)
      .setTitle('Ticket Panel');
    const title = new TextInputBuilder().setCustomId('title').setLabel('Panel title').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100).setValue('TechRoad Tickets');
    const desc = new TextInputBuilder().setCustomId('description').setLabel('Panel description').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1500).setPlaceholder('Explain when members should open a ticket...');
    modal.addComponents(new ActionRowBuilder().addComponents(title), new ActionRowBuilder().addComponents(desc));
    await interaction.showModal(modal).catch(()=>{});
  }
};
// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
