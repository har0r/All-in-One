// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';
const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const db = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder().setName('balance').setDescription('Check your coins').addUserOption(o=>o.setName('user').setDescription('User').setRequired(false)),
  async execute(interaction, client) {
    const enabled = db.get(interaction.guild.id, 'economy_enabled');
    if (!enabled) {
      const c=new ContainerBuilder().setAccentColor(0xED4245).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 💰 Economy Disabled\nEnable with \`/economy toggle\``));
      return interaction.reply({components:[c], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2});
    }
    const user = interaction.options.getUser('user') || interaction.user;
    const data = db.get(interaction.guild.id, `economy_${user.id}`) || { coins: 0 };
    const c=new ContainerBuilder().setAccentColor(0x2F3136)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 💰 Balance • ${user.tag}`))
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Coins:** \`${data.coins}\``));
    await interaction.reply({components:[c], flags: MessageFlags.IsComponentsV2});
  }
};
// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
