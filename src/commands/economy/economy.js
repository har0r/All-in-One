// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';
const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('economy')
    .setDescription('Toggle economy system')
    .addSubcommand(s=>s.setName('toggle').setDescription('Toggle economy on/off'))
    .addSubcommand(s=>s.setName('status').setDescription('Show economy status'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    if (sub === 'toggle') {
      const cur = db.get(guildId, 'economy_enabled') || false;
      const next = !cur;
      db.set(guildId, 'economy_enabled', next);
      const c=new ContainerBuilder().setAccentColor(next?0x57F287:0xED4245)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${next?'💰 Economy Enabled':'👥 Community Mode'}\n${next?'Shop/store features are now active.':'Economy disabled for community.'}`));
      return interaction.reply({components:[c], flags: MessageFlags.IsComponentsV2});
    }
    if (sub === 'status') {
      const enabled = db.get(guildId, 'economy_enabled') || false;
      const c=new ContainerBuilder().setAccentColor(0x2F3136)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Economy Status\n**Enabled:** \`${enabled?'Yes 💰':'No 👥'}\``))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(enabled?'Use `/daily` `/balance`':'Enable with `/economy toggle`'));
      return interaction.reply({components:[c], flags: MessageFlags.IsComponentsV2});
    }
  }
};
// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
