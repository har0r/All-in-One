// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const builders = require('../../utils/builders');
const db = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Create and manage embeds (TechRoad-style)')
    .addSubcommand(s => s.setName('create').setDescription('Create a new embed via modal'))
    .addSubcommand(s => s.setName('disable').setDescription('Disable embed buttons').addStringOption(o=>o.setName('message_id').setDescription('Message ID to disable').setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'disable') {
      const msgId = interaction.options.getString('message_id');
      await interaction.deferReply({ flags: MessageFlags.IsComponentsV2, ephemeral: true }).catch(()=>{});
      try {
        const msg = await interaction.channel.messages.fetch(msgId).catch(()=>null);
        if (!msg) {
          const err = builders.buildErrorContainer('Not Found', 'Message not found in this channel.');
          return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
        }
        // Remove components / disable
        const disabledRows = msg.components.map(row => {
          const newRow = ActionRowBuilder.from(row);
          newRow.components.forEach(c => { try { c.setDisabled(true); } catch {} });
          return newRow;
        });
        await msg.edit({ components: disabledRows }).catch(()=>{});
        const ok = builders.buildSuccessContainer('Disabled', `Buttons disabled for message \`${msgId}\`.`);
        return interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      } catch(e) {
        const err = builders.buildErrorContainer('Error', e.message.slice(0,1500));
        return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      }
    }

    // create -> modal
    const modal = new ModalBuilder().setCustomId(`embed_modal:${interaction.user.id}`).setTitle('Create Embed - TechRoad');
    const titleInput = new TextInputBuilder().setCustomId('title').setLabel('Title').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(256).setPlaceholder('Embed title');
    const descInput = new TextInputBuilder().setCustomId('description').setLabel('Description').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(3000).setPlaceholder('Embed description (supports markdown)');
    const colorInput = new TextInputBuilder().setCustomId('color').setLabel('Color (hex e.g. #2F3136 or 3092790)').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('#2F3136');
    const footerInput = new TextInputBuilder().setCustomId('footer').setLabel('Footer (optional)').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('TechRoad • All Rights Reserved');
    const imageInput = new TextInputBuilder().setCustomId('image').setLabel('Image URL (optional)').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('https://...');

    modal.addComponents(
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(descInput),
      new ActionRowBuilder().addComponents(colorInput),
      new ActionRowBuilder().addComponents(footerInput),
      new ActionRowBuilder().addComponents(imageInput)
    );
    await interaction.showModal(modal).catch(()=>{});
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
