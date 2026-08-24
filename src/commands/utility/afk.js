// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const builders = require('../../utils/builders');
const db = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder().setName('afk').setDescription('Set your AFK status')
    .addStringOption(o=> o.setName('reason').setDescription('Reason for AFK').setRequired(false)),
  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    const reason = interaction.options.getString('reason') || 'No reason';
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    let afkData = db.get(guildId, 'afk') || {};
    afkData[userId] = { reason, since: Date.now() };
    // Try to set nickname prefix [AFK]
    try {
      if (interaction.member.manageable && !interaction.member.nickname?.startsWith('[AFK]')) {
        afkData[`_nick_${userId}`] = interaction.member.nickname || null;
        await interaction.member.setNickname(`[AFK] ${interaction.member.displayName}`.slice(0,32)).catch(()=>{});
      }
    } catch {}
    db.set(guildId, 'afk', afkData);
    const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.info} AFK Set\nYou are now AFK.`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Reason:** ${reason}\nYou will be mentioned when someone pings you.\nSend any message to remove AFK.`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
