// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ChannelType } = require('discord.js');
const builders = require('../../utils/builders');
const db = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder().setName('feedback').setDescription('Configure feedback channel (auto embed + buttons)')
    .addSubcommand(s=> s.setName('set').setDescription('Set feedback channel').addChannelOption(o=> o.setName('channel').setDescription('Channel').setRequired(true).addChannelTypes(ChannelType.GuildText)))
    .addSubcommand(s=> s.setName('disable').setDescription('Disable feedback'))
    .addSubcommand(s=> s.setName('status').setDescription('Show status'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    if (sub === 'set') {
      const ch = interaction.options.getChannel('channel', true);
      db.set(guildId, 'feedback', { channelId: ch.id, enabled: true });
      const ok = builders.buildSuccessContainer('Feedback Set', `Feedback channel set to ${ch}. Messages there will auto-convert to embeds with Accept/Reject buttons.`);
      return interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    if (sub === 'disable') {
      db.del(guildId, 'feedback');
      const ok = builders.buildSuccessContainer('Disabled', 'Feedback disabled.');
      return interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    if (sub === 'status') {
      const cfg = db.get(guildId, 'feedback');
      if (!cfg) {
        const info = builders.buildInfoContainer({ title: 'Feedback Status', description: 'Not configured.', emoji: builders.emojis.feedback });
        return interaction.editReply({ components: [info], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      }
      const ch = interaction.guild.channels.cache.get(cfg.channelId);
      const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
      const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.feedback} Feedback Status`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Channel:** ${ch || `\`${cfg.channelId}\``}\n**Enabled:** \`${cfg.enabled}\``))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
      return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
