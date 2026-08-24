// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const builders = require('../../utils/builders');
const db = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder().setName('level').setDescription('Check your level or another user')
    .addUserOption(o=> o.setName('user').setDescription('User to check').setRequired(false)),
  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    const user = interaction.options.getUser('user') || interaction.user;
    const key = `level_${interaction.guild.id}_${user.id}`;
    const data = db.get(key) || { xp: 0, level: 0, totalXp: 0 };
    const needed = (data.level + 1) * 300;
    const progress = Math.floor((data.xp / needed) * 20);
    const bar = '█'.repeat(progress) + '░'.repeat(20 - progress);
    const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.level} Level • ${user.tag}`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Level:** \`${data.level}\`\n**XP:** \`${data.xp}/${needed}\` (\`${data.totalXp || 0} total\`)\n**Progress:**\n\`${bar}\` ${Math.floor(data.xp/needed*100)}%`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
