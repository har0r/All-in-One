// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';
const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const db = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder().setName('daily').setDescription('Claim daily coins (economy must be enabled)'),
  async execute(interaction, client) {
    const enabled = db.get(interaction.guild.id, 'economy_enabled');
    if (!enabled) {
      const c=new ContainerBuilder().setAccentColor(0xED4245)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 💰 Economy Disabled\nThis server is in **Community mode**. Enable economy for shop/store features.`))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`Use \`/economy toggle\` to enable.`));
      return interaction.reply({components:[c], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2});
    }
    const key = `economy_${interaction.guild.id}_${interaction.user.id}`;
    const now = Date.now();
    const data = db.get(interaction.guild.id, `economy_${interaction.user.id}`) || { coins: 0, dailyAt: 0 };
    const oneDay = 24*60*60*1000;
    if (now - data.dailyAt < oneDay) {
      const left = Math.ceil((oneDay - (now - data.dailyAt))/3600000);
      const c=new ContainerBuilder().setAccentColor(0xED4245).addTextDisplayComponents(new TextDisplayBuilder().setContent(`❌ Already claimed. Try again in \`${left}h\``));
      return interaction.reply({components:[c], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2});
    }
    const reward = 200 + Math.floor(Math.random()*100);
    data.coins += reward;
    data.dailyAt = now;
    db.set(interaction.guild.id, `economy_${interaction.user.id}`, data);
    const c=new ContainerBuilder().setAccentColor(0x57F287)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 💰 Daily Claimed\nYou got \`${reward}\` coins!`))
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Balance:** \`${data.coins}\` coins`));
    await interaction.reply({components:[c], flags: MessageFlags.IsComponentsV2});
  }
};
// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
