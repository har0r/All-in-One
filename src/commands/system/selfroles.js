// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const builders = require('../../utils/builders');
const db = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder().setName('selfroles').setDescription('Create selfroles panels (buttons/select max4)')
    .addSubcommand(s=> s.setName('create').setDescription('Create selfroles via modal'))
    .addSubcommand(s=> s.setName('list').setDescription('List selfroles panels'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    if (sub === 'list') {
      await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      const cfg = db.get(guildId, 'selfroles') || [];
      if (!cfg.length) {
        const info = builders.buildInfoContainer({ title: 'Selfroles', description: 'No panels created. Use `/selfroles create`.', emoji: builders.emojis.selfroles });
        return interaction.editReply({ components: [info], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      }
      const list = cfg.map((p,i)=> `**${i+1}.** Channel: <#${p.channelId}> • Message: \`${p.messageId}\` • Roles: ${p.roles.map(r=>`<@&${r}>`).join(', ')}`).join('\n');
      const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.selfroles} Selfroles Panels`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(list.slice(0,3000)))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
      return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    if (sub === 'create') {
      const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
      const modal = new ModalBuilder().setCustomId(`selfroles_modal:${interaction.user.id}`).setTitle('Selfroles - TechRoad (max 4 roles)');
      const titleInput = new TextInputBuilder().setCustomId('title').setLabel('Panel Title').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Choose your roles');
      const descInput = new TextInputBuilder().setCustomId('description').setLabel('Description').setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder('Select roles via buttons/select menu');
      const rolesInput = new TextInputBuilder().setCustomId('roles').setLabel('Role IDs (comma separated, max 4)').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('123456789012345678, 234567890123456789');
      const typeInput = new TextInputBuilder().setCustomId('type').setLabel('Type: buttons or select').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('buttons or select');
      modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(descInput),
        new ActionRowBuilder().addComponents(rolesInput),
        new ActionRowBuilder().addComponents(typeInput)
      );
      await interaction.showModal(modal).catch(()=>{});
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
