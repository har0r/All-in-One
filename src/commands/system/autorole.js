// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const builders = require('../../utils/builders');
const db = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder().setName('autorole').setDescription('Configure autorole for humans/bots')
    .addSubcommand(s=> s.setName('humans').setDescription('Set autorole for humans').addRoleOption(o=> o.setName('role').setDescription('Role to give').setRequired(true)))
    .addSubcommand(s=> s.setName('bots').setDescription('Set autorole for bots').addRoleOption(o=> o.setName('role').setDescription('Role to give').setRequired(true)))
    .addSubcommand(s=> s.setName('remove').setDescription('Remove autorole').addStringOption(o=> o.setName('type').setDescription('Type').setRequired(true).addChoices({name:'humans',value:'humans'},{name:'bots',value:'bots'})).addRoleOption(o=> o.setName('role').setDescription('Role to remove (leave empty to clear all)').setRequired(false)))
    .addSubcommand(s=> s.setName('list').setDescription('List autoroles'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    let cfg = db.get(guildId, 'autorole') || { humans: [], bots: [] };
    if (!Array.isArray(cfg.humans)) cfg.humans = [];
    if (!Array.isArray(cfg.bots)) cfg.bots = [];

    if (sub === 'humans') {
      const role = interaction.options.getRole('role', true);
      if (!cfg.humans.includes(role.id)) cfg.humans.push(role.id);
      db.set(guildId, 'autorole', cfg);
      const ok = builders.buildSuccessContainer('Autorole Set', `Humans will now receive ${role}.`);
      return interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    if (sub === 'bots') {
      const role = interaction.options.getRole('role', true);
      if (!cfg.bots.includes(role.id)) cfg.bots.push(role.id);
      db.set(guildId, 'autorole', cfg);
      const ok = builders.buildSuccessContainer('Autorole Set', `Bots will now receive ${role}.`);
      return interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    if (sub === 'remove') {
      const type = interaction.options.getString('type', true);
      const role = interaction.options.getRole('role');
      if (!role) {
        cfg[type] = [];
        db.set(guildId, 'autorole', cfg);
        const ok = builders.buildSuccessContainer('Cleared', `Cleared all autoroles for **${type}**.`);
        return interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      }
      cfg[type] = cfg[type].filter(id=> id !== role.id);
      db.set(guildId, 'autorole', cfg);
      const ok = builders.buildSuccessContainer('Removed', `Removed ${role} from **${type}** autorole.`);
      return interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    if (sub === 'list') {
      const humans = cfg.humans.length ? cfg.humans.map(id=> `<@&${id}>`).join(', ') : 'None';
      const bots = cfg.bots.length ? cfg.bots.map(id=> `<@&${id}>`).join(', ') : 'None';
      const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.autorole} Autorole Config`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Humans:** ${humans}\n**Bots:** ${bots}`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
      return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
