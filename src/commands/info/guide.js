// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const builders = require('../../utils/builders');

module.exports = {
  data: new SlashCommandBuilder().setName('guide').setDescription('Show setup guide for TechRoad bot'),
  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.guide} TechRoad Setup Guide`))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`Everything **TechRoad All-in-One** can do, in order of setup.`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**1. System Setup**\n\`/welcome\` • \`/verify\` • \`/autorole\` • \`/autoline\` • \`/logging\``))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**2. Utility**\n\`/embed\` (modal + 4 buttons/select) • \`/announce\` • \`/poll\` • \`/afk\` • \`/status\``))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**3. Moderation**\n\`/ban\` \`/kick\` \`/timeout\` \`/warn\` \`/clear\` \`/lock\` etc. Prefix \`#\` also works.`))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**4. Tickets / Giveaway**\n\`/ticket setup\` • \`/giveaway create\``))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**5. Leveling**\nChat to earn XP • \`/rank\` \`/level\` \`/leaderboard\``))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**6. Broadcast**\n\`/broadcast\` → pick target (all / online / offline) → write the message in the form → confirm → it DMs everyone selected`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Branding:** TechRoad • Color \`3092790\` • Footer \`${builders.BRAND_FOOTER}\`\n-# Need help? Use \`/help\` or prefix \`#help\``));
    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
