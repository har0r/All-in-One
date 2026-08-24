// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const db = require('../utils/db');

module.exports = {
  name: 'guildCreate',
  async execute(guild, client) {
    // Find a channel to send welcome + economy choice
    let channel = guild.systemChannel;
    if (!channel || !channel.isTextBased() || !channel.permissionsFor(guild.members.me)?.has('SendMessages')) {
      channel = guild.channels.cache.find(ch => ch.type === ChannelType.GuildText && ch.permissionsFor(guild.members.me)?.has('SendMessages'));
    }
    if (!channel) return;
    const container = new ContainerBuilder().setAccentColor(0x2F3136)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 👋 Thanks for adding TechRoad All-in-One!\nWelcome to **${guild.name}**`))
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Does your server need a currency/economy system?**\n-# This helps us configure the bot for your community.`))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Yes** → Shop/Store mode (economy, daily, balance, shop)\n**No** → Community mode (leveling, moderation, clean)`))
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# You can change this later with \`/economy toggle\``))
      .addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`economy_yes_${guild.id}`).setLabel('Yes, need economy').setStyle(ButtonStyle.Success).setEmoji('💰'),
        new ButtonBuilder().setCustomId(`economy_no_${guild.id}`).setLabel('No, community only').setStyle(ButtonStyle.Secondary).setEmoji('👥')
      ));
    await channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
  }
};
// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
