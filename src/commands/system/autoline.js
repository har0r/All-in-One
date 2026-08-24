// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ChannelType } = require('discord.js');
const builders = require('../../utils/builders');
const db = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder().setName('autoline').setDescription('Turn a channel into a media channel (images & videos only)')
    .addSubcommand(s=> s.setName('set').setDescription('Set the media channel').addChannelOption(o=> o.setName('channel').setDescription('Channel').setRequired(true).addChannelTypes(ChannelType.GuildText)))
    .addSubcommand(s=> s.setName('disable').setDescription('Disable media mode'))
    .addSubcommand(s=> s.setName('status').setDescription('Show media channel status'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    if (sub === 'set') {
      const ch = interaction.options.getChannel('channel', true);
      db.set(guildId, 'autoline', { channelId: ch.id, enabled: true });
      const ok = builders.buildSuccessContainer('Media Channel Set', `${ch} is now a **media channel**.\nAnything that is not an image or video gets deleted automatically.`);
      return interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    if (sub === 'disable') {
      db.del(guildId, 'autoline');
      const ok = builders.buildSuccessContainer('Disabled', 'Media channel mode is off.');
      return interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    if (sub === 'status') {
      const cfg = db.get(guildId, 'autoline');
      if (!cfg) {
        const info = builders.buildInfoContainer({ title: 'Media Channel', description: 'Not configured. Use `/autoline set`.', emoji: builders.emojis.autoline });
        return interaction.editReply({ components: [info], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      }
      const ch = interaction.guild.channels.cache.get(cfg.channelId);
      const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.autoline} Media Channel`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Channel:** ${ch || `\`${cfg.channelId}\``}\n**Mode:** images & videos only\n**Enabled:** \`${cfg.enabled}\``))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
      return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
  }
};
// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
