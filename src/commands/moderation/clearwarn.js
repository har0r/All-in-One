// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const builders = require('../../utils/builders');
const db = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder().setName('clearwarn').setDescription('Clear warnings for a user')
    .addUserOption(o=> o.setName('user').setDescription('User to clear').setRequired(true))
    .addIntegerOption(o=> o.setName('index').setDescription('Warn index to remove (leave empty to clear all)').setRequired(false).setMinValue(1))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    const user = interaction.options.getUser('user', true);
    const index = interaction.options.getInteger('index');
    const key = `warns_${interaction.guild.id}_${user.id}`;
    let data = db.get(key) || [];
    if (!data.length) {
      const err = builders.buildInfoContainer({ title: 'No Warnings', description: `${user.tag} has no warnings.`, emoji: builders.emojis.info });
      return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    if (index) {
      if (index > data.length) {
        const err = builders.buildErrorContainer('Invalid Index', `User has only ${data.length} warnings.`);
        return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      }
      data.splice(index-1, 1);
      db.set(key, data);
      const ok = builders.buildSuccessContainer('Warn Removed', `Removed warn #${index} for ${user.tag}. Remaining: \`${data.length}\``);
      return interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    db.del(key);
    const ok = builders.buildSuccessContainer('Warnings Cleared', `Cleared all warnings for ${user.tag}.`);
    await interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
