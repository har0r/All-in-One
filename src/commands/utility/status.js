// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActivityType } = require('discord.js');
const builders = require('../../utils/builders');

module.exports = {
  data: new SlashCommandBuilder().setName('status').setDescription('Set bot status (owner only)')
    .addStringOption(o=> o.setName('type').setDescription('Activity type').setRequired(true).addChoices(
      { name: 'Playing', value: 'Playing' },
      { name: 'Watching', value: 'Watching' },
      { name: 'Listening', value: 'Listening' },
      { name: 'Competing', value: 'Competing' }
    ))
    .addStringOption(o=> o.setName('text').setDescription('Status text').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2, ephemeral: true }).catch(()=>{});
    const config = require('../../config.json');
    const owners = config.owners || [config.owner];
    if (!owners.includes(interaction.user.id)) {
      const err = builders.buildErrorContainer('No Permission', 'Only bot owners can change status.');
      return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    const typeStr = interaction.options.getString('type', true);
    const text = interaction.options.getString('text', true);
    const map = { Playing: ActivityType.Playing, Watching: ActivityType.Watching, Listening: ActivityType.Listening, Competing: ActivityType.Competing };
    try {
      client.user.setPresence({ activities: [{ name: text, type: map[typeStr] }], status: 'online' });
      const ok = builders.buildSuccessContainer('Status Updated', `Activity set to **${typeStr} ${text}**`);
      await interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    } catch(e) {
      const err = builders.buildErrorContainer('Failed', e.message.slice(0,1000));
      await interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
