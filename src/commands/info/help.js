// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const builders = require('../../utils/builders');

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('Show help menu with all commands'),
  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.help} TechRoad Help • All-in-One`))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`Welcome to **TechRoad**! Prefix \`${client.prefix || '#'}help\` or use slash commands.`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${builders.emojis.info} Info (10):**\n\`help, ping, guide, serverinfo, userinfo, avatar, banner, invite, stats, uptime\``))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${builders.emojis.embed} Utility (8):**\n\`embed, say, come, poll, announce, afk, status, broadcast\``))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${builders.emojis.hammer} Moderation (22):**\n\`ban, unban, kick, timeout, untimeout, warn, warnings, clearwarn, clear, slowmode, lock, unlock, hide, unhide, hideall, unhideall, lockall, unlockall, deleteall, role, rrole, nickname\``))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${builders.emojis.welcome} System (8):**\n\`welcome, autorole, autoline, verify, feedback, suggestions, logging, selfroles\``))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**🛡️ Protection:** \`protect\` — anti-spam, anti-link, anti-invite, honeypot`))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${builders.emojis.level} Leveling:** \`level, rank, leaderboard\``))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**💰 Economy:** \`daily, balance, economy\` • **${builders.emojis.ticket} Tickets:** \`ticket\` • **🎉 Giveaway:** \`giveaway\``))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER} • Prefix: \`${client.prefix || '#'}\` • Support: TechRoad`));

    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(async ()=>{
      await interaction.followUp({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    });
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
