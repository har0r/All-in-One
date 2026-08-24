// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const builders = require('../../utils/builders');
const db = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder().setName('verify').setDescription('Setup verification (button only)')
    .addRoleOption(o=> o.setName('role').setDescription('Role to give on verify').setRequired(true))
    .addChannelOption(o=> o.setName('channel').setDescription('Channel to send panel in').setRequired(false))
    .addStringOption(o=> o.setName('title').setDescription('Panel title').setRequired(false))
    .addStringOption(o=> o.setName('description').setDescription('Panel description').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2, ephemeral: true }).catch(()=>{});
    const role = interaction.options.getRole('role', true);
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const title = interaction.options.getString('title') || 'Verification';
    const desc = interaction.options.getString('description') || `Click the button below to verify and get ${role}.`;
    if (role.managed || interaction.guild.members.me.roles.highest.position <= role.position) {
      const err = builders.buildErrorContainer('Invalid Role', 'I cannot give this role (hierarchy/managed).');
      return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    db.set(interaction.guild.id, 'verify', { roleId: role.id, channelId: channel.id });
    const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.verify} ${title}`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(desc))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Role:** ${role}`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER} • Click Verify to get access`));
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`verify:${role.id}`).setLabel('Verify').setStyle(ButtonStyle.Success).setEmoji('✅'));
    try {
      const msg = await channel.send({ components: [container, row], flags: MessageFlags.IsComponentsV2 }).catch(e=>{ throw e; });
      const ok = builders.buildSuccessContainer('Verify Panel Sent', `Verification panel sent in ${channel} for ${role}.\nMessage ID: \`${msg.id}\``);
      await interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    } catch(e) {
      const err = builders.buildErrorContainer('Failed', e.message.slice(0,1500));
      await interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
