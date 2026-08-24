// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ChannelType } = require('discord.js');
const builders = require('../../utils/builders');
const db = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder().setName('suggestions').setDescription('Configure suggestions channel')
    .addSubcommand(s=> s.setName('set').setDescription('Set suggestions channel').addChannelOption(o=> o.setName('channel').setDescription('Channel').setRequired(true).addChannelTypes(ChannelType.GuildText)))
    .addSubcommand(s=> s.setName('disable').setDescription('Disable'))
    .addSubcommand(s=> s.setName('status').setDescription('Show status'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    if (sub === 'set') {
      const ch = interaction.options.getChannel('channel', true);
      db.set(guildId, 'suggestions', { channelId: ch.id, enabled: true });
      const ok = builders.buildSuccessContainer('Suggestions Set', `Suggestions channel set to ${ch}. Messages auto-convert with Accept/Reject.`);
      return interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    if (sub === 'disable') {
      db.del(guildId, 'suggestions');
      const ok = builders.buildSuccessContainer('Disabled', 'Suggestions disabled.');
      return interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    if (sub === 'status') {
      const cfg = db.get(guildId, 'suggestions');
      if (!cfg) {
        const info = builders.buildInfoContainer({ title: 'Suggestions Status', description: 'Not configured.', emoji: builders.emojis.suggestions });
        return interaction.editReply({ components: [info], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      }
      const ch = interaction.guild.channels.cache.get(cfg.channelId);
      const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
      const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.suggestions} Suggestions Status`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Channel:** ${ch || `\`${cfg.channelId}\``}`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
      return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
