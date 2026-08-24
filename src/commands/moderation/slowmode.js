// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const builders = require('../../utils/builders');

module.exports = {
  data: new SlashCommandBuilder().setName('slowmode').setDescription('Set slowmode for channel')
    .addIntegerOption(o=> o.setName('seconds').setDescription('Seconds (0 to disable, max 21600)').setRequired(true).setMinValue(0).setMaxValue(21600))
    .addChannelOption(o=> o.setName('channel').setDescription('Channel (default current)').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    const seconds = interaction.options.getInteger('seconds', true);
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    if (!channel.isTextBased()) {
      const err = builders.buildErrorContainer('Invalid Channel', 'Channel must be text-based.');
      return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    try {
      await channel.setRateLimitPerUser(seconds, `Slowmode by ${interaction.user.tag}`).catch(e=>{ throw e; });
      const ok = new ContainerBuilder().setAccentColor(seconds ? 0xFEE75C : 0x57F287)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.slowmode} Slowmode ${seconds ? 'Enabled' : 'Disabled'}`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Channel:** ${channel}\n**Duration:** \`${seconds}s\``))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
      await interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    } catch(e) {
      const err = builders.buildErrorContainer('Failed', e.message.slice(0,1500));
      await interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
